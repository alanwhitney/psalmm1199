import { NextRequest, NextResponse } from "next/server";

// Proxies ancient-world map tiles from the Digital Atlas of the Roman Empire
// (DARE, University of Gothenburg). Previously proxied CAWM
// (http://cawm.lib.uiowa.edu/tiles), which stopped accepting connections in
// October 2026. Proxying keeps the upstream swappable without client changes.
// Aggressively cached at the edge — tiles are effectively immutable.

const UPSTREAM = "https://dh.gu.se/tiles/imperium";
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
