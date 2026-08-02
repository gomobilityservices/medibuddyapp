import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Search, SlidersHorizontal, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { ProviderCard } from "@/components/ProviderCard";
import { useStore } from "@/lib/app-store";
import { allLanguages, money, providers } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Discover listeners near you — Minute" },
      {
        name: "description",
        content:
          "Browse available listeners and advisors in your area, see their per-minute rate and start a chat or call instantly.",
      },
      { property: "og:title", content: "Discover listeners near you — Minute" },
      {
        property: "og:description",
        content: "Available now in your area. Chat or call and pay by the minute.",
      },
    ],
  }),
  component: Discover,
});

const genderFilters = [
  { key: "all", label: "Anyone" },
  { key: "female", label: "Women" },
  { key: "male", label: "Men" },
] as const;

function Discover() {
  const { balance } = useStore();
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState<(typeof genderFilters)[number]["key"]>("all");
  const [language, setLanguage] = useState<string | null>(null);
  const [maxRate, setMaxRate] = useState(3);
  const [showFilters, setShowFilters] = useState(false);

  const list = useMemo(
    () =>
      providers
        .filter((p) => p.available)
        .filter((p) => (gender === "all" ? true : p.gender === gender))
        .filter((p) => (language ? p.languages.includes(language) : true))
        .filter((p) => p.rate <= maxRate)
        .filter((p) =>
          query.trim()
            ? (p.name + p.description + p.languages.join(" "))
                .toLowerCase()
                .includes(query.trim().toLowerCase())
            : true,
        )
        .sort((a, b) => a.distanceKm - b.distanceKm),
    [gender, language, maxRate, query],
  );

  return (
    <MobileShell
      title="Available now"
      subtitle="Mumbai · within 10 km"
      right={
        <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold text-primary">
          <Wallet className="h-4 w-4" />
          {money(balance)}
        </div>
      }
    >
      <div className="flex items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, language, topic"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-label="Filters"
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border/60",
            showFilters ? "bg-primary text-primary-foreground" : "bg-card text-foreground",
          )}
        >
          <SlidersHorizontal className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        Showing only people who are online in your area
      </div>

      {showFilters && (
        <div className="mt-3 space-y-4 rounded-2xl border border-border/60 bg-card p-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Connect with
            </p>
            <div className="mt-2 flex gap-2">
              {genderFilters.map((g) => (
                <Chip
                  key={g.key}
                  active={gender === g.key}
                  onClick={() => setGender(g.key)}
                  label={g.label}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Language
            </p>
            <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
              <Chip active={language === null} onClick={() => setLanguage(null)} label="Any" />
              {allLanguages.map((l) => (
                <Chip
                  key={l}
                  active={language === l}
                  onClick={() => setLanguage(l)}
                  label={l}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Max rate
              </p>
              <span className="text-sm font-semibold text-primary">{money(maxRate)}/min</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.1}
              value={maxRate}
              onChange={(e) => setMaxRate(Number(e.target.value))}
              className="mt-2 h-2 w-full appearance-none rounded-full bg-muted accent-primary"
            />
          </div>
        </div>
      )}

      <p className="mt-5 mb-2 text-sm font-semibold text-foreground">
        {list.length} online{" "}
        <span className="font-normal text-muted-foreground">· sorted by distance</span>
      </p>

      <div className="space-y-3">
        {list.map((p) => (
          <ProviderCard key={p.id} provider={p} />
        ))}
        {list.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            Nobody matches these filters right now. Try widening your rate or language.
          </div>
        )}
      </div>
    </MobileShell>
  );
}

function Chip({
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
        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/60 bg-muted text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}
