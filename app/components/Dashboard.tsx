"use client";
import {useEffect,useMemo,useState,type ReactNode}from"react";
import{BadgePercent,Banknote,CircleDollarSign,Coins,FileText,Hourglass,ReceiptText,Target,TrendingUp,WalletCards}from"lucide-react";

type Licitacao={id:number};
type Item={id?:number;quantidade:number;custo:number;frete:number;lanceAtual:number;resultado?:"em_disputa"|"ganhou"|"perdeu"};
type Movimento={quantidadeSolicitada?:number;valorSolicitado?:number;valorRecebido?:number;pago?:boolean};
type Custo={valor:number;pago?:boolean;vencimento?:string};
const LK="licitapro_licitacoes",IP="licitapro_itens_",EP="licitapro_execucao_",CK="licitapro_custos_empresa";
const brl=(v:number)=>(Number(v)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const n=(v:unknown)=>Number.isFinite(Number(v))?Number(v):0;

export default function Dashboard(){
 const[licitacoes,setLicitacoes]=useState<Licitacao[]>([]),[itens,setItens]=useState<Record<number,Item[]>>({}),[recebido,setRecebido]=useState(0),[solicitado,setSolicitado]=useState(0),[pagos,setPagos]=useState(0),[gastoLicitacao,setGastoLicitacao]=useState(0);
 const carregar=()=>{try{
  const ls:Licitacao[]=JSON.parse(localStorage.getItem(LK)||"[]"),map:Record<number,Item[]>={};let rec=0,sol=0,gastoPedidos=0;
  ls.forEach(l=>{try{map[l.id]=JSON.parse(localStorage.getItem(IP+l.id)||"[]")}catch{map[l.id]=[]};(map[l.id]||[]).forEach(i=>{if(i.resultado!=="ganhou"||!i.id)return;try{const ms:Movimento[]=JSON.parse(localStorage.getItem(`${EP}${l.id}_${i.id}`)||"[]");ms.forEach(m=>{const q=n(m.quantidadeSolicitada),v=n(m.valorSolicitado)||q*n(i.lanceAtual);sol+=v;gastoPedidos+=q*n(i.custo)+(n(i.quantidade)>0?n(i.frete)*(q/n(i.quantidade)):0);if(m.pago===true)rec+=v;else if(m.pago===undefined)rec+=n(m.valorRecebido)})}catch{}})});
  let cs:Custo[]=[];try{cs=JSON.parse(localStorage.getItem(CK)||"[]")}catch{}
  setPagos(cs.filter(c=>c.pago).reduce((s,c)=>s+n(c.valor),0));setGastoLicitacao(gastoPedidos);setLicitacoes(ls);setItens(map);setRecebido(rec);setSolicitado(sol)
 }catch{}};
 useEffect(()=>{carregar();const t=setInterval(carregar,1000);window.addEventListener("storage",carregar);window.addEventListener("licitapro-custos-updated",carregar);return()=>{clearInterval(t);window.removeEventListener("storage",carregar);window.removeEventListener("licitapro-custos-updated",carregar)}},[]);
 const r=useMemo(()=>{let andamento=0,concluidas=0,perdidas=0,custoGanhos=0,valorGanhos=0;licitacoes.forEach(l=>{const lista=itens[l.id]||[],rs=lista.map(i=>i.resultado||"em_disputa"),final=lista.length>0&&rs.every(x=>x==="ganhou"||x==="perdeu"),lost=lista.length>0&&rs.every(x=>x==="perdeu");if(final&&!lost)concluidas++;else if(lost)perdidas++;else andamento++;lista.forEach(i=>{if(i.resultado==="ganhou"){custoGanhos+=n(i.quantidade)*n(i.custo)+n(i.frete);valorGanhos+=n(i.quantidade)*n(i.lanceAtual)}})});const lucro=valorGanhos-custoGanhos,margem=custoGanhos?lucro/custoGanhos*100:0,taxa=concluidas+perdidas?concluidas/(concluidas+perdidas)*100:0,pend=Math.max(0,solicitado-recebido),caixa=recebido>0?recebido-pagos-gastoLicitacao:0;return{andamento,concluidas,perdidas,valorGanhos,lucro,margem,taxa,pend,caixa}},[licitacoes,itens,recebido,solicitado,pagos,gastoLicitacao]);
 return <section className="neoDashboard simplifiedDashboard">
  <div className="neoIntro"><div><span>VISÃO DA EMPRESA</span><h2>Dashboard</h2><p>Resumo operacional e financeiro da empresa.</p></div><button onClick={carregar}>Atualizar dados</button></div>
  <div className="dashSection"><div className="dashSectionTitle">OPERAÇÃO</div><div className="dashOperationGrid">
   <RingCard titulo="Em andamento" valor={String(r.andamento)} detalhe="Licitações abertas" percentual={licitacoes.length?r.andamento/licitacoes.length*100:0} classe="cyan" icon={<FileText size={17}/>}/>
   <RingCard titulo="Taxa de sucesso" valor={`${r.taxa.toFixed(0)}%`} detalhe={`${r.concluidas} ganhas • ${r.perdidas} perdidas`} percentual={r.taxa} classe="pink" icon={<BadgePercent size={17}/>}/>
   <TopMoney icon={<Target size={19}/>} classe="cyan" label="Valor ganho" value={brl(r.valorGanhos)} detail="Total contratado nos itens ganhos"/>
   <TopMoney icon={<TrendingUp size={19}/>} classe="lime" label="Lucro potencial" value={brl(r.lucro)} detail="Valor ganho menos custo dos ganhos"/>
   <div className="neoMetricLarge compact"><span>MARGEM SOBRE O CUSTO</span><strong>{r.margem.toFixed(1)}%</strong><p>Lucro potencial sobre o custo.</p><div className="neoProgress"><i style={{width:`${Math.max(0,Math.min(100,r.margem))}%`}}/></div></div>
  </div></div>
  <div className="dashSection"><div className="dashSectionTitle">FLUXO FINANCEIRO</div><div className="dashFinanceGrid">
   <TopMoney icon={<CircleDollarSign size={20}/>} classe="cyan" label="Valor solicitado" value={brl(solicitado)} detail="Pedidos feitos pelas prefeituras"/>
   <TopMoney icon={<Hourglass size={20}/>} classe="cyan" label="A receber" value={brl(r.pend)} detail="Solicitado e ainda não pago"/>
   <TopMoney icon={<Coins size={20}/>} classe="lime" label="Valor recebido" value={brl(recebido)} detail="Somente pagamentos confirmados"/>
   <TopMoney icon={<Banknote size={22}/>} classe="lime caixaPrincipal" label="Dinheiro em caixa" value={brl(r.caixa)} detail={recebido>0?"Recebido − despesas pagas":"Fica zerado até entrar o primeiro recebimento"}/>
  </div></div>
  <div className="dashSection"><div className="dashSectionTitle">DESPESAS</div><div className="dashExpenseGrid">
   <TopMoney icon={<WalletCards size={20}/>} classe="danger" label="Gasto em licitação" value={brl(gastoLicitacao)} detail="Custo dos pedidos feitos pelas prefeituras"/>
   <TopMoney icon={<ReceiptText size={20}/>} classe="danger" label="Gastos da empresa" value={brl(pagos)} detail="Total das contas da empresa já pagas"/>
  </div></div>
 </section>
}
function RingCard({titulo,valor,detalhe,percentual,classe,icon}:{titulo:string;valor:string;detalhe:string;percentual:number;classe:string;icon:ReactNode}){return <div className="neoRingCard"><div className={`neoRing ${classe}`} style={{["--pct" as string]:`${Math.max(0,Math.min(100,percentual))*3.6}deg`}}><div>{valor}</div></div><div className="neoRingText"><span>{icon}{titulo}</span><small>{detalhe}</small></div></div>}
function TopMoney({icon,classe,label,value,detail}:{icon:ReactNode;classe:string;label:string;value:string;detail:string}){return <div className={`neoTopMoney ${classe}`}><div className={`neoMoneyIcon ${classe}`}>{icon}</div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>}
