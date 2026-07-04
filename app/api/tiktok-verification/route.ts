import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse("tiktok-developers-site-verification=vBli2RrFIgDtNtEHV7kMukT0nQiDRvog", {
    headers: { "Content-Type": "text/plain" },
  });
}
