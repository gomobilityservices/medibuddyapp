import { createFileRoute } from "@tanstack/react-router";
import { Clock, MessageCircle, Phone, ShieldCheck, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/lib/app-store";
import { incomingRequests, money } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

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
  const { providerOnline, setProviderOnline, liveEarnings } = useStore();

  return (
    <MobileShell title="Your status" subtitle="Ava R. · $1.20/min">
      <div
        className={cn(
          "rounded-3xl border p-5",
          providerOnline
            ? "mint-glow border-primary/40 bg-secondary"
            : "border-border/60 bg-card",
        )}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <p className="text-lg font-bold text-foreground">
              {providerOnline ? "Available" : "Offline"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {providerOnline
                ? "Customers in your area can see and reach you"
                : "You are hidden from search until you switch on"}
            </p>
          </div>
          <Switch
            checked={providerOnline}
            onCheckedChange={(v) => {
              setProviderOnline(v);
              toast.success(v ? "You are now available" : "You are offline");
            }}
            aria-label="Toggle availability"
            className="scale-125"
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Tile label="Earned today" value={money(68.4)} accent />
        <Tile label="Minutes" value="57" />
        <Tile label="Sessions" value="3" />
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4">
        <TrendingUp className="h-5 w-5 shrink-0 text-primary" />
        <p className="min-w-0 flex-1 text-xs text-muted-foreground">
          Total wallet balance
          <b className="ml-1 text-sm text-foreground">{money(liveEarnings)}</b>
        </p>
        <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
          Payout Fri
        </span>
      </div>

      <p className="mt-6 mb-2 text-sm font-semibold text-foreground">Incoming requests</p>
      {providerOnline ? (
        <ul className="space-y-2">
          {incomingRequests.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-foreground">
                  {r.mode === "call" ? (
                    <Phone className="h-4 w-4" />
                  ) : (
                    <MessageCircle className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{r.masked}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.note}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" /> 28s
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => toast("Request declined")}
                  className="h-10 flex-1 rounded-xl bg-muted text-sm font-semibold text-muted-foreground"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => toast.success("Session started")}
                  className="h-10 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
                >
                  Accept
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          Go available to start receiving requests.
        </div>
      )}

      <p className="mt-5 flex items-start gap-2 text-[11px] text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        Customers appear as masked guest IDs. Their phone number and email are never shown to you,
        and yours are never shown to them.
      </p>
    </MobileShell>
  );
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card px-3 py-3 text-center">
      <p
        className={cn(
          "text-lg font-bold tabular-nums",
          accent ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
