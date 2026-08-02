import { Link } from "@tanstack/react-router";
import { Star, MessageCircle, Phone } from "lucide-react";
import { money, type Provider } from "@/lib/mock-data";

export function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <Link
      to="/talk/$id"
      params={{ id: provider.id }}
      className="flex gap-3 rounded-2xl border border-border/60 bg-card p-3 active:scale-[0.99] active:bg-muted relative overflow-hidden transition-all hover:border-primary/30"
    >
      <div className="relative shrink-0 self-start">
        <img
          src={provider.photo}
          alt={`${provider.name}, listener`}
          loading="lazy"
          width={512}
          height={512}
          className="h-[74px] w-[74px] rounded-2xl object-cover border border-white/5 bg-slate-800"
        />
        {provider.available ? (
          <span className="absolute -right-1 -bottom-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-card bg-emerald-500">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
        ) : (
          <span className="absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 border-card bg-slate-500" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-foreground flex items-center gap-1.5">
              {provider.name}
              {provider.available && (
                <span className="inline-block rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-500 uppercase tracking-wider">
                  Online
                </span>
              )}
            </h3>
            <p className="text-[10px] text-muted-foreground truncate">
              @{provider.username}
            </p>
          </div>
          <div className="flex flex-col items-end gap-0.5 text-right shrink-0">
            <span className="text-[11px] font-bold text-[#00f5d4] flex items-center gap-0.5 bg-[#00f5d4]/10 px-1.5 py-0.5 rounded-md">
              <MessageCircle className="h-2.5 w-2.5" /> {money(provider.rateChat)}/min
            </span>
            <span className="text-[11px] font-bold text-[#00f5d4] flex items-center gap-0.5 bg-[#00f5d4]/10 px-1.5 py-0.5 rounded-md">
              <Phone className="h-2.5 w-2.5" /> {money(provider.rateCall)}/min
            </span>
          </div>
        </div>

        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-warning text-warning shrink-0" />
          <span className="font-semibold text-foreground">{provider.rating.toFixed(1)}</span>
          <span>({provider.reviews} reviews)</span>
          <span aria-hidden>·</span>
          <span className="truncate">
            {provider.area} · {provider.distanceKm.toFixed(1)} km
          </span>
        </div>

        <p className="mt-1.5 text-xs text-slate-300 line-clamp-2 leading-relaxed">
          {provider.description}
        </p>

        <p className="mt-1.5 truncate text-[10px] text-muted-foreground">
          {provider.languages.join(" · ")}
        </p>
      </div>
    </Link>
  );
}
