-- Contact form storage. Run once in the Supabase SQL editor.
--
-- The website talks to this table with the public anon key, so every rule that
-- matters is enforced here rather than in the form. The form's maxlength
-- attributes are a convenience; these constraints are the boundary.

create table if not exists public.leads (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name       text not null check (char_length(name) between 1 and 100),
  email      text not null check (char_length(email) between 3 and 150),
  phone      text          check (char_length(phone) <= 30),
  message    text not null check (char_length(message) between 1 and 2000)
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);

alter table public.leads enable row level security;

-- Insert only. Deliberately no select policy: without one, an anon caller
-- holding the published key can submit the form but cannot read anybody else's
-- submission back. Adding a select policy here would leak every lead.
create policy "anon can submit a lead"
  on public.leads
  for insert
  to anon
  with check (true);
