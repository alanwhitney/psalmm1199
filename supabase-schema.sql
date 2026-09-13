-- psalm1199 database schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- Bookmarks
-- ─────────────────────────────────────────────
create table if not exists bookmarks (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  book_id     text not null,          -- e.g. "PSA"
  book_name   text not null,          -- e.g. "Psalms"
  chapter     integer not null,
  verse       integer,                -- optional verse-level bookmark
  translation text not null default 'KJV',
  label       text,                   -- user-supplied name, e.g. "Morning reading"
  created_at  timestamptz default now() not null,
  sorted_at   timestamptz default now() not null  -- bumped on user edits, but NOT on chapter advance
);

-- Row Level Security
alter table bookmarks enable row level security;

create policy "Users can view their own bookmarks"
  on bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own bookmarks"
  on bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own bookmarks"
  on bookmarks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own bookmarks"
  on bookmarks for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Notes
-- ─────────────────────────────────────────────
create table if not exists notes (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  book_id     text not null,
  book_name   text not null,
  chapter     integer not null,
  verse       integer not null,
  content     text not null default '',
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null,

  -- One note per user per book/chapter/verse (translation-agnostic)
  unique(user_id, book_id, chapter, verse)
);

-- Row Level Security
alter table notes enable row level security;

create policy "Users can view their own notes"
  on notes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own notes"
  on notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own notes"
  on notes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notes"
  on notes for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at on notes
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger notes_updated_at
  before update on notes
  for each row
  execute function update_updated_at_column();

-- ─────────────────────────────────────────────
-- Highlights
-- ─────────────────────────────────────────────
create table if not exists highlights (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  book_id     text not null,
  chapter     integer not null,
  verse       integer not null,
  translation text not null default 'KJV',
  color       text not null default 'yellow',
  created_at  timestamptz default now() not null,

  unique(user_id, book_id, chapter, verse, translation)
);

alter table highlights enable row level security;

create policy "Users can view their own highlights"
  on highlights for select
  using (auth.uid() = user_id);

create policy "Users can insert their own highlights"
  on highlights for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own highlights"
  on highlights for update
  using (auth.uid() = user_id);

create policy "Users can delete their own highlights"
  on highlights for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Prayer Journal
-- ─────────────────────────────────────────────
create table if not exists prayers (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  title       text,
  content     text not null,
  answered    boolean default false not null,
  answered_at timestamptz,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

alter table prayers enable row level security;

create policy "Users can view their own prayers"
  on prayers for select
  using (auth.uid() = user_id);

create policy "Users can insert their own prayers"
  on prayers for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own prayers"
  on prayers for update
  using (auth.uid() = user_id);

create policy "Users can delete their own prayers"
  on prayers for delete
  using (auth.uid() = user_id);

create trigger prayers_updated_at
  before update on prayers
  for each row
  execute function update_updated_at_column();

-- ─────────────────────────────────────────────
-- Reading Plans
-- ─────────────────────────────────────────────
create table if not exists user_reading_plans (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  plan_id     text not null,          -- static plan id, see lib/reading-plans.ts
  started_at  timestamptz default now() not null,
  translation text not null default 'KJV',
  active      boolean not null default false,

  unique(user_id, plan_id)
);

alter table user_reading_plans enable row level security;

create policy "Users can view their own reading plans"
  on user_reading_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert their own reading plans"
  on user_reading_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reading plans"
  on user_reading_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete their own reading plans"
  on user_reading_plans for delete
  using (auth.uid() = user_id);

create table if not exists plan_completions (
  user_id      uuid references auth.users(id) on delete cascade not null,
  plan_id      text not null,
  day          integer not null,
  completed_at timestamptz default now() not null,

  primary key (user_id, plan_id, day)
);

alter table plan_completions enable row level security;

create policy "Users can view their own plan completions"
  on plan_completions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own plan completions"
  on plan_completions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own plan completions"
  on plan_completions for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Study Groups
-- ─────────────────────────────────────────────
create table if not exists study_groups (
  id          uuid default uuid_generate_v4() primary key,
  owner_id    uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  book_id     text not null,
  book_name   text not null,
  chapter     integer not null,
  translation text not null default 'KJV',
  invite_code text not null unique,
  created_at  timestamptz default now() not null
);

alter table study_groups enable row level security;

create table if not exists study_group_members (
  id        uuid default uuid_generate_v4() primary key,
  group_id  uuid references study_groups(id) on delete cascade not null,
  user_id   uuid references auth.users(id) on delete cascade not null,
  joined_at timestamptz default now() not null,

  unique(group_id, user_id)
);

alter table study_group_members enable row level security;

-- SECURITY DEFINER helper: a plain "exists (select ... from study_group_members
-- where user_id = auth.uid())" policy on study_group_members would reference its
-- own table and trip Postgres's "infinite recursion detected in policy" check.
-- Routing the membership check through a definer function sidesteps that.
create or replace function is_study_group_member(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from study_group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

create policy "Members and owners can view their study groups"
  on study_groups for select
  using (
    auth.uid() = owner_id
    or is_study_group_member(id)
  );

create policy "Users can create study groups they own"
  on study_groups for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their study groups"
  on study_groups for update
  using (auth.uid() = owner_id);

create policy "Owners can delete their study groups"
  on study_groups for delete
  using (auth.uid() = owner_id);

create policy "Members can view fellow members of their groups"
  on study_group_members for select
  using (
    is_study_group_member(group_id)
    or exists (select 1 from study_groups g where g.id = study_group_members.group_id and g.owner_id = auth.uid())
  );

create policy "Users can add themselves as a member"
  on study_group_members for insert
  with check (auth.uid() = user_id);

create policy "Users can remove themselves from a group"
  on study_group_members for delete
  using (auth.uid() = user_id);

-- Look up a group by invite code and join it. SECURITY DEFINER because the
-- joiner isn't a member yet, so the select policy above wouldn't otherwise let
-- them see the group row to join it. Exception message substrings ("invalid
-- invite", "owner", "not authenticated") are matched by friendlyJoinError() in
-- app/bookmarks/StudyTab.tsx — keep them in sync if you edit this.
create or replace function join_study_group_by_code(p_code text)
returns study_groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group   study_groups;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select * into v_group from study_groups where invite_code = upper(p_code);

  if not found then
    raise exception 'invalid invite code';
  end if;

  if v_group.owner_id = v_user_id then
    raise exception 'you are the owner of this group';
  end if;

  insert into study_group_members (group_id, user_id)
  values (v_group.id, v_user_id)
  on conflict (group_id, user_id) do nothing;

  return v_group;
end;
$$;

grant execute on function join_study_group_by_code(text) to authenticated;
