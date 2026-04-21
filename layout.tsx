import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Lora — beautiful serif for reading Bible text
import { Lora } from "next/font/google";
const lora = Lora({
  variable: "--font-reading",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Psalm 119:9 — Bible Reader",
  description:
    "A clean, focused Bible reading app. Read KJV and NKJV, keep bookmarks, and attach notes to any chapter.",
  keywords: ["Bible", "KJV", "NKJV", "Bible reader", "scripture"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} antialiased bg-surface text-text-primary min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
