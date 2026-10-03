import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#0f1115",
    description:
      "VAL is a Virtual Architecture Layer for private communities, real-time voice rooms, and structured digital spaces.",
    display: "standalone",
    icons: [
      {
        src: "/brand/val-echo-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/val-echo-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/brand/val-echo-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    id: "/",
    name: "VAL",
    scope: "/",
    short_name: "VAL",
    start_url: "/dashboard",
    theme_color: "#0f1115",
  };
}
