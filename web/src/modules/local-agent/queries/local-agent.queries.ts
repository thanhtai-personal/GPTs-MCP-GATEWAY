import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listLocalAgents, revokeLocalAgent } from "@/modules/local-agent/api/local-agent.api";

export const localAgentKeys = {
  all: ["local-agents"] as const,
};

export function useLocalAgents(accessToken: string) {
  return useQuery({
    queryKey: localAgentKeys.all,
    queryFn: () => listLocalAgents(accessToken),
    enabled: Boolean(accessToken),
    refetchInterval: 15_000,
  });
}

export function useRevokeLocalAgent(accessToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => revokeLocalAgent(accessToken, agentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: localAgentKeys.all }),
  });
}
