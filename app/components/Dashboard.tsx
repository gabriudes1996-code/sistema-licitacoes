"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleDollarSign, Clock3, Coins, FileText, Target, TrendingUp, XCircle } from "lucide-react";

type Licitacao = { id: number; orgao: string; edital: string; data: string; status: string };
type Item = { id?: number; quantidade: number; custo: number; frete: number; lanceAtual: number; resultado?: "em_disputa" | "ganhou" | "perdeu" };
type Movimento = { quantidadeSolicitada: number; valorRecebido: number; data?: string };

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
              totalRecebido += n(m.valorRecebido);
              totalSolicitado += n(m.quantidadeSolicitada) * n(item.lanceAtual);
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
    const aReceber = Math.max(0, solicitado - recebido);
    return { andamento, concluidas, perdidas, totalItens, custo, lances, lucro, margem, ganhos, aReceber };
  }, [licitacoes, itens, recebido, solicitado]);

  const pct = (v: number) => licitacoes.length ? Math.round(v / licitacoes.length * 100) : 0;
  const maxFinanceiro = Math.max(resumo.custo, resumo.lances, resumo.lucro, recebido, 1);
  const barra = (v: number) => `${Math.max(4, Math.min(100, (Math.abs(v) / maxFinanceiro) * 100))}%`;

  return (
    <section className="neoDashboard">
      <div className="neoIntro">
        <div>
          <span>VISÃO EXECUTIVA</span>
          <h2>Dashboard</h2>
          <p>Licitações, margem, contratos ganhos e recebimentos em uma única visão.</p>
        </div>
        <button onClick={carregar} type="button">Atualizar dados</button>
      </div>

      <div className="neoTopGrid">
        <RingCard titulo="Licitações" valor={String(licitacoes.length)} detalhe={`${resumo.totalItens} itens cadastrados`} percentual={100} classe="cyan" icon={<FileText size={17} />} />
        <RingCard titulo="Concluídas" valor={String(resumo.concluidas)} detalhe={`${pct(resumo.concluidas)}% do total`} percentual={pct(resumo.concluidas)} classe="pink" icon={<CheckCircle2 size={17} />} />
        <RingCard titulo="Itens ganhos" valor={String(resumo.ganhos)} detalhe="Itens com resultado vencedor" percentual={resumo.totalItens ? Math.round(resumo.ganhos / resumo.totalItens * 100) : 0} classe="lime" icon={<Target size={17} />} />

        <div className="neoMetricLarge">
          <span>MARGEM SOBRE O CUSTO</span>
          <strong>{resumo.margem.toFixed(1)}%</strong>
          <p>Lucro potencial dividido pelo custo dos itens ainda válidos.</p>
          <div className="neoProgress"><i style={{ width: `${Math.max(0, Math.min(100, resumo.margem))}%` }} /></div>
        </div>

        <div className="neoStatusPanel">
          <span>STATUS DAS LICITAÇÕES</span>
          <div><label>Em andamento <b>{resumo.andamento}</b></label><div><i className="orange" style={{ width: `${pct(resumo.andamento)}%` }} /></div></div>
          <div><label>Concluídas <b>{resumo.concluidas}</b></label><div><i className="cyan" style={{ width: `${pct(resumo.concluidas)}%` }} /></div></div>
          <div><label>Perdidas <b>{resumo.perdidas}</b></label><div><i className="pink" style={{ width: `${pct(resumo.perdidas)}%` }} /></div></div>
        </div>
      </div>

      <div className="neoMiddleGrid">
        <div className="neoChartCard">
          <div className="neoCardTitle"><span>FINANCEIRO</span><small>Comparativo atual</small></div>
          <div className="neoBars">
            <Bar label="Custo total" value={resumo.custo} width={barra(resumo.custo)} classe="purple" />
            <Bar label="Valor dos lances" value={resumo.lances} width={barra(resumo.lances)} classe="cyan" />
            <Bar label="Lucro potencial" value={resumo.lucro} width={barra(resumo.lucro)} classe="pink" />
            <Bar label="Recebido" value={recebido} width={barra(recebido)} classe="lime" />
          </div>
        </div>

        <div className="neoRecebimentosCard">
          <div className="neoCardTitle"><span>EXECUÇÃO DOS CONTRATOS</span><small>Valores realizados</small></div>
          <div className="neoMoneyRow"><div className="neoMoneyIcon cyan"><CircleDollarSign size={20}/></div><div><span>Valor solicitado</span><strong>{brl(solicitado)}</strong></div></div>
          <div className="neoMoneyRow"><div className="neoMoneyIcon lime"><Coins size={20}/></div><div><span>Valor recebido</span><strong>{brl(recebido)}</strong></div></div>
          <div className="neoMoneyRow"><div className="neoMoneyIcon pink"><TrendingUp size={20}/></div><div><span>A receber</span><strong>{brl(resumo.aReceber)}</strong></div></div>
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

function Bar({ label, value, width, classe }: { label: string; value: number; width: string; classe: string }) {
  return <div className="neoBarRow"><div><span>{label}</span><strong>{brl(value)}</strong></div><div className="neoBarTrack"><i className={classe} style={{ width }} /></div></div>;
}

function MiniStatus({ icon, titulo, valor, classe }: { icon: React.ReactNode; titulo: string; valor: number; classe: string }) {
  return <div className="neoMiniStatus"><div className={`neoMoneyIcon ${classe}`}>{icon}</div><div><span>{titulo}</span><strong>{valor}</strong></div></div>;
}
