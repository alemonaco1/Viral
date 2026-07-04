interface PostRow {
  id: string;
  platform: string;
  duration_seconds: number | null;
  published_at: string;
  post_metrics: {
    reach: number | null;
    views: number | null;
    avg_watch_time: number | null;
    completion_rate: number | null;
    ctr: number | null;
    new_followers: number | null;
    retention_curve: number[] | null;
  }[];
}

function metric(post: PostRow) {
  return post.post_metrics?.[0] ?? {};
}

function avg(values: number[]) {
  const clean = values.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (clean.length === 0) return null;
  return clean.reduce((a, b) => a + b, 0) / clean.length;
}

function sum(values: (number | null | undefined)[]) {
  return values.reduce((a: number, b) => a + (b ?? 0), 0);
}

export function computeKpis(posts: PostRow[]) {
  const m = posts.map(metric);
  return {
    avgReach: avg(m.map((x) => x.reach ?? NaN)),
    totalNewFollowers: sum(m.map((x) => x.new_followers)),
    avgWatchTime: avg(m.map((x) => x.avg_watch_time ?? NaN)),
    avgCtr: avg(m.map((x) => x.ctr ?? NaN)),
    avgCompletionRate: avg(m.map((x) => x.completion_rate ?? NaN)),
    postCount: posts.length,
  };
}

/**
 * Escolhe a curva de retenção do post com maior completion_rate como
 * "melhor vídeo", e calcula a curva média ponto a ponto entre os posts
 * que têm retention_curve preenchido. Retorna null quando nenhum post
 * ainda tem esse dado (ver nota em RetentionChart.tsx).
 */
export function pickRetentionCurves(posts: PostRow[]) {
  const withCurve = posts
    .map((p) => ({ curve: metric(p).retention_curve, completion: metric(p).completion_rate ?? 0 }))
    .filter((p): p is { curve: number[]; completion: number } => Array.isArray(p.curve) && p.curve.length > 0);

  if (withCurve.length === 0) return { best: null, avg: null };

  const best = [...withCurve].sort((a, b) => b.completion - a.completion)[0].curve;

  const maxLen = Math.max(...withCurve.map((p) => p.curve.length));
  const avgCurve = Array.from({ length: maxLen }, (_, i) => {
    const valuesAtI = withCurve.map((p) => p.curve[i]).filter((v) => typeof v === "number");
    return avg(valuesAtI) ?? 0;
  });

  return { best, avg: avgCurve };
}

/**
 * Score preditivo — HEURÍSTICA de placeholder, não é modelo treinado.
 * Combina taxa de conclusão média e CTR médio contra referências de mercado
 * genéricas. Vira modelo real (regressão/classificador) quando houver
 * histórico suficiente (~200+ posts) para treinar em cima dos seus dados.
 */
export function estimateViralPotential(kpis: ReturnType<typeof computeKpis>) {
  const completionScore = kpis.avgCompletionRate ? Math.min(kpis.avgCompletionRate / 60, 1) * 50 : 25;
  const ctrScore = kpis.avgCtr ? Math.min(kpis.avgCtr / 8, 1) * 50 : 25;
  return Math.round(completionScore + ctrScore);
}
