import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { completeGoogleOAuth } from "@/modules/auth/infrastructure/google-oauth";

export function useGoogleOAuthCallback() {
  const navigate = useNavigate();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    void completeGoogleOAuth()
      .then(() => navigate({ to: "/app", replace: true }))
      .catch(() => {
        if (active) setHasError(true);
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  return { hasError };
}
