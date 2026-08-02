import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getProvider } from "./mock-data";

export type Role = "customer" | "provider";
export type Mode = "chat" | "call";

export interface Txn {
  id: string;
  kind: "debit" | "credit";
  label: string;
  sub: string;
  amount: number;
}

export interface ActiveSession {
  providerId: string;
  mode: Mode;
  rate: number;
  startBalance: number;
  elapsed: number;
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
  role: Role;
  setRole: (r: Role) => void;
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
}

const StoreContext = createContext<Store | null>(null);

const initialTxns: Txn[] = [
  { id: "t1", kind: "credit", label: "Wallet top-up", sub: "Today, 10:02", amount: 25 },
  { id: "t2", kind: "debit", label: "Call with Diego M.", sub: "Yesterday, 21:14", amount: 4.8 },
  { id: "t3", kind: "debit", label: "Chat with Nour A.", sub: "Yesterday, 18:30", amount: 12 },
  { id: "t4", kind: "credit", label: "Wallet top-up", sub: "2 days ago", amount: 20 },
];

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("customer");
  const [balance, setBalance] = useState(24.5);
  const [transactions, setTransactions] = useState<Txn[]>(initialTxns);
  const [providerOnline, setProviderOnline] = useState(true);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [lastSummary, setLastSummary] = useState<SessionSummary | null>(null);
  const [liveEarnings, setLiveEarnings] = useState(165.6);

  const startSession = useCallback(
    (providerId: string, mode: Mode) => {
      const p = getProvider(providerId);
      if (!p) return;
      setLastSummary(null);
      setSession({ providerId, mode, rate: p.rate, startBalance: balance, elapsed: 0 });
    },
    [balance],
  );

  const endSession = useCallback(() => {
    setSession((current) => {
      if (!current) return null;
      const minutes = Math.max(1, Math.ceil(current.elapsed / 60));
      const amount = Math.min(minutes * current.rate, current.startBalance);
      const balanceAfter = Math.max(0, current.startBalance - amount);
      const p = getProvider(current.providerId);
      setBalance(balanceAfter);
      setLiveEarnings((e) => e + amount);
      setTransactions((prev) => [
        {
          id: `s${Date.now()}`,
          kind: "debit",
          label: `${current.mode === "call" ? "Call" : "Chat"} with ${p?.name ?? "provider"}`,
          sub: `${minutes} min at Rs ${current.rate.toFixed(2)}/min`,
          amount,
        },
        ...prev,
      ]);
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
  }, []);

  // Session clock
  useEffect(() => {
    if (!session) return;
    const id = window.setInterval(() => {
      setSession((c) => (c ? { ...c, elapsed: c.elapsed + 1 } : c));
    }, 1000);
    return () => window.clearInterval(id);
  }, [session !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto end when the wallet runs out
  useEffect(() => {
    if (!session) return;
    const maxSeconds = Math.floor((session.startBalance / session.rate) * 60);
    if (session.elapsed >= maxSeconds) endSession();
  }, [session, endSession]);

  const topUp = useCallback((amount: number) => {
    setBalance((b) => b + amount);
    setTransactions((prev) => [
      { id: `c${Date.now()}`, kind: "credit", label: "Wallet top-up", sub: "Just now", amount },
      ...prev,
    ]);
  }, []);

  const value = useMemo<Store>(
    () => ({
      role,
      setRole,
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
    }),
    [
      role,
      balance,
      transactions,
      topUp,
      providerOnline,
      session,
      startSession,
      endSession,
      lastSummary,
      liveEarnings,
    ],
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
