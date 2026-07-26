import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Warrior Apocalypse",
  description:
    "An unofficial fan-made survival game inspired by the world of the Warriors books. Survive the infection.",
};

export const viewport: Viewport = {
  themeColor: "#0c0f14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
