import type { AppRoute } from "../App";
import AppLayout from "../components/AppLayout";
import IconBadge from "../components/IconBadge";

type LandingPageProps = {
  navigate: (path: AppRoute) => void;
};

const steps = [
  {
    icon: "1",
    title: "Share your contact details",
    body: "Tell the review team who to reach and which business is applying.",
  },
  {
    icon: "2",
    title: "Add business information",
    body: "Confirm registration details and upload a CAC or equivalent document.",
  },
  {
    icon: "3",
    title: "Submit for review",
    body: "Your information is packaged for verification without asking you to understand the internal risk tools.",
  },
];

const support = [
  {
    icon: "ID",
    title: "Simple language",
    body: "Each field asks for familiar business details, with examples where they help.",
  },
  {
    icon: "DOC",
    title: "Document ready",
    body: "Upload PDF, JPG, or PNG documents from your phone or computer.",
  },
  {
    icon: "OK",
    title: "Clear next step",
    body: "The flow shows what happens next after you submit your application.",
  },
];

export default function LandingPage({ navigate }: LandingPageProps) {
  return (
    <AppLayout navigate={navigate}>
      <main>
        <section className="hero">
          <div className="hero-inner">
            <div>
              <span className="eyebrow">
                <span className="status-dot" />
                Vendor onboarding portal
              </span>
              <h1>Submit your vendor profile with less guesswork.</h1>
              <p className="hero-copy">
                FraudLens Vendors helps suppliers, contractors, and service
                providers send the details needed for review in a short guided
                flow. No dashboard training required.
              </p>
              <div className="hero-actions">
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => navigate("/get-started")}
                >
                  Get Started
                </button>
                <a className="button button-secondary" href="#how-it-works">
                  See How It Works
                </a>
              </div>
            </div>

            <aside className="hero-card glass-panel" aria-label="Review preview">
              <div className="review-card">
                <div className="trust-score">
                  <div>
                    <strong>3</strong>
                    <span>Simple stages</span>
                  </div>
                </div>
                <div className="signal-list">
                  <div className="signal-item">
                    <span>Contact details</span>
                    <strong>Step 1</strong>
                  </div>
                  <div className="signal-item">
                    <span>Business registration</span>
                    <strong>Step 2</strong>
                  </div>
                  <div className="signal-item">
                    <span>Document upload</span>
                    <strong>Step 3</strong>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="section" id="how-it-works">
          <div className="content-wrap">
            <div className="section-heading">
              <h2>A calmer way to complete vendor review.</h2>
              <p>
                The internal FraudLens console is built for risk analysts. This
                version is built for vendors who just need to submit accurate
                information and move on.
              </p>
            </div>
            <div className="steps-grid">
              {steps.map((step) => (
                <article className="info-tile glass-panel" key={step.title}>
                  <IconBadge>{step.icon}</IconBadge>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="content-wrap">
            <div className="section-heading">
              <h2>Made for busy business owners.</h2>
              <p>
                The form keeps technical risk language out of the way and keeps
                attention on the details vendors already know.
              </p>
            </div>
            <div className="support-grid">
              {support.map((item) => (
                <article className="info-tile glass-panel" key={item.title}>
                  <IconBadge>{item.icon}</IconBadge>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="footer">
        FraudLens Vendor Portal. Submit business information securely for
        review.
      </footer>
    </AppLayout>
  );
}
