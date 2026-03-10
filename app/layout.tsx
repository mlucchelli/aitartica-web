import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AITARTICA — Expedition Tracker",
  description: "Real-time Antarctic AI expedition tracking",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
