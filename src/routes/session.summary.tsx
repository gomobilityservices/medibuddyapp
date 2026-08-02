import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/app-store";
import { clock, getProvider, money } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/session/summary")({
  head: () => ({
    meta: [
      { title: "Session summary — Minute" },
      { name: "description", content: "What your last chat or call cost and how much wallet balance is left." },
      { property: "og:title", content: "Session summary — Minute" },
      { property: "og:description", content: "Minutes billed, amount charged and remaining balance." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Summary,
});

function Summary() {
  const { lastSummary } = useStore();
  const navigate = useNavigate();
  const [rated, setRated] = useState(0);

  useEffect(() => {
    if (!lastSummary) navigate({ to: "/", replace: true });
  }, [lastSummary, navigate]);

  if (!lastSummary) return null;
  const provider = getProvider(lastSummary.providerId);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col justify-between bg-background px-5 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary">
          <Check className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold text-foreground">
          {lastSummary.mode === "call" ? "Call" : "Chat"} ended
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          with {provider?.name ?? "your listener"}
        </p>

        <div className="mt-6 space-y-3 rounded-3xl border border-border/60 bg-card p-5">
          <Row label="Duration" value={clock(lastSummary.seconds)} />
          <Row label="Minutes billed" value={`${lastSummary.minutes} min`} />
          <Row
            label="Rate"
            value={`${money(lastSummary.amount / lastSummary.minutes)} / min`}
          />
          <div className="border-t border-border/60 pt-3">
            <Row label="Charged" value={money(lastSummary.amount)} strong />
            <div className="mt-2">
              <Row label="Balance left" value={money(lastSummary.balanceAfter)} />
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-border/60 bg-card p-5 text-center">
          <p className="text-sm font-semibold text-foreground">How was it?</p>
          <div className="mt-3 flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} stars`}
                onClick={() => setRated(n)}
                className="p-1"
              >
                <Star
                  className={cn(
                    "h-8 w-8",
                    n <= rated ? "fill-warning text-warning" : "text-muted-foreground",
                  )}
                />
              </button>
            ))}
          </div>
          {rated > 0 && <p className="mt-2 text-xs text-primary">Thanks — rating saved</p>}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <Button asChild className="h-12 w-full rounded-2xl text-base font-semibold">
          <Link to="/">Back to discover</Link>
        </Button>
        <Button asChild variant="secondary" className="h-12 w-full rounded-2xl text-base font-semibold">
          <Link to="/wallet">View wallet</Link>
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "tabular-nums",
          strong ? "text-lg font-bold text-primary" : "font-semibold text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}
