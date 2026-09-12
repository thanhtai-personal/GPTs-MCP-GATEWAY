import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { completeGoogleOAuth } from "@/modules/auth/infrastructure/google-oauth";

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
      .then(() => navigate({ to: "/app", replace: true }))
      .catch((caught: unknown) => {
        if (!active) return;
        setError({
          code:
            caught instanceof Error
              ? caught.message
              : "GOOGLE_OAUTH_CALLBACK_FAILED",
          message:
            caught instanceof Error
              ? caught.message
              : "Could not complete Google sign-in",
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
