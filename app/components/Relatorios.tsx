"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Trophy,
  Package,
  DollarSign,
  TrendingUp,
} from "lucide-react";

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
  resultado: "em_disputa" | "ganhou" | "perdeu";
};

type ItemGanhoRelatorio = {
  licitacaoId: number;
  licitacaoNome: string;
  edital: string;
  itemNumero: number;
  descricao: string;
  quantidade: number;
  custoUnitario: number;
  custoTotal: number;
  valorGanhoUnitario: number;
  valorGanhoTotal: number;
  frete: number;
  lucro: number;
};

const STORAGE_KEY = "licitapro_licitacoes";
const STORAGE_PREFIX = "licitapro_itens_";

export default function Relatorios() {
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);
  const [itensGanhos, setItensGanhos] = useState<ItemGanhoRelatorio[]>([]);
  const [carregando, setCarregando] = useState(true);

  const moeda = (valor: number) => {
    const numero = Number(valor) || 0;

    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const carregarRelatorio = () => {
    try {
      const dadosLicitacoes = localStorage.getItem(STORAGE_KEY);

      if (!dadosLicitacoes) {
        setLicitacoes([]);
        setItensGanhos([]);
        setCarregando(false);
        return;
      }

      const listaLicitacoes: Licitacao[] = JSON.parse(
        dadosLicitacoes
      );

      setLicitacoes(listaLicitacoes);

      const ganhos: ItemGanhoRelatorio[] = [];

      listaLicitacoes.forEach((licitacao) => {
        const chave = `${STORAGE_PREFIX}${licitacao.id}`;
        const dadosItens = localStorage.getItem(chave);

        if (!dadosItens) return;

        try {
          const itens: ItemLicitacao[] = JSON.parse(dadosItens);

          itens.forEach((item) => {
            if (item.resultado !== "ganhou") return;

            const quantidade = Number(item.quantidade) || 0;
            const custoUnitario = Number(item.custo) || 0;
            const valorGanhoUnitario =
              Number(item.lanceAtual) || 0;
            const frete = Number(item.frete) || 0;

            const custoProdutos =
              quantidade * custoUnitario;

            const valorGanhoTotal =
              quantidade * valorGanhoUnitario;

            const custoTotal =
              custoProdutos + frete;

            const lucro =
              valorGanhoTotal - custoTotal;

            ganhos.push({
              licitacaoId: licitacao.id,
              licitacaoNome:
                licitacao.orgao ||
                `Licitação #${licitacao.id}`,
              edital: licitacao.edital || "",
              itemNumero: Number(item.numero) || 0,
              descricao: item.descricao || "Item sem descrição",
              quantidade,
              custoUnitario,
              custoTotal,
              valorGanhoUnitario,
              valorGanhoTotal,
              frete,
              lucro,
            });
          });
        } catch (erro) {
          console.error(
            `Erro ao carregar itens da licitação ${licitacao.id}:`,
            erro
          );
        }
      });

      setItensGanhos(ganhos);
    } catch (erro) {
      console.error("Erro ao carregar relatório:", erro);
      setLicitacoes([]);
      setItensGanhos([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarRelatorio();

    const intervalo = setInterval(() => {
      carregarRelatorio();
    }, 1000);

    const atualizar = () => {
      carregarRelatorio();
    };

    window.addEventListener("storage", atualizar);

    return () => {
      clearInterval(intervalo);
      window.removeEventListener("storage", atualizar);
    };
  }, []);

  const totais = useMemo(() => {
    const quantidadeItens = itensGanhos.reduce(
      (total, item) => total + item.quantidade,
      0
    );

    const custoTotal = itensGanhos.reduce(
      (total, item) => total + item.custoTotal,
      0
    );

    const valorTotalGanho = itensGanhos.reduce(
      (total, item) => total + item.valorGanhoTotal,
      0
    );

    const lucroTotal = itensGanhos.reduce(
      (total, item) => total + item.lucro,
      0
    );

    return {
      quantidadeItens,
      custoTotal,
      valorTotalGanho,
      lucroTotal,
    };
  }, [itensGanhos]);

  if (carregando) {
    return (
      <div className="page">
        <div className="pageHeader">
          <div>
            <h1>Relatórios</h1>
            <p>Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* CABEÇALHO */}
      <div className="pageHeader">
        <div>
          <h1>Relatório de Itens Ganhos</h1>
          <p>
            Visualize os itens ganhos nas licitações e seus valores.
          </p>
        </div>

        <button
          className="primaryButton"
          onClick={carregarRelatorio}
          type="button"
        >
          <FileText size={17} />
          Atualizar
        </button>
      </div>

      {/* RESUMO */}
      <div className="statsGrid">
        <div className="statCard">
          <div className="statIcon">
            <Trophy size={20} />
          </div>

          <div>
            <span>Itens ganhos</span>
            <strong>{itensGanhos.length}</strong>
          </div>
        </div>

        <div className="statCard">
          <div className="statIcon">
            <Package size={20} />
          </div>

          <div>
            <span>Quantidade</span>
            <strong>
              {totais.quantidadeItens}
            </strong>
          </div>
        </div>

        <div className="statCard">
          <div className="statIcon">
            <DollarSign size={20} />
          </div>

          <div>
            <span>Valor ganho</span>
            <strong>
              {moeda(totais.valorTotalGanho)}
            </strong>
          </div>
        </div>

        <div className="statCard">
          <div className="statIcon">
            <TrendingUp size={20} />
          </div>

          <div>
            <span>Lucro</span>
            <strong>
              {moeda(totais.lucroTotal)}
            </strong>
          </div>
        </div>
      </div>

      {/* TABELA */}
      <div className="contentCard">
        <div className="contentCardHeader">
          <div>
            <h2>Itens ganhos</h2>
            <p>
              Apenas os itens marcados como &quot;Ganhou&quot; são
              exibidos aqui.
            </p>
          </div>
        </div>

        {itensGanhos.length === 0 ? (
          <div className="emptyState">
            <Trophy size={40} />

            <h3>Nenhum item ganho</h3>

            <p>
              Quando você marcar um item como &quot;Ganhou&quot; dentro
              de uma licitação, ele aparecerá automaticamente neste
              relatório.
            </p>
          </div>
        ) : (
          <div className="tableWrapper">
            <table className="reportTable">
              <thead>
                <tr>
                  <th>LICITAÇÃO</th>
                  <th>ITEM</th>
                  <th>QTD.</th>
                  <th>CUSTO</th>
                  <th>VALOR GANHO</th>
                  <th>LUCRO</th>
                </tr>
              </thead>

              <tbody>
                {itensGanhos.map((item, index) => (
                  <tr
                    key={`${item.licitacaoId}-${item.itemNumero}-${index}`}
                  >
                    <td>
                      <div className="licitacaoInfo">
                        <strong>
                          {item.licitacaoNome}
                        </strong>

                        {item.edital && (
                          <span>
                            Edital {item.edital}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="itemInfo">
                        <strong>
                          Item {item.itemNumero}
                        </strong>

                        <span>
                          {item.descricao}
                        </span>
                      </div>
                    </td>

                    <td>
                      {item.quantidade}
                    </td>

                    <td>
                      <div className="valorInfo">
                        <strong>
                          {moeda(item.custoTotal)}
                        </strong>

                        <span>
                          {moeda(item.custoUnitario)} / un.
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="valorInfo ganho">
                        <strong>
                          {moeda(item.valorGanhoTotal)}
                        </strong>

                        <span>
                          {moeda(
                            item.valorGanhoUnitario
                          )}{" "}
                          / un.
                        </span>
                      </div>
                    </td>

                    <td>
                      <strong
                        className={
                          item.lucro >= 0
                            ? "lucroPositivo"
                            : "lucroNegativo"
                        }
                      >
                        {moeda(item.lucro)}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TOTAL */}
      {itensGanhos.length > 0 && (
        <div className="reportTotal">
          <div>
            <span>Custo total</span>
            <strong>
              {moeda(totais.custoTotal)}
            </strong>
          </div>

          <div>
            <span>Valor total ganho</span>
            <strong>
              {moeda(totais.valorTotalGanho)}
            </strong>
          </div>

          <div>
            <span>Lucro total</span>
            <strong className="lucroPositivo">
              {moeda(totais.lucroTotal)}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}