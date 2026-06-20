import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Harmony Garden & Estate",
  description: "The Garden of Joy & Tranquility Redefined",
  manifest: "/manifest.webmanifest",
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
        <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontSize: "0.875rem", borderRadius: "8px" },
            success: { iconTheme: { primary: "#1a7a3c", secondary: "#ffffff" } },
            error: { iconTheme: { primary: "#c41230", secondary: "#ffffff" } },
          }}
        />
      </body>
    </html>
  );
}
