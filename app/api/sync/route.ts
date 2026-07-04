import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchTikTokVideos } from "@/lib/tiktok";
import { fetchLinkedInPosts } from "@/lib/linkedin";

// Chamar via cron (Vercel Cron, ex: a cada 6h) ou manualmente pelo dashboard.
// GET /api/sync?userId=xxxx
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") ?? "demo-user";

  const { data: accounts, error } = await supabaseAdmin
    .from("connected_accounts")
    .select("*")
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: Record<string, number> = {};

  for (const account of accounts ?? []) {
    try {
      const posts = account.platform === "tiktok"
        ? await fetchTikTokVideos(account.access_token)
        : await fetchLinkedInPosts(account.access_token, account.platform_account_id);

      for (const post of posts) {
        const { data: savedPost } = await supabaseAdmin
          .from("posts")
          .upsert({
            account_id: account.id,
            platform: post.platform,
            platform_post_id: post.platformPostId,
            title: post.title,
            caption: post.caption,
            duration_seconds: post.durationSeconds,
            published_at: post.publishedAt,
            raw_payload: post.raw,
          }, { onConflict: "platform,platform_post_id" })
          .select()
          .single();

        if (savedPost) {
          await supabaseAdmin.from("post_metrics").insert({
            post_id: savedPost.id,
            reach: post.metrics.reach,
            impressions: post.metrics.impressions,
            views: post.metrics.views,
            full_views: post.metrics.fullViews,
            completion_rate: post.metrics.completionRate,
            avg_watch_time: post.metrics.avgWatchTime,
            retention_curve: post.metrics.retentionCurve,
            ctr: post.metrics.ctr,
            shares: post.metrics.shares,
            saves: post.metrics.saves,
            comments: post.metrics.comments,
            likes: post.metrics.likes,
            new_followers: post.metrics.newFollowers,
            profile_clicks: post.metrics.profileClicks,
          });
        }
      }

      results[account.platform] = posts.length;
    } catch (err) {
      console.error(`Erro ao sincronizar ${account.platform}:`, err);
      results[account.platform] = -1; // -1 = falhou
    }
  }

  return NextResponse.json({ synced: results });
}
