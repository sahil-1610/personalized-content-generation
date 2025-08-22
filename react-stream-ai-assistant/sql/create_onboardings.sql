-- create onboardings table
create table if not exists public.onboardings (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  full_name text,
  title text,
  bio text,
  interests text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists onboardings_user_id_idx on public.onboardings (user_id);

-- optional: update updated_at on row changes
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_set_updated_at
before update on public.onboardings
for each row
execute function public.set_updated_at();
