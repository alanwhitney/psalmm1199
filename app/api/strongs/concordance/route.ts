import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!/^[HG]\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const res = await fetch(
    `https://labs.openbible.info/api/concordance/?strongs=${id}`,
    { next: { revalidate: 31536000 } }
  );

  if (!res.ok) return NextResponse.json({ error: "Unavailable" }, { status: 502 });

  const data = await res.json();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
