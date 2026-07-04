# Viral Analytics — MVP

Painel de analytics + IA para TikTok e LinkedIn. Next.js 15 (App Router) + React 19 + Supabase + Anthropic API.

> ✅ **Status**: `npm install`, `npm run build` e `npm run dev` foram testados e passam sem erros nesta versão (Next.js 15.5.20, patch de segurança de dez/2025 aplicado). O que falta pra funcionar de ponta a ponta são as credenciais reais (TikTok, LinkedIn, Supabase, Anthropic) — veja o passo a passo abaixo.

## Subir para o GitHub

```bash
cd viral-analytics-mvp
git init
git add .
git commit -m "Initial commit — Viral Analytics MVP"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/viral-analytics.git
git push -u origin main
```

O `.gitignore` já está configurado para nunca versionar `.env.local`, `node_modules` e `.next` — suas chaves de API não vão parar no GitHub por engano.

## O que este MVP já faz de verdade

- Fluxo OAuth completo com TikTok (Login Kit / Display API) e LinkedIn (OpenID + Marketing/Member endpoints).
- Armazena tokens de forma segura no Supabase (com refresh automático).
- Endpoint de sincronização que puxa vídeos do TikTok e posts do LinkedIn e grava métricas normalizadas num schema único.
- Endpoint de insights que envia os dados normalizados para a API da Anthropic e devolve leituras em linguagem natural (o "feed de insights").
- Dashboard (Next.js) consumindo esses dados reais em vez de mock.

## O que NÃO está pronto (e por quê)

- **Deploy e hospedagem**: isso precisa rodar num ambiente com domínio público e HTTPS (Vercel, Railway, etc.), porque tanto TikTok quanto LinkedIn exigem uma `redirect_uri` pública verificada — não existe isso num ambiente de sandbox.
- **Aprovação das APIs**: o TikTok exige revisão de app para escopos de analytics além do básico (`video.list`, `user.info.basic`); o processo de aprovação leva de dias a semanas. O LinkedIn também exige revisão para `Marketing Developer Platform` se você quiser métricas de página/organização.
- **Segredos reais**: client_id/client_secret de cada plataforma — você precisa criar os apps nos respectivos portais de desenvolvedor (links abaixo) e colar no `.env`.

## Passo a passo para colocar no ar

1. **Criar apps nas plataformas**
   - TikTok: https://developers.tiktok.com/ → criar app → produtos "Login Kit" + "Display API" (ou "Content Posting API" se quiser também postar).
   - LinkedIn: https://www.linkedin.com/developers/ → criar app → produtos "Sign In with LinkedIn using OpenID Connect" + "Marketing Developer Platform" (requer aprovação para métricas de página).

2. **Criar projeto no Supabase**
   - https://supabase.com → novo projeto → rodar `supabase/schema.sql` no SQL Editor.

3. **Configurar variáveis de ambiente**
   ```bash
   cp .env.example .env.local
   # preencher com os valores dos passos 1 e 2
   ```

4. **Rodar localmente**
   ```bash
   npm install
   npm run dev
   ```

5. **Deploy**
   - `vercel deploy` (ou similar). Atualizar as `redirect_uri` nos portais TikTok/LinkedIn para a URL de produção.

## Stack e por quê

| Camada | Escolha | Motivo |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SSR + API routes no mesmo projeto, deploy simples na Vercel |
| Banco | Supabase (Postgres) | Auth pronto, Row Level Security, fácil de escalar |
| IA de insights | API Anthropic (Claude) | Melhor raciocínio para interpretar dado tabular → linguagem natural |
| Estilo | Tailwind | Consistência com o mockup visual já aprovado |

## Próximos passos recomendados (ordem de prioridade)

1. Validar o OAuth TikTok + LinkedIn em ambiente real (isso desbloqueia tudo).
2. Rodar sincronização com dados reais de 1 conta e calibrar o schema.
3. Ajustar os prompts de IA em `lib/ai-insights.ts` com exemplos reais do seu conteúdo.
4. Implementar o score preditivo (hoje é um placeholder heurístico — vira modelo treinado quando houver ~200+ posts de histórico).

Para construir isso dia a dia com mais velocidade (rodar comandos, testar localmente, iterar no código), o ideal é usar o **Claude Code** — ele consegue instalar dependências, rodar o servidor, testar o fluxo de OAuth em loop, e versionar no Git, o que este ambiente de chat não faz.
