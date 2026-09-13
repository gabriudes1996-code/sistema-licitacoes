"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Edit3,
  Plus,
  Save,
  Trash2,
  X,
  Trophy,
  XCircle,
  FileText,
  ClipboardPaste,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import ImportarItensPDF from "./ImportarItensPDF";
import ImportarItensTexto from "./ImportarItensTexto";

type Licitacao = {
  id: number;
  orgao: string;
  edital: string;
  modalidade: string;
  data: string;
  status: string;
  observacoes: string;
  valorEstimado: number;
};

type ResultadoItem =
  | "em_disputa"
  | "ganhou"
  | "perdeu";

type ItemLicitacao = {
  id: number;
  numero: number;
  descricao: string;
  quantidade: number;

  valorEstimado: number;
  custo: number;
  frete: number;
  margemDesejada: number;

  lanceAtual: number;

  resultado: ResultadoItem;
};

type Props = {
  licitacao: Licitacao;
  onVoltar: () => void;
};

const STORAGE_PREFIX = "licitapro_itens_";

const novoItem = (
  numero = 1
): ItemLicitacao => ({
  id: Date.now(),
  numero,
  descricao: "",
  quantidade: 1,
  valorEstimado: 0,
  custo: 0,
  frete: 0,
  margemDesejada: 20,
  lanceAtual: 0,
  resultado: "em_disputa",
});

function moeda(valor: number) {
  return Number(valor || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

function numero(valor: string | number) {
  const n = Number(valor);

  return Number.isFinite(n)
    ? n
    : 0;
}

function percentual(valor: number) {
  return `${Number(valor || 0).toFixed(2)}%`;
}

export default function DetalhesLicitacao({
  licitacao,
  onVoltar,
}: Props) {
  /*
   * =====================================================
   * ESTADOS
   * =====================================================
   */

  const [mostrarImportarPDF, setMostrarImportarPDF] =
    useState(false);

  const [mostrarImportarTexto, setMostrarImportarTexto] =
    useState(false);

  const [formMinimizado, setFormMinimizado] =
    useState(false);

  const storageKey =
    `${STORAGE_PREFIX}${licitacao.id}`;

  const [itens, setItens] =
    useState<ItemLicitacao[]>([]);

  const [editando, setEditando] =
    useState<number | null>(null);

  const [form, setForm] =
    useState<ItemLicitacao>(
      novoItem()
    );

  const [mensagem, setMensagem] =
    useState("");

  /*
   * =====================================================
   * CARREGAR ITENS
   * =====================================================
   */

  useEffect(() => {
    try {
      const dados =
        localStorage.getItem(
          storageKey
        );

      if (!dados) {
        setItens([]);
        return;
      }

      const itensSalvos =
        JSON.parse(dados);

      if (
        Array.isArray(
          itensSalvos
        )
      ) {
        const convertidos =
          itensSalvos.map(
            (
              item: any,
              index: number
            ) => ({
              id:
                item.id ??
                Date.now() +
                  index,

              numero:
                numero(
                  item.numero
                ) ||
                index + 1,

              descricao:
                item.descricao ??
                "",

              quantidade:
                numero(
                  item.quantidade
                ) || 1,

              valorEstimado:
                numero(
                  item.valorEstimado ??
                    item.valorEstimadoUnitario
                ),

              custo:
                numero(
                  item.custo ??
                    item.custoUnitario
                ),

              frete:
                numero(
                  item.frete
                ),

              margemDesejada:
                numero(
                  item.margemDesejada
                ) || 20,

              lanceAtual:
                numero(
                  item.lanceAtual ??
                    item.valorLicitacao ??
                    item.valor
                ),

              resultado:
                item.resultado ??
                "em_disputa",
            })
          );

        setItens(
          convertidos
        );
      }
    } catch (error) {
      console.error(
        "Erro ao carregar itens:",
        error
      );
    }
  }, [storageKey]);

  /*
   * =====================================================
   * SALVAR ITENS
   * =====================================================
   */

  const salvarItens = (
    novaLista: ItemLicitacao[],
    mostrarMensagem = true
  ) => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(
          novaLista
        )
      );

      setItens(
        novaLista
      );

      if (
        mostrarMensagem
      ) {
        setMensagem(
          "Salvo com sucesso!"
        );

        setTimeout(() => {
          setMensagem("");
        }, 2000);
      }
    } catch (error) {
      console.error(
        "Erro ao salvar:",
        error
      );

      alert(
        "Não foi possível salvar os dados."
      );
    }
  };

  /*
   * =====================================================
   * ALTERAR CAMPO DO FORMULÁRIO
   * =====================================================
   */

  const alterarCampo = (
    campo: keyof ItemLicitacao,
    valor: string
  ) => {
    setForm(
      (anterior) => ({
        ...anterior,

        [campo]:
          campo ===
          "descricao"
            ? valor
            : numero(valor),
      })
    );
  };

  /*
   * =====================================================
   * NOVO ITEM
   * =====================================================
   */

  const adicionarNovoItem =
    () => {
      const proximoNumero =
        itens.length > 0
          ? Math.max(
              ...itens.map(
                (item) =>
                  item.numero
              )
            ) + 1
          : 1;

      setForm(
        novoItem(
          proximoNumero
        )
      );

      setEditando(null);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  /*
   * =====================================================
   * EDITAR ITEM
   * =====================================================
   */

  const editarItem = (
    item: ItemLicitacao
  ) => {
    setForm({
      ...item,
    });

    setEditando(
      item.id
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * =====================================================
   * SALVAR FORMULÁRIO
   * =====================================================
   */

  const salvarFormulario =
    () => {
      if (
        !form.descricao.trim()
      ) {
        alert(
          "Informe a descrição do item."
        );

        return;
      }

      if (
        form.quantidade <= 0
      ) {
        alert(
          "Informe uma quantidade válida."
        );

        return;
      }

      if (
        form.valorEstimado <
        0
      ) {
        alert(
          "Informe um valor estimado válido."
        );

        return;
      }

      if (
        form.custo < 0
      ) {
        alert(
          "Informe um custo válido."
        );

        return;
      }

      if (
        form.frete < 0
      ) {
        alert(
          "Informe um frete válido."
        );

        return;
      }

      if (
        editando !== null
      ) {
        const novaLista =
          itens.map(
            (item) =>
              item.id ===
              editando
                ? {
                    ...form,
                    id: editando,
                  }
                : item
          );

        salvarItens(
          novaLista
        );
      } else {
        const novo: ItemLicitacao =
          {
            ...form,
            id: Date.now(),
          };

        salvarItens([
          ...itens,
          novo,
        ]);
      }

      setForm(
        novoItem()
      );

      setEditando(null);
    };

  /*
   * =====================================================
   * CANCELAR EDIÇÃO
   * =====================================================
   */

  const cancelarEdicao =
    () => {
      const proximoNumero =
        itens.length > 0
          ? Math.max(
              ...itens.map(
                (item) =>
                  item.numero
              )
            ) + 1
          : 1;

      setForm(
        novoItem(
          proximoNumero
        )
      );

      setEditando(null);
    };

  /*
   * =====================================================
   * EXCLUIR
   * =====================================================
   */

  const excluirItem = (
    id: number
  ) => {
    const confirmar =
      window.confirm(
        "Deseja realmente excluir este item?"
      );

    if (!confirmar) {
      return;
    }

    const novaLista =
      itens.filter(
        (item) =>
          item.id !== id
      );

    salvarItens(
      novaLista
    );

    if (
      editando === id
    ) {
      cancelarEdicao();
    }
  };

  /*
   * =====================================================
   * DUPLICAR
   * =====================================================
   */

  const duplicarItem = (
    item: ItemLicitacao
  ) => {
    const proximoNumero =
      itens.length > 0
        ? Math.max(
            ...itens.map(
              (item) =>
                item.numero
            )
          ) + 1
        : 1;

    const copia: ItemLicitacao =
      {
        ...item,

        id: Date.now(),

        numero:
          proximoNumero,

        lanceAtual: 0,

        resultado:
          "em_disputa",
      };

    salvarItens([
      ...itens,
      copia,
    ]);
  };

  /*
   * =====================================================
   * ALTERAR LANCE
   * =====================================================
   */

  const alterarLance = (
    id: number,
    valor: string
  ) => {
    const lance =
      numero(valor);

    const novaLista: ItemLicitacao[] =
      itens.map(
        (item) =>
          item.id === id
            ? {
                ...item,
                lanceAtual:
                  lance,
              }
            : item
      );

    setItens(
      novaLista
    );

    /*
     * Salva automaticamente
     * o lance digitado.
     */

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(
          novaLista
        )
      );
    } catch (error) {
      console.error(
        "Erro ao salvar lance:",
        error
      );
    }
  };

  /*
   * =====================================================
   * IMPORTAR ITENS DO PDF
   * =====================================================
   */

  const importarItens = (
    itensImportados: {
      numero: number;
      descricao: string;
      quantidade: number;
      valorEstimado: number;
      valorTotalEstimado: number;
    }[]
  ) => {
    const novosItens =
      itensImportados.map(
        (item, index) => ({
          id:
            Date.now() +
            index,

          numero:
            item.numero,

          descricao:
            item.descricao,

          quantidade:
            item.quantidade,

          valorEstimado:
            item.valorEstimado,

          custo: 0,

          frete: 0,

          margemDesejada: 20,

          lanceAtual: 0,

          resultado:
            "em_disputa" as const,
        })
      );

    const listaAtualizada = [
      ...itens,
      ...novosItens,
    ];

    salvarItens(
      listaAtualizada
    );

    setMostrarImportarPDF(false);
    setMostrarImportarTexto(false);
  };

  /*
   * =====================================================
   * MARCAR COMO GANHOU
   * =====================================================
   */

  const marcarGanhou = (
    id: number
  ) => {
    const item =
      itens.find(
        (item) =>
          item.id === id
      );

    if (!item) {
      return;
    }

    if (
      item.lanceAtual <= 0
    ) {
      alert(
        "Informe o valor do lance antes de marcar o item como ganho."
      );

      return;
    }

    const confirmar =
      window.confirm(
        `Confirmar que você GANHOU o item ${item.numero} por ${moeda(
          item.lanceAtual
        )} por unidade?`
      );

    if (!confirmar) {
      return;
    }

    const novaLista: ItemLicitacao[] =
      itens.map(
        (item) =>
          item.id === id
            ? {
                ...item,
                resultado:
                  "ganhou",
              }
            : item
      );

    salvarItens(
      novaLista
    );
  };

  /*
   * =====================================================
   * MARCAR COMO PERDEU
   * =====================================================
   */

  const marcarPerdeu = (
    id: number
  ) => {
    const item =
      itens.find(
        (item) =>
          item.id === id
      );

    if (!item) {
      return;
    }

    if (
      item.lanceAtual <= 0
    ) {
      alert(
        "Informe o valor do lance antes de marcar o item como perdido."
      );

      return;
    }

    const confirmar =
      window.confirm(
        `Confirmar que você PERDEU o item ${item.numero}? O último lance registrado foi ${moeda(
          item.lanceAtual
        )} por unidade.`
      );

    if (!confirmar) {
      return;
    }

    const novaLista: ItemLicitacao[] =
      itens.map(
        (item) =>
          item.id === id
            ? {
                ...item,
                resultado:
                  "perdeu",
              }
            : item
      );

    salvarItens(
      novaLista
    );
  };

  /*
   * =====================================================
   * VOLTAR PARA EM DISPUTA
   * =====================================================
   */

  const voltarParaDisputa =
    (id: number) => {
      const novaLista: ItemLicitacao[] =
        itens.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  resultado:
                    "em_disputa",
                }
              : item
        );

      salvarItens(
        novaLista
      );
    };

  /*
   * =====================================================
   * CÁLCULOS
   * =====================================================
   */

  const calculos =
    useMemo(() => {
      let valorEstimadoTotal =
        0;

      let custoProdutosTotal =
        0;

      let freteTotal = 0;

      let lanceTotal = 0;

      let lucro = 0;

      let valorGanho = 0;

      let valorPerdido = 0;

      let itensGanhos = 0;

      let itensPerdidos = 0;

      itens.forEach(
        (item) => {
          const quantidade =
            numero(
              item.quantidade
            );

          const estimado =
            numero(
              item.valorEstimado
            );

          const custo =
            numero(
              item.custo
            );

          const frete =
            numero(
              item.frete
            );

          const lance =
            numero(
              item.lanceAtual
            );

          valorEstimadoTotal +=
            quantidade *
            estimado;

          custoProdutosTotal +=
            quantidade *
            custo;

          freteTotal +=
            frete;

          const lanceItemTotal =
            quantidade *
            lance;

          /*
           * LANCE ATUAL
           */

          if (
            lance > 0
          ) {
            lanceTotal +=
              lanceItemTotal;

            const custoTotalItem =
              quantidade *
                custo +
              frete;

            const lucroItem =
              lanceItemTotal -
              custoTotalItem;

            lucro +=
              lucroItem;
          }

          /*
           * GANHOS
           */

          if (
            item.resultado ===
            "ganhou"
          ) {
            valorGanho +=
              lanceItemTotal;

            itensGanhos++;
          }

          /*
           * PERDAS
           */

          if (
            item.resultado ===
            "perdeu"
          ) {
            valorPerdido +=
              lanceItemTotal;

            itensPerdidos++;
          }
        }
      );

      const custoTotal =
        custoProdutosTotal +
        freteTotal;

      const margem =
        lanceTotal > 0
          ? (lucro /
              lanceTotal) *
            100
          : 0;

      const percentualEstimado =
        valorEstimadoTotal >
        0
          ? (lanceTotal /
              valorEstimadoTotal) *
            100
          : 0;

      return {
        valorEstimadoTotal,
        custoProdutosTotal,
        freteTotal,
        custoTotal,
        lanceTotal,
        lucro,
        margem,
        percentualEstimado,
        valorGanho,
        valorPerdido,
        itensGanhos,
        itensPerdidos,
      };
    }, [itens]);

  /*
   * =====================================================
   * INTERFACE
   * =====================================================
   */

  return (
    <section className="detailsPage">

      {/* =================================================
          CABEÇALHO
          ================================================= */}

      <div className="detailsHeader">

        <button
          type="button"
          className="backButton"
          onClick={
            onVoltar
          }
        >
          <ArrowLeft
            size={18}
          />

          Voltar
        </button>

        <div>

          <p className="eyebrow">
            LICITAÇÃO
          </p>

          <h2>
            {licitacao.orgao}
          </h2>

          <p>
            Edital:{" "}
            {licitacao.edital}
          </p>

        </div>

      </div>

      {/* =================================================
          INFORMAÇÕES
          ================================================= */}

      <div className="detailsInfoGrid">

        <div>
          <span>
            Órgão
          </span>

          <strong>
            {licitacao.orgao}
          </strong>
        </div>

        <div>
          <span>
            Edital
          </span>

          <strong>
            {licitacao.edital}
          </strong>
        </div>

        <div>
          <span>
            Modalidade
          </span>

          <strong>
            {licitacao.modalidade}
          </strong>
        </div>

        <div>
          <span>
            Status
          </span>

          <strong>
            {licitacao.status}
          </strong>
        </div>

      </div>

      {/* =================================================
          MENSAGEM
          ================================================= */}

      {mensagem && (
        <div className="saveMessage">

          <Check
            size={18}
          />

          {mensagem}

        </div>
      )}

      {/* =================================================
          FORMULÁRIO
          ================================================= */}

      <div className="panel">

        <div className="panelTitle">

          <div>

            <h2>
              {editando !==
              null
                ? "Editar item"
                : "Cadastrar item"}
            </h2>

            <p>
              Cadastre os valores
              antes da disputa.
            </p>

          </div>

          <button
            type="button"
            className="panelCollapseButton"
            onClick={() => setFormMinimizado((valor) => !valor)}
            aria-expanded={!formMinimizado}
            title={formMinimizado ? "Expandir cadastro" : "Minimizar cadastro"}
          >
            {formMinimizado ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            {formMinimizado ? "Expandir" : "Minimizar"}
          </button>

        </div>

        {!formMinimizado && (<>
        <div className="simpleItemForm">

          <div className="simpleField small">

            <label>
              Nº do item
            </label>

            <input
              type="number"
              min="1"
              value={
                form.numero
              }
              onChange={(e) =>
                alterarCampo(
                  "numero",
                  e.target.value
                )
              }
            />

          </div>

          <div className="simpleField">

            <label>
              Descrição
            </label>

            <input
              type="text"
              placeholder="Ex.: Computador Desktop"
              value={
                form.descricao
              }
              onChange={(e) =>
                alterarCampo(
                  "descricao",
                  e.target.value
                )
              }
            />

          </div>

          <div className="simpleField small">

            <label>
              Quantidade
            </label>

            <input
              type="number"
              min="1"
              value={
                form.quantidade
              }
              onChange={(e) =>
                alterarCampo(
                  "quantidade",
                  e.target.value
                )
              }
            />

          </div>

          <div className="simpleField">

            <label>
              Valor estimado prefeitura
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={
                form.valorEstimado
              }
              onChange={(e) =>
                alterarCampo(
                  "valorEstimado",
                  e.target.value
                )
              }
            />

          </div>

          <div className="simpleField">

            <label>
              Custo unitário
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={
                form.custo
              }
              onChange={(e) =>
                alterarCampo(
                  "custo",
                  e.target.value
                )
              }
            />

          </div>

          <div className="simpleField">

            <label>
              Frete total
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={
                form.frete
              }
              onChange={(e) =>
                alterarCampo(
                  "frete",
                  e.target.value
                )
              }
            />

          </div>

          <div className="simpleField">

            <label>
              Margem desejada (%)
            </label>

            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={
                form.margemDesejada
              }
              onChange={(e) =>
                alterarCampo(
                  "margemDesejada",
                  e.target.value
                )
              }
            />

          </div>

        </div>

        <div className="simpleFormActions">

          <button
            type="button"
            className="primaryButton"
            onClick={
              salvarFormulario
            }
          >

            <Save
              size={17}
            />

            {editando !==
            null
              ? "Salvar alterações"
              : "Salvar item"}

          </button>

          {editando !==
            null && (

            <button
              type="button"
              className="secondaryButton"
              onClick={
                cancelarEdicao
              }
            >

              <X
                size={17}
              />

              Cancelar

            </button>

          )}

        </div>
        </>)}

      </div>

      {/* =================================================
          RESUMO
          ================================================= */}

      {itens.length >
        0 && (

        <div className="globalSummaryBlock">
          <div className="globalSummaryHeader">
            <div>
              <h2>Resumo global da licitação</h2>
              <p>Totais calculados considerando todos os {itens.length} item(ns) cadastrados.</p>
            </div>
          </div>

        <div className="simpleSummary">

          <div>

            <span>
              Valor estimado global
            </span>

            <strong>
              {moeda(
                calculos.valorEstimadoTotal
              )}
            </strong>

          </div>

          <div>

            <span>
              Custo global produtos
            </span>

            <strong>
              {moeda(
                calculos.custoProdutosTotal
              )}
            </strong>

          </div>

          <div>

            <span>
              Frete global
            </span>

            <strong>
              {moeda(
                calculos.freteTotal
              )}
            </strong>

          </div>

          <div>

            <span>
              Lance global
            </span>

            <strong>
              {moeda(
                calculos.lanceTotal
              )}
            </strong>

          </div>

          <div>

            <span>
              Ganhos globais
            </span>

            <strong className="profitPositive">
              {moeda(
                calculos.valorGanho
              )}
            </strong>

          </div>

          <div>

            <span>
              Perdidos globais
            </span>

            <strong className="profitNegative">
              {moeda(
                calculos.valorPerdido
              )}
            </strong>

          </div>

        </div>
        </div>

      )}

      {/* =================================================
          ITENS DA LICITAÇÃO
          ================================================= */}

      <div className="panel">

        <div className="panelTitle">

          <div>

            <h2>
              Itens da licitação
            </h2>

            <p>
              {itens.length} item(ns)
              cadastrado(s)
            </p>

          </div>

          {/* BOTÕES */}

          <div className="panelActions">

            <button
              type="button"
              className="secondaryButton"
              onClick={() => setMostrarImportarTexto(true)}
            >
              <ClipboardPaste size={17} />
              Importar texto
            </button>

            <button
              type="button"
              className="secondaryButton"
              onClick={() =>
                setMostrarImportarPDF(
                  true
                )
              }
            >

              <FileText
                size={17}
              />

              Importar PDF

            </button>

            <button
              type="button"
              className="primaryButton"
              onClick={
                adicionarNovoItem
              }
            >

              <Plus
                size={17}
              />

              Novo item

            </button>

          </div>

        </div>

        {/* =================================================
            LISTA VAZIA
            ================================================= */}

        {itens.length ===
        0 ? (

          <div className="emptyItems">

            <h3>
              Nenhum item cadastrado
            </h3>

            <p>
              Cadastre o primeiro
              item desta
              licitação acima.
            </p>

          </div>

        ) : (

          <div className="simpleTableWrapper">

            <table className="simpleItemsTable">

              <thead>

                <tr>

                  <th>
                    Item
                  </th>

                  <th>
                    Descrição
                  </th>

                  <th>
                    Qtd.
                  </th>

                  <th>
                    Estimado
                  </th>

                  <th>
                    Custo
                  </th>

                  <th>
                    Frete
                  </th>

                  <th className="lanceHeader">
                    LANCE ATUAL
                  </th>

                  <th>
                    % ESTIMADO
                  </th>

                  <th>
                    LUCRO
                  </th>

                  <th>
                    MARGEM
                  </th>

                  <th>
                    RESULTADO
                  </th>

                  <th>
                    AÇÕES
                  </th>

                </tr>

              </thead>

              <tbody>

                {itens.map(
                  (item) => {

                    const fretePorUnidade =
                      item.quantidade >
                      0
                        ? item.frete /
                          item.quantidade
                        : 0;

                    const custoRealUnitario =
                      item.custo +
                      fretePorUnidade;

                    const percentualEstimado =
                      item.valorEstimado >
                      0
                        ? (item.lanceAtual /
                            item.valorEstimado) *
                          100
                        : 0;

                    const lucroUnitario =
                      item.lanceAtual -
                      custoRealUnitario;

                    const lucroTotal =
                      lucroUnitario *
                      item.quantidade;

                    const margemReal =
                      item.lanceAtual >
                      0
                        ? (lucroUnitario /
                            item.lanceAtual) *
                          100
                        : 0;

                    const lanceTotal =
                      item.lanceAtual *
                      item.quantidade;

                    const abaixoDoCusto =
                      item.lanceAtual >
                        0 &&
                      item.lanceAtual <
                        custoRealUnitario;

                    return (

                      <tr
                        key={
                          item.id
                        }
                      >

                        {/* ITEM */}

                        <td>

                          <strong>
                            {item.numero}
                          </strong>

                        </td>

                        {/* DESCRIÇÃO */}

                        <td>
                          {
                            item.descricao
                          }
                        </td>

                        {/* QUANTIDADE */}

                        <td>
                          {
                            item.quantidade
                          }
                        </td>

                        {/* ESTIMADO */}

                        <td>
                          {moeda(
                            item.valorEstimado
                          )}
                        </td>

                        {/* CUSTO */}

                        <td>
                          {moeda(
                            item.custo
                          )}
                        </td>

                        {/* FRETE */}

                        <td>
                          {moeda(
                            item.frete
                          )}
                        </td>

                        {/* LANCE */}

                        <td>

                          <div className="lanceInputWrapper">

                            <span>
                              R$
                            </span>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                item.lanceAtual ||
                                ""
                              }
                              placeholder="0,00"
                              className={
                                abaixoDoCusto
                                  ? "lanceInput danger"
                                  : "lanceInput"
                              }
                              onChange={(
                                e
                              ) =>
                                alterarLance(
                                  item.id,
                                  e.target
                                    .value
                                )
                              }
                            />

                          </div>

                          {item.lanceAtual >
                            0 && (

                            <small className="lanceTotalText">

                              Total:{" "}

                              {moeda(
                                lanceTotal
                              )}

                            </small>

                          )}

                        </td>

                        {/* % ESTIMADO */}

                        <td>

                          {item.lanceAtual >
                          0 ? (

                            <strong
                              className={
                                percentualEstimado >
                                100
                                  ? "percentDanger"
                                  : "percentNormal"
                              }
                            >
                              {percentual(
                                percentualEstimado
                              )}
                            </strong>

                          ) : (

                            <span className="muted">
                              —
                            </span>

                          )}

                        </td>

                        {/* LUCRO */}

                        <td>

                          {item.lanceAtual >
                          0 ? (

                            <div>

                              <strong
                                className={
                                  lucroTotal >=
                                  0
                                    ? "profitPositive"
                                    : "profitNegative"
                                }
                              >
                                {moeda(
                                  lucroTotal
                                )}
                              </strong>

                              <small className="tableSubtext">

                                {moeda(
                                  lucroUnitario
                                )}{" "}
                                / un.

                              </small>

                            </div>

                          ) : (

                            <span className="muted">
                              —
                            </span>

                          )}

                        </td>

                        {/* MARGEM */}

                        <td>

                          {item.lanceAtual >
                          0 ? (

                            <div>

                              <strong
                                className={
                                  margemReal >=
                                  item.margemDesejada
                                    ? "profitPositive"
                                    : margemReal >=
                                      0
                                    ? "marginWarning"
                                    : "profitNegative"
                                }
                              >
                                {percentual(
                                  margemReal
                                )}
                              </strong>

                              <small className="tableSubtext">

                                meta:{" "}

                                {percentual(
                                  item.margemDesejada
                                )}

                              </small>

                            </div>

                          ) : (

                            <span className="muted">
                              —
                            </span>

                          )}

                        </td>

                        {/* RESULTADO */}

                        <td>

                          {item.resultado ===
                            "ganhou" && (

                            <div className="resultadoGanhou">

                              <Trophy
                                size={
                                  15
                                }
                              />

                              <span>
                                Ganhou
                              </span>

                            </div>

                          )}

                          {item.resultado ===
                            "perdeu" && (

                            <div className="resultadoPerdeu">

                              <XCircle
                                size={
                                  15
                                }
                              />

                              <span>
                                Perdeu
                              </span>

                            </div>

                          )}

                          {item.resultado ===
                            "em_disputa" && (

                            <div className="resultadoDisputa">

                              Em disputa

                            </div>

                          )}

                        </td>

                        {/* AÇÕES */}

                        <td>

                          <div className="itemActions">

                            {/* GANHOU */}

                            <button
                              type="button"
                              title="Marcar como ganhou"
                              className="actionWin"
                              onClick={() =>
                                marcarGanhou(
                                  item.id
                                )
                              }
                            >

                              <Trophy
                                size={
                                  15
                                }
                              />

                            </button>

                            {/* PERDEU */}

                            <button
                              type="button"
                              title="Marcar como perdeu"
                              className="actionLose"
                              onClick={() =>
                                marcarPerdeu(
                                  item.id
                                )
                              }
                            >

                              <XCircle
                                size={
                                  15
                                }
                              />

                            </button>

                            {/* VOLTAR PARA DISPUTA */}

                            {item.resultado !==
                              "em_disputa" && (

                              <button
                                type="button"
                                title="Voltar para disputa"
                                className="actionReset"
                                onClick={() =>
                                  voltarParaDisputa(
                                    item.id
                                  )
                                }
                              >

                                <X
                                  size={
                                    15
                                  }
                                />

                              </button>

                            )}

                            {/* EDITAR */}

                            <button
                              type="button"
                              title="Editar"
                              onClick={() =>
                                editarItem(
                                  item
                                )
                              }
                            >

                              <Edit3
                                size={
                                  15
                                }
                              />

                            </button>

                            {/* DUPLICAR */}

                            <button
                              type="button"
                              title="Duplicar"
                              onClick={() =>
                                duplicarItem(
                                  item
                                )
                              }
                            >

                              <Copy
                                size={
                                  15
                                }
                              />

                            </button>

                            {/* EXCLUIR */}

                            <button
                              type="button"
                              title="Excluir"
                              onClick={() =>
                                excluirItem(
                                  item.id
                                )
                              }
                            >

                              <Trash2
                                size={
                                  15
                                }
                              />

                            </button>

                          </div>

                        </td>

                      </tr>

                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* =================================================
          MODAL DE IMPORTAÇÃO DO PDF
          ================================================= */}

      {mostrarImportarPDF && (
        <ImportarItensPDF
          onImportar={
            importarItens
          }
          onFechar={() =>
            setMostrarImportarPDF(
              false
            )
          }
        />
      )}

      {mostrarImportarTexto && (
        <ImportarItensTexto
          onImportar={importarItens}
          onFechar={() => setMostrarImportarTexto(false)}
        />
      )}

    </section>
  );
}