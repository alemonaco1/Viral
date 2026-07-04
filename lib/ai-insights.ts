import Anthropic from "@anthropic-ai/sdk";
import type { NormalizedPost } from "./types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export interface AIInsight {
  category: "win" | "warning" | "tip";
  message: string;
  confidence: "alta" | "media" | "baixa";
  basedOnNPosts: number;
}

/**
 * Recebe os posts normalizados (com métricas) dos últimos N dias e devolve
 * insights em linguagem natural, no mesmo formato do feed do dashboard.
 * O prompt é estruturado para forçar JSON, evitando texto solto que
 * quebraria o parsing no front-end.
 */
export async function generateInsights(posts: NormalizedPost[]): Promise<AIInsight[]> {
  if (posts.length < 5) {
    return [{
      category: "tip",
      message: "Ainda não há posts suficientes para gerar padrões confiáveis. A IA precisa de pelo menos 5-10 publicações por conta para começar a identificar tendências reais.",
      confidence: "baixa",
      basedOnNPosts: posts.length,
    }];
  }

  const dataset = posts.map((p) => ({
    plataforma: p.platform,
    duracao_seg: p.durationSeconds,
    publicado_em: p.publishedAt,
    legenda: p.caption?.slice(0, 200),
    metricas: p.metrics,
  }));

  const systemPrompt = `Você é um analista de marketing de conteúdo sênior, especialista em TikTok e LinkedIn.
Analise os dados de performance abaixo e devolva de 3 a 6 insights acionáveis.

Regras:
- Cada insight deve citar um número concreto derivado dos dados (nunca invente números).
- Categorize cada insight como "win" (algo que está funcionando), "warning" (algo caindo/piorando) ou "tip" (sugestão de teste).
- Seja específico: cite formato, horário, duração ou tipo de gancho quando o dado permitir.
- Se os dados forem insuficientes para uma afirmação específica, diga isso em vez de inventar.
- Responda APENAS com um array JSON válido, sem markdown, sem texto antes ou depois, no formato:
[{"category": "win"|"warning"|"tip", "message": "...", "confidence": "alta"|"media"|"baixa"}]`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    system: systemPrompt,
    messages: [
      { role: "user", content: `Dados dos últimos posts:\n${JSON.stringify(dataset, null, 2)}` },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return [];

  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as Omit<AIInsight, "basedOnNPosts">[];
    return parsed.map((insight) => ({ ...insight, basedOnNPosts: posts.length }));
  } catch {
    // Se o modelo desviar do formato, falha de forma segura em vez de quebrar o dashboard.
    return [];
  }
}
