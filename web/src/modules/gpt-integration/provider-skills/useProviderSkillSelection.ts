import { useEffect, useMemo, useState } from "react";
import { useMcpConnections } from "@/modules/mcp-connections/queries/mcp-connections.queries";
import {
  PROVIDER_SKILL_IDS,
  type ProviderSkillId,
} from "@/modules/gpt-integration/provider-skills/provider-skill.types";

const STORAGE_KEY = "mcp-gateway.gpt-provider-skills";

function isProviderSkillId(value: string): value is ProviderSkillId {
  return PROVIDER_SKILL_IDS.includes(value as ProviderSkillId);
}

function connectedProviderIds(providerIds: string[]) {
  const connected = new Set(providerIds);
  if (connected.has("google-workspace")) {
    connected.add("google-docs");
    connected.add("google-sheets");
  }
  return connected;
}

export function useProviderSkillSelection(accessToken: string) {
  const connections = useMcpConnections(accessToken);
  const [enabled, setEnabled] = useState<ProviderSkillId[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized || typeof window === "undefined") return;

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed)) {
          setEnabled(
            parsed.filter(
              (value): value is ProviderSkillId =>
                typeof value === "string" && isProviderSkillId(value),
            ),
          );
          setInitialized(true);
          return;
        }
      } catch {
        // Fall through to connected-provider defaults.
      }
    }

    if (!connections.isPending) {
      const connected = connectedProviderIds(
        (connections.data ?? []).map((connection) => connection.provider),
      );
      setEnabled(PROVIDER_SKILL_IDS.filter((id) => connected.has(id)));
      setInitialized(true);
    }
  }, [connections.data, connections.isPending, initialized]);

  useEffect(() => {
    if (!initialized || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
  }, [enabled, initialized]);

  const connectedIds = useMemo(
    () =>
      connectedProviderIds(
        (connections.data ?? []).map((connection) => connection.provider),
      ),
    [connections.data],
  );

  const toggle = (id: ProviderSkillId) => {
    setEnabled((current) =>
      current.includes(id)
        ? current.filter((candidate) => candidate !== id)
        : [...current, id],
    );
  };

  return {
    connectedIds,
    enabled,
    initialized,
    toggle,
  };
}
