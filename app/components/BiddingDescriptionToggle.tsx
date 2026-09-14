"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function BiddingDescriptionToggle() {
  const [descricao, setDescricao] = useState<string | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const cell = target.closest(
        ".simpleItemsTable tbody tr td:nth-child(2)"
      ) as HTMLElement | null;

      if (!cell) return;
      const texto = (cell.textContent || "").trim();
      if (texto) setDescricao(texto);
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDescricao(null);
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  if (!descricao) return null;

  return (
    <div className="descriptionModalOverlay" onClick={() => setDescricao(null)} role="presentation">
      <div className="descriptionModal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Descrição completa do item">
        <div className="descriptionModalHeader">
          <div>
            <span>DESCRIÇÃO DO ITEM</span>
            <h3>Descrição completa</h3>
          </div>
          <button type="button" onClick={() => setDescricao(null)} title="Fechar">
            <X size={20} />
          </button>
        </div>
        <div className="descriptionModalBody">{descricao}</div>
        <div className="descriptionModalFooter">
          <button type="button" onClick={() => setDescricao(null)}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
