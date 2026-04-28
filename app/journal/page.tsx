import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { lastPositionUrl } from "@/lib/last-position";
import JournalClient from "./JournalClient";

export default async function JournalPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const cookieStore = await cookies();
  const backHref = lastPositionUrl(cookieStore.get("last_position")?.value);

  const { data: prayers } = await supabase
    .from("prayers")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <JournalClient
      prayers={prayers ?? []}
      userEmail={user.email ?? ""}
      userId={user.id}
      backHref={backHref}
    />
  );
}

export const metadata = { title: "Prayer Journal — Psalm 119:9" };
