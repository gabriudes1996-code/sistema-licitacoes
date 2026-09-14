"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgePercent, CircleDollarSign, Coins, FileText, Hourglass, Target, TrendingUp, WalletCards } from "lucide-react";

type Licitacao = { id: number; orgao: string; edital: string; data: string; status: string };
type Item = { id?: number; quantidade: number; custo: number; frete: number; lanceAtual: number; resultado?: "em_disputa" | "ganhou" | "perdeu" };
type Movimento = { quantidadeSolicitada?: number; valorSolicitado?: number; valorRecebido?: number; pago?: boolean; data?: string };

const LICITACOES_KEY = "licitapro_licitacoes";
const ITENS_PREFIX = "licitapro_itens_";
const EXEC_PREFIX = "licitapro_execucao_";
const brl = (v: number) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const n = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;

export default function Dashboard() {
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);
  const [itens, setItens] = useState<Record<number, Item[]>>({});
  const [recebido, setRecebido] = useState(0);
  const [solicitado, setSolicitado] = useState(0);

  const carregar = () => {
    try {
      const lista: Licitacao[] = JSON.parse(localStorage.getItem(LICITACOES_KEY) || "[]");
      const mapa: Record<number, Item[]> = {};
      let totalRecebido = 0;
      let totalSolicitado = 0;

      lista.forEach((l) => {
        let listaItens: Item[] = [];
        try { listaItens = JSON.parse(localStorage.getItem(ITENS_PREFIX + l.id) || "[]"); } catch {}
        mapa[l.id] = Array.isArray(listaItens) ? listaItens : [];

        mapa[l.id].forEach((item) => {
          if (item.resultado !== "ganhou" || !item.id) return;
          try {
            const movimentos: Movimento[] = JSON.parse(localStorage.getItem(`${EXEC_PREFIX}${l.id}_${item.id}`) || "[]");
            movimentos.forEach((m) => {
              const valorSolicitacao = n(m.valorSolicitado) || (n(m.quantidadeSolicitada) * n(item.lanceAtual));
              totalSolicitado += valorSolicitacao;
              if (m.pago === true) totalRecebido += valorSolicitacao;
              else if (m.pago === undefined) totalRecebido += n(m.valorRecebido);
            });
          } catch {}
        });
      });

      setLicitacoes(Array.isArray(lista) ? lista : []);
      setItens(mapa);
      setRecebido(totalRecebido);
      setSolicitado(totalSolicitado);
    } catch {
      setLicitacoes([]);
      setItens({});
      setRecebido(0);
      setSolicitado(0);
    }
  };

  useEffect(() => {
    carregar();
    const timer = setInterval(carregar, 1000);
    window.addEventListener("storage", carregar);
    return () => { clearInterval(timer); window.removeEventListener("storage", carregar); };
  }, []);

  const resumo = useMemo(() => {
    let andamento = 0, concluidas = 0, perdidas = 0;
    let custoGanhos = 0, valorGanhos = 0;

    licitacoes.forEach((l) => {
      const lista = itens[l.id] || [];
      const resultados = lista.map(i => i.resultado || "em_disputa");
      const todosFinalizados = lista.length > 0 && resultados.every(r => r === "ganhou" || r === "perdeu");
      const todosPerdidos = lista.length > 0 && resultados.every(r => r === "perdeu");

      if (todosFinalizados && !todosPerdidos) concluidas++;
      else if (todosPerdidos) perdidas++;
      else andamento++;

      lista.forEach((i) => {
        if (i.resultado !== "ganhou") return;
        const qtd = n(i.quantidade);
        custoGanhos += qtd * n(i.custo) + n(i.frete);
        valorGanhos += qtd * n(i.lanceAtual);
      });
    });

    const lucroPotencial = valorGanhos - custoGanhos;
    const margem = custoGanhos > 0 ? (lucroPotencial / custoGanhos) * 100 : 0;
    const taxaSucesso = (concluidas + perdidas) > 0 ? (concluidas / (concluidas + perdidas)) * 100 : 0;
    const saldoContrato = Math.max(0, valorGanhos - solicitado);
    const pendentePagamento = Math.max(0, solicitado - recebido);
    const percentualRecebido = solicitado > 0 ? (recebido / solicitado) * 100 : 0;

    return { andamento, concluidas, perdidas, custoGanhos, valorGanhos, lucroPotencial, margem, taxaSucesso, saldoContrato, pendentePagamento, percentualRecebido };
  }, [licitacoes, itens, recebido, solicitado]);

  return (
    <section className="neoDashboard">
      <div className="neoIntro">
        <div>
          <span>VISÃO EXECUTIVA</span>
          <h2>Dashboard</h2>
          <p>Resumo claro das licitações, resultado financeiro e recebimentos.</p>
        </div>
        <button onClick={carregar} type="button">Atualizar dados</button>
      </div>

      <div className="neoTopGrid clean">
        <RingCard titulo="Licitações" valor={String(licitacoes.length)} detalhe={`${resumo.andamento} em andamento`} percentual={100} classe="cyan" icon={<FileText size={17} />} />
        <RingCard titulo="Taxa de sucesso" valor={`${resumo.taxaSucesso.toFixed(0)}%`} detalhe={`${resumo.concluidas} concluídas • ${resumo.perdidas} perdidas`} percentual={resumo.taxaSucesso} classe="pink" icon={<BadgePercent size={17} />} />
        <div className="neoMetricLarge">
          <span>MARGEM SOBRE O CUSTO</span>
          <strong>{resumo.margem.toFixed(1)}%</strong>
          <p>Percentual de lucro sobre o custo total dos itens ganhos.</p>
          <div className="neoProgress"><i style={{ width: `${Math.max(0, Math.min(100, resumo.margem))}%` }} /></div>
        </div>
      </div>

      <div className="neoDashboardSections">
        <div className="neoSectionBlock">
          <div className="neoSectionHeader"><span>EXECUÇÃO DOS CONTRATOS</span><small>Pedidos e pagamentos das prefeituras</small></div>
          <div className="neoExecutionStack">
            <Money icon={<CircleDollarSign size={20}/>} classe="cyan" label="Valor solicitado" value={brl(solicitado)} detail="Total que as prefeituras já pediram" />
            <Money icon={<Coins size={20}/>} classe="lime" label="Valor recebido" value={brl(recebido)} detail={`${resumo.percentualRecebido.toFixed(0)}% do valor solicitado`} />
            <Money icon={<Hourglass size={20}/>} classe="pink" label="Pendente de pagamento" value={brl(resumo.pendentePagamento)} detail="Solicitado e ainda não pago" />
            <Money icon={<WalletCards size={20}/>} classe="orange" label="Saldo do contrato" value={brl(resumo.saldoContrato)} detail="Valor ganho que ainda não foi solicitado" />
          </div>
        </div>

        <div className="neoSectionBlock">
          <div className="neoSectionHeader"><span>RESULTADO FINANCEIRO</span><small>Somente itens ganhos</small></div>
          <div className="neoFinancialStack">
            <InfoCard icon={<Target size={18}/>} titulo="Valor ganho" valor={brl(resumo.valorGanhos)} detalhe="Valor total vendido nos itens vencedores" classe="cyan" />
            <InfoCard icon={<WalletCards size={18}/>} titulo="Custo dos ganhos" valor={brl(resumo.custoGanhos)} detalhe="Custo + frete dos itens ganhos" classe="orange" />
            <InfoCard icon={<TrendingUp size={18}/>} titulo="Lucro potencial" valor={brl(resumo.lucroPotencial)} detalhe="Valor ganho menos custo dos ganhos" classe="lime" />
          </div>
        </div>
      </div>
    </section>
  );
}

function RingCard({ titulo, valor, detalhe, percentual, classe, icon }: { titulo: string; valor: string; detalhe: string; percentual: number; classe: string; icon: React.ReactNode }) {
  return <div className="neoRingCard"><div className={`neoRing ${classe}`} style={{ ["--pct" as string]: `${Math.max(0, Math.min(100, percentual)) * 3.6}deg` }}><div>{valor}</div></div><div className="neoRingText"><span>{icon}{titulo}</span><small>{detalhe}</small></div></div>;
}

function Money({ icon, classe, label, value, detail }: { icon: React.ReactNode; classe: string; label: string; value: string; detail: string }) {
  return <div className="neoMoneyRow vertical"><div className={`neoMoneyIcon ${classe}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>;
}

function InfoCard({ icon, titulo, valor, detalhe, classe }: { icon: React.ReactNode; titulo: string; valor: string; detalhe: string; classe: string }) {
  return <div className="neoMiniStatus neoInfoCard vertical"><div className={`neoMoneyIcon ${classe}`}>{icon}</div><div><span>{titulo}</span><strong>{valor}</strong><small>{detalhe}</small></div></div>;
}
