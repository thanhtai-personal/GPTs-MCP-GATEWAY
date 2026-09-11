begin;

create table public.gpt_response_transfers (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  credential_id uuid not null references public.gateway_credentials(id) on delete cascade,
  total_chunks integer not null check (total_chunks > 0),
  total_chars integer not null check (total_chars > 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index gpt_response_transfers_owner_idx
  on public.gpt_response_transfers(user_id, credential_id, created_at desc);

create index gpt_response_transfers_expires_idx
  on public.gpt_response_transfers(expires_at);

create table public.gpt_response_chunks (
  transfer_id uuid not null
    references public.gpt_response_transfers(id)
    on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  content_ciphertext text not null,
  content_chars integer not null check (content_chars > 0),
  created_at timestamptz not null default now(),
  primary key (transfer_id, chunk_index)
);

alter table public.gpt_response_transfers enable row level security;
alter table public.gpt_response_chunks enable row level security;

revoke all on table public.gpt_response_transfers from anon, authenticated;
revoke all on table public.gpt_response_chunks from anon, authenticated;

grant all on table public.gpt_response_transfers to service_role;
grant all on table public.gpt_response_chunks to service_role;

commit;
