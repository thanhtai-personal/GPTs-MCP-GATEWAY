export type TrialStatus = {
  status: "available" | "active" | "consumed" | "not_applicable";
  claimedAt: string | null;
  expiresAt: string | null;
};

export type OpenId = {
  id: string;
  user_id: string;
  open_id: string;
  kind: "paid";
  is_exportable: true;
  status: "active" | "revoked";
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export type OneTimeToken = {
  accessToken: string;
  tokenPrefix: string;
  expiresAt?: string | null;
  notice: string;
};
