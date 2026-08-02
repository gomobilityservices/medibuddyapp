import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import {
  Clock,
  Languages,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  Timer,
  Users,
} from "lucide-react";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { maxMinutes, useStore, type Mode } from "@/lib/app-store";
import { getProvider, money } from "@/lib/mock-data";

export const Route = createFileRoute("/talk/$id")({
  loader: ({ params }) => {
    const provider = getProvider(params.id);
    if (!provider) throw notFound();
    return { provider };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Listener unavailable — Minute" }, { name: "robots", content: "noindex" }] };
    }
    const { provider } = loaderData;
    const title = `${provider.name} · ${money(provider.rate)}/min — Minute`;
    const description = `${provider.name} speaks ${provider.languages.join(", ")}. Chat or call and pay by the minute.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: TalkDetail,
});

function TalkDetail() {
  const { provider } = Route.useLoaderData();
  const { balance, startSession } = useStore();
  const navigate = useNavigate();
  const [pending, setPending] = useState<Mode | null>(null);

  const minutes = maxMinutes(balance, provider.rate);

  function confirm() {
    if (!pending) return;
    const mode = pending;
    startSession(provider.id, mode);
    setPending(null);
    navigate({
      to: mode === "call" ? "/session/call/$id" : "/session/chat/$id",
      params: { id: provider.id },
    });
  }

  return (
    <MobileShell nav={false} back title={provider.name} subtitle={`${provider.area} · ${provider.distanceKm} km away`}>
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card">
        <img
          src={provider.photo}
          alt={provider.name}
          width={512}
          height={512}
          className="h-56 w-full object-cover"
        />
        <div className="p-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" /> Available
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              <b className="text-foreground">{provider.rating.toFixed(1)}</b> ({provider.reviews}{" "}
              reviews)
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {provider.description}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Per minute" value={money(provider.rate)} />
        <Stat label="Sessions" value={`${provider.sessions}`} />
        <Stat label="Answers in" value={`${provider.responseSec}s`} />
      </div>

      <ul className="mt-3 space-y-2.5 rounded-2xl border border-border/60 bg-card p-4 text-sm">
        <Row icon={Languages} label="Speaks" value={provider.languages.join(", ")} />
        <Row icon={Users} label="Connects with" value={provider.connectsWith} />
        <Row
          icon={Timer}
          label="Your balance covers"
          value={minutes > 0 ? `about ${minutes} min` : "no minutes yet"}
        />
        <Row
          icon={ShieldCheck}
          label="Privacy"
          value="In-app only. No phone number is shared."
        />
      </ul>

      <div className="h-24" />

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] border-t border-border/60 bg-background/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="h-12 flex-1 rounded-2xl text-base font-semibold"
            onClick={() => setPending("chat")}
          >
            <MessageCircle className="h-5 w-5" /> Chat
          </Button>
          <Button
            className="mint-glow h-12 flex-1 rounded-2xl text-base font-semibold"
            onClick={() => setPending("call")}
          >
            <Phone className="h-5 w-5" /> Call
          </Button>
        </div>
      </div>

      <Sheet open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <SheetContent side="bottom" className="mx-auto max-w-[430px] rounded-t-3xl border-border/60 bg-card">
          <SheetHeader className="px-0 text-left">
            <SheetTitle className="text-lg">
              Start {pending === "call" ? "a call" : "a chat"} with {provider.name}?
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-2 rounded-2xl bg-muted/60 p-4 text-sm">
            <Line label="Rate" value={`${money(provider.rate)} / min`} />
            <Line label="Wallet balance" value={money(balance)} />
            <Line
              label="Time you can talk"
              value={minutes > 0 ? `${minutes} min` : "Top up needed"}
              strong
            />
          </div>

          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Billing starts when the session connects and stops the second you end it. Part minutes
            are rounded up.
          </p>

          <Button
            disabled={minutes < 1}
            onClick={confirm}
            className="mt-4 h-12 w-full rounded-2xl text-base font-semibold"
          >
            {minutes < 1 ? "Add money to start" : `Start ${pending === "call" ? "call" : "chat"}`}
          </Button>
        </SheetContent>
      </Sheet>
    </MobileShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card px-3 py-2.5 text-center">
      <p className="text-base font-bold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Languages;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </li>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-bold text-primary" : "font-semibold text-foreground"}>
        {value}
      </span>
    </div>
  );
}
