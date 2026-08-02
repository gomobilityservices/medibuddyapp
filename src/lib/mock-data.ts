import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";

export type Gender = "female" | "male" | "non-binary";

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Provider {
  id: string;
  name: string;
  username: string;
  photo: string;
  gender: Gender;
  rate: number; // fallback/default per minute
  rateCall: number; // voice call price/min
  rateChat: number; // chat price/min
  rating: number;
  reviews: number; // total count
  languages: string[];
  description: string;
  area: string;
  distanceKm: number;
  available: boolean;
  connectsWith: string; // compatibility with old code
  preferredCustomerGender: "male" | "female" | "everyone";
  categories?: string[];
  experience: string;
  sessions: number;
  responseSec: number;
  reviewsList: Review[];
}

export const providers: Provider[] = [
  {
    id: "ava",
    name: "Ava R.",
    username: "ava_r",
    photo: p1,
    gender: "female",
    rate: 1.2,
    rateCall: 1.5,
    rateChat: 1.2,
    rating: 4.9,
    reviews: 3,
    languages: ["English", "Hindi", "Marathi"],
    description:
      "Career coach turned late-night listener. I am good at untangling messy thoughts and helping you decide the next small step.",
    area: "Bandra West",
    distanceKm: 2.4,
    available: true,
    connectsWith: "Anyone",
    preferredCustomerGender: "everyone",
    categories: ["Career Advice", "Life Coaching", "General Chat"],
    experience: "3 years of coaching",
    sessions: 1240,
    responseSec: 12,
    reviewsList: [
      { id: "r_1", customerName: "Riya S.", rating: 5, comment: "Incredibly calm and structured. Helped me make a career move.", date: "Today" },
      { id: "r_2", customerName: "Rahul K.", rating: 5, comment: "She asks very sharp questions. Highly recommended!", date: "Yesterday" },
      { id: "r_3", customerName: "Priya M.", rating: 4, comment: "Very good listener. Felt much lighter after the call.", date: "3 days ago" },
    ],
  },
  {
    id: "malik",
    name: "Malik T.",
    username: "malik_t",
    photo: p2,
    gender: "male",
    rate: 0.8,
    rateCall: 1.2,
    rateChat: 0.8,
    rating: 4.7,
    reviews: 2,
    languages: ["English", "French"],
    description:
      "Calm, direct and allergic to small talk. Come with a problem, leave with a plan. Fluent in football metaphors.",
    area: "Andheri East",
    distanceKm: 5.1,
    available: true,
    connectsWith: "Men, Non-binary",
    preferredCustomerGender: "everyone",
    categories: ["Decision Making", "Motivation", "Sports"],
    experience: "5 years mentoring",
    sessions: 780,
    responseSec: 25,
    reviewsList: [
      { id: "r_4", customerName: "Arjun P.", rating: 5, comment: "Straight to the point. No fluff. Loved it.", date: "2 days ago" },
      { id: "r_5", customerName: "Dev N.", rating: 4, comment: "Very logical advice. Helped resolve some blockages.", date: "Last week" },
    ],
  },
  {
    id: "mei",
    name: "Mei L.",
    username: "mei_l",
    photo: p3,
    gender: "female",
    rate: 2.0,
    rateCall: 2.5,
    rateChat: 2.0,
    rating: 5.0,
    reviews: 1,
    languages: ["English", "Mandarin", "Cantonese"],
    description:
      "Fifteen years in negotiation and family mediation. I speak slowly, ask sharp questions and never rush you.",
    area: "Lower Parel",
    distanceKm: 7.8,
    available: true,
    connectsWith: "Women",
    preferredCustomerGender: "female",
    categories: ["Relationships", "Conflict Resolution", "Workplace Dynamics"],
    experience: "15 years in mediation",
    sessions: 420,
    responseSec: 40,
    reviewsList: [
      { id: "r_6", customerName: "Sarah J.", rating: 5, comment: "Absolute master of patience. Her insights are profound.", date: "Yesterday" },
    ],
  },
  {
    id: "diego",
    name: "Diego M.",
    username: "diego_m",
    photo: p4,
    gender: "male",
    rate: 0.6,
    rateCall: 0.9,
    rateChat: 0.6,
    rating: 4.5,
    reviews: 2,
    languages: ["English", "Spanish", "Portuguese"],
    description:
      "Language practice, gaming chat or just company on a long commute. Low rate, high energy, zero judgement.",
    area: "Powai",
    distanceKm: 9.2,
    available: true,
    connectsWith: "Anyone",
    preferredCustomerGender: "everyone",
    categories: ["Language Practice", "Gaming", "Casual Chat"],
    experience: "2 years traveler talk",
    sessions: 1610,
    responseSec: 8,
    reviewsList: [
      { id: "r_7", customerName: "Carlos R.", rating: 4, comment: "Super friendly. Fun to talk to and practice Portuguese.", date: "Today" },
      { id: "r_8", customerName: "Amit S.", rating: 5, comment: "High energy guy! Discussed games and had a blast.", date: "4 days ago" },
    ],
  },
  {
    id: "nour",
    name: "Nour A.",
    username: "nour_a",
    photo: p5,
    gender: "female",
    rate: 1.5,
    rateCall: 1.8,
    rateChat: 1.5,
    rating: 4.8,
    reviews: 2,
    languages: ["English", "Arabic", "Turkish"],
    description:
      "Gentle sounding board for anxiety, grief and the in-between days. Chat only, because typing lets you breathe.",
    area: "Khar",
    distanceKm: 3.6,
    available: true,
    connectsWith: "Women, Non-binary",
    preferredCustomerGender: "female",
    categories: ["Mental Wellness", "Grief Support", "Anxiety Soundboard"],
    experience: "4 years community support",
    sessions: 640,
    responseSec: 30,
    reviewsList: [
      { id: "r_9", customerName: "Fatima Z.", rating: 5, comment: "So gentle and empathetic. She helped me breathe through anxiety.", date: "Yesterday" },
      { id: "r_10", customerName: "Layla M.", rating: 4, comment: "Beautiful session. Highly recommend speaking with her.", date: "3 days ago" },
    ],
  },
  {
    id: "jonas",
    name: "Jonas W.",
    username: "jonas_w",
    photo: p6,
    gender: "male",
    rate: 2.4,
    rateCall: 3.0,
    rateChat: 2.4,
    rating: 4.9,
    reviews: 1,
    languages: ["English", "German"],
    description:
      "Twenty years of product and hiring. Bring your pitch, your resume or your resignation letter and we will stress-test it.",
    area: "Worli",
    distanceKm: 8.4,
    available: false,
    connectsWith: "Anyone",
    preferredCustomerGender: "everyone",
    categories: ["Mock Interviews", "Resume Review", "Startups"],
    experience: "20 years tech product & hiring",
    sessions: 300,
    responseSec: 55,
    reviewsList: [
      { id: "r_11", customerName: "Vikram A.", rating: 5, comment: "Exceptional career feedback. Brutally honest but exactly what I needed.", date: "2 weeks ago" },
    ],
  },
];

export const allLanguages = [
  "English",
  "Hindi",
  "Bengali",
  "Telugu",
  "Marathi",
  "Tamil",
  "Gujarati",
  "Urdu",
  "Kannada",
  "Odia",
  "Malayalam",
  "Punjabi",
  "Spanish",
  "Mandarin",
  "Arabic",
  "French",
  "German",
  "Portuguese",
  "Turkish",
];


export const allCategories = [
  "Career Advice",
  "Life Coaching",
  "General Chat",
  "Decision Making",
  "Motivation",
  "Relationships",
  "Conflict Resolution",
  "Language Practice",
  "Gaming",
  "Mental Wellness",
  "Grief Support",
  "Mock Interviews",
  "Resume Review",
  "Startups",
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
  return `Rs ${n.toFixed(2)}`;
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
