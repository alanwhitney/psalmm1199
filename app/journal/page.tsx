import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { lastPositionUrl } from "@/lib/last-position";
import JournalClient from "./JournalClient";
import AppLayout from "@/components/AppLayout";

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
    <AppLayout user={user} backHref={backHref} title="Prayer Journal">
      <JournalClient prayers={prayers ?? []} userId={user.id} />
    </AppLayout>
  );
}

export const metadata = { title: "Prayer Journal — Psalm 119:9" };
