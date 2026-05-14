import { useEffect, useMemo, useRef, useState } from "react";
import LandingPage from "./pages/LandingPage";
import VendorOnboarding from "./pages/VendorOnboarding";
import { LandingSkeleton, OnboardingSkeleton } from "./Skeletons";

export type AppRoute = "/" | "/get-started";

function getRoute(): AppRoute {
  return window.location.pathname === "/get-started" ? "/get-started" : "/";
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(getRoute);
  const [pendingRoute, setPendingRoute] = useState<AppRoute | null>(null);
  const routeTimer = useRef<number | null>(null);

  useEffect(() => {
    const syncRoute = () => {
      setPendingRoute(null);
      setRoute(getRoute());
    };
    window.addEventListener("popstate", syncRoute);
    return () => {
      window.removeEventListener("popstate", syncRoute);
      if (routeTimer.current) {
        window.clearTimeout(routeTimer.current);
      }
    };
  }, []);

  const navigate = useMemo(
    () => (path: AppRoute) => {
      if (path === route) {
        return;
      }

      if (routeTimer.current) {
        window.clearTimeout(routeTimer.current);
      }

      window.history.pushState({}, "", path);
      setPendingRoute(path);
      window.scrollTo({ top: 0, behavior: "smooth" });
      routeTimer.current = window.setTimeout(() => {
        setRoute(path);
        setPendingRoute(null);
      }, 320);
    },
    [route],
  );

  if (pendingRoute === "/get-started") {
    return <OnboardingSkeleton />;
  }

  if (pendingRoute === "/") {
    return <LandingSkeleton />;
  }

  if (route === "/get-started") {
    return <VendorOnboarding navigate={navigate} />;
  }

  return <LandingPage navigate={navigate} />;
}
