import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Phone } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis } from "recharts";
import { MobileShell } from "@/components/MobileShell";
import { useStore } from "@/lib/app-store";
import { dailyEarnings, money, providerEarnings } from "@/lib/mock-data";

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
  const { liveEarnings } = useStore();

  return (
    <MobileShell title="Earnings" subtitle="Payouts every Friday">
      <div className="mint-glow rounded-3xl bg-secondary p-5">
        <p className="text-xs tracking-wide text-primary uppercase">Wallet balance</p>
        <p className="font-display mt-1 text-4xl font-bold text-foreground tabular-nums">
          {money(liveEarnings)}
        </p>
        <div className="mt-4 grid grid-cols-3 divide-x divide-primary/20 text-center">
          <Cell2 label="Today" value={money(68.4)} />
          <Cell2 label="This week" value={money(570.4)} />
          <Cell2 label="This month" value={money(2140)} />
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

      <p className="mt-6 mb-2 text-sm font-semibold text-foreground">Sessions</p>
      <ul className="space-y-2">
        {providerEarnings.map((e) => (
          <li
            key={e.id}
            className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3.5"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-foreground">
              {e.mode === "call" ? (
                <Phone className="h-4 w-4" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{e.masked}</p>
              <p className="truncate text-xs text-muted-foreground">
                {e.minutes} min {e.mode} · {e.when}
              </p>
            </div>
            <span className="shrink-0 text-sm font-bold text-primary tabular-nums">
              +{money(e.amount)}
            </span>
          </li>
        ))}
      </ul>
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
