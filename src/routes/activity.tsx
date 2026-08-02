import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, MessageCircle, Phone, ChevronRight } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { useStore } from "@/lib/app-store";
import { money } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Your Activity — Minute" },
      {
        name: "description",
        content: "Review your saved providers, chat history, and call history.",
      },
    ],
  }),
  component: ActivityPage,
});

function ActivityPage() {
  const { providers, currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<"saved" | "chats" | "calls">("saved");

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground p-4">
        <p>Please log in to view your activity.</p>
      </div>
    );
  }

  const savedList = providers.filter((p) =>
    currentUser.role === "customer" ? (currentUser.savedProviders || []).includes(p.id) : false
  );

  const customerProfile = currentUser.role === "customer" ? currentUser : null;

  return (
    <MobileShell title="Activity" subtitle="Your history and saved listeners" back nav={true}>
      {/* Sub Tab Switcher */}
      <div className="flex border-b border-border/60 mb-5">
        {(["saved", "chats", "calls"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 pb-3 text-center text-sm font-semibold capitalize transition-all border-b-2 cursor-pointer",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "saved" ? "Saved" : tab === "chats" ? "Recent Chats" : "Recent Calls"}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === "saved" && (
        <div className="space-y-2">
          {savedList.map((p) => (
            <Link
              key={p.id}
              to={`/talk/${p.id}`}
              className="flex items-center gap-3 p-3.5 bg-card border border-border/60 rounded-2xl hover:bg-muted/30 transition-all"
            >
              <img src={p.photo} alt={p.name} className="h-10 w-10 rounded-xl object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-foreground truncate">{p.name}</h4>
                <p className="text-[10px] text-muted-foreground truncate">{p.area} · {money(p.rateChat)}/min</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
          {savedList.length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground bg-card/35 border border-dashed border-border rounded-2xl">
              <Heart className="mx-auto h-8 w-8 text-slate-500 mb-2" />
              No saved providers yet. Tap the heart on a listener's profile to save them.
            </div>
          )}
        </div>
      )}

      {activeTab === "chats" && customerProfile && (
        <div className="space-y-2">
          {customerProfile.recentChats?.map((session, index) => (
            <div key={index} className="p-3.5 bg-card border border-border/60 rounded-2xl flex items-center justify-between text-xs">
              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground truncate">{session.providerName}</span>
                  {session.status === "active" && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{session.date || "Active Now"}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold text-foreground block">{money(session.charge)}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  {session.status === "active" ? "In progress" : `${Math.ceil(session.duration / 60)} min`}
                </span>
              </div>
            </div>
          ))}
          {(customerProfile.recentChats || []).length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground bg-card/35 border border-dashed border-border rounded-2xl">
              <MessageCircle className="mx-auto h-8 w-8 text-slate-500 mb-2" />
              No recent chats yet.
            </div>
          )}
        </div>
      )}

      {activeTab === "calls" && customerProfile && (
        <div className="space-y-2">
          {customerProfile.recentCalls?.map((session, index) => (
            <div key={index} className="p-3.5 bg-card border border-border/60 rounded-2xl flex items-center justify-between text-xs">
              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground truncate">{session.providerName}</span>
                  {session.status === "active" && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{session.date || "Active Now"}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold text-foreground block">{money(session.charge)}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  {session.status === "active" ? "In progress" : `${Math.ceil(session.duration / 60)} min`}
                </span>
              </div>
            </div>
          ))}
          {(customerProfile.recentCalls || []).length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground bg-card/35 border border-dashed border-border rounded-2xl">
              <Phone className="mx-auto h-8 w-8 text-slate-500 mb-2" />
              No recent calls yet.
            </div>
          )}
        </div>
      )}
    </MobileShell>
  );
}
