create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

create type public.chat_type as enum ('direct', 'group', 'community', 'channel');
create type public.message_status as enum ('sent', 'delivered', 'seen', 'failed');
create type public.participant_role as enum ('owner', 'admin', 'moderator', 'member', 'muted', 'banned');
create type public.call_type as enum ('voice', 'video', 'screen');
create type public.call_status as enum ('ringing', 'active', 'ended', 'missed', 'rejected', 'failed');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  phone text unique,
  username text unique not null,
  avatar_url text,
  bio text default '',
  custom_status text default '',
  privacy text default 'contacts' check (privacy in ('everyone', 'contacts', 'private')),
  settings jsonb not null default '{}'::jsonb,
  is_online boolean not null default false,
  last_seen_at timestamptz,
  is_admin boolean not null default false,
  is_banned boolean not null default false,
  banned_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chats (
  id uuid primary key default gen_random_uuid(),
  type public.chat_type not null default 'direct',
  title text,
  description text,
  image_url text,
  is_public boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chat_participants (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.participant_role not null default 'member',
  muted_until timestamptz,
  archived_at timestamptz,
  joined_at timestamptz not null default now(),
  unique(chat_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  reply_to_id uuid references public.messages(id) on delete set null,
  forwarded_from_id uuid references public.messages(id) on delete set null,
  content text default '',
  status public.message_status not null default 'sent',
  scheduled_for timestamptz,
  delivered_at timestamptz,
  seen_at timestamptz,
  edited_at timestamptz,
  deleted_at timestamptz,
  pinned_at timestamptz,
  pinned_by uuid references public.users(id) on delete set null,
  encrypted_payload jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.message_receipts (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  delivered_at timestamptz default now(),
  seen_at timestamptz,
  primary key(message_id, user_id)
);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique(message_id, user_id, emoji)
);

create table public.media_files (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.chats(id) on delete cascade,
  message_id uuid references public.messages(id) on delete cascade,
  uploader_id uuid not null references public.users(id) on delete cascade,
  bucket text not null,
  storage_path text not null,
  public_url text not null,
  file_name text not null,
  file_size bigint not null,
  mime_type text not null,
  width integer,
  height integer,
  duration_seconds integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null unique references public.chats(id) on delete cascade,
  owner_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  is_public boolean not null default false,
  invite_code text unique not null,
  permissions jsonb not null default '{"can_post":"members","can_invite":"admins"}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  is_public boolean not null default false,
  categories jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.community_groups (
  community_id uuid references public.communities(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  category text,
  primary key(community_id, group_id)
);

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.chats(id) on delete set null,
  caller_id uuid not null references public.users(id) on delete cascade,
  callee_id uuid references public.users(id) on delete cascade,
  type public.call_type not null,
  status public.call_status not null default 'ringing',
  started_at timestamptz not null default now(),
  answered_at timestamptz,
  ended_at timestamptz,
  quality jsonb not null default '{}'::jsonb
);

create table public.call_history (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.chats(id) on delete set null,
  caller_id uuid not null references public.users(id) on delete cascade,
  callee_id uuid not null references public.users(id) on delete cascade,
  type public.call_type not null,
  status text not null,
  duration_seconds integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  chat_id uuid references public.chats(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.blocked_users (
  blocker_id uuid not null references public.users(id) on delete cascade,
  blocked_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_id, blocked_id)
);

create table public.muted_users (
  user_id uuid not null references public.users(id) on delete cascade,
  muted_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, muted_user_id)
);

create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(requester_id, receiver_id)
);

create table public.settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  privacy jsonb not null default '{}'::jsonb,
  notifications jsonb not null default '{}'::jsonb,
  appearance jsonb not null default '{}'::jsonb,
  security jsonb not null default '{}'::jsonb,
  data_storage jsonb not null default '{}'::jsonb,
  language text not null default 'en',
  updated_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.users(id) on delete set null,
  target_user_id uuid references public.users(id) on delete set null,
  target_message_id uuid references public.messages(id) on delete set null,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create index users_username_idx on public.users using gin (username gin_trgm_ops);
create index users_phone_idx on public.users (phone);
create index chat_participants_user_idx on public.chat_participants (user_id, chat_id);
create index messages_chat_created_idx on public.messages (chat_id, created_at desc);
create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index media_chat_idx on public.media_files (chat_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_touch_updated_at before update on public.users
for each row execute function public.touch_updated_at();

create trigger chats_touch_updated_at before update on public.chats
for each row execute function public.touch_updated_at();

create or replace function public.find_direct_chat(first_user uuid, second_user uuid)
returns public.chats
language sql
security definer
stable
as $$
  select c.*
  from public.chats c
  join public.chat_participants p1 on p1.chat_id = c.id and p1.user_id = first_user
  join public.chat_participants p2 on p2.chat_id = c.id and p2.user_id = second_user
  where c.type = 'direct'
  limit 1;
$$;

alter publication supabase_realtime add table public.chats;
alter publication supabase_realtime add table public.chat_participants;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.reactions;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.calls;

alter table public.users enable row level security;
alter table public.chats enable row level security;
alter table public.chat_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_receipts enable row level security;
alter table public.reactions enable row level security;
alter table public.media_files enable row level security;
alter table public.groups enable row level security;
alter table public.communities enable row level security;
alter table public.community_groups enable row level security;
alter table public.calls enable row level security;
alter table public.call_history enable row level security;
alter table public.notifications enable row level security;
alter table public.blocked_users enable row level security;
alter table public.muted_users enable row level security;
alter table public.friend_requests enable row level security;
alter table public.settings enable row level security;
alter table public.reports enable row level security;

create policy "Users can read public profiles" on public.users for select using (deleted_at is null);
create policy "Users update own profile" on public.users for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Participants can read chats" on public.chats for select using (
  exists (select 1 from public.chat_participants cp where cp.chat_id = id and cp.user_id = auth.uid())
  or is_public = true
);

create policy "Participants can read memberships" on public.chat_participants for select using (
  user_id = auth.uid()
  or exists (select 1 from public.chat_participants cp where cp.chat_id = chat_id and cp.user_id = auth.uid())
);

create policy "Participants can read messages" on public.messages for select using (
  exists (select 1 from public.chat_participants cp where cp.chat_id = messages.chat_id and cp.user_id = auth.uid())
);

create policy "Participants can insert messages" on public.messages for insert with check (
  sender_id = auth.uid()
  and exists (select 1 from public.chat_participants cp where cp.chat_id = messages.chat_id and cp.user_id = auth.uid())
);

create policy "Sender can edit own messages" on public.messages for update using (sender_id = auth.uid());

create policy "Participants can read reactions" on public.reactions for select using (
  exists (
    select 1 from public.messages m
    join public.chat_participants cp on cp.chat_id = m.chat_id
    where m.id = message_id and cp.user_id = auth.uid()
  )
);

create policy "Users can react" on public.reactions for insert with check (user_id = auth.uid());

create policy "Participants can read media" on public.media_files for select using (
  chat_id is null or exists (select 1 from public.chat_participants cp where cp.chat_id = media_files.chat_id and cp.user_id = auth.uid())
);

create policy "Users can upload own media rows" on public.media_files for insert with check (uploader_id = auth.uid());
create policy "Users read own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "Users update own notifications" on public.notifications for update using (user_id = auth.uid());
create policy "Users manage own settings" on public.settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage own block list" on public.blocked_users for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
create policy "Users manage own mute list" on public.muted_users for all using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('chat-media', 'chat-media', true, 1073741824, array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/webm', 'audio/wav',
    'application/pdf', 'application/zip', 'text/plain'
  ])
on conflict (id) do nothing;

create policy "Authenticated avatar uploads" on storage.objects for insert with check (
  bucket_id = 'avatars' and auth.role() = 'authenticated'
);

create policy "Public avatar reads" on storage.objects for select using (bucket_id = 'avatars');

create policy "Authenticated chat media uploads" on storage.objects for insert with check (
  bucket_id = 'chat-media' and auth.role() = 'authenticated'
);

create policy "Chat media reads" on storage.objects for select using (bucket_id = 'chat-media');
