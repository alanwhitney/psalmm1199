"use client";

import { useState } from "react";
import { Marker, Pane, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { ancientLabels, AncientLabel } from "@/lib/data/ancient-labels";

function labelIcon(label: AncientLabel) {
  const classes = [
    "ancient-label",
    `ancient-label-${label.kind ?? "land"}`,
    `ancient-label-${label.size ?? "md"}`,
  ].join(" ");
  return L.divIcon({
    html: `<span class="${classes}">${label.name}</span>`,
    iconSize: [0, 0],
    className: "",
  });
}

const icons = new Map(ancientLabels.map((l) => [l.name, labelIcon(l)]));

// Sits above period overlays (400) but below place markers (600) and never
// takes clicks.
export default function AncientLabelsLayer() {
  const map = useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const [zoom, setZoom] = useState(() => map.getZoom());

  return (
    <Pane name="ancient-labels" style={{ zIndex: 450, pointerEvents: "none" }}>
      {ancientLabels
        .filter((l) => zoom >= l.minZoom && zoom <= (l.maxZoom ?? Infinity))
        .map((l) => (
          <Marker
            key={l.name}
            position={[l.lat, l.lon]}
            icon={icons.get(l.name)!}
            interactive={false}
            keyboard={false}
          />
        ))}
    </Pane>
  );
}
