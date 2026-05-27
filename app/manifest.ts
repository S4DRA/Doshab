import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#060807",
    description: "Private encrypted chat, groups, and live rooms.",
    display: "standalone",
    icons: [
      {
        src: "/Doshab_png.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/Doshab_png.png",
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
