import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

// @TODO: this is what you'll need to edit
export const metadata: Metadata = {
  title: "Ask the Pickle Thumb",
  description: "Gardening advice from an AI fermented thumb",
  openGraph: {
    title: "Ask the Pickle Thumb",
    description: "Gardening advice from an AI fermented thumb",
    siteName: "Ask the Pickle Thumb",
    url: "https://ask-pickle-thumb-ff.vercel.app",
    images: {
      url: "https://ask-pickle-thumb-ff.vercel.app/og.png",
      width: 800,
      height: 600,
    },
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}
