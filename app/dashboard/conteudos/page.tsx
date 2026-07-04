import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const USER_ID = "demo-user";

async function getPosts() {
  const { data: accounts } = await supabaseAdmin
    .from("connected_accounts")
    .select("id, platform, display_name")
    .eq("user_id", USER_ID);

  if (!accounts?.length) return [];

  const { data } = await supabaseAdmin
    .from("posts")
    .select("id, platform, title, caption, published_at, duration_seconds, post_metrics(*)")
    .in("account_id", accounts.map((a) => a.id))
    .order("published_at", { ascending: false })
    .limit(50);

  return data ?? [];
}

const platformBadge: Record<string, string> = { tiktok: "bg-ink", linkedin: "bg-[#0A66C2]" };

export default async function Conteudos() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen grid grid-cols-[220px_1fr] font-body bg-bg text-ink">
      <aside className="bg-surface border-r border-line p-7 flex flex-col gap-8">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal to-indigo flex items-center justify-center">
            <span className="text-white text-xs font-bold">V</span>
          </div>
          <span className="font-display font-semibold text-sm">Viral Analytics</span>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          <a href="/dashboard" className="px-3 py-2 rounded-lg text-ink-soft hover:bg-teal-soft hover:text-teal transition-colors">Painel</a>
          <a href="/dashboard/conteudos" className="px-3 py-2 rounded-lg bg-teal-soft text-teal font-semibold">Conteúdos</a>
          <a href="/dashboard/retencao" className="px-3 py-2 rounded-lg text-ink-soft hover:bg-teal-soft hover:text-teal transition-colors">Retenção</a>
          <a href="/dashboard/benchmark" className="px-3 py-2 rounded-lg text-ink-soft hover:bg-teal-soft hover:text-teal transition-colors">Benchmark</a>
        </nav>
      </aside>

      <main className="p-10 max-w-5xl">
        <h1 className="font-display text-2xl mb-1">Conteúdos</h1>
        <p className="text-sm text-ink-soft mb-7">{posts.length} posts sincronizados</p>

        {posts.length === 0 ? (
          <div className="border border-dashed border-line rounded-2xl p-10 text-center text-sm text-ink-soft">
            Nenhum conteúdo ainda. Conecte sua conta TikTok ou LinkedIn e sincronize os posts.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post: any) => {
              const metrics = post.post_metrics?.[0];
              return (
                <div key={post.id} className="bg-surface border border-line rounded-2xl p-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className={`w-6 h-6 rounded flex items-center justify-center text-[9px] text-white font-bold shrink-0 mt-0.5 ${platformBadge[post.platform]}`}>
                      {post.platform === "tiktok" ? "Tt" : "in"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{post.title || post.caption || "Sem título"}</p>
                      <p className="text-xs text-ink-soft mt-0.5">
                        {post.published_at ? new Date(post.published_at).toLocaleDateString("pt-BR") : "—"}
                        {post.duration_seconds ? ` · ${post.duration_seconds}s` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-5 text-right shrink-0">
                    {[
                      { label: "Views", value: metrics?.views },
                      { label: "Likes", value: metrics?.likes },
                      { label: "Shares", value: metrics?.shares },
                      { label: "Completion", value: metrics?.completion_rate != null ? `${Math.round(metrics.completion_rate * 100)}%` : null },
                    ].map((m) => (
                      <div key={m.label}>
                        <div className="text-[10px] uppercase tracking-wide text-ink-soft">{m.label}</div>
                        <div className="font-mono text-sm font-semibold">{m.value ?? "—"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
