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
  created_at  timestamptz default now() not null
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
  translation text not null default 'KJV',
  content     text not null default '',
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null,

  -- One note per user per chapter per translation
  unique(user_id, book_id, chapter, translation)
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
