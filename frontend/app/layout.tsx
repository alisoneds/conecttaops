import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ConecttaOps | Garagem 2 - JTU",
  description: "HUB de Inovação Operacional",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
