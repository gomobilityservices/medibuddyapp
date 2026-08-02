import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { providers as mockProviders, type Provider, type Review, type Gender } from "./mock-data";

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
}

export type CurrentUser = CustomerProfile | ProviderProfile;

export interface ActiveSession {
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
  currentUser: CurrentUser | null;
  providers: Provider[];
  signUp: (email: string, passwordHash: string, role: Role, profileData: any) => boolean;
  login: (email: string, passwordHash: string) => boolean;
  logout: () => void;
  updateProfile: (data: any) => void;
  toggleSavedProvider: (providerId: string) => void;
  toggleAvailability: (available: boolean) => void;
  submitReview: (providerId: string, rating: number, comment: string) => void;
  withdrawEarnings: (amount: number) => boolean;
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

const LOCAL_USERS_KEY = "medibuddy_users_db";
const LOCAL_PROVIDERS_KEY = "medibuddy_providers_db";
const LOCAL_CURRENT_USER_KEY = "medibuddy_current_user";

export function AppStoreProvider({ children }: { children: ReactNode }) {
  // Load users db
  const [usersDb, setUsersDb] = useState<Record<string, { passwordHash: string; profile: CurrentUser }>>(() => {
    if (typeof window === "undefined") return {};
    const local = localStorage.getItem(LOCAL_USERS_KEY);
    return local ? JSON.parse(local) : {};
  });

  // Load providers db
  const [providers, setProviders] = useState<Provider[]>(() => {
    if (typeof window === "undefined") return mockProviders;
    const local = localStorage.getItem(LOCAL_PROVIDERS_KEY);
    if (local) {
      return JSON.parse(local);
    } else {
      localStorage.setItem(LOCAL_PROVIDERS_KEY, JSON.stringify(mockProviders));
      return mockProviders;
    }
  });

  // Load current user
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    if (typeof window === "undefined") return null;
    const local = localStorage.getItem(LOCAL_CURRENT_USER_KEY);
    return local ? JSON.parse(local) : null;
  });

  const [session, setSession] = useState<ActiveSession | null>(null);
  const [lastSummary, setLastSummary] = useState<SessionSummary | null>(null);

  // Sync users database helper
  const syncUsersDb = useCallback((newDb: Record<string, { passwordHash: string; profile: CurrentUser }>) => {
    setUsersDb(newDb);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(newDb));
  }, []);

  // Sync providers helper
  const syncProviders = useCallback((newProviders: Provider[]) => {
    setProviders(newProviders);
    localStorage.setItem(LOCAL_PROVIDERS_KEY, JSON.stringify(newProviders));
  }, []);

  // Sync current user helper
  const syncCurrentUser = useCallback((user: CurrentUser | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(user));
      // Also update in users database
      setUsersDb((prev) => {
        const next = { ...prev };
        if (next[user.email]) {
          next[user.email] = { ...next[user.email], profile: user };
          localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(next));
        }
        return next;
      });

      // If user is a provider, update details in providers search list as well
      if (user.role === "provider") {
        setProviders((prev) => {
          const next = prev.map((p) => (p.id === user.id ? { ...p, ...user } : p));
          localStorage.setItem(LOCAL_PROVIDERS_KEY, JSON.stringify(next));
          return next;
        });
      }
    } else {
      localStorage.removeItem(LOCAL_CURRENT_USER_KEY);
    }
  }, []);

  // Auth functions
  const signUp = useCallback(
    (email: string, passwordHash: string, role: Role, profileData: any): boolean => {
      if (usersDb[email]) return false; // email already exists

      const id = `${role}_${Date.now()}`;
      let profile: CurrentUser;

      if (role === "customer") {
        profile = {
          id,
          role: "customer",
          email,
          name: profileData.name || "Customer",
          gender: profileData.gender || "Everyone",
          photo: profileData.photo || `https://api.dicebear.com/7.x/adventurer/svg?seed=${id}`,
          balance: 0.0,
          transactions: [],
          savedProviders: [],
          recentChats: [],
          recentCalls: [],
        };
      } else {
        profile = {
          id,
          role: "provider",
          email,
          name: profileData.name || "Provider",
          username: profileData.username || `user_${id}`,
          photo: profileData.photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`,
          gender: profileData.gender || "female",
          languages: profileData.languages || ["English"],
          area: profileData.area || "Mumbai",
          description: profileData.description || "I'm a listener here to talk with you.",
          categories: profileData.categories || ["General Chat"],
          experience: profileData.experience || "1 year",
          rating: 5.0,
          reviews: 0,
          rateCall: profileData.rateCall || 1.5,
          rateChat: profileData.rateChat || 1.0,
          rate: profileData.rateChat || 1.0,
          available: true,
          preferredCustomerGender: profileData.preferredCustomerGender || "everyone",
          walletBalance: 0,
          totalEarnings: 0,
          pendingEarnings: 0,
          transactions: [],
          withdrawals: [],
          sessions: 0,
          responseSec: 15,
          reviewsList: [],
        };

        // Add to providers search database
        const newProvider: Provider = {
          id: profile.id,
          name: profile.name,
          username: profile.username,
          photo: profile.photo,
          gender: profile.gender,
          rate: profile.rate,
          rateCall: profile.rateCall,
          rateChat: profile.rateChat,
          rating: profile.rating,
          reviews: profile.reviews,
          languages: profile.languages,
          description: profile.description,
          area: profile.area,
          distanceKm: 1.0 + Math.random() * 8.0,
          available: profile.available,
          connectsWith: "Anyone",
          preferredCustomerGender: profile.preferredCustomerGender,
          categories: profile.categories,
          experience: profile.experience,
          sessions: profile.sessions,
          responseSec: profile.responseSec,
          reviewsList: profile.reviewsList,
        };
        syncProviders([...providers, newProvider]);
      }

      const newDb = { ...usersDb, [email]: { passwordHash, profile } };
      syncUsersDb(newDb);
      syncCurrentUser(profile);
      return true;
    },
    [usersDb, providers, syncCurrentUser, syncProviders, syncUsersDb]
  );

  const login = useCallback(
    (email: string, passwordHash: string): boolean => {
      const match = usersDb[email];
      if (match && match.passwordHash === passwordHash) {
        syncCurrentUser(match.profile);
        return true;
      }
      return false;
    },
    [usersDb, syncCurrentUser]
  );

  const logout = useCallback(() => {
    syncCurrentUser(null);
    setSession(null);
    setLastSummary(null);
  }, [syncCurrentUser]);

  // Profile update
  const updateProfile = useCallback(
    (data: any) => {
      if (!currentUser) return;
      const updated = { ...currentUser, ...data };
      if (currentUser.role === "provider") {
        updated.rate = updated.rateChat;
      }
      syncCurrentUser(updated);
    },
    [currentUser, syncCurrentUser]
  );

  const toggleSavedProvider = useCallback(
    (providerId: string) => {
      if (!currentUser || currentUser.role !== "customer") return;
      const saved = currentUser.savedProviders.includes(providerId)
        ? currentUser.savedProviders.filter((id) => id !== providerId)
        : [...currentUser.savedProviders, providerId];
      updateProfile({ savedProviders: saved });
    },
    [currentUser, updateProfile]
  );

  const toggleAvailability = useCallback(
    (available: boolean) => {
      if (!currentUser || currentUser.role !== "provider") return;
      updateProfile({ available });
    },
    [currentUser, updateProfile]
  );

  // Submit review
  const submitReview = useCallback(
    (providerId: string, rating: number, comment: string) => {
      if (!currentUser) return;
      setProviders((prevProviders) => {
        const next = prevProviders.map((p) => {
          if (p.id === providerId) {
            const newReview: Review = {
              id: `rev_${Date.now()}`,
              customerName: currentUser.name,
              rating,
              comment,
              date: "Just now",
            };
            const list = [newReview, ...p.reviewsList];
            const sum = list.reduce((a, b) => a + b.rating, 0);
            const avgRating = sum / list.length;
            const updated = {
              ...p,
              reviewsList: list,
              reviews: list.length,
              rating: Number(avgRating.toFixed(1)),
            };

            // If current user is this provider, update their profile too
            if (currentUser.id === providerId) {
              setTimeout(() => {
                syncCurrentUser({
                  ...currentUser,
                  reviewsList: list,
                  reviews: list.length,
                  rating: Number(avgRating.toFixed(1)),
                } as CurrentUser);
              }, 50);
            }

            // Sync user database for the provider profile if registered
            Object.values(usersDb).forEach((u) => {
              if (u.profile.id === providerId) {
                u.profile.rating = Number(avgRating.toFixed(1));
                u.profile.reviews = list.length;
                (u.profile as ProviderProfile).reviewsList = list;
              }
            });
            localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(usersDb));

            return updated;
          }
          return p;
        });
        localStorage.setItem(LOCAL_PROVIDERS_KEY, JSON.stringify(next));
        return next;
      });
    },
    [currentUser, usersDb, syncCurrentUser]
  );

  // Withdraw earnings
  const withdrawEarnings = useCallback(
    (amount: number): boolean => {
      if (!currentUser || currentUser.role !== "provider") return false;
      const profile = currentUser as ProviderProfile;
      if (profile.walletBalance < amount) return false;

      const newTxn: Txn = {
        id: `w_${Date.now()}`,
        kind: "debit",
        type: "withdrawal",
        label: "Earnings Payout Request",
        sub: `Payout to bank account`,
        amount,
        timestamp: new Date().toLocaleString(),
      };

      const newWithdrawal = {
        id: `withdraw_${Date.now()}`,
        amount,
        status: "pending" as const,
        date: new Date().toLocaleDateString(),
      };

      updateProfile({
        walletBalance: profile.walletBalance - amount,
        pendingEarnings: profile.pendingEarnings + amount,
        transactions: [newTxn, ...profile.transactions],
        withdrawals: [newWithdrawal, ...profile.withdrawals],
      });
      return true;
    },
    [currentUser, updateProfile]
  );

  // Start Session
  // Start Session
  const startSession = useCallback(
    (providerId: string, mode: Mode) => {
      const p = providers.find((pv) => pv.id === providerId);
      if (!p || !currentUser || currentUser.role !== "customer") return;

      const rate = mode === "call" ? p.rateCall : p.rateChat;
      if (currentUser.balance < rate) return;

      // 1. Make provider unavailable in search & database
      setProviders((prevProviders) => {
        const next = prevProviders.map((pv) => {
          if (pv.id === providerId) {
            return { ...pv, available: false };
          }
          return pv;
        });
        localStorage.setItem(LOCAL_PROVIDERS_KEY, JSON.stringify(next));
        return next;
      });

      Object.entries(usersDb).forEach(([email, data]) => {
        if (data.profile.id === providerId && data.profile.role === "provider") {
          const profile = data.profile as ProviderProfile;
          const updatedProfile = { ...profile, available: false };
          usersDb[email] = { ...data, profile: updatedProfile };
        }
      });
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(usersDb));

      setLastSummary(null);
      setSession({
        providerId,
        mode,
        rate,
        startBalance: currentUser.balance,
        elapsed: 0,
        accumulatedCharges: 0,
      });
    },
    [providers, currentUser, usersDb]
  );

  // End Session
  const endSession = useCallback(() => {
    setSession((current) => {
      if (!current) return null;
      const minutes = Math.max(1, Math.ceil(current.elapsed / 60));
      const amount = Math.min(minutes * current.rate, current.startBalance);
      const balanceAfter = Math.max(0, current.startBalance - amount);

      const p = providers.find((pv) => pv.id === current.providerId);
      const providerName = p?.name ?? "Provider";

      // 1. Deduct customer balance and record txn
      if (currentUser && currentUser.role === "customer") {
        const txnId = `s_${Date.now()}`;
        const newTxn: Txn = {
          id: txnId,
          kind: "debit",
          type: current.mode === "call" ? "session_call" : "session_chat",
          label: `${current.mode === "call" ? "Call" : "Chat"} with ${providerName}`,
          sub: `${minutes} min at Rs ${current.rate.toFixed(2)}/min`,
          amount,
          timestamp: new Date().toLocaleString(),
        };

        const sessionHistoryRow = {
          providerId: current.providerId,
          providerName,
          duration: current.elapsed,
          date: new Date().toLocaleString(),
        };

        const recentChats =
          current.mode === "chat"
            ? [sessionHistoryRow, ...currentUser.recentChats]
            : currentUser.recentChats;
        const recentCalls =
          current.mode === "call"
            ? [sessionHistoryRow, ...currentUser.recentCalls]
            : currentUser.recentCalls;

        syncCurrentUser({
          ...currentUser,
          balance: balanceAfter,
          transactions: [newTxn, ...currentUser.transactions],
          recentChats,
          recentCalls,
        });
      }

      // 2. Credit provider earnings (with 10% commission deduction)
      const commission = amount * 0.1;
      const earnings = amount - commission;

      // Update provider in databases and restore availability to true
      setProviders((prevProviders) => {
        const next = prevProviders.map((pv) => {
          if (pv.id === current.providerId) {
            return {
              ...pv,
              sessions: pv.sessions + 1,
              available: true,
            };
          }
          return pv;
        });
        localStorage.setItem(LOCAL_PROVIDERS_KEY, JSON.stringify(next));
        return next;
      });

      // Update specific provider profile record and restore available state to true
      Object.entries(usersDb).forEach(([email, data]) => {
        if (data.profile.id === current.providerId && data.profile.role === "provider") {
          const profile = data.profile as ProviderProfile;
          const pTxn: Txn = {
            id: `e_${Date.now()}`,
            kind: "credit",
            type: current.mode === "call" ? "session_call" : "session_chat",
            label: `Earning from ${current.mode === "call" ? "Call" : "Chat"}`,
            sub: `${minutes} min session (10% comm deducted)`,
            amount: earnings,
            timestamp: new Date().toLocaleString(),
          };

          const updatedProfile: ProviderProfile = {
            ...profile,
            walletBalance: profile.walletBalance + earnings,
            totalEarnings: profile.totalEarnings + earnings,
            sessions: profile.sessions + 1,
            transactions: [pTxn, ...profile.transactions],
            available: true,
          };

          usersDb[email] = { ...data, profile: updatedProfile };
        }
      });
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(usersDb));

      setLastSummary({
        providerId: current.providerId,
        mode: current.mode,
        seconds: current.elapsed,
        minutes,
        amount,
        balanceAfter,
      });

      return null;
    });
  }, [currentUser, providers, syncCurrentUser, usersDb]);

  // Real-time Session Clock & Automatic Minute Billing
  useEffect(() => {
    if (!session) return;
    const intervalId = window.setInterval(() => {
      setSession((curr) => {
        if (!curr) return null;
        const nextElapsed = curr.elapsed + 1;
        const currentMinutes = Math.ceil(curr.elapsed / 60);
        const nextMinutes = Math.ceil(nextElapsed / 60);

        // If a new minute starts, we perform billing checks
        if (nextMinutes > currentMinutes) {
          const billingCost = nextMinutes * curr.rate;
          if (billingCost > curr.startBalance) {
            // Customer ran out of balance! Auto end call
            window.clearInterval(intervalId);
            setTimeout(() => {
              endSession();
            }, 10);
            return curr;
          }
        }

        return { ...curr, elapsed: nextElapsed };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [session !== null, endSession]);

  // Customer topUp
  const topUp = useCallback(
    (amount: number) => {
      if (!currentUser || currentUser.role !== "customer") return;
      const newTxn: Txn = {
        id: `topup_${Date.now()}`,
        kind: "credit",
        type: "topup",
        label: "Wallet Top-up",
        sub: "Card ending 4242",
        amount,
        timestamp: new Date().toLocaleString(),
      };
      updateProfile({
        balance: currentUser.balance + amount,
        transactions: [newTxn, ...currentUser.transactions],
      });
    },
    [currentUser, updateProfile]
  );

  // Fallbacks for backwards compatibility
  const balance = useMemo(() => {
    if (!currentUser) return 0;
    return currentUser.role === "customer"
      ? currentUser.balance
      : (currentUser as ProviderProfile).walletBalance;
  }, [currentUser]);

  const transactions = useMemo(() => {
    return currentUser ? currentUser.transactions : [];
  }, [currentUser]);

  const providerOnline = useMemo(() => {
    if (currentUser && currentUser.role === "provider") {
      return (currentUser as ProviderProfile).available;
    }
    return true;
  }, [currentUser]);

  const setProviderOnline = useCallback(
    (v: boolean) => {
      if (currentUser && currentUser.role === "provider") {
        updateProfile({ available: v });
      }
    },
    [currentUser, updateProfile]
  );

  const liveEarnings = useMemo(() => {
    if (currentUser && currentUser.role === "provider") {
      return (currentUser as ProviderProfile).totalEarnings;
    }
    return 0;
  }, [currentUser]);

  // Compat for code setting role directly
  const role = currentUser ? currentUser.role : "customer";
  const setRole = useCallback(() => {}, []);

  const value = useMemo<Store>(
    () => ({
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
