-- Run this once in the Supabase SQL Editor for the portfolio_reviews table.
-- Existing rows are treated as private unless their old privacy value explicitly said public.

begin;

alter table public.portfolio_reviews
    add column if not exists privacy text;

update public.portfolio_reviews
set privacy = case
    when lower(trim(coalesce(privacy, ''))) like 'public%' then 'public'
    else 'private'
end;

alter table public.portfolio_reviews
    alter column privacy set default 'private',
    alter column privacy set not null;

alter table public.portfolio_reviews
    drop constraint if exists portfolio_reviews_privacy_check;

alter table public.portfolio_reviews
    add constraint portfolio_reviews_privacy_check
    check (privacy in ('private', 'public'));

alter table public.portfolio_reviews enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert on table public.portfolio_reviews to anon, authenticated;

drop policy if exists portfolio_reviews_select_public on public.portfolio_reviews;
create policy portfolio_reviews_select_public
on public.portfolio_reviews
for select
to anon, authenticated
using (privacy = 'public');

drop policy if exists portfolio_reviews_insert_public on public.portfolio_reviews;
create policy portfolio_reviews_insert_public
on public.portfolio_reviews
for insert
to anon, authenticated
with check (
    privacy = 'public'
    and star_rating between 1 and 5
    and char_length(btrim(public_comment)) between 3 and 3000
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
