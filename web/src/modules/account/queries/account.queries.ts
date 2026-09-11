import { useQuery } from "@tanstack/react-query";
import { getAccount } from "@/modules/account/api/account.api";

export const accountKeys = {
  all: ["account"] as const,
};

export function useAccount(accessToken: string) {
  return useQuery({
    queryKey: accountKeys.all,
    queryFn: () => getAccount(accessToken),
    enabled: Boolean(accessToken),
  });
}
