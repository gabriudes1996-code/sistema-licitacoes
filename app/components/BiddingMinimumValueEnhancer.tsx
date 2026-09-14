"use client";

import { useEffect } from "react";

const parseBRL = (texto: string) => {
  const limpo = texto.replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const valor = Number(limpo);
  return Number.isFinite(valor) ? valor : 0;
};

const brl = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function BiddingMinimumValueEnhancer() {
  useEffect(() => {
    const atualizar = () => {
      const tabela = document.querySelector(".simpleItemsTable");
      if (!tabela) return;

      const cabecalho = tabela.querySelector("thead th:nth-child(8)");
      if (cabecalho && cabecalho.textContent !== "VALOR MÍNIMO") cabecalho.textContent = "VALOR MÍNIMO";

      const linhas = tabela.querySelectorAll("tbody tr");
      linhas.forEach((linha) => {
        const colunas = linha.querySelectorAll("td");
        if (colunas.length < 10) return;

        const quantidade = Number((colunas[2].textContent || "").replace(/[^0-9.,-]/g, "").replace(",", ".")) || 0;
        const custo = parseBRL(colunas[4].textContent || "");
        const frete = parseBRL(colunas[5].textContent || "");

        let margem = 20;
        const meta = colunas[9].textContent?.match(/meta:\s*([0-9.,]+)/i);
        if (meta) {
          const valorMeta = Number(meta[1].replace(",", "."));
          if (Number.isFinite(valorMeta)) margem = valorMeta;
        }

        const custoRealUnitario = custo + (quantidade > 0 ? frete / quantidade : 0);
        const valorMinimo = custoRealUnitario * (1 + margem / 100);
        const alvo = colunas[7];

        let valor = alvo.querySelector<HTMLElement>(".minimumBidValue");
        if (!valor) {
          valor = document.createElement("strong");
          valor.className = "minimumBidValue";
          alvo.appendChild(valor);
        }
        valor.textContent = custoRealUnitario > 0 ? brl(valorMinimo) : "—";
        valor.title = `Custo + frete por unidade acrescido de ${margem.toFixed(0)}% de margem desejada`;
      });
    };

    atualizar();
    const timer = window.setInterval(atualizar, 500);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}
