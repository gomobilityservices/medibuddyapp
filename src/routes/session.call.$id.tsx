import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Mic, MicOff, PhoneOff, ShieldCheck, Volume2, Landmark } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/app-store";
import { clock, money } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/session/call/$id")({
  head: () => ({
    meta: [
      { title: "Call in progress — Minute" },
      { name: "description", content: "Live pay-per-minute call with your listener." },
      { property: "og:title", content: "Call in progress — Minute" },
      { property: "og:description", content: "Live pay-per-minute call." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CallSession,
});

function CallSession() {
  const { id } = Route.useParams();
  const { session, endSession, lastSummary, balance, providers } = useStore();
  const navigate = useNavigate();
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);

  const provider = providers.find((p) => p.id === id);

  useEffect(() => {
    if (session) return;
    if (lastSummary) navigate({ to: "/session/summary", replace: true });
    else navigate({ to: "/", replace: true });
  }, [session, lastSummary, navigate]);

  if (!session || !provider) return null;

  const maxSeconds = Math.floor((session.startBalance / session.rate) * 60);
  const remaining = Math.max(0, maxSeconds - session.elapsed);
  const spent = (session.elapsed / 60) * session.rate;
  const low = remaining <= 120;
  const progress = maxSeconds > 0 ? remaining / maxSeconds : 0;
  const circumference = 2 * Math.PI * 88;

  return (
    <div className="mx-auto flex h-screen w-full max-w-[430px] flex-col justify-between bg-background px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="text-center">
        <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase font-bold">
          {muted ? "Muted" : "Connected (Voice Call)"}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">{provider.name}</h1>
        <p className="mt-1 text-xs text-muted-foreground">Rate: {money(session.rate)} per minute</p>
      </div>

      <div className="relative mx-auto grid place-items-center">
        <svg width="200" height="200" className="-rotate-90">
          <circle cx="100" cy="100" r="88" fill="none" strokeWidth="6" className="stroke-muted" />
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            className={cn("transition-[stroke-dashoffset] duration-1000", low ? "stroke-warning" : "stroke-primary")}
          />
        </svg>
        <img
          src={provider.photo}
          alt={provider.name}
          width={512}
          height={512}
          className="absolute h-[152px] w-[152px] rounded-full object-cover border border-white/10"
        />
      </div>

      {/* Real-time Call Metrics Dashboard */}
      <div className="space-y-4">
        <div className="text-center">
          <p className="font-display text-5xl font-bold tracking-tight tabular-nums text-foreground">
            {clock(session.elapsed)}
          </p>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Elapsed Call Time</span>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-muted/65 border border-border/60 p-3.5 rounded-2xl text-center">
          <div>
            <p className="text-xs font-bold text-foreground tabular-nums">{money(spent)}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Spent Balance</p>
          </div>
          <div>
            <p className="text-xs font-bold text-foreground tabular-nums">{money(balance)}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Wallet Balance</p>
          </div>
          <div>
            <p className={cn("text-xs font-bold tabular-nums", low ? "text-rose-500 font-extrabold" : "text-primary")}>
              {clock(remaining)}
            </p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Remaining Time</p>
          </div>
        </div>

        {low ? (
          <button
            type="button"
            onClick={() => navigate({ to: "/wallet" })}
            className="mx-auto mt-2 flex items-center justify-center gap-2 rounded-full bg-destructive/10 border border-destructive/20 px-4 py-2 text-xs text-rose-500 font-bold"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
            Low balance {money(balance)} — Top up now
          </button>
        ) : (
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Numbers are never shared — this call is routed in-app
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-5">
        <CircleBtn
          label={muted ? "Unmute" : "Mute"}
          active={muted}
          onClick={() => setMuted((v) => !v)}
        >
          {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </CircleBtn>

        <button
          type="button"
          aria-label="End call"
          onClick={endSession}
          className="grid h-20 w-20 place-items-center rounded-full bg-destructive text-white hover:bg-destructive/90 transition-all active:scale-95 shadow-lg"
        >
          <PhoneOff className="h-8 w-8 animate-pulse" />
        </button>

        <CircleBtn
          label="Speaker"
          active={speaker}
          onClick={() => setSpeaker((v) => !v)}
        >
          <Volume2 className="h-6 w-6" />
        </CircleBtn>
      </div>
    </div>
  );
}

function CircleBtn({
  children,
  label,
  active,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid h-14 w-14 place-items-center rounded-full transition-all active:scale-95",
        active ? "bg-primary text-primary-foreground shadow" : "bg-card border border-border/60 text-foreground",
      )}
    >
      {children}
    </button>
  );
}
