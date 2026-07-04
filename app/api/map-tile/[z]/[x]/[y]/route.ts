import { NextRequest, NextResponse } from "next/server";

// Proxies map tiles from the Consortium of Ancient World Mappers (CAWM) at
// http://cawm.lib.uiowa.edu/tiles. Direct client fetches fail because their
// HTTPS cert chain is broken and mixed-content blocks the HTTP fallback.
// Aggressively cached at the edge — tiles are effectively immutable.

const UPSTREAM = "http://cawm.lib.uiowa.edu/tiles";
const UPSTREAM_TIMEOUT_MS = 8000;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z, x, y } = await params;
  if (!/^\d+$/.test(z) || !/^\d+$/.test(x) || !/^\d+$/.test(y)) {
    return NextResponse.json({ error: "Invalid tile coordinates" }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const res = await fetch(`${UPSTREAM}/${z}/${x}/${y}.png`, { signal: controller.signal });
    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }
    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      headers: {
        "Content-Type": "image/png",
        // Tiles never change once generated — cache heavily.
        "Cache-Control": "public, max-age=2592000, s-maxage=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
