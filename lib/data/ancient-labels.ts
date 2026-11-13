// Atlas-style names of ancient lands and seas, drawn over the plain physical
// base map. Positions are rough label centres, not borders. Each label shows
// only within its zoom range so the map never gets crowded: empires when
// zoomed out, Israel's neighbours when zoomed in.

export type AncientLabel = {
  name: string;
  lat: number;
  lon: number;
  minZoom: number;
  maxZoom?: number;
  kind?: "land" | "water";
  size?: "lg" | "md" | "sm";
};

export const ancientLabels: AncientLabel[] = [
  // Empires and large lands
  { name: "Egypt", lat: 27.0, lon: 30.8, minZoom: 3, maxZoom: 7, size: "lg" },
  { name: "Assyria", lat: 36.2, lon: 43.4, minZoom: 3, maxZoom: 7, size: "lg" },
  { name: "Babylonia", lat: 32.2, lon: 45.0, minZoom: 3, maxZoom: 7, size: "lg" },
  { name: "Media", lat: 35.2, lon: 48.6, minZoom: 3, maxZoom: 7, size: "lg" },
  { name: "Persia", lat: 30.0, lon: 53.0, minZoom: 3, maxZoom: 7, size: "lg" },
  { name: "Arabia", lat: 25.0, lon: 42.0, minZoom: 3, maxZoom: 7, size: "lg" },
  { name: "Asia Minor", lat: 39.0, lon: 33.0, minZoom: 3, maxZoom: 5, size: "lg" },
  { name: "Italy", lat: 42.4, lon: 13.0, minZoom: 3, maxZoom: 7, size: "lg" },
  { name: "Canaan", lat: 31.8, lon: 35.0, minZoom: 4, maxZoom: 6, size: "md" },

  // Roman provinces and islands of Acts and the epistles
  { name: "Macedonia", lat: 40.9, lon: 22.5, minZoom: 5, maxZoom: 8, size: "md" },
  { name: "Achaia", lat: 38.0, lon: 22.0, minZoom: 5, maxZoom: 8, size: "md" },
  { name: "Asia", lat: 38.6, lon: 28.5, minZoom: 6, maxZoom: 8, size: "md" },
  { name: "Galatia", lat: 39.6, lon: 32.6, minZoom: 6, maxZoom: 8, size: "md" },
  { name: "Cappadocia", lat: 38.7, lon: 35.6, minZoom: 6, maxZoom: 8, size: "md" },
  { name: "Cilicia", lat: 37.1, lon: 34.9, minZoom: 6, maxZoom: 8, size: "md" },
  { name: "Cyprus", lat: 35.05, lon: 33.2, minZoom: 5, maxZoom: 9, size: "sm" },
  { name: "Crete", lat: 35.2, lon: 24.9, minZoom: 5, maxZoom: 9, size: "sm" },

  // Israel's neighbours
  { name: "Aram", lat: 34.4, lon: 37.4, minZoom: 5, maxZoom: 9, size: "md" },
  { name: "Phoenicia", lat: 34.0, lon: 35.85, minZoom: 6, maxZoom: 9, size: "sm" },
  { name: "Sinai", lat: 29.3, lon: 33.8, minZoom: 6, size: "md" },
  { name: "Midian", lat: 28.3, lon: 35.5, minZoom: 6, size: "md" },
  { name: "Galilee", lat: 32.85, lon: 35.3, minZoom: 7, size: "sm" },
  { name: "Samaria", lat: 32.25, lon: 35.2, minZoom: 7, size: "sm" },
  { name: "Judah", lat: 31.6, lon: 35.05, minZoom: 7, size: "sm" },
  { name: "Philistia", lat: 31.55, lon: 34.55, minZoom: 7, size: "sm" },
  { name: "Negev", lat: 30.85, lon: 34.8, minZoom: 7, size: "sm" },
  { name: "Bashan", lat: 32.85, lon: 36.1, minZoom: 7, size: "sm" },
  { name: "Gilead", lat: 32.3, lon: 35.8, minZoom: 7, size: "sm" },
  { name: "Ammon", lat: 31.9, lon: 36.25, minZoom: 7, size: "sm" },
  { name: "Moab", lat: 31.35, lon: 35.85, minZoom: 7, size: "sm" },
  { name: "Edom", lat: 30.6, lon: 35.55, minZoom: 7, size: "sm" },

  // Seas
  { name: "The Great Sea", lat: 34.0, lon: 28.0, minZoom: 3, maxZoom: 6, kind: "water", size: "lg" },
  { name: "Great Sea", lat: 32.6, lon: 34.1, minZoom: 7, kind: "water", size: "md" },
  { name: "Red Sea", lat: 22.0, lon: 38.4, minZoom: 4, maxZoom: 7, kind: "water", size: "md" },
  { name: "Persian Gulf", lat: 27.0, lon: 51.0, minZoom: 4, maxZoom: 7, kind: "water", size: "md" },
  { name: "Salt Sea", lat: 31.5, lon: 35.48, minZoom: 9, kind: "water", size: "sm" },
  { name: "Sea of Galilee", lat: 32.83, lon: 35.59, minZoom: 9, kind: "water", size: "sm" },
];
