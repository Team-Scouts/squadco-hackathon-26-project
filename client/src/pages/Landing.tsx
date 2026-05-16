import { Link } from "react-router-dom";
import {
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent,
} from "react";

/* ── data ── */
const metrics = [
  { label: "Profiles Scanned", value: "12,840", icon: "⬡" },
  { label: "Risk Signals", value: "48k+", icon: "◈" },
  { label: "Cases Resolved", value: "91%", icon: "◉" },
];

function metricAccent(label: string) {
  if (label.includes("Profiles")) return "#38bdf8";
  if (label.includes("Risk")) return "#a78bfa";
  return "#22c55e";
}

const modules = [
  { title: "Document Integrity", detail: "OCR extraction, duplicate checks, and tamper-risk indicators for CAC and business documents.", score: "82", color: "#a78bfa" },
  { title: "Squad Payment Signals", detail: "Verification fees, payment metadata, transaction status, and webhook events become risk inputs.", score: "76", color: "#38bdf8" },
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
  { name: "Adenike Supplies Ltd", status: "CLEAR", score: "84", signal: "Clean document hash, verified payment, no shared account history.", color: "#22c55e" },
  { name: "Koro Market Services", status: "REVIEW", score: "59", signal: "Shared device appears across three pending vendor applications.", color: "#f59e0b" },
  { name: "Northline Exports", status: "THREAT", score: "24", signal: "Reused bank account and duplicate CAC image detected in the graph.", color: "#ff006e" },
];

/* ── matrix rain canvas ── */
type MousePoint = {
  x: number;
  y: number;
};

function MatrixRain({ mouseRef }: { mouseRef: MutableRefObject<MousePoint> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let w = (c.width = window.innerWidth);
    let h = (c.height = window.innerHeight);
    const cols = Math.floor(w / 20);
    const drops = Array(cols).fill(1);
    const chars = "01アイウエオカキクケコサシスセソFRAUDLENS";
    const draw = () => {
      ctx.fillStyle = "rgba(10,10,15,0.05)";
      ctx.fillRect(0, 0, w, h);
      ctx.font = "14px monospace";
      for (let i = 0; i < drops.length; i++) {
        const t = chars[Math.floor(Math.random() * chars.length)];
        const x = i * 20;
        const y = drops[i] * 20;
        const distanceFromMouse = Math.hypot(mouseRef.current.x - x, mouseRef.current.y - y);
        const reactive = distanceFromMouse < 170;

        ctx.fillStyle = reactive ? "rgba(255,255,255,0.38)" : "rgba(255,255,255,0.13)";
        ctx.shadowBlur = reactive ? 12 : 0;
        ctx.shadowColor = reactive ? "rgba(255,255,255,0.42)" : "transparent";
        ctx.fillText(t, x, y);
        if (drops[i] * 20 > h && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      ctx.shadowBlur = 0;
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
      <span className="animate-cursor-blink text-zinc-200">█</span>
    </>
  );
}

/* ── hex ring svg ── */
function HexRing({ size = 300, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={className}>
      <defs>
        <linearGradient id="hex-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4f4f5" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#71717a" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <polygon points="100,10 178,55 178,145 100,190 22,145 22,55" fill="none" stroke="url(#hex-grad)" strokeWidth="1" />
      <polygon points="100,30 160,65 160,135 100,170 40,135 40,65" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
    </svg>
  );
}

/* ── main ── */
function SectionBoundary({
  label,
  tone = "sky",
}: {
  label: string;
  tone?: "sky" | "violet" | "rose";
}) {
  const toneClasses = {
    sky: "border-sky-300/25 bg-sky-300/10 text-sky-100 shadow-[0_0_28px_rgba(56,189,248,0.12)]",
    violet:
      "border-violet-300/25 bg-violet-300/10 text-violet-100 shadow-[0_0_28px_rgba(167,139,250,0.12)]",
    rose: "border-rose-400/25 bg-rose-400/10 text-rose-100 shadow-[0_0_28px_rgba(244,63,94,0.12)]",
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
      <div className="h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 md:px-0">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-white/20" />
        <span
          className={`-mt-px rounded-b border border-t-0 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] backdrop-blur-xl ${toneClasses[tone]}`}
        >
          {label}
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/10 to-white/20" />
      </div>
    </div>
  );
}

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);
  const mouseRef = useRef<MousePoint>({ x: -9999, y: -9999 });

  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    mouseRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.style.setProperty("--mouse-x", `${event.clientX}px`);
    event.currentTarget.style.setProperty("--mouse-y", `${event.clientY}px`);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    mouseRef.current = { x: -9999, y: -9999 };
    event.currentTarget.style.setProperty("--mouse-x", "-9999px");
    event.currentTarget.style.setProperty("--mouse-y", "-9999px");
  };

  return (
    <div
      className="min-h-svh bg-[#0a0a0f] text-gray-200 font-sans scanlines cyber-grid overflow-x-hidden"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <MatrixRain mouseRef={mouseRef} />
      <div
        className="pointer-events-none fixed left-0 top-0 z-[60] h-64 w-64 rounded-full opacity-80 blur-2xl mix-blend-screen"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(56,189,248,0.11) 34%, rgba(167,139,250,0.055) 52%, transparent 72%)",
          transform:
            "translate3d(var(--mouse-x, -9999px), var(--mouse-y, -9999px), 0) translate(-50%, -50%)",
        }}
      />

      {/* Ambient glows */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-sky-300/[0.075] blur-[150px] animate-float-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-300/[0.065] blur-[180px] animate-float-slower" />
        <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] rounded-full bg-rose-400/[0.045] blur-[120px] animate-float" />
      </div>

      {/* ━━ HEADER ━━ */}
      <header className={`fixed inset-x-0 top-0 z-50 flex min-h-16 items-center justify-between gap-6 px-6 md:px-12 transition-all duration-500 ${scrollY > 50 ? "bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/10" : "bg-transparent"}`}>
        <a className="flex items-center gap-3 font-extrabold text-white no-underline group" href="#top">
          <div className="relative grid h-9 w-9 place-items-center rounded-lg bg-[#0a0a0f] border border-white/30 text-white font-mono text-sm animate-neon-pulse group-hover:border-white/70 transition-all">
            F
          </div>
          <span className="text-lg tracking-tight font-mono">
            <span className="text-white">Fraud</span>
            <span className="text-zinc-400">Lens</span>
          </span>
        </a>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {["Intelligence", "Workflow", "Cases"].map((item) => (
            <a key={item} className="inline-flex min-h-9 items-center rounded px-4 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 no-underline transition-all hover:text-white hover:bg-white/5 font-mono" href={`#${item.toLowerCase()}`}>
              [{item}]
            </a>
          ))}
        </nav>
        <Link className="hidden min-h-10 items-center justify-center rounded border border-white/30 bg-white/10 px-6 text-xs font-bold uppercase tracking-[0.2em] text-white no-underline transition-all hover:bg-white/15 hover:border-white/70 hover:shadow-[0_0_20px_rgba(255,255,255,0.16)] font-mono sm:inline-flex" to="/auth">
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
            <div className="mb-8 inline-flex items-center gap-3 rounded border border-sky-300/20 bg-sky-300/5 px-4 py-2 font-mono text-xs text-sky-100 animate-fade-in-up backdrop-blur-sm">
              <span className="flex h-2 w-2"><span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-sky-300 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-sky-300" /></span>
              <span className="opacity-60">[SYS]</span> AI Trust Graph for Verified Actors
            </div>

            {/* Main heading with glitch */}
            <h1 className="m-0 text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl animate-fade-in-up" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
              <span className="block text-white/90 animate-glitch-subtle">FRAUD</span>
              <span className="block text-sky-200">
                LENS
              </span>
            </h1>

            {/* Subtitle with typing */}
            <div className="mt-8 max-w-2xl font-mono text-sm md:text-base leading-relaxed text-gray-500 animate-fade-in-up h-14" style={{ animationDelay: "600ms", animationFillMode: "both" }}>
              <span className="text-zinc-400">&gt; </span>
              <TypingText lines={heroLines} delay={1200} />
            </div>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-wrap items-center gap-4 animate-fade-in-up" style={{ animationDelay: "800ms", animationFillMode: "both" }}>
              <Link className="group relative inline-flex min-h-12 items-center justify-center rounded border border-sky-300/45 bg-sky-300/10 px-8 text-sm font-bold uppercase tracking-[0.15em] text-sky-100 no-underline font-mono transition-all hover:bg-sky-300/15 hover:shadow-[0_0_30px_rgba(56,189,248,0.2)] hover:-translate-y-0.5" to="/auth">
                <span className="mr-2 opacity-60">&gt;</span> Explore_Platform
                <div className="absolute inset-0 rounded border border-sky-300/0 group-hover:border-sky-300/30 transition-all" />
              </Link>
              <a className="inline-flex min-h-12 items-center justify-center rounded border border-violet-300/20 bg-violet-300/5 px-8 text-sm font-bold uppercase tracking-[0.15em] text-violet-100/80 no-underline font-mono transition-all hover:border-violet-300/35 hover:text-violet-100 hover:bg-violet-300/10 hover:-translate-y-0.5 backdrop-blur-sm" href="#workflow">
                See_Workflow
              </a>
            </div>
          </div>

          {/* Metrics bar */}
          <div className="mt-auto pt-16 w-full max-w-4xl mx-auto">
            <div className="grid gap-4 sm:grid-cols-3 animate-fade-in-up" style={{ animationDelay: "1000ms", animationFillMode: "both" }}>
              {metrics.map((m, i) => (
                <div key={m.label} className="group rounded border border-white/5 bg-white/[0.02] p-5 backdrop-blur-sm transition-all duration-500 hover:border-white/20 hover:bg-white/[0.045]" style={{ animationDelay: `${1000 + i * 150}ms` }}>
                  <div className="flex items-center gap-2 text-xs font-mono text-gray-600 uppercase tracking-wider">
                    <span style={{ color: metricAccent(m.label) }}>{m.icon}</span> {m.label}
                  </div>
                  <div
                    className="mt-2 text-3xl font-black font-mono tracking-tight transition-colors"
                    style={{ color: metricAccent(m.label) }}
                  >
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scan line decoration */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
            <div className="mx-auto flex max-w-5xl items-center justify-center px-6">
              <span className="-translate-y-1/2 rounded border border-white/15 bg-black/60 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-300 backdrop-blur-xl">
                Scroll / Live Intelligence
              </span>
            </div>
          </div>
        </section>

        {/* ━━ INTELLIGENCE ━━ */}
        <section className="relative border-t border-white/10 bg-black/20 px-6 py-24 md:px-12 md:py-32" id="intelligence">
          <SectionBoundary label="01 / Intelligence" tone="sky" />

          <div className="mx-auto mb-16 w-full max-w-4xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-sky-200 font-mono">
              <span className="opacity-50">[</span>Live Verification Console<span className="opacity-50">]</span>
            </p>
            <h2 className="m-0 text-3xl font-black leading-tight tracking-tight text-white lg:text-5xl">
              One decision layer for onboarding, payment telemetry, and fraud-ring evidence.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-500">
              FraudLens consolidates the signals reviewers need before approving a vendor: identity, documents, devices, payment proof, and graph relationships.
            </p>
          </div>

          {/* Console card */}
          <div className="mx-auto w-full max-w-5xl rounded border border-sky-300/15 bg-[#0d0d14]/85 backdrop-blur-xl overflow-hidden animate-neon-pulse-blue shadow-[0_24px_90px_rgba(0,0,0,0.45),0_0_70px_rgba(56,189,248,0.08)]">
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-5 py-3 bg-black/40 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-[#ff006e]/60" />
                <div className="h-3 w-3 rounded-full bg-[#f59e0b]/60" />
                <div className="h-3 w-3 rounded-full bg-zinc-300/60" />
              </div>
              <span className="ml-3 text-[10px] font-mono text-gray-600 uppercase tracking-wider">fraudlens://risk-console</span>
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
                    <defs><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#f4f4f5" /></linearGradient></defs>
                  </svg>
                  <div className="text-center relative z-10">
                    <span className="block text-4xl font-black leading-none text-white font-mono text-glow">59</span>
                    <small className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">Trust Score</small>
                  </div>
                </div>

                <div className="grid gap-2">
                  {[["Shared device cluster", "HIGH", "#ff006e"], ["Payment authenticity", "MED", "#f59e0b"], ["Document integrity", "LOW", "#22c55e"]].map(([label, value, color]) => (
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
              <article key={mod.title} className="group relative overflow-hidden rounded border border-white/5 bg-white/[0.02] backdrop-blur-sm p-5 transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.04]" style={{ animationDelay: `${i * 100}ms`, borderColor: `${mod.color}00`, transition: "all 0.5s" }} onMouseEnter={e => (e.currentTarget.style.borderColor = `${mod.color}30`)} onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)")}>
                <span className="absolute left-0 top-0 h-px w-full opacity-70" style={{ backgroundColor: mod.color }} />
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
        <section className="relative border-t border-white/10 bg-[#08080d]/70 px-6 py-24 md:px-12 md:py-32" id="workflow">
          <SectionBoundary label="02 / Workflow" tone="violet" />

          <div className="mx-auto mb-16 w-full max-w-4xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-violet-200 font-mono">
              <span className="opacity-50">[</span>Protocol Sequence<span className="opacity-50">]</span>
            </p>
            <h2 className="m-0 text-3xl font-black leading-tight tracking-tight text-white lg:text-5xl">
              From vendor intake to explainable clearance.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-500">
              Each stage writes durable evidence first, then updates derived intelligence layers so reviewers can trace the decision path.
            </p>
          </div>

          <div className="mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-4">
            {steps.map((step, i) => (
              <article key={step.title} className="group relative rounded border border-white/5 bg-white/[0.02] backdrop-blur-sm p-6 transition-all duration-500 hover:-translate-y-2 hover:border-white/20 hover:bg-white/[0.045] overflow-hidden">
                {/* Step number */}
                <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded border border-white/20 bg-white/5 text-sm font-black text-zinc-200 font-mono group-hover:bg-white group-hover:text-[#0a0a0f] group-hover:border-white transition-all duration-300">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 font-mono group-hover:text-white transition-colors">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500 group-hover:text-gray-300 transition-colors">{step.text}</p>
                {/* Connection line */}
                {i < 3 && <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-px bg-gradient-to-r from-white/20 to-transparent" />}
              </article>
            ))}
          </div>
        </section>

        {/* ━━ CASES ━━ */}
        <section className="relative border-t border-white/10 bg-black/25 px-6 py-24 md:px-12 md:py-32" id="cases">
          <SectionBoundary label="03 / Cases" tone="rose" />

          <div className="mx-auto mb-16 w-full max-w-4xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-sky-200 font-mono">
              <span className="opacity-50">[</span>Operator View<span className="opacity-50">]</span>
            </p>
            <h2 className="m-0 text-3xl font-black leading-tight tracking-tight text-white lg:text-5xl">
              Clean vendors and suspicious clusters separate quickly.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-500">
              The operator view is built for fast triage: scores, status, and the primary evidence signal stay visible without opening a full case.
            </p>
          </div>

          <div className="mx-auto w-full max-w-5xl rounded border border-white/10 bg-[#0d0d14]/80 backdrop-blur-xl overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1.2fr_0.8fr_0.6fr_2fr] items-center gap-6 border-b border-white/5 bg-black/40 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 font-mono">
              <span>Vendor</span><span>Status</span><span>Score</span><span>Primary Signal</span>
            </div>

            {cases.map((c) => (
              <div
                key={c.name}
                className="grid gap-3 border-b border-white/5 px-6 py-5 transition-colors last:border-0 hover:bg-white/[0.02] md:grid-cols-[1.2fr_0.8fr_0.6fr_2fr] md:items-center md:gap-6 group"
                style={{ borderLeft: `2px solid ${c.color}55` }}
              >
                <span className="font-bold text-white text-sm font-mono group-hover:text-zinc-200 transition-colors">{c.name}</span>
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
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <p className="text-xs text-gray-600 font-mono">
            <span className="text-white/30">&gt;</span> © 2026 FraudLens Platform. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
