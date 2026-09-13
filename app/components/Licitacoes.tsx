"use client";

import { useMemo, useState } from "react";
import DetalhesLicitacao from "./DetalhesLicitacao";

import {
  Plus,
  Search,
  FileText,
  CalendarDays,
  Building2,
  ChevronRight,
  X,
  Save,
} from "lucide-react";

type Licitacao = {
  id: number;
  orgao: string;
  edital: string;
  modalidade: string;
  data: string;
  status: string;
  observacoes: string;
  valorEstimado: number;
};

const brl = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const STORAGE_KEY = "licitapro_licitacoes";

export default function Licitacoes() {
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");

  const [licitacaoSelecionada, setLicitacaoSelecionada] =
    useState<Licitacao | null>(null);

  const [orgao, setOrgao] = useState("");

  const [edital, setEdital] = useState("");

  const [modalidade, setModalidade] =
    useState("Pregão Eletrônico");

  const [data, setData] = useState("");

  const [status, setStatus] =
    useState("Em andamento");

  const [observacoes, setObservacoes] =
    useState("");

  const [valorEstimado, setValorEstimado] =
    useState("");

  const salvarLicitacoes = (lista: Licitacao[]) => {
    setLicitacoes(lista);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(lista)
    );
  };

  const novaLicitacao = () => {
    if (!orgao.trim()) {
      alert("Informe o órgão.");
      return;
    }

    if (!edital.trim()) {
      alert("Informe o número do edital.");
      return;
    }

    const nova: Licitacao = {
      id: Date.now(),
      orgao: orgao.trim(),
      edital: edital.trim(),
      modalidade,
      data,
      status,
      observacoes,
      valorEstimado: Number(valorEstimado) || 0,
    };

    salvarLicitacoes([
      nova,
      ...licitacoes,
    ]);

    setOrgao("");
    setEdital("");
    setModalidade("Pregão Eletrônico");
    setData("");
    setStatus("Em andamento");
    setObservacoes("");
    setValorEstimado("");

    setShowForm(false);
  };

  const excluir = (id: number) => {
    const confirmar = confirm(
      "Tem certeza que deseja excluir esta licitação?"
    );

    if (!confirmar) {
      return;
    }

    salvarLicitacoes(
      licitacoes.filter(
        (item) => item.id !== id
      )
    );
  };

  const filtradas = useMemo(() => {
    const termo = search
      .toLowerCase()
      .trim();

    if (!termo) {
      return licitacoes;
    }

    return licitacoes.filter(
      (item) =>
        item.orgao
          .toLowerCase()
          .includes(termo) ||
        item.edital
          .toLowerCase()
          .includes(termo) ||
        item.status
          .toLowerCase()
          .includes(termo)
    );
  }, [licitacoes, search]);

   return (
    <>
      {licitacaoSelecionada ? (
        <DetalhesLicitacao
          licitacao={licitacaoSelecionada}
          onVoltar={() =>
            setLicitacaoSelecionada(null)
          }
        />
      ) : (
    <section className="licitacoesPage">

      <div className="licitacoesHeader">

        <div>
          <h2>Licitações</h2>

          <p>
            Cadastre e acompanhe suas oportunidades.
          </p>
        </div>

        <button
          className="primaryBtn"
          onClick={() => setShowForm(true)}
        >
          <Plus size={18} />

          Nova licitação
        </button>

      </div>


      <div className="searchBar">

        <Search size={18} />

        <input
          type="text"
          placeholder="Pesquisar por órgão, edital ou status..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

      </div>


      {showForm && (

        <div className="formPanel">

          <div className="formHeader">

            <div>

              <h3>
                Nova licitação
              </h3>

              <p>
                Cadastre os dados principais da licitação.
              </p>

            </div>

            <button
              className="iconBtn"
              onClick={() =>
                setShowForm(false)
              }
            >
              <X size={20} />
            </button>

          </div>


          <div className="formGrid">

            <label className="formField">

              <span>
                Órgão *
              </span>

              <div className="formInput">

                <Building2 size={16} />

                <input
                  value={orgao}
                  onChange={(e) =>
                    setOrgao(e.target.value)
                  }
                  placeholder="Ex.: Prefeitura Municipal de Mateus Leme"
                />

              </div>

            </label>


            <label className="formField">

              <span>
                Número do edital *
              </span>

              <div className="formInput">

                <FileText size={16} />

                <input
                  value={edital}
                  onChange={(e) =>
                    setEdital(e.target.value)
                  }
                  placeholder="Ex.: PE 042/2026"
                />

              </div>

            </label>


            <label className="formField">

              <span>
                Modalidade
              </span>

              <select
                value={modalidade}
                onChange={(e) =>
                  setModalidade(e.target.value)
                }
              >

                <option>
                  Pregão Eletrônico
                </option>

                <option>
                  Concorrência
                </option>

                <option>
                  Dispensa Eletrônica
                </option>

                <option>
                  Inexigibilidade
                </option>

                <option>
                  Tomada de Preços
                </option>

                <option>
                  Outra
                </option>

              </select>

            </label>


            <label className="formField">

              <span>
                Data da disputa
              </span>

              <div className="formInput">

                <CalendarDays size={16} />

                <input
                  type="date"
                  value={data}
                  onChange={(e) =>
                    setData(e.target.value)
                  }
                />

              </div>

            </label>


            <label className="formField">

              <span>
                Status
              </span>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
              >

                <option>
                  Em andamento
                </option>

                <option>
                  Em análise
                </option>

                <option>
                  Vencida
                </option>

                <option>
                  Perdida
                </option>

                <option>
                  Cancelada
                </option>

              </select>

            </label>


            <label className="formField">

              <span>
                Valor estimado
              </span>

              <div className="formInput">

                <span className="currency">
                  R$
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={valorEstimado}
                  onChange={(e) =>
                    setValorEstimado(
                      e.target.value
                    )
                  }
                  placeholder="0,00"
                />

              </div>

            </label>


            <label className="formField full">

              <span>
                Observações
              </span>

              <textarea
                value={observacoes}
                onChange={(e) =>
                  setObservacoes(
                    e.target.value
                  )
                }
                placeholder="Anotações importantes sobre esta licitação..."
                rows={4}
              />

            </label>

          </div>


          <div className="formActions">

            <button
              className="cancelBtn"
              onClick={() =>
                setShowForm(false)
              }
            >
              Cancelar
            </button>


            <button
              className="primaryBtn"
              onClick={novaLicitacao}
            >

              <Save size={17} />

              Salvar licitação

            </button>

          </div>

        </div>

      )}


      <div className="summaryCards">

        <div className="summaryCard">

          <span>
            Total
          </span>

          <strong>
            {licitacoes.length}
          </strong>

        </div>


        <div className="summaryCard">

          <span>
            Em andamento
          </span>

          <strong>

            {
              licitacoes.filter(
                (item) =>
                  item.status ===
                  "Em andamento"
              ).length
            }

          </strong>

        </div>


        <div className="summaryCard">

          <span>
            Vencidas
          </span>

          <strong>

            {
              licitacoes.filter(
                (item) =>
                  item.status ===
                  "Vencida"
              ).length
            }

          </strong>

        </div>


        <div className="summaryCard">

          <span>
            Valor estimado
          </span>

          <strong>

            {brl(
              licitacoes.reduce(
                (total, item) =>
                  total +
                  item.valorEstimado,
                0
              )
            )}

          </strong>

        </div>

      </div>


      <div className="licitacoesList">

        {filtradas.length === 0 ? (

          <div className="emptyState">

            <div className="emptyIcon">

              <FileText size={30} />

            </div>

            <h3>
              Nenhuma licitação cadastrada
            </h3>

            <p>
              Comece cadastrando sua primeira licitação.
            </p>

            <button
              className="primaryBtn"
              onClick={() =>
                setShowForm(true)
              }
            >

              <Plus size={17} />

              Nova licitação

            </button>

          </div>

        ) : (

          filtradas.map((item) => (

            <div
              className="licitacaoCard"
              key={item.id}
            >

              <div className="licitacaoMain">

                <div className="licitacaoIcon">

                  <FileText size={21} />

                </div>


                <div className="licitacaoInfo">

                  <h3>
                    {item.orgao}
                  </h3>


                  <div className="licitacaoMeta">

                    <span>
                      {item.edital}
                    </span>

                    <span>
                      {item.modalidade}
                    </span>


                    {item.data && (

                      <span>

                        {new Date(
                          item.data +
                            "T00:00:00"
                        ).toLocaleDateString(
                          "pt-BR"
                        )}

                      </span>

                    )}

                  </div>

                </div>

              </div>


              <div className="licitacaoValue">

                <small>
                  Valor estimado
                </small>

                <strong>
                  {brl(
                    item.valorEstimado
                  )}
                </strong>

              </div>


              <span
                className={`statusPill ${item.status
                  .toLowerCase()
                  .replaceAll(" ", "-")
                  .replaceAll("ã", "a")}`}
              >
                {item.status}
              </span>


              <button
                className="openBtn"
                onClick={() =>
                  setLicitacaoSelecionada(
                    item
                  )
                }
              >

                Abrir

                <ChevronRight
                  size={16}
                />

              </button>


              <button
                className="deleteBtn"
                onClick={() =>
                  excluir(item.id)
                }
                title="Excluir"
              >

                <X size={16} />

              </button>

            </div>

          ))

        )}

          </div>

      </section>
      )}
    </>
  );
}