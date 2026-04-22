import Link from "next/link";
import { BookOpen } from "lucide-react";

const C = {
  bg: "#0e0e10",
  bgRaised: "#18181c",
  border: "#2a2a32",
  gold: "#c9a84c",
  goldMuted: "#8a6e2f",
  textPrimary: "#f0ede6",
  textSecondary: "#9d9a95",
  textMuted: "#5a5855",
};

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", background: C.bg, position: "relative" }}>
      {/* Glow */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(201,168,76,0.06) 0%, transparent 70%)" }} />

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 480 }}>
        {/* Icon */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: C.bgRaised, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BookOpen size={28} color={C.gold} />
          </div>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 36, fontWeight: 300, letterSpacing: "-0.02em", marginBottom: 8, color: C.textPrimary, fontFamily: "var(--font-reading, Georgia, serif)" }}>
          Psalm 119:9
        </h1>

        <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 8, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
          Bible Reader
        </p>

        {/* Gold divider */}
        <div style={{ height: 1, width: 96, margin: "20px auto", background: `linear-gradient(to right, transparent, ${C.goldMuted}, transparent)` }} />

        {/* Verse */}
        <p style={{ color: C.textSecondary, fontSize: 15, marginBottom: 40, lineHeight: 1.7, fontStyle: "italic", fontFamily: "var(--font-reading, Georgia, serif)" }}>
          "Wherewithal shall a young man cleanse his way? By taking heed thereto according to thy word."
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
          <Link href="/bible/PSA/119" style={{ padding: "12px 32px", background: C.gold, color: C.bg, fontWeight: 700, fontSize: 13, borderRadius: 8, textDecoration: "none", display: "inline-block" }}>
            Open Bible
          </Link>
          <Link href="/auth/login" style={{ padding: "12px 32px", background: C.bgRaised, border: `1px solid ${C.border}`, color: C.textPrimary, fontSize: 13, borderRadius: 8, textDecoration: "none", display: "inline-block" }}>
            Sign in
          </Link>
        </div>

        <p style={{ marginTop: 24, color: C.textMuted, fontSize: 11 }}>
          No account needed to read — sign in to save bookmarks & notes
        </p>
      </div>
    </main>
  );
}
