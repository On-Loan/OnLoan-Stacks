import { NextRequest, NextResponse } from "next/server";

const HIRO_BASE = "https://api.testnet.hiro.so";
const CACHE_SECONDS = 15;

function upstreamUrl(path: string[], search: string) {
  return `${HIRO_BASE}/${path.join("/")}${search}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const upstream = upstreamUrl(path, request.nextUrl.search);

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const upstream = upstreamUrl(path, request.nextUrl.search);
  const body = await request.text();

  const res = await fetch(upstream, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const data = await res.text();

  return new NextResponse(data, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "application/json",
    },
  });
}
