import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, Repeat, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import myPhoto from "@/assets/p1.jpg";
import { MobileShell } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/app-store";
import { allLanguages, money } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/provider/settings")({
  head: () => ({
    meta: [
      { title: "Provider profile — Minute" },
      {
        name: "description",
        content: "Set your per-minute rate, spoken languages, photo and who you want to be connected with.",
      },
      { property: "og:title", content: "Provider profile — Minute" },
      { property: "og:description", content: "Rate, languages and connection preferences." },
    ],
  }),
  component: ProviderSettings,
});

const audiences = ["Anyone", "Women", "Men", "Non-binary"];

function ProviderSettings() {
  const { setRole } = useStore();
  const navigate = useNavigate();
  const [rate, setRate] = useState(1.2);
  const [languages, setLanguages] = useState(["English", "Hindi"]);
  const [gender, setGender] = useState("Woman");
  const [audience, setAudience] = useState(["Anyone"]);
  const [about, setAbout] = useState(
    "Career coach turned late-night listener. I am good at untangling messy thoughts and helping you decide the next small step.",
  );

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  return (
    <MobileShell title="Your profile" subtitle="This is what customers see">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <img
            src={myPhoto}
            alt="Your profile photo"
            width={512}
            height={512}
            className="h-20 w-20 rounded-2xl object-cover"
          />
          <span className="absolute -right-1 -bottom-1 grid h-8 w-8 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground">
            <Camera className="h-4 w-4" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-foreground">Ava R.</p>
          <p className="text-xs text-muted-foreground">Bandra West · 4.9 ★ (312)</p>
        </div>
      </div>

      <Field label="About you">
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          rows={4}
          className="w-full resize-none rounded-2xl bg-muted p-3.5 text-sm leading-relaxed text-foreground outline-none"
        />
      </Field>

      <Field label="Per-minute rate">
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-3xl font-bold text-primary">{money(rate)}</span>
            <span className="text-xs text-muted-foreground">
              ≈ {money(rate * 60)} per hour before fees
            </span>
          </div>
          <input
            type="range"
            min={0.4}
            max={4}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="mt-3 h-2 w-full appearance-none rounded-full bg-muted accent-primary"
          />
        </div>
      </Field>

      <Field label="Languages you speak">
        <div className="flex flex-wrap gap-2">
          {allLanguages.map((l) => (
            <Pill
              key={l}
              label={l}
              active={languages.includes(l)}
              onClick={() => toggle(languages, setLanguages, l)}
            />
          ))}
        </div>
      </Field>

      <Field label="Your gender">
        <div className="flex flex-wrap gap-2">
          {["Woman", "Man", "Non-binary"].map((g) => (
            <Pill key={g} label={g} active={gender === g} onClick={() => setGender(g)} />
          ))}
        </div>
      </Field>

      <Field label="Connect me with">
        <div className="flex flex-wrap gap-2">
          {audiences.map((a) => (
            <Pill
              key={a}
              label={a}
              active={audience.includes(a)}
              onClick={() => toggle(audience, setAudience, a)}
            />
          ))}
        </div>
      </Field>

      <p className="mt-4 flex items-start gap-2 text-[11px] text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        Your number, email and exact address are never shown. Customers only see your display name
        and neighbourhood.
      </p>

      <Button
        className="mt-4 h-12 w-full rounded-2xl text-base font-semibold"
        onClick={() => toast.success("Profile saved")}
      >
        Save changes
      </Button>

      <Button
        variant="secondary"
        className="mt-2 h-12 w-full rounded-2xl text-sm font-semibold"
        onClick={() => {
          setRole("customer");
          navigate({ to: "/" });
        }}
      >
        <Repeat className="h-4 w-4" /> Switch to customer mode
      </Button>
    </MobileShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}

function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/60 bg-muted text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}
