import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminLandingVideo,
  getPublicLandingVideo,
  updateAdminLandingVideo,
} from "@/modules/site-settings/api/site-settings.api";

export const siteSettingsKeys = {
  publicLandingVideo: ["site-settings", "landing-video", "public"] as const,
  adminLandingVideo: ["site-settings", "landing-video", "admin"] as const,
};

export function usePublicLandingVideo() {
  return useQuery({
    queryKey: siteSettingsKeys.publicLandingVideo,
    queryFn: getPublicLandingVideo,
    staleTime: 60_000,
  });
}

export function useAdminLandingVideo(accessToken: string) {
  return useQuery({
    queryKey: siteSettingsKeys.adminLandingVideo,
    queryFn: () => getAdminLandingVideo(accessToken),
    enabled: Boolean(accessToken),
  });
}

export function useUpdateAdminLandingVideo(accessToken: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (youtubeInput: string) =>
      updateAdminLandingVideo(accessToken, youtubeInput),
    onSuccess: (config) => {
      queryClient.setQueryData(siteSettingsKeys.adminLandingVideo, config);
      queryClient.setQueryData(siteSettingsKeys.publicLandingVideo, config);
    },
  });
}
