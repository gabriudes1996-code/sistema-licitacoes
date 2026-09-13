"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Clock3, CheckCircle2, XCircle, DollarSign, TrendingUp } from "lucide-react";

type Licitacao = { id: number; orgao: string; edital: string; data: string; status: string };
type Item = { quantidade: number; valorEstimado: number; custo: number; frete: number; lanceAtual: number; resultado?: "em_disputa" | "ganhou" | "perdeu" };

const LICITACOES_KEY = "licitapro_licitacoes";
const ITENS_PREFIX = "licitapro_itens_";
const brl = (v: number) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const n = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;

export default function Dashboard() {
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);
  const [itens, setItens] = useState<Record<number, Item[]>>({});

  const carregar = () => {
    try {
      const lista: Licitacao[] = JSON.parse(localStorage.getItem(LICITACOES_KEY) || "[]");
      const mapa: Record<number, Item[]> = {};
      lista.forEach((l) => {
        try { mapa[l.id] = JSON.parse(localStorage.getItem(ITENS_PREFIX + l.id) || "[]"); }
        catch { mapa[l.id] = []; }
      });
      setLicitacoes(Array.isArray(lista) ? lista : []);
      setItens(mapa);
    } catch { setLicitacoes([]); setItens({}); }
  };

  useEffect(() => {
    carregar();
    const timer = setInterval(carregar, 1000);
    window.addEventListener("storage", carregar);
    return () => { clearInterval(timer); window.removeEventListener("storage", carregar); };
  }, []);

  const resumo = useMemo(() => {
    let andamento = 0, concluidas = 0, perdidas = 0, totalItens = 0;
    let estimado = 0, custo = 0, lances = 0, lucro = 0;

    licitacoes.forEach((l) => {
      const lista = itens[l.id] || [];
      totalItens += lista.length;
      const resultados = lista.map(i => i.resultado || "em_disputa");
      const todosFinalizados = lista.length > 0 && resultados.every(r => r === "ganhou" || r === "perdeu");
      const todosGanhos = lista.length > 0 && resultados.every(r => r === "ganhou");
      const todosPerdidos = lista.length > 0 && resultados.every(r => r === "perdeu");

      if (todosGanhos || (todosFinalizados && !todosPerdidos)) concluidas++;
      else if (todosPerdidos) perdidas++;
      else andamento++;

      lista.forEach((i) => {
        const qtd = n(i.quantidade);
        estimado += qtd * n(i.valorEstimado);
        const custoItem = qtd * n(i.custo) + n(i.frete);
        custo += custoItem;
        if (n(i.lanceAtual) > 0 && i.resultado !== "perdeu") {
          const lance = qtd * n(i.lanceAtual);
          lances += lance;
          lucro += lance - custoItem;
        }
      });
    });
    return { andamento, concluidas, perdidas, totalItens, estimado, custo, lances, lucro };
  }, [licitacoes, itens]);

  const pct = (v: number) => licitacoes.length ? Math.round(v / licitacoes.length * 100) : 0;

  return (
    <section className="dashboardPage">
      <div className="dashboardHeader">
        <div><h2>Dashboard</h2><p>Visão geral das licitações e resultados financeiros.</p></div>
        <button className="dashboardRefresh" onClick={carregar} type="button">Atualizar dados</button>
      </div>

      <div className="dashboardCards">
        <Card icon={<ClipboardList size={20}/>} classe="blue" titulo="Total de licitações" valor={String(licitacoes.length)} detalhe={`${resumo.totalItens} itens cadastrados`} />
        <Card icon={<Clock3 size={20}/>} classe="orange" titulo="Em andamento" valor={String(resumo.andamento)} detalhe={`${pct(resumo.andamento)}% das licitações`} />
        <Card icon={<CheckCircle2 size={20}/>} classe="green" titulo="Concluídas" valor={String(resumo.concluidas)} detalhe={`${pct(resumo.concluidas)}% das licitações`} />
        <Card icon={<XCircle size={20}/>} classe="red" titulo="Perdidas" valor={String(resumo.perdidas)} detalhe={`${pct(resumo.perdidas)}% das licitações`} />
      </div>

      <div className="dashboardFinancialGrid">
        <Financeiro titulo="Valor estimado" valor={brl(resumo.estimado)} />
        <Financeiro titulo="Custo total" valor={brl(resumo.custo)} />
        <Financeiro titulo="Valor dos lances" valor={brl(resumo.lances)} />
        <Financeiro titulo="Lucro potencial" valor={brl(resumo.lucro)} lucro />
      </div>

      <div className="dashboardResultGrid">
        <div className="dashboardResultCard">
          <div className="dashboardResultHeader"><div><span>Lucro potencial</span><h3 className={resumo.lucro >= 0 ? "profitPositive" : "profitNegative"}>{brl(resumo.lucro)}</h3></div><div className="resultIcon green"><TrendingUp size={21}/></div></div>
          <p>Considera os itens ganhos ou ainda em disputa. Itens perdidos não entram no lucro potencial.</p>
        </div>
      </div>
    </section>
  );
}

function Card({ icon, classe, titulo, valor, detalhe }: { icon: React.ReactNode; classe: string; titulo: string; valor: string; detalhe: string }) {
  return <div className="dashboardCard"><div className={`dashboardCardIcon ${classe}`}>{icon}</div><div><span>{titulo}</span><strong>{valor}</strong><small>{detalhe}</small></div></div>;
}

function Financeiro({ titulo, valor, lucro = false }: { titulo: string; valor: string; lucro?: boolean }) {
  return <div className="dashboardFinancialCard"><div className="dashboardFinancialIcon"><DollarSign size={20}/></div><div><span>{titulo}</span><strong className={lucro ? "profitPositive" : ""}>{valor}</strong></div></div>;
}
