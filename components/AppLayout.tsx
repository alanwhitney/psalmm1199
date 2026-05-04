"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, LogIn, LogOut, Bookmark, CalendarDays, Info, BookHeart, Sun, Moon } from "lucide-react";
import AppLogo from "@/components/AppLogo";
import { useTheme } from "@/components/ThemeProvider";
import { createClient } from "@/lib/supabase/client";

interface Props {
  user: { id: string; email?: string } | null;
  backHref: string;
  backLabel?: string;
  title: string;
  children: React.ReactNode;
}

const DESKTOP_BREAKPOINT = 1024;

export default function AppLayout({ user, backHref, backLabel = "Reading", title, children }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const { theme, mounted, toggle, fontSize, incFontSize, decFontSize } = useTheme();

  const [isDesktop, setIsDesktop] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const sidebarVisible = isDesktop || mobileOpen;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const navLinks = [
    { href: "/bookmarks", icon: <Bookmark size={13} />, label: "Bookmarks & Notes" },
    { href: "/bookmarks?tab=plan", icon: <CalendarDays size={13} />, label: "Reading Plan" },
    { href: "/journal", icon: <BookHeart size={13} />, label: "Prayer Journal" },
    { href: "/about", icon: <Info size={13} />, label: "About" },
  ];

  const sidebar = (
    <aside className={`w-[272px] min-w-[272px] bg-surface-raised border-r border-r-line-subtle flex flex-col h-screen top-0 left-0 ${isDesktop ? "relative z-[1]" : "fixed z-40"}`}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-b-line-subtle">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <AppLogo className="w-5 h-5 rounded" />
          <span className="text-[13px] font-semibold text-ink-primary tracking-[0.03em]">Psalm 119:9</span>
        </Link>
        {!isDesktop && (
          <button onClick={() => setMobileOpen(false)} className="bg-transparent border-none cursor-pointer text-ink-muted p-1">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Display */}
      <div className="px-4 py-3 border-b border-b-line-subtle">
        <p className="text-[10px] uppercase tracking-[0.1em] text-ink-muted mb-2 font-semibold">Display</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            <button onClick={() => { if (theme !== "light") toggle(); }} className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-md cursor-pointer ${theme === "light" ? "bg-gold text-surface border-none" : "bg-surface-overlay text-ink-secondary border border-line-subtle"}`}>
              <Sun size={11} /> Light
            </button>
            <button onClick={() => { if (theme !== "dark") toggle(); }} className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-md cursor-pointer ${theme === "dark" ? "bg-gold text-surface border-none" : "bg-surface-overlay text-ink-secondary border border-line-subtle"}`}>
              <Moon size={11} /> Dark
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={decFontSize} disabled={!mounted || fontSize <= 13} className="bg-surface-overlay border border-line-subtle rounded-md w-7 h-7 flex items-center justify-center text-[11px] font-bold text-ink-secondary cursor-pointer disabled:opacity-30">A−</button>
            <span className="text-[11px] text-ink-muted w-7 text-center">{mounted ? fontSize : 17}px</span>
            <button onClick={incFontSize} disabled={!mounted || fontSize >= 25} className="bg-surface-overlay border border-line-subtle rounded-md w-7 h-7 flex items-center justify-center text-[11px] font-bold text-ink-secondary cursor-pointer disabled:opacity-30">A+</button>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <div className="flex-1 px-3 py-3">
        {user && (
          <>
            <p className="text-[10px] uppercase tracking-[0.1em] text-ink-muted font-semibold px-1 pt-1 pb-1.5 m-0">My Reading</p>
            {navLinks.map(({ href, icon, label }) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-1 py-1.5 text-xs text-ink-secondary no-underline rounded-md">
                <span className="text-gold">{icon}</span>
                {label}
              </Link>
            ))}
          </>
        )}
      </div>

      {/* User */}
      <div className="border-t border-t-line-subtle px-4 py-3">
        {user ? (
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-ink-muted overflow-hidden text-ellipsis whitespace-nowrap max-w-[180px] m-0">{user.email}</p>
            <button onClick={handleSignOut} className="bg-transparent border-none cursor-pointer text-ink-muted p-1 shrink-0">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <Link href="/auth/login" className="flex items-center gap-2 text-[13px] text-ink-secondary no-underline">
            <LogIn size={16} /> Sign in to save progress
          </Link>
        )}
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface text-ink-primary">
      {/* Mobile backdrop */}
      {mobileOpen && !isDesktop && (
        <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/60 z-30" />
      )}

      {/* Sidebar */}
      {sidebarVisible && sidebar}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-[10px] border-b border-b-line-subtle bg-surface-raised shrink-0">
          {!isDesktop && (
            <button onClick={() => setMobileOpen(true)} className="bg-transparent border-none cursor-pointer text-ink-muted p-1">
              <Menu size={18} />
            </button>
          )}
          <Link href={backHref} className="flex items-center gap-1.5 no-underline text-ink-muted text-[13px]">
            ← {backLabel}
          </Link>
          <span className="text-line-subtle">·</span>
          <span className="text-[13px] font-semibold text-ink-primary">{title}</span>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
