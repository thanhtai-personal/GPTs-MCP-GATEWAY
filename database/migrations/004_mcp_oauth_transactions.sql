begin;

create table public.mcp_oauth_transactions (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  provider text not null,
  browser_nonce_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index mcp_oauth_transactions_expires_idx
  on public.mcp_oauth_transactions(expires_at);

alter table public.mcp_oauth_transactions enable row level security;
revoke all on table public.mcp_oauth_transactions from anon, authenticated;
grant all on table public.mcp_oauth_transactions to service_role;

commit;
