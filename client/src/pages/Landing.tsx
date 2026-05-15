import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

/* ── data ── */
const metrics = [
  { label: "Profiles Scanned", value: "12,840", icon: "⬡" },
  { label: "Risk Signals", value: "48k+", icon: "◈" },
  { label: "Cases Resolved", value: "91%", icon: "◉" },
];

const modules = [
  { title: "Document Integrity", detail: "OCR extraction, duplicate checks, and tamper-risk indicators for CAC and business documents.", score: "82", color: "#00ff41" },
  { title: "Squad Payment Signals", detail: "Verification fees, payment metadata, transaction status, and webhook events become risk inputs.", score: "76", color: "#00d4ff" },
  { title: "Device Intelligence", detail: "Browser fingerprint, timezone, IP history, and session velocity reveal suspicious reuse patterns.", score: "64", color: "#f59e0b" },
  { title: "Trust Graph", detail: "Vendors, accounts, devices, documents, and transactions are linked to expose hidden clusters.", score: "38", color: "#ff006e" },
];

const steps = [
  { title: "INTAKE", text: "Capture vendor identity, business details, device consent, and uploaded documents." },
  { title: "VERIFY", text: "Initiate a Squad verification payment with vendor and risk-session metadata attached." },
  { title: "ANALYZE", text: "Ingest webhook events, write relationships, and refresh document, device, network, and payment scores." },
  { title: "DECIDE", text: "Route each case to approve, review, or reject with evidence an operator can defend." },
];

const cases = [
  { name: "Adenike Supplies Ltd", status: "CLEAR", score: "84", signal: "Clean document hash, verified payment, no shared account history.", color: "#00ff41" },
  { name: "Koro Market Services", status: "REVIEW", score: "59", signal: "Shared device appears across three pending vendor applications.", color: "#f59e0b" },
  { name: "Northline Exports", status: "THREAT", score: "24", signal: "Reused bank account and duplicate CAC image detected in the graph.", color: "#ff006e" },
];

/* ── matrix rain canvas ── */
function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let w = (c.width = window.innerWidth);
    let h = (c.height = window.innerHeight);
    const cols = Math.floor(w / 20);
    const drops = Array(cols).fill(1);
    const chars = "01アイウエオカキクケコサシスセソVERISPHERE";
    const draw = () => {
      ctx.fillStyle = "rgba(10,10,15,0.05)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(0,255,65,0.15)";
      ctx.font = "14px monospace";
      for (let i = 0; i < drops.length; i++) {
        const t = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(t, i * 20, drops[i] * 20);
        if (drops[i] * 20 > h && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };
    const id = setInterval(draw, 50);
    const resize = () => { w = c.width = window.innerWidth; h = c.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { clearInterval(id); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="fixed inset-0 z-0 pointer-events-none opacity-60" />;
}

/* ── cycling typing text ── */
const heroLines = [
  "Screening vendors, documents, devices, and bank accounts in real-time.",
  "AI-powered trust graphs exposing hidden fraud rings before payouts.",
  "Squad payment telemetry transformed into actionable risk signals.",
  "Document forgery detection with OCR extraction and tamper analysis.",
  "Device fingerprinting that traces suspicious session reuse patterns.",
  "Explainable clearance decisions operators can audit and defend.",
];

function TypingText({ lines, delay = 0 }: { lines: string[]; delay?: number }) {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    const current = lines[lineIdx];

    if (!deleting && charIdx <= current.length) {
      // typing
      const t = setTimeout(() => {
        if (charIdx === current.length) {
          // pause at end before deleting
          setTimeout(() => setDeleting(true), 2000);
        } else {
          setCharIdx((c) => c + 1);
        }
      }, 40);
      return () => clearTimeout(t);
    }

    if (deleting && charIdx >= 0) {
      // erasing
      const t = setTimeout(() => {
        if (charIdx === 0) {
          setDeleting(false);
          setLineIdx((l) => (l + 1) % lines.length);
        } else {
          setCharIdx((c) => c - 1);
        }
      }, 20);
      return () => clearTimeout(t);
    }
  }, [charIdx, deleting, lineIdx, lines, started]);

  const current = lines[lineIdx];
  return (
    <>
      {started ? current.slice(0, charIdx) : ""}
      <span className="animate-cursor-blink text-cyber-green">█</span>
    </>
  );
}

/* ── hex ring svg ── */
function HexRing({ size = 300, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={className}>
      <defs>
        <linearGradient id="hex-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00ff41" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <polygon points="100,10 178,55 178,145 100,190 22,145 22,55" fill="none" stroke="url(#hex-grad)" strokeWidth="1" />
      <polygon points="100,30 160,65 160,135 100,170 40,135 40,65" fill="none" stroke="rgba(0,255,65,0.15)" strokeWidth="0.5" />
    </svg>
  );
}

/* ── main ── */
export default function Landing() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div className="min-h-svh bg-[#0a0a0f] text-gray-200 font-sans scanlines cyber-grid overflow-x-hidden">
      <MatrixRain />

      {/* Ambient glows */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#00ff41]/5 blur-[150px] animate-float-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#00d4ff]/5 blur-[180px] animate-float-slower" />
        <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] rounded-full bg-[#a855f7]/5 blur-[120px] animate-float" />
      </div>

      {/* ━━ HEADER ━━ */}
      <header className={`fixed inset-x-0 top-0 z-50 flex min-h-16 items-center justify-between gap-6 px-6 md:px-12 transition-all duration-500 ${scrollY > 50 ? "bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-[#00ff41]/10" : "bg-transparent"}`}>
        <a className="flex items-center gap-3 font-extrabold text-white no-underline group" href="#top">
          <div className="relative grid h-9 w-9 place-items-center rounded-lg bg-[#0a0a0f] border border-[#00ff41]/40 text-[#00ff41] font-mono text-sm animate-neon-pulse group-hover:border-[#00ff41]/80 transition-all">
            V
          </div>
          <span className="text-lg tracking-tight font-mono">
            <span className="text-[#00ff41]">Veri</span>
            <span className="text-[#00d4ff]">Sphere</span>
          </span>
        </a>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {["Intelligence", "Workflow", "Cases"].map((item) => (
            <a key={item} className="inline-flex min-h-9 items-center rounded px-4 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 no-underline transition-all hover:text-[#00ff41] hover:bg-[#00ff41]/5 font-mono" href={`#${item.toLowerCase()}`}>
              [{item}]
            </a>
          ))}
        </nav>
        <Link className="hidden min-h-10 items-center justify-center rounded border border-[#00ff41]/40 bg-[#00ff41]/10 px-6 text-xs font-bold uppercase tracking-[0.2em] text-[#00ff41] no-underline transition-all hover:bg-[#00ff41]/20 hover:border-[#00ff41]/80 hover:shadow-[0_0_20px_rgba(0,255,65,0.2)] font-mono sm:inline-flex" to="/auth">
          &gt; Access Console
        </Link>
      </header>

      <main id="top" className="relative z-10">
        {/* ━━ HERO ━━ */}
        <section className="relative isolate min-h-[100svh] flex flex-col justify-center px-6 pt-24 pb-16 md:px-12">
          {/* Rotating hex rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20">
            <HexRing size={600} className="animate-rotate-slow" />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10">
            <HexRing size={800} className="animate-rotate-reverse" />
          </div>

          <div className="w-full max-w-4xl mx-auto relative">
            {/* Terminal-style badge */}
            <div className="mb-8 inline-flex items-center gap-3 rounded border border-[#00ff41]/20 bg-[#00ff41]/5 px-4 py-2 font-mono text-xs text-[#00ff41] animate-fade-in-up backdrop-blur-sm">
              <span className="flex h-2 w-2"><span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-[#00ff41] opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#00ff41]" /></span>
              <span className="opacity-60">[SYS]</span> AI Trust Graph for Verified Actors
            </div>

            {/* Main heading with glitch */}
            <h1 className="m-0 text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl animate-fade-in-up" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
              <span className="block text-white/90 animate-glitch-subtle">VERI</span>
              <span className="block text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, #00ff41, #00d4ff, #a855f7)" }}>
                SPHERE
              </span>
            </h1>

            {/* Subtitle with typing */}
            <div className="mt-8 max-w-2xl font-mono text-sm md:text-base leading-relaxed text-gray-500 animate-fade-in-up h-14" style={{ animationDelay: "600ms", animationFillMode: "both" }}>
              <span className="text-cyber-green/60">&gt; </span>
              <TypingText lines={heroLines} delay={1200} />
            </div>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-wrap items-center gap-4 animate-fade-in-up" style={{ animationDelay: "800ms", animationFillMode: "both" }}>
              <Link className="group relative inline-flex min-h-12 items-center justify-center rounded border border-[#00ff41]/50 bg-[#00ff41]/10 px-8 text-sm font-bold uppercase tracking-[0.15em] text-[#00ff41] no-underline font-mono transition-all hover:bg-[#00ff41]/20 hover:shadow-[0_0_30px_rgba(0,255,65,0.2)] hover:-translate-y-0.5" to="/auth">
                <span className="mr-2 opacity-60">&gt;</span> Explore_Platform
                <div className="absolute inset-0 rounded border border-[#00ff41]/0 group-hover:border-[#00ff41]/30 transition-all" />
              </Link>
              <a className="inline-flex min-h-12 items-center justify-center rounded border border-white/10 bg-white/5 px-8 text-sm font-bold uppercase tracking-[0.15em] text-gray-400 no-underline font-mono transition-all hover:border-[#00d4ff]/30 hover:text-[#00d4ff] hover:bg-[#00d4ff]/5 hover:-translate-y-0.5 backdrop-blur-sm" href="#workflow">
                See_Workflow
              </a>
            </div>
          </div>

          {/* Metrics bar */}
          <div className="mt-auto pt-16 w-full max-w-4xl mx-auto">
            <div className="grid gap-4 sm:grid-cols-3 animate-fade-in-up" style={{ animationDelay: "1000ms", animationFillMode: "both" }}>
              {metrics.map((m, i) => (
                <div key={m.label} className="group rounded border border-white/5 bg-white/[0.02] p-5 backdrop-blur-sm transition-all duration-500 hover:border-[#00ff41]/20 hover:bg-[#00ff41]/[0.03]" style={{ animationDelay: `${1000 + i * 150}ms` }}>
                  <div className="flex items-center gap-2 text-xs font-mono text-gray-600 uppercase tracking-wider">
                    <span className="text-[#00ff41]/40">{m.icon}</span> {m.label}
                  </div>
                  <div className="mt-2 text-3xl font-black text-white font-mono tracking-tight group-hover:text-[#00ff41] transition-colors">
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scan line decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00ff41]/20 to-transparent" />
        </section>

        {/* ━━ INTELLIGENCE ━━ */}
        <section className="relative px-6 py-24 md:px-12 md:py-32" id="intelligence">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d4ff]/20 to-transparent" />
          </div>

          <div className="mx-auto mb-16 w-full max-w-4xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-[#00d4ff] font-mono">
              <span className="opacity-50">[</span>Live Verification Console<span className="opacity-50">]</span>
            </p>
            <h2 className="m-0 text-3xl font-black leading-tight tracking-tight text-white lg:text-5xl">
              One decision layer for onboarding, payment telemetry, and fraud-ring evidence.
            </h2>
          </div>

          {/* Console card */}
          <div className="mx-auto w-full max-w-5xl rounded border border-white/10 bg-[#0d0d14]/80 backdrop-blur-xl overflow-hidden animate-neon-pulse-blue">
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-5 py-3 bg-black/40 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-[#ff006e]/60" />
                <div className="h-3 w-3 rounded-full bg-[#f59e0b]/60" />
                <div className="h-3 w-3 rounded-full bg-[#00ff41]/60" />
              </div>
              <span className="ml-3 text-[10px] font-mono text-gray-600 uppercase tracking-wider">verisphere://risk-console</span>
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 border-b border-white/5 pb-6">
                <div>
                  <span className="text-xs font-mono text-gray-600 uppercase tracking-wider">&gt; active_case</span>
                  <h3 className="mt-2 text-xl font-black text-white font-mono">State SME Procurement Batch</h3>
                </div>
                <span className="inline-flex items-center gap-2 rounded border border-[#f59e0b]/20 bg-[#f59e0b]/5 px-3 py-1.5 text-xs font-bold text-[#f59e0b] font-mono uppercase tracking-wider">
                  <div className="h-2 w-2 rounded-full bg-[#f59e0b] animate-pulse" />
                  Review_Required
                </span>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-[auto_1fr]">
                {/* Score ring */}
                <div className="relative grid h-36 w-36 shrink-0 place-items-center mx-auto sm:mx-0">
                  <svg className="absolute inset-0 h-full w-full -rotate-90 animate-rotate-slow" style={{ animationDuration: "30s" }} viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
                    <circle cx="50" cy="50" r="44" stroke="url(#sg)" strokeWidth="6" fill="transparent" strokeDasharray="276" strokeDashoffset="113" strokeLinecap="round" />
                    <defs><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#00ff41" /></linearGradient></defs>
                  </svg>
                  <div className="text-center relative z-10">
                    <span className="block text-4xl font-black leading-none text-white font-mono text-glow">59</span>
                    <small className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">Trust Score</small>
                  </div>
                </div>

                <div className="grid gap-2">
                  {[["Shared device cluster", "HIGH", "#ff006e"], ["Payment authenticity", "MED", "#f59e0b"], ["Document integrity", "LOW", "#00ff41"]].map(([label, value, color]) => (
                    <div className="flex justify-between items-center gap-4 rounded border border-white/5 bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.05] group" key={label}>
                      <span className="text-sm font-mono text-gray-400 group-hover:text-gray-200 transition-colors">{label}</span>
                      <strong className="text-xs font-bold font-mono px-2 py-0.5 rounded" style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Module cards */}
          <div className="mx-auto mt-8 w-full max-w-5xl grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((mod, i) => (
              <article key={mod.title} className="group rounded border border-white/5 bg-white/[0.02] backdrop-blur-sm p-5 transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.04]" style={{ animationDelay: `${i * 100}ms`, borderColor: `${mod.color}00`, transition: "all 0.5s" }} onMouseEnter={e => (e.currentTarget.style.borderColor = `${mod.color}30`)} onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)")}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-bold text-white font-mono leading-tight">{mod.title}</h3>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded font-mono font-black text-xs" style={{ color: mod.color, backgroundColor: `${mod.color}10`, border: `1px solid ${mod.color}20` }}>
                    {mod.score}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-gray-500">{mod.detail}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ━━ WORKFLOW ━━ */}
        <section className="relative px-6 py-24 md:px-12 md:py-32" id="workflow">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00ff41]/20 to-transparent" />
          </div>

          <div className="mx-auto mb-16 w-full max-w-4xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-[#00ff41] font-mono">
              <span className="opacity-50">[</span>Protocol Sequence<span className="opacity-50">]</span>
            </p>
            <h2 className="m-0 text-3xl font-black leading-tight tracking-tight text-white lg:text-5xl">
              From vendor intake to explainable clearance.
            </h2>
          </div>

          <div className="mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-4">
            {steps.map((step, i) => (
              <article key={step.title} className="group relative rounded border border-white/5 bg-white/[0.02] backdrop-blur-sm p-6 transition-all duration-500 hover:-translate-y-2 hover:border-[#00ff41]/20 hover:bg-[#00ff41]/[0.02] overflow-hidden">
                {/* Step number */}
                <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded border border-[#00ff41]/20 bg-[#00ff41]/5 text-sm font-black text-[#00ff41] font-mono group-hover:bg-[#00ff41] group-hover:text-[#0a0a0f] group-hover:border-[#00ff41] transition-all duration-300">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#00ff41]/60 font-mono group-hover:text-[#00ff41] transition-colors">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500 group-hover:text-gray-300 transition-colors">{step.text}</p>
                {/* Connection line */}
                {i < 3 && <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-px bg-gradient-to-r from-[#00ff41]/20 to-transparent" />}
              </article>
            ))}
          </div>
        </section>

        {/* ━━ CASES ━━ */}
        <section className="relative px-6 py-24 md:px-12 md:py-32" id="cases">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d4ff]/20 to-transparent" />
          </div>

          <div className="mx-auto mb-16 w-full max-w-4xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-[#00d4ff] font-mono">
              <span className="opacity-50">[</span>Operator View<span className="opacity-50">]</span>
            </p>
            <h2 className="m-0 text-3xl font-black leading-tight tracking-tight text-white lg:text-5xl">
              Clean vendors and suspicious clusters separate quickly.
            </h2>
          </div>

          <div className="mx-auto w-full max-w-5xl rounded border border-white/10 bg-[#0d0d14]/80 backdrop-blur-xl overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1.2fr_0.8fr_0.6fr_2fr] items-center gap-6 border-b border-white/5 bg-black/40 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 font-mono">
              <span>Vendor</span><span>Status</span><span>Score</span><span>Primary Signal</span>
            </div>

            {cases.map((c) => (
              <div key={c.name} className="grid gap-3 border-b border-white/5 last:border-0 px-6 py-5 md:grid-cols-[1.2fr_0.8fr_0.6fr_2fr] md:items-center md:gap-6 hover:bg-white/[0.02] transition-colors group">
                <span className="font-bold text-white text-sm font-mono group-hover:text-[#00d4ff] transition-colors">{c.name}</span>
                <span className="flex items-center">
                  <span className="inline-flex items-center rounded px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] font-mono" style={{ color: c.color, backgroundColor: `${c.color}10`, border: `1px solid ${c.color}20` }}>
                    {c.status}
                  </span>
                </span>
                <span className="text-lg font-black text-white font-mono">{c.score}</span>
                <span className="text-xs text-gray-500 leading-relaxed">{c.signal}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ━━ FOOTER ━━ */}
        <footer className="relative border-t border-white/5 bg-black/30 px-6 py-12 md:px-12 text-center">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00ff41]/10 to-transparent" />
          <p className="text-xs text-gray-600 font-mono">
            <span className="text-[#00ff41]/30">&gt;</span> © 2026 VeriSphere Platform. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
