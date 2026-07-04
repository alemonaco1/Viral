import { supabaseAdmin } from "@/lib/supabase";
import { computeKpis, pickRetentionCurves, estimateViralPotential } from "@/lib/analytics";
import RetentionChart from "@/components/RetentionChart";
import ScoreRing from "@/components/ScoreRing";

export const dynamic = "force-dynamic";

const USER_ID = "demo-user"; // TODO: trocar pelo usuário autenticado real

async function getAccounts() {
  const { data } = await supabaseAdmin
    .from("connected_accounts")
    .select("id, platform, display_name")
    .eq("user_id", USER_ID);
  return data ?? [];
}

async function getPosts(accountIds: string[]) {
  if (accountIds.length === 0) return [];
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabaseAdmin
    .from("posts")
    .select("id, platform, duration_seconds, published_at, post_metrics(*)")
    .in("account_id", accountIds)
    .gte("published_at", since)
    .order("published_at", { ascending: false });
  return data ?? [];
}

async function getInsights() {
  const { data } = await supabaseAdmin
    .from("ai_insights")
    .select("*")
    .eq("user_id", USER_ID)
    .order("created_at", { ascending: false })
    .limit(6);
  return data ?? [];
}

const iconByCategory: Record<string, string> = { win: "✓", warning: "!", tip: "→" };
const colorByCategory: Record<string, string> = {
  win: "bg-teal-soft text-teal",
  warning: "bg-coral-soft text-coral",
  tip: "bg-indigo-soft text-indigo",
};
const platformBadge: Record<string, string> = { tiktok: "bg-ink", linkedin: "bg-[#0A66C2]" };

export default async function Dashboard() {
  const missingEnv = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (missingEnv) {
    return (
      <main className="max-w-lg mx-auto p-10 mt-16 font-body">
        <div className="border border-line bg-surface rounded-2xl p-8 text-center">
          <h1 className="font-display text-lg font-semibold mb-2">Supabase ainda não configurado</h1>
          <p className="text-sm text-ink-soft leading-relaxed">
            Preencha <code className="bg-indigo-soft px-1.5 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
            <code className="bg-indigo-soft px-1.5 py-0.5 rounded">SUPABASE_SERVICE_ROLE_KEY</code> no{" "}
            <code className="bg-indigo-soft px-1.5 py-0.5 rounded">.env.local</code>, rode{" "}
            <code className="bg-indigo-soft px-1.5 py-0.5 rounded">supabase/schema.sql</code> no SQL Editor,
            e recarregue.
          </p>
        </div>
      </main>
    );
  }

  const accounts = await getAccounts();
  const posts = await getPosts(accounts.map((a) => a.id));
  const insights = await getInsights();

  const kpis = computeKpis(posts as any);
  const { best, avg } = pickRetentionCurves(posts as any);
  const score = estimateViralPotential(kpis);

  return (
    <div className="min-h-screen grid grid-cols-[220px_1fr] font-body bg-bg text-ink">
      {/* SIDEBAR */}
      <aside className="bg-surface border-r border-line p-7 flex flex-col gap-8">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal to-indigo flex items-center justify-center">
            <span className="text-white text-xs font-bold">V</span>
          </div>
          <span className="font-display font-semibold text-sm">Viral Analytics</span>
        </div>

        <nav className="flex flex-col gap-1 text-sm">
          <a href="/dashboard" className="px-3 py-2 rounded-lg bg-teal-soft text-teal font-semibold">Painel</a>
          <a href="/dashboard/conteudos" className="px-3 py-2 rounded-lg text-ink-soft hover:bg-teal-soft hover:text-teal transition-colors">Conteúdos</a>
          <a href="/dashboard/retencao" className="px-3 py-2 rounded-lg text-ink-soft hover:bg-teal-soft hover:text-teal transition-colors">Retenção</a>
          <a href="/dashboard/benchmark" className="px-3 py-2 rounded-lg text-ink-soft hover:bg-teal-soft hover:text-teal transition-colors">Benchmark</a>
        </nav>

        <div className="mt-auto flex flex-col gap-2.5">
          <div className="text-[10px] uppercase tracking-wide text-ink-soft font-semibold">
            Contas conectadas
          </div>
          {accounts.length === 0 && (
            <a href="/" className="text-xs text-indigo underline">+ conectar TikTok / LinkedIn</a>
          )}
          {accounts.map((acc) => (
            <div key={acc.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded flex items-center justify-center text-[8px] text-white font-bold ${platformBadge[acc.platform]}`}>
                  {acc.platform === "tiktok" ? "Tt" : "in"}
                </span>
                {acc.display_name || acc.platform}
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-teal" />
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN */}
      <main className="p-10 max-w-5xl">
        <h1 className="font-display text-2xl mb-1">Painel</h1>
        <p className="text-sm text-ink-soft mb-7">
          {kpis.postCount} conteúdos nos últimos 30 dias · {insights.length} insights gerados pela IA
        </p>

        {posts.length === 0 && (
          <div className="border border-dashed border-line rounded-2xl p-10 text-center text-sm text-ink-soft mb-6">
            Nenhum dado ainda.{" "}
            {accounts.length === 0 ? (
              <>Conecte uma conta na <a href="/" className="text-indigo underline">página inicial</a> primeiro.</>
            ) : (
              <>Contas conectadas — chame <code className="bg-indigo-soft px-1.5 py-0.5 rounded">/api/sync?userId=demo-user</code> para puxar os primeiros posts.</>
            )}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3.5 mb-5">
          {[
            { label: "Alcance médio", value: kpis.avgReach },
            { label: "Novos seguidores", value: kpis.totalNewFollowers },
            { label: "Tempo médio assistido", value: kpis.avgWatchTime, suffix: "s" },
            { label: "CTR médio", value: kpis.avgCtr, suffix: "%" },
          ].map((k) => (
            <div key={k.label} className="bg-surface border border-line rounded-2xl p-4">
              <div className="text-[10px] uppercase tracking-wide text-ink-soft mb-2">{k.label}</div>
              <div className="font-display font-mono text-xl font-semibold">
                {k.value != null ? `${Math.round(k.value * 10) / 10}${k.suffix ?? ""}` : "—"}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[1.5fr_1fr] gap-4 mb-4">
          {/* Retention */}
          <section className="bg-surface border border-line rounded-2xl p-6">
            <h3 className="font-display font-semibold text-sm mb-1">Curva de retenção</h3>
            <p className="text-xs text-ink-soft mb-4">Melhor vídeo do período vs. média da conta</p>
            <RetentionChart bestCurve={best} avgCurve={avg} />
          </section>

          {/* AI Insights feed — signature element */}
          <section className="bg-surface border border-line rounded-2xl p-6">
            <h3 className="font-display font-semibold text-sm mb-1">Insights da IA</h3>
            <p className="text-xs text-ink-soft mb-4">Gerados a partir dos últimos 30 dias</p>
            <div className="flex flex-col">
              {insights.length === 0 && (
                <p className="text-sm text-ink-soft">
                  Sem insights ainda. Chame{" "}
                  <code className="bg-indigo-soft px-1.5 py-0.5 rounded">/api/insights?userId=demo-user</code>{" "}
                  depois de sincronizar posts suficientes.
                </p>
              )}
              {insights.map((insight: any, i: number) => (
                <div key={insight.id ?? i} className="flex gap-3 border-t border-line first:border-none pt-3.5 first:pt-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${colorByCategory[insight.category]}`}>
                    {iconByCategory[insight.category]}
                  </div>
                  <div>
                    <p className="text-sm leading-relaxed">{insight.message}</p>
                    <p className="text-xs text-ink-soft mt-1 font-mono">
                      baseado em {insight.based_on_n_posts} posts · confiança {insight.confidence}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Predictive score */}
        <section className="bg-surface border border-line rounded-2xl p-6">
          <h3 className="font-display font-semibold text-sm mb-1">Potencial de viralização estimado</h3>
          <p className="text-xs text-ink-soft mb-4">
            Heurística baseada em completion rate e CTR médios — vira modelo treinado com mais histórico
          </p>
          <div className="flex items-center gap-5">
            <ScoreRing score={score} />
            <p className="text-sm text-ink-soft">
              {kpis.postCount < 10
                ? "Ainda com poucos dados para uma estimativa confiável — sincronize mais posts."
                : `Baseado em ${kpis.postCount} posts dos últimos 30 dias.`}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
