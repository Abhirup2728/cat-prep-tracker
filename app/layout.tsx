import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavTabs from "@/components/NavTabs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CAT 2027 Tracker",
  description: "Daily discipline tracker for CAT 2027 prep",
  other: {
    "color-scheme": "light",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-900">
        <header className="sticky top-0 z-10 bg-white/60 backdrop-blur border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              CAT 2027 Tracker
            </h1>
            <NavTabs />
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}