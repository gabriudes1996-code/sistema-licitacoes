import type { Metadata } from "next";
import "./globals.css";
import "./erp.css";
import "./bidding.css";
import "./bidding-description.css";
import "./bidding-minimum.css";
import "./agenda.css";
import BiddingDescriptionToggle from "./components/BiddingDescriptionToggle";
import BiddingMinimumValueEnhancer from "./components/BiddingMinimumValueEnhancer";

export const metadata: Metadata = {
  title: "LicitaPro ERP — Contratos Públicos",
  description: "ERP para gestão de licitações, execução de contratos e recebimentos de órgãos públicos."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <BiddingDescriptionToggle />
        <BiddingMinimumValueEnhancer />
        {children}
      </body>
    </html>
  );
}
