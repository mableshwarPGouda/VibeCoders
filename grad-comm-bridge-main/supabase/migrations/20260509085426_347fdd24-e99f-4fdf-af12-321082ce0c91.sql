create type public.user_role as enum ('student', 'alumnus');
create type public.query_status as enum ('pending', 'answered');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  name text not null,
  email text,
  usn text unique,
  date_of_birth date,
  is_current_student boolean default true,
  graduation_year int,
  domain text,
  bio text default '',
  experience text default '',
  projects text default '',
  linkedin_url text default '',
  github_url text default '',
  avatar_url text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles(role);
create index profiles_domain_idx on public.profiles(domain);
alter table public.profiles enable row level security;
create policy "profiles viewable by authenticated" on public.profiles for select to authenticated using (true);
create policy "users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid() = id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);
alter table public.notifications enable row level security;
create policy "users view own notifications" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "users update own notifications" on public.notifications for update to authenticated using (auth.uid() = user_id);
create policy "authenticated insert notifications" on public.notifications for insert to authenticated with check (true);

create table public.queries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  topic text default '',
  domain text default '',
  status public.query_status not null default 'pending',
  assigned_alumni_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
create index queries_student_idx on public.queries(student_id);
create index queries_assigned_idx on public.queries using gin(assigned_alumni_ids);
alter table public.queries enable row level security;
create policy "queries viewable by authenticated" on public.queries for select to authenticated using (true);
create policy "students create own queries" on public.queries for insert to authenticated with check (auth.uid() = student_id);
create policy "students update own queries" on public.queries for update to authenticated using (auth.uid() = student_id);

create table public.query_responses (
  id uuid primary key default gen_random_uuid(),
  query_id uuid not null references public.queries(id) on delete cascade,
  alumnus_id uuid not null references public.profiles(id) on delete cascade,
  response_text text not null,
  created_at timestamptz not null default now()
);
create index responses_query_idx on public.query_responses(query_id);
create index responses_alumnus_idx on public.query_responses(alumnus_id);
alter table public.query_responses enable row level security;
create policy "responses viewable by authenticated" on public.query_responses for select to authenticated using (true);
create policy "alumni create own responses" on public.query_responses for insert to authenticated with check (auth.uid() = alumnus_id);

create or replace function public.mark_query_answered()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.queries set status = 'answered' where id = new.query_id;
  insert into public.notifications (user_id, message)
  select student_id, 'You got a reply on: ' || title from public.queries where id = new.query_id;
  return new;
end; $$;
create trigger trg_mark_answered after insert on public.query_responses
  for each row execute function public.mark_query_answered();

create table public.chats (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  alumnus_id uuid not null references public.profiles(id) on delete cascade,
  last_message text default '',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (student_id, alumnus_id)
);
create index chats_student_idx on public.chats(student_id);
create index chats_alumnus_idx on public.chats(alumnus_id);
alter table public.chats enable row level security;
create policy "participants view chat" on public.chats for select to authenticated using (auth.uid() = student_id or auth.uid() = alumnus_id);
create policy "participants create chat" on public.chats for insert to authenticated with check (auth.uid() = student_id or auth.uid() = alumnus_id);
create policy "participants update chat" on public.chats for update to authenticated using (auth.uid() = student_id or auth.uid() = alumnus_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create index messages_chat_idx on public.messages(chat_id, created_at);
alter table public.messages enable row level security;
create policy "participants view messages" on public.messages for select to authenticated using (
  exists (select 1 from public.chats c where c.id = chat_id and (c.student_id = auth.uid() or c.alumnus_id = auth.uid()))
);
create policy "participants send messages" on public.messages for insert to authenticated with check (
  auth.uid() = sender_id and
  exists (select 1 from public.chats c where c.id = chat_id and (c.student_id = auth.uid() or c.alumnus_id = auth.uid()))
);

create or replace function public.update_chat_last_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.chats set last_message = new.content, last_message_at = new.created_at where id = new.chat_id;
  return new;
end; $$;
create trigger trg_update_last_message after insert on public.messages
  for each row execute function public.update_chat_last_message();

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.chats;
alter publication supabase_realtime add table public.notifications;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();