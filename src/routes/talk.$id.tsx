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
  Heart,
  Share2,
  Briefcase,
  BookOpen
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { maxMinutes, useStore, type Mode } from "@/lib/app-store";
import { money } from "@/lib/mock-data";

export const Route = createFileRoute("/talk/$id")({
  loader: ({ params }) => {
    return { id: params.id };
  },
  head: ({ params }) => {
    const title = `Talk to listener — Minute`;
    return {
      meta: [
        { title },
        { name: "description", content: "Chat or call and pay by the minute." },
      ],
    };
  },
  component: TalkDetail,
});

function TalkDetail() {
  const { id } = Route.useLoaderData();
  const { balance, providers, startSession, toggleSavedProvider, currentUser } = useStore();
  const navigate = useNavigate();
  const [pending, setPending] = useState<Mode | null>(null);

  const provider = providers.find((p) => p.id === id);
  if (!provider) {
    throw notFound();
  }

  const isSaved = currentUser?.role === "customer" && currentUser.savedProviders.includes(provider.id);
  const activeRate = pending === "call" ? provider.rateCall : provider.rateChat;
  const minutes = maxMinutes(balance, activeRate);

  const chatMinutes = maxMinutes(balance, provider.rateChat);
  const callMinutes = maxMinutes(balance, provider.rateCall);

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

  function handleShare() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Profile link copied to clipboard!");
    }
  }

  return (
    <MobileShell
      nav={false}
      back
      title={provider.name}
      subtitle={`${provider.area} · ${provider.distanceKm.toFixed(1)} km away`}
      right={
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => toggleSavedProvider(provider.id)}
            aria-label="Favorite"
            className={`grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-card transition-all ${
              isSaved ? "text-rose-500 border-rose-500/30 bg-rose-500/10" : "text-slate-400 hover:text-foreground"
            }`}
          >
            <Heart className={`h-5 w-5 ${isSaved ? "fill-rose-500" : ""}`} />
          </button>
          <button
            onClick={handleShare}
            aria-label="Share profile"
            className="grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-card text-slate-400 hover:text-foreground active:bg-muted"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      }
    >
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card relative">
        <img
          src={provider.photo}
          alt={provider.name}
          width={512}
          height={512}
          className="h-56 w-full object-cover"
        />
        <div className="p-4">
          <div className="flex items-center gap-2">
            {provider.available ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Available
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-semibold text-slate-400">
                <span className="h-2 w-2 rounded-full bg-slate-500" /> Offline
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              <b className="text-foreground">{provider.rating.toFixed(1)}</b> ({provider.reviews}{" "}
              reviews)
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {provider.description}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Chat Price" value={`${money(provider.rateChat)}/min`} />
        <Stat label="Call Price" value={`${money(provider.rateCall)}/min`} />
        <Stat label="Total Talks" value={`${provider.sessions}`} />
      </div>

      <ul className="mt-3 space-y-2.5 rounded-2xl border border-border/60 bg-card p-4 text-sm">
        <Row icon={Languages} label="Speaks" value={provider.languages.join(", ")} />
        <Row icon={Briefcase} label="Experience" value={provider.experience} />
        {provider.categories && provider.categories.length > 0 && (
          <Row icon={BookOpen} label="Categories" value={provider.categories.join(", ")} />
        )}

        <Row
          icon={ShieldCheck}
          label="Privacy"
          value="In-app only. No phone number is shared."
        />
      </ul>

      {/* Reviews Section */}
      <div className="mt-5">
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
          Recent Reviews ({provider.reviewsList.length})
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {provider.reviewsList.map((rev) => (
            <div key={rev.id} className="p-3 bg-card border border-border/60 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <div className="flex gap-0.5 text-warning">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${i < rev.rating ? "fill-warning text-warning" : "text-muted"}`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">{rev.date}</span>
              </div>
              {rev.comment && <p className="text-slate-600 leading-relaxed">"{rev.comment}"</p>}
            </div>
          ))}
          {provider.reviewsList.length === 0 && (
            <div className="text-center py-6 text-xs text-muted-foreground bg-card/40 border border-dashed border-border rounded-xl">
              No reviews yet. Completed sessions will display feedback here.
            </div>
          )}
        </div>
      </div>

      <div className="h-24" />

      {/* Footer session triggers */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] border-t border-border/60 bg-background/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="h-12 flex-1 rounded-2xl text-base font-semibold text-primary bg-secondary hover:bg-secondary/90 border border-primary/10"
            onClick={() => setPending("chat")}
            disabled={!provider.available}
          >
            <MessageCircle className="h-5 w-5 text-primary" /> Chat ({money(provider.rateChat)}/m)
          </Button>
          <Button
            className="h-12 flex-1 rounded-2xl text-base font-semibold text-primary-foreground bg-primary hover:bg-primary/95"
            onClick={() => setPending("call")}
            disabled={!provider.available}
          >
            <Phone className="h-5 w-5" /> Call ({money(provider.rateCall)}/m)
          </Button>
        </div>
      </div>

      <Sheet open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <SheetContent side="bottom" className="mx-auto max-w-[430px] rounded-t-3xl border-border/60 bg-card text-foreground">
          <SheetHeader className="px-0 text-left">
            <SheetTitle className="text-lg text-foreground">
              Start {pending === "call" ? "a call" : "a chat"} with {provider.name}?
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-2 rounded-2xl bg-muted p-4 text-sm mt-3 text-muted-foreground">
            <Line label="Selected Mode" value={pending === "call" ? "Voice Call" : "Chat"} />
            <Line label="Session Rate" value={`${money(activeRate)} / min`} />
            <Line label="Your Wallet Balance" value={money(balance)} />
            <Line
              label="Talk Time Covered"
              value={minutes > 0 ? `${minutes} min` : "Top up needed"}
              strong
            />
          </div>

          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Billing starts when connection is established and deducts every minute. Partial minutes are rounded up. 10% commission is deducted from provider earnings.
          </p>

          <Button
            disabled={minutes < 1}
            onClick={confirm}
            className="mt-4 h-12 w-full rounded-2xl text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
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
  icon: any;
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
