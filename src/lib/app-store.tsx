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

  // ---------------------------------------------------------------- loaders
  const loadProviders = useCallback(async () => {
    const [{ data: rows }, { data: reviewRows }] = await Promise.all([
      supabase.from("providers").select("*").order("created_at", { ascending: true }),
      supabase.from("reviews").select("*").order("created_at", { ascending: false }),
    ]);
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
        recentChats: history.filter((h) => h.mode === "chat").map(({ mode, ...rest }) => rest),
        recentCalls: history.filter((h) => h.mode === "call").map(({ mode, ...rest }) => rest),
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
    const { data } = await supabase.auth.getUser();
    if (data.user) await loadUser(data.user.id, data.user.email ?? "");
  }, [loadProviders, loadUser]);

  // ---------------------------------------------------------------- boot
  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
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

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      await loadProviders();
      if (data.user) {
        setUserId(data.user.id);
        await loadUser(data.user.id, data.user.email ?? "");
      }
      if (active) setLoading(false);
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reload the profile whenever the signed-in user changes
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) await loadUser(data.user.id, data.user.email ?? "");
      setLoading(false);
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

      const { data, error } = await supabase.auth.signUp({ email, password, options });
      if (error) return false;
      if (data.session?.user) {
        setUserId(data.session.user.id);
        await loadProviders();
      }
      return true;
    },
    [loadProviders]
  );

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) return false;
      await loadProviders();
      setUserId(data.user.id);
      return true;
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

      const profilePatch: Record<string, unknown> = {};
      if (data.name !== undefined) profilePatch.name = data.name;
      if (data.gender !== undefined && currentUser.role === "customer") profilePatch.gender = data.gender;
      if (data.photo !== undefined && currentUser.role === "customer") profilePatch.photo = data.photo;

      void (async () => {
        if (Object.keys(profilePatch).length > 0) {
          await supabase.from("profiles").update(profilePatch).eq("id", currentUser.id);
        }

        if (currentUser.role === "provider") {
          const listingPatch: Record<string, unknown> = {};
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
    if (endingRef.current) return;
    endingRef.current = true;

    setSession((current) => {
      if (!current) {
        endingRef.current = false;
        return null;
      }

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

      const sessionId = current.sessionId;
      const seconds = current.elapsed;

      void (async () => {
        if (sessionId) {
          const { data } = await supabase.rpc("end_session", {
            p_session_id: sessionId,
            p_seconds: seconds,
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

      return null;
    });
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
