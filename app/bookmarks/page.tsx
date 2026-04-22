import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import BookmarksClient from "./BookmarksClient";

export default async function BookmarksPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [
    { data: bookmarks },
    { data: notes },
    { data: userPlans },
    { data: completions },
  ] = await Promise.all([
    supabase.from("bookmarks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("notes").select("id, book_id, book_name, chapter, translation, updated_at, content").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("user_reading_plans").select("*").eq("user_id", user.id),
    supabase.from("plan_completions").select("plan_id, day").eq("user_id", user.id),
  ]);

  return (
    <BookmarksClient
      bookmarks={bookmarks ?? []}
      notes={notes ?? []}
      userEmail={user.email ?? ""}
      userId={user.id}
      userPlans={userPlans ?? []}
      completions={completions ?? []}
    />
  );
}

export const metadata = { title: "My Bookmarks — Psalm 119:9" };
