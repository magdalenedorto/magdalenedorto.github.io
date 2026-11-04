-- Run this once in the Supabase SQL Editor for the portfolio_reviews table.
-- Also create an Auth user for the site owner, then add that user's UUID to review_admins.
-- Existing rows are treated as private unless their old privacy value explicitly said public.

begin;

alter table public.portfolio_reviews
    add column if not exists privacy text;

alter table public.portfolio_reviews
    add column if not exists moderation_status text;

update public.portfolio_reviews
set privacy = case
    when lower(trim(coalesce(privacy, ''))) like 'public%' then 'public'
    else 'private'
end;

alter table public.portfolio_reviews
    alter column privacy set default 'private',
    alter column privacy set not null;

update public.portfolio_reviews
set moderation_status = case
    when privacy = 'public' then 'published'
    else 'pending'
end
where moderation_status is null;

alter table public.portfolio_reviews
    alter column moderation_status set default 'pending',
    alter column moderation_status set not null;

alter table public.portfolio_reviews
    drop constraint if exists portfolio_reviews_privacy_check;

alter table public.portfolio_reviews
    add constraint portfolio_reviews_privacy_check
    check (privacy in ('private', 'public'));

alter table public.portfolio_reviews
    drop constraint if exists portfolio_reviews_moderation_status_check;

alter table public.portfolio_reviews
    add constraint portfolio_reviews_moderation_status_check
    check (moderation_status in ('pending', 'published', 'rejected'));

create table if not exists public.review_admins (
    user_id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);

alter table public.review_admins enable row level security;
grant select on table public.review_admins to authenticated;
grant update on table public.portfolio_reviews to authenticated;

drop policy if exists review_admins_select_self on public.review_admins;
create policy review_admins_select_self
on public.review_admins
for select
to authenticated
using (user_id = auth.uid());

alter table public.portfolio_reviews enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert on table public.portfolio_reviews to anon, authenticated;

drop policy if exists portfolio_reviews_select_public on public.portfolio_reviews;
create policy portfolio_reviews_select_public
on public.portfolio_reviews
for select
to anon, authenticated
using (privacy = 'public' and moderation_status = 'published');

drop policy if exists portfolio_reviews_select_admin on public.portfolio_reviews;
create policy portfolio_reviews_select_admin
on public.portfolio_reviews
for select
to authenticated
using (
    exists (
        select 1 from public.review_admins
        where review_admins.user_id = auth.uid()
    )
);

drop policy if exists portfolio_reviews_insert_public on public.portfolio_reviews;
create policy portfolio_reviews_insert_public
on public.portfolio_reviews
for insert
to anon, authenticated
with check (
    privacy = 'public'
    and moderation_status = 'pending'
    and star_rating between 1 and 5
    and char_length(btrim(public_comment)) between 3 and 3000
);

drop policy if exists portfolio_reviews_moderate on public.portfolio_reviews;
create policy portfolio_reviews_moderate
on public.portfolio_reviews
for update
to authenticated
using (
    exists (
        select 1 from public.review_admins
        where review_admins.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1 from public.review_admins
        where review_admins.user_id = auth.uid()
    )
    and privacy = 'public'
    and moderation_status in ('published', 'rejected')
);

do $$
declare
    sequence_name text;
begin
    sequence_name := pg_get_serial_sequence('public.portfolio_reviews', 'id');
    if sequence_name is not null then
        execute format('grant usage, select on sequence %s to anon, authenticated', sequence_name);
    end if;
end
$$;

commit;
