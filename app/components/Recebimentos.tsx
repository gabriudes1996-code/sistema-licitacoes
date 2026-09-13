"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, ChevronDown, ChevronUp, CircleDollarSign, CreditCard, PackageCheck, Plus, ReceiptText, Trash2 } from "lucide-react";

type Licitacao = { id: number; orgao: string; edital: string; data: string };
type Item = { id: number; numero: number; descricao: string; quantidade: number; custo: number; frete: number; lanceAtual: number; resultado?: "em_disputa" | "ganhou" | "perdeu" };
type Movimento = { id: number; data: string; quantidadeSolicitada: number; valorSolicitado?: number; valorRecebido?: number; pago?: boolean; dataPagamento?: string; observacao: string };
type Grupo = { licitacao: Licitacao; itens: Item[] };

const LICITACOES_KEY = "licitapro_licitacoes";
const ITENS_PREFIX = "licitapro_itens_";
const EXEC_PREFIX = "licitapro_execucao_";
const moeda = (v: number) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const hoje = () => new Date().toISOString().slice(0, 10);

export default function Recebimentos() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [aberta, setAberta] = useState<number | null>(null);
  const [movimentos, setMovimentos] = useState<Record<string, Movimento[]>>({});
  const [form, setForm] = useState<Record<string, { data: string; quantidade: string; valorSolicitado: string; observacao: string }>>({});

  const chaveItem = (licitacaoId: number, itemId: number) => `${licitacaoId}_${itemId}`;

  const carregar = () => {
    try {
      const licitacoes: Licitacao[] = JSON.parse(localStorage.getItem(LICITACOES_KEY) || "[]");
      const proximos: Grupo[] = [];
      const movs: Record<string, Movimento[]> = {};

      licitacoes.forEach((licitacao) => {
        let itens: Item[] = [];
        try { itens = JSON.parse(localStorage.getItem(ITENS_PREFIX + licitacao.id) || "[]"); } catch {}
        const ganhos = itens.filter((item) => item.resultado === "ganhou");
        if (!ganhos.length) return;

        ganhos.forEach((item) => {
          const chave = chaveItem(licitacao.id, item.id);
          try { movs[chave] = JSON.parse(localStorage.getItem(EXEC_PREFIX + chave) || "[]"); }
          catch { movs[chave] = []; }
        });
        proximos.push({ licitacao, itens: ganhos });
      });

      setGrupos(proximos);
      setMovimentos(movs);
    } catch {
      setGrupos([]);
      setMovimentos({});
    }
  };

  useEffect(() => {
    carregar();
    const timer = setInterval(carregar, 1200);
    return () => clearInterval(timer);
  }, []);

  const resumo = useMemo(() => {
    let valorContratado = 0, valorSolicitado = 0, recebido = 0, aReceber = 0;
    grupos.forEach((grupo) => grupo.itens.forEach((item) => {
      const chave = chaveItem(grupo.licitacao.id, item.id);
      const lista = movimentos[chave] || [];
      const contratado = (Number(item.quantidade) || 0) * (Number(item.lanceAtual) || 0);
      const solicitado = lista.reduce((t, m) => t + ((Number(m.valorSolicitado) || 0) || ((Number(m.quantidadeSolicitada) || 0) * (Number(item.lanceAtual) || 0))), 0);
      const recebidoItem = lista.reduce((t, m) => {
        const valor = (Number(m.valorSolicitado) || 0) || ((Number(m.quantidadeSolicitada) || 0) * (Number(item.lanceAtual) || 0));
        if (m.pago === true) return t + valor;
        if (m.pago === undefined) return t + (Number(m.valorRecebido) || 0);
        return t;
      }, 0);
      valorContratado += contratado;
      valorSolicitado += solicitado;
      recebido += recebidoItem;
      aReceber += Math.max(0, solicitado - recebidoItem);
    }));
    return { valorContratado, valorSolicitado, recebido, aReceber };
  }, [grupos, movimentos]);

  const valorForm = (chave: string) => form[chave] || { data: hoje(), quantidade: "", valorSolicitado: "", observacao: "" };

  const atualizarForm = (chave: string, campo: "data" | "quantidade" | "valorSolicitado" | "observacao", valor: string) => {
    setForm((anterior) => ({ ...anterior, [chave]: { ...valorForm(chave), [campo]: valor } }));
  };

  const adicionarSolicitacao = (licitacaoId: number, item: Item) => {
    const chave = chaveItem(licitacaoId, item.id);
    const atual = valorForm(chave);
    const quantidade = Number(atual.quantidade) || 0;
    const valorCalculado = quantidade * (Number(item.lanceAtual) || 0);
    const valorSolicitado = atual.valorSolicitado.trim() ? Number(atual.valorSolicitado) || 0 : valorCalculado;

    if (quantidade <= 0) {
      alert("Informe a quantidade solicitada pela prefeitura.");
      return;
    }
    if (valorSolicitado <= 0) {
      alert("Informe o valor da solicitação.");
      return;
    }

    const jaSolicitado = (movimentos[chave] || []).reduce((t, m) => t + (Number(m.quantidadeSolicitada) || 0), 0);
    if (jaSolicitado + quantidade > Number(item.quantidade || 0)) {
      alert("A quantidade solicitada ultrapassa a quantidade ganha deste item.");
      return;
    }

    const novo: Movimento = {
      id: Date.now(),
      data: atual.data || hoje(),
      quantidadeSolicitada: quantidade,
      valorSolicitado,
      valorRecebido: 0,
      pago: false,
      observacao: atual.observacao.trim(),
    };

    const lista = [...(movimentos[chave] || []), novo];
    localStorage.setItem(EXEC_PREFIX + chave, JSON.stringify(lista));
    setMovimentos((anterior) => ({ ...anterior, [chave]: lista }));
    setForm((anterior) => ({ ...anterior, [chave]: { data: hoje(), quantidade: "", valorSolicitado: "", observacao: "" } }));
  };

  const marcarPago = (licitacaoId: number, itemId: number, movimentoId: number) => {
    const chave = chaveItem(licitacaoId, itemId);
    const lista = (movimentos[chave] || []).map((mov) => mov.id === movimentoId ? { ...mov, pago: true, dataPagamento: hoje() } : mov);
    localStorage.setItem(EXEC_PREFIX + chave, JSON.stringify(lista));
    setMovimentos((anterior) => ({ ...anterior, [chave]: lista }));
  };

  const desfazerPagamento = (licitacaoId: number, itemId: number, movimentoId: number) => {
    const chave = chaveItem(licitacaoId, itemId);
    const lista = (movimentos[chave] || []).map((mov) => mov.id === movimentoId ? { ...mov, pago: false, dataPagamento: undefined, valorRecebido: 0 } : mov);
    localStorage.setItem(EXEC_PREFIX + chave, JSON.stringify(lista));
    setMovimentos((anterior) => ({ ...anterior, [chave]: lista }));
  };

  const excluirMovimento = (licitacaoId: number, itemId: number, movimentoId: number) => {
    const chave = chaveItem(licitacaoId, itemId);
    const lista = (movimentos[chave] || []).filter((m) => m.id !== movimentoId);
    localStorage.setItem(EXEC_PREFIX + chave, JSON.stringify(lista));
    setMovimentos((anterior) => ({ ...anterior, [chave]: lista }));
  };

  return (
    <section className="erpPage">
      <div className="erpHero">
        <div>
          <span className="erpKicker">EXECUÇÃO DOS CONTRATOS</span>
          <h2>Solicitações e pagamentos</h2>
          <p>Primeiro registre o pedido da prefeitura. Quando o dinheiro entrar, marque aquela solicitação como paga.</p>
        </div>
        <div className="erpHeroIcon"><CircleDollarSign size={28} /></div>
      </div>

      <div className="erpMetricGrid">
        <Metric titulo="Potencial contratado" valor={moeda(resumo.valorContratado)} detalhe="Quantidade ganha × valor do lance" />
        <Metric titulo="Já solicitado" valor={moeda(resumo.valorSolicitado)} detalhe="Pedidos efetivamente feitos pelas prefeituras" />
        <Metric titulo="Recebido" valor={moeda(resumo.recebido)} detalhe="Somente solicitações marcadas como pagas" positivo />
        <Metric titulo="Pendente de pagamento" valor={moeda(resumo.aReceber)} detalhe="Solicitado e ainda não pago" destaque />
      </div>

      {grupos.length === 0 ? (
        <div className="erpEmpty">
          <PackageCheck size={42} />
          <h3>Nenhuma licitação ganha para executar</h3>
          <p>Quando um item for marcado como ganho, ele aparecerá aqui para acompanhamento.</p>
        </div>
      ) : grupos.map((grupo) => {
        const estaAberta = aberta === grupo.licitacao.id;
        return (
          <div className="erpContractCard" key={grupo.licitacao.id}>
            <button className="erpContractHeader" type="button" onClick={() => setAberta(estaAberta ? null : grupo.licitacao.id)}>
              <div className="erpOrgIcon"><Building2 size={20} /></div>
              <div className="erpContractTitle">
                <span>ÓRGÃO PÚBLICO</span>
                <strong>{grupo.licitacao.orgao}</strong>
                <small>{grupo.licitacao.edital || "Sem edital informado"} • {grupo.itens.length} item(ns) ganho(s)</small>
              </div>
              {estaAberta ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {estaAberta && (
              <div className="erpContractBody">
                {grupo.itens.map((item) => {
                  const chave = chaveItem(grupo.licitacao.id, item.id);
                  const lista = movimentos[chave] || [];
                  const qtdGanha = Number(item.quantidade) || 0;
                  const qtdSolicitada = lista.reduce((t, m) => t + (Number(m.quantidadeSolicitada) || 0), 0);
                  const saldoQtd = Math.max(0, qtdGanha - qtdSolicitada);
                  const solicitado = lista.reduce((t, m) => t + ((Number(m.valorSolicitado) || 0) || ((Number(m.quantidadeSolicitada) || 0) * (Number(item.lanceAtual) || 0))), 0);
                  const recebido = lista.reduce((t, m) => {
                    const valor = (Number(m.valorSolicitado) || 0) || ((Number(m.quantidadeSolicitada) || 0) * (Number(item.lanceAtual) || 0));
                    if (m.pago === true) return t + valor;
                    if (m.pago === undefined) return t + (Number(m.valorRecebido) || 0);
                    return t;
                  }, 0);
                  const pendente = Math.max(0, solicitado - recebido);
                  const atual = valorForm(chave);
                  const valorSugerido = (Number(atual.quantidade) || 0) * (Number(item.lanceAtual) || 0);

                  return (
                    <div className="erpItemCard" key={item.id}>
                      <div className="erpItemTop">
                        <div><span className="erpItemNumber">ITEM {item.numero}</span><h3>{item.descricao}</h3></div>
                        <span className="erpWonBadge">Ganho</span>
                      </div>

                      <div className="erpItemStats">
                        <Mini label="Qtd. ganha" value={String(qtdGanha)} />
                        <Mini label="Qtd. solicitada" value={String(qtdSolicitada)} />
                        <Mini label="Saldo disponível" value={String(saldoQtd)} />
                        <Mini label="Valor unitário" value={moeda(item.lanceAtual)} />
                        <Mini label="Valor solicitado" value={moeda(solicitado)} />
                        <Mini label="Pendente" value={moeda(pendente)} strong />
                      </div>

                      <div className="erpEntryForm requestOnly">
                        <label><span>Data do pedido</span><input type="date" value={atual.data} onChange={(e) => atualizarForm(chave, "data", e.target.value)} /></label>
                        <label><span>Qtd. solicitada</span><input type="number" min="0" max={saldoQtd} value={atual.quantidade} onChange={(e) => atualizarForm(chave, "quantidade", e.target.value)} placeholder="0" /></label>
                        <label><span>Valor da solicitação</span><input type="number" min="0" step="0.01" value={atual.valorSolicitado} onChange={(e) => atualizarForm(chave, "valorSolicitado", e.target.value)} placeholder={valorSugerido ? String(valorSugerido.toFixed(2)) : "0,00"} /></label>
                        <label className="erpEntryNote"><span>Observação</span><input value={atual.observacao} onChange={(e) => atualizarForm(chave, "observacao", e.target.value)} placeholder="Ex.: empenho, ordem de fornecimento..." /></label>
                        <button className="erpAddButton" type="button" onClick={() => adicionarSolicitacao(grupo.licitacao.id, item)}><Plus size={17} /> Registrar solicitação</button>
                      </div>

                      {lista.length > 0 && (
                        <div className="erpMovements">
                          <div className="erpMovementsHeader"><ReceiptText size={16} /><strong>Solicitações registradas</strong></div>
                          {lista.map((mov) => {
                            const valor = (Number(mov.valorSolicitado) || 0) || ((Number(mov.quantidadeSolicitada) || 0) * (Number(item.lanceAtual) || 0));
                            const pago = mov.pago === true || (mov.pago === undefined && (Number(mov.valorRecebido) || 0) >= valor && valor > 0);
                            return (
                              <div className="erpMovementRow paymentRow" key={mov.id}>
                                <span>{new Date(mov.data + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                                <span>{mov.quantidadeSolicitada} un. solicitada(s)</span>
                                <strong>{moeda(valor)}</strong>
                                <small>{mov.observacao || "Sem observação"}</small>
                                <span className={pago ? "erpPaidBadge" : "erpPendingBadge"}>{pago ? "Pago" : "Pendente"}</span>
                                {pago ? (
                                  <button className="erpUndoPayment" type="button" onClick={() => desfazerPagamento(grupo.licitacao.id, item.id, mov.id)} title="Desfazer pagamento">Desfazer</button>
                                ) : (
                                  <button className="erpPayButton" type="button" onClick={() => marcarPago(grupo.licitacao.id, item.id, mov.id)}><CreditCard size={14} /> Marcar pago</button>
                                )}
                                <button className="erpDeleteMovement" type="button" onClick={() => excluirMovimento(grupo.licitacao.id, item.id, mov.id)} title="Excluir lançamento"><Trash2 size={15} /></button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

function Metric({ titulo, valor, detalhe, positivo, destaque }: { titulo: string; valor: string; detalhe: string; positivo?: boolean; destaque?: boolean }) {
  return <div className={`erpMetric ${destaque ? "highlight" : ""}`}><span>{titulo}</span><strong className={positivo ? "positive" : ""}>{valor}</strong><small>{detalhe}</small></div>;
}

function Mini({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="erpMini"><span>{label}</span><strong className={strong ? "accent" : ""}>{value}</strong></div>;
}
