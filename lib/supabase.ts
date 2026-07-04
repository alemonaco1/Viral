import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Client com service role — usado apenas em rotas de servidor (API routes).
// NUNCA importar isso em componentes client-side.
//
// Criado sob demanda (lazy) em vez de no topo do módulo: assim o `next build`
// não quebra quando as variáveis de ambiente ainda não foram preenchidas
// (ex: antes de configurar o Supabase pela primeira vez), e o erro só
// aparece quando a rota é de fato chamada em runtime.
let _client: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase não configurado: preencha NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local"
    );
  }

  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

// Proxy que adia a criação real do client até o primeiro uso de qualquer
// método (ex: supabaseAdmin.from(...)), mantendo a mesma API de antes
// nos outros arquivos (sem precisar trocar `supabaseAdmin.from` por
// `getSupabaseAdmin().from` em todo lugar).
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    // @ts-expect-error - acesso dinâmico de propriedade do client real
    return client[prop];
  },
});
