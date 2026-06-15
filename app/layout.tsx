import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Burgarelli C.O",
  description: "Sistema de gestao contabil Burgarelli C.O",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  );
}
