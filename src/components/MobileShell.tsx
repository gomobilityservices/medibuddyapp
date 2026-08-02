import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft, Compass, LineChart, Radio, User, Wallet, History } from "lucide-react";
import type { ReactNode } from "react";
import { useStore } from "@/lib/app-store";
import { cn } from "@/lib/utils";

export function MobileShell({
  children,
  title,
  subtitle,
  right,
  back,
  nav = true,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  back?: boolean;
  nav?: boolean;
}) {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-background">
      {(title || back) && (
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {back && (
                <button
                  type="button"
                  aria-label="Go back"
                  onClick={() => router.history.back()}
                  className="-ml-2 grid h-9 w-9 shrink-0 place-items-center rounded-full text-foreground active:bg-muted"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <div className="min-w-0">
                {title && (
                  <h1 className="truncate text-xl font-bold text-foreground">{title}</h1>
                )}
                {subtitle && (
                  <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>
            {right && <div className="shrink-0">{right}</div>}
          </div>
        </header>
      )}

      <main className={cn("flex-1 px-4 pt-4", nav ? "pb-28" : "pb-6")}>{children}</main>

      {nav && <BottomNav />}
    </div>
  );
}

function BottomNav() {
  const { role } = useStore();
  const pathname = useRouter().state.location.pathname;
  const providerNav = pathname.startsWith("/provider") || role === "provider";

  const items =
    !providerNav
      ? [
          { to: "/", label: "Discover", icon: Compass },
          { to: "/activity", label: "Activity", icon: History },
          { to: "/wallet", label: "Wallet", icon: Wallet },
          { to: "/profile", label: "Profile", icon: User },
        ]
      : [
          { to: "/provider", label: "Status", icon: Radio },
          { to: "/provider/earnings", label: "Earnings", icon: LineChart },
          { to: "/provider/settings", label: "Profile", icon: User },
        ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] border-t border-border/60 bg-card/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur">
      <ul className="flex">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: true }}
              className="flex flex-col items-center gap-1 py-3 text-[11px] font-medium text-muted-foreground"
              activeProps={{ className: "!text-primary" }}
            >
              <Icon className="h-[22px] w-[22px]" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
