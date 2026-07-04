export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Viral Analytics</h1>
      <p className="text-[#5B6470] max-w-md text-center text-sm">
        Conecte suas contas para começar a coletar dados reais e gerar insights com IA.
      </p>
      <div className="flex gap-3">
        <a href="/api/auth/tiktok" className="px-5 py-2.5 rounded-lg bg-[#12151A] text-white text-sm font-medium">
          Conectar TikTok
        </a>
        <a href="/api/auth/linkedin" className="px-5 py-2.5 rounded-lg bg-[#0A66C2] text-white text-sm font-medium">
          Conectar LinkedIn
        </a>
      </div>
      <a href="/dashboard" className="text-xs text-[#5B6470] underline mt-4">
        Já conectei — ir para o painel
      </a>
    </main>
  );
}
