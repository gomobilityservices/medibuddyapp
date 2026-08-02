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

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [session, setSession] = useState<ActiveSession | null>(null);
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
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    if (!profile) {
      setCurrentUser(null);
      return;
    }

    const { data: txnRows } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    const transactions = (txnRows ?? []).map(mapTxn);

    if (profile.role === "customer") {
      const [{ data: savedRows }, { data: sessionRows }] = await Promise.all([
        supabase.from("saved_providers").select("provider_id"),
        supabase
          .from("sessions")
          .select("provider_id, mode, seconds, ended_at")
          .eq("status", "ended")
          .order("started_at", { ascending: false })
          .limit(50),
      ]);

      const nameFor = (id: string) => providers.find((p) => p.id === id)?.name ?? "Provider";
      const history = (sessionRows ?? []).map((s: any) => ({
        providerId: s.provider_id,
        providerName: nameFor(s.provider_id),
        duration: s.seconds ?? 0,
        date: s.ended_at ? new Date(s.ended_at).toLocaleString() : "",
        mode: s.mode as Mode,
      }));

      setCurrentUser({
        id: profile.id,
        role: "customer",
        email: profile.email || email,
        name: profile.name,
        gender: profile.gender,
        photo: resolvePhoto(profile.photo),
        balance: num(profile.balance),
        transactions,
        savedProviders: (savedRows ?? []).map((r: any) => r.provider_id),
        recentChats: history.filter((h: any) => h.mode === "chat").map(({ mode, ...rest }: any) => rest),
        recentCalls: history.filter((h: any) => h.mode === "call").map(({ mode, ...rest }: any) => rest),
      });
      return;
    }

    const [{ data: listing }, { data: withdrawalRows }] = await Promise.all([
      supabase.from("providers").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("withdrawals").select("*").order("created_at", { ascending: false }),
    ]);

    const { data: reviewRows } = listing
      ? await supabase
          .from("reviews")
          .select("*")
          .eq("provider_id", listing.id)
          .order("created_at", { ascending: false })
      : { data: [] as any[] };

    setCurrentUser({
      id: profile.id,
      listingId: listing?.id ?? profile.id,
      role: "provider",
      email: profile.email || email,
      name: profile.name,
      username: listing?.username ?? "",
      photo: resolvePhoto(listing?.photo || profile.photo),
      gender: (listing?.gender ?? "female") as Gender,
      languages: listing?.languages ?? [],
      area: listing?.area ?? "",
      description: listing?.description ?? "",
      categories: listing?.categories ?? [],
      experience: listing?.experience ?? "",
      rating: num(listing?.rating),
      reviews: listing?.reviews ?? 0,
      rateCall: num(listing?.rate_call),
      rateChat: num(listing?.rate_chat),
      rate: num(listing?.rate_chat),
      available: !!listing?.available,
      preferredCustomerGender: (listing?.preferred_customer_gender ?? "everyone") as
        | "male"
        | "female"
        | "everyone",
      walletBalance: num(profile.wallet_balance),
      totalEarnings: num(profile.total_earnings),
      pendingEarnings: num(profile.pending_earnings),
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
        if (!error && data.user) {
          if (!data.session) {
            toast.info("Supabase account created! Verification email sent.");
          } else if (data.session?.user) {
            setUserId(data.session.user.id);
            await loadProviders();
          }
          return true;
        }
      } catch (e) {
        console.warn("Supabase signup failed, falling back to local signup:", e);
      }

      // Local storage auth database fallback
      const LOCAL_USERS_KEY = "minute_local_users_db";
      const localUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "{}");
      if (localUsers[email]) {
        toast.error("This email is already registered locally.");
        return false;
      }

      const localId = `local_${Date.now()}`;
      let profile: any = {};
      if (role === "customer") {
        profile = {
          id: localId,
          role: "customer",
          email,
          name: profileData.name || "Customer",
          gender: profileData.gender || "Everyone",
          photo: profileData.photo || `https://api.dicebear.com/7.x/adventurer/svg?seed=${localId}`,
          balance: 0.0,
          transactions: [],
          savedProviders: [],
          recentChats: [],
          recentCalls: [],
        };
      } else {
        profile = {
          id: localId,
          listingId: localId,
          role: "provider",
          email,
          name: profileData.name || "Provider",
          username: profileData.username || `user_${localId}`,
          photo: profileData.photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${localId}`,
          gender: profileData.gender || "female",
          languages: profileData.languages || ["English"],
          area: profileData.area || "",
          description: profileData.description || "",
          categories: profileData.categories || ["General Chat"],
          experience: profileData.experience || "",
          rateCall: profileData.rateCall || 1.5,
          rateChat: profileData.rateChat || 1.0,
          preferredCustomerGender: profileData.preferredCustomerGender || "everyone",
          walletBalance: 0.0,
          totalEarnings: 0.0,
          pendingEarnings: 0.0,
          transactions: [],
          withdrawals: [],
          rating: 5.0,
          reviews: 0,
          reviewsList: [],
          available: true,
          sessions: 0,
          responseSec: 15,
        };

        // Add new provider to active listing list
        setProviders((prev) => [...prev, profile]);
      }

      localUsers[email] = { password, role, profile };
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));
      
      // Log in local user
      setUserId(localId);
      setCurrentUser(profile);
      toast.success("Local account created successfully!");
      return true;
    },
    [loadProviders]
  );

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      // Demo accounts for local testing bypass
      if (email === "customer@demo.com" && password === "password123") {
        await loadProviders();
        setUserId("demo_customer_id");
        setCurrentUser({
          id: "demo_customer_id",
          role: "customer",
          email: "customer@demo.com",
          name: "Riya Sharma (Demo Customer)",
          gender: "Woman",
          photo: "https://api.dicebear.com/7.x/adventurer/svg?seed=riya",
          balance: 250.0,
          transactions: [],
          savedProviders: [],
          recentChats: [],
          recentCalls: [],
        });
        return true;
      }
      if (email === "provider@demo.com" && password === "password123") {
        await loadProviders();
        setUserId("demo_provider_id");
        setCurrentUser({
          id: "demo_provider_id",
          listingId: "1",
          role: "provider",
          email: "provider@demo.com",
          name: "Ava Roy (Demo Provider)",
          username: "ava_r",
          photo: "https://api.dicebear.com/7.x/bottts/svg?seed=ava",
          gender: "female",
          languages: ["English", "Hindi"],
          area: "Bandra West",
          description: "Friendly chat, life coaching, or general listening session.",
          categories: ["General Chat"],
          experience: "4 years",
          rateCall: 1.5,
          rateChat: 1.0,
          rate: 1.0,
          preferredCustomerGender: "everyone",
          walletBalance: 120.0,
          totalEarnings: 840.0,
          pendingEarnings: 0.0,
          transactions: [],
          withdrawals: [],
          rating: 4.8,
          reviews: 12,
          reviewsList: [],
          available: true,
          sessions: 42,
          responseSec: 15,
        });
        return true;
      }

      // Check local storage auth database
      const LOCAL_USERS_KEY = "minute_local_users_db";
      const localUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "{}");
      if (localUsers[email] && localUsers[email].password === password) {
        await loadProviders();
        const localUser = localUsers[email];
        setUserId(localUser.profile.id);
        setCurrentUser(localUser.profile);
        toast.success("Welcome back!");
        return true;
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data.user) {
          await loadProviders();
          setUserId(data.user.id);
          return true;
        }
        if (error) {
          console.error("Login error:", error);
          toast.error(error.message);
        }
      } catch (e) {
        console.warn("Supabase sign-in failed, checking offline status:", e);
      }
      return false;
    },
    [loadProviders]
  );

  const logout = useCallback(() => {
    setSession(null);
    setLastSummary(null);
    void supabase.auth.signOut();
    setCurrentUser(null);
    setUserId(null);
  }, []);

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

      void (async () => {
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
      setCurrentUser({ ...currentUser, balance: currentUser.balance + amount });
      void (async () => {
        await supabase.rpc("top_up_wallet", { p_amount: amount });
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
      if (currentUser.balance < rate) return;

      setLastSummary(null);
      setSession({
        sessionId: null,
        providerId,
        mode,
        rate,
        startBalance: currentUser.balance,
        elapsed: 0,
        accumulatedCharges: 0,
      });

      void (async () => {
        const { data, error } = await supabase.rpc("start_session", {
          p_provider_id: providerId,
          p_mode: mode,
        });
        if (error || !data) {
          setSession(null);
          return;
        }
        const row: any = Array.isArray(data) ? data[0] : data;
        setSession((curr) => (curr ? { ...curr, sessionId: row.id } : curr));
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
      if (current.sessionId) {
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
      }
      await refresh();
      endingRef.current = false;
    })();
  }, [refresh]);

  // Real-time session clock + automatic minute billing guard
  useEffect(() => {
    if (!session) return;
    const intervalId = window.setInterval(() => {
      setSession((curr) => {
        if (!curr) return null;
        const nextElapsed = curr.elapsed + 1;
        const currentMinutes = Math.ceil(curr.elapsed / 60);
        const nextMinutes = Math.ceil(nextElapsed / 60);

        if (nextMinutes > currentMinutes) {
          const billingCost = nextMinutes * curr.rate;
          if (billingCost > curr.startBalance) {
            window.clearInterval(intervalId);
            setTimeout(() => endSession(), 10);
            return curr;
          }
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
