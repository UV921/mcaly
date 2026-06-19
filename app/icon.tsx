import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1a1a",
          borderRadius: 8,
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            width="48"
            height="48"
            rx="14"
            fill="rgba(196,160,53,0.15)"
            stroke="rgba(196,160,53,0.35)"
            strokeWidth="1"
          />
          <path
            d="M11 32V16l6.5 8.5L24 16l6.5 8.5L37 16v16"
            stroke="#C4A035"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M30 28a6 6 0 1 1 0 12"
            stroke="#4A9EB0"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    ),
    { ...size }
  )
}
