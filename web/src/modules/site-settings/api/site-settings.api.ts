import { gatewayRequest } from "@/shared/api/gateway-api";

export type LandingVideoConfig = {
  youtubeVideoId: string | null;
};

export function getPublicLandingVideo() {
  return gatewayRequest<LandingVideoConfig>(
    "/site-settings/public/landing-video",
  );
}

export function getAdminLandingVideo(accessToken: string) {
  return gatewayRequest<LandingVideoConfig>(
    "/site-settings/admin/landing-video",
    accessToken,
  );
}

export function updateAdminLandingVideo(
  accessToken: string,
  youtubeInput: string,
) {
  return gatewayRequest<LandingVideoConfig>(
    "/site-settings/admin/landing-video",
    accessToken,
    {
      method: "PUT",
      body: JSON.stringify({ youtubeInput }),
    },
  );
}
