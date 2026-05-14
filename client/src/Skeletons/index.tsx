import type { ReactNode } from "react";

const shimmer =
  "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-linear-to-r before:from-transparent before:via-white/10 before:to-transparent";

const blockBase = `rounded-lg bg-white/10 ${shimmer}`;
const panelBase = "glass-panel rounded-2xl";

type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
  return <div className={`${blockBase} ${className}`} />;
}

function PageHeaderSkeleton({ actionCount = 0 }: { actionCount?: number }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-3">
        <SkeletonBlock className="h-9 w-64 max-w-[70vw]" />
        <SkeletonBlock className="h-4 w-80 max-w-full" />
      </div>
      {actionCount > 0 && (
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: actionCount }).map((_, index) => (
            <SkeletonBlock key={index} className="h-10 w-32 rounded-lg" />
          ))}
        </div>
      )}
    </div>
  );
}

function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`${panelBase} p-4`}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-5 w-5 rounded" />
          </div>
          <SkeletonBlock className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({
  columns = 6,
  rows = 5,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div className={`${panelBase} overflow-hidden`}>
      <div className="flex flex-col gap-3 border-b border-white/5 bg-black/20 p-4 md:flex-row">
        <SkeletonBlock className="h-10 w-full max-w-md" />
        <SkeletonBlock className="h-10 w-40" />
        <SkeletonBlock className="h-10 w-48" />
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-190">
          <div
            className="grid gap-6 bg-black/40 px-6 py-4"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: columns }).map((_, index) => (
              <SkeletonBlock key={index} className="h-3 w-20" />
            ))}
          </div>
          <div className="divide-y divide-white/5">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="grid gap-6 px-6 py-5"
                style={{
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: columns }).map((_, columnIndex) => (
                  <SkeletonBlock
                    key={columnIndex}
                    className={`h-4 ${
                      columnIndex === 0
                        ? "w-36"
                        : columnIndex === columns - 1
                          ? "w-16 justify-self-end"
                          : "w-24"
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketingShellSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-gray-950 text-gray-200 font-sans selection:bg-emerald-500/30">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-emerald-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-cyan-900/10 blur-[150px]" />
      </div>
      {children}
    </div>
  );
}

function LegalPageSkeleton() {
  return (
    <MarketingShellSkeleton>
      <div className="relative z-10 mx-auto max-w-4xl px-6 pb-20 pt-10">
        <SkeletonBlock className="mb-8 h-5 w-40" />
        <div className="glass-panel relative rounded-3xl border border-white/10 p-8 shadow-2xl backdrop-blur-xl md:p-12">
          <div className="absolute left-0 top-0 h-1 w-full rounded-t-3xl bg-linear-to-r from-emerald-500 to-cyan-500" />
          <SkeletonBlock className="mb-10 h-10 w-72" />
          <div className="space-y-8">
            {Array.from({ length: 5 }).map((_, index) => (
              <section key={index} className="space-y-3">
                <SkeletonBlock className="h-6 w-56" />
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-11/12" />
              </section>
            ))}
          </div>
          <SkeletonBlock className="mt-12 h-px w-full rounded-none" />
          <SkeletonBlock className="mt-8 h-4 w-40" />
        </div>
      </div>
    </MarketingShellSkeleton>
  );
}

export function LandingSkeleton() {
  return (
    <MarketingShellSkeleton>
      <header className="fixed inset-x-0 top-0 z-50 flex min-h-18 items-center justify-between gap-6 border-b border-white/5 bg-gray-950/50 px-6 backdrop-blur-xl md:px-12">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-9 w-9 rounded-xl" />
          <SkeletonBlock className="h-5 w-28" />
        </div>
        <div className="hidden gap-2 rounded-full border border-white/10 bg-white/5 p-1.5 md:flex">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-9 w-28 rounded-full" />
          ))}
        </div>
        <SkeletonBlock className="hidden h-10 w-32 rounded-full sm:block" />
      </header>

      <main className="relative z-10">
        <section className="grid min-h-[90svh] px-6 pb-12 pt-32 md:px-12 md:pt-40">
          <div className="w-full max-w-180 self-center pt-10">
            <SkeletonBlock className="mb-6 h-7 w-60 rounded-full" />
            <SkeletonBlock className="h-20 w-full max-w-135 sm:h-24" />
            <div className="mt-8 space-y-3">
              <SkeletonBlock className="h-5 w-full max-w-160" />
              <SkeletonBlock className="h-5 w-10/12 max-w-140" />
            </div>
            <div className="mt-10 flex flex-wrap gap-4">
              <SkeletonBlock className="h-12 w-full rounded-full sm:w-44" />
              <SkeletonBlock className="h-12 w-full rounded-full sm:w-40" />
            </div>
          </div>
          <div className="mt-20 grid w-full max-w-225 gap-4 self-end sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className={`${panelBase} p-6`}>
                <SkeletonBlock className="h-4 w-32" />
                <SkeletonBlock className="mt-3 h-10 w-24" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </MarketingShellSkeleton>
  );
}

export function AuthSkeleton() {
  return (
    <MarketingShellSkeleton>
      <div className="relative flex min-h-svh items-center justify-center p-6">
        <div className="glass-panel relative z-10 w-full max-w-md rounded-3xl border border-white/10 p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute left-0 top-0 h-1 w-full rounded-t-3xl bg-linear-to-r from-emerald-500 to-cyan-500" />
          <SkeletonBlock className="mx-auto mb-6 h-12 w-12 rounded-2xl" />
          <SkeletonBlock className="mx-auto mb-3 h-9 w-56" />
          <SkeletonBlock className="mx-auto mb-8 h-4 w-64" />
          <SkeletonBlock className="mb-8 h-11 w-full rounded-xl" />
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <SkeletonBlock className="h-3 w-28" />
                <SkeletonBlock className="h-11 w-full rounded-xl" />
              </div>
            ))}
            <SkeletonBlock className="mt-6 h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </MarketingShellSkeleton>
  );
}

export function TermsOfServiceSkeleton() {
  return <LegalPageSkeleton />;
}

export function PrivacyPolicySkeleton() {
  return <LegalPageSkeleton />;
}

export function DashboardHomeSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={`${panelBase} p-4`}>
            <div className="mb-3 flex justify-between">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-4 w-4 rounded" />
            </div>
            <SkeletonBlock className="h-8 w-16" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className={`${panelBase} border-red-500/30 p-6`}>
            <div className="mb-6 flex justify-between gap-5">
              <div className="space-y-3">
                <SkeletonBlock className="h-6 w-64" />
                <SkeletonBlock className="h-4 w-48" />
              </div>
              <SkeletonBlock className="h-12 w-16" />
            </div>
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-18 rounded-lg" />
              ))}
            </div>
            <SkeletonBlock className="h-24 w-full rounded-xl" />
          </div>
          <SkeletonBlock className={`${panelBase} h-84`} />
          <TableSkeleton columns={6} rows={4} />
        </div>

        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={`${panelBase} p-6`}>
              <SkeletonBlock className="mb-5 h-4 w-36" />
              <div className="space-y-3">
                {Array.from({ length: index === 0 ? 5 : 4 }).map(
                  (_, itemIndex) => (
                    <SkeletonBlock
                      key={itemIndex}
                      className="h-11 w-full rounded-xl"
                    />
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardLayoutSkeleton() {
  return (
    <div className="flex min-h-screen bg-gray-950 font-sans text-gray-200 selection:bg-emerald-500/30">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-white/5 bg-gray-900/50 backdrop-blur-xl md:flex">
        <div className="flex h-20 items-center gap-3 border-b border-white/5 px-6">
          <SkeletonBlock className="h-8 w-8 rounded-lg" />
          <SkeletonBlock className="h-5 w-28" />
        </div>
        <nav className="flex-1 space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-11 w-full rounded-lg" />
          ))}
        </nav>
        <div className="border-t border-white/5 p-4">
          <SkeletonBlock className="h-9 w-28" />
        </div>
      </aside>

      <div className="flex min-h-svh flex-1 flex-col md:ml-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/5 bg-gray-950/80 px-4 backdrop-blur-xl md:px-8">
          <SkeletonBlock className="h-10 w-full max-w-96 rounded-full" />
          <div className="ml-4 flex items-center gap-4">
            <SkeletonBlock className="h-9 w-9 rounded-full" />
            <SkeletonBlock className="h-9 w-9 rounded-full" />
          </div>
        </header>
        <main className="relative flex-1 p-4 md:p-8">
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div className="absolute right-0 top-0 rounded-full bg-emerald-900/10 blur-[150px] md:h-125 md:w-125" />
          </div>
          <div className="relative z-10 mx-auto max-w-350">
            <DashboardHomeSkeleton />
          </div>
        </main>
      </div>
    </div>
  );
}

export function VendorsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeaderSkeleton actionCount={2} />
      <TableSkeleton columns={6} rows={6} />
    </div>
  );
}

export function CreateVendorSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeaderSkeleton />
      <section className={`${panelBase} p-6`}>
        <div className="mb-6 flex items-start gap-4 border-b border-white/10 pb-5">
          <SkeletonBlock className="h-11 w-11 rounded-xl" />
          <div className="space-y-3">
            <SkeletonBlock className="h-6 w-64" />
            <SkeletonBlock className="h-4 w-80 max-w-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className={index === 0 ? "md:col-span-2" : ""}>
              <SkeletonBlock className="mb-2 h-3 w-36" />
              <SkeletonBlock className="h-12 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <SkeletonBlock className="h-12 w-36 rounded-xl" />
        </div>
      </section>
    </div>
  );
}

export function VendorDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-4">
          <SkeletonBlock className="h-4 w-36" />
          <SkeletonBlock className="h-9 w-80 max-w-[80vw]" />
          <SkeletonBlock className="h-4 w-full max-w-2xl" />
        </div>
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-12 w-28 rounded-xl" />
          ))}
        </div>
      </div>

      <StatGridSkeleton count={4} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <SkeletonBlock className="h-8 w-44" />
          <SkeletonBlock className="h-125 w-full rounded-2xl" />
          <div className={`${panelBase} p-6`}>
            <SkeletonBlock className="mb-6 h-8 w-72" />
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[17rem_1fr]">
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonBlock key={index} className="h-32 rounded-xl" />
                ))}
              </div>
              <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
                <SkeletonBlock className="h-120 rounded-2xl" />
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <SkeletonBlock key={index} className="h-28 rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={`${panelBase} p-6`}>
              <SkeletonBlock className="mb-5 h-4 w-36" />
              <div className="space-y-3">
                {Array.from({ length: index === 3 ? 2 : 4 }).map(
                  (_, itemIndex) => (
                    <SkeletonBlock
                      key={itemIndex}
                      className="h-12 rounded-xl"
                    />
                  ),
                )}
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

export function SkeletonGraphPanel() {
  return (
    <div className="relative h-125 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0,transparent_60%)]" />
      <svg className="absolute inset-0 h-full w-full opacity-50">
        <line x1="50%" y1="50%" x2="25%" y2="30%" stroke="#f87171" />
        <line x1="50%" y1="50%" x2="75%" y2="34%" stroke="#fbbf24" />
        <line x1="50%" y1="50%" x2="72%" y2="70%" stroke="#f87171" />
        <line x1="50%" y1="50%" x2="30%" y2="76%" stroke="#64748b" />
        <line x1="50%" y1="50%" x2="50%" y2="18%" stroke="#10b981" />
      </svg>
      {[
        ["left-1/2 top-1/2", "h-16 w-16 rounded-full"],
        ["left-1/4 top-[30%]", "h-12 w-12 rounded-full"],
        ["left-3/4 top-[34%]", "h-12 w-12 rounded-full"],
        ["left-[72%] top-[70%]", "h-12 w-12 rounded-full"],
        ["left-[30%] top-[76%]", "h-12 w-12 rounded-full"],
        ["left-1/2 top-[18%]", "h-12 w-12 rounded-full"],
      ].map(([position, size], index) => (
        <div
          key={index}
          className={`absolute -translate-x-1/2 -translate-y-1/2 ${position}`}
        >
          <SkeletonBlock className={size} />
          <SkeletonBlock className="mx-auto mt-3 h-3 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function UploadingDocumentSkeleton() {
  return (
    <div className="glass-panel grid min-h-72 place-items-center rounded-2xl p-8 text-center">
      <div className="w-full max-w-md space-y-5">
        <SkeletonBlock className="mx-auto h-14 w-14 rounded-2xl" />
        <div className="space-y-3">
          <SkeletonBlock className="mx-auto h-6 w-72 max-w-full" />
          <SkeletonBlock className="mx-auto h-4 w-full" />
          <SkeletonBlock className="mx-auto h-4 w-9/12" />
        </div>
        <div className="mx-auto h-2 w-full overflow-hidden rounded-full border border-white/5 bg-black/40">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-500" />
        </div>
      </div>
    </div>
  );
}

export function TransactionsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className={`${panelBase} flex items-center gap-4 p-5`}
          >
            <SkeletonBlock className="h-12 w-12 rounded-full" />
            <div className="space-y-3">
              <SkeletonBlock className="h-3 w-28" />
              <SkeletonBlock className="h-7 w-24" />
            </div>
          </div>
        ))}
      </div>
      <TableSkeleton columns={6} rows={5} />
    </div>
  );
}

export function AlertsSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeaderSkeleton />
      <div className="flex w-max rounded-xl border border-white/5 bg-black/40 p-1">
        <SkeletonBlock className="h-10 w-28 rounded-lg" />
        <SkeletonBlock className="ml-1 h-10 w-24 rounded-lg" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={`${panelBase} flex flex-col gap-5 p-6 sm:flex-row sm:items-start`}
          >
            <SkeletonBlock className="h-12 w-12 shrink-0 rounded-full" />
            <div className="flex-1 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:justify-between">
                <div className="space-y-2">
                  <SkeletonBlock className="h-6 w-52" />
                  <SkeletonBlock className="h-4 w-64 max-w-full" />
                </div>
                <SkeletonBlock className="h-7 w-24" />
              </div>
              <SkeletonBlock className="h-16 w-full rounded-lg" />
              <div className="flex gap-3">
                <SkeletonBlock className="h-9 w-24 rounded-lg" />
                <SkeletonBlock className="h-9 w-24 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeaderSkeleton />
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="w-full shrink-0 space-y-2 md:w-64">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-12 w-full rounded-xl" />
          ))}
        </div>
        <div className="flex-1 space-y-6">
          {Array.from({ length: 2 }).map((_, panelIndex) => (
            <div key={panelIndex} className="glass-panel rounded-3xl p-8">
              <div className="mb-6 border-b border-white/10 pb-6">
                <SkeletonBlock className="mb-3 h-7 w-56" />
                <SkeletonBlock className="h-4 w-full max-w-lg" />
              </div>
              <div className="space-y-5">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index}>
                    <SkeletonBlock className="mb-2 h-3 w-28" />
                    <SkeletonBlock className="h-12 w-full rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
