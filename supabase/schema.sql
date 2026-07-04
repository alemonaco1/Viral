-- Viral Analytics — schema base
-- Rodar no SQL Editor do Supabase

create extension if not exists "uuid-ossp";

-- Uma linha por conta social conectada (TikTok ou LinkedIn)
create table if not exists connected_accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,                    -- dono da conta na sua plataforma (auth.users.id)
  platform text not null check (platform in ('tiktok', 'linkedin')),
  platform_account_id text not null,        -- open_id (TikTok) ou sub/urn (LinkedIn)
  display_name text,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  connected_at timestamptz default now(),
  unique (platform, platform_account_id)
);

-- Uma linha por conteúdo publicado (vídeo do TikTok ou post do LinkedIn)
create table if not exists posts (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references connected_accounts(id) on delete cascade,
  platform text not null,
  platform_post_id text not null,
  title text,
  caption text,
  duration_seconds integer,                 -- null para posts de texto (LinkedIn)
  format text,                              -- ex: 'storytime', 'talking_head', 'lista', 'texto'
  hook_type text,                           -- ex: 'pergunta', 'dado_chocante', 'afirmacao'
  cta_type text,
  published_at timestamptz,
  raw_payload jsonb,                        -- resposta bruta da API, para reprocessar depois
  unique (platform, platform_post_id)
);

-- Métricas — uma linha por snapshot de coleta (permite ver evolução no tempo)
create table if not exists post_metrics (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade,
  collected_at timestamptz default now(),
  reach integer,
  impressions integer,
  views integer,
  full_views integer,
  completion_rate numeric,
  avg_watch_time numeric,
  retention_curve jsonb,                    -- array de % por segundo: [100, 88, 79, ...]
  ctr numeric,
  shares integer,
  saves integer,
  comments integer,
  likes integer,
  new_followers integer,
  profile_clicks integer
);

-- Insights gerados pela IA (o "feed" do dashboard)
create table if not exists ai_insights (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  post_id uuid references posts(id) on delete set null,
  category text check (category in ('win', 'warning', 'tip')),
  message text not null,
  confidence text check (confidence in ('alta', 'media', 'baixa')),
  based_on_n_posts integer,
  created_at timestamptz default now()
);

create index if not exists idx_posts_account on posts(account_id);
create index if not exists idx_metrics_post on post_metrics(post_id);
create index if not exists idx_insights_user on ai_insights(user_id);
