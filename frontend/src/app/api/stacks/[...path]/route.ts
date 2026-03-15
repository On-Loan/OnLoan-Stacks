import { NextRequest, NextResponse } from "next/server";

const HIRO_BASE = "https://api.testnet.hiro.so";
const CACHE_SECONDS = 15;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const upstream = `${HIRO_BASE}/${path.join("/")}${request.nextUrl.search}`;

  const res = await fetch(upstream, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: CACHE_SECONDS },
  });

  const data = await res.text();

  return new NextResponse(data, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "application/json",
      "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=60`,
    },
  });
}
