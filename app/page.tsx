import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-surface relative">
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(201,168,76,0.06) 0%, transparent 70%)" }}
      />

      <div className="relative z-[1] text-center max-w-[480px]">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-surface-raised border border-line-subtle flex items-center justify-center">
            <BookOpen size={28} className="text-gold" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-light tracking-[-0.02em] mb-2 text-ink-primary font-reading">
          Psalm 119:9
        </h1>

        <p className="text-[11px] text-ink-muted mb-2 tracking-[0.12em] uppercase font-semibold">
          Bible Reader
        </p>

        {/* Gold divider */}
        <div className="h-px w-24 mx-auto my-5 bg-gradient-to-r from-transparent via-gold-muted to-transparent" />

        {/* Verse */}
        <p className="text-ink-secondary text-[15px] mb-10 leading-[1.7] italic font-reading">
          "Wherewithal shall a young man cleanse his way? By taking heed thereto according to thy word."
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5 items-center">
          <Link
            href="/bible/PSA/119"
            className="px-8 py-3 bg-gold text-surface font-bold text-[13px] rounded-lg no-underline inline-block"
          >
            Open Bible
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-surface-raised border border-line-subtle text-ink-primary text-[13px] rounded-lg no-underline inline-block"
          >
            Sign in
          </Link>
        </div>

        <p className="mt-6 text-ink-muted text-[11px]">
          No account needed to read — sign in to save bookmarks &amp; notes
        </p>
      </div>
    </main>
  );
}
