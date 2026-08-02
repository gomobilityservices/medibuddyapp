import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { money, type Provider } from "@/lib/mock-data";

export function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <Link
      to="/talk/$id"
      params={{ id: provider.id }}
      className="flex gap-3 rounded-2xl border border-border/60 bg-card p-3 active:scale-[0.99] active:bg-muted"
    >
      <div className="relative shrink-0">
        <img
          src={provider.photo}
          alt={`${provider.name}, listener`}
          loading="lazy"
          width={512}
          height={512}
          className="h-[74px] w-[74px] rounded-2xl object-cover"
        />
        <span className="absolute -right-0.5 -bottom-0.5 h-4 w-4 rounded-full border-[3px] border-card bg-primary" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-base font-semibold text-foreground">{provider.name}</h3>
          <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-primary">
            {money(provider.rate)}/min
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          <span className="font-semibold text-foreground">{provider.rating.toFixed(1)}</span>
          <span>({provider.reviews})</span>
          <span aria-hidden>·</span>
          <span className="truncate">
            {provider.area} · {provider.distanceKm} km
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {provider.languages.join(" · ")}
        </p>
      </div>
    </Link>
  );
}
