import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { lastPositionUrl, lastPositionLabel } from "@/lib/last-position";
import BookmarksClient from "./BookmarksClient";
import AppLayout from "@/components/AppLayout";
import { StudyGroup } from "./StudyTab";

export default async function BookmarksPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const cookieStore = await cookies();
  const raw = cookieStore.get("last_position")?.value;
  const backHref = lastPositionUrl(raw);
  const backLabel = lastPositionLabel(raw);

  const [
    { data: bookmarks },
    { data: notes },
    { data: userPlans },
    { data: completions },
    { data: studyGroupsRaw },
  ] = await Promise.all([
    supabase.from("bookmarks").select("*").eq("user_id", user.id).order("sorted_at", { ascending: false }),
    supabase.from("notes").select("id, book_id, book_name, chapter, verse, updated_at, content").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("user_reading_plans").select("*").eq("user_id", user.id),
    supabase.from("plan_completions").select("plan_id, day").eq("user_id", user.id),
    supabase.from("study_groups").select("*, study_group_members(count)").order("created_at", { ascending: false }),
  ]);

  const studyGroups: StudyGroup[] = (studyGroupsRaw ?? []).map((g: Record<string, unknown>) => ({
    ...g,
    member_count: (g.study_group_members as { count: number }[])?.[0]?.count ?? 0,
  })) as StudyGroup[];

  return (
    <AppLayout user={user} backHref={backHref} backLabel={backLabel} title="My Reading">
      <BookmarksClient
        bookmarks={bookmarks ?? []}
        notes={notes ?? []}
        userId={user.id}
        userPlans={userPlans ?? []}
        completions={completions ?? []}
        studyGroups={studyGroups}
      />
    </AppLayout>
  );
}

export const metadata = { title: "My Bookmarks — Psalm 119:9" };
