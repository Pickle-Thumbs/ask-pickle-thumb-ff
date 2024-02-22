import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const alt = "Ask the Pickle Thumb";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function Image({ params }: { params: { text: string } }) {
  const decodedText = decodeURIComponent(params.text);
  // Assuming the text is JSON-encoded, parse the decoded text
  const response = JSON.parse(decodedText);
  const reply = JSON.parse(response);

  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 24,
          background: "#08A24B",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        {reply?.reply?.message?.[0] || "Failed to provide an answer"}
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}
