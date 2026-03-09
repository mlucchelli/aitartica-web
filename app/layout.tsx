import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Antartia — Expedition Tracker",
  description: "Real-time Antarctic expedition tracking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
