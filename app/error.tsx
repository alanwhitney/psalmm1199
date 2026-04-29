"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center"
         style={{ background: "var(--surface)", color: "var(--ink-primary)" }}>
      <h2 className="text-[17px] font-semibold m-0">Something went wrong</h2>
      <p className="text-sm m-0" style={{ color: "var(--ink-muted)" }}>
        An unexpected error occurred. Your data is safe.
      </p>
      <button
        onClick={reset}
        className="px-5 py-2 text-sm font-bold rounded-lg border-none cursor-pointer"
        style={{ background: "var(--gold)", color: "var(--surface)" }}
      >
        Try again
      </button>
    </div>
  );
}
