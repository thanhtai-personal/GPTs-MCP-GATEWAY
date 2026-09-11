import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  claimTrial,
  createGatewayToken,
  createOpenId,
  getTrialStatus,
  listOpenIds,
} from "@/modules/open-id/api/open-id.api";

export const openIdKeys = {
  all: ["open-ids"] as const,
  trial: ["open-ids", "trial"] as const,
};

export function useTrialStatus(accessToken: string) {
  return useQuery({
    queryKey: openIdKeys.trial,
    queryFn: () => getTrialStatus(accessToken),
    enabled: Boolean(accessToken),
  });
}

export function useOpenIds(accessToken: string) {
  return useQuery({
    queryKey: openIdKeys.all,
    queryFn: () => listOpenIds(accessToken),
    enabled: Boolean(accessToken),
  });
}

export function useClaimTrial(accessToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => claimTrial(accessToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: openIdKeys.trial }),
  });
}

export function useCreateOpenId(accessToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => createOpenId(accessToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: openIdKeys.all }),
  });
}

export function useCreateGatewayToken(accessToken: string) {
  return useMutation({
    mutationFn: (openIdId: string) => createGatewayToken(accessToken, openIdId),
  });
}
