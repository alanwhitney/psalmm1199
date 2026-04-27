import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Psalm 119:9 — Bible Reader",
    short_name: "Psalm 119:9",
    description: "A clean, focused Bible reading app",
    start_url: "/bible/PSA/119",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0e0e10",
    theme_color: "#0e0e10",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
