import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateInsights } from "@/lib/ai-insights";
import type { NormalizedPost } from "@/lib/types";

// GET /api/insights?userId=xxxx&days=30
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") ?? "demo-user";
  const days = Number(req.nextUrl.searchParams.get("days") ?? 30);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: accounts } = await supabaseAdmin
    .from("connected_accounts")
    .select("id")
    .eq("user_id", userId);

  const accountIds = (accounts ?? []).map((a) => a.id);
  if (accountIds.length === 0) {
    return NextResponse.json({ insights: [] });
  }

  const { data: posts, error } = await supabaseAdmin
    .from("posts")
    .select("*, post_metrics(*)")
    .in("account_id", accountIds)
    .gte("published_at", since)
    .order("published_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const normalized: NormalizedPost[] = (posts ?? []).map((p: any) => ({
    platform: p.platform,
    platformPostId: p.platform_post_id,
    title: p.title,
    caption: p.caption,
    durationSeconds: p.duration_seconds,
    publishedAt: p.published_at,
    metrics: p.post_metrics?.[0] ?? {},
    raw: p.raw_payload,
  }));

  const insights = await generateInsights(normalized);

  // Salva para histórico / não precisar reprocessar a cada refresh do dashboard
  if (insights.length > 0) {
    await supabaseAdmin.from("ai_insights").insert(
      insights.map((i) => ({
        user_id: userId,
        category: i.category,
        message: i.message,
        confidence: i.confidence,
        based_on_n_posts: i.basedOnNPosts,
      }))
    );
  }

  return NextResponse.json({ insights });
}
