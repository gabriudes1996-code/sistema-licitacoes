"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, FileText, Globe2, MapPin, Plus, Save, Trash2, X } from "lucide-react";

type Compromisso = {
  id: number;
  data: string;
  horario: string;
  titulo: string;
  local: string;
  observacao: string;
};

type LicitacaoAgenda = {
  id: number;
  orgao: string;
  edital: string;
  modalidade: string;
  data: string;
  horario?: string;
  portal?: string;
  status?: string;
};

type EventoAgenda = {
  id: string;
  data: string;
  horario: string;
  titulo: string;
  local: string;
  observacao: string;
  tipo: "manual" | "licitacao";
  edital?: string;
  modalidade?: string;
  portal?: string;
  compromissoId?: number;
};

const STORAGE_KEY = "licitapro_agenda";
const LICITACOES_KEY = "licitapro_licitacoes";
const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const iso = (ano: number, mes: number, dia: number) => `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

export default function Agenda() {
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [dataSelecionada, setDataSelecionada] = useState(iso(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [licitacoes, setLicitacoes] = useState<LicitacaoAgenda[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [horario, setHorario] = useState("");
  const [local, setLocal] = useState("");
  const [observacao, setObservacao] = useState("");

  const carregarDados = () => {
    try {
      const salvos = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setCompromissos(Array.isArray(salvos) ? salvos : []);
    } catch { setCompromissos([]); }
    try {
      const lista = JSON.parse(localStorage.getItem(LICITACOES_KEY) || "[]");
      setLicitacoes(Array.isArray(lista) ? lista : []);
    } catch { setLicitacoes([]); }
  };

  useEffect(() => {
    carregarDados();
    window.addEventListener("storage", carregarDados);
    const timer = setInterval(carregarDados, 1000);
    return () => { window.removeEventListener("storage", carregarDados); clearInterval(timer); };
  }, []);

  const salvarLista = (lista: Compromisso[]) => {
    setCompromissos(lista);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  };

  const adicionar = () => {
    if (!titulo.trim()) { alert("Informe o compromisso."); return; }
    const novo: Compromisso = { id: Date.now(), data: dataSelecionada, horario, titulo: titulo.trim(), local: local.trim(), observacao: observacao.trim() };
    salvarLista([...compromissos, novo]);
    setTitulo(""); setHorario(""); setLocal(""); setObservacao(""); setMostrarForm(false);
  };

  const excluir = (id: number) => {
    if (confirm("Excluir este compromisso da agenda?")) salvarLista(compromissos.filter(c => c.id !== id));
  };

  const eventos = useMemo<EventoAgenda[]>(() => {
    const manuais: EventoAgenda[] = compromissos.map(c => ({
      id: `manual-${c.id}`,
      data: c.data,
      horario: c.horario || "",
      titulo: c.titulo,
      local: c.local,
      observacao: c.observacao,
      tipo: "manual",
      compromissoId: c.id,
    }));

    const eventosLicitacao: EventoAgenda[] = licitacoes
      .filter(l => Boolean(l.data))
      .map(l => ({
        id: `licitacao-${l.id}`,
        data: l.data,
        horario: l.horario || "",
        titulo: l.orgao,
        local: l.portal || "Portal não informado",
        observacao: l.status ? `Status: ${l.status}` : "",
        tipo: "licitacao",
        edital: l.edital,
        modalidade: l.modalidade,
        portal: l.portal || "",
      }));

    return [...eventosLicitacao, ...manuais];
  }, [compromissos, licitacoes]);

  const ano = mesAtual.getFullYear();
  const mes = mesAtual.getMonth();
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();

  const dias = useMemo(() => {
    const lista: (number | null)[] = Array(primeiroDia).fill(null);
    for (let d = 1; d <= totalDias; d++) lista.push(d);
    while (lista.length % 7 !== 0) lista.push(null);
    return lista;
  }, [primeiroDia, totalDias]);

  const eventosDia = eventos
    .filter(c => c.data === dataSelecionada)
    .sort((a, b) => (a.horario || "99:99").localeCompare(b.horario || "99:99"));

  const formatarData = (data: string) => {
    const [a, m, d] = data.split("-").map(Number);
    return new Date(a, m - 1, d).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  };

  const navegarMes = (delta: number) => setMesAtual(new Date(ano, mes + delta, 1));

  return (
    <section className="agendaPage">
      <div className="agendaHero">
        <div>
          <span className="erpKicker">ORGANIZAÇÃO</span>
          <h2>Agenda</h2>
          <p>As licitações com data cadastrada aparecem automaticamente no calendário.</p>
        </div>
        <button className="agendaAddBtn" onClick={() => setMostrarForm(true)}><Plus size={18}/>Novo compromisso</button>
      </div>

      <div className="agendaGrid">
        <div className="agendaCalendarCard">
          <div className="agendaCalendarHeader">
            <button onClick={() => navegarMes(-1)} title="Mês anterior"><ChevronLeft size={19}/></button>
            <strong>{meses[mes]} {ano}</strong>
            <button onClick={() => navegarMes(1)} title="Próximo mês"><ChevronRight size={19}/></button>
          </div>
          <div className="agendaWeekdays">{diasSemana.map(d => <span key={d}>{d}</span>)}</div>
          <div className="agendaDays">
            {dias.map((dia, index) => {
              if (!dia) return <div className="agendaBlank" key={`b-${index}`} />;
              const data = iso(ano, mes, dia);
              const qtd = eventos.filter(c => c.data === data).length;
              const selecionado = data === dataSelecionada;
              const hojeIso = iso(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
              return <button key={data} className={`${selecionado ? "selected" : ""} ${data === hojeIso ? "today" : ""}`} onClick={() => setDataSelecionada(data)}><span>{dia}</span>{qtd > 0 && <small>{qtd}</small>}</button>;
            })}
          </div>
        </div>

        <div className="agendaDayCard">
          <div className="agendaDayHeader">
            <div><CalendarDays size={19}/><div><span>COMPROMISSOS DO DIA</span><strong>{formatarData(dataSelecionada)}</strong></div></div>
            <button onClick={() => setMostrarForm(true)}><Plus size={16}/>Adicionar</button>
          </div>

          {eventosDia.length === 0 ? (
            <div className="agendaEmpty"><CalendarDays size={34}/><h3>Nenhum compromisso</h3><p>Este dia está livre.</p></div>
          ) : (
            <div className="agendaEvents">
              {eventosDia.map(c => (
                <div className={`agendaEvent ${c.tipo === "licitacao" ? "agendaBidEvent" : ""}`} key={c.id}>
                  <div className="agendaEventTime"><Clock3 size={16}/><strong>{c.horario || "Sem horário"}</strong></div>
                  <div className="agendaEventMain">
                    <div className="agendaEventType">{c.tipo === "licitacao" ? <><FileText size={13}/> Licitação</> : <>Compromisso</>}</div>
                    <h3>{c.titulo}</h3>
                    {c.tipo === "licitacao" && <p><strong>{c.edital}</strong>{c.modalidade ? ` • ${c.modalidade}` : ""}</p>}
                    {c.local && <p><MapPin size={14}/>{c.local}</p>}
                    {c.tipo === "licitacao" && c.portal && <p><Globe2 size={14}/>{c.portal}</p>}
                    {c.observacao && <small>{c.observacao}</small>}
                  </div>
                  {c.tipo === "manual" && c.compromissoId && <button className="agendaDelete" onClick={() => excluir(c.compromissoId!)} title="Excluir"><Trash2 size={16}/></button>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {mostrarForm && (
        <div className="agendaModalOverlay">
          <div className="agendaModal">
            <div className="agendaModalHeader"><div><h3>Novo compromisso</h3><p>{formatarData(dataSelecionada)}</p></div><button onClick={() => setMostrarForm(false)}><X size={20}/></button></div>
            <div className="agendaForm">
              <label><span>Compromisso *</span><input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex.: Prestação na Prefeitura"/></label>
              <div className="agendaFormRow"><label><span>Data</span><input type="date" value={dataSelecionada} onChange={e => setDataSelecionada(e.target.value)}/></label><label><span>Horário</span><input type="time" value={horario} onChange={e => setHorario(e.target.value)}/></label></div>
              <label><span>Local</span><input value={local} onChange={e => setLocal(e.target.value)} placeholder="Ex.: Prefeitura Municipal de ..."/></label>
              <label><span>Observação</span><textarea rows={3} value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Detalhes do compromisso..."/></label>
            </div>
            <div className="agendaModalActions"><button className="agendaCancelBtn" onClick={() => setMostrarForm(false)}>Cancelar</button><button className="agendaSaveBtn" onClick={adicionar}><Save size={17}/>Salvar compromisso</button></div>
          </div>
        </div>
      )}
    </section>
  );
}
