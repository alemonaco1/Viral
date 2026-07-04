import { NextRequest, NextResponse } from "next/server";
import { exchangeLinkedInCode, getLinkedInProfile } from "@/lib/linkedin";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=linkedin_${error}`);
  }
  if (!code) {
    return NextResponse.json({ error: "Código de autorização ausente" }, { status: 400 });
  }

  try {
    const tokenData = await exchangeLinkedInCode(code);
    const profile = await getLinkedInProfile(tokenData.access_token);

    const userId = req.cookies.get("va_user_id")?.value ?? "demo-user";

    await supabaseAdmin.from("connected_accounts").upsert({
      user_id: userId,
      platform: "linkedin",
      platform_account_id: profile.sub,
      display_name: profile.name,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token ?? null,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
    }, { onConflict: "platform,platform_account_id" });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?connected=linkedin`);
  } catch (err) {
    console.error("Erro no callback do LinkedIn:", err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=linkedin_token_exchange`);
  }
}
