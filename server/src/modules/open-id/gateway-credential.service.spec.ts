import { GatewayCredentialService } from '@server/root/modules/open-id/gateway-credential.service';

function supabaseReturning(row: unknown) {
  const query: Record<string, jest.Mock> = {};
  for (const method of ['from', 'select', 'eq', 'is', 'gt', 'limit']) {
    query[method] = jest.fn(() => query);
  }
  query.maybeSingle = jest.fn().mockResolvedValue({ data: row, error: null });
  return { createServiceRoleClient: jest.fn(() => query), query };
}

describe('GatewayCredentialService.principalForUser (MCP plugin entitlement)', () => {
  it('allows members without an Open ID or database lookup', async () => {
    const supabase = supabaseReturning(null);
    const service = new GatewayCredentialService({} as never, supabase as never);
    const user = { id: 'u1', membershipTier: 'member' } as never;

    await expect(service.principalForUser(user)).resolves.toEqual({
      credentialId: null,
      openIdId: null,
      openId: null,
      user,
      kind: 'member',
    });
    expect(supabase.createServiceRoleClient).not.toHaveBeenCalled();
  });

  it('allows guests with an active trial', async () => {
    const supabase = supabaseReturning({ id: 'o1', open_id: 'oid_trial', kind: 'trial' });
    const service = new GatewayCredentialService({} as never, supabase as never);
    const user = { id: 'u2', membershipTier: 'guest' } as never;

    await expect(service.principalForUser(user)).resolves.toMatchObject({
      kind: 'trial',
      openIdId: 'o1',
    });
    expect(supabase.query.eq).toHaveBeenCalledWith('kind', 'trial');
  });

  it('asks guests without a trial to upgrade', async () => {
    const supabase = supabaseReturning(null);
    const service = new GatewayCredentialService({} as never, supabase as never);

    await expect(
      service.principalForUser({ id: 'u3', membershipTier: 'guest' } as never),
    ).rejects.toMatchObject({ response: { code: 'MEMBERSHIP_REQUIRED' } });
  });
});
