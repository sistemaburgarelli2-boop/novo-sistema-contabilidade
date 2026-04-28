import type { ReactNode } from "react";

export const metadata = {
  title: "ERP Contabil",
  description: "Sistema ERP contabil SaaS",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-br">
      <body style={{ fontFamily: "Arial, sans-serif", margin: 0 }}>{children}</body>
    </html>
  );
}
