import { createFileRoute } from "@tanstack/react-router";
import {
  Clock,
  TrendingUp,
  Star,
  DollarSign,
  ArrowUpRight,
  UserCheck
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { Switch } from "@/components/ui/switch";
import { useStore, type ProviderProfile } from "@/lib/app-store";
import { money } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/provider/")({
  head: () => ({
    meta: [
      { title: "Provider status — Minute" },
      {
        name: "description",
        content: "Go available, accept incoming chat and call requests, and watch today's earnings build up.",
      },
      { property: "og:title", content: "Provider status — Minute" },
      { property: "og:description", content: "Toggle availability and handle incoming requests." },
    ],
  }),
  component: ProviderDashboard,
});

function ProviderDashboard() {
  const {
    currentUser,
    providerOnline,
    setProviderOnline,
    withdrawEarnings,
    providers
  } = useStore();

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmt, setWithdrawAmt] = useState("");

  if (!currentUser || currentUser.role !== "provider") {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground p-4 text-center">
        <div>
          <p>Please log in as a Service Provider to view this dashboard.</p>
        </div>
      </div>
    );
  }

  const profile = currentUser as ProviderProfile;

  // Derive counts from transactions or profile details
  const completedCalls = profile.transactions.filter(t => t.type === "session_call").length || 3;
  const completedChats = profile.transactions.filter(t => t.type === "session_chat").length || 2;

  // Let's get the active item from providers list to match reviews
  const dbProvider = providers.find(p => p.id === profile.id);
  const reviewsList = dbProvider ? dbProvider.reviewsList : profile.reviewsList;
  const rating = dbProvider ? dbProvider.rating : profile.rating;

  const handleWithdraw = () => {
    const amt = parseFloat(withdrawAmt);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }
    if (amt > profile.walletBalance) {
      toast.error("Insufficient wallet balance");
      return;
    }

    const success = await withdrawEarnings(amt);
    if (success) {
      toast.success(`Withdrawal request of ${money(amt)} submitted!`);
      setWithdrawOpen(false);
      setWithdrawAmt("");
    } else {
      toast.error("Failed to submit payout request");
    }
  };

  return (
    <MobileShell title="Status Dashboard" subtitle={`Ava R. · ${money(profile.rateChat)}/min`}>
      {/* Current Status Toggle */}
      <div
        className={cn(
          "rounded-3xl border p-5 transition-all",
          providerOnline
            ? "border-primary/40 bg-secondary/80 mint-glow"
            : "border-border/60 bg-card"
        )}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <p className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-full", providerOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
              {providerOnline ? "Online & Available" : "Offline"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {providerOnline
                ? "Customers can discover you in search and call you"
                : "You are hidden from discover page"}
            </p>
          </div>
          <Switch
            checked={providerOnline}
            onCheckedChange={(v) => {
              setProviderOnline(v);
              toast.success(v ? "You are now online" : "You went offline");
            }}
            aria-label="Toggle availability"
            className="scale-125"
          />
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Tile label="Today's Earnings" value={money(profile.totalEarnings * 0.3)} accent />
        <Tile label="This Week" value={money(profile.totalEarnings * 0.8)} />
        <Tile label="Monthly Earnings" value={money(profile.totalEarnings)} />
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <Tile label="Wallet Balance" value={money(profile.walletBalance)} accent />
        <Tile label="Pending Payouts" value={money(profile.pendingEarnings)} />
        <Tile label="Completed Calls" value={`${completedCalls}`} />
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <Tile label="Completed Chats" value={`${completedChats}`} />
        <Tile label="Average Rating" value={`${rating.toFixed(1)} ★`} />
        <Tile label="Avg Duration" value="14 min" />
      </div>

      {/* Withdrawal Trigger */}
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4">
        <TrendingUp className="h-5 w-5 shrink-0 text-primary" />
        <p className="min-w-0 flex-1 text-xs text-muted-foreground">
          Available for payout:
          <b className="ml-1 text-sm text-foreground">{money(profile.walletBalance)}</b>
        </p>
        <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
          <DialogTrigger asChild>
            <button className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-primary border border-primary/20 hover:bg-primary/10 transition-all cursor-pointer">
              Withdraw
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[360px] bg-card border-border text-foreground rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground font-bold">Request Earnings Payout</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground">
                Submit a bank payout request. Processing takes up to 48 hours.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="payoutAmt" className="text-xs text-muted-foreground">Amount (Rs)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    id="payoutAmt"
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawAmt}
                    onChange={(e) => setWithdrawAmt(e.target.value)}
                    className="pl-9 bg-background border-border text-foreground rounded-xl focus-visible:ring-primary"
                  />
                </div>
              </div>
              <Button
                onClick={handleWithdraw}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl"
              >
                Submit Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Recent Reviews & Ratings Breakdown */}
      <div className="mt-5">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-2">
          Ratings & Reviews
        </h3>
        
        {/* Dynamic Star Ratings Breakdown */}
        {(() => {
          const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          reviewsList.forEach((r) => {
            const star = Math.max(1, Math.min(5, Math.round(r.rating))) as 5 | 4 | 3 | 2 | 1;
            ratingCounts[star]++;
          });

          return (
            <div className="p-4 bg-muted/65 rounded-2xl border border-border/60 mb-3 space-y-1.5 text-xs">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Overall Rating Breakdown</p>
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = ratingCounts[stars as 5 | 4 | 3 | 2 | 1];
                const pct = reviewsList.length > 0 ? (count / reviewsList.length) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="w-12 text-muted-foreground font-semibold flex items-center gap-0.5">
                      {stars} ★
                    </span>
                    <div className="flex-1 h-2.5 bg-background border border-border/60 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right font-bold text-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Anonymized Reviews list */}
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Recent Comments & Ratings</p>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {reviewsList.map((rev) => (
            <div key={rev.id} className="p-3 bg-card border border-border/60 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <div className="flex gap-0.5 text-warning">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn("h-3 w-3", i < rev.rating ? "fill-warning text-warning" : "text-muted")}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">{rev.date}</span>
              </div>
              {rev.comment ? (
                <p className="text-slate-600 leading-relaxed font-medium">"{rev.comment}"</p>
              ) : (
                <p className="text-muted-foreground italic text-[11px]">No comment left (Rating Only)</p>
              )}
            </div>
          ))}
          {reviewsList.length === 0 && (
            <div className="text-center py-6 text-xs text-muted-foreground bg-card/45 border border-dashed border-border rounded-xl">
              No reviews or ratings received yet.
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-5">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-2">
          Recent Payout & Earnings Activity
        </h3>
        <ul className="space-y-2">
          {profile.transactions.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                <UserCheck className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1 text-xs">
                <p className="truncate font-semibold text-foreground">{t.label}</p>
                <p className="truncate text-[10px] text-muted-foreground">{t.sub} · {t.timestamp}</p>
              </div>
              <span className={cn("shrink-0 font-bold text-xs", t.kind === "credit" ? "text-primary" : "text-rose-600")}>
                {t.kind === "credit" ? "+" : "−"}
                {money(t.amount)}
              </span>
            </li>
          ))}
          {profile.transactions.length === 0 && (
            <div className="text-center py-6 text-xs text-muted-foreground bg-card/45 border border-dashed border-border rounded-xl">
              No transactions recorded yet.
            </div>
          )}
        </ul>
      </div>
    </MobileShell>
  );
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-2 text-center flex flex-col justify-center min-h-[72px]">
      <p
        className={cn(
          "text-sm font-bold tracking-tight truncate",
          accent ? "text-primary font-extrabold" : "text-foreground"
        )}
      >
        {value}
      </p>
      <p className="text-[9px] text-muted-foreground mt-0.5 leading-none">{label}</p>
    </div>
  );
}
