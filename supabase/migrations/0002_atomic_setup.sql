-- Serialize participant changes with the draw transaction. This closes the race
-- where setup could otherwise replace the list between the draw check and insert.
create or replace function public.setup_participants(p_names text[])
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  participant_count integer;
begin
  perform pg_advisory_xact_lock(735104, 1);

  participant_count := coalesce(cardinality(p_names), 0);
  if participant_count < 2 or participant_count > 100
     or exists (
       select 1 from unnest(p_names) as n(name)
       where name is null or length(trim(name)) < 1 or length(trim(name)) > 60
     )
     or (select count(distinct lower(trim(name))) from unnest(p_names) as n(name)) <> participant_count then
    raise exception 'INVALID_PARTICIPANTS';
  end if;

  if exists (select 1 from public.assignments) then
    raise exception 'DRAW_ALREADY_DONE';
  end if;

  delete from public.participants;
  insert into public.participants (name)
  select trim(name) from unnest(p_names) as n(name);
end;
$$;

revoke all on function public.setup_participants(text[]) from public, anon, authenticated;
grant execute on function public.setup_participants(text[]) to service_role;
