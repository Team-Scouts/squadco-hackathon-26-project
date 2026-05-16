import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { signIn, signUp, useSession } from "../lib/authClient";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, updateEmail] = useState("");
  const [password, updatePassword] = useState("");
  const [firstName, updateFirstName] = useState("");
  const [lastName, updateLastName] = useState("");
  const navigate = useNavigate();
  const { data } = useSession();

  if (data?.user) {
    navigate("/dashboard");
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isLogin) {
      await signIn.email(
        { email, password },
        { onSuccess: () => navigate("/dashboard") },
      );
      return;
    }

    await signUp.email(
      {
        email,
        password,
        name: `${firstName} ${lastName}`,
      },
      { onSuccess: () => navigate("/dashboard") },
    );
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-vs-background p-6 text-zinc-200 selection:bg-white/20">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-white/[0.035] blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[60%] w-[60%] rounded-full bg-white/[0.025] blur-[180px]" />
      </div>

      <div className="panel-card relative z-10 w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <Link to="/" className="mb-6 inline-block group">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white text-black transition-transform group-hover:scale-105">
              <span className="text-xl font-black">V</span>
            </div>
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-500">
            FraudLens console
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            {isLogin ? "Welcome back" : "Create an account"}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {isLogin
              ? "Access vendor intelligence, graph evidence, and review queues."
              : "Create a workspace user for the review console."}
          </p>
        </div>

        <div className="mb-8 flex rounded-2xl border border-white/5 bg-black/40 p-1">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 rounded-xl py-2 text-sm font-bold transition-all ${
              isLogin ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 rounded-xl py-2 text-sm font-bold transition-all ${
              !isLogin ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} method="POST">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="pl-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  First name
                </span>
                <span className="relative block">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                  <input
                    type="text"
                    onChange={(event) => updateFirstName(event.target.value)}
                    className="field-control py-2.5 !pl-10"
                    placeholder="Jane"
                  />
                </span>
              </label>
              <label className="block space-y-1.5">
                <span className="pl-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Last name
                </span>
                <span className="relative block">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                  <input
                    type="text"
                    onChange={(event) => updateLastName(event.target.value)}
                    className="field-control py-2.5 !pl-10"
                    placeholder="Doe"
                  />
                </span>
              </label>
            </div>
          )}

          {!isLogin && (
            <label className="block space-y-1.5">
              <span className="pl-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                Company
              </span>
              <span className="relative block">
                <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                <input
                  type="text"
                  className="field-control py-2.5 !pl-10"
                  placeholder="Acme Corp"
                />
              </span>
            </label>
          )}

          <label className="block space-y-1.5">
            <span className="pl-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
              Email address
            </span>
            <span className="relative block">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input
                type="email"
                onChange={(event) => updateEmail(event.target.value)}
                className="field-control py-2.5 !pl-10"
                placeholder="name@company.com"
              />
            </span>
          </label>

          <label className="block space-y-1.5">
            <span className="flex items-center justify-between pl-1">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Password
              </span>
              {isLogin && (
                <a href="#" className="text-xs text-zinc-400 hover:text-white">
                  Forgot?
                </a>
              )}
            </span>
            <span className="relative block">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input
                type={showPassword ? "text" : "password"}
                onChange={(event) => updatePassword(event.target.value)}
                className="field-control py-2.5 !pl-10 !pr-10"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 transition-colors hover:text-zinc-300"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </span>
          </label>

          <button className="button-primary mt-6 w-full rounded-xl">
            {isLogin ? "Sign In to Console" : "Create Account"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-zinc-500">
          By continuing, you agree to our{" "}
          <Link to="/terms" className="text-zinc-300 underline hover:text-white">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-zinc-300 underline hover:text-white">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
