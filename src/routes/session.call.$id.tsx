import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Mic, MicOff, PhoneOff, ShieldCheck, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/app-store";
import { clock, getProvider, money } from "@/lib/mock-data";
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
  const provider = getProvider(id);
  const { session, endSession, lastSummary, balance } = useStore();
  const navigate = useNavigate();
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);

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
        <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
          {muted ? "Muted" : "Connected"}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">{provider.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{money(session.rate)} per minute</p>
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
          className="absolute h-[152px] w-[152px] rounded-full object-cover"
        />
      </div>

      <div className="text-center">
        <p className="font-display text-5xl font-bold tabular-nums text-foreground">
          {clock(session.elapsed)}
        </p>
        <div className="mt-3 flex justify-center gap-2 text-sm">
          <span className="rounded-full bg-card px-3 py-1.5 text-muted-foreground">
            Spent <b className="text-foreground">{money(spent)}</b>
          </span>
          <span
            className={cn(
              "rounded-full px-3 py-1.5 font-semibold",
              low ? "bg-destructive/20 text-warning" : "bg-secondary text-primary",
            )}
          >
            {clock(remaining)} left
          </span>
        </div>

        {low ? (
          <button
            type="button"
            onClick={() => navigate({ to: "/wallet" })}
            className="mx-auto mt-4 flex items-center gap-2 rounded-full bg-destructive/15 px-4 py-2 text-xs text-foreground"
          >
            <AlertTriangle className="h-4 w-4 text-warning" />
            Low balance {money(balance)} — tap to top up
          </button>
        ) : (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
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
          className="grid h-20 w-20 place-items-center rounded-full bg-destructive text-destructive-foreground active:scale-95"
        >
          <PhoneOff className="h-8 w-8" />
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
        "grid h-14 w-14 place-items-center rounded-full active:scale-95",
        active ? "bg-primary text-primary-foreground" : "bg-card text-foreground",
      )}
    >
      {children}
    </button>
  );
}
