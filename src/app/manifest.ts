import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Calendario Financiero Personal",
    short_name: "Calendario Finanzas",
    description:
      "Administrador Financiero Personal Mobile-First PWA (PRD v1.1.2 - Warm Editorial Ledger)",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F5F0",
    theme_color: "#34483D",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
