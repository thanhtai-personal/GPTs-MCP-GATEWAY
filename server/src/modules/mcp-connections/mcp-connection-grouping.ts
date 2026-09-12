export type ProviderConnectionRow = {
  provider: string;
};

export function groupProviderConnectionRows<T extends ProviderConnectionRow>(
  rows: T[],
  ownerIdFor: (providerId: string) => string,
): T[] {
  const grouped = new Map<string, T>();

  for (const row of rows) {
    const ownerId = ownerIdFor(row.provider);
    const current = grouped.get(ownerId);
    const normalized = { ...row, provider: ownerId };

    if (!current || row.provider === ownerId) {
      grouped.set(ownerId, normalized);
    }
  }

  return [...grouped.values()];
}
