import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LicitaPro — Gestão de Licitações",
  description: "Sistema local para cálculo de custos, preços e lucros em licitações."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}