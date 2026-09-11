import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listMcpConnections,
  listMcpProviders,
  removeMcpConnection,
  saveMcpConnection,
  testMcpConnection,
} from "@/modules/mcp-connections/api/mcp-connections.api";

export const mcpConnectionKeys = {
  all: ["mcp-connections"] as const,
  providers: ["mcp-providers"] as const,
};

export function useMcpProviders(accessToken: string) {
  return useQuery({
    queryKey: mcpConnectionKeys.providers,
    queryFn: () => listMcpProviders(accessToken),
    enabled: Boolean(accessToken),
  });
}

export function useMcpConnections(accessToken: string) {
  return useQuery({
    queryKey: mcpConnectionKeys.all,
    queryFn: () => listMcpConnections(accessToken),
    enabled: Boolean(accessToken),
  });
}

export function useSaveMcpConnection(accessToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      provider,
      apiKey,
    }: {
      provider: string;
      apiKey: string;
    }) => saveMcpConnection(accessToken, provider, apiKey),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: mcpConnectionKeys.all }),
  });
}

export function useTestMcpConnection(accessToken: string) {
  return useMutation({
    mutationFn: ({
      provider,
      apiKey,
    }: {
      provider: string;
      apiKey: string;
    }) => testMcpConnection(accessToken, provider, apiKey),
  });
}

export function useRemoveMcpConnection(accessToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (provider: string) =>
      removeMcpConnection(accessToken, provider),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: mcpConnectionKeys.all }),
  });
}
