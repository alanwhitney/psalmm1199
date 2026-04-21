import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-surface">
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(201,168,76,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 text-center max-w-lg animate-fade-in">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-surface-raised border border-border-subtle flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-gold" />
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-4xl font-light tracking-tight mb-3"
          style={{ fontFamily: "var(--font-reading)", color: "var(--text-primary)" }}
        >
          Psalm 119:9
        </h1>

        {/* Reference */}
        <p className="text-sm text-text-muted mb-2 tracking-wider uppercase font-medium">
          Bible Reader
        </p>

        <div className="gold-divider my-6 mx-auto w-24" />

        {/* Verse */}
        <p
          className="text-text-secondary text-base mb-10 leading-relaxed italic"
          style={{ fontFamily: "var(--font-reading)" }}
        >
          "Wherewithal shall a young man cleanse his way? By taking heed thereto
          according to thy word."
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/bible/PSA/119"
            className="px-6 py-3 bg-gold text-surface font-semibold text-sm rounded-lg hover:bg-gold-bright transition-colors"
          >
            Open Bible
          </Link>
          <Link
            href="/auth/login"
            className="px-6 py-3 bg-surface-raised border border-border text-text-primary text-sm rounded-lg hover:border-gold hover:text-gold transition-colors"
          >
            Sign in
          </Link>
        </div>

        <p className="mt-6 text-text-muted text-xs">
          No account needed to read — sign in to save bookmarks & notes
        </p>
      </div>
    </main>
  );
}
