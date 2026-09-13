"use client";

import { useMemo, useState } from "react";
import { Check, ClipboardPaste, FileText, X } from "lucide-react";

type ItemImportado = {
  numero: number;
  descricao: string;
  quantidade: number;
  valorEstimado: number;
  valorTotalEstimado: number;
};

type Props = {
  onImportar: (itens: ItemImportado[]) => void;
  onFechar: () => void;
};

function moedaParaNumero(valor: string): number {
  const limpo = valor
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .trim();

  if (!limpo) return 0;

  // Formato brasileiro: 1.234,56
  if (limpo.includes(",")) {
    const normalizado = limpo.replace(/\./g, "").replace(",", ".");
    const n = Number(normalizado);
    return Number.isFinite(n) ? n : 0;
  }

  const n = Number(limpo);
  return Number.isFinite(n) ? n : 0;
}

function limparDescricao(texto: string) {
  return texto
    .replace(/^(descri(?:ç|c)[aã]o(?:\s+do\s+(?:item|produto|pneu))?)\s*[:\-]?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extrairNumeroRotulado(bloco: string, rotulos: string[]): string | null {
  for (const rotulo of rotulos) {
    const regex = new RegExp(`${rotulo}\\s*[:\\-]?\\s*(?:R\\$\\s*)?([\\d.]+(?:,\\d+)?)`, "i");
    const match = bloco.match(regex);
    if (match?.[1]) return match[1];
  }
  return null;
}

function parseBlocoRotulado(bloco: string): ItemImportado | null {
  const itemMatch = bloco.match(/(?:^|\n)\s*(?:item|n[º°o]?\s*(?:do\s*)?item)?\s*[:\-]?\s*(\d{1,8})\s*(?:\n|$)/i);
  if (!itemMatch) return null;

  const numero = Number(itemMatch[1]);
  if (!numero) return null;

  const qtdRaw = extrairNumeroRotulado(bloco, ["quantidade", "qtd\\.?", "qtde\\.?"]);
  const unitRaw = extrairNumeroRotulado(bloco, ["valor\\s+unit[aá]rio", "vlr\\.?\\s*unit\\.?", "unit[aá]rio"]);
  const totalRaw = extrairNumeroRotulado(bloco, ["valor\\s+total", "vlr\\.?\\s*total", "total"]);

  const quantidade = qtdRaw ? moedaParaNumero(qtdRaw) : 0;
  const valorEstimado = unitRaw ? moedaParaNumero(unitRaw) : 0;
  let valorTotalEstimado = totalRaw ? moedaParaNumero(totalRaw) : 0;

  let descricao = "";
  const linhas = bloco.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const descricaoIndex = linhas.findIndex((linha) => /^(descri(?:ç|c)[aã]o)/i.test(linha));

  if (descricaoIndex >= 0) {
    const partes: string[] = [limparDescricao(linhas[descricaoIndex])];
    for (let i = descricaoIndex + 1; i < linhas.length; i++) {
      if (/^(quantidade|qtd\.?|qtde\.?|valor\s+unit|vlr\.?\s*unit|unit[aá]rio|valor\s+total|vlr\.?\s*total|total)\b/i.test(linhas[i])) break;
      partes.push(linhas[i]);
    }
    descricao = partes.join(" ").trim();
  } else {
    descricao = linhas
      .filter((linha) => !/^\s*(?:item|n[º°o]?\s*(?:do\s*)?item)?\s*[:\-]?\s*\d{1,8}\s*$/i.test(linha))
      .filter((linha) => !/^(quantidade|qtd\.?|qtde\.?|valor\s+unit|vlr\.?\s*unit|unit[aá]rio|valor\s+total|vlr\.?\s*total|total)\b/i.test(linha))
      .join(" ")
      .trim();
  }

  if (!quantidade || !valorEstimado || !descricao) return null;
  if (!valorTotalEstimado) valorTotalEstimado = quantidade * valorEstimado;

  return { numero, descricao, quantidade, valorEstimado, valorTotalEstimado };
}

function parseLinhaSeparada(linha: string): ItemImportado | null {
  const separador = linha.includes("|") ? "|" : linha.includes("\t") ? "\t" : null;
  if (!separador) return null;

  const partes = linha.split(separador).map((p) => p.trim()).filter(Boolean);
  if (partes.length < 4) return null;

  const numero = Number(partes[0].replace(/\D/g, ""));
  if (!numero) return null;

  // Formato preferencial: item | descrição | quantidade | unitário | total
  const descricao = partes[1];
  const quantidade = moedaParaNumero(partes[2].replace(/\b(?:UN|UND|UNID|UNIDADE|PC|PÇ|PÇS)\b/gi, ""));
  const valorEstimado = moedaParaNumero(partes[3]);
  const valorTotalEstimado = partes[4]
    ? moedaParaNumero(partes[4])
    : quantidade * valorEstimado;

  if (!descricao || !quantidade || !valorEstimado) return null;
  return { numero, descricao, quantidade, valorEstimado, valorTotalEstimado };
}

function parseTextoBruto(texto: string): ItemImportado[] {
  const linhas = texto.replace(/\r/g, "").split("\n");
  const itens: ItemImportado[] = [];

  // Primeiro tenta linhas separadas por | ou TAB.
  for (const linha of linhas) {
    const item = parseLinhaSeparada(linha.trim());
    if (item) itens.push(item);
  }
  if (itens.length > 0) return itens;

  // Divide por início de ITEM / número isolado. Mantém o marcador no bloco.
  const blocos = texto
    .replace(/\r/g, "")
    .split(/(?=^\s*(?:ITEM\s*[:\-]?\s*)?\d{1,8}\s*$)/gim)
    .map((b) => b.trim())
    .filter(Boolean);

  for (const bloco of blocos) {
    const item = parseBlocoRotulado(bloco);
    if (item) itens.push(item);
  }

  // Fallback específico para texto copiado de tabelas: número em uma linha,
  // descrição nas seguintes e "QTD UN R$ unit R$ total" no fim.
  if (itens.length === 0) {
    const textoNormal = texto.replace(/\r/g, "");
    const regex = /(?:^|\n)\s*(\d{1,8})\s*\n([\s\S]*?)(?=\n\s*\d{1,8}\s*\n|$)/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(textoNormal))) {
      const numero = Number(match[1]);
      const corpo = match[2].trim();
      const valores = corpo.match(/(\d+(?:[.,]\d+)?)\s*(?:UN|UND|UNID|UNIDADE|PC|PÇ|PÇS)?\s+R\$\s*([\d.]+,\d{2})\s+R\$\s*([\d.]+,\d{2})/i);
      if (!valores) continue;

      const quantidade = moedaParaNumero(valores[1]);
      const valorEstimado = moedaParaNumero(valores[2]);
      const valorTotalEstimado = moedaParaNumero(valores[3]);
      const descricao = corpo.replace(valores[0], "").replace(/\s+/g, " ").trim();

      if (numero && descricao && quantidade && valorEstimado) {
        itens.push({ numero, descricao, quantidade, valorEstimado, valorTotalEstimado });
      }
    }
  }

  // Remove duplicatas pelo número do item.
  return itens.filter((item, index, lista) => lista.findIndex((x) => x.numero === item.numero) === index);
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ImportarItensTexto({ onImportar, onFechar }: Props) {
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [itens, setItens] = useState<ItemImportado[]>([]);

  const total = useMemo(
    () => itens.reduce((soma, item) => soma + item.valorTotalEstimado, 0),
    [itens]
  );

  const identificar = () => {
    setErro("");
    const encontrados = parseTextoBruto(texto);
    if (encontrados.length === 0) {
      setItens([]);
      setErro("Não consegui identificar os itens. Use o modelo abaixo ou cole uma tabela com item, descrição, quantidade, valor unitário e valor total.");
      return;
    }
    setItens(encontrados);
  };

  return (
    <div className="pdfModalOverlay">
      <div className="pdfModal textImportModal">
        <div className="pdfModalHeader">
          <div>
            <h2>Importar itens por texto</h2>
            <p>Cole os itens da licitação e confira antes de importar.</p>
          </div>
          <button type="button" className="pdfCloseButton" onClick={onFechar} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="pdfModalBody">
          <div className="textImportHint">
            <FileText size={18} />
            <div>
              <strong>Formato recomendado</strong>
              <span>ITEM, DESCRIÇÃO, QUANTIDADE, VALOR UNITÁRIO e VALOR TOTAL. Também aceita colunas separadas por | ou TAB.</span>
            </div>
          </div>

          <textarea
            className="textImportArea"
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            placeholder={`ITEM 0006\nDESCRIÇÃO: Pneu 215/65 R16, novo, primeira vida...\nQUANTIDADE: 8\nVALOR UNITÁRIO: R$ 1.030,00\nVALOR TOTAL: R$ 8.240,00\n\nITEM 0007\nDESCRIÇÃO: Pneu 235/70 R16...\nQUANTIDADE: 12\nVALOR UNITÁRIO: R$ 1.259,00\nVALOR TOTAL: R$ 15.108,00`}
          />

          {erro && <div className="pdfError">{erro}</div>}

          <div className="textImportActions">
            <button type="button" className="secondaryButton" onClick={() => { setTexto(""); setItens([]); setErro(""); }}>
              Limpar
            </button>
            <button type="button" className="primaryButton" onClick={identificar} disabled={!texto.trim()}>
              <ClipboardPaste size={17} />
              Identificar itens
            </button>
          </div>

          {itens.length > 0 && (
            <div className="pdfPreview">
              <div className="pdfPreviewHeader">
                <div>
                  <h3>{itens.length} item(ns) identificado(s)</h3>
                  <p>Total estimado: {formatarMoeda(total)}</p>
                </div>
                <div className="pdfSuccess"><Check size={16} /> Pronto para importar</div>
              </div>

              <div className="pdfTableWrap">
                <table className="pdfTable">
                  <thead>
                    <tr><th>Item</th><th>Descrição</th><th>Qtd.</th><th>Unitário</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    {itens.map((item) => (
                      <tr key={`${item.numero}-${item.descricao}`}>
                        <td>{String(item.numero).padStart(4, "0")}</td>
                        <td>{item.descricao}</td>
                        <td>{item.quantidade}</td>
                        <td>{formatarMoeda(item.valorEstimado)}</td>
                        <td>{formatarMoeda(item.valorTotalEstimado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="pdfModalFooter">
          <button type="button" className="secondaryButton" onClick={onFechar}>Cancelar</button>
          <button type="button" className="primaryButton" disabled={itens.length === 0} onClick={() => onImportar(itens)}>
            <Check size={17} /> Importar {itens.length || ""} item(ns)
          </button>
        </div>
      </div>
    </div>
  );
}
