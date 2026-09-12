import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { completeGoogleOAuth } from "@/modules/auth/infrastructure/google-oauth";
import { connectGoogleWorkspace } from "@/modules/mcp-connections/api/mcp-connections.api";
import {
  clearPendingGoogleWorkspaceOAuth,
  readPendingGoogleWorkspaceOAuth,
} from "@/modules/mcp-connections/infrastructure/google-workspace-oauth";
import { GatewayApiError } from "@/shared/api/gateway-api";

type OAuthCallbackError = {
  code: string;
  message: string;
};

export function useGoogleOAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<OAuthCallbackError | null>(null);

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
      .catch((caught: unknown) => {
        if (!active) return;

        if (caught instanceof GatewayApiError) {
          setError({
            code: caught.code,
            message: caught.message,
          });
          return;
        }

        setError({
          code:
            caught instanceof Error
              ? caught.message
              : "GOOGLE_OAUTH_CALLBACK_FAILED",
          message:
            caught instanceof Error
              ? caught.message
              : "Could not complete Google OAuth",
        });
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  return {
    error,
    hasError: Boolean(error),
  };
}
