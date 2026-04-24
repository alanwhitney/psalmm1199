"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getLastPositionUrl } from "@/lib/last-position";

const inputClass = "w-full px-3 py-2.5 bg-surface-overlay border border-line-subtle rounded-lg text-[13px] text-ink-primary outline-none box-border";
const labelClass = "block text-[11px] text-ink-secondary font-semibold mb-1.5 uppercase tracking-[0.05em]";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.refresh();
      router.push(getLastPositionUrl());
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-[360px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="no-underline inline-flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-surface-raised border border-line-subtle flex items-center justify-center">
              <BookOpen size={20} className="text-gold" />
            </div>
            <span className="text-xs text-ink-muted">Psalm 119:9</span>
          </Link>
          <h1 className="text-xl font-semibold text-ink-primary mt-4 mb-1">Welcome back</h1>
          <p className="text-[13px] text-ink-muted m-0">Sign in to access your bookmarks &amp; notes</p>
        </div>

        {/* Form */}
        <div className="bg-surface-raised border border-line-subtle rounded-xl p-6">
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className={labelClass}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            <div className="mb-5">
              <label className={labelClass}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            {error && (
              <div className="mb-4 px-3 py-2.5 bg-red-500/[8%] border border-red-500/25 rounded-lg text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-[11px] bg-gold text-surface font-bold text-[13px] rounded-lg border-none cursor-pointer ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-ink-muted mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-gold no-underline">Sign up</Link>
        </p>

        <p className="text-center mt-3">
          <Link href="/bible/PSA/119" className="text-xs text-ink-muted no-underline">
            Continue reading without an account →
          </Link>
        </p>
      </div>
    </div>
  );
}
