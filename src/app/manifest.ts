import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SSEBPRC - Space Engineers Blueprint Resource Calculator",
    short_name: "SSEBPRC",
    description:
      "Calculate Space Engineers blueprint block, component, and ingot requirements from bp.sbc files or zipped blueprints.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#071016",
    theme_color: "#0891b2",
    categories: ["utilities", "productivity"],
  };
}
