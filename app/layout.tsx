import type { Metadata } from "next";
import { Lora, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

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
        className={`${inter.variable} ${lora.variable} antialiased bg-surface text-ink-primary min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
