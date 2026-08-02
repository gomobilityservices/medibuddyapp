import { useState } from "react";
import { useStore, type Role } from "@/lib/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Compass, ShieldCheck, Mail, Lock, User, MapPin, DollarSign, Upload } from "lucide-react";
import { allLanguages, allCategories, money } from "@/lib/mock-data";

export function AuthPage() {
  const { signUp, login } = useStore();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<Role>("customer");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Customer specific states
  const [customerName, setCustomerName] = useState("");
  const [customerGender, setCustomerGender] = useState("Woman");

  // Provider specific states
  const [providerName, setProviderName] = useState("");
  const [providerUsername, setProviderUsername] = useState("");
  const [providerGender, setProviderGender] = useState("female");
  const [providerLanguages, setProviderLanguages] = useState<string[]>(["English", "Hindi"]);
  const [providerArea, setProviderArea] = useState("");
  const [providerDescription, setProviderDescription] = useState("");
  const [providerCategories, setProviderCategories] = useState<string[]>(["General Chat"]);
  const [providerExperience, setProviderExperience] = useState("");
  const [providerRateCall, setProviderRateCall] = useState("1.5");
  const [providerRateChat, setProviderRateChat] = useState("1.0");
  const [providerPreferredGender, setProviderPreferredGender] = useState<"male" | "female" | "everyone">("everyone");
  const [providerPhoto, setProviderPhoto] = useState("https://api.dicebear.com/7.x/bottts/svg?seed=ava");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in email and password");
      return;
    }

    if (mode === "login") {
      const success = await login(email, password);
      if (success) {
        toast.success("Welcome back!");
      } else {
        toast.error("Invalid email or password");
      }
    } else {
      // Sign up
      let profileData = {};
      if (role === "customer") {
        if (!customerName) {
          toast.error("Name is required");
          return;
        }
        profileData = {
          name: customerName,
          gender: customerGender,
          // Generate a premium default avatar without needing customer inputs
          photo: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(customerName)}`,
        };
      } else {
        if (!providerName || !providerUsername || !providerArea || !providerExperience) {
          toast.error("Please fill in all required provider fields");
          return;
        }
        profileData = {
          name: providerName,
          username: providerUsername,
          gender: providerGender,
          languages: providerLanguages,
          area: providerArea,
          description: providerDescription,
          categories: providerCategories,
          experience: providerExperience,
          rateCall: parseFloat(providerRateCall) || 1.5,
          rateChat: parseFloat(providerRateChat) || 1.0,
          preferredCustomerGender: providerPreferredGender,
          photo: providerPhoto,
        };
      }

      const success = await signUp(email, password, role, profileData);
      if (success) {
        toast.success("Account created successfully!");
      } else {
        toast.error("Could not create account. This email may already be registered.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProviderPhoto(reader.result as string);
        toast.success("Photo loaded successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleLanguage = (lang: string) => {
    setProviderLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const toggleCategory = (cat: string) => {
    setProviderCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex flex-col items-center justify-center pt-10 pb-6 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-secondary text-primary mint-glow mb-4">
          <Compass className="h-9 w-9" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
          Minute
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Talk to someone, by the minute</p>
      </header>

      {/* Auth Box */}
      <main className="flex-1 px-5 pb-10">
        <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-lg">
          {/* Tab Selection */}
          <div className="flex bg-muted p-1 rounded-2xl mb-6">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                mode === "login" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                mode === "signup" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common Auth Fields */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-muted-foreground font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-background border-border/80 text-foreground rounded-xl placeholder:text-muted-foreground focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs text-muted-foreground font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 bg-background border-border/80 text-foreground rounded-xl placeholder:text-muted-foreground focus-visible:ring-primary"
                />
              </div>
            </div>

            {/* Registration Role Selection */}
            {mode === "signup" && (
              <div className="space-y-3 pt-2 border-t border-border/40">
                <Label className="text-xs text-muted-foreground font-medium">I want to register as a:</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("customer")}
                    className={`flex-1 py-3 border rounded-2xl text-xs font-bold transition-all ${
                      role === "customer"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 bg-muted text-muted-foreground"
                    }`}
                  >
                    Customer
                    <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">Talk & call listeners</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("provider")}
                    className={`flex-1 py-3 border rounded-2xl text-xs font-bold transition-all ${
                      role === "provider"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 bg-muted text-muted-foreground"
                    }`}
                  >
                    Service Provider
                    <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">Earn by the minute</span>
                  </button>
                </div>
              </div>
            )}

            {/* Customer Complete Profile Fields */}
            {mode === "signup" && role === "customer" && (
              <div className="space-y-4 pt-2 border-t border-border/40 animate-fade-in">
                <h3 className="text-sm font-bold text-primary">Complete Your Profile</h3>

                <div className="space-y-1.5">
                  <Label htmlFor="custName" className="text-xs text-muted-foreground">Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                    <Input
                      id="custName"
                      placeholder="e.g. Riya Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="pl-10 h-11 bg-background border-border/80 text-foreground rounded-xl focus-visible:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Gender</Label>
                  <div className="flex gap-2">
                    {["Woman", "Man", "Non-binary"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setCustomerGender(g)}
                        className={`flex-1 py-2 border rounded-xl text-xs font-medium transition-all ${
                          customerGender === g
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/60 bg-muted text-muted-foreground"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Provider Complete Profile Fields */}
            {mode === "signup" && role === "provider" && (
              <div className="space-y-4 pt-2 border-t border-border/40 animate-fade-in text-foreground">
                <h3 className="text-sm font-bold text-primary">Complete Provider Profile</h3>

                <div className="space-y-1.5">
                  <Label htmlFor="provName" className="text-xs text-muted-foreground">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                    <Input
                      id="provName"
                      placeholder="e.g. Ava Roy"
                      value={providerName}
                      onChange={(e) => setProviderName(e.target.value)}
                      className="pl-10 h-11 bg-background border-border/80 text-foreground rounded-xl focus-visible:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="provUsername" className="text-xs text-muted-foreground">Username</Label>
                  <Input
                    id="provUsername"
                    placeholder="e.g. ava_r"
                    value={providerUsername}
                    onChange={(e) => setProviderUsername(e.target.value)}
                    className="h-11 bg-background border-border/80 text-foreground rounded-xl focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="provArea" className="text-xs text-muted-foreground">Location (Neighbourhood)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                    <Input
                      id="provArea"
                      placeholder="e.g. Bandra West"
                      value={providerArea}
                      onChange={(e) => setProviderArea(e.target.value)}
                      className="pl-10 h-11 bg-background border-border/80 text-foreground rounded-xl focus-visible:ring-primary"
                    />
                  </div>
                </div>

                {/* Local device image file selection */}
                <div className="space-y-1.5">
                  <Label htmlFor="provPhotoUpload" className="text-xs text-muted-foreground">Profile Photo (Upload from device)</Label>
                  <div className="flex gap-3 items-center">
                    <div className="relative h-14 w-14 shrink-0 rounded-2xl overflow-hidden bg-muted border border-border flex items-center justify-center">
                      {providerPhoto ? (
                        <img src={providerPhoto} alt="Upload preview" className="h-full w-full object-cover" />
                      ) : (
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <label className="flex-1 flex items-center justify-center h-11 px-4 border border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors text-xs font-semibold text-primary">
                      <Upload className="h-4 w-4 mr-2" /> Choose local file
                      <input
                        id="provPhotoUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Your Gender</Label>
                  <div className="flex gap-2">
                    {["female", "male", "non-binary"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setProviderGender(g as any)}
                        className={`flex-1 py-2 border rounded-xl text-xs font-medium capitalize transition-all ${
                          providerGender === g
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border/60 bg-muted text-muted-foreground"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Languages Spoken (Select multiple)</Label>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-muted rounded-xl border border-border/60">
                    {allLanguages.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => toggleLanguage(l)}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                          providerLanguages.includes(l)
                            ? "border-primary bg-primary text-primary-foreground font-semibold"
                            : "border-border/60 bg-card text-muted-foreground"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Categories (Select multiple)</Label>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-muted rounded-xl border border-border/60">
                    {allCategories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCategory(c)}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                          providerCategories.includes(c)
                            ? "border-primary bg-primary text-primary-foreground font-semibold"
                            : "border-border/60 bg-card text-muted-foreground"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="provExp" className="text-xs text-muted-foreground">Experience (years / details)</Label>
                  <Input
                    id="provExp"
                    placeholder="e.g. 3 years listening"
                    value={providerExperience}
                    onChange={(e) => setProviderExperience(e.target.value)}
                    className="h-11 bg-background border-border/80 text-foreground rounded-xl focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="provDesc" className="text-xs text-muted-foreground">Bio / Description</Label>
                  <Textarea
                    id="provDesc"
                    rows={3}
                    placeholder="Tell customers how you can help them..."
                    value={providerDescription}
                    onChange={(e) => setProviderDescription(e.target.value)}
                    className="bg-background border-border/80 text-foreground rounded-xl focus-visible:ring-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="provCallRate" className="text-xs text-muted-foreground">Voice Call Price / min</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="provCallRate"
                        type="number"
                        step="0.1"
                        value={providerRateCall}
                        onChange={(e) => setProviderRateCall(e.target.value)}
                        className="pl-8 h-11 bg-background border-border/80 text-foreground rounded-xl focus-visible:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="provChatRate" className="text-xs text-muted-foreground">Chat Price / min</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="provChatRate"
                        type="number"
                        step="0.1"
                        value={providerRateChat}
                        onChange={(e) => setProviderRateChat(e.target.value)}
                        className="pl-8 h-11 bg-background border-border/80 text-foreground rounded-xl focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Preferred Customer Gender</Label>
                  <div className="flex gap-2">
                    {["everyone", "female", "male"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setProviderPreferredGender(g as any)}
                        className={`flex-1 py-2 border rounded-xl text-xs font-medium capitalize transition-all ${
                          providerPreferredGender === g
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border/60 bg-muted text-muted-foreground"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold transition-all duration-200 mt-6 shadow mint-glow"
            >
              {mode === "login" ? "Login" : "Sign Up"}
            </Button>
          </form>
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Secure, verified, anonymous.
        </p>
      </main>
    </div>
  );
}
