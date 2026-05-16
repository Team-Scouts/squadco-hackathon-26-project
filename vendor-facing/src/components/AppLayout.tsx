import type { AppRoute } from "../App";

type AppLayoutProps = {
  children: React.ReactNode;
  navigate: (path: AppRoute) => void;
};

export default function AppLayout({ children, navigate }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" type="button" onClick={() => navigate("/")}>
          <span className="brand-mark">V</span>
          <span>VeriSphere Vendors</span>
        </button>
        <div className="header-actions">
          <button
            className="button button-quiet"
            type="button"
            onClick={() => navigate("/")}
          >
            Home
          </button>
          <button
            className="button button-primary"
            type="button"
            onClick={() => navigate("/get-started")}
          >
            Get Started
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
