"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "@/components/ThemeProvider";
import { MapPlace } from "@/lib/chapter-places";

function makeIcon(dark: boolean) {
  const fill = dark ? "#c9a84c" : "#b07d20";
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="28" viewBox="0 0 20 28">
      <path d="M10 0C4.48 0 0 4.48 0 10c0 7.5 10 18 10 18S20 17.5 20 10C20 4.48 15.52 0 10 0z" fill="${fill}"/>
      <circle cx="10" cy="10" r="4" fill="white" opacity="0.85"/>
    </svg>`,
    iconSize: [20, 28],
    iconAnchor: [10, 28],
    popupAnchor: [0, -30],
    className: "",
  });
}

function FitBounds({ places }: { places: MapPlace[] }) {
  const map = useMap();
  useEffect(() => {
    if (places.length === 0) return;
    if (places.length === 1) {
      map.setView([places[0].lat, places[0].lon], 9);
    } else {
      map.fitBounds(
        L.latLngBounds(places.map((p) => [p.lat, p.lon] as [number, number])),
        { padding: [40, 40] }
      );
    }
  }, [places, map]);
  return null;
}

export default function BibleMap({ places }: { places: MapPlace[] }) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const tileUrl = dark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  const center: [number, number] =
    places.length > 0 ? [places[0].lat, places[0].lon] : [31.77, 35.23];

  const icon = makeIcon(dark);

  return (
    <MapContainer
      key={dark ? "dark" : "light"}
      center={center}
      zoom={7}
      style={{ height: "100%", width: "100%" }}
      zoomControl
    >
      <TileLayer
        url={tileUrl}
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={19}
        subdomains="abcd"
      />
      <FitBounds places={places} />
      {places.map((p) => (
        <Marker key={p.name} position={[p.lat, p.lon]} icon={icon}>
          <Popup>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
