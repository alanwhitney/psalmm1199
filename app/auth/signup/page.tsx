"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getLastPositionUrl } from "@/lib/last-position";

const inputClass = "w-full px-3 py-2.5 bg-surface-overlay border border-line-subtle rounded-lg text-[13px] text-ink-primary outline-none box-border";
const labelClass = "block text-[11px] text-ink-secondary font-semibold mb-1.5 uppercase tracking-[0.05em]";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center max-w-[400px]">
          <div className="w-12 h-12 rounded-xl bg-gold/[10%] border border-gold/40 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={20} className="text-gold" />
          </div>
          <h2 className="text-xl font-semibold text-ink-primary mb-2">Check your email</h2>
          <p className="text-sm text-ink-secondary leading-[1.6] mb-6">
            We sent a confirmation link to <strong className="text-ink-primary">{email}</strong>. Click it to activate your account.
          </p>
          <Link href="/auth/login" className="text-[13px] text-gold no-underline">
            Back to sign in →
          </Link>
        </div>
      </div>
    );
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
          <h1 className="text-xl font-semibold text-ink-primary mt-4 mb-1">Create an account</h1>
          <p className="text-[13px] text-ink-muted m-0">Save bookmarks and notes as you read</p>
        </div>

        {/* Form */}
        <div className="bg-surface-raised border border-line-subtle rounded-xl p-6">
          <form onSubmit={handleSignup}>
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

            <div className="mb-4">
              <label className={labelClass}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className={inputClass}
              />
            </div>

            <div className="mb-5">
              <label className={labelClass}>Confirm password</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-ink-muted mt-4">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-gold no-underline">Sign in</Link>
        </p>

        <p className="text-center mt-3">
          <Link href={typeof window !== "undefined" ? getLastPositionUrl() : "/bible/PSA/119"} className="text-xs text-ink-muted no-underline">
            Continue reading without an account →
          </Link>
        </p>
      </div>
    </div>
  );
}
