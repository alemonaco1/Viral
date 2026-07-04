import { NextRequest, NextResponse } from "next/server";
import { exchangeTikTokCode } from "@/lib/tiktok";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=tiktok_${error}`);
  }
  if (!code) {
    return NextResponse.json({ error: "Código de autorização ausente" }, { status: 400 });
  }

  try {
    const tokenData = await exchangeTikTokCode(code);

    // TODO: trocar por auth.uid() real quando o login do próprio app estiver implementado.
    const userId = req.cookies.get("va_user_id")?.value ?? "demo-user";

    await supabaseAdmin.from("connected_accounts").upsert({
      user_id: userId,
      platform: "tiktok",
      platform_account_id: tokenData.open_id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
    }, { onConflict: "platform,platform_account_id" });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?connected=tiktok`);
  } catch (err) {
    console.error("Erro no callback do TikTok:", err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=tiktok_token_exchange`);
  }
}
