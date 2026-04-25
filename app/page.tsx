import Link from "next/link";

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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-16 h-16 rounded-2xl">
            <rect width="32" height="32" rx="6" fill="#18181c"/>
            <path d="M3 7 C8 6.5 12 6.5 15 7 L15 26 C12 25.5 8 25.5 3 26 Z" fill="#f0ede6"/>
            <path d="M17 7 C20 6.5 24 6.5 29 7 L29 26 C24 25.5 20 25.5 17 26 Z" fill="#f0ede6"/>
            <rect x="14.5" y="5.5" width="3" height="21" rx="0.5" fill="#8a6e2f"/>
            <path d="M3 26 C8 25.5 12 25.5 14.5 26.5 L17.5 26.5 C20 25.5 24 25.5 29 26 L29 27 C24 26.5 20 26.5 17.5 27.5 L14.5 27.5 C12 26.5 8 26.5 3 27 Z" fill="#8a6e2f" opacity="0.7"/>
            <rect x="21.5" y="9.5" width="2.5" height="13" rx="0.7" fill="#c9a84c"/>
            <rect x="17.5" y="13.5" width="10.5" height="2.5" rx="0.7" fill="#c9a84c"/>
            <rect x="5" y="11" width="8" height="1" rx="0.5" fill="#5a5855" opacity="0.7"/>
            <rect x="5" y="14" width="8" height="1" rx="0.5" fill="#5a5855" opacity="0.7"/>
            <rect x="5" y="17" width="8" height="1" rx="0.5" fill="#5a5855" opacity="0.7"/>
            <rect x="5" y="20" width="5.5" height="1" rx="0.5" fill="#5a5855" opacity="0.7"/>
          </svg>
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
