export default function Privacy() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 font-body text-ink">
      <h1 className="font-display text-2xl font-semibold mb-2">Privacy Policy</h1>
      <p className="text-sm text-ink-soft mb-8">Last updated: July 2026</p>

      <div className="flex flex-col gap-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-semibold mb-1">1. Data We Collect</h2>
          <p>We collect only the data necessary to provide the analytics service: your social media account identifiers, content metadata, and performance metrics from TikTok and LinkedIn.</p>
        </section>
        <section>
          <h2 className="font-semibold mb-1">2. How We Use Your Data</h2>
          <p>Your data is used solely to display analytics on your personal dashboard. We do not use it for advertising or share it with third parties.</p>
        </section>
        <section>
          <h2 className="font-semibold mb-1">3. Data Storage</h2>
          <p>Data is stored securely in Supabase. Access tokens are encrypted. You can request deletion of your data at any time.</p>
        </section>
        <section>
          <h2 className="font-semibold mb-1">4. Third-Party Services</h2>
          <p>We use TikTok API and LinkedIn API to access your content data. Your use of those platforms is governed by their respective privacy policies.</p>
        </section>
        <section>
          <h2 className="font-semibold mb-1">5. Your Rights</h2>
          <p>You can disconnect your accounts and request data deletion at any time by contacting alemonaco2023@gmail.com</p>
        </section>
      </div>
    </main>
  );
}
