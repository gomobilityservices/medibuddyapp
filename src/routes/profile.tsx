import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  ChevronRight,
  Globe,
  HelpCircle,
  LogOut,
  Repeat,
  ShieldCheck,
  Heart,
  MessageCircle,
  Phone,
  Edit2
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/app-store";
import { money } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  const { balance, currentUser, logout, updateProfile, providers, setRole } = useStore();
  const [openEdit, setOpenEdit] = useState(false);

  // Edit states
  const [editName, setEditName] = useState(currentUser?.name || "");
  const [editGender, setEditGender] = useState(currentUser?.gender || "Woman");

  if (!currentUser) return null;

  const handleSave = () => {
    if (!editName) {
      toast.error("Name is required");
      return;
    }
    updateProfile({
      name: editName,
      gender: editGender,
    });
    setOpenEdit(false);
    toast.success("Profile updated successfully!");
  };

  // Find saved providers info
  const savedList = providers.filter((p) =>
    currentUser.role === "customer" ? (currentUser.savedProviders || []).includes(p.id) : false
  );

  const customerProfile = currentUser.role === "customer" ? currentUser : null;

  return (
    <MobileShell title="Profile" subtitle={`Role: Customer`}>
      <div className="flex items-center gap-4 rounded-3xl border border-border/60 bg-card p-4 relative overflow-hidden">
        <img
          src={currentUser.photo}
          alt={currentUser.name}
          className="h-16 w-16 shrink-0 rounded-full object-cover border border-white/10 bg-slate-800"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-foreground">{currentUser.name}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {currentUser.gender} · Customer
          </p>
          <p className="mt-1 text-xs text-[#00a896] font-semibold">Wallet {money(balance)}</p>
        </div>

        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <DialogTrigger asChild>
            <button className="absolute right-4 top-4 p-2 text-slate-400 bg-muted hover:bg-muted/80 rounded-full border border-border/60 transition-all cursor-pointer">
              <Edit2 className="h-3.5 w-3.5 text-primary" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[380px] bg-card border-border text-foreground rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground text-base font-bold">Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="editName" className="text-xs text-muted-foreground">Name</Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-background border-border text-foreground rounded-xl focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Gender</Label>
                <div className="flex gap-2">
                  {["Woman", "Man", "Non-binary"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setEditGender(g)}
                      className={`flex-1 py-2 border rounded-xl text-xs font-medium transition-all ${
                        editGender === g
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 bg-muted text-muted-foreground"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>



              <Button
                onClick={handleSave}
                className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/95"
              >
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Saved / Bookmarked Providers */}
      <div className="mt-5">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-2 flex items-center gap-1">
          <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" /> Saved Providers ({savedList.length})
        </h3>
        <div className="space-y-2">
          {savedList.map((p) => (
            <a
              key={p.id}
              href={`/talk/${p.id}`}
              className="flex items-center gap-3 p-3 bg-card border border-border/60 rounded-2xl hover:bg-muted/30 transition-all"
            >
              <img src={p.photo} alt={p.name} className="h-10 w-10 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-foreground truncate">{p.name}</h4>
                <p className="text-[10px] text-muted-foreground truncate">{p.area} · {money(p.rateChat)}/min</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </a>
          ))}
          {savedList.length === 0 && (
            <div className="text-center py-5 text-xs text-muted-foreground bg-card/35 border border-dashed border-border rounded-xl">
              No saved providers yet. Tap heart on listener profile to save.
            </div>
          )}
        </div>
      </div>

      {/* Recent Chats */}
      {customerProfile && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-2 flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5 text-primary" /> Recent Chats ({customerProfile.recentChats?.length || 0})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {customerProfile.recentChats?.map((session, index) => (
              <div key={index} className="p-3 bg-card border border-border/60 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-foreground">{session.providerName}</span>
                  <p className="text-[10px] text-muted-foreground">{session.date}</p>
                </div>
                <span className="text-muted-foreground font-medium">
                  {Math.ceil(session.duration / 60)} min
                </span>
              </div>
            ))}
            {(customerProfile.recentChats || []).length === 0 && (
              <div className="text-center py-4 text-xs text-muted-foreground bg-card/35 border border-dashed border-border rounded-xl">
                No recent chats yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Calls */}
      {customerProfile && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-2 flex items-center gap-1">
            <Phone className="h-3.5 w-3.5 text-indigo-500" /> Recent Calls ({customerProfile.recentCalls?.length || 0})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {customerProfile.recentCalls?.map((session, index) => (
              <div key={index} className="p-3 bg-card border border-border/60 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-foreground">{session.providerName}</span>
                  <p className="text-[10px] text-muted-foreground">{session.date}</p>
                </div>
                <span className="text-muted-foreground font-medium">
                  {Math.ceil(session.duration / 60)} min
                </span>
              </div>
            ))}
            {(customerProfile.recentCalls || []).length === 0 && (
              <div className="text-center py-4 text-xs text-muted-foreground bg-card/35 border border-dashed border-border rounded-xl">
                No recent calls yet.
              </div>
            )}
          </div>
        </div>
      )}

      <p className="mt-5 mb-2 text-sm font-semibold text-foreground">Settings</p>
      <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
        <Item icon={Globe} label="Language & region" value="English (IN)" />
        <Item icon={Bell} label="Notifications" value="On" />
        <Item icon={ShieldCheck} label="Privacy" value="Contact info hidden" to="/privacy" />
        <Item icon={HelpCircle} label="Help & safety" value="" to="/help" />
      </ul>

      <button
        onClick={logout}
        type="button"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-border/60 py-3.5 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
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
  to,
}: {
  icon: any;
  label: string;
  value: string;
  to?: string;
}) {
  const inner = (
    <>
      <Icon className="h-[18px] w-[18px] shrink-0 text-primary" />
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{label}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{value}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </>
  );

  if (to) {
    return (
      <li>
        <Link to={to} className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-muted">
          {inner}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button type="button" className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-muted">
        {inner}
      </button>
    </li>
  );
}
