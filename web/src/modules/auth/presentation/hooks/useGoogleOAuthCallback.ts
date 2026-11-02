import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { completeGoogleOAuth, takeSignInReturnTo } from "@/modules/auth/infrastructure/google-oauth";
import { CALLBACK_CHUNK_RETRY_KEY } from "@/shared/components/callback-chunk-recovery";

type OAuthCallbackError = {
  code: string;
  message: string;
};

export function useGoogleOAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<OAuthCallbackError | null>(null);

  useEffect(() => {
    let active = true;

    try {
      sessionStorage.removeItem(CALLBACK_CHUNK_RETRY_KEY);
    } catch {
      // The callback can still complete when storage access is unavailable.
    }

    void completeGoogleOAuth()
      .then(() => {
        const returnTo = takeSignInReturnTo();
        if (returnTo) {
          window.location.replace(returnTo);
          return;
        }
        return navigate({ to: "/app", replace: true });
      })
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
