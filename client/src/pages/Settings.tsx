import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Check,
  Copy,
  Key,
  Plus,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { graphApi } from "../lib/graphApi";
import { useSession } from "../lib/authClient";

type SettingsTab = "api" | "profile" | "team" | "notifications";

const tabs: Array<{ id: SettingsTab; label: string; icon: typeof Key }> = [
  { id: "api", label: "API & Webhooks", icon: Key },
  { id: "profile", label: "Profile", icon: User },
  { id: "team", label: "Team & Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const teamMembers = [
  { name: "Jane Doe", email: "jane@acmecorp.com", role: "Admin", status: "Active" },
  { name: "John Smith", email: "john@acmecorp.com", role: "Reviewer", status: "Active" },
  { name: "Alice Johnson", email: "alice@acmecorp.com", role: "Developer", status: "Pending" },
];

export default function Settings() {
  const [params, setParams] = useSearchParams("");
  const active = (params.get("tab") ?? "api") as SettingsTab;
  const { data } = useSession();
  const neo4jHealth = useQuery({
    queryKey: ["neo4j_health"],
    queryFn: graphApi.getNeo4jHealth,
    enabled: !!data?.user,
    retry: false,
    staleTime: 60 * 1000,
  });
  const neo4jConnected =
    neo4jHealth.data?.ok === true || neo4jHealth.data?.status === "connected";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-500">
          Admin controls
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
          Settings
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Manage secure integration settings, reviewer access, and system
          connectivity for the VeriSphere workspace.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="space-y-2">
          {tabs.map((tab) => {
            const selected = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setParams(`?tab=${tab.id}`)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition-all ${
                  selected
                    ? "border-vs-border bg-vs-raised text-white"
                    : "border-transparent text-zinc-500 hover:border-white/5 hover:bg-white/5 hover:text-white"
                }`}
              >
                <tab.icon className={`h-4 w-4 ${selected ? "text-sky-300" : ""}`} />
                {tab.label}
              </button>
            );
          })}
        </aside>

        <main className="space-y-6">
          {active === "api" && (
            <>
              <section className="panel-card p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Neo4j Graph Health
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Backend-only graph connectivity for vendor graph and fraud
                      cluster views.
                    </p>
                  </div>
                  <button
                    onClick={() => neo4jHealth.refetch()}
                    className="button-secondary rounded-xl"
                  >
                    Check status
                  </button>
                </div>
                <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Status
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-300">
                      {neo4jHealth.isLoading
                        ? "Checking graph connection..."
                        : neo4jHealth.data?.status ?? "Unavailable"}
                    </p>
                  </div>
                  <span
                    className={`status-badge ${
                      neo4jConnected ? "badge-low" : "badge-critical"
                    }`}
                  >
                    {neo4jConnected ? "Connected" : "Unavailable"}
                  </span>
                </div>
              </section>

              <section className="panel-card p-8">
                <h2 className="text-xl font-bold text-white">API Keys</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Keys shown here are placeholders for the demo UI. Keep server
                  secrets out of frontend code.
                </p>
                <div className="mt-6 space-y-5">
                  {["sk_test_8f92j3n4v8d...", "pk_test_1m2n3b4v5c..."].map(
                    (key) => (
                      <div key={key}>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                          {key.startsWith("sk") ? "Secret key" : "Public key"}
                        </p>
                        <div className="flex gap-3">
                          <input
                            value={key}
                            readOnly
                            className="field-control font-mono"
                          />
                          <button className="button-secondary rounded-xl">
                            <Copy className="h-4 w-4" />
                            Copy
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </section>
            </>
          )}

          {active === "profile" && data?.user && (
            <section className="panel-card p-8">
              <h2 className="text-xl font-bold text-white">My Profile</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Update the reviewer identity shown in the console.
              </p>
              <div className="mt-8 flex items-center gap-6">
                <div className="grid h-24 w-24 place-items-center rounded-full border border-white/10 bg-vs-raised text-3xl font-black text-white">
                  {data.user.name?.slice(0, 1).toUpperCase() ?? "U"}
                </div>
                <button className="button-secondary rounded-xl">Change Avatar</button>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Name
                  </span>
                  <input defaultValue={data.user.name} className="field-control" />
                </label>
                <label>
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Email
                  </span>
                  <input defaultValue={data.user.email} className="field-control" />
                </label>
              </div>
              <div className="mt-8 flex justify-end border-t border-white/10 pt-6">
                <button className="button-primary rounded-xl">Save Profile</button>
              </div>
            </section>
          )}

          {active === "team" && (
            <section className="panel-card p-8">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Team Members</h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    Manage reviewer access and workspace roles.
                  </p>
                </div>
                <button className="button-secondary rounded-xl">
                  <Plus className="h-4 w-4" />
                  Invite
                </button>
              </div>
              <div className="mt-6 space-y-4">
                {teamMembers.map((member) => (
                  <div
                    key={member.email}
                    className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/30 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-vs-raised font-bold text-white">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {member.name}
                        </p>
                        <p className="text-xs text-zinc-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="status-badge border-white/10 bg-white/5 text-zinc-300">
                        {member.role}
                      </span>
                      <button className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-white/5 hover:text-red-300">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {active === "notifications" && (
            <section className="panel-card p-8">
              <h2 className="text-xl font-bold text-white">
                Notification Preferences
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                Choose which risk events should trigger reviewer alerts.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  "High-risk vendor applications",
                  "Squad payment failures",
                  "Webhook delivery errors",
                  "Weekly summary report",
                  "New device sign-ins",
                ].map((item, index) => (
                  <button
                    key={item}
                    className="flex w-full items-start gap-4 rounded-2xl p-4 text-left transition-colors hover:bg-white/5"
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        index === 3
                          ? "border-zinc-600 bg-black/40"
                          : "border-green-500 bg-green-500 text-black"
                      }`}
                    >
                      {index !== 3 && <Check className="h-3 w-3" />}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-white">
                        {item}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-zinc-500">
                        Send an operational notification when this signal is recorded.
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-8 flex justify-end border-t border-white/10 pt-6">
                <button className="button-primary rounded-xl">
                  Update Preferences
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
