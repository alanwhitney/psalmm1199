"use client";

import { useEffect } from "react";

export default function PrintTrigger() {
  useEffect(() => {
    window.print();
  }, []);
  return (
    <button className="print-btn" onClick={() => window.print()}>
      Print / Save PDF
    </button>
  );
}
