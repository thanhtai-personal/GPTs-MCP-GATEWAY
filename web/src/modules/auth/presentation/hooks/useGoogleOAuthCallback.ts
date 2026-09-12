import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { completeGoogleOAuth } from "@/modules/auth/infrastructure/google-oauth";
import { connectGoogleWorkspace } from "@/modules/mcp-connections/api/mcp-connections.api";
import {
  clearPendingGoogleWorkspaceOAuth,
  readPendingGoogleWorkspaceOAuth,
} from "@/modules/mcp-connections/infrastructure/google-workspace-oauth";

export function useGoogleOAuthCallback() {
  const navigate = useNavigate();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    void completeGoogleOAuth()
      .then(async (session) => {
        const pending = readPendingGoogleWorkspaceOAuth();
        if (!pending) {
          await navigate({ to: "/app", replace: true });
          return;
        }

        const providerToken = session.provider_token;
        const providerRefreshToken = session.provider_refresh_token;
        if (!providerToken || !providerRefreshToken) {
          throw new Error("GOOGLE_WORKSPACE_PROVIDER_TOKEN_MISSING");
        }

        await connectGoogleWorkspace(
          session.access_token,
          providerToken,
          providerRefreshToken,
        );

        clearPendingGoogleWorkspaceOAuth();
        window.location.replace(`/app${pending.returnTo}`);
      })
      .catch(() => {
        if (active) setHasError(true);
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  return { hasError };
}
