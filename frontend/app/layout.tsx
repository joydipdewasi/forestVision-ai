import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "ForestVision AI | Rapid Geospatial Canopy Intelligence",
  description: "Detect individual tree crowns, measure canopy area coverage, and analyze high-resolution satellite forest imagery with deterministic computer vision.",
  keywords: ["Forestry AI", "Tree Crown Detection", "Canopy Coverage", "Satellite Analysis", "Remote Sensing", "Biomass Telemetry"],
  authors: [{ name: "ForestVision AI Core Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,300..900;1,300..900&family=Manrope:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#101412] text-[#e0e3df] min-h-screen antialiased selection:bg-[#68dba9] selection:text-[#003825]">
        {children}
      </body>
    </html>
  );
}
