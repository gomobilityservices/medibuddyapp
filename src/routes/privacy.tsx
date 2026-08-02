import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ShieldCheck, EyeOff, Lock, UserCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [{ title: "Privacy Policy — Minute" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <MobileShell nav={false} back title="Privacy Policy" subtitle="Last updated: August 2026">
      <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
        <div className="p-4 bg-card border border-border/60 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-[#00f5d4] shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-white text-sm">Your Identity is Protected</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">We design our systems to keep you 100% anonymous. We do not sell or trade your data.</p>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-5">
          <Section
            icon={EyeOff}
            title="1. Anonymity by Design"
            text="We never share your email, phone number, or IP address with other users. Providers only see the name and gender you configure in your profile. Chats and calls are encrypted in transit."
          />
          <Section
            icon={Lock}
            title="2. Secure Payments"
            text="All payment transactions are handled through standard, encrypted billing interfaces. Your credit card details are never stored on our servers."
          />
          <Section
            icon={UserCheck}
            title="3. User Control"
            text="You have full rights to inspect, modify, or permanently delete your account profile details. Setting your status to Offline instantly hides all details from our search index."
          />
        </div>
      </div>
    </MobileShell>
  );
}

function Section({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="space-y-1.5">
      <h4 className="font-bold text-white text-sm flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#00f5d4]" /> {title}
      </h4>
      <p className="text-slate-400 leading-relaxed">{text}</p>
    </div>
  );
}
