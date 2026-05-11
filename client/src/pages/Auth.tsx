import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Building,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { signIn, signUp } from "../lib/authClient";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, updateEmail] = useState("");
  const [password, updatePassword] = useState("");
  const [firstName, updateFirstName] = useState("");
  const [lastName, updateLastName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulated auth delay
    if (isLogin) {
      try {
        await signIn.email(
          {
            email: email,
            password: password,
          },
          {
            onSuccess: () => navigate("/dashboard"),
          },
        );
      } catch (error) {
        console.log(error);
      }
    } else {
      try {
        await signUp.email(
          {
            email: email,
            password: password,
            name: `${firstName} ${lastName}`,
          },
          {
            onSuccess: () => navigate("/dashboard"),
          },
        );
      } catch (error) {
        console.log(error);
      }
    }
  };

  return (
    <div className="min-h-svh bg-gray-950 text-gray-200 font-sans selection:bg-emerald-500/30 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[150px] animate-float-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-900/10 blur-[180px] animate-float-slower"></div>
      </div>

      <div className="glass-panel w-full max-w-md relative z-10 rounded-3xl p-8 shadow-2xl border border-white/10 backdrop-blur-xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-emerald-500 to-cyan-500 rounded-t-3xl"></div>

        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6 group">
            <div className="relative grid h-12 w-12 mx-auto place-items-center rounded-2xl bg-linear-to-br from-emerald-400 to-cyan-500 text-gray-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-transform group-hover:scale-105">
              <span className="text-xl font-black">V</span>
              <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 transition-opacity group-hover:opacity-100"></div>
            </div>
          </Link>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            {isLogin ? "Welcome back" : "Create an account"}
          </h1>
          <p className="text-sm text-gray-400">
            {isLogin
              ? "Enter your details to access the console."
              : "Join VeriSphere to start screening."}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex p-1 bg-black/40 rounded-xl mb-8 border border-white/5">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${isLogin ? "bg-white/10 text-white shadow-md" : "text-gray-400 hover:text-white"}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${!isLogin ? "bg-white/10 text-white shadow-md" : "text-gray-400 hover:text-white"}`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit} method="POST">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-emerald-500/50" />
                  </div>
                  <input
                    type="text"
                    onChange={(e) => updateFirstName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    placeholder="Jane"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-emerald-500/50" />
                  </div>
                  <input
                    type="text"
                    onChange={(e) => updateLastName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>
          )}

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">
                Company
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-4 w-4 text-emerald-500/50" />
                </div>
                <input
                  type="text"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  placeholder="Acme Corp"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-emerald-500/50" />
              </div>
              <input
                type="email"
                onChange={(e) => updateEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between pl-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Password
              </label>
              {isLogin && (
                <a
                  href="#"
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Forgot?
                </a>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-emerald-500/50" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                onChange={(e) => updatePassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button className="w-full mt-6 group relative flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 px-4 text-sm font-bold text-gray-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-0.5">
            {isLogin ? "Sign In to Console" : "Create Account"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </form>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-500">
          By continuing, you agree to our{" "}
          <Link
            to="/terms"
            className="text-gray-400 underline hover:text-white"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            to="/privacy"
            className="text-gray-400 underline hover:text-white"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
