export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body style={{ fontFamily: "sans-serif", padding: 20 }}>
        <h1>ERP Contábil</h1>
        {children}
      </body>
    </html>
  );
}