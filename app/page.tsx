"use client";

import { useState } from "react";
import { BarChart3, ChevronRight, FileText, Gavel, LayoutDashboard, Menu, Settings, X, CircleDollarSign } from "lucide-react";
import Dashboard from "./components/Dashboard";
import Licitacoes from "./components/Licitacoes";
import Relatorios from "./components/Relatorios";
import Recebimentos from "./components/Recebimentos";

const menu = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Licitações", icon: FileText },
  { label: "Recebimentos", icon: CircleDollarSign },
  { label: "Relatórios", icon: BarChart3 },
];

export default function Home() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("Dashboard");

  const renderPage = () => {
    switch (active) {
      case "Dashboard": return <Dashboard />;
      case "Licitações": return <Licitacoes />;
      case "Recebimentos": return <Recebimentos />;
      case "Relatórios": return <Relatorios />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <div className="brandMark"><Gavel size={22} /></div>
          <div><strong>LicitaPro ERP</strong><span>Gestão de contratos públicos</span></div>
          <button className="closeMobile" onClick={() => setOpen(false)} type="button"><X size={20} /></button>
        </div>
        <div className="navSectionLabel">OPERAÇÃO</div>
        <nav>
          {menu.map(({ label, icon: Icon }) => (
            <button key={label} type="button" className={active === label ? "navItem active" : "navItem"} onClick={() => { setActive(label); setOpen(false); }}>
              <Icon size={19} /><span>{label}</span>{label === active && <ChevronRight size={16} className="navArrow" />}
            </button>
          ))}
        </nav>
        <div className="sidebarBottom">
          <div className="navSectionLabel">SISTEMA</div>
          <button className="navItem" type="button" onClick={() => { setActive("Configurações"); setOpen(false); }}><Settings size={19} /><span>Configurações</span></button>
          <div className="localBadge"><span className="dot" />Base local ativa</div>
        </div>
      </aside>

      <main className="main">
        <header className="erpTopbar">
          <button className="mobileMenu" onClick={() => setOpen(true)} type="button"><Menu /></button>
          <div><p className="eyebrow">LICITAPRO • ERP DE CONTRATOS PÚBLICOS</p><h1>{active}</h1></div>
          <div className="headerRight"><span className="status"><span className="dot" />Sistema operacional</span></div>
        </header>
        {renderPage()}
      </main>
    </div>
  );
}
