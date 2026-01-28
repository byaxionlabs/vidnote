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
  Loader2
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
        <div className="text-center mb-8 animate-fadeIn">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-purple">{session.user.name}</span>!
          </h1>
          <p className="text-muted text-lg">Ready to extract insights from your next video?</p>
        </div>
        
        <div className="flex gap-4 animate-fadeIn" style={{ animationDelay: "0.1s" }}>
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
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left side - Branding & Features */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12 lg:py-0">
          <div className="max-w-lg">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8 animate-fadeIn">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center">
                <Youtube size={28} className="text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">VidNote</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6 animate-fadeIn" style={{ animationDelay: "0.1s" }}>
              Transform Videos into{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent-purple to-secondary">
                Actionable Insights
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-muted mb-10 animate-fadeIn" style={{ animationDelay: "0.2s" }}>
              Paste any YouTube URL and let AI extract the key takeaways, action items, and insights. 
              Never miss an important point again.
            </p>

            {/* Features */}
            <div className="space-y-4 animate-fadeIn" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent-green/10 border border-accent-green/30 flex items-center justify-center">
                  <Target size={20} className="text-accent-green" />
                </div>
                <div>
                  <h3 className="font-semibold">Action Items</h3>
                  <p className="text-sm text-muted">Clear steps you can implement right away</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent-yellow/10 border border-accent-yellow/30 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-accent-yellow" />
                </div>
                <div>
                  <h3 className="font-semibold">Key Takeaways</h3>
                  <p className="text-sm text-muted">Important facts and concepts to remember</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent-purple/10 border border-accent-purple/30 flex items-center justify-center">
                  <Lightbulb size={20} className="text-accent-purple" />
                </div>
                <div>
                  <h3 className="font-semibold">Deep Insights</h3>
                  <p className="text-sm text-muted">Aha moments and deeper understanding</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="flex-1 flex items-center justify-center px-8 py-12 lg:py-0">
          <div className="w-full max-w-md">
            <div className="glass-card p-8 animate-fadeIn" style={{ animationDelay: "0.2s" }}>
              {/* Tabs */}
              <div className="flex mb-8 p-1 bg-background/50 rounded-xl">
                <button
                  onClick={() => { setIsLogin(true); setError(""); }}
                  className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                    isLogin 
                      ? "bg-gradient-to-r from-primary to-accent-purple text-white shadow-lg" 
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setIsLogin(false); setError(""); }}
                  className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                    !isLogin 
                      ? "bg-gradient-to-r from-primary to-accent-purple text-white shadow-lg" 
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
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
                  <label className="block text-sm font-medium mb-2">Email</label>
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
                  <label className="block text-sm font-medium mb-2">Password</label>
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
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {isLogin ? "Signing in..." : "Creating account..."}
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      {isLogin ? "Sign In" : "Create Account"}
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="mt-8 text-center text-sm text-muted">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => { setIsLogin(!isLogin); setError(""); }}
                  className="text-primary hover:text-primary-hover font-medium"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 px-8 text-center text-sm text-muted">
        <p>Built with Next.js, Drizzle, and Google Gemini AI</p>
      </footer>
    </div>
  );
}
