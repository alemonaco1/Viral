import { NextResponse } from "next/server";
import { getTikTokAuthUrl } from "@/lib/tiktok";
import { randomUUID } from "crypto";

// Redireciona o usuário para a tela de autorização do TikTok.
// O `state` deveria, num app real, ser salvo em cookie/sessão e
// validado no callback para prevenir CSRF.
export async function GET() {
  const state = randomUUID();
  const url = getTikTokAuthUrl(state);
  return NextResponse.redirect(url);
}
