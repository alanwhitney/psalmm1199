import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BOOK_BY_ID } from "@/lib/books";

function generateInviteCode(): string {
  // Omit visually confusing characters: 0/O, 1/I/L
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, book_id, chapter, translation } = await req.json();
  const book = BOOK_BY_ID[String(book_id ?? "").toUpperCase()];
  if (!book || !name?.trim() || !chapter || chapter < 1 || chapter > book.chapters) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Find a unique invite code (collisions are astronomically rare but handle them)
  let invite_code = "";
  for (let i = 0; i < 10; i++) {
    const code = generateInviteCode();
    const { data: existing } = await supabase.from("study_groups").select("id").eq("invite_code", code).maybeSingle();
    if (!existing) { invite_code = code; break; }
  }
  if (!invite_code) return NextResponse.json({ error: "Could not generate unique code" }, { status: 500 });

  const { data: group, error } = await supabase
    .from("study_groups")
    .insert({ owner_id: user.id, name: name.trim(), book_id: book.id, book_name: book.name, chapter, translation, invite_code })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Owner is also a member from the start
  await supabase.from("study_group_members").insert({ group_id: group.id, user_id: user.id });

  return NextResponse.json({ group });
}
