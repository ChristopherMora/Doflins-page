import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DOFLINS | Colección Oficial",
    short_name: "DOFLINS",
    description: "Colecciona y explora figuras DOFLINS: Animals y Multiverse.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f2df",
    theme_color: "#4e6f2a",
    icons: [],
  };
}
