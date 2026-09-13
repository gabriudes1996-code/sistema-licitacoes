"use client";

import { useRef, useState } from "react";

import {
  Upload,
  FileText,
  X,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";

type ItemImportado = {
  numero: number;
  descricao: string;
  quantidade: number;
  valorEstimado: number;
  valorTotalEstimado: number;
};

type ImportarItensPDFProps = {
  onImportar: (
    itens: ItemImportado[]
  ) => void;

  onFechar: () => void;
};

export default function ImportarItensPDF({
  onImportar,
  onFechar,
}: ImportarItensPDFProps) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const [arquivo, setArquivo] =
    useState<File | null>(null);

  const [itens, setItens] =
    useState<ItemImportado[]>([]);

  const [carregando, setCarregando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const extrairItens = async (
    file: File
  ) => {
    setCarregando(true);
    setErro("");
    setItens([]);
    setArquivo(file);

    try {
      const formData = new FormData();

      formData.append(
        "arquivo",
        file
      );

      const resposta = await fetch(
        "/api/extrair-pdf",
        {
          method: "POST",
          body: formData,
        }
      );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
            "Não foi possível processar o PDF."
        );
      }

      if (
        !dados.itens ||
        !Array.isArray(dados.itens) ||
        dados.itens.length === 0
      ) {
        throw new Error(
          "Nenhum item foi encontrado no PDF."
        );
      }

      setItens(dados.itens);
    } catch (error) {
      console.error(
        "Erro ao importar PDF:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível ler o PDF."
      );

      setArquivo(null);
    } finally {
      setCarregando(false);
    }
  };

  const selecionarArquivo = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      file.type !== "application/pdf" &&
      !file.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      setErro(
        "Selecione um arquivo PDF."
      );

      return;
    }

    extrairItens(file);
  };

  const abrirSeletor = () => {
    inputRef.current?.click();
  };

  const confirmarImportacao = () => {
    if (itens.length === 0) return;

    onImportar(itens);
  };

  const formatarMoeda = (
    valor: number
  ) => {
    return valor.toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );
  };

  return (
    <div className="pdfModalOverlay">
      <div className="pdfModal">
        <div className="pdfModalHeader">
          <div>
            <h2>
              Importar itens do PDF
            </h2>

            <p>
              Selecione a tabela de itens
              da licitação.
            </p>
          </div>

          <button
            type="button"
            className="pdfCloseButton"
            onClick={onFechar}
          >
            <X size={20} />
          </button>
        </div>

        <div className="pdfModalBody">
          {!arquivo &&
            !carregando && (
              <div
                className="pdfUploadArea"
                onClick={abrirSeletor}
              >
                <div className="pdfUploadIcon">
                  <Upload size={30} />
                </div>

                <h3>
                  Selecionar tabela em PDF
                </h3>

                <p>
                  Escolha o PDF que contém
                  os itens e valores
                  estimados da licitação.
                </p>

                <button
                  type="button"
                  className="primaryButton"
                  onClick={(event) => {
                    event.stopPropagation();
                    abrirSeletor();
                  }}
                >
                  <FileText size={17} />

                  Selecionar PDF
                </button>

                <span>
                  Somente arquivos PDF
                </span>
              </div>
            )}

          {carregando && (
            <div className="pdfLoading">
              <Loader2
                size={38}
                className="spin"
              />

              <h3>
                Lendo o PDF...
              </h3>

              <p>
                Identificando os itens,
                quantidades e valores
                estimados.
              </p>
            </div>
          )}

          {erro &&
            !carregando && (
              <div className="pdfError">
                <AlertCircle
                  size={22}
                />

                <div>
                  <strong>
                    Não foi possível
                    importar
                  </strong>

                  <p>{erro}</p>
                </div>
              </div>
            )}

          {arquivo &&
            !carregando &&
            itens.length > 0 && (
              <>
                <div className="pdfSuccess">
                  <div>
                    <Check size={20} />

                    <div>
                      <strong>
                        PDF processado
                      </strong>

                      <span>
                        {arquivo.name}
                      </span>
                    </div>
                  </div>

                  <strong>
                    {itens.length}{" "}
                    {itens.length === 1
                      ? "item encontrado"
                      : "itens encontrados"}
                  </strong>
                </div>

                <div className="pdfPreview">
                  <div className="pdfPreviewHeader">
                    <strong>
                      Conferência dos itens
                    </strong>

                    <span>
                      Confira antes de
                      importar.
                    </span>
                  </div>

                  <div className="pdfTableWrapper">
                    <table className="pdfTable">
                      <thead>
                        <tr>
                          <th>
                            ITEM
                          </th>

                          <th>
                            DESCRIÇÃO
                          </th>

                          <th>
                            QTD.
                          </th>

                          <th>
                            VALOR ESTIMADO
                          </th>

                          <th>
                            TOTAL ESTIMADO
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {itens.map(
                          (item) => (
                            <tr
                              key={
                                item.numero
                              }
                            >
                              <td>
                                <strong>
                                  {String(
                                    item.numero
                                  ).padStart(
                                    4,
                                    "0"
                                  )}
                                </strong>
                              </td>

                              <td>
                                {
                                  item.descricao
                                }
                              </td>

                              <td>
                                {
                                  item.quantidade
                                }
                              </td>

                              <td>
                                {formatarMoeda(
                                  item.valorEstimado
                                )}
                              </td>

                              <td>
                                {formatarMoeda(
                                  item.valorTotalEstimado
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
        </div>

        <div className="pdfModalFooter">
          <button
            type="button"
            className="secondaryButton"
            onClick={onFechar}
          >
            Cancelar
          </button>

          {itens.length > 0 && (
            <button
              type="button"
              className="primaryButton"
              onClick={
                confirmarImportacao
              }
            >
              <Check size={17} />

              Importar{" "}
              {itens.length}{" "}
              {itens.length === 1
                ? "item"
                : "itens"}
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={
            selecionarArquivo
          }
          style={{
            display: "none",
          }}
        />
      </div>
    </div>
  );
}