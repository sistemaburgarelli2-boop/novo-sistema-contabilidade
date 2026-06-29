import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "Fatturati Burgarelli",
  description: "Sistema de gestão contábil Fatturati Burgarelli",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-br" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
