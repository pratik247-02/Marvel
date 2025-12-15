import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Marvel MCU Hub",
  description: "Your ultimate guide to the Marvel Cinematic Universe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
