import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Compass, Mail, ShieldAlert, LifeBuoy } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [{ title: "Help & Support — Minute" }],
  }),
  component: HelpPage,
});

function HelpPage() {
  return (
    <MobileShell nav={false} back title="Help & Safety" subtitle="We're here to help 24/7">
      <div className="space-y-4 text-sm text-slate-300">
        <div className="p-4 bg-card border border-border/60 rounded-2xl flex items-start gap-3">
          <LifeBuoy className="h-5 w-5 text-[#00f5d4] shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-white text-base">Frequently Asked Questions</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Find answers to common questions about wallet payments and sessions.</p>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4">
          <FAQItem
            q="How does per-minute billing work?"
            a="Your wallet balance is checked before a call/chat begins. Once connected, your balance is deducted every 60 seconds at the provider's rate. You can end the session at any second, and the remaining balance stays safely in your wallet."
          />
          <FAQItem
            q="Is my personal information safe?"
            a="Yes, absolute privacy is our core value. There are no phone numbers shared; calls and chats are routed through our secure, encrypted in-app channels. Providers only see your chosen name and gender."
          />
          <FAQItem
            q="How do I get paid as a provider?"
            a="As a provider, your earnings accumulate in your provider wallet minus a standard 10% platform commission. You can request bank payouts directly from your status dashboard at any time."
          />
        </div>

        <div className="p-4 bg-card border border-border/60 rounded-2xl space-y-3">
          <h3 className="font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5 text-[#00f5d4]" /> Safety Reporting
          </h3>
          <p className="text-xs leading-relaxed">
            If you experience harassment, abuse, or inappropriate behavior from any user, please end the session immediately. You can block them or send an email report directly to our safety team.
          </p>
          <a
            href="mailto:safety@minuteapp.com"
            className="inline-flex items-center gap-2 text-xs text-[#00f5d4] font-semibold underline mt-1"
          >
            <Mail className="h-3.5 w-3.5" /> safety@minuteapp.com
          </a>
        </div>
      </div>
    </MobileShell>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="space-y-1">
      <h4 className="font-bold text-white text-xs">{q}</h4>
      <p className="text-xs text-slate-400 leading-relaxed">{a}</p>
    </div>
  );
}
