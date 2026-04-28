import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";

export const metadata = {
  title: "ERP Contabil",
  description: "Sistema ERP contabil SaaS",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-br">
      <body style={{ fontFamily: "Arial, sans-serif", margin: 0 }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
