"use client";

import { useState } from "react";
import { signUp, signIn, useSession, signOut } from "@/lib/auth-client";
import { 
  Youtube, 
  Sparkles, 
  CheckCircle2, 
  Lightbulb, 
  Target,
  ArrowRight,
  Loader2,
  Play,
  Zap,
  Brain
} from "lucide-react";
import Link from "next/link";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        {/* Welcome Animation */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent-gold)] to-[var(--accent-cyan)] mb-6 animate-float">
            <Play size={36} className="text-[var(--bg-void)] ml-1" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Welcome back,{" "}
            <span className="text-gradient">{session.user.name}</span>!
          </h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-md mx-auto">
            Ready to transform your next video into actionable wisdom?
          </p>
        </div>
        
        <div className="flex gap-4 animate-fadeIn" style={{ animationDelay: "0.15s" }}>
          <Link href="/dashboard" className="btn-primary flex items-center gap-2">
            Go to Dashboard
            <ArrowRight size={18} />
          </Link>
          <button 
            onClick={() => signOut()}
            className="btn-secondary"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left side - Branding & Features */}
        <div className="flex-1 flex flex-col justify-center px-6 lg:px-16 py-16 lg:py-0">
          <div className="max-w-xl">
            {/* Logo */}
            <div className="flex items-center gap-4 mb-10 animate-fadeIn">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent-gold)] to-[var(--accent-gold-soft)] flex items-center justify-center shadow-lg animate-glow">
                  <Youtube size={28} className="text-[var(--bg-void)]" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--accent-cyan)] flex items-center justify-center">
                  <Sparkles size={12} className="text-[var(--bg-void)]" />
                </div>
              </div>
              <span className="text-2xl font-bold tracking-tight font-display">VidNote</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl lg:text-6xl font-extrabold leading-[1.1] mb-6 animate-fadeIn font-display" style={{ animationDelay: "0.1s" }}>
              Transform Videos
              <br />
              <span className="text-gradient">
                Into Actions
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg lg:text-xl text-[var(--text-secondary)] mb-12 leading-relaxed animate-fadeIn" style={{ animationDelay: "0.2s" }}>
              Paste any YouTube URL and let AI extract the key takeaways, 
              action items, and insights. <span className="text-[var(--text-primary)]">Never miss an important point again.</span>
            </p>

            {/* Features - Horizontal on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn" style={{ animationDelay: "0.3s" }}>
              <div className="glass-card p-5 group hover:scale-105 transition-transform duration-300">
                <div className="w-12 h-12 rounded-xl bg-[var(--success-glow)] border border-[var(--success)]/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Target size={22} className="text-[var(--success)]" />
                </div>
                <h3 className="font-semibold mb-1 font-display">Action Items</h3>
                <p className="text-sm text-[var(--text-muted)]">Clear steps to implement</p>
              </div>

              <div className="glass-card p-5 group hover:scale-105 transition-transform duration-300">
                <div className="w-12 h-12 rounded-xl bg-[var(--warning-glow)] border border-[var(--warning)]/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Brain size={22} className="text-[var(--warning)]" />
                </div>
                <h3 className="font-semibold mb-1 font-display">Key Takeaways</h3>
                <p className="text-sm text-[var(--text-muted)]">Facts to remember</p>
              </div>

              <div className="glass-card p-5 group hover:scale-105 transition-transform duration-300">
                <div className="w-12 h-12 rounded-xl bg-[var(--insight-glow)] border border-[var(--insight)]/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Lightbulb size={22} className="text-[var(--insight)]" />
                </div>
                <h3 className="font-semibold mb-1 font-display">Deep Insights</h3>
                <p className="text-sm text-[var(--text-muted)]">Aha moments unlocked</p>
              </div>
            </div>

            {/* Trust Badge */}
            <div className="mt-10 flex items-center gap-3 text-sm text-[var(--text-muted)] animate-fadeIn" style={{ animationDelay: "0.4s" }}>
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-gold)] to-[var(--accent-cyan)] flex items-center justify-center text-[var(--bg-void)] text-xs font-bold">AI</div>
              </div>
              <span>Powered by <span className="text-[var(--accent-gold)]">Google Gemini</span></span>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:py-0">
          <div className="w-full max-w-md">
            <div className="glass-card p-8 animate-fadeInScale" style={{ animationDelay: "0.2s" }}>
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--accent-gold)]/10 to-transparent rounded-bl-full pointer-events-none"></div>
              
              {/* Tabs */}
              <div className="flex mb-8 p-1.5 bg-[var(--bg-deep)] rounded-xl relative z-10">
                <button
                  onClick={() => { setIsLogin(true); setError(""); }}
                  className={`flex-1 py-3.5 rounded-lg font-semibold transition-all duration-300 ${
                    isLogin 
                      ? "bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-gold-soft)] text-[var(--bg-void)] shadow-lg" 
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setIsLogin(false); setError(""); }}
                  className={`flex-1 py-3.5 rounded-lg font-semibold transition-all duration-300 ${
                    !isLogin 
                      ? "bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-gold-soft)] text-[var(--bg-void)] shadow-lg" 
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                {!isLogin && (
                  <div className="animate-fadeIn">
                    <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="input-glass"
                      required={!isLogin}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-glass"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-glass"
                    required
                    minLength={8}
                  />
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] text-sm animate-fadeIn">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
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

              {/* Divider */}
              <div className="mt-8 text-center text-sm text-[var(--text-muted)] relative z-10">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => { setIsLogin(!isLogin); setError(""); }}
                  className="text-[var(--accent-gold)] hover:text-[var(--accent-cyan)] font-semibold transition-colors"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 text-center relative z-10">
        <p className="text-sm text-[var(--text-muted)]">
          Built with <span className="text-[var(--accent-gold)]">Next.js</span>, <span className="text-[var(--accent-cyan)]">Drizzle</span>, and <span className="text-gradient">Google Gemini AI</span>
        </p>
      </footer>
    </div>
  );
}
