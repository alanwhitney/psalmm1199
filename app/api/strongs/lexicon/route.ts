import { NextRequest, NextResponse } from "next/server";
import { getLexiconEntry } from "@/lib/strongs-lexicon";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!/^[HG]\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const entry = getLexiconEntry(id);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(entry, {
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
