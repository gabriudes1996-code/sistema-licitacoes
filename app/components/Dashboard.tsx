"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  XCircle,
  DollarSign,
  TrendingUp,
  Truck,
  Package,
  ArrowUpRight,
  BarChart3,
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
};

const LICITACOES_KEY = "licitapro_licitacoes";
const ITENS_PREFIX = "licitapro_itens_";

const brl = (valor: number) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const num = (valor: unknown) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

export default function Dashboard() {
  const [licitacoes, setLicitacoes] =
    useState<Licitacao[]>([]);

  const [itensPorLicitacao, setItensPorLicitacao] =
    useState<Record<number, ItemLicitacao[]>>({});

  useEffect(() => {
    carregarDados();

    const atualizar = () => {
      carregarDados();
    };

    window.addEventListener(
      "storage",
      atualizar
    );

    const intervalo = setInterval(
      atualizar,
      1000
    );

    return () => {
      window.removeEventListener(
        "storage",
        atualizar
      );

      clearInterval(intervalo);
    };
  }, []);

  const carregarDados = () => {
    try {
      const salvo =
        localStorage.getItem(
          LICITACOES_KEY
        );

      const lista: Licitacao[] =
        salvo
          ? JSON.parse(salvo)
          : [];

      setLicitacoes(
        Array.isArray(lista)
          ? lista
          : []
      );

      const itens:
        Record<
          number,
          ItemLicitacao[]
        > = {};

      lista.forEach(
        (licitacao) => {
          const salvoItens =
            localStorage.getItem(
              ITENS_PREFIX +
                licitacao.id
            );

          if (!salvoItens) {
            itens[licitacao.id] =
              [];

            return;
          }

          try {
            const dados =
              JSON.parse(
                salvoItens
              );

            if (
              !Array.isArray(
                dados
              )
            ) {
              itens[licitacao.id] =
                [];

              return;
            }

            /*
             * Normaliza os dados.
             * Isso evita NaN caso existam
             * itens antigos salvos.
             */
            itens[licitacao.id] =
              dados.map(
                (
                  item: any,
                  index: number
                ) => ({
                  id:
                    num(item.id) ||
                    Date.now() +
                      index,

                  numero:
                    num(
                      item.numero
                    ) ||
                    index + 1,

                  descricao:
                    item.descricao ||
                    "",

                  quantidade:
                    num(
                      item.quantidade
                    ) || 1,

                  valorEstimado:
                    num(
                      item.valorEstimado ??
                        item.valorEstimadoUnitario
                    ),

                  custo:
                    num(
                      item.custo ??
                        item.custoUnitario
                    ),

                  frete:
                    num(
                      item.frete
                    ),

                  margemDesejada:
                    num(
                      item.margemDesejada
                    ),

                  lanceAtual:
                    num(
                      item.lanceAtual ??
                        item.valorLicitacao ??
                        item.valor
                    ),
                })
              );
          } catch {
            itens[licitacao.id] =
              [];
          }
        }
      );

      setItensPorLicitacao(
        itens
      );
    } catch (error) {
      console.error(
        "Erro ao carregar Dashboard:",
        error
      );

      setLicitacoes([]);
      setItensPorLicitacao({});
    }
  };

  /*
   * CÁLCULOS
   */
  const dados = useMemo(() => {
    let valorEstimado = 0;
    let custoProdutos = 0;
    let frete = 0;
    let lanceTotal = 0;
    let lucro = 0;

    let itens = 0;
    let itensComLance = 0;

    licitacoes.forEach(
      (licitacao) => {
        const listaItens =
          itensPorLicitacao[
            licitacao.id
          ] || [];

        itens +=
          listaItens.length;

        listaItens.forEach(
          (item) => {
            const quantidade =
              num(
                item.quantidade
              );

            const estimado =
              num(
                item.valorEstimado
              );

            const custo =
              num(
                item.custo
              );

            const freteItem =
              num(
                item.frete
              );

            const lance =
              num(
                item.lanceAtual
              );

            /*
             * Valor estimado total
             */
            valorEstimado +=
              quantidade *
              estimado;

            /*
             * Custo dos produtos
             */
            const custoProdutoItem =
              quantidade *
              custo;

            custoProdutos +=
              custoProdutoItem;

            /*
             * Frete
             */
            frete +=
              freteItem;

            /*
             * Lance total do item
             */
            const lanceItemTotal =
              quantidade *
              lance;

            /*
             * Só considera lance
             * quando realmente existe.
             */
            if (lance > 0) {
              lanceTotal +=
                lanceItemTotal;

              itensComLance++;

              /*
               * Custo total do item
               */
              const custoTotalItem =
                custoProdutoItem +
                freteItem;

              /*
               * Lucro do item
               */
              const lucroItem =
                lanceItemTotal -
                custoTotalItem;

              lucro +=
                lucroItem;
            }
          }
        );
      }
    );

    /*
     * Custo total
     */
    const custoTotal =
      custoProdutos +
      frete;

    /*
     * Margem real
     */
    const margem =
      lanceTotal > 0
        ? (lucro /
            lanceTotal) *
          100
        : 0;

    /*
     * Percentual do valor estimado
     */
    const percentualEstimado =
      valorEstimado > 0
        ? (lanceTotal /
            valorEstimado) *
          100
        : 0;

    return {
      valorEstimado,
      custoProdutos,
      frete,
      custoTotal,
      lanceTotal,
      lucro,
      margem,
      percentualEstimado,
      itens,
      itensComLance,
    };
  }, [
    licitacoes,
    itensPorLicitacao,
  ]);

  /*
   * STATUS
   */
  const status = useMemo(() => {
    let andamento = 0;
    let concluida = 0;
    let perdida = 0;
    let cancelada = 0;
    let outras = 0;

    licitacoes.forEach(
      (licitacao) => {
        const texto =
          licitacao.status
            ?.toLowerCase()
            .trim() || "";

        if (
          texto.includes(
            "andamento"
          ) ||
          texto.includes("aberta")
        ) {
          andamento++;
        } else if (
          texto.includes(
            "conclu"
          ) ||
          texto.includes("venc")
        ) {
          concluida++;
        } else if (
          texto.includes("perd")
        ) {
          perdida++;
        } else if (
          texto.includes(
            "cancel"
          )
        ) {
          cancelada++;
        } else {
          outras++;
        }
      }
    );

    return {
      andamento,
      concluida,
      perdida,
      cancelada,
      outras,
    };
  }, [licitacoes]);

  /*
   * ÚLTIMAS LICITAÇÕES
   */
  const ultimasLicitacoes =
    useMemo(() => {
      return [...licitacoes]
        .sort(
          (a, b) =>
            b.id - a.id
        )
        .slice(0, 5);
    }, [licitacoes]);

  const percentual = (
    quantidade: number
  ) => {
    if (
      licitacoes.length === 0
    ) {
      return 0;
    }

    return Math.round(
      (quantidade /
        licitacoes.length) *
        100
    );
  };

  return (
    <section className="dashboardPage">

      {/* CABEÇALHO */}

      <div className="dashboardHeader">

        <div>
          <h2>
            Dashboard
          </h2>

          <p>
            Visão geral das suas
            licitações e resultados
            financeiros.
          </p>
        </div>

        <button
          className="dashboardRefresh"
          onClick={
            carregarDados
          }
          type="button"
        >
          Atualizar dados
        </button>

      </div>

      {/* CARDS PRINCIPAIS */}

      <div className="dashboardCards">

        <div className="dashboardCard">

          <div className="dashboardCardIcon blue">
            <ClipboardList
              size={20}
            />
          </div>

          <div>

            <span>
              Total de licitações
            </span>

            <strong>
              {licitacoes.length}
            </strong>

            <small>
              {dados.itens} itens
              cadastrados
            </small>

          </div>

        </div>

        <div className="dashboardCard">

          <div className="dashboardCardIcon orange">
            <Clock3 size={20} />
          </div>

          <div>

            <span>
              Em andamento
            </span>

            <strong>
              {status.andamento}
            </strong>

            <small>
              {percentual(
                status.andamento
              )}
              % das licitações
            </small>

          </div>

        </div>

        <div className="dashboardCard">

          <div className="dashboardCardIcon green">
            <CheckCircle2
              size={20}
            />
          </div>

          <div>

            <span>
              Concluídas
            </span>

            <strong>
              {status.concluida}
            </strong>

            <small>
              {percentual(
                status.concluida
              )}
              % das licitações
            </small>

          </div>

        </div>

        <div className="dashboardCard">

          <div className="dashboardCardIcon red">
            <XCircle size={20} />
          </div>

          <div>

            <span>
              Perdidas
            </span>

            <strong>
              {status.perdida}
            </strong>

            <small>
              {percentual(
                status.perdida
              )}
              % das licitações
            </small>

          </div>

        </div>

      </div>

      {/* FINANCEIRO */}

      <div className="dashboardFinancialGrid">

        <div className="dashboardFinancialCard">

          <div className="dashboardFinancialIcon">
            <DollarSign
              size={20}
            />
          </div>

          <div>

            <span>
              Valor estimado
            </span>

            <strong>
              {brl(
                dados.valorEstimado
              )}
            </strong>

          </div>

          <ArrowUpRight
            size={18}
          />

        </div>

        <div className="dashboardFinancialCard">

          <div className="dashboardFinancialIcon">
            <Package size={20} />
          </div>

          <div>

            <span>
              Custo dos produtos
            </span>

            <strong>
              {brl(
                dados.custoProdutos
              )}
            </strong>

          </div>

        </div>

        <div className="dashboardFinancialCard">

          <div className="dashboardFinancialIcon">
            <Truck size={20} />
          </div>

          <div>

            <span>
              Frete total
            </span>

            <strong>
              {brl(
                dados.frete
              )}
            </strong>

          </div>

        </div>

        <div className="dashboardFinancialCard">

          <div className="dashboardFinancialIcon">
            <DollarSign
              size={20}
            />
          </div>

          <div>

            <span>
              Lances atuais
            </span>

            <strong>
              {brl(
                dados.lanceTotal
              )}
            </strong>

          </div>

        </div>

      </div>

      {/* RESULTADOS */}

      <div className="dashboardResultGrid">

        <div className="dashboardResultCard">

          <div className="dashboardResultHeader">

            <div>

              <span>
                Lance total
              </span>

              <h3>
                {brl(
                  dados.lanceTotal
                )}
              </h3>

            </div>

            <div className="resultIcon blue">
              <DollarSign
                size={21}
              />
            </div>

          </div>

          <p>
            Soma dos lances atuais
            cadastrados nos itens.
          </p>

        </div>

        <div className="dashboardResultCard">

          <div className="dashboardResultHeader">

            <div>

              <span>
                Lucro potencial
              </span>

              <h3
                className={
                  dados.lucro >= 0
                    ? "profitPositive"
                    : "profitNegative"
                }
              >
                {brl(
                  dados.lucro
                )}
              </h3>

            </div>

            <div className="resultIcon green">
              <TrendingUp
                size={21}
              />
            </div>

          </div>

          <p>
            Lance total menos
            custo dos produtos e
            frete.
          </p>

        </div>

        <div className="dashboardResultCard">

          <div className="dashboardResultHeader">

            <div>

              <span>
                Margem média
              </span>

              <h3>
                {dados.margem.toFixed(
                  2
                )}
                %
              </h3>

            </div>

            <div className="resultIcon purple">
              <BarChart3
                size={21}
              />
            </div>

          </div>

          <p>
            Margem calculada sobre
            os lances atuais.
          </p>

        </div>

      </div>

      {/* STATUS + ÚLTIMAS */}

      <div className="dashboardBottomGrid">

        <div className="dashboardPanel">

          <div className="dashboardPanelHeader">

            <div>

              <h3>
                Status das licitações
              </h3>

              <p>
                Distribuição atual.
              </p>

            </div>

          </div>

          <div className="statusList">

            <StatusBar
              label="Em andamento"
              value={
                status.andamento
              }
              total={
                licitacoes.length
              }
              type="blue"
            />

            <StatusBar
              label="Concluídas"
              value={
                status.concluida
              }
              total={
                licitacoes.length
              }
              type="green"
            />

            <StatusBar
              label="Perdidas"
              value={
                status.perdida
              }
              total={
                licitacoes.length
              }
              type="red"
            />

            <StatusBar
              label="Canceladas"
              value={
                status.cancelada
              }
              total={
                licitacoes.length
              }
              type="orange"
            />

            {status.outras >
              0 && (
              <StatusBar
                label="Outros"
                value={
                  status.outras
                }
                total={
                  licitacoes.length
                }
                type="gray"
              />
            )}

          </div>

        </div>

        {/* ÚLTIMAS LICITAÇÕES */}

        <div className="dashboardPanel">

          <div className="dashboardPanelHeader">

            <div>

              <h3>
                Últimas licitações
              </h3>

              <p>
                Registros adicionados
                recentemente.
              </p>

            </div>

          </div>

          {ultimasLicitacoes.length ===
          0 ? (

            <div className="dashboardEmpty">

              <ClipboardList
                size={35}
              />

              <strong>
                Nenhuma licitação
                cadastrada
              </strong>

              <span>
                Cadastre uma licitação
                para visualizar os
                dados aqui.
              </span>

            </div>

          ) : (

            <div className="recentList">

              {ultimasLicitacoes.map(
                (licitacao) => (

                  <div
                    className="recentItem"
                    key={
                      licitacao.id
                    }
                  >

                    <div className="recentItemMain">

                      <strong>
                        {
                          licitacao.orgao
                        }
                      </strong>

                      <span>
                        Edital{" "}
                        {
                          licitacao.edital
                        }
                      </span>

                    </div>

                    <div className="recentItemRight">

                      <strong>
                        {brl(
                          num(
                            licitacao.valorEstimado
                          )
                        )}
                      </strong>

                      <span
                        className={getStatusClass(
                          licitacao.status
                        )}
                      >
                        {
                          licitacao.status
                        }
                      </span>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </div>

    </section>
  );
}

function StatusBar({
  label,
  value,
  total,
  type,
}: {
  label: string;
  value: number;
  total: number;
  type:
    | "blue"
    | "green"
    | "red"
    | "orange"
    | "gray";
}) {
  const porcentagem =
    total > 0
      ? (value / total) *
        100
      : 0;

  return (
    <div className="statusRow">

      <div className="statusRowTop">

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

      <div className="statusBar">

        <div
          className={`statusBarFill ${type}`}
          style={{
            width: `${porcentagem}%`,
          }}
        />

      </div>

    </div>
  );
}

function getStatusClass(
  status: string
) {
  const texto =
    status?.toLowerCase() ||
    "";

  if (
    texto.includes("conclu") ||
    texto.includes("venc")
  ) {
    return "recentStatus green";
  }

  if (
    texto.includes("perd")
  ) {
    return "recentStatus red";
  }

  if (
    texto.includes("cancel")
  ) {
    return "recentStatus orange";
  }

  return "recentStatus blue";
}