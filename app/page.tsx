"use client";

import { useState } from "react";
import { signUp, signIn, useSession, signOut } from "@/lib/auth-client";
import { 
  Sparkles, 
  CheckCircle2, 
  Lightbulb, 
  Target,
  ArrowRight,
  Loader2,
  Play,
  Zap,
  Brain,
  FileText
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const { data: session, isPending } = useSession();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const result = await signIn.email({
          email,
          password,
        });
        if (result.error) {
          setError(result.error.message || "Login failed");
        }
      } else {
        const result = await signUp.email({
          email,
          password,
          name,
        });
        if (result.error) {
          setError(result.error.message || "Sign up failed");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="loader"></div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background relative">
        {/* Theme Toggle */}
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 border-2 border-primary mb-6">
            <Play size={40} className="text-primary ml-1" />
          </div>
          <h1 className="text-4xl md:text-5xl mb-4 text-foreground">
            Welcome back,{" "}
            <span className="text-primary font-bold">{session.user.name}</span>!
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Ready to extract insights from Theo&apos;s latest video?
          </p>
        </div>
        
        <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            Go to Dashboard
            <ArrowRight size={18} />
          </Link>
          <button 
            onClick={() => signOut()}
            className="px-8 py-4 border-2 border-border text-foreground font-medium rounded-xl hover:bg-accent hover:border-primary transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-chart-2/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-chart-3/3 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center max-w-7xl mx-auto w-full px-6 lg:px-12">
        {/* Left - Hero Content */}
        <div className="flex-1 flex flex-col justify-center py-16 lg:py-0 lg:pr-12">
          <div className="max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-primary text-sm font-medium mb-8 animate-in fade-in slide-in-from-left duration-500">
              <Sparkles size={16} />
              <span>@t3dotgg Video Insights</span>
            </div>

            {/* Logo & Title */}
            <div className="flex items-center gap-4 mb-6 animate-in fade-in slide-in-from-left duration-500 delay-50">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-primary-foreground">T</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground font-serif">
                Theo-Notes
              </h1>
            </div>

            {/* Headline - Large and Editorial */}
            <h2 className="text-3xl lg:text-5xl leading-[1.15] mb-6 text-foreground animate-in fade-in slide-in-from-left duration-500 delay-100">
              Never Miss an
              <br />
              <span className="text-primary italic">Important Point</span>
              <br />
              From Theo
            </h2>

            {/* Subheadline */}
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed animate-in fade-in slide-in-from-left duration-500 delay-200">
              Paste any video from <span className="text-primary font-medium">@t3dotgg</span> and let AI extract 
              the key takeaways, action items, and insights you need to level up.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 mb-10 animate-in fade-in slide-in-from-left duration-500 delay-300">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl shadow-sm">
                <Target size={18} className="text-primary" />
                <span className="text-sm font-medium text-foreground">Action Items</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl shadow-sm">
                <Brain size={18} className="text-chart-2" />
                <span className="text-sm font-medium text-foreground">Key Takeaways</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl shadow-sm">
                <Lightbulb size={18} className="text-chart-3" />
                <span className="text-sm font-medium text-foreground">Deep Insights</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm animate-in fade-in slide-in-from-left duration-500 delay-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-primary" />
                <span className="text-muted-foreground">Powered by Gemini AI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Auth Card */}
        <div className="flex-1 flex items-center justify-center py-12 lg:py-0 w-full max-w-md lg:max-w-lg">
          {/* Auth Card with Elevated Design */}
          <div className="w-full bg-card border border-border rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-right duration-500 delay-200">
            {/* Card Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-4">
                <FileText size={28} className="text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {isLogin ? "Welcome Back" : "Get Started"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isLogin ? "Sign in to access your notes" : "Create an account to start"}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex mb-6 p-1 bg-muted rounded-xl">
              <button
                onClick={() => { setIsLogin(true); setError(""); }}
                className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  isLogin 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(""); }}
                className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  !isLogin 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="animate-in fade-in slide-in-from-top duration-300">
                  <label className="block text-sm font-medium mb-2 text-foreground">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
                  required
                  minLength={8}
                />
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm animate-in fade-in duration-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    {isLogin ? "Sign In" : "Create Account"}
                  </>
                )}
              </button>
            </form>

            {/* Footer Link */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {isLogin ? "New here? " : "Already have an account? "}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(""); }}
                className="text-primary hover:underline font-semibold transition-colors"
              >
                {isLogin ? "Create an account" : "Sign in"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 px-6 text-center border-t border-border">
        <p className="text-sm text-muted-foreground">
          Built for <span className="text-primary font-medium">@t3dotgg</span> fans • Powered by <span className="text-primary font-medium">Gemini AI</span>
        </p>
      </footer>
    </div>
  );
}
