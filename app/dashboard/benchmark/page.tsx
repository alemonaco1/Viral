import { supabaseAdmin } from "@/lib/supabase";
import { computeKpis } from "@/lib/analytics";

export const dynamic = "force-dynamic";

const USER_ID = "demo-user";

async function getPosts() {
  const { data: accounts } = await supabaseAdmin
    .from("connected_accounts")
    .select("id, platform")
    .eq("user_id", USER_ID);

  if (!accounts?.length) return { posts: [], platforms: [] };

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabaseAdmin
    .from("posts")
    .select("id, platform, published_at, post_metrics(*)")
    .in("account_id", accounts.map((a) => a.id))
    .gte("published_at", since)
    .order("published_at", { ascending: false });

  const platforms = [...new Set(accounts.map((a) => a.platform))];
  return { posts: data ?? [], platforms };
}

const benchmarks: Record<string, Record<string, number>> = {
  tiktok: { avgViews: 1200, completionRate: 0.45, ctr: 0.08, avgWatchTime: 18 },
  linkedin: { avgViews: 800, completionRate: 0.35, ctr: 0.05, avgWatchTime: 0 },
};

export default async function Benchmark() {
  const { posts, platforms } = await getPosts();
  const kpis = computeKpis(posts as any);

  const metrics = [
    { label: "Views médios", key: "avgViews", yourValue: kpis.avgReach, suffix: "" },
    { label: "Completion rate", key: "completionRate", yourValue: kpis.avgCompletionRate, suffix: "%" },
    { label: "CTR médio", key: "ctr", yourValue: kpis.avgCtr, suffix: "%" },
    { label: "Watch time médio", key: "avgWatchTime", yourValue: kpis.avgWatchTime, suffix: "s" },
  ];

  const platform = platforms[0] ?? "tiktok";
  const ref = benchmarks[platform];

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
          <a href="/dashboard/retencao" className="px-3 py-2 rounded-lg text-ink-soft hover:bg-teal-soft hover:text-teal transition-colors">Retenção</a>
          <a href="/dashboard/benchmark" className="px-3 py-2 rounded-lg bg-teal-soft text-teal font-semibold">Benchmark</a>
        </nav>
      </aside>

      <main className="p-10 max-w-5xl">
        <h1 className="font-display text-2xl mb-1">Benchmark</h1>
        <p className="text-sm text-ink-soft mb-7">Suas métricas vs. média do setor</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {metrics.map((m) => {
            const refVal = ref[m.key];
            const yours = m.yourValue;
            const hasData = yours != null && yours > 0;
            const pct = hasData ? Math.round((yours / refVal) * 100) : null;
            const better = pct != null && pct >= 100;

            return (
              <div key={m.label} className="bg-surface border border-line rounded-2xl p-5">
                <div className="text-[10px] uppercase tracking-wide text-ink-soft mb-3">{m.label}</div>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div className="text-xs text-ink-soft mb-0.5">Você</div>
                    <div className="font-display font-mono text-xl font-semibold">
                      {hasData ? `${Math.round(yours * 10) / 10}${m.suffix}` : "—"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-ink-soft mb-0.5">Referência</div>
                    <div className="font-mono text-sm text-ink-soft">{refVal}{m.suffix}</div>
                  </div>
                </div>
                {pct != null && (
                  <div className={`text-xs font-semibold ${better ? "text-teal" : "text-coral"}`}>
                    {better ? `+${pct - 100}% acima da média` : `${100 - pct}% abaixo da média`}
                  </div>
                )}
                {!hasData && (
                  <div className="text-xs text-ink-soft">Sincronize posts para comparar</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-surface border border-line rounded-2xl p-5">
          <p className="text-xs text-ink-soft">
            Referências baseadas em médias do setor para criadores com 1k–100k seguidores.
            Os benchmarks ficam mais precisos conforme você sincroniza mais histórico.
          </p>
        </div>
      </main>
    </div>
  );
}
