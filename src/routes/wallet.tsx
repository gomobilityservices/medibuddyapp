import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, CreditCard, Plus } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/app-store";
import { money } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Your wallet — Minute" },
      {
        name: "description",
        content: "Top up your Minute wallet and review every per-minute charge from your chats and calls.",
      },
      { property: "og:title", content: "Your wallet — Minute" },
      { property: "og:description", content: "Balance, top-ups and per-session charges in one place." },
    ],
  }),
  component: WalletPage,
});

const presets = [10, 25, 50, 100];

function WalletPage() {
  const { balance, transactions, topUp } = useStore();

  return (
    <MobileShell title="Wallet" subtitle="Prepaid balance for chats and calls">
      <div className="mint-glow rounded-3xl bg-secondary p-5">
        <p className="text-xs tracking-wide text-primary uppercase">Available balance</p>
        <p className="font-display mt-1 text-4xl font-bold text-foreground tabular-nums">
          {money(balance)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          About {Math.floor(balance / 1.2)} min at an average $1.20/min
        </p>
      </div>

      <p className="mt-5 mb-2 text-sm font-semibold text-foreground">Add money</p>
      <div className="grid grid-cols-2 gap-2">
        {presets.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => {
              topUp(amount);
              toast.success(`${money(amount)} added to your wallet`);
            }}
            className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3.5 text-left active:bg-muted"
          >
            <span className="text-base font-semibold text-foreground">{money(amount)}</span>
            <Plus className="h-4 w-4 text-primary" />
          </button>
        ))}
      </div>

      <Button variant="secondary" className="mt-2 h-12 w-full rounded-2xl text-sm font-semibold">
        <CreditCard className="h-4 w-4" /> Card ending 4242
      </Button>

      <p className="mt-6 mb-2 text-sm font-semibold text-foreground">Activity</p>
      <ul className="space-y-2">
        {transactions.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3.5"
          >
            <span
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                t.kind === "credit" ? "bg-secondary text-primary" : "bg-muted text-foreground",
              )}
            >
              {t.kind === "credit" ? (
                <ArrowDownLeft className="h-5 w-5" />
              ) : (
                <ArrowUpRight className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{t.label}</p>
              <p className="truncate text-xs text-muted-foreground">{t.sub}</p>
            </div>
            <span
              className={cn(
                "shrink-0 text-sm font-bold tabular-nums",
                t.kind === "credit" ? "text-primary" : "text-foreground",
              )}
            >
              {t.kind === "credit" ? "+" : "−"}
              {money(t.amount)}
            </span>
          </li>
        ))}
      </ul>
    </MobileShell>
  );
}
