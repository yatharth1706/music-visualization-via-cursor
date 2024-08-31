import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Music Visualizer",
  description: "Visualize your music with beautiful animations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="p-4 bg-gray-100">
          <Link href="/" className="mr-4">Home</Link>
          <Link href="/visualizer">Music Visualizer</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
