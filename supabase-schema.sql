-- psalm1199 database schema
--
-- Regenerated from the live Supabase project on 2026-10-12, so this matches
-- production. Run it in the Supabase SQL Editor to build a fresh database.
-- Make later changes as migrations in supabase/migrations/ and keep this file
-- in sync with them.

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- Shared trigger functions
-- ─────────────────────────────────────────────
-- Two equivalent updated_at triggers exist for historical reasons:
-- bookmarks uses set_updated_at(), notes and prayers use update_updated_at_column().
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function update_updated_at_column()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────
-- Bookmarks (per translation)
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
  sorted_at   timestamptz default now() not null,  -- manual order on the Bookmarks page (desc); not bumped on advance or label edit
  updated_at  timestamptz default now()            -- set by trigger on every update
);

create index if not exists bookmarks_user_id_idx on bookmarks (user_id);

alter table bookmarks enable row level security;

create policy "Users can view their own bookmarks"
  on bookmarks for select using ((select auth.uid()) = user_id);
create policy "Users can insert their own bookmarks"
  on bookmarks for insert with check ((select auth.uid()) = user_id);
create policy "Users can update their own bookmarks"
  on bookmarks for update using ((select auth.uid()) = user_id);
create policy "Users can delete their own bookmarks"
  on bookmarks for delete using ((select auth.uid()) = user_id);

create trigger bookmarks_updated_at
  before update on bookmarks
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────
-- Notes (translation-agnostic; verse = 0 is a chapter-level note)
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

  -- One note per user per book/chapter/verse
  constraint notes_unique_verse unique (user_id, book_id, chapter, verse)
);

alter table notes enable row level security;

create policy "Users can view their own notes"
  on notes for select using ((select auth.uid()) = user_id);
create policy "Users can insert their own notes"
  on notes for insert with check ((select auth.uid()) = user_id);
create policy "Users can update their own notes"
  on notes for update using ((select auth.uid()) = user_id);
create policy "Users can delete their own notes"
  on notes for delete using ((select auth.uid()) = user_id);

create trigger notes_updated_at
  before update on notes
  for each row execute function update_updated_at_column();

-- ─────────────────────────────────────────────
-- Highlights (per translation)
-- ─────────────────────────────────────────────
create table if not exists highlights (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  book_id     text not null,
  chapter     integer not null,
  verse       integer not null,
  translation text not null default 'KJV',
  color       text not null default 'yellow',   -- see HIGHLIGHT_COLORS in ChapterView.tsx
  created_at  timestamptz default now() not null,

  unique (user_id, book_id, chapter, verse, translation)
);

alter table highlights enable row level security;

create policy "Users can view their own highlights"
  on highlights for select using ((select auth.uid()) = user_id);
create policy "Users can insert their own highlights"
  on highlights for insert with check ((select auth.uid()) = user_id);
create policy "Users can update their own highlights"
  on highlights for update using ((select auth.uid()) = user_id);
create policy "Users can delete their own highlights"
  on highlights for delete using ((select auth.uid()) = user_id);

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

create index if not exists prayers_user_id_idx on prayers (user_id);

alter table prayers enable row level security;

create policy "Users can view their own prayers"
  on prayers for select using ((select auth.uid()) = user_id);
create policy "Users can insert their own prayers"
  on prayers for insert with check ((select auth.uid()) = user_id);
create policy "Users can update their own prayers"
  on prayers for update using ((select auth.uid()) = user_id);
create policy "Users can delete their own prayers"
  on prayers for delete using ((select auth.uid()) = user_id);

create trigger prayers_updated_at
  before update on prayers
  for each row execute function update_updated_at_column();

-- ─────────────────────────────────────────────
-- Reading Plans
-- ─────────────────────────────────────────────
create table if not exists user_reading_plans (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  plan_id     text not null,          -- static plan id, see lib/reading-plans.ts
  started_at  date not null default current_date,
  translation text not null default 'KJV',
  active      boolean not null default true,
  created_at  timestamptz default now() not null,

  unique (user_id, plan_id)
);

alter table user_reading_plans enable row level security;

create policy "Users manage their own plans"
  on user_reading_plans for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists plan_completions (
  id           uuid default uuid_generate_v4() primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  plan_id      text not null,
  day          integer not null,
  completed_at timestamptz default now() not null,

  unique (user_id, plan_id, day)
);

alter table plan_completions enable row level security;

create policy "Users manage their own completions"
  on plan_completions for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─────────────────────────────────────────────
-- Study Groups
-- ─────────────────────────────────────────────
create table if not exists study_groups (
  id          uuid default gen_random_uuid() primary key,
  owner_id    uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  book_id     text not null,
  book_name   text not null,
  chapter     integer not null,
  translation text not null default 'NKJV',
  invite_code text not null unique,
  created_at  timestamptz default now() not null
);

create index if not exists study_groups_owner_id_idx on study_groups (owner_id);

create table if not exists study_group_members (
  group_id  uuid references study_groups(id) on delete cascade not null,
  user_id   uuid references auth.users(id) on delete cascade not null,
  joined_at timestamptz default now() not null,

  primary key (group_id, user_id)
);

create index if not exists study_group_members_user_id_idx on study_group_members (user_id);

alter table study_groups enable row level security;
alter table study_group_members enable row level security;

-- SECURITY DEFINER helper: a policy on study_group_members that selected from
-- study_group_members directly would trip Postgres's "infinite recursion
-- detected in policy" check. Reading the caller's group ids through a definer
-- function sidesteps that.
create or replace function get_my_group_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select group_id from study_group_members where user_id = auth.uid()
$$;

create policy "members can read their groups"
  on study_groups for select using (
    (select auth.uid()) = owner_id
    or exists (
      select 1 from study_group_members m
      where m.group_id = study_groups.id and m.user_id = (select auth.uid())
    )
  );
create policy "authenticated users can create groups"
  on study_groups for insert with check ((select auth.uid()) = owner_id);
create policy "owner can update group"
  on study_groups for update using ((select auth.uid()) = owner_id);
create policy "owner can delete group"
  on study_groups for delete using ((select auth.uid()) = owner_id);

create policy "members can see their group's members"
  on study_group_members for select using (group_id in (select get_my_group_ids()));
create policy "authenticated users can join"
  on study_group_members for insert with check ((select auth.uid()) = user_id);
create policy "members can leave"
  on study_group_members for delete using ((select auth.uid()) = user_id);

-- Look up a group by invite code and join it. SECURITY DEFINER because the
-- joiner isn't a member yet, so the select policy above wouldn't otherwise let
-- them see the group row to join it. Exception message substrings ("invalid
-- invite", "owner", "not authenticated") are matched case-insensitively by
-- friendlyJoinError() in app/bookmarks/StudyTab.tsx; keep them in sync.
create or replace function join_study_group_by_code(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group study_groups%rowtype;
  v_uid   uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_group from study_groups where invite_code = upper(trim(p_code));
  if not found then raise exception 'Invalid invite code'; end if;
  if v_group.owner_id = v_uid then raise exception 'You are the owner of this group'; end if;
  insert into study_group_members (group_id, user_id) values (v_group.id, v_uid)
    on conflict (group_id, user_id) do nothing;
  return row_to_json(v_group);
end;
$$;

-- Definer functions are callable over the API; restrict them to signed-in users.
revoke execute on function get_my_group_ids() from public, anon;
revoke execute on function join_study_group_by_code(text) from public, anon;
grant execute on function get_my_group_ids() to authenticated;
grant execute on function join_study_group_by_code(text) to authenticated;
