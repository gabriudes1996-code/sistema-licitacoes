"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
      setLicitacoes([]); setItens({}); setRecebido(0); setSolicitado(0);
    }
  };

  useEffect(() => {
    carregar();
    const timer = setInterval(carregar, 1000);
    window.addEventListener("storage", carregar);
    return () => { clearInterval(timer); window.removeEventListener("storage", carregar); };
  }, []);

  const resumo = useMemo(() => {
    let andamento = 0, concluidas = 0, perdidas = 0, custoGanhos = 0, valorGanhos = 0;
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
        <div><span>VISÃO EXECUTIVA</span><h2>Dashboard</h2><p>Licitações, contratos e resultado financeiro em uma visão organizada.</p></div>
        <button onClick={carregar} type="button">Atualizar dados</button>
      </div>

      <div className="neoTopGrid neoTopGridFive">
        <RingCard titulo="Licitações" valor={String(licitacoes.length)} detalhe={`${resumo.andamento} em andamento`} percentual={100} classe="cyan" icon={<FileText size={17} />} />
        <RingCard titulo="Taxa de sucesso" valor={`${resumo.taxaSucesso.toFixed(0)}%`} detalhe={`${resumo.concluidas} concluídas • ${resumo.perdidas} perdidas`} percentual={resumo.taxaSucesso} classe="pink" icon={<BadgePercent size={17} />} />
        <TopMoney icon={<Target size={19}/>} classe="cyan" label="Valor ganho" value={brl(resumo.valorGanhos)} detail="Total dos itens vencidos nas licitações" />
        <TopMoney icon={<TrendingUp size={19}/>} classe="lime" label="Lucro potencial" value={brl(resumo.lucroPotencial)} detail="Valor ganho menos custo dos ganhos" />
        <div className="neoMetricLarge compact"><span>MARGEM SOBRE O CUSTO</span><strong>{resumo.margem.toFixed(1)}%</strong><p>Lucro potencial em relação ao custo dos itens ganhos.</p><div className="neoProgress"><i style={{ width: `${Math.max(0, Math.min(100, resumo.margem))}%` }} /></div></div>
      </div>

      <div className="neoGroupedDashboard neoContractVisual">
        <div className="neoSectionHeader"><span>EXECUÇÃO DOS CONTRATOS</span><small>Do pedido da prefeitura até o recebimento</small></div>
        <div className="neoPaymentFlow">
          <Money icon={<CircleDollarSign size={21}/>} classe="cyan" label="Valor solicitado" value={brl(solicitado)} detail="Total já solicitado pelas prefeituras" />
          <div className="neoFlowConnector"><span>↓</span></div>
          <Money icon={<Hourglass size={21}/>} classe="pink" label="Pendente de pagamento" value={brl(resumo.pendentePagamento)} detail="Valor solicitado que ainda não foi pago" />
          <div className="neoFlowConnector"><span>↓</span></div>
          <Money icon={<Coins size={21}/>} classe="lime" label="Valor recebido" value={brl(recebido)} detail={`${resumo.percentualRecebido.toFixed(0)}% do solicitado já foi pago`} />
        </div>

        <div className="neoBottomFinancials">
          <InfoCard icon={<WalletCards size={18}/>} titulo="Custo dos ganhos" valor={brl(resumo.custoGanhos)} detalhe="Custo + frete dos itens vencedores" classe="orange" />
          <InfoCard icon={<WalletCards size={18}/>} titulo="Saldo do contrato" valor={brl(resumo.saldoContrato)} detalhe="Valor ganho ainda não solicitado" classe="cyan" />
        </div>
      </div>
    </section>
  );
}

function RingCard({ titulo, valor, detalhe, percentual, classe, icon }: { titulo: string; valor: string; detalhe: string; percentual: number; classe: string; icon: ReactNode }) {
  return <div className="neoRingCard"><div className={`neoRing ${classe}`} style={{ ["--pct" as string]: `${Math.max(0, Math.min(100, percentual)) * 3.6}deg` }}><div>{valor}</div></div><div className="neoRingText"><span>{icon}{titulo}</span><small>{detalhe}</small></div></div>;
}
function TopMoney({ icon, classe, label, value, detail }: { icon: ReactNode; classe: string; label: string; value: string; detail: string }) {
  return <div className={`neoTopMoney ${classe}`}><div className={`neoMoneyIcon ${classe}`}>{icon}</div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}
function Money({ icon, classe, label, value, detail }: { icon: ReactNode; classe: string; label: string; value: string; detail: string }) {
  return <div className={`neoMoneyRow grouped flow ${classe}`}><div className={`neoMoneyIcon ${classe}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>;
}
function InfoCard({ icon, titulo, valor, detalhe, classe }: { icon: ReactNode; titulo: string; valor: string; detalhe: string; classe: string }) {
  return <div className="neoMiniStatus neoInfoCard grouped"><div className={`neoMoneyIcon ${classe}`}>{icon}</div><div><span>{titulo}</span><strong>{valor}</strong><small>{detalhe}</small></div></div>;
}
