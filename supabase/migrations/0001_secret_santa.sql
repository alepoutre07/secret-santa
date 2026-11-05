create extension if not exists pgcrypto;

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 60),
  created_at timestamptz not null default now()
);

create table if not exists public.assignments (
  giver_id uuid primary key references public.participants(id) on delete restrict,
  recipient_id uuid not null unique references public.participants(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (giver_id <> recipient_id)
);

alter table public.participants enable row level security;
alter table public.assignments enable row level security;
revoke all on public.assignments from anon, authenticated;
revoke insert, update, delete on public.participants from anon, authenticated;
grant select on public.participants to anon, authenticated;

 drop policy if exists "Public can view participant names" on public.participants;
create policy "Public can view participant names" on public.participants
  for select to anon, authenticated using (true);

create or replace function public.draw_once()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  giver_ids uuid[];
  recipient_ids uuid[];
  participant_count integer;
  attempt_count integer := 0;
begin
  perform pg_advisory_xact_lock(735104, 1);
  if exists (select 1 from public.assignments) then
    return;
  end if;
  select count(*) into participant_count from public.participants;
  if participant_count < 2 then
    raise exception 'At least two participants are required';
  end if;
  select array_agg(id order by id) into giver_ids from public.participants;
  loop
    attempt_count := attempt_count + 1;
    if attempt_count > 10000 then
      raise exception 'Could not produce a valid draw';
    end if;
    select array_agg(id order by gen_random_uuid()) into recipient_ids from public.participants;
    exit when not exists (
      select 1
      from unnest(giver_ids) with ordinality as g(id, position)
      join unnest(recipient_ids) with ordinality as r(id, position) using (position)
      where g.id = r.id
    );
  end loop;
  insert into public.assignments (giver_id, recipient_id)
  select g.id, r.id
  from unnest(giver_ids) with ordinality as g(id, position)
  join unnest(recipient_ids) with ordinality as r(id, position) using (position);
end;
$$;

revoke all on function public.draw_once() from public, anon, authenticated;
grant execute on function public.draw_once() to service_role;
