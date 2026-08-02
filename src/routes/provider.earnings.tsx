import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Phone, ArrowUpRight, History } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis } from "recharts";
import { MobileShell } from "@/components/MobileShell";
import { useStore, type ProviderProfile } from "@/lib/app-store";
import { dailyEarnings, money } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useState } from "react";

export const Route = createFileRoute("/provider/earnings")({
  head: () => ({
    meta: [
      { title: "Earnings — Minute provider" },
      {
        name: "description",
        content: "See what you earned today, this week and this month, with a breakdown of every session.",
      },
      { property: "og:title", content: "Earnings — Minute provider" },
      { property: "og:description", content: "Daily earnings and per-session payouts." },
    ],
  }),
  component: Earnings,
});

function Earnings() {
  const { currentUser } = useStore();
  const [activeSubTab, setActiveSubTab] = useState<"conversations" | "payouts">("conversations");

  if (!currentUser || currentUser.role !== "provider") {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground p-4">
        <p>Please login as a Provider to view earnings.</p>
      </div>
    );
  }

  const profile = currentUser as ProviderProfile;

  // Filter earnings-related transactions (completed sessions)
  const sessionsList = profile.transactions.filter(
    (t) => t.type === "session_chat" || t.type === "session_call"
  );

  return (
    <MobileShell title="Earnings" subtitle="Payouts every Friday">
      <div className="mint-glow rounded-3xl bg-secondary border border-primary/20 p-5">
        <p className="text-xs tracking-wide text-primary uppercase font-bold">Wallet balance</p>
        <p className="font-display mt-1 text-4xl font-bold text-foreground tabular-nums">
          {money(profile.walletBalance)}
        </p>
        <div className="mt-4 grid grid-cols-3 divide-x divide-border/60 text-center">
          <Cell2 label="Today" value={money(profile.totalEarnings * 0.3)} />
          <Cell2 label="Total Earned" value={money(profile.totalEarnings)} />
          <Cell2 label="Pending" value={money(profile.pendingEarnings)} />
        </div>
      </div>

      <p className="mt-5 mb-2 text-sm font-semibold text-foreground">Last 7 days</p>
      <div className="h-40 rounded-2xl border border-border/60 bg-card p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dailyEarnings}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
              {dailyEarnings.map((d, i) => (
                <Cell
                  key={d.day}
                  fill={i === dailyEarnings.length - 1 ? "var(--mint)" : "var(--primary)"}
                  opacity={i === dailyEarnings.length - 1 ? 1 : 0.55}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sub-tab switcher */}
      <div className="mt-6 flex bg-muted p-1 rounded-xl">
        <button
          onClick={() => setActiveSubTab("conversations")}
          className={cn(
            "flex-1 py-2 text-xs font-semibold rounded-lg transition-all",
            activeSubTab === "conversations" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Conversations History
        </button>
        <button
          onClick={() => setActiveSubTab("payouts")}
          className={cn(
            "flex-1 py-2 text-xs font-semibold rounded-lg transition-all",
            activeSubTab === "payouts" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Payout Transactions
        </button>
      </div>

      {/* Conversations Tab content */}
      {activeSubTab === "conversations" && (
        <div className="mt-4 space-y-2 animate-fade-in">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Completed Conversations</p>
          {sessionsList.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3.5"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                {e.type === "session_call" ? (
                  <Phone className="h-4 w-4 text-primary" />
                ) : (
                  <MessageCircle className="h-4 w-4 text-primary" />
                )}
              </span>
              <div className="min-w-0 flex-1 text-xs">
                <div className="flex justify-between items-start gap-1">
                  <p className="font-semibold text-foreground truncate">
                    {e.type === "session_call" ? "Voice Call Session" : "Chat Session"}
                  </p>
                  <span className="text-[10px] text-muted-foreground shrink-0">{e.timestamp}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Duration: {e.sub.split(" (")[0] || "completed"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-primary tabular-nums">
                  +{money(e.amount)}
                </span>
                <p className="text-[8px] text-muted-foreground">Earnings</p>
              </div>
            </div>
          ))}
          {sessionsList.length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground bg-card/45 border border-dashed border-border rounded-xl">
              No completed conversations history found.
            </div>
          )}
        </div>
      )}

      {/* Payouts Tab content */}
      {activeSubTab === "payouts" && (
        <div className="mt-4 space-y-2 animate-fade-in">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Payout Activity</p>
          {profile.withdrawals && profile.withdrawals.length > 0 ? (
            <ul className="space-y-2">
              {profile.withdrawals.map((w) => (
                <li key={w.id} className="flex justify-between items-center p-3.5 bg-card border border-border/60 rounded-2xl text-xs">
                  <div>
                    <p className="font-semibold text-foreground">Bank Transfer Payout</p>
                    <p className="text-[10px] text-muted-foreground">{w.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-rose-600">-{money(w.amount)}</p>
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
                      w.status === "completed" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {w.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-xs text-muted-foreground bg-card/45 border border-dashed border-border rounded-xl">
              No withdrawal payouts recorded yet.
            </div>
          )}
        </div>
      )}
    </MobileShell>
  );
}

function Cell2({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-bold text-foreground tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
