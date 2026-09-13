"use client";

import { useState } from "react";
import {
  BarChart3,
  ChevronRight,
  FileText,
  Gavel,
  LayoutDashboard,
  Menu,
  Settings,
  X,
} from "lucide-react";

import Dashboard from "./components/Dashboard";
import Licitacoes from "./components/Licitacoes";
import Relatorios from "./components/Relatorios";

const menu = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Licitações",
    icon: FileText,
  },
  {
    label: "Simulador de lance",
    icon: Gavel,
  },
  {
    label: "Relatórios",
    icon: BarChart3,
  },
];

export default function Home() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("Dashboard");

  const renderPage = () => {
    switch (active) {
      case "Dashboard":
        return <Dashboard />;

      case "Licitações":
        return <Licitacoes />;

      case "Simulador de lance":
        return (
          <PlaceholderPage
            title="Simulador de lance"
            description="O simulador de lance será integrado aos dados das licitações."
          />
        );

      case "Relatórios":
        return <Relatorios />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <div className="brandMark">
            <Gavel size={22} />
          </div>

          <div>
            <strong>LicitaPro</strong>
            <span>Gestão de licitações</span>
          </div>

          <button
            className="closeMobile"
            onClick={() => setOpen(false)}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <nav>
          {menu.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              className={active === label ? "navItem active" : "navItem"}
              onClick={() => {
                setActive(label);
                setOpen(false);
              }}
            >
              <Icon size={19} />
              <span>{label}</span>

              {label === "Dashboard" && (
                <ChevronRight size={16} className="navArrow" />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebarBottom">
          <button
            className="navItem"
            type="button"
            onClick={() => {
              setActive("Configurações");
              setOpen(false);
            }}
          >
            <Settings size={19} />
            <span>Configurações</span>
          </button>

          <div className="localBadge">
            <span className="dot" />
            Dados locais
          </div>
        </div>
      </aside>

      <main className="main">
        <header>
          <button
            className="mobileMenu"
            onClick={() => setOpen(true)}
            type="button"
          >
            <Menu />
          </button>

          <div>
            <p className="eyebrow">SISTEMA DE LICITAÇÕES</p>
            <h1>{active}</h1>
          </div>

          <div className="headerRight">
            <span className="status">
              <span className="dot" />
              Operação local
            </span>
          </div>
        </header>

        {renderPage()}
      </main>
    </div>
  );
}

function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="placeholderPage">
      <div className="panel">
        <div className="panelTitle">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>

        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          <p>Esta área será desenvolvida nas próximas etapas.</p>
        </div>
      </div>
    </section>
  );
}
