import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";
import { cookies } from "next/headers";
import { lastPositionUrl } from "@/lib/last-position";

const C = {
  bg: "#0e0e10",
  bgRaised: "#18181c",
  bgOverlay: "#222228",
  border: "#2a2a32",
  gold: "#c9a84c",
  goldMuted: "#8a6e2f",
  textPrimary: "#f0ede6",
  textSecondary: "#9d9a95",
  textMuted: "#5a5855",
};

export const metadata = {
  title: "About — Psalm 119:9",
};

export default async function AboutPage() {
  const cookieStore = await cookies();
  const backHref = lastPositionUrl(cookieStore.get("last_position")?.value);
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.textPrimary }}>
      {/* Header */}
      <header style={{ background: C.bgRaised, borderBottom: `1px solid ${C.border}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href={backHref} style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: C.textMuted, fontSize: 13 }}>
            <ArrowLeft size={15} /> Back to reading
          </Link>
          <div style={{ width: 1, height: 16, background: C.border }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BookOpen size={16} color={C.gold} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>Psalm 119:9</span>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "60px 24px" }}>
        {/* Icon */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: C.bgRaised, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BookOpen size={28} color={C.gold} />
          </div>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 28, fontWeight: 300, color: C.textPrimary, textAlign: "center", marginBottom: 8, fontFamily: "var(--font-reading, Georgia, serif)" }}>
          Psalm 119:9
        </h1>
        <p style={{ fontSize: 12, color: C.textMuted, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 12 }}>
          Bible Reader
        </p>

        {/* Gold divider */}
        <div style={{ height: 1, width: 80, margin: "0 auto 40px", background: `linear-gradient(to right, transparent, ${C.goldMuted}, transparent)` }} />

        {/* Name verse */}
        <div style={{ background: C.bgRaised, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 32, borderLeft: `3px solid ${C.gold}` }}>
          <p style={{ fontSize: 15, color: C.textPrimary, fontFamily: "var(--font-reading, Georgia, serif)", lineHeight: 1.8, margin: "0 0 8px", fontStyle: "italic" }}>
            "Wherewithal shall a young man cleanse his way? By taking heed thereto according to thy word."
          </p>
          <p style={{ fontSize: 12, color: C.gold, fontWeight: 600, margin: 0 }}>— Psalm 119:9 (KJV)</p>
        </div>

        {/* About sections */}
        {[
          {
            heading: "What is this?",
            body: "Psalm 119:9 is a clean, focused Bible reading app built to make daily scripture reading simple and distraction-free. Read the Bible in multiple translations, bookmark your place, take notes on any chapter, and follow structured reading plans."
          },
          {
            heading: "Translations",
            body: "Currently available in King James Version (KJV), New King James Version (NKJV), and New International Version (NIV). Bible text is provided through the API.Bible service."
          },
          {
            heading: "Features",
            body: "Read any chapter across all 66 books of the Bible. Save multiple bookmarks with custom labels. Attach notes to any chapter. Follow reading plans including Bible in a Year, New Testament in 90 Days, Psalms & Proverbs in 30 Days, and Chronological Bible in a Year. Search the full Bible or within a chapter. Tap any verse to copy or share it."
          },
          {
            heading: "Your data",
            body: "Bookmarks, notes, and reading plan progress are stored securely in your account. No data is sold or shared with third parties. You can delete your account and all associated data at any time."
          },
          {
            heading: "About us",
            body: "This is a simple tool created by Alan Whitney in South West East Corinth in Central Maine. It's free, it's simple. Enjoy."
          },
        ].map(({ heading, body }) => (
          <div key={heading} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              {heading}
            </h2>
            <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.8, margin: 0 }}>
              {body}
            </p>
          </div>
        ))}

        {/* Divider */}
        <div style={{ height: 1, background: C.border, margin: "32px 0" }} />

        {/* CTA */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href={backHref} style={{ padding: "10px 24px", background: C.gold, color: C.bg, fontWeight: 700, fontSize: 13, borderRadius: 8, textDecoration: "none" }}>
            Start Reading
          </Link>
          <Link href="/auth/signup" style={{ padding: "10px 24px", background: C.bgRaised, border: `1px solid ${C.border}`, color: C.textPrimary, fontSize: 13, borderRadius: 8, textDecoration: "none" }}>
            Create Account
          </Link>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: C.textMuted, marginTop: 48 }}>
          psalm1199.com
        </p>
      </div>
    </div>
  );
}
