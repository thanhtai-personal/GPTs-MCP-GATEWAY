begin;

create table public.local_agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  name text not null,
  token_hash text not null unique,
  status text not null default 'online'
    check (status in ('online', 'offline', 'revoked')),
  tools jsonb not null default '[]'::jsonb,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index local_agents_user_seen_idx
  on public.local_agents(user_id, last_seen_at desc);

create table public.local_agent_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  agent_id uuid not null references public.local_agents(id) on delete cascade,
  tool_name text not null,
  arguments jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'claimed', 'completed', 'failed', 'expired')),
  result jsonb,
  error_message text,
  expires_at timestamptz not null,
  claimed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index local_agent_jobs_agent_pending_idx
  on public.local_agent_jobs(agent_id, status, created_at);
create index local_agent_jobs_user_created_idx
  on public.local_agent_jobs(user_id, created_at desc);

create or replace function public.claim_local_agent_job(p_agent_id uuid)
returns table (
  id uuid,
  tool_name text,
  arguments jsonb,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_id uuid;
begin
  update public.local_agent_jobs
  set status = 'expired'
  where agent_id = p_agent_id
    and status in ('pending', 'claimed')
    and expires_at <= now();

  select j.id
  into v_job_id
  from public.local_agent_jobs j
  where j.agent_id = p_agent_id
    and j.status = 'pending'
    and j.expires_at > now()
  order by j.created_at
  for update skip locked
  limit 1;

  if v_job_id is null then
    return;
  end if;

  return query
  update public.local_agent_jobs j
  set status = 'claimed', claimed_at = now()
  where j.id = v_job_id
  returning j.id, j.tool_name, j.arguments, j.expires_at;
end;
$$;

alter table public.local_agents enable row level security;
alter table public.local_agent_jobs enable row level security;

revoke all on table public.local_agents from anon, authenticated;
revoke all on table public.local_agent_jobs from anon, authenticated;
revoke execute on function public.claim_local_agent_job(uuid)
  from public, anon, authenticated;

grant all on table public.local_agents to service_role;
grant all on table public.local_agent_jobs to service_role;
grant execute on function public.claim_local_agent_job(uuid) to service_role;

commit;
