import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, Repeat, ShieldCheck, LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";
import { useStore, type ProviderProfile } from "@/lib/app-store";
import { allLanguages, allCategories, money } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

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

function ProviderSettings() {
  const { currentUser, updateProfile, logout, setRole } = useStore();
  const navigate = useNavigate();

  if (!currentUser || currentUser.role !== "provider") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0d1b2a] text-white p-4">
        <p>Please login as a Provider to edit settings.</p>
      </div>
    );
  }

  const profile = currentUser as ProviderProfile;

  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [about, setAbout] = useState(profile.description);
  const [rateChat, setRateChat] = useState(profile.rateChat);
  const [rateCall, setRateCall] = useState(profile.rateCall);
  const [languages, setLanguages] = useState<string[]>(profile.languages || []);
  const [gender, setGender] = useState(profile.gender);
  const [prefGender, setPrefGender] = useState(profile.preferredCustomerGender || "everyone");
  const [categories, setCategories] = useState<string[]>(profile.categories || []);
  const [area, setArea] = useState(profile.area || "");
  const [experience, setExperience] = useState(profile.experience || "");
  const [photo, setPhoto] = useState(profile.photo);

  function toggleList(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
        toast.success("New photo loaded! Click Save changes to apply.");
      };
      reader.readAsDataURL(file);
    }
  };

  function handleSave() {
    if (!name || !username || !area || !experience) {
      toast.error("Please fill in Name, Username, Location and Experience");
      return;
    }

    updateProfile({
      name,
      username,
      description: about,
      rateChat,
      rateCall,
      languages,
      gender,
      preferredCustomerGender: prefGender,
      categories,
      area,
      experience,
      photo,
    });
    toast.success("Profile saved successfully");
  }

  return (
    <MobileShell title="Your profile" subtitle="This is what customers see">
      <div className="flex items-center gap-4">
        <label htmlFor="settingsPhotoUpload" className="relative shrink-0 cursor-pointer group">
          <img
            src={photo}
            alt="Your profile photo"
            width={512}
            height={512}
            className="h-20 w-20 rounded-2xl object-cover border border-white/5 bg-slate-800 transition-opacity group-hover:opacity-80"
          />
          <span className="absolute -right-1 -bottom-1 grid h-8 w-8 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground">
            <Camera className="h-4 w-4" />
          </span>
          <input
            id="settingsPhotoUpload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">@{username} · {profile.rating} ★ ({profile.reviews})</p>
        </div>
      </div>

      <Field label="Display Name">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-card border-border/60 text-foreground rounded-2xl h-11"
        />
      </Field>

      <Field label="Username">
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="bg-card border-border/60 text-foreground rounded-2xl h-11"
        />
      </Field>

      <Field label="Location (Neighbourhood)">
        <Input
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="e.g. Bandra West"
          className="bg-card border-border/60 text-foreground rounded-2xl h-11"
        />
      </Field>

      <Field label="Experience details">
        <Input
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          placeholder="e.g. 5 years coaching"
          className="bg-card border-border/60 text-foreground rounded-2xl h-11"
        />
      </Field>

      <Field label="About you">
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-2xl bg-muted border border-border/60 p-3.5 text-sm leading-relaxed text-foreground outline-none"
        />
      </Field>

      <Field label="Per-minute rate for Chat">
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl font-bold text-[#00f5d4]">{money(rateChat)}</span>
            <span className="text-xs text-muted-foreground">Chat pricing</span>
          </div>
          <input
            type="range"
            min={0.4}
            max={4}
            step={0.1}
            value={rateChat}
            onChange={(e) => setRateChat(Number(e.target.value))}
            className="mt-3 h-2 w-full appearance-none rounded-full bg-muted accent-primary"
          />
        </div>
      </Field>

      <Field label="Per-minute rate for Voice Call">
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl font-bold text-[#00f5d4]">{money(rateCall)}</span>
            <span className="text-xs text-muted-foreground">Voice Call pricing</span>
          </div>
          <input
            type="range"
            min={0.4}
            max={4}
            step={0.1}
            value={rateCall}
            onChange={(e) => setRateCall(Number(e.target.value))}
            className="mt-3 h-2 w-full appearance-none rounded-full bg-muted accent-primary"
          />
        </div>
      </Field>

      <Field label="Languages you speak">
        <div className="flex flex-wrap gap-1.5">
          {allLanguages.map((l) => (
            <Pill
              key={l}
              label={l}
              active={languages.includes(l)}
              onClick={() => toggleList(languages, setLanguages, l)}
            />
          ))}
        </div>
      </Field>

      <Field label="Categories">
        <div className="flex flex-wrap gap-1.5">
          {allCategories.map((c) => (
            <Pill
              key={c}
              label={c}
              active={categories.includes(c)}
              onClick={() => toggleList(categories, setCategories, c)}
            />
          ))}
        </div>
      </Field>

      <Field label="Your gender">
        <div className="flex flex-wrap gap-2">
          {["Woman", "Man", "Non-binary"].map((g) => (
            <Pill key={g} label={g} active={gender.toLowerCase() === g.toLowerCase()} onClick={() => setGender(g.toLowerCase() as typeof gender)} />
          ))}
        </div>
      </Field>

      <Field label="Connect me with (Preferred Customer Gender)">
        <div className="flex flex-wrap gap-2">
          {["everyone", "female", "male"].map((g) => (
            <Pill
              key={g}
              label={g}
              active={prefGender === g}
              onClick={() => setPrefGender(g as any)}
            />
          ))}
        </div>
      </Field>

      <p className="mt-4 flex items-start gap-2 text-[11px] text-slate-400">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        Your contact info is hidden. Customers only see display name, username, bio, and area.
      </p>

      <Button
        className="mt-5 h-12 w-full rounded-2xl text-base font-semibold bg-[#00f5d4] hover:bg-[#00e1c2] text-[#0d1b2a]"
        onClick={handleSave}
      >
        Save changes
      </Button>

      <Button
        variant="secondary"
        className="mt-2 h-12 w-full rounded-2xl text-sm font-semibold border-white/10 text-white"
        onClick={() => {
          // Switch view role to Customer home
          setRole("customer");
          navigate({ to: "/" });
        }}
      >
        <Repeat className="h-4 w-4 text-[#00f5d4]" /> Switch to customer mode
      </Button>

      <button
        onClick={() => {
          logout();
          navigate({ to: "/", replace: true });
        }}
        type="button"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border/60 py-3.5 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
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
        "rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize",
        active
          ? "border-primary bg-primary text-primary-foreground font-semibold"
          : "border-border/60 bg-muted text-muted-foreground"
      )}
    >
      {label}
    </button>
  );
}
