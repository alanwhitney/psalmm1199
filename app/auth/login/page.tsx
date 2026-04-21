"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const C = {
  bg: "#0e0e10",
  bgRaised: "#18181c",
  bgOverlay: "#222228",
  border: "#2a2a32",
  gold: "#c9a84c",
  textPrimary: "#f0ede6",
  textSecondary: "#9d9a95",
  textMuted: "#5a5855",
};

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
      // Refresh first to sync session cookies, then navigate
      router.refresh();
      router.push("/bible/PSA/119");
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    background: C.bgOverlay,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    fontSize: 13,
    color: C.textPrimary,
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block",
    fontSize: 11,
    color: C.textSecondary,
    fontWeight: 600,
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  };

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
          <h1 style={{ fontSize: 20, fontWeight: 600, color: C.textPrimary, margin: "16px 0 4px" }}>Welcome back</h1>
          <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>Sign in to access your bookmarks & notes</p>
        </div>

        {/* Form */}
        <div style={{ background: C.bgRaised, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
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
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: C.textMuted, marginTop: 16 }}>
          Don't have an account?{" "}
          <Link href="/auth/signup" style={{ color: C.gold, textDecoration: "none" }}>Sign up</Link>
        </p>

        <p style={{ textAlign: "center", marginTop: 12 }}>
          <Link href="/bible/PSA/119" style={{ fontSize: 12, color: C.textMuted, textDecoration: "none" }}>
            Continue reading without an account →
          </Link>
        </p>
      </div>
    </div>
  );
}
