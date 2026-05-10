import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  AlertCircle,
  Settings,
  Search,
  Bell,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { authClient } from "../lib/authClient";

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const signOut = async () =>
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => navigate("/auth"),
      },
    });

  const navItems = [
    { name: "Risk Console", path: "/dashboard", icon: LayoutDashboard },
    { name: "Vendors", path: "/dashboard/vendors", icon: Users },
    {
      name: "Squad Transactions",
      path: "/dashboard/transactions",
      icon: FileText,
    },
    { name: "Alerts", path: "/dashboard/alerts", icon: AlertCircle },
    { name: "Settings", path: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="min-h-[100svh] bg-gray-950 text-gray-200 font-sans flex selection:bg-emerald-500/30">
      
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 border-r border-white/5 bg-gray-900/95 backdrop-blur-xl flex flex-col fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-16 md:h-20 flex items-center justify-between px-6 border-b border-white/5">
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 font-extrabold text-white no-underline transition-opacity hover:opacity-80"
          >
            <div className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-gray-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              V
            </div>
            <span className="text-lg tracking-tight">VeriSphere</span>
          </Link>
          <button 
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]" : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
              >
                <item.icon
                  className={`h-5 w-5 ${isActive ? "text-emerald-400" : "text-gray-500"}`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={signOut} className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <LogOut className="h-5 w-5 text-gray-500" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-[100svh] max-w-[100vw]">
        {/* Top Header */}
        <header className="h-16 md:h-20 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden text-gray-400 hover:text-white p-1"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="relative hidden sm:block w-64 lg:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search vendors or IDs..."
                className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 border-2 border-gray-900 shadow-[0_0_10px_rgba(16,185,129,0.3)] ml-2 cursor-pointer transition-transform hover:scale-105"></div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-4 md:p-8 relative overflow-x-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-emerald-900/10 blur-[150px]"></div>
          </div>
          <div className="relative z-10 max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
