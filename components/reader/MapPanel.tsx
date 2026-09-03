"use client";

import dynamic from "next/dynamic";
import { Map } from "lucide-react";
import { MapPlace } from "@/lib/chapter-places";

const BibleMap = dynamic(() => import("./BibleMap"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center text-ink-muted text-[13px]">
      Loading map…
    </div>
  ),
});

export default function MapPanel({
  places,
  onClose,
}: {
  places: MapPlace[];
  onClose: () => void;
}) {
  // lg:relative + lg:z-0 keeps this a stacking context on desktop too, so
  // Leaflet's internal pane/control z-indexes (up to 1000) stay contained
  // below the Strong's modal instead of painting over it.
  return (
    <div className="absolute inset-0 z-20 lg:relative lg:inset-auto lg:z-0 lg:w-80 xl:w-96 2xl:w-[440px] border-t lg:border-t-0 lg:border-l border-line-subtle bg-surface-raised flex flex-col shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-line-subtle flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Map size={13} className="text-ink-muted" />
          <h3 className="text-[13px] font-semibold text-ink-primary m-0">Map</h3>
          <span className="text-[11px] text-ink-muted">
            {places.length} {places.length === 1 ? "place" : "places"}
          </span>
        </div>
        <button
          onClick={onClose}
          className="bg-transparent border-none cursor-pointer text-ink-muted text-lg leading-none p-0"
        >
          ×
        </button>
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-0">
        <BibleMap places={places} />
      </div>

      {/* Place list */}
      <div className="px-3 py-2 border-t border-line-subtle shrink-0 flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
        {places.map((p) => (
          <span
            key={p.name}
            className="text-[10px] px-2 py-0.5 rounded-full bg-surface-overlay border border-line-subtle text-ink-secondary"
          >
            {p.name}
          </span>
        ))}
      </div>

      {/* Attribution */}
      <div className="px-3 py-1 border-t border-line-subtle shrink-0">
        <p className="text-[9px] text-ink-muted m-0">
          Places:{" "}
          <a
            href="https://openbible.info/geo/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-muted no-underline"
          >
            OpenBible.info
          </a>{" "}
          · Tiles:{" "}
          <a
            href="https://carto.com/attributions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-muted no-underline"
          >
            CARTO
          </a>
        </p>
      </div>
    </div>
  );
}
