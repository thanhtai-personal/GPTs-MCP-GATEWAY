begin;

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.app_users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

revoke all on table public.site_settings from anon, authenticated;
grant all on table public.site_settings to service_role;

commit;
