import "./globals.css";

export const metadata = {
  title: "Viral Analytics",
  description: "Analytics + IA para TikTok e LinkedIn",
  other: {
    "tiktok-developers-site-verification": "vBli2RrFIgDtNtEHV7kMukT0nQiDRvog",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#F7F8F6] text-[#12151A]">{children}</body>
    </html>
  );
}
