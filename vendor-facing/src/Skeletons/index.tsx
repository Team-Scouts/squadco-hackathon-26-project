type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
  return <span className={`skeleton-block ${className}`} />;
}

function HeaderSkeleton() {
  return (
    <header className="site-header">
      <div className="brand">
        <SkeletonBlock className="skeleton-mark" />
        <SkeletonBlock className="skeleton-title" />
      </div>
      <div className="header-actions">
        <SkeletonBlock className="skeleton-button skeleton-button-small" />
        <SkeletonBlock className="skeleton-button" />
      </div>
    </header>
  );
}

function FormHeaderSkeleton() {
  return (
    <div className="form-header">
      <SkeletonBlock className="skeleton-eyebrow" />
      <SkeletonBlock className="skeleton-heading" />
      <SkeletonBlock className="skeleton-copy skeleton-copy-wide" />
      <SkeletonBlock className="skeleton-copy skeleton-copy-medium" />
    </div>
  );
}

function FormCardSkeleton() {
  return (
    <div className="form-card glass-panel">
      <div className="form-card-header">
        <SkeletonBlock className="skeleton-icon" />
        <div className="skeleton-stack">
          <SkeletonBlock className="skeleton-subheading" />
          <SkeletonBlock className="skeleton-copy skeleton-copy-wide" />
        </div>
      </div>
      <div className="form-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            className={`field ${index === 0 ? "field-full" : ""}`}
            key={index}
          >
            <SkeletonBlock className="skeleton-label" />
            <SkeletonBlock className="skeleton-input" />
          </div>
        ))}
      </div>
      <div className="form-actions">
        <SkeletonBlock className="skeleton-button skeleton-button-small" />
        <SkeletonBlock className="skeleton-button" />
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <aside className="sidebar">
      <div className="summary-card glass-panel">
        <SkeletonBlock className="skeleton-subheading" />
        <SkeletonBlock className="skeleton-copy skeleton-copy-medium" />
        <div className="summary-list">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="stage-pill" key={index}>
              <SkeletonBlock className="skeleton-step-number" />
              <span className="skeleton-stack">
                <SkeletonBlock className="skeleton-copy skeleton-copy-short" />
                <SkeletonBlock className="skeleton-copy skeleton-copy-medium" />
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="summary-card glass-panel">
        <SkeletonBlock className="skeleton-subheading" />
        <SkeletonBlock className="skeleton-copy skeleton-copy-wide" />
        <SkeletonBlock className="skeleton-copy skeleton-copy-medium" />
      </div>
    </aside>
  );
}

export function LandingSkeleton() {
  return (
    <div className="app-shell">
      <HeaderSkeleton />
      <main>
        <section className="hero">
          <div className="hero-inner">
            <div>
              <SkeletonBlock className="skeleton-eyebrow" />
              <SkeletonBlock className="skeleton-hero-line" />
              <SkeletonBlock className="skeleton-hero-line skeleton-hero-line-short" />
              <SkeletonBlock className="skeleton-copy skeleton-copy-wide" />
              <SkeletonBlock className="skeleton-copy skeleton-copy-medium" />
              <div className="hero-actions">
                <SkeletonBlock className="skeleton-button" />
                <SkeletonBlock className="skeleton-button" />
              </div>
            </div>
            <div className="hero-card glass-panel">
              <SkeletonBlock className="skeleton-score" />
              <div className="signal-list">
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonBlock className="skeleton-signal" key={index} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export function OnboardingSkeleton() {
  return (
    <div className="app-shell">
      <HeaderSkeleton />
      <main className="onboarding-page">
        <div className="content-wrap">
          <FormHeaderSkeleton />
          <div className="form-layout">
            <section>
              <FormCardSkeleton />
            </section>
            <SidebarSkeleton />
          </div>
        </div>
      </main>
    </div>
  );
}

export function StageTransitionSkeleton({
  label = "Preparing the next step...",
}: {
  label?: string;
}) {
  return (
    <div className="transition-panel glass-panel">
      <span className="spinner" />
      <h2>{label}</h2>
      <p>Hold on for a moment while we arrange the next screen.</p>
      <div className="transition-lines">
        <SkeletonBlock className="skeleton-copy skeleton-copy-wide" />
        <SkeletonBlock className="skeleton-copy skeleton-copy-medium" />
      </div>
    </div>
  );
}

export function UploadProcessingSkeleton() {
  return (
    <div className="upload-processing">
      <span className="spinner spinner-small" />
      <span>Checking the selected file...</span>
    </div>
  );
}
