import { supabaseAdmin } from "@/lib/supabase";
import { pickRetentionCurves } from "@/lib/analytics";
import RetentionChart from "@/components/RetentionChart";

export const dynamic = "force-dynamic";

const USER_ID = "demo-user";

async function getPosts() {
  const { data: accounts } = await supabaseAdmin
    .from("connected_accounts")
    .select("id")
    .eq("user_id", USER_ID);

  if (!accounts?.length) return [];

  const { data } = await supabaseAdmin
    .from("posts")
    .select("id, title, platform, post_metrics(*)")
    .in("account_id", accounts.map((a) => a.id))
    .order("published_at", { ascending: false });

  return data ?? [];
}

export default async function Retencao() {
  const posts = await getPosts();
  const { best, avg } = pickRetentionCurves(posts as any);

  const topPosts = posts
    .filter((p: any) => p.post_metrics?.[0]?.completion_rate != null)
    .sort((a: any, b: any) => (b.post_metrics[0].completion_rate ?? 0) - (a.post_metrics[0].completion_rate ?? 0))
    .slice(0, 5);

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
          <a href="/dashboard/conteudos" className="px-3 py-2 rounded-lg text-ink-soft hover:bg-teal-soft hover:text-teal transition-colors">Conteúdos</a>
          <a href="/dashboard/retencao" className="px-3 py-2 rounded-lg bg-teal-soft text-teal font-semibold">Retenção</a>
          <a href="/dashboard/benchmark" className="px-3 py-2 rounded-lg text-ink-soft hover:bg-teal-soft hover:text-teal transition-colors">Benchmark</a>
        </nav>
      </aside>

      <main className="p-10 max-w-5xl">
        <h1 className="font-display text-2xl mb-1">Retenção</h1>
        <p className="text-sm text-ink-soft mb-7">Curvas de retenção dos seus conteúdos</p>

        <div className="bg-surface border border-line rounded-2xl p-6 mb-6">
          <h3 className="font-display font-semibold text-sm mb-1">Melhor vídeo vs. média</h3>
          <p className="text-xs text-ink-soft mb-4">
            {posts.length === 0
              ? "Sincronize posts para ver as curvas de retenção."
              : "Curva segundo-a-segundo requer acesso ao TikTok Research API."}
          </p>
          <RetentionChart bestCurve={best} avgCurve={avg} />
        </div>

        {topPosts.length > 0 && (
          <div className="bg-surface border border-line rounded-2xl p-6">
            <h3 className="font-display font-semibold text-sm mb-4">Top 5 por completion rate</h3>
            <div className="flex flex-col gap-3">
              {topPosts.map((post: any, i: number) => {
                const cr = post.post_metrics?.[0]?.completion_rate ?? 0;
                return (
                  <div key={post.id} className="flex items-center gap-4">
                    <span className="text-xs font-mono text-ink-soft w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{post.title || "Sem título"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-line rounded-full overflow-hidden">
                        <div className="h-full bg-teal rounded-full" style={{ width: `${Math.round(cr * 100)}%` }} />
                      </div>
                      <span className="text-xs font-mono w-8 text-right">{Math.round(cr * 100)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {posts.length === 0 && (
          <div className="border border-dashed border-line rounded-2xl p-10 text-center text-sm text-ink-soft">
            Nenhum dado ainda. Conecte sua conta e sincronize os posts.
          </div>
        )}
      </main>
    </div>
  );
}
