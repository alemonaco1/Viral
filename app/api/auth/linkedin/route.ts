import { NextResponse } from "next/server";
import { getLinkedInAuthUrl } from "@/lib/linkedin";
import { randomUUID } from "crypto";

export async function GET() {
  const state = randomUUID();
  const url = getLinkedInAuthUrl(state);
  return NextResponse.redirect(url);
}
