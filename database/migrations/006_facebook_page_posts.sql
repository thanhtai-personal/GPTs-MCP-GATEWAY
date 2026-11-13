begin;
create table public.facebook_page_posts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.app_users(id) on delete cascade,
 page_id text not null, media_type text not null check(media_type in ('text','image','video')),
 message text not null check(length(btrim(message)) between 1 and 5000), media_url text,
 status text not null default 'draft' check(status in ('draft','scheduled','publishing','published','failed','needs_review')),
 scheduled_at timestamptz, approved_at timestamptz, external_post_id text, last_error_code text,
 lease_expires_at timestamptz, attempt_count integer not null default 0 check(attempt_count>=0),
 published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check((media_type='text' and media_url is null) or (media_type in ('image','video') and media_url is not null)),
 check((status='draft' and approved_at is null and scheduled_at is null) or status<>'draft')
);
create index facebook_page_posts_due_idx on public.facebook_page_posts(status,scheduled_at) where status='scheduled';
create index facebook_page_posts_user_created_idx on public.facebook_page_posts(user_id,created_at desc);
alter table public.facebook_page_posts enable row level security;
revoke all on table public.facebook_page_posts from anon,authenticated;
grant all on table public.facebook_page_posts to service_role;
create or replace function public.claim_due_facebook_page_posts(p_limit integer default 5)
returns setof public.facebook_page_posts language sql security definer set search_path=public as $$
 with due as (
  select id from public.facebook_page_posts where status='scheduled' and approved_at is not null and scheduled_at<=now()
  order by scheduled_at asc,created_at asc for update skip locked limit greatest(1,least(coalesce(p_limit,5),20))
 )
 update public.facebook_page_posts p set status='publishing',lease_expires_at=now()+interval '5 minutes',
 attempt_count=attempt_count+1,updated_at=now() from due where p.id=due.id returning p.*;
$$;
create or replace function public.recover_stale_facebook_page_posts()
returns integer language plpgsql security definer set search_path=public as $$
declare recovered integer;
begin
 update public.facebook_page_posts set status='needs_review',last_error_code='PUBLISH_OUTCOME_UNKNOWN',
 lease_expires_at=null,updated_at=now() where status='publishing' and lease_expires_at<now();
 get diagnostics recovered=row_count; return recovered;
end;
$$;
revoke all on function public.claim_due_facebook_page_posts(integer) from public,anon,authenticated;
revoke all on function public.recover_stale_facebook_page_posts() from public,anon,authenticated;
grant execute on function public.claim_due_facebook_page_posts(integer) to service_role;
grant execute on function public.recover_stale_facebook_page_posts() to service_role;
commit;
