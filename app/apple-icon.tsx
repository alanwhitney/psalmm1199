import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#0e0e10",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Left page */}
        <div
          style={{
            width: 54,
            height: 74,
            background: "#f0ede6",
            borderRadius: "6px 0 0 6px",
            display: "flex",
          }}
        />
        {/* Spine */}
        <div
          style={{
            width: 12,
            height: 82,
            background: "#8a6e2f",
            display: "flex",
          }}
        />
        {/* Right page with bookmark ribbon */}
        <div
          style={{
            width: 54,
            height: 74,
            background: "#f0ede6",
            borderRadius: "0 6px 6px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: 10,
          }}
        >
          <div
            style={{
              width: 8,
              height: 46,
              background: "#c9a84c",
              borderRadius: 2,
              display: "flex",
            }}
          />
        </div>
      </div>
    ),
    { width: 180, height: 180 }
  );
}
