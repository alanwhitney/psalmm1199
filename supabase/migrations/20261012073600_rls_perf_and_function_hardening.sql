-- Supabase advisor cleanup. No behavior change for the app.
--  1. RLS policies: wrap auth.uid() in (select ...) so it's evaluated once per
--     query instead of once per row (lint 0003_auth_rls_initplan).
--  2. Index foreign-key user columns that every page filters on (lint 0001).
--  3. Pin search_path on the updated_at trigger functions (lint 0011).
--  4. Stop anonymous visitors from calling the study-group SECURITY DEFINER
--     functions over the API; signed-in users keep access (lint 0028).

-- 1. RLS policies ---------------------------------------------------------

alter policy "Users can view their own bookmarks"   on bookmarks using ((select auth.uid()) = user_id);
alter policy "Users can insert their own bookmarks" on bookmarks with check ((select auth.uid()) = user_id);
alter policy "Users can update their own bookmarks" on bookmarks using ((select auth.uid()) = user_id);
alter policy "Users can delete their own bookmarks" on bookmarks using ((select auth.uid()) = user_id);

alter policy "Users can view their own notes"   on notes using ((select auth.uid()) = user_id);
alter policy "Users can insert their own notes" on notes with check ((select auth.uid()) = user_id);
alter policy "Users can update their own notes" on notes using ((select auth.uid()) = user_id);
alter policy "Users can delete their own notes" on notes using ((select auth.uid()) = user_id);

alter policy "Users can view their own highlights"   on highlights using ((select auth.uid()) = user_id);
alter policy "Users can insert their own highlights" on highlights with check ((select auth.uid()) = user_id);
alter policy "Users can update their own highlights" on highlights using ((select auth.uid()) = user_id);
alter policy "Users can delete their own highlights" on highlights using ((select auth.uid()) = user_id);

alter policy "Users can view their own prayers"   on prayers using ((select auth.uid()) = user_id);
alter policy "Users can insert their own prayers" on prayers with check ((select auth.uid()) = user_id);
alter policy "Users can update their own prayers" on prayers using ((select auth.uid()) = user_id);
alter policy "Users can delete their own prayers" on prayers using ((select auth.uid()) = user_id);

alter policy "Users manage their own plans" on user_reading_plans
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "Users manage their own completions" on plan_completions
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter policy "authenticated users can create groups" on study_groups with check ((select auth.uid()) = owner_id);
alter policy "owner can update group" on study_groups using ((select auth.uid()) = owner_id);
alter policy "owner can delete group" on study_groups using ((select auth.uid()) = owner_id);
alter policy "members can read their groups" on study_groups using (
  (select auth.uid()) = owner_id
  or exists (
    select 1 from study_group_members m
    where m.group_id = study_groups.id and m.user_id = (select auth.uid())
  )
);

alter policy "authenticated users can join" on study_group_members with check ((select auth.uid()) = user_id);
alter policy "members can leave" on study_group_members using ((select auth.uid()) = user_id);

-- 2. Indexes --------------------------------------------------------------

create index if not exists bookmarks_user_id_idx           on bookmarks (user_id);
create index if not exists prayers_user_id_idx             on prayers (user_id);
create index if not exists study_group_members_user_id_idx on study_group_members (user_id);
create index if not exists study_groups_owner_id_idx       on study_groups (owner_id);

-- 3. Trigger functions ----------------------------------------------------

alter function set_updated_at() set search_path = '';
alter function update_updated_at_column() set search_path = '';

-- 4. SECURITY DEFINER functions: signed-in users only ----------------------

revoke execute on function get_my_group_ids() from public, anon;
revoke execute on function join_study_group_by_code(text) from public, anon;
grant execute on function get_my_group_ids() to authenticated;
grant execute on function join_study_group_by_code(text) to authenticated;
