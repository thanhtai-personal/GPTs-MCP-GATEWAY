import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { McpProviderAccessMode } from "@/modules/mcp-connections/domain/mcp-connection.types";
import {
  listMcpConnections,
  listMcpProviders,
  removeMcpConnection,
  saveMcpConnection,
  startMcpOAuth,
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

export function useStartMcpOAuth(accessToken: string) {
  return useMutation({
    mutationFn: ({
      provider,
      accessMode,
      returnTo,
    }: {
      provider: string;
      accessMode?: McpProviderAccessMode;
      returnTo?: string;
    }) => startMcpOAuth(accessToken, provider, { accessMode, returnTo }),
    onSuccess: ({ authorizationUrl }) => {
      window.location.assign(authorizationUrl);
    },
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
