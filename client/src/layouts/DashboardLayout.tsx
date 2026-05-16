import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  AlertCircle,
  Settings,
  Search,
  Bell,
  GitBranch,
  LogOut,
  Activity,
} from "lucide-react";
import { authClient } from "../lib/authClient";
import { useSession } from "../lib/authClient";
import { graphApi } from "../lib/graphApi";

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const neo4jHealthQuery = useQuery({
    queryKey: ["neo4j_health_header"],
    queryFn: graphApi.getNeo4jHealth,
    enabled: !!session?.user,
    retry: false,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!isPending && !session?.user) {
      navigate("/auth", { replace: true });
    }
  }, [isPending, navigate, session?.user]);

  const signOut = async () =>
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => navigate("/auth"),
      },
    });

  const navItems = [
    { name: "Risk Console", path: "/dashboard", icon: LayoutDashboard },
    { name: "Vendors", path: "/dashboard/vendors", icon: Users },
    { name: "Fraud Graph", path: "/dashboard/fraud-graph", icon: GitBranch },
    {
      name: "Squad Transactions",
      path: "/dashboard/transactions",
      icon: FileText,
    },
    { name: "Alerts", path: "/dashboard/alerts", icon: AlertCircle },
    { name: "Settings", path: "/dashboard/settings", icon: Settings },
  ];

  if (isPending || !session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vs-background text-sm font-semibold text-zinc-400">
        Checking session...
      </div>
    );
  }

  const healthStatus = neo4jHealthQuery.data?.status ?? "checking";
  const healthTone =
    healthStatus === "connected"
      ? "bg-green-500"
      : healthStatus === "checking"
        ? "bg-yellow-400"
        : "bg-red-500";

  return (
    <div className="flex min-h-screen bg-vs-background text-zinc-200 selection:bg-white/20">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-70 flex-col border-r border-vs-border-soft bg-vs-surface/90 backdrop-blur-xl">
        <div className="flex h-20 items-center border-b border-vs-border-soft px-6">
          <Link
            to="/"
            className="flex items-center gap-3 font-extrabold text-white no-underline transition-opacity hover:opacity-80"
          >
            <div className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
              V
            </div>
            <div>
              <span className="block text-lg tracking-tight">FraudLens</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                Fraud intelligence
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? "border-vs-border bg-vs-raised text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    : "border-transparent text-zinc-500 hover:border-white/5 hover:bg-white/5 hover:text-zinc-100"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 ${isActive ? "text-sky-300" : "text-zinc-600"}`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-vs-border-soft p-4">
          <div className="mb-4 rounded-2xl border border-white/5 bg-black/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Environment
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                Local
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-zinc-400">
              <span className={`h-2 w-2 rounded-full ${healthTone}`} />
              Neo4j {healthStatus}
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-x-2 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-5 w-5 text-zinc-500" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="ml-70 flex min-h-svh flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-vs-border-soft bg-vs-background/80 px-8 backdrop-blur-xl">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              placeholder="Search vendors, documents, or Squad IDs..."
              className="field-control rounded-full py-2.5 pl-10"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-zinc-300 lg:flex">
              <Activity className="h-4 w-4 text-sky-300" />
              Review workspace
            </div>
            <button className="relative rounded-full p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            <Link
              to="/dashboard/settings?tab=profile"
              className="ml-2 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-vs-raised text-sm font-black text-white transition-transform hover:scale-105"
            >
              {session.user.name?.slice(0, 1).toUpperCase() ?? "U"}
            </Link>
          </div>
        </header>

        <main className="relative flex-1 p-8">
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <div className="absolute right-0 top-0 h-125 w-125 rounded-full bg-white/[0.025] blur-[150px]" />
          </div>
          <div className="relative z-10 mx-auto max-w-350">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
