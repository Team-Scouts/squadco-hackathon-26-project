import heroImage from '../assets/verisphere-hero.png'
import { Link } from 'react-router-dom'

const metrics = [
  { label: 'Vendor profiles screened', value: '12,840' },
  { label: 'Risk signals connected', value: '48k+' },
  { label: 'Review cases resolved', value: '91%' },
]

const toneClasses = {
  safe: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  info: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  watch: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
} as const

type ModuleTone = keyof typeof toneClasses

const intelligenceModules: Array<{
  title: string
  detail: string
  score: string
  tone: ModuleTone
}> = [
  {
    title: 'Document Integrity',
    detail: 'OCR extraction, duplicate checks, and tamper-risk indicators for CAC and business documents.',
    score: '82',
    tone: 'safe',
  },
  {
    title: 'Squad Payment Signals',
    detail: 'Verification fees, payment metadata, transaction status, and webhook events become risk inputs.',
    score: '76',
    tone: 'info',
  },
  {
    title: 'Device Intelligence',
    detail: 'Browser fingerprint, timezone, IP history, and session velocity reveal suspicious reuse patterns.',
    score: '64',
    tone: 'watch',
  },
  {
    title: 'Trust Graph',
    detail: 'Vendors, accounts, devices, documents, and transactions are linked to expose hidden clusters.',
    score: '38',
    tone: 'danger',
  },
]

const workflowSteps = [
  'Capture vendor identity, business details, device consent, and uploaded documents.',
  'Initiate a Squad verification payment with vendor and risk-session metadata attached.',
  'Ingest webhook events, write relationships, and refresh document, device, network, and payment scores.',
  'Route each case to approve, review, or reject with evidence an operator can defend.',
]

const statusClasses = {
  'Low risk': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  Review: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  'High risk': 'bg-red-500/10 text-red-400 border border-red-500/20',
} as const

type VendorStatus = keyof typeof statusClasses

const vendorCases: Array<{
  name: string
  status: VendorStatus
  score: string
  signal: string
}> = [
  {
    name: 'Adenike Supplies Ltd',
    status: 'Low risk',
    score: '84',
    signal: 'Clean document hash, verified payment, and no shared account history.',
  },
  {
    name: 'Koro Market Services',
    status: 'Review',
    score: '59',
    signal: 'Shared device appears across three pending vendor applications.',
  },
  {
    name: 'Northline Exports',
    status: 'High risk',
    score: '24',
    signal: 'Reused bank account and duplicate CAC image detected in the graph.',
  },
]

const graphNodeBase =
  'absolute z-10 grid h-[74px] w-[74px] place-items-center rounded-full border border-white/20 bg-gray-900/80 backdrop-blur-md text-xs font-black shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-110'

const nodeGlowBase = 'absolute inset-0 rounded-full animate-ping-slow'

export default function Landing() {
  return (
    <div className="min-h-[100svh] bg-gray-950 text-gray-200 font-sans selection:bg-emerald-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/20 blur-[120px] animate-float-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/10 blur-[150px] animate-float-slower"></div>
      </div>

      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 flex min-h-[72px] items-center justify-between gap-6 border-b border-white/5 bg-gray-950/50 px-6 backdrop-blur-xl md:px-12">
        <a className="flex items-center gap-3 font-extrabold text-white no-underline transition-opacity hover:opacity-80" href="#top" aria-label="VeriSphere home">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-gray-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            V
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 transition-opacity hover:opacity-100"></div>
          </div>
          <span className="text-lg tracking-tight">VeriSphere</span>
        </a>
        <nav
          className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1.5 md:flex backdrop-blur-md"
          aria-label="Primary navigation"
        >
          <a className="inline-flex min-h-9 items-center rounded-full px-4 text-sm font-semibold text-gray-300 no-underline transition-all hover:bg-white/10 hover:text-white" href="#intelligence">
            Intelligence
          </a>
          <a className="inline-flex min-h-9 items-center rounded-full px-4 text-sm font-semibold text-gray-300 no-underline transition-all hover:bg-white/10 hover:text-white" href="#workflow">
            Workflow
          </a>
          <a className="inline-flex min-h-9 items-center rounded-full px-4 text-sm font-semibold text-gray-300 no-underline transition-all hover:bg-white/10 hover:text-white" href="#cases">
            Cases
          </a>
        </nav>
        <Link
          className="hidden min-h-10 items-center justify-center rounded-full bg-emerald-500 px-5 text-sm font-bold text-gray-950 no-underline shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:scale-105 sm:inline-flex"
          to="/auth"
        >
          Open Console
        </Link>
      </header>

      <main id="top" className="relative z-10">
        {/* Hero Section */}
        <section className="relative isolate grid min-h-[90svh] overflow-hidden px-6 pb-12 pt-24 md:px-12 md:pt-28">
          <div className="absolute inset-0 -z-30 opacity-20 mix-blend-screen">
             <img className="h-full w-full object-cover object-center [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)]" src={heroImage} alt="" />
          </div>
          
          <div className="w-full max-w-[720px] self-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              AI Trust Graph for Verified Actors
            </div>
            <h1 className="m-0 text-5xl font-black leading-[1.1] tracking-tight text-white sm:text-7xl lg:text-[88px]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-emerald-200 animate-pulse-glow">VeriSphere</span>
            </h1>
            <p className="mt-8 max-w-[640px] text-lg leading-relaxed text-gray-400 lg:text-xl">
              A fraud intelligence platform for screening vendors, documents, devices, bank accounts, and Squad
              payment activity before procurement or grant payouts move forward.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-emerald-500 px-8 text-base font-bold text-gray-950 no-underline shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-1 sm:w-auto"
                to="/auth"
              >
                Explore Platform
              </Link>
              <a
                className="glass-button inline-flex min-h-12 w-full items-center justify-center rounded-full px-8 text-base font-bold sm:w-auto hover:-translate-y-1"
                href="#workflow"
              >
                See Workflow
              </a>
            </div>
          </div>

          <div className="mt-20 grid gap-4 self-end sm:grid-cols-3 w-full max-w-[900px] animate-float">
            {metrics.map((metric) => (
              <div className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/10" key={metric.label}>
                <dt className="text-sm font-semibold text-gray-400">{metric.label}</dt>
                <dd className="mt-2 text-4xl font-black text-white tracking-tight">{metric.value}</dd>
              </div>
            ))}
          </div>
        </section>

        {/* Intelligence Section */}
        <section className="relative px-6 py-24 md:px-12 md:py-32" id="intelligence">
          <div className="mx-auto mb-16 w-full max-w-[980px]">
            <p className="mb-4 text-sm font-bold uppercase tracking-widest text-cyan-400">Live Verification Console</p>
            <h2 className="m-0 text-3xl font-black leading-tight tracking-tight text-white lg:text-5xl">
              One decision layer for onboarding, payment telemetry, and fraud-ring evidence.
            </h2>
          </div>

          <div className="mx-auto grid w-full max-w-[1200px] gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            {/* Console Preview Card */}
            <div className="glass-panel relative overflow-hidden rounded-3xl p-6 md:p-8" aria-label="Risk console preview">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 border-b border-white/10 pb-6">
                <div>
                  <span className="text-sm font-semibold text-gray-400">Current Case</span>
                  <h3 className="mt-2 text-2xl font-black text-white">State SME Procurement Batch</h3>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-sm font-bold text-amber-400 backdrop-blur-sm">
                  <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></div>
                  Review Required
                </span>
              </div>

              <div className="mt-8 grid gap-8 sm:flex sm:items-center">
                <div className="relative grid h-[160px] w-[160px] shrink-0 place-items-center rounded-full border-[12px] border-gray-800 md:h-[180px] md:w-[180px]">
                  {/* Faux progress rings */}
                  <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800" />
                    <circle cx="50" cy="50" r="44" stroke="url(#score-gradient)" strokeWidth="8" fill="transparent" strokeDasharray="276" strokeDashoffset="113" strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                    <defs>
                      <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="text-center relative z-10">
                    <span className="block text-5xl font-black leading-none text-white text-glow">59</span>
                    <small className="mt-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Trust Score</small>
                  </div>
                </div>
                <div className="grid flex-1 gap-3">
                  {[
                    ['Shared device cluster', 'High', 'text-red-400'],
                    ['Payment authenticity', 'Medium', 'text-amber-400'],
                    ['Document integrity', 'Low risk', 'text-emerald-400'],
                  ].map(([label, value, colorClass]) => (
                    <div className="flex justify-between items-center gap-4 rounded-xl bg-white/5 border border-white/5 p-4 transition-colors hover:bg-white/10" key={label}>
                      <span className="text-sm font-medium text-gray-300">{label}</span>
                      <strong className={`text-sm font-bold ${colorClass}`}>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust Graph Preview */}
              <div className="relative mt-8 hidden h-[300px] w-full overflow-hidden rounded-2xl border border-white/5 bg-gray-950 sm:block" aria-label="Trust graph preview">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0,transparent_100%)]"></div>
                
                {/* Connecting Lines */}
                <svg className="absolute inset-0 h-full w-full opacity-30" preserveAspectRatio="none">
                  <path d="M 80 80 Q 150 50 200 130 T 320 180" stroke="url(#line-gradient)" strokeWidth="2" fill="none" strokeDasharray="4 4" className="animate-pulse-glow" />
                  <path d="M 200 130 L 120 220" stroke="#f59e0b" strokeWidth="2" fill="none" strokeDasharray="4 4" />
                  <path d="M 200 130 L 280 240" stroke="#ef4444" strokeWidth="2" fill="none" strokeDasharray="4 4" />
                  <defs>
                    <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Nodes */}
                <div className={`${graphNodeBase} left-[40px] top-[40px]`}>
                  <div className={`${nodeGlowBase} bg-emerald-500/20`}></div>
                  <span className="text-emerald-400">Vendor</span>
                </div>
                <div className={`${graphNodeBase} left-[160px] top-[90px] shadow-[0_0_20px_rgba(245,158,11,0.3)] border-amber-500/30`}>
                  <div className={`${nodeGlowBase} bg-amber-500/20`}></div>
                  <span className="text-amber-400">Device</span>
                </div>
                <div className={`${graphNodeBase} left-[80px] top-[180px]`}>
                  <div className={`${nodeGlowBase} bg-cyan-500/20`}></div>
                  <span className="text-cyan-400">Account</span>
                </div>
                <div className={`${graphNodeBase} left-[240px] top-[200px] shadow-[0_0_20px_rgba(239,68,68,0.3)] border-red-500/30`}>
                  <div className={`${nodeGlowBase} bg-red-500/20`}></div>
                  <span className="text-red-400">Doc</span>
                </div>
                <div className={`${graphNodeBase} left-[280px] top-[140px]`}>
                  <div className={`${nodeGlowBase} bg-emerald-500/20`}></div>
                  <span className="text-emerald-400">Vendor</span>
                </div>
              </div>
            </div>

            {/* Modules List */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {intelligenceModules.map((module) => (
                <article className="glass-panel group relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)]" key={module.title}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-lg font-bold text-white leading-tight">{module.title}</h3>
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-sm ${toneClasses[module.tone]}`}>
                        {module.score}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-gray-400">{module.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section className="relative px-6 py-24 md:px-12 md:py-32" id="workflow">
          <div className="absolute inset-0 -z-10 bg-gray-900/50 skew-y-3 transform origin-bottom-left"></div>
          
          <div className="mx-auto mb-16 w-full max-w-[980px]">
            <p className="mb-4 text-sm font-bold uppercase tracking-widest text-emerald-400">MVP Flow</p>
            <h2 className="m-0 text-3xl font-black leading-tight tracking-tight text-white lg:text-5xl">
              From vendor intake to explainable clearance.
            </h2>
          </div>

          <div className="mx-auto grid w-full max-w-[1200px] gap-6 lg:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <article className="glass-panel group relative rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 hover:bg-white/10" key={step}>
                <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xl font-black text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-gray-950 transition-all duration-300">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <p className="text-base leading-relaxed text-gray-300 group-hover:text-white transition-colors">{step}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Cases Section */}
        <section className="relative px-6 py-24 md:px-12 md:py-32" id="cases">
          <div className="mx-auto mb-16 w-full max-w-[980px]">
            <p className="mb-4 text-sm font-bold uppercase tracking-widest text-cyan-400">Operator View</p>
            <h2 className="m-0 text-3xl font-black leading-tight tracking-tight text-white lg:text-5xl">
              Clean vendors and suspicious clusters separate quickly.
            </h2>
          </div>

          <div className="mx-auto w-full max-w-[1200px] overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl" role="table" aria-label="Vendor risk cases">
            <div className="hidden grid-cols-[1.2fr_0.8fr_0.6fr_2fr] items-center gap-6 border-b border-white/10 bg-black/40 px-8 py-5 text-xs font-black uppercase tracking-wider text-gray-400 md:grid" role="row">
              <span role="columnheader">Vendor</span>
              <span role="columnheader">Decision</span>
              <span role="columnheader">Score</span>
              <span role="columnheader">Primary Signal</span>
            </div>
            {vendorCases.map((vendor) => (
              <div className="grid gap-4 border-b border-white/5 px-8 py-6 last:border-0 md:grid-cols-[1.2fr_0.8fr_0.6fr_2fr] md:items-center md:gap-6 hover:bg-white/5 transition-colors" role="row" key={vendor.name}>
                <span className="min-w-0 font-bold text-white text-base" role="cell">
                  {vendor.name}
                </span>
                <span role="cell" className="flex items-center">
                  <span className={`inline-flex min-h-8 items-center rounded-full px-4 text-xs font-bold uppercase tracking-wider ${statusClasses[vendor.status]}`}>
                    {vendor.status}
                  </span>
                </span>
                <span className="min-w-0 text-xl font-black text-white" role="cell">
                  {vendor.score}
                </span>
                <span className="min-w-0 text-sm text-gray-400 leading-relaxed" role="cell">
                  {vendor.signal}
                </span>
              </div>
            ))}
          </div>
        </section>
        
        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/50 px-6 py-12 md:px-12 text-center text-sm text-gray-500">
          <p>© 2026 VeriSphere Platform. All rights reserved.</p>
        </footer>
      </main>
    </div>
  )
}
