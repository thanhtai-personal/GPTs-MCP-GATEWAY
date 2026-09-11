import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listMcpConnections,
  removeStitch,
  saveStitch,
  testStitch,
} from "@/modules/mcp-connections/api/mcp-connections.api";

export const mcpConnectionKeys = {
  all: ["mcp-connections"] as const,
};

export function useMcpConnections(accessToken: string) {
  return useQuery({
    queryKey: mcpConnectionKeys.all,
    queryFn: () => listMcpConnections(accessToken),
    enabled: Boolean(accessToken),
  });
}

export function useSaveStitch(accessToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (apiKey: string) => saveStitch(accessToken, apiKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mcpConnectionKeys.all }),
  });
}

export function useTestStitch(accessToken: string) {
  return useMutation({
    mutationFn: (apiKey: string) => testStitch(accessToken, apiKey),
  });
}

export function useRemoveStitch(accessToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => removeStitch(accessToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mcpConnectionKeys.all }),
  });
}
