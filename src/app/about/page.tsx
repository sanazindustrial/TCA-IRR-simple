export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-3xl mx-auto text-center">
        <img src="/tca-full-logo.svg" alt="TCA Venture Group" className="mx-auto mb-10 w-80 md:w-96" />
        <p className="text-lg md:text-xl text-slate-300 mb-4 leading-relaxed">
          Empowering investors and founders with AI-driven startup evaluation,
          real-time financial insights, and investor-grade reporting.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-amber-400 font-semibold mb-2">AI-Powered Analysis</h3>
            <p className="text-slate-400 text-sm">Deep startup evaluation using advanced financial models and market intelligence.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-amber-400 font-semibold mb-2">Investor-Grade Reports</h3>
            <p className="text-slate-400 text-sm">Generate professional IRR, NPV, and portfolio reports ready for board presentations.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-amber-400 font-semibold mb-2">Real-Time Insights</h3>
            <p className="text-slate-400 text-sm">Live dashboards tracking portfolio performance across all stages and sectors.</p>
          </div>
        </div>
        <a href="/login" className="inline-block bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-8 py-3 rounded-lg transition-colors">
          Sign In to Platform
        </a>
      </div>
    </main>
  );
}
