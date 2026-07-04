import type { NormalizedPost } from "./types";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";

// 'w_member_social' permite ler/gerenciar posts do próprio perfil.
// Métricas de página de empresa exigem aprovação no Marketing Developer Platform
// e o escopo 'r_organization_social' + 'rw_organization_admin'.
const SCOPES = ["openid", "profile", "w_member_social"].join(" ");

export function getLinkedInAuthUrl(state: string) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
    scope: SCOPES,
    state,
  });
  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

export async function exchangeLinkedInCode(code: string) {
  const res = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  });

  if (!res.ok) {
    throw new Error(`LinkedIn token exchange falhou: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<{
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  }>;
}

export async function getLinkedInProfile(accessToken: string) {
  const res = await fetch(LINKEDIN_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Falha ao buscar perfil do LinkedIn");
  return res.json() as Promise<{ sub: string; name: string }>;
}

/**
 * Busca posts do membro autenticado.
 * IMPORTANTE: métricas detalhadas de post individual (impressões, CTR,
 * cliques no perfil) exigem o produto "Community Management API" ou
 * "Marketing Developer Platform", que passam por aprovação manual do
 * LinkedIn (normalmente pedem caso de uso + site publicado).
 * Sem essa aprovação, a API pública devolve apenas o conteúdo do post,
 * sem métricas de engajamento — por isso o `metrics` abaixo é montado
 * defensivamente, marcando o que não veio como `undefined`.
 */
export async function fetchLinkedInPosts(accessToken: string, personUrn: string): Promise<NormalizedPost[]> {
  const res = await fetch(
    `https://api.linkedin.com/v2/posts?author=${encodeURIComponent(personUrn)}&count=20`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "LinkedIn-Version": "202405",
        "X-Restli-Protocol-Version": "2.0.0",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Falha ao buscar posts do LinkedIn: ${res.status}`);
  }

  const data = await res.json();
  const elements = data?.elements ?? [];

  return elements.map((p: any): NormalizedPost => ({
    platform: "linkedin",
    platformPostId: p.id,
    caption: p.commentary,
    publishedAt: new Date(p.createdAt).toISOString(),
    metrics: {
      // Preenchidos via endpoint de social actions / analytics separado,
      // quando o app tiver aprovação do Marketing Developer Platform.
    },
    raw: p,
  }));
}
