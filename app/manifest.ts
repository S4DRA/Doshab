import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#060807",
    description: "Private encrypted chat, spaces, and live rooms.",
    display: "standalone",
    icons: [
      {
        src: "/doshab-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/doshab-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/doshab-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    id: "/",
    name: "Doshab",
    scope: "/",
    short_name: "Doshab",
    start_url: "/dashboard",
    theme_color: "#060807",
  };
}
