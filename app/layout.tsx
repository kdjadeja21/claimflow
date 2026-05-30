import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ActiveEventDocumentTitle } from "@/components/providers/ActiveEventDocumentTitle";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { RouteLoader } from "@/components/providers/RouteLoader";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
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
  title: "ClaimFlow",
  description: "QR-based claim verification for event snacks, meals, and swag.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider>
          <AuthProvider>
            <ActiveEventDocumentTitle />
            <RouteLoader />
            {children}
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
