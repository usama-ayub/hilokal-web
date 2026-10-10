import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hilokal Web - Live Audio Language Exchange",
  description: "Practice languages with native speakers in real-time audio rooms. 100% Free VIP, AI corrections, and conversation tables.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-950 text-surface-50 antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
