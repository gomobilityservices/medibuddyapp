import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";

export type Gender = "female" | "male" | "non-binary";

export interface Provider {
  id: string;
  name: string;
  photo: string;
  gender: Gender;
  rate: number; // per minute
  rating: number;
  reviews: number;
  languages: string[];
  description: string;
  area: string;
  distanceKm: number;
  available: boolean;
  connectsWith: string;
  sessions: number;
  responseSec: number;
}

export const providers: Provider[] = [
  {
    id: "ava",
    name: "Ava R.",
    photo: p1,
    gender: "female",
    rate: 1.2,
    rating: 4.9,
    reviews: 312,
    languages: ["English", "Hindi", "Marathi"],
    description:
      "Career coach turned late-night listener. I am good at untangling messy thoughts and helping you decide the next small step.",
    area: "Bandra West",
    distanceKm: 2.4,
    available: true,
    connectsWith: "Anyone",
    sessions: 1240,
    responseSec: 12,
  },
  {
    id: "malik",
    name: "Malik T.",
    photo: p2,
    gender: "male",
    rate: 0.8,
    rating: 4.7,
    reviews: 189,
    languages: ["English", "French"],
    description:
      "Calm, direct and allergic to small talk. Come with a problem, leave with a plan. Fluent in football metaphors.",
    area: "Andheri East",
    distanceKm: 5.1,
    available: true,
    connectsWith: "Men, Non-binary",
    sessions: 780,
    responseSec: 25,
  },
  {
    id: "mei",
    name: "Mei L.",
    photo: p3,
    gender: "female",
    rate: 2.0,
    rating: 5.0,
    reviews: 96,
    languages: ["English", "Mandarin", "Cantonese"],
    description:
      "Fifteen years in negotiation and family mediation. I speak slowly, ask sharp questions and never rush you.",
    area: "Lower Parel",
    distanceKm: 7.8,
    available: true,
    connectsWith: "Women",
    sessions: 420,
    responseSec: 40,
  },
  {
    id: "diego",
    name: "Diego M.",
    photo: p4,
    gender: "male",
    rate: 0.6,
    rating: 4.5,
    reviews: 254,
    languages: ["English", "Spanish", "Portuguese"],
    description:
      "Language practice, gaming chat or just company on a long commute. Low rate, high energy, zero judgement.",
    area: "Powai",
    distanceKm: 9.2,
    available: true,
    connectsWith: "Anyone",
    sessions: 1610,
    responseSec: 8,
  },
  {
    id: "nour",
    name: "Nour A.",
    photo: p5,
    gender: "female",
    rate: 1.5,
    rating: 4.8,
    reviews: 143,
    languages: ["English", "Arabic", "Turkish"],
    description:
      "Gentle sounding board for anxiety, grief and the in-between days. Chat only, because typing lets you breathe.",
    area: "Khar",
    distanceKm: 3.6,
    available: true,
    connectsWith: "Women, Non-binary",
    sessions: 640,
    responseSec: 30,
  },
  {
    id: "jonas",
    name: "Jonas W.",
    photo: p6,
    gender: "male",
    rate: 2.4,
    rating: 4.9,
    reviews: 77,
    languages: ["English", "German"],
    description:
      "Twenty years of product and hiring. Bring your pitch, your resume or your resignation letter and we will stress-test it.",
    area: "Worli",
    distanceKm: 8.4,
    available: false,
    connectsWith: "Anyone",
    sessions: 300,
    responseSec: 55,
  },
];

export const allLanguages = [
  "English",
  "Hindi",
  "Spanish",
  "Mandarin",
  "Arabic",
  "French",
  "German",
];

export interface ChatSeed {
  from: "them" | "me";
  text: string;
}

export const chatSeed: ChatSeed[] = [
  { from: "them", text: "Hey, I'm here. What's on your mind today?" },
];

export interface EarningRow {
  id: string;
  masked: string;
  mode: "chat" | "call";
  minutes: number;
  amount: number;
  when: string;
}

export const providerEarnings: EarningRow[] = [
  { id: "e1", masked: "Guest #8241", mode: "call", minutes: 18, amount: 21.6, when: "Today, 14:20" },
  { id: "e2", masked: "Guest #1907", mode: "chat", minutes: 32, amount: 38.4, when: "Today, 11:05" },
  { id: "e3", masked: "Guest #4460", mode: "call", minutes: 7, amount: 8.4, when: "Today, 09:41" },
  { id: "e4", masked: "Guest #3312", mode: "chat", minutes: 44, amount: 52.8, when: "Yesterday" },
  { id: "e5", masked: "Guest #7788", mode: "call", minutes: 12, amount: 14.4, when: "Yesterday" },
  { id: "e6", masked: "Guest #2201", mode: "chat", minutes: 25, amount: 30, when: "2 days ago" },
];

export const dailyEarnings = [
  { day: "Mon", amount: 62 },
  { day: "Tue", amount: 88 },
  { day: "Wed", amount: 41 },
  { day: "Thu", amount: 105 },
  { day: "Fri", amount: 74 },
  { day: "Sat", amount: 132 },
  { day: "Sun", amount: 68.4 },
];

export const incomingRequests = [
  { id: "r1", masked: "Guest #5512", mode: "call" as const, note: "Wants 10 min about a job offer" },
  { id: "r2", masked: "Guest #9034", mode: "chat" as const, note: "Language practice, Spanish" },
];

export function money(n: number) {
  return `$${n.toFixed(2)}`;
}

export function clock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function getProvider(id: string) {
  return providers.find((p) => p.id === id);
}
