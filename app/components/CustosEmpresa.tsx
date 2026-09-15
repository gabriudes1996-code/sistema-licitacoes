"use client";

import { useMemo, useState } from "react";
import { Building2, CreditCard, Plus, ReceiptText, Repeat2, Trash2, Wifi, Zap } from "lucide-react";

type CustoEmpresa={id:number;descricao:string;categoria:string;valor:number;vencimento:string;observacao:string;recorrente?:boolean;frequencia?:"Mensal"|"Semanal"|"Anual"};
const KEY="licitapro_custos_empresa";
const brl=(v:number)=>(Number(v)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

export default function CustosEmpresa(){
 const [custos,setCustos]=useState<CustoEmpresa[]>(()=>{if(typeof window==="undefined")return[];try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}});
 const [descricao,setDescricao]=useState(""),[categoria,setCategoria]=useState("Aluguel"),[valor,setValor]=useState(""),[vencimento,setVencimento]=useState(""),[observacao,setObservacao]=useState(""),[recorrente,setRecorrente]=useState(false),[frequencia,setFrequencia]=useState<"Mensal"|"Semanal"|"Anual">("Mensal");
 const salvar=(lista:CustoEmpresa[])=>{setCustos(lista);localStorage.setItem(KEY,JSON.stringify(lista));window.dispatchEvent(new Event("licitapro-custos-updated"))};
 const adicionar=()=>{if(!descricao.trim()){alert("Informe a descrição da conta.");return}if(!(Number(valor)>0)){alert("Informe o valor da conta.");return}salvar([{id:Date.now(),descricao:descricao.trim(),categoria,valor:Number(valor),vencimento,observacao:observacao.trim(),recorrente,frequencia:recorrente?frequencia:undefined},...custos]);setDescricao("");setValor("");setVencimento("");setObservacao("");setRecorrente(false);setFrequencia("Mensal")};
 const excluir=(id:number)=>{if(confirm("Excluir este custo da empresa?"))salvar(custos.filter(c=>c.id!==id))};
 const total=useMemo(()=>custos.reduce((s,c)=>s+(Number(c.valor)||0),0),[custos]);
 const recorrentes=useMemo(()=>custos.filter(c=>c.recorrente),[custos]);
 const totalRecorrenteMensal=useMemo(()=>recorrentes.reduce((s,c)=>{const v=Number(c.valor)||0;if(c.frequencia==="Semanal")return s+v*4.345;if(c.frequencia==="Anual")return s+v/12;return s+v},0),[recorrentes]);
 const icone=(cat:string)=>cat==="Energia"?<Zap size={18}/>:cat==="Internet"?<Wifi size={18}/>:cat==="Cartão"?<CreditCard size={18}/>:cat==="Aluguel"?<Building2 size={18}/>:<ReceiptText size={18}/>;
 return <section className="companyCostsPage">
  <div className="licitacoesHeader"><div><h2>Custos da empresa</h2><p>Controle despesas avulsas e contas recorrentes da operação.</p></div></div>
  <div className="companyCostsSummaryRow"><div className="companyCostsSummary"><span>Total de contas cadastradas</span><strong>{brl(total)}</strong><small>{custos.length} {custos.length===1?"conta":"contas"}</small></div><div className="companyCostsSummary recurring"><span>Custo recorrente mensal</span><strong>{brl(totalRecorrenteMensal)}</strong><small>{recorrentes.length} {recorrentes.length===1?"conta recorrente":"contas recorrentes"}</small></div></div>
  <div className="companyCostsForm recurringForm">
   <label><span>Descrição</span><input value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="Ex.: Aluguel do escritório"/></label>
   <label><span>Categoria</span><select value={categoria} onChange={e=>setCategoria(e.target.value)}>{["Aluguel","Energia","Internet","Cartão","Telefone","Contabilidade","Impostos","Outros"].map(c=><option key={c}>{c}</option>)}</select></label>
   <label><span>Valor</span><input type="number" min="0" step="0.01" value={valor} onChange={e=>setValor(e.target.value)} placeholder="0,00"/></label>
   <label><span>Vencimento</span><input type="date" value={vencimento} onChange={e=>setVencimento(e.target.value)}/></label>
   <label className="recurringCheck"><span>Recorrência</span><button className={recorrente?"recurringToggle active":"recurringToggle"} type="button" onClick={()=>setRecorrente(v=>!v)}><Repeat2 size={16}/>{recorrente?"Recorrente":"Conta única"}</button></label>
   {recorrente&&<label><span>Frequência</span><select value={frequencia} onChange={e=>setFrequencia(e.target.value as "Mensal"|"Semanal"|"Anual")}><option>Mensal</option><option>Semanal</option><option>Anual</option></select></label>}
   <label className="costObservation"><span>Observação</span><input value={observacao} onChange={e=>setObservacao(e.target.value)} placeholder="Opcional"/></label>
   <button onClick={adicionar} type="button"><Plus size={17}/>Adicionar conta</button>
  </div>
  <div className="companyCostsList">{custos.length===0?<div className="emptyState"><ReceiptText size={30}/><h3>Nenhum custo cadastrado</h3><p>Cadastre as despesas fixas, recorrentes e operacionais da empresa.</p></div>:custos.map(c=><div className="companyCostRow" key={c.id}><div className="companyCostIcon">{icone(c.categoria)}</div><div className="companyCostInfo"><strong>{c.descricao}</strong><span>{c.categoria}{c.vencimento?` • Vence ${new Date(c.vencimento+"T00:00:00").toLocaleDateString("pt-BR")}`:""}</span>{c.recorrente&&<small className="recurringBadge"><Repeat2 size={11}/>Recorrente • {c.frequencia||"Mensal"}</small>}{c.observacao&&<small>{c.observacao}</small>}</div><strong className="companyCostValue">{brl(c.valor)}</strong><button onClick={()=>excluir(c.id)} type="button" title="Excluir"><Trash2 size={16}/></button></div>)}</div>
 </section>
}
