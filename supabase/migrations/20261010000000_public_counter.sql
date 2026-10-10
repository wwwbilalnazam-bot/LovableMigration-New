-- Public, read-only counter for the homepage ("migrations completed"). Returns only a number.
create or replace function public.migration_count()
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select count(*) from public.migrations_stats where success;
$$;

revoke all on function public.migration_count() from public;
grant execute on function public.migration_count() to anon, authenticated;
