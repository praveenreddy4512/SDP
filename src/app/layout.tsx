import type { Metadata } from "next";
import 'bootstrap/dist/css/bootstrap.min.css';
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
// import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'APSRTC',
  description: 'Official ticket booking portal for APSRTC',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={`${GeistSans.className} antialiased`}>
        <SessionProvider>
          <Navbar />
          <ToastProvider>
            {children}
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
