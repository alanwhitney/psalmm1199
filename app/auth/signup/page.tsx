"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getLastPositionUrl } from "@/lib/last-position";

const C = {
  bg: "#0e0e10",
  bgRaised: "#18181c",
  bgOverlay: "#222228",
  border: "#2a2a32",
  gold: "#c9a84c",
  goldBright: "#e8c56a",
  textPrimary: "#f0ede6",
  textSecondary: "#9d9a95",
  textMuted: "#5a5855",
};

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
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `${C.gold}1a`, border: `1px solid ${C.gold}66`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <BookOpen size={20} color={C.gold} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: C.textPrimary, margin: "0 0 8px" }}>Check your email</h2>
          <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.6, margin: "0 0 24px" }}>
            We sent a confirmation link to <strong style={{ color: C.textPrimary }}>{email}</strong>. Click it to activate your account.
          </p>
          <Link href="/auth/login" style={{ fontSize: 13, color: C.gold, textDecoration: "none" }}>
            Back to sign in →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: C.bgRaised, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BookOpen size={20} color={C.gold} />
            </div>
            <span style={{ fontSize: 12, color: C.textMuted }}>Psalm 119:9</span>
          </Link>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: C.textPrimary, margin: "16px 0 4px" }}>Create an account</h1>
          <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>Save bookmarks and notes as you read</p>
        </div>

        {/* Form */}
        <div style={{ background: C.bgRaised, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, color: C.textSecondary, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ width: "100%", padding: "10px 12px", background: C.bgOverlay, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.textPrimary, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, color: C.textSecondary, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                style={{ width: "100%", padding: "10px 12px", background: C.bgOverlay, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.textPrimary, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, color: C.textSecondary, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Confirm password</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                style={{ width: "100%", padding: "10px 12px", background: C.bgOverlay, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.textPrimary, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {error && (
              <div style={{ marginBottom: 16, padding: "10px 12px", background: "#ef444420", border: "1px solid #ef444440", borderRadius: 8, fontSize: 12, color: "#f87171" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", padding: "11px 0", background: C.gold, color: C.bg, fontWeight: 700, fontSize: 13, borderRadius: 8, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: C.textMuted, marginTop: 16 }}>
          Already have an account?{" "}
          <Link href="/auth/login" style={{ color: C.gold, textDecoration: "none" }}>Sign in</Link>
        </p>

        <p style={{ textAlign: "center", marginTop: 12 }}>
          <Link href={typeof window !== "undefined" ? getLastPositionUrl() : "/bible/PSA/119"} style={{ fontSize: 12, color: C.textMuted, textDecoration: "none" }}>
            Continue reading without an account →
          </Link>
        </p>
      </div>
    </div>
  );
}
