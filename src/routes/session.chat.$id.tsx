import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowUp, Lock, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/app-store";
import { clock, getProvider, money } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/session/chat/$id")({
  head: () => ({
    meta: [
      { title: "Chat session — Minute" },
      { name: "description", content: "Live pay-per-minute chat session with your listener." },
      { property: "og:title", content: "Chat session — Minute" },
      { property: "og:description", content: "Live pay-per-minute chat session." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ChatSession,
});

const replies = [
  "That makes sense. How long have you been carrying that?",
  "Okay — let's slow down. What is the one thing you want by tonight?",
  "I hear you. Nothing about that reaction is unreasonable.",
  "Try this: say the sentence you're avoiding, out loud, to me first.",
  "Good. Now what is the smallest step you could take today?",
];

function ChatSession() {
  const { id } = Route.useParams();
  const provider = getProvider(id);
  const { session, endSession, lastSummary, balance } = useStore();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{ from: "me" | "them"; text: string }[]>([
    { from: "them", text: "Hey, I'm here. What's on your mind today?" },
  ]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session) return;
    if (lastSummary) navigate({ to: "/session/summary", replace: true });
    else navigate({ to: "/", replace: true });
  }, [session, lastSummary, navigate]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!session || !provider) return null;

  const maxSeconds = Math.floor((session.startBalance / session.rate) * 60);
  const remaining = Math.max(0, maxSeconds - session.elapsed);
  const spent = (session.elapsed / 60) * session.rate;
  const low = remaining <= 120;

  function send() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setMessages((m) => [...m, { from: "me", text }]);
    const reply = replies[Math.floor(Math.random() * replies.length)] ?? replies[0]!;
    window.setTimeout(() => setMessages((m) => [...m, { from: "them", text: reply }]), 1200);
  }

  return (
    <div className="mx-auto flex h-screen w-full max-w-[430px] flex-col bg-background">
      <header className="border-b border-border/60 bg-card px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={provider.photo}
              alt={provider.name}
              width={512}
              height={512}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{provider.name}</p>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Lock className="h-3 w-3" /> In-app chat · {money(session.rate)}/min
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            className="h-9 shrink-0 rounded-full px-4 text-sm font-semibold"
            onClick={endSession}
          >
            End
          </Button>
        </div>

        <div
          className={cn(
            "mt-3 grid grid-cols-3 divide-x divide-border/60 rounded-2xl bg-muted/60 py-2 text-center",
            low && "bg-destructive/15",
          )}
        >
          <Meter label="Elapsed" value={clock(session.elapsed)} />
          <Meter label="Spent" value={money(spent)} />
          <Meter
            label="Time left"
            value={clock(remaining)}
            tone={low ? "warn" : "mint"}
          />
        </div>
      </header>

      {low && (
        <div className="flex items-center gap-2 border-b border-border/60 bg-destructive/15 px-4 py-2.5 text-xs text-foreground">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
          <span className="min-w-0 flex-1">
            Balance {money(balance)} — session ends in {clock(remaining)}.
          </span>
          <button
            type="button"
            onClick={() => navigate({ to: "/wallet" })}
            className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
          >
            Top up
          </button>
        </div>
      )}

      <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
        <p className="mx-auto w-fit rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
          <ShieldCheck className="mr-1 inline h-3 w-3 text-primary" />
          Contact details stay hidden from both sides
        </p>
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
              m.from === "me"
                ? "ml-auto bg-primary text-primary-foreground"
                : "mr-auto bg-card text-foreground",
            )}
          >
            {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border/60 bg-card px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Type a message"
            className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl bg-muted px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={send}
            aria-label="Send message"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Meter({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "mint" | "warn";
}) {
  return (
    <div>
      <p
        className={cn(
          "text-sm font-bold tabular-nums",
          tone === "mint" && "text-primary",
          tone === "warn" && "text-warning",
          !tone && "text-foreground",
        )}
      >
        {value}
      </p>
      <p className="text-[10px] tracking-wide text-muted-foreground uppercase">{label}</p>
    </div>
  );
}
