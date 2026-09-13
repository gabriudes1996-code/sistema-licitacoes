"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, FileText, Printer, CalendarDays } from "lucide-react";

type Licitacao = { id: number; orgao: string; edital: string; modalidade: string; data: string; status: string; observacoes: string; valorEstimado: number };
type Item = { id: number; numero: number; descricao: string; quantidade: number; valorEstimado: number; custo: number; frete: number; margemDesejada: number; lanceAtual: number; resultado: "em_disputa" | "ganhou" | "perdeu" };
type Relatorio = { licitacao: Licitacao; itens: Item[]; custo: number; valorLances: number; lucro: number };

const STORAGE_KEY = "licitapro_licitacoes";
const PREFIX = "licitapro_itens_";
const moeda = (v: number) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function dataSegura(valor: string) {
  if (!valor) return null;
  const br = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));
  const iso = new Date(valor + (valor.length === 10 ? "T12:00:00" : ""));
  return Number.isNaN(iso.getTime()) ? null : iso;
}

export default function Relatorios() {
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [aberta, setAberta] = useState<number | null>(null);
  const [aba, setAba] = useState<"licitacoes" | "mensal">("licitacoes");

  const carregar = () => {
    try {
      const licitacoes: Licitacao[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setRelatorios(licitacoes.map((licitacao) => {
        let todos: Item[] = [];
        try { todos = JSON.parse(localStorage.getItem(PREFIX + licitacao.id) || "[]"); } catch {}
        const itens = todos.filter(i => i.resultado !== "perdeu");
        const custo = itens.reduce((t, i) => t + (Number(i.quantidade)||0)*(Number(i.custo)||0) + (Number(i.frete)||0), 0);
        const valorLances = itens.reduce((t, i) => t + (Number(i.quantidade)||0)*(Number(i.lanceAtual)||0), 0);
        return { licitacao, itens, custo, valorLances, lucro: valorLances - custo };
      }));
    } catch { setRelatorios([]); }
  };

  useEffect(() => {
    carregar();
    const timer = setInterval(carregar, 1000);
    window.addEventListener("storage", carregar);
    return () => { clearInterval(timer); window.removeEventListener("storage", carregar); };
  }, []);

  const mensal = useMemo(() => {
    const mapa: Record<string, { rotulo: string; lucro: number; custo: number; licitacoes: number }> = {};
    relatorios.forEach(r => {
      const d = dataSegura(r.licitacao.data);
      if (!d) return;
      const chave = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const rotulo = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      if (!mapa[chave]) mapa[chave] = { rotulo, lucro: 0, custo: 0, licitacoes: 0 };
      mapa[chave].lucro += r.lucro;
      mapa[chave].custo += r.custo;
      mapa[chave].licitacoes += 1;
    });
    return Object.entries(mapa).sort(([a],[b]) => b.localeCompare(a)).map(([chave,v]) => ({ chave, ...v }));
  }, [relatorios]);

  const exportarPDF = () => window.print();

  return (
    <div className="page">
      <div className="pageHeader">
        <div><h1>Relatórios</h1><p>Acompanhe custos, lucro potencial e resultados por mês.</p></div>
        <button className="primaryButton" onClick={exportarPDF} type="button"><Printer size={17}/> Exportar PDF</button>
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:20 }} className="no-print">
        <button className={aba === "licitacoes" ? "primaryButton" : "dashboardRefresh"} onClick={() => setAba("licitacoes")} type="button"><FileText size={16}/> Por licitação</button>
        <button className={aba === "mensal" ? "primaryButton" : "dashboardRefresh"} onClick={() => setAba("mensal")} type="button"><CalendarDays size={16}/> Relatório mensal</button>
      </div>

      {aba === "mensal" ? (
        <div className="contentCard">
          <div className="contentCardHeader"><div><h2>Lucro potencial por mês</h2><p>Soma do lucro potencial das licitações conforme a data cadastrada.</p></div></div>
          {mensal.length === 0 ? <div className="emptyState"><CalendarDays size={40}/><h3>Sem dados mensais</h3><p>Cadastre a data das licitações para gerar o relatório mensal.</p></div> : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(250px, 1fr))", gap:16 }}>
              {mensal.map(m => <div className="statCard" key={m.chave}><div><span style={{ textTransform:"capitalize" }}>{m.rotulo}</span><strong className={m.lucro >= 0 ? "lucroPositivo" : "lucroNegativo"}>{moeda(m.lucro)}</strong><small>{m.licitacoes} licitação(ões) • custo {moeda(m.custo)}</small></div></div>)}
            </div>
          )}
        </div>
      ) : relatorios.length === 0 ? (
        <div className="contentCard"><div className="emptyState"><FileText size={40}/><h3>Nenhuma licitação salva</h3><p>As licitações cadastradas aparecerão aqui automaticamente.</p></div></div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))", gap:16, alignItems:"start" }}>
          {relatorios.map(r => {
            const abertaAgora = aberta === r.licitacao.id;
            return <div className="contentCard" key={r.licitacao.id} style={{ margin:0 }}>
              <button type="button" onClick={() => setAberta(abertaAgora ? null : r.licitacao.id)} style={{ width:"100%", border:0, background:"transparent", color:"inherit", padding:0, textAlign:"left", cursor:"pointer" }}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:16 }}><div><span style={{fontSize:12,opacity:.65}}>LICITAÇÃO</span><h2 style={{margin:"5px 0"}}>{r.licitacao.orgao || `Licitação #${r.licitacao.id}`}</h2><span style={{opacity:.7}}>{r.licitacao.edital ? `Edital ${r.licitacao.edital}` : `${r.itens.length} item(ns)`}</span></div>{abertaAgora ? <ChevronUp/> : <ChevronDown/>}</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:22 }}><div className="statCard"><div><span>Valor de custo</span><strong>{moeda(r.custo)}</strong></div></div><div className="statCard"><div><span>Lucro potencial</span><strong className={r.lucro >= 0 ? "lucroPositivo" : "lucroNegativo"}>{moeda(r.lucro)}</strong></div></div></div>
              </button>
              {abertaAgora && <div style={{marginTop:22,borderTop:"1px solid rgba(128,128,128,.2)",paddingTop:18}}><h3>Itens participantes</h3><div className="tableWrapper"><table className="reportTable"><thead><tr><th>ITEM</th><th>DESCRIÇÃO</th><th>QTD.</th><th>ESTIMADO</th><th>CUSTO</th><th>LANCE</th><th>RESULTADO</th></tr></thead><tbody>{r.itens.map(i => <tr key={i.id}><td><strong>{i.numero}</strong></td><td>{i.descricao}</td><td>{i.quantidade}</td><td>{moeda((Number(i.valorEstimado)||0)*(Number(i.quantidade)||0))}</td><td>{moeda((Number(i.custo)||0)*(Number(i.quantidade)||0)+(Number(i.frete)||0))}</td><td>{moeda((Number(i.lanceAtual)||0)*(Number(i.quantidade)||0))}</td><td>{i.resultado === "ganhou" ? "Ganhou" : "Em disputa"}</td></tr>)}</tbody></table></div></div>}
            </div>;
          })}
        </div>
      )}
    </div>
  );
}
