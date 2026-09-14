"use client";

import { useEffect } from "react";

const parseBRL = (texto: string) => {
  const limpo = texto.replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const valor = Number(limpo);
  return Number.isFinite(valor) ? valor : 0;
};

const brl = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function BiddingItemTotalsEnhancer() {
  useEffect(() => {
    const atualizar = () => {
      const tabela = document.querySelector(".simpleItemsTable");
      if (!tabela) return;

      const cabecalho = tabela.querySelector("thead tr");
      if (cabecalho && cabecalho.children.length === 12) {
        const thEstimadoTotal = document.createElement("th");
        thEstimadoTotal.textContent = "ESTIMADO TOTAL";
        cabecalho.children[3]?.insertAdjacentElement("afterend", thEstimadoTotal);

        const thCustoTotal = document.createElement("th");
        thCustoTotal.textContent = "CUSTO TOTAL";
        cabecalho.children[5]?.insertAdjacentElement("afterend", thCustoTotal);
      }

      tabela.querySelectorAll("tbody tr").forEach((linha) => {
        const atual = linha.querySelectorAll("td");

        if (atual.length === 12) {
          const quantidade = Number((atual[2].textContent || "").replace(/[^0-9.,-]/g, "").replace(",", ".")) || 0;
          const estimadoUnitario = parseBRL(atual[3].textContent || "");
          const custoUnitario = parseBRL(atual[4].textContent || "");

          const estimadoTotal = document.createElement("td");
          estimadoTotal.className = "generatedEstimatedTotal";
          estimadoTotal.textContent = brl(quantidade * estimadoUnitario);
          atual[3].insertAdjacentElement("afterend", estimadoTotal);

          const depoisEstimado = linha.querySelectorAll("td");
          const custoTotal = document.createElement("td");
          custoTotal.className = "generatedCostTotal";
          custoTotal.textContent = brl(quantidade * custoUnitario);
          depoisEstimado[5].insertAdjacentElement("afterend", custoTotal);
        } else if (atual.length === 14) {
          const quantidade = Number((atual[2].textContent || "").replace(/[^0-9.,-]/g, "").replace(",", ".")) || 0;
          const estimadoUnitario = parseBRL(atual[3].textContent || "");
          const custoUnitario = parseBRL(atual[5].textContent || "");
          atual[4].textContent = brl(quantidade * estimadoUnitario);
          atual[6].textContent = brl(quantidade * custoUnitario);
        }
      });
    };

    atualizar();
    const timer = window.setInterval(atualizar, 300);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}
