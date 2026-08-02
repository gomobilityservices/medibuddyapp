import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronRight, Globe, HelpCircle, LogOut, Repeat, ShieldCheck } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/app-store";
import { money } from "@/lib/mock-data";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Minute" },
      {
        name: "description",
        content: "Your Minute account: display name, gender, notification and privacy settings.",
      },
      { property: "og:title", content: "Your profile — Minute" },
      { property: "og:description", content: "Manage your Minute account and privacy settings." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { balance, setRole } = useStore();
  const navigate = useNavigate();

  return (
    <MobileShell title="Profile" subtitle="Guest #5512">
      <div className="flex items-center gap-4 rounded-3xl border border-border/60 bg-card p-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-secondary text-2xl font-bold text-primary">
          R
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-foreground">Riya S.</p>
          <p className="text-sm text-muted-foreground">Woman · 27 · Mumbai</p>
          <p className="mt-1 text-xs text-primary">Wallet {money(balance)}</p>
        </div>
      </div>

      <p className="mt-5 mb-2 text-sm font-semibold text-foreground">Account</p>
      <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
        <Item icon={Globe} label="Language & region" value="English (IN)" />
        <Item icon={Bell} label="Notifications" value="On" />
        <Item icon={ShieldCheck} label="Privacy" value="Contact info hidden" />
        <Item icon={HelpCircle} label="Help & safety" value="" />
      </ul>

      <div className="mt-5 rounded-2xl border border-primary/30 bg-secondary/60 p-4">
        <p className="text-sm font-semibold text-foreground">Want to earn instead?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Switch to the provider side to set your rate, go available and track earnings.
        </p>
        <Button
          className="mt-3 h-11 w-full rounded-2xl font-semibold"
          onClick={() => {
            setRole("provider");
            navigate({ to: "/provider" });
          }}
        >
          <Repeat className="h-4 w-4" /> Switch to provider mode
        </Button>
      </div>

      <button
        type="button"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border/60 py-3.5 text-sm font-semibold text-destructive"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </MobileShell>
  );
}

function Item({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Globe;
  label: string;
  value: string;
}) {
  return (
    <li>
      <button type="button" className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-muted">
        <Icon className="h-[18px] w-[18px] shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate text-sm text-foreground">{label}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{value}</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
    </li>
  );
}
