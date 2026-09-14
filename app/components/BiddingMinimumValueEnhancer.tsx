"use client";

import { useEffect } from "react";

const parseBRL = (texto: string) => {
  const limpo = texto.replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const valor = Number(limpo);
  return Number.isFinite(valor) ? valor : 0;
};

const brl = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (valor: number) => `${valor.toFixed(2)}%`;

export default function BiddingMinimumValueEnhancer() {
  useEffect(() => {
    const atualizar = () => {
      const tabela = document.querySelector(".simpleItemsTable");
      if (!tabela) return;

      const cabecalhoMinimo = tabela.querySelector("thead th:nth-child(8)");
      if (cabecalhoMinimo && cabecalhoMinimo.textContent !== "VALOR MÍNIMO") cabecalhoMinimo.textContent = "VALOR MÍNIMO";

      const cabecalhoMargem = tabela.querySelector("thead th:nth-child(10)");
      if (cabecalhoMargem && cabecalhoMargem.textContent !== "MARGEM DE LUCRO") cabecalhoMargem.textContent = "MARGEM DE LUCRO";

      const linhas = tabela.querySelectorAll("tbody tr");
      linhas.forEach((linha) => {
        const colunas = linha.querySelectorAll("td");
        if (colunas.length < 10) return;

        const quantidade = Number((colunas[2].textContent || "").replace(/[^0-9.,-]/g, "").replace(",", ".")) || 0;
        const custo = parseBRL(colunas[4].textContent || "");
        const frete = parseBRL(colunas[5].textContent || "");
        const lanceInput = colunas[6].querySelector<HTMLInputElement>("input");
        const lance = Number(lanceInput?.value || 0) || 0;

        let margemDesejada = 20;
        const meta = colunas[9].textContent?.match(/meta:\s*([0-9.,]+)/i);
        if (meta) {
          const valorMeta = Number(meta[1].replace(",", "."));
          if (Number.isFinite(valorMeta)) margemDesejada = valorMeta;
        }

        const custoRealUnitario = custo + (quantidade > 0 ? frete / quantidade : 0);
        const valorMinimo = custoRealUnitario * (1 + margemDesejada / 100);
        const alvoMinimo = colunas[7];

        let valor = alvoMinimo.querySelector<HTMLElement>(".minimumBidValue");
        if (!valor) {
          valor = document.createElement("strong");
          valor.className = "minimumBidValue";
          alvoMinimo.appendChild(valor);
        }
        valor.textContent = custoRealUnitario > 0 ? brl(valorMinimo) : "—";
        valor.title = `Custo + frete por unidade acrescido de ${margemDesejada.toFixed(0)}% de margem desejada`;

        const margemLucro = custoRealUnitario > 0 && lance > 0
          ? ((lance - custoRealUnitario) / custoRealUnitario) * 100
          : 0;

        const margemStrong = colunas[9].querySelector<HTMLElement>("strong");
        if (margemStrong) {
          margemStrong.textContent = lance > 0 && custoRealUnitario > 0 ? pct(margemLucro) : "—";
          margemStrong.className = margemLucro >= margemDesejada
            ? "profitPositive"
            : margemLucro >= 0
              ? "marginWarning"
              : "profitNegative";
          margemStrong.title = "Margem de lucro calculada sobre o custo real do item";
        }
      });
    };

    atualizar();
    const timer = window.setInterval(atualizar, 300);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}
