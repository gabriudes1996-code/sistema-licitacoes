"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleDollarSign, Coins, FileText, Target, TrendingUp, Clock3, XCircle } from "lucide-react";

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
    let andamento = 0, concluidas = 0, perdidas = 0, totalItens = 0;
    let custo = 0, lances = 0, lucro = 0, ganhos = 0;

    licitacoes.forEach((l) => {
      const lista = itens[l.id] || [];
      totalItens += lista.length;
      const resultados = lista.map(i => i.resultado || "em_disputa");
      const todosFinalizados = lista.length > 0 && resultados.every(r => r === "ganhou" || r === "perdeu");
      const todosPerdidos = lista.length > 0 && resultados.every(r => r === "perdeu");

      if (todosFinalizados && !todosPerdidos) concluidas++;
      else if (todosPerdidos) perdidas++;
      else andamento++;

      lista.forEach((i) => {
        const qtd = n(i.quantidade);
        const custoItem = qtd * n(i.custo) + n(i.frete);
        if (i.resultado !== "perdeu") custo += custoItem;
        if (i.resultado === "ganhou") ganhos++;
        if (n(i.lanceAtual) > 0 && i.resultado !== "perdeu") {
          const lance = qtd * n(i.lanceAtual);
          lances += lance;
          lucro += lance - custoItem;
        }
      });
    });

    const margem = custo > 0 ? (lucro / custo) * 100 : 0;
    return { andamento, concluidas, perdidas, totalItens, custo, lances, lucro, margem, ganhos };
  }, [licitacoes, itens]);

  const pct = (v: number) => licitacoes.length ? Math.round(v / licitacoes.length * 100) : 0;

  return (
    <section className="neoDashboard">
      <div className="neoIntro">
        <div>
          <span>VISÃO EXECUTIVA</span>
          <h2>Dashboard</h2>
          <p>Licitações, margem e execução financeira em uma visão mais limpa.</p>
        </div>
        <button onClick={carregar} type="button">Atualizar dados</button>
      </div>

      <div className="neoTopGrid compact">
        <RingCard titulo="Licitações" valor={String(licitacoes.length)} detalhe={`${resumo.totalItens} itens cadastrados`} percentual={100} classe="cyan" icon={<FileText size={17} />} />
        <RingCard titulo="Concluídas" valor={String(resumo.concluidas)} detalhe={`${pct(resumo.concluidas)}% do total`} percentual={pct(resumo.concluidas)} classe="pink" icon={<CheckCircle2 size={17} />} />
        <RingCard titulo="Itens ganhos" valor={String(resumo.ganhos)} detalhe="Itens com resultado vencedor" percentual={resumo.totalItens ? Math.round(resumo.ganhos / resumo.totalItens * 100) : 0} classe="lime" icon={<Target size={17} />} />

        <div className="neoMetricLarge">
          <span>MARGEM SOBRE O CUSTO</span>
          <strong>{resumo.margem.toFixed(1)}%</strong>
          <p>Lucro potencial dividido pelo custo dos itens ainda válidos.</p>
          <div className="neoProgress"><i style={{ width: `${Math.max(0, Math.min(100, resumo.margem))}%` }} /></div>
        </div>
      </div>

      <div className="neoExecutionOnly">
        <div className="neoRecebimentosCard">
          <div className="neoCardTitle"><span>EXECUÇÃO DOS CONTRATOS</span><small>Solicitações e pagamentos</small></div>
          <div className="neoMoneyRow"><div className="neoMoneyIcon cyan"><CircleDollarSign size={20}/></div><div><span>Valor solicitado</span><strong>{brl(solicitado)}</strong></div></div>
          <div className="neoMoneyRow"><div className="neoMoneyIcon lime"><Coins size={20}/></div><div><span>Valor recebido</span><strong>{brl(recebido)}</strong></div></div>
          <div className="neoMoneyRow"><div className="neoMoneyIcon pink"><TrendingUp size={20}/></div><div><span>Valor total dos lances</span><strong>{brl(resumo.lances)}</strong></div></div>
          <div className="neoMoneyRow"><div className="neoMoneyIcon orange"><Target size={20}/></div><div><span>Custo total</span><strong>{brl(resumo.custo)}</strong></div></div>
        </div>
      </div>

      <div className="neoBottomGrid">
        <MiniStatus icon={<Clock3 size={18}/>} titulo="Em andamento" valor={resumo.andamento} classe="orange" />
        <MiniStatus icon={<CheckCircle2 size={18}/>} titulo="Concluídas" valor={resumo.concluidas} classe="cyan" />
        <MiniStatus icon={<XCircle size={18}/>} titulo="Perdidas" valor={resumo.perdidas} classe="pink" />
        <div className="neoProfitCard"><span>LUCRO POTENCIAL</span><strong>{brl(resumo.lucro)}</strong><small>Margem de {resumo.margem.toFixed(1)}% sobre o custo</small></div>
      </div>
    </section>
  );
}

function RingCard({ titulo, valor, detalhe, percentual, classe, icon }: { titulo: string; valor: string; detalhe: string; percentual: number; classe: string; icon: React.ReactNode }) {
  return <div className="neoRingCard"><div className={`neoRing ${classe}`} style={{ ["--pct" as string]: `${Math.max(0, Math.min(100, percentual)) * 3.6}deg` }}><div>{valor}</div></div><div className="neoRingText"><span>{icon}{titulo}</span><small>{detalhe}</small></div></div>;
}

function MiniStatus({ icon, titulo, valor, classe }: { icon: React.ReactNode; titulo: string; valor: number; classe: string }) {
  return <div className="neoMiniStatus"><div className={`neoMoneyIcon ${classe}`}>{icon}</div><div><span>{titulo}</span><strong>{valor}</strong></div></div>;
}
