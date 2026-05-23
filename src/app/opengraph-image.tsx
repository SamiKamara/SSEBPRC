import { ImageResponse } from "next/og";

export const alt = "SSEBPRC - Space Engineers Blueprint Resource Calculator";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: "linear-gradient(135deg, #071016 0%, #0f172a 56%, #164e63 100%)",
          color: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Arial, Helvetica, sans-serif",
          height: "100%",
          justifyContent: "space-between",
          padding: 72,
          width: "100%",
        }}
      >
        <div style={{ color: "#67e8f9", fontSize: 34, fontWeight: 700, letterSpacing: 0 }}>
          SSEBPRC
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 78, fontWeight: 800, letterSpacing: 0, lineHeight: 1 }}>
            Space Engineers Blueprint Resource Calculator
          </div>
          <div style={{ color: "#cbd5e1", fontSize: 34, lineHeight: 1.35, maxWidth: 980 }}>
            Calculate blocks, components, and ingots from bp.sbc files or zipped blueprints.
          </div>
        </div>
        <div style={{ color: "#bae6fd", fontSize: 28 }}>ssebprc.vercel.app</div>
      </div>
    ),
    size,
  );
}
