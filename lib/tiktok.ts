import type { NormalizedPost } from "./types";

const TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const TIKTOK_VIDEO_LIST_URL = "https://open.tiktokapis.com/v2/video/list/";

// Escopos mínimos para o MVP. 'video.list' e métricas avançadas exigem
// revisão de app pelo TikTok — sem isso, alguns campos vêm vazios.
const SCOPES = ["user.info.basic"].join(",");

export function getTikTokAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    scope: SCOPES,
    response_type: "code",
    redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
    state,
  });
  return `${TIKTOK_AUTH_URL}?${params.toString()}`;
}

export async function exchangeTikTokCode(code: string) {
  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
    }),
  });

  if (!res.ok) {
    throw new Error(`TikTok token exchange falhou: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    open_id: string;
  }>;
}

export async function refreshTikTokToken(refreshToken: string) {
  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error("Falha ao renovar token do TikTok");
  return res.json();
}

/**
 * Busca vídeos e métricas básicas disponíveis via API pública.
 * IMPORTANTE: retenção segundo-a-segundo NÃO está disponível na API pública
 * do TikTok para a maioria dos apps — apenas para parceiros aprovados no
 * "TikTok Research API" ou contas de anúncio via TikTok Ads Manager.
 * Para o MVP, avg_watch_time e completion_rate vêm da API; a curva
 * segundo-a-segundo fica marcada como `estimated: true` (interpolada) até
 * você conseguir acesso ao Research API ou exportar via TikTok Ads.
 */
export async function fetchTikTokVideos(accessToken: string): Promise<NormalizedPost[]> {
  const fields = [
    "id", "title", "video_description", "duration",
    "create_time", "view_count", "like_count", "comment_count",
    "share_count",
  ].join(",");

  const res = await fetch(`${TIKTOK_VIDEO_LIST_URL}?fields=${fields}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ max_count: 20 }),
  });

  if (!res.ok) {
    throw new Error(`Falha ao buscar vídeos do TikTok: ${res.status}`);
  }

  const data = await res.json();
  const videos = data?.data?.videos ?? [];

  return videos.map((v: any): NormalizedPost => ({
    platform: "tiktok",
    platformPostId: v.id,
    title: v.title,
    caption: v.video_description,
    durationSeconds: v.duration,
    publishedAt: new Date(v.create_time * 1000).toISOString(),
    metrics: {
      views: v.view_count,
      likes: v.like_count,
      comments: v.comment_count,
      shares: v.share_count,
      // retentionCurve: preenchido separadamente quando houver acesso ao Research API
    },
    raw: v,
  }));
}
