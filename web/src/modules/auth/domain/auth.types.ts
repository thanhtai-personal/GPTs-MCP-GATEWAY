export type AccountProfile = {
  id: string;
  email: string | null;
  displayName: string | null;
  membershipTier: "guest" | "member";
  systemRole: "user" | "admin";
  status: "active" | "suspended";
};
