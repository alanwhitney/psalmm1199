import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import BookmarksClient from "./BookmarksClient";

export default async function BookmarksPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: notes } = await supabase
    .from("notes")
    .select("id, book_name, chapter, translation, updated_at, content")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <BookmarksClient
      bookmarks={bookmarks ?? []}
      notes={notes ?? []}
      userEmail={user.email ?? ""}
    />
  );
}

export const metadata = {
  title: "My Bookmarks — Psalm 119:9",
};
