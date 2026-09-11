export type MembershipTier = 'guest' | 'member';
export type SystemRole = 'user' | 'admin';

export type AppUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  membershipTier: MembershipTier;
  systemRole: SystemRole;
  status: 'active' | 'suspended';
};
