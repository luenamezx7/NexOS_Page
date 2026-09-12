import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Silkscreen } from "next/font/google";
import "./globals.css";


const silkscreen = Silkscreen({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistMono.className} ${silkscreen.variable} antialiased bg-black text-white`}
      >
        {children}
      </body>
    </html>
  );
}

// 2. Instância da Geist Mono
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NexOS - Performance & Escala.",
  description: "NexOS",
};


