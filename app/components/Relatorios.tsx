"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

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

type RelatorioLicitacao = {
  licitacao: Licitacao;
  itens: ItemLicitacao[];
  custo: number;
  valorLances: number;
  lucro: number;
};

const STORAGE_KEY = "licitapro_licitacoes";
const STORAGE_PREFIX = "licitapro_itens_";

export default function Relatorios() {
  const [relatorios, setRelatorios] = useState<RelatorioLicitacao[]>([]);
  const [aberta, setAberta] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);

  const moeda = (valor: number) =>
    (Number(valor) || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const carregarRelatorio = () => {
    try {
      const dados = localStorage.getItem(STORAGE_KEY);
      const licitacoes: Licitacao[] = dados ? JSON.parse(dados) : [];

      const lista = licitacoes.map((licitacao) => {
        const dadosItens = localStorage.getItem(`${STORAGE_PREFIX}${licitacao.id}`);
        let itens: ItemLicitacao[] = [];

        try {
          itens = dadosItens ? JSON.parse(dadosItens) : [];
        } catch {
          itens = [];
        }

        const participantes = itens.filter(
          (item) => item.resultado !== "perdeu"
        );

        const custo = participantes.reduce((total, item) => {
          const quantidade = Number(item.quantidade) || 0;
          const custoProdutos = quantidade * (Number(item.custo) || 0);
          return total + custoProdutos + (Number(item.frete) || 0);
        }, 0);

        const valorLances = participantes.reduce((total, item) => {
          const quantidade = Number(item.quantidade) || 0;
          return total + quantidade * (Number(item.lanceAtual) || 0);
        }, 0);

        return {
          licitacao,
          itens: participantes,
          custo,
          valorLances,
          lucro: valorLances - custo,
        };
      });

      setRelatorios(lista);
    } catch (erro) {
      console.error("Erro ao carregar relatórios:", erro);
      setRelatorios([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarRelatorio();
    const atualizar = () => carregarRelatorio();
    window.addEventListener("storage", atualizar);
    return () => window.removeEventListener("storage", atualizar);
  }, []);

  const totais = useMemo(
    () => ({
      custo: relatorios.reduce((total, relatorio) => total + relatorio.custo, 0),
      lucro: relatorios.reduce((total, relatorio) => total + relatorio.lucro, 0),
    }),
    [relatorios]
  );

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
      <div className="pageHeader">
        <div>
          <h1>Relatórios</h1>
          <p>Resumo simples por licitação. Clique em uma licitação para ver os itens.</p>
        </div>

        <button className="primaryButton" onClick={carregarRelatorio} type="button">
          <FileText size={17} />
          Atualizar
        </button>
      </div>

      {relatorios.length > 0 && (
        <div className="reportTotal" style={{ marginBottom: 20 }}>
          <div>
            <span>Custo total</span>
            <strong>{moeda(totais.custo)}</strong>
          </div>
          <div>
            <span>Lucro total</span>
            <strong className={totais.lucro >= 0 ? "lucroPositivo" : "lucroNegativo"}>
              {moeda(totais.lucro)}
            </strong>
          </div>
        </div>
      )}

      {relatorios.length === 0 ? (
        <div className="contentCard">
          <div className="emptyState">
            <FileText size={40} />
            <h3>Nenhuma licitação salva</h3>
            <p>As licitações cadastradas aparecerão aqui automaticamente.</p>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
            alignItems: "start",
          }}
        >
          {relatorios.map((relatorio) => {
            const estaAberta = aberta === relatorio.licitacao.id;

            return (
              <div className="contentCard" key={relatorio.licitacao.id} style={{ margin: 0 }}>
                <button
                  type="button"
                  onClick={() => setAberta(estaAberta ? null : relatorio.licitacao.id)}
                  style={{
                    width: "100%",
                    border: 0,
                    background: "transparent",
                    color: "inherit",
                    padding: 0,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                    <div>
                      <span style={{ fontSize: 12, opacity: 0.65 }}>LICITAÇÃO</span>
                      <h2 style={{ margin: "5px 0" }}>
                        {relatorio.licitacao.orgao || `Licitação #${relatorio.licitacao.id}`}
                      </h2>
                      <span style={{ opacity: 0.7 }}>
                        {relatorio.licitacao.edital
                          ? `Edital ${relatorio.licitacao.edital}`
                          : `${relatorio.itens.length} item(ns)`}
                      </span>
                    </div>
                    {estaAberta ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      marginTop: 22,
                    }}
                  >
                    <div className="statCard" style={{ minHeight: 0 }}>
                      <div>
                        <span>Valor de custo</span>
                        <strong>{moeda(relatorio.custo)}</strong>
                      </div>
                    </div>
                    <div className="statCard" style={{ minHeight: 0 }}>
                      <div>
                        <span>Valor de lucro</span>
                        <strong
                          className={relatorio.lucro >= 0 ? "lucroPositivo" : "lucroNegativo"}
                        >
                          {moeda(relatorio.lucro)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </button>

                {estaAberta && (
                  <div style={{ marginTop: 22, borderTop: "1px solid rgba(128,128,128,.2)", paddingTop: 18 }}>
                    <h3 style={{ marginTop: 0 }}>Itens participantes</h3>

                    {relatorio.itens.length === 0 ? (
                      <p style={{ opacity: 0.7 }}>Nenhum item participante nesta licitação.</p>
                    ) : (
                      <div className="tableWrapper">
                        <table className="reportTable">
                          <thead>
                            <tr>
                              <th>ITEM</th>
                              <th>DESCRIÇÃO</th>
                              <th>QTD.</th>
                              <th>ESTIMADO</th>
                              <th>CUSTO</th>
                              <th>LANCE</th>
                              <th>RESULTADO</th>
                            </tr>
                          </thead>
                          <tbody>
                            {relatorio.itens.map((item) => {
                              const quantidade = Number(item.quantidade) || 0;
                              const custoTotal = quantidade * (Number(item.custo) || 0) + (Number(item.frete) || 0);
                              const lanceTotal = quantidade * (Number(item.lanceAtual) || 0);

                              return (
                                <tr key={item.id}>
                                  <td><strong>{item.numero}</strong></td>
                                  <td>{item.descricao}</td>
                                  <td>{quantidade}</td>
                                  <td>{moeda((Number(item.valorEstimado) || 0) * quantidade)}</td>
                                  <td>
                                    <div className="valorInfo">
                                      <strong>{moeda(custoTotal)}</strong>
                                      <span>{moeda(item.custo)} / un.</span>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="valorInfo">
                                      <strong>{moeda(lanceTotal)}</strong>
                                      <span>{moeda(item.lanceAtual)} / un.</span>
                                    </div>
                                  </td>
                                  <td>
                                    {item.resultado === "ganhou"
                                      ? "Ganhou"
                                      : item.resultado === "perdeu"
                                        ? "Perdeu"
                                        : "Em disputa"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
