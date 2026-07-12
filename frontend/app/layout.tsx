import type { Metadata } from "next";
import { Sora, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-display", weight: ["600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "GrowEasy · AI CSV Lead Importer",
  description: "Upload any CSV export and let AI map it into the GrowEasy CRM lead format.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable} ${mono.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
