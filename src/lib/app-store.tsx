import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { type Provider, type Review, type Gender } from "./mock-data";
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";

const assetPhotos: Record<string, string> = {
  "asset:p1": p1,
  "asset:p2": p2,
  "asset:p3": p3,
  "asset:p4": p4,
  "asset:p5": p5,
  "asset:p6": p6,
};

function resolvePhoto(photo: string | null | undefined) {
  if (!photo) return "";
  return assetPhotos[photo] ?? photo;
}

export type Role = "customer" | "provider";
export type Mode = "chat" | "call";

export interface Txn {
  id: string;
  kind: "debit" | "credit";
  type: "topup" | "session_chat" | "session_call" | "withdrawal";
  label: string;
  sub: string;
  amount: number;
  timestamp: string;
}

export interface CustomerProfile {
  id: string;
  role: "customer";
  email: string;
  name: string;
  gender: string;
  photo: string;
  balance: number;
  transactions: Txn[];
  savedProviders: string[];
  recentChats: { providerId: string; providerName: string; duration: number; date: string }[];
  recentCalls: { providerId: string; providerName: string; duration: number; date: string }[];
}

export interface ProviderProfile {
  id: string;
  role: "provider";
  email: string;
  name: string;
  username: string;
  photo: string;
  gender: Gender;
  languages: string[];
  area: string;
  description: string;
  categories: string[];
  experience: string;
  rating: number;
  reviews: number;
  rateCall: number;
  rateChat: number;
  rate: number; // default rate
  available: boolean;
  preferredCustomerGender: "male" | "female" | "everyone";
  walletBalance: number;
  totalEarnings: number;
  pendingEarnings: number;
  transactions: Txn[];
  withdrawals: { id: string; amount: number; status: "pending" | "completed"; date: string }[];
  sessions: number;
  responseSec: number;
  reviewsList: Review[];
  /** provider listing row id (differs from the auth user id) */
  listingId: string;
}

export type CurrentUser = CustomerProfile | ProviderProfile;

export interface ActiveSession {
  sessionId: string | null;
  providerId: string;
  mode: Mode;
  rate: number;
  startBalance: number;
  elapsed: number;
  accumulatedCharges: number;
}

export interface SessionSummary {
  providerId: string;
  mode: Mode;
  seconds: number;
  minutes: number;
  amount: number;
  balanceAfter: number;
}

interface Store {
  loading: boolean;
  currentUser: CurrentUser | null;
  providers: Provider[];
  signUp: (email: string, password: string, role: Role, profileData: any) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: any) => void;
  toggleSavedProvider: (providerId: string) => void;
  toggleAvailability: (available: boolean) => void;
  submitReview: (providerId: string, rating: number, comment: string) => void;
  withdrawEarnings: (amount: number) => Promise<boolean>;
  balance: number;
  transactions: Txn[];
  topUp: (amount: number) => void;
  providerOnline: boolean;
  setProviderOnline: (v: boolean) => void;
  session: ActiveSession | null;
  startSession: (providerId: string, mode: Mode) => void;
  endSession: () => void;
  lastSummary: SessionSummary | null;
  liveEarnings: number;
  setRole: (role: Role) => void; // compat
  role: Role; // compat
}

const StoreContext = createContext<Store | null>(null);

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

function mapProvider(row: any, reviewsList: Review[]): Provider {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    photo: resolvePhoto(row.photo),
    gender: (row.gender ?? "female") as Gender,
    rate: num(row.rate_chat),
    rateCall: num(row.rate_call),
    rateChat: num(row.rate_chat),
    rating: num(row.rating),
    reviews: row.reviews ?? reviewsList.length,
    languages: row.languages ?? [],
    description: row.description ?? "",
    area: row.area ?? "",
    distanceKm: num(row.distance_km),
    available: !!row.available,
    connectsWith:
      row.preferred_customer_gender === "female"
        ? "Women"
        : row.preferred_customer_gender === "male"
          ? "Men"
          : "Anyone",
    preferredCustomerGender: row.preferred_customer_gender ?? "everyone",
    categories: row.categories ?? [],
    experience: row.experience ?? "",
    sessions: row.sessions ?? 0,
    responseSec: row.response_sec ?? 15,
    reviewsList,
  };
}

function mapTxn(row: any): Txn {
  return {
    id: row.id,
    kind: row.kind,
    type: row.type,
    label: row.label,
    sub: row.sub ?? "",
    amount: num(row.amount),
    timestamp: new Date(row.created_at).toLocaleString(),
  };
}

function mapReview(row: any): Review {
  return {
    id: row.id,
    customerName: row.customer_name ?? "Guest",
    rating: row.rating,
    comment: row.comment ?? "",
    date: new Date(row.created_at).toLocaleDateString(),
  };
}

function persistDemoCustomerBalance(bal: number) {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("minute_demo_customer_profile");
    const profile = stored ? JSON.parse(stored) : {};
    profile.balance = bal;
    localStorage.setItem("minute_demo_customer_profile", JSON.stringify(profile));
  }
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [session, setSessionState] = useState<ActiveSession | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("minute_active_session");
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const setSession = useCallback((val: ActiveSession | null | ((prev: ActiveSession | null) => ActiveSession | null)) => {
    setSessionState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      if (typeof window !== "undefined") {
        if (next) {
          localStorage.setItem("minute_active_session", JSON.stringify(next));
        } else {
          localStorage.removeItem("minute_active_session");
        }
      }
      return next;
    });
  }, []);
  const [lastSummary, setLastSummary] = useState<SessionSummary | null>(null);
  const endingRef = useRef(false);
  const sessionRef = useRef<ActiveSession | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // ---------------------------------------------------------------- loaders
  const loadProviders = useCallback(async () => {
    let rows: any[] | null = null;
    let reviewRows: any[] | null = null;
    try {
      const res = await Promise.all([
        supabase.from("providers").select("*").order("created_at", { ascending: true }),
        supabase.from("reviews").select("*").order("created_at", { ascending: false }),
      ]);
      rows = res[0].data;
      reviewRows = res[1].data;
    } catch (e) {
      console.warn("Failed to fetch from Supabase, loading mock data fallback:", e);
    }

    if (!rows || rows.length === 0) {
      const { providers: mockProviders } = await import("./mock-data");
      setProviders(mockProviders ?? []);
      return;
    }

    const byProvider = new Map<string, Review[]>();
    (reviewRows ?? []).forEach((r: any) => {
      const list = byProvider.get(r.provider_id) ?? [];
      list.push(mapReview(r));
      byProvider.set(r.provider_id, list);
    });
    setProviders((rows ?? []).map((row: any) => mapProvider(row, byProvider.get(row.id) ?? [])));
  }, []);

  const loadUser = useCallback(async (uid: string, email: string) => {
    let profile: any = null;

    if (email === "customer@demo.com") {
      if (typeof window !== "undefined") {
        const storedProfile = localStorage.getItem("minute_demo_customer_profile");
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          profile = {
            id: uid,
            email,
            role: "customer",
            name: parsed.name ?? "Riya Sharma (Demo Customer)",
            gender: parsed.gender ?? "Woman",
            balance: parsed.balance ?? 250.0,
            photo: parsed.photo ?? "https://api.dicebear.com/7.x/adventurer/svg?seed=riya",
          };
        } else {
          profile = {
            id: uid,
            email,
            role: "customer",
            name: "Riya Sharma (Demo Customer)",
            gender: "Woman",
            balance: 250.0,
            photo: "https://api.dicebear.com/7.x/adventurer/svg?seed=riya",
          };
          localStorage.setItem("minute_demo_customer_profile", JSON.stringify(profile));
        }
      } else {
        profile = {
          id: uid,
          email,
          role: "customer",
          name: "Riya Sharma (Demo Customer)",
          gender: "Woman",
          balance: 250.0,
          photo: "https://api.dicebear.com/7.x/adventurer/svg?seed=riya",
        };
      }
    } else if (email === "provider@demo.com") {
      if (typeof window !== "undefined") {
        const storedProfile = localStorage.getItem("minute_demo_provider_profile");
        if (storedProfile) {
          profile = JSON.parse(storedProfile);
        } else {
          profile = {
            id: uid,
            email,
            role: "provider",
            name: "Ava Roy (Demo Provider)",
            gender: "female",
            balance: 0.0,
            photo: "https://api.dicebear.com/7.x/bottts/svg?seed=ava",
          };
          localStorage.setItem("minute_demo_provider_profile", JSON.stringify(profile));
        }
      } else {
        profile = {
          id: uid,
          email,
          role: "provider",
          name: "Ava Roy (Demo Provider)",
          gender: "female",
          balance: 0.0,
          photo: "https://api.dicebear.com/7.x/bottts/svg?seed=ava",
        };
      }
    } else {
      try {
        const res = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
        profile = res.data;
      } catch (e) {
        console.warn("Failed to load user profile:", e);
      }
    }

    if (!profile) {
      console.log("Profile not found in database, generating profile row dynamically for:", uid);
      const { data: sessionData } = await supabase.auth.getSession();
      const metadata = sessionData.session?.user?.user_metadata ?? {};
      const role = metadata.role ?? "customer";
      
      const newProfile = {
        id: uid,
        email: email,
        role: role,
        name: metadata.name || "New User",
        gender: metadata.gender || "Woman",
        balance: 0.0,
        photo: metadata.photo || `https://api.dicebear.com/7.x/adventurer/svg?seed=${uid}`,
      };

      try {
        await supabase.from("profiles").insert([newProfile]);
        
        if (role === "provider") {
          const newProviderDetail = {
            user_id: uid,
            name: metadata.name || "Provider",
            username: metadata.username || `user_${uid}`,
            gender: metadata.provider_gender || "female",
            languages: metadata.languages || ["English"],
            area: metadata.area || "",
            description: metadata.description || "",
            categories: metadata.categories || ["General Chat"],
            experience: metadata.experience || "",
            rate_call: Number(metadata.rate_call) || 1.5,
            rate_chat: Number(metadata.rate_chat) || 1.0,
            preferred_customer_gender: metadata.preferred_customer_gender || "everyone",
            photo: metadata.photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${uid}`,
            available: true,
          };
          await supabase.from("providers").insert([newProviderDetail]);
        }
      } catch (e) {
        console.error("Failed to insert profile row:", e);
      }

      try {
        const res = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
        profile = res.data;
      } catch (e) {}

      if (!profile) {
        profile = {
          id: uid,
          email,
          role,
          name: newProfile.name,
          gender: newProfile.gender,
          balance: 0.0,
          photo: newProfile.photo,
        };
      }
    }

    if (profile && profile.role === "customer" && profile.email === "customer@demo.com" && num(profile.balance) === 0.0) {
      try {
        await supabase.from("profiles").update({ balance: 250.0 }).eq("id", uid);
        profile.balance = 250.0;
      } catch (e) {
        console.warn("Failed to initialize customer@demo.com balance:", e);
      }
    }

    // Load transactions
    let txnRows: any[] = [];
    try {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      txnRows = data ?? [];
    } catch (e) {}

    // Load local transactions
    const localTxns = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("minute_local_transactions") || "[]")
      : [];
    const userLocalTxns = localTxns.filter((t: any) => t.user_id === uid || t.userId === uid);

    const transactions = [
      ...userLocalTxns.map((t: any) => ({
        id: t.id,
        kind: t.kind,
        type: t.type,
        label: t.label,
        sub: t.sub,
        amount: Number(t.amount),
        timestamp: new Date(t.created_at).toLocaleString(),
      })),
      ...txnRows.map(mapTxn),
    ];

    if (profile.role === "customer") {
      let savedRows: any[] = [];
      let sessionRows: any[] = [];
      try {
        const [savedRes, sessionRes] = await Promise.all([
          supabase.from("saved_providers").select("provider_id"),
          supabase
            .from("sessions")
            .select("provider_id, mode, seconds, ended_at, amount, status")
            .order("started_at", { ascending: false })
            .limit(50),
        ]);
        savedRows = savedRes.data ?? [];
        sessionRows = sessionRes.data ?? [];
      } catch (e) {}

      // Load local sessions
      const localSess = typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("minute_local_sessions") || "[]")
        : [];
      const userLocalSess = localSess
        .filter((s: any) => s.customer_id === uid)
        .map((s: any) => ({
          provider_id: s.provider_id,
          mode: s.mode,
          seconds: s.seconds,
          ended_at: s.ended_at,
          amount: s.amount,
          status: s.status,
        }));

      const combinedSessions = [...userLocalSess, ...sessionRows];
      const history = combinedSessions.map((s: any) => {
        const prov = providers.find((p) => 
          p.id === s.provider_id || 
          p.username === s.provider_id ||
          p.id?.toLowerCase().startsWith(s.provider_id?.toLowerCase()) ||
          s.provider_id?.toLowerCase().startsWith(p.id?.toLowerCase()) ||
          p.username?.toLowerCase().startsWith(s.provider_id?.toLowerCase()) ||
          s.provider_id?.toLowerCase().startsWith(p.username?.toLowerCase())
        );

        const getFallbackName = (id: string) => {
          const lower = String(id).toLowerCase();
          if (lower.includes("ava") || lower.includes("2222")) return "Ava R.";
          if (lower.includes("malik")) return "Malik T.";
          if (lower.includes("mei")) return "Mei L.";
          if (lower.includes("diego")) return "Diego M.";
          if (lower.includes("nour")) return "Nour A.";
          if (lower.includes("jonas")) return "Jonas W.";
          return "Listener";
        };

        const rate = s.mode === "call" ? (prov?.rateCall ?? 1.5) : (prov?.rateChat ?? 1.0);
        const minutes = Math.max(1, Math.ceil((s.seconds ?? 0) / 60));
        const charge = s.amount ?? (minutes * rate);
        return {
          providerId: s.provider_id,
          providerName: prov?.name ?? getFallbackName(s.provider_id),
          duration: s.seconds ?? 0,
          date: s.ended_at ? new Date(s.ended_at).toLocaleString() : "",
          mode: s.mode as Mode,
          charge: Number(charge),
          status: s.status ?? "ended",
        };
      });

      // Load saved list
      const savedIdsLocal = typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("minute_saved_providers") || "[]")
        : [];
      const combinedSaved = Array.from(new Set([
        ...savedIdsLocal,
        ...savedRows.map((r: any) => r.provider_id)
      ]));

      setCurrentUser({
        id: profile.id,
        role: "customer",
        email: profile.email || email,
        name: profile.name,
        gender: profile.gender,
        photo: resolvePhoto(profile.photo),
        balance: num(profile.balance),
        transactions,
        savedProviders: combinedSaved,
        recentChats: history.filter((h: any) => h.mode === "chat").map(({ mode, ...rest }: any) => rest),
        recentCalls: history.filter((h: any) => h.mode === "call").map(({ mode, ...rest }: any) => rest),
      });
      return;
    }

    let listing: any = null;
    let withdrawalRows: any[] = [];
    let reviewRows: any[] = [];

    if (email === "provider@demo.com") {
      listing = {
        id: "demo_provider_listing_id",
        user_id: uid,
        name: "Ava Roy (Demo Provider)",
        username: "ava_r",
        photo: "https://api.dicebear.com/7.x/bottts/svg?seed=ava",
        gender: "female",
        languages: ["English", "Hindi"],
        area: "Bandra West",
        description: "Friendly chat, life coaching, or general listening session.",
        categories: ["General Chat"],
        experience: "4 years",
        rate_call: 1.5,
        rate_chat: 1.0,
        preferred_customer_gender: "everyone",
        wallet_balance: 120.0,
        total_earnings: 840.0,
        pending_earnings: 0.0,
        available: true,
        sessions: 42,
        response_sec: 15,
      };
      withdrawalRows = [];
      reviewRows = [];
    } else {
      try {
        const [listingRes, withdrawalsRes] = await Promise.all([
          supabase.from("providers").select("*").eq("user_id", uid).maybeSingle(),
          supabase.from("withdrawals").select("*").order("created_at", { ascending: false }),
        ]);
        listing = listingRes.data;
        withdrawalRows = withdrawalsRes.data ?? [];
      } catch (e) {}

      if (listing) {
        try {
          const res = await supabase
            .from("reviews")
            .select("*")
            .eq("provider_id", listing.id)
            .order("created_at", { ascending: false });
          reviewRows = res.data ?? [];
        } catch (e) {}
      }
    }

    setCurrentUser({
      id: profile.id,
      listingId: listing?.id ?? profile.id,
      role: "provider",
      email: profile.email || email,
      name: profile.name,
      username: listing?.username ?? `user_${profile.id}`,
      photo: resolvePhoto(profile.photo),
      gender: listing?.gender ?? "female",
      languages: listing?.languages ?? ["English"],
      area: listing?.area ?? "",
      description: listing?.description ?? "",
      categories: listing?.categories ?? ["General Chat"],
      experience: listing?.experience ?? "",
      rateCall: listing?.rate_call ?? 1.5,
      rateChat: listing?.rate_chat ?? 1.0,
      preferredCustomerGender: listing?.preferred_customer_gender ?? "everyone",
      walletBalance: num(listing?.wallet_balance ?? 0),
      totalEarnings: num(listing?.total_earnings ?? 0),
      pendingEarnings: num(listing?.pending_earnings ?? 0),
      transactions,
      withdrawals: (withdrawalRows ?? []).map((w: any) => ({
        id: w.id,
        amount: num(w.amount),
        status: w.status,
        date: new Date(w.created_at).toLocaleDateString(),
      })),
      sessions: listing?.sessions ?? 0,
      responseSec: listing?.response_sec ?? 15,
      reviewsList: (reviewRows ?? []).map(mapReview),
      available: listing?.available ?? true,
    });
  }, [providers]);

  const refresh = useCallback(async () => {
    await loadProviders();
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (user) await loadUser(user.id, user.email ?? "");
  }, [loadProviders, loadUser]);

  // ---------------------------------------------------------------- boot
  // Load initial session and check status on boot
  useEffect(() => {
    let active = true;
    let sub: any = null;

    try {
      const authRes = supabase.auth.onAuthStateChange((event: any, s: any) => {
        if (!active) return;
        if (event === "SIGNED_OUT") {
          setUserId(null);
          setCurrentUser(null);
          setSession(null);
          setLastSummary(null);
          return;
        }
        setUserId(s?.user?.id ?? null);
      });
      sub = authRes.data;
    } catch (e) {
      console.warn("Supabase auth state change subscription failed:", e);
    }

    (async () => {
      try {
        await loadProviders();

        // Restore offline demo account session first
        const offlineUid = typeof window !== "undefined" ? localStorage.getItem("minute_offline_userid") : null;
        const offlineEmail = typeof window !== "undefined" ? localStorage.getItem("minute_offline_email") : null;

        if (offlineUid && offlineEmail) {
          if (active) {
            setUserId(offlineUid);
            await loadUser(offlineUid, offlineEmail);
          }
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (!active) return;
        const user = data.session?.user;
        if (user) {
          setUserId(user.id);
          await loadUser(user.id, user.email ?? "");
        }
      } catch (e) {
        console.warn("Supabase session fetching failed on boot:", e);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      if (sub && sub.subscription) {
        sub.subscription.unsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reload the profile whenever the signed-in user changes
  useEffect(() => {
    if (!userId) return;
    if (userId.startsWith("demo_")) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user;
        if (user) await loadUser(user.id, user.email ?? "");
      } catch (e) {
        console.warn("Supabase reload user session failed:", e);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ---------------------------------------------------------------- auth
  const signUp = useCallback(
    async (email: string, password: string, role: Role, profileData: any): Promise<boolean> => {
      const metadata: any = {
        role,
        name: profileData.name,
        photo: profileData.photo ?? "",
      };
      if (role === "customer") {
        metadata.gender = profileData.gender ?? "everyone";
      } else {
        metadata.username = profileData.username;
        metadata.provider_gender = profileData.gender ?? "female";
        metadata.languages = profileData.languages ?? ["English"];
        metadata.area = profileData.area ?? "";
        metadata.description = profileData.description ?? "";
        metadata.categories = profileData.categories ?? ["General Chat"];
        metadata.experience = profileData.experience ?? "";
        metadata.rate_call = profileData.rateCall ?? 1.5;
        metadata.rate_chat = profileData.rateChat ?? 1.0;
        metadata.preferred_customer_gender = profileData.preferredCustomerGender ?? "everyone";
      }

      const options: any = { data: metadata };
      if (typeof window !== "undefined") options.emailRedirectTo = window.location.origin;

      try {
        const { data, error } = await supabase.auth.signUp({ email, password, options });
        if (error) {
          console.error("SignUp error:", error);
          toast.error(error.message);
          return false;
        }
        if (data.user) {
          if (!data.session) {
            toast.info("Supabase account created! Please verify email check link to login.");
          } else if (data.session?.user) {
            setUserId(data.session.user.id);
            await loadProviders();
          }
          return true;
        }
      } catch (e: any) {
        console.error("Supabase signup exception:", e);
        toast.error(e.message || "Signup failed.");
      }
      return false;
    },
    [loadProviders]
  );

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      // Mock offline login for demo accounts
      if (email === "customer@demo.com" && password === "password123") {
        await loadProviders();
        if (typeof window !== "undefined") {
          localStorage.setItem("minute_offline_userid", "d3b07384-d113-4ec8-a5f1-dd9e248b1111");
          localStorage.setItem("minute_offline_email", "customer@demo.com");
        }
        setUserId("d3b07384-d113-4ec8-a5f1-dd9e248b1111");
        return true;
      }
      if (email === "provider@demo.com" && password === "password123") {
        await loadProviders();
        if (typeof window !== "undefined") {
          localStorage.setItem("minute_offline_userid", "d3b07384-d113-4ec8-a5f1-dd9e248b2222");
          localStorage.setItem("minute_offline_email", "provider@demo.com");
        }
        setUserId("d3b07384-d113-4ec8-a5f1-dd9e248b2222");
        return true;
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          console.error("Login error:", error);
          toast.error(error.message);
          return false;
        }
        if (data.user) {
          await loadProviders();
          setUserId(data.user.id);
          return true;
        }
      } catch (e: any) {
        console.error("Supabase login exception:", e);
        toast.error(e.message || "Login failed.");
      }
      return false;
    },
    [loadProviders]
  );

  const logout = useCallback(() => {
    setSession(null);
    setLastSummary(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("minute_offline_userid");
      localStorage.removeItem("minute_offline_email");
    }
    setUserId(null);
    setCurrentUser(null);
    void supabase.auth.signOut();
  }, [setSession]);

  // ---------------------------------------------------------------- profile
  const updateProfile = useCallback(
    (data: any) => {
      if (!currentUser) return;
      const merged: any = { ...currentUser, ...data };
      if (currentUser.role === "provider" && data.rateChat !== undefined) {
        merged.rate = merged.rateChat;
      }
      setCurrentUser(merged);

      const profilePatch: any = {};
      if (data.name !== undefined) profilePatch.name = data.name;
      if (data.gender !== undefined && currentUser.role === "customer") profilePatch.gender = data.gender;
      if (data.photo !== undefined && currentUser.role === "customer") profilePatch.photo = data.photo;

      void (async () => {
        if (Object.keys(profilePatch).length > 0) {
          await supabase.from("profiles").update(profilePatch).eq("id", currentUser.id);
        }

        if (currentUser.role === "provider") {
          const listingPatch: any = {};
          if (data.name !== undefined) listingPatch.name = data.name;
          if (data.username !== undefined) listingPatch.username = data.username;
          if (data.photo !== undefined) listingPatch.photo = data.photo;
          if (data.gender !== undefined) listingPatch.gender = data.gender;
          if (data.languages !== undefined) listingPatch.languages = data.languages;
          if (data.area !== undefined) listingPatch.area = data.area;
          if (data.description !== undefined) listingPatch.description = data.description;
          if (data.categories !== undefined) listingPatch.categories = data.categories;
          if (data.experience !== undefined) listingPatch.experience = data.experience;
          if (data.rateCall !== undefined) listingPatch.rate_call = data.rateCall;
          if (data.rateChat !== undefined) listingPatch.rate_chat = data.rateChat;
          if (data.available !== undefined) listingPatch.available = data.available;
          if (data.preferredCustomerGender !== undefined)
            listingPatch.preferred_customer_gender = data.preferredCustomerGender;

          if (Object.keys(listingPatch).length > 0) {
            await supabase.from("providers").update(listingPatch).eq("user_id", currentUser.id);
            await loadProviders();
          }
        }
      })();
    },
    [currentUser, loadProviders]
  );

  const toggleSavedProvider = useCallback(
    (providerId: string) => {
      if (!currentUser || currentUser.role !== "customer") return;
      const isSaved = currentUser.savedProviders.includes(providerId);
      const saved = isSaved
        ? currentUser.savedProviders.filter((id) => id !== providerId)
        : [...currentUser.savedProviders, providerId];
      setCurrentUser({ ...currentUser, savedProviders: saved });

      // Save to localStorage so it persists
      localStorage.setItem("minute_saved_providers", JSON.stringify(saved));

      void (async () => {
        try {
          if (isSaved) {
            await supabase
              .from("saved_providers")
              .delete()
              .eq("user_id", currentUser.id)
              .eq("provider_id", providerId);
          } else {
            await supabase
              .from("saved_providers")
              .insert({ user_id: currentUser.id, provider_id: providerId });
          }
        } catch (e) {}
      })();
    },
    [currentUser]
  );

  const toggleAvailability = useCallback(
    (available: boolean) => {
      if (!currentUser || currentUser.role !== "provider") return;
      updateProfile({ available });
    },
    [currentUser, updateProfile]
  );

  const submitReview = useCallback(
    (providerId: string, rating: number, comment: string) => {
      void (async () => {
        await supabase.rpc("submit_review", {
          p_provider_id: providerId,
          p_rating: rating,
          p_comment: comment,
        });
        await refresh();
      })();
    },
    [refresh]
  );

  const withdrawEarnings = useCallback(
    async (amount: number): Promise<boolean> => {
      if (!currentUser || currentUser.role !== "provider") return false;
      if (currentUser.walletBalance < amount) return false;
      const { data, error } = await supabase.rpc("request_withdrawal", { p_amount: amount });
      if (error || data === false) return false;
      await refresh();
      return true;
    },
    [currentUser, refresh]
  );

  const topUp = useCallback(
    (amount: number) => {
      if (!currentUser || currentUser.role !== "customer") return;

      // Update balance for demo customer
      if (currentUser.email === "customer@demo.com") {
        const nextBal = currentUser.balance + amount;
        persistDemoCustomerBalance(nextBal);
        setCurrentUser((prev: any) => prev ? { ...prev, balance: nextBal } : prev);
      }

      void (async () => {
        try {
          const { data, error } = await supabase.rpc("top_up_wallet", { p_amount: amount });
          if (error) {
            // Local fallback on error
            const localTxns = typeof window !== "undefined"
              ? JSON.parse(localStorage.getItem("minute_local_transactions") || "[]")
              : [];
            localTxns.unshift({
              id: `local_tx_${Date.now()}`,
              user_id: currentUser.id,
              kind: "credit",
              type: "topup",
              label: "Wallet Top Up",
              sub: "Added to prepaid balance",
              amount: amount,
              created_at: new Date().toISOString(),
            });
            if (typeof window !== "undefined") {
              localStorage.setItem("minute_local_transactions", JSON.stringify(localTxns));
            }
          }
        } catch (e) {}
        await refresh();
      })();
    },
    [currentUser, refresh]
  );

  // ---------------------------------------------------------------- sessions
  const startSession = useCallback(
    (providerId: string, mode: Mode) => {
      const p = providers.find((pv) => pv.id === providerId);
      if (!p || !currentUser || currentUser.role !== "customer") return;

      const rate = mode === "call" ? p.rateCall : p.rateChat;
      if (currentUser.balance < rate) {
        toast.error("Insufficient balance. Please add money to your wallet.");
        return;
      }

      setLastSummary(null);
      
      const nextBal = Math.max(0, currentUser.balance - rate);

      // Deduct first minute rate immediately client-side
      setCurrentUser((user: any) => {
        if (!user || user.role !== "customer") return user;
        if (user.email === "customer@demo.com") {
          persistDemoCustomerBalance(nextBal);
        }
        return {
          ...user,
          balance: nextBal,
        };
      });

      setSession({
        sessionId: null,
        providerId,
        mode,
        rate,
        startBalance: currentUser.balance,
        elapsed: 0,
        accumulatedCharges: rate,
      });

      void (async () => {
        try {
          const { data, error } = await supabase.rpc("start_session", {
            p_provider_id: providerId,
            p_mode: mode,
          });
          if (error || !data) {
            console.warn("Supabase start_session RPC error or empty response. Falling back to local mock ID.", error);
            const mockId = `mock_sess_${Date.now()}`;
            setSession((curr) => (curr ? { ...curr, sessionId: mockId } : curr));
          } else {
            const row: any = Array.isArray(data) ? data[0] : data;
            setSession((curr) => (curr ? { ...curr, sessionId: row.id } : curr));
          }
        } catch (err) {
          console.error("Supabase start_session RPC exception, falling back to local mock ID.", err);
          const mockId = `mock_sess_${Date.now()}`;
          setSession((curr) => (curr ? { ...curr, sessionId: mockId } : curr));
        }

        setProviders((prev) =>
          prev.map((pv) => (pv.id === providerId ? { ...pv, available: false } : pv))
        );
      })();
    },
    [providers, currentUser]
  );

  const endSession = useCallback(() => {
    const current = sessionRef.current;
    if (!current || endingRef.current) return;
    endingRef.current = true;
    sessionRef.current = null;
    setSession(null);

    const minutes = Math.max(1, Math.ceil(current.elapsed / 60));
    const amount = Math.min(minutes * current.rate, current.startBalance);
    const balanceAfter = Math.max(0, current.startBalance - amount);

    if (currentUser?.email === "customer@demo.com") {
      persistDemoCustomerBalance(balanceAfter);
    }

    const providerName = providers.find((pv) => pv.id === current.providerId)?.name ?? "Listener";

    const isMock = !current.sessionId || current.sessionId.startsWith("mock_");
    if (isMock) {
      // Add local transaction record
      const localTxns = JSON.parse(localStorage.getItem("minute_local_transactions") || "[]");
      localTxns.unshift({
        id: `local_tx_${Date.now()}`,
        user_id: currentUser?.id ?? "local_user",
        kind: "debit",
        type: current.mode === "call" ? "session_call" : "session_chat",
        label: current.mode === "call" ? "Voice Call" : "Chat Session",
        sub: `Paid to listener ${providerName}`,
        amount: amount,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem("minute_local_transactions", JSON.stringify(localTxns));

      // Add local session history record
      const localSess = JSON.parse(localStorage.getItem("minute_local_sessions") || "[]");
      localSess.unshift({
        id: current.sessionId || `mock_${Date.now()}`,
        customer_id: currentUser?.id ?? "local_user",
        provider_id: current.providerId,
        mode: current.mode,
        seconds: current.elapsed,
        ended_at: new Date().toISOString(),
        status: "ended",
        amount: amount,
      });
      localStorage.setItem("minute_local_sessions", JSON.stringify(localSess));
    }

    // optimistic summary so the summary screen renders instantly
    setLastSummary({
      providerId: current.providerId,
      mode: current.mode,
      seconds: current.elapsed,
      minutes,
      amount,
      balanceAfter,
    });

    void (async () => {
      if (current.sessionId && !current.sessionId.startsWith("mock_")) {
        try {
          const { data } = await supabase.rpc("end_session", {
            p_session_id: current.sessionId,
            p_seconds: current.elapsed,
          });
          const result: any = data;
          if (result) {
            setLastSummary({
              providerId: result.provider_id,
              mode: result.mode,
              seconds: result.seconds,
              minutes: result.minutes,
              amount: Number(result.amount),
              balanceAfter: Number(result.balance_after),
            });
          }
        } catch (err) {
          console.warn("Supabase end_session RPC failed:", err);
        }
      }
      await refresh();
      endingRef.current = false;
    })();
  }, [refresh, providers, currentUser]);

  // Real-time session clock + automatic minute billing guard
  useEffect(() => {
    if (!session) return;
    const intervalId = window.setInterval(() => {
      setSession((curr) => {
        if (!curr) return null;
        const nextElapsed = curr.elapsed + 1;
        const neededMinutes = Math.ceil(nextElapsed / 60);
        const currentChargedMinutes = Math.ceil(curr.accumulatedCharges / curr.rate);

        if (neededMinutes > currentChargedMinutes) {
          const nextBillingCost = neededMinutes * curr.rate;
          if (nextBillingCost > curr.startBalance) {
            window.clearInterval(intervalId);
            setTimeout(() => endSession(), 10);
            return curr;
          }
          
          const nextBal = Math.max(0, curr.startBalance - nextBillingCost);

          // Deduct next minute rate client-side in real-time
          setCurrentUser((user: any) => {
            if (!user || user.role !== "customer") return user;
            if (user.email === "customer@demo.com") {
              persistDemoCustomerBalance(nextBal);
            }
            return {
              ...user,
              balance: nextBal,
            };
          });
          return {
            ...curr,
            elapsed: nextElapsed,
            accumulatedCharges: nextBillingCost,
          };
        }

        return { ...curr, elapsed: nextElapsed };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [session !== null, endSession]);

  // ---------------------------------------------------------------- derived
  const balance = useMemo(() => {
    if (!currentUser) return 0;
    return currentUser.role === "customer" ? currentUser.balance : currentUser.walletBalance;
  }, [currentUser]);

  const transactions = useMemo(() => (currentUser ? currentUser.transactions : []), [currentUser]);

  const providerOnline = useMemo(() => {
    if (currentUser && currentUser.role === "provider") return currentUser.available;
    return true;
  }, [currentUser]);

  const setProviderOnline = useCallback(
    (v: boolean) => {
      if (currentUser && currentUser.role === "provider") updateProfile({ available: v });
    },
    [currentUser, updateProfile]
  );

  const liveEarnings = useMemo(() => {
    if (currentUser && currentUser.role === "provider") return currentUser.totalEarnings;
    return 0;
  }, [currentUser]);

  const role: Role = currentUser ? currentUser.role : "customer";
  const setRole = useCallback(() => {}, []);

  const value = useMemo<Store>(
    () => ({
      loading,
      currentUser,
      providers,
      signUp,
      login,
      logout,
      updateProfile,
      toggleSavedProvider,
      toggleAvailability,
      submitReview,
      withdrawEarnings,
      balance,
      transactions,
      topUp,
      providerOnline,
      setProviderOnline,
      session,
      startSession,
      endSession,
      lastSummary,
      liveEarnings,
      setRole,
      role,
    }),
    [
      loading,
      currentUser,
      providers,
      signUp,
      login,
      logout,
      updateProfile,
      toggleSavedProvider,
      toggleAvailability,
      submitReview,
      withdrawEarnings,
      balance,
      transactions,
      topUp,
      providerOnline,
      setProviderOnline,
      session,
      startSession,
      endSession,
      lastSummary,
      liveEarnings,
      setRole,
      role,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside AppStoreProvider");
  return ctx;
}

export function maxMinutes(balance: number, rate: number) {
  return Math.floor(balance / rate);
}
