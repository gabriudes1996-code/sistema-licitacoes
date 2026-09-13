"use client";

import { useEffect, useState } from "react";
import {
  Truck,
  MapPin,
  Route,
  Fuel,
  Receipt,
  Package,
  Calculator,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";

type CalculoFrete = {
  id: number;
  origem: string;
  destino: string;
  distancia: number;
  custoKm: number;
  pedagios: number;
  combustivel: number;
  outrosCustos: number;
  entregas: number;
  total: number;
  porEntrega: number;
  data: string;
};

const STORAGE_KEY = "licitapro_fretes";

const brl = (valor: number) =>
  valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function Frete() {
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [distancia, setDistancia] = useState("");
  const [custoKm, setCustoKm] = useState("");
  const [pedagios, setPedagios] = useState("");
  const [combustivel, setCombustivel] = useState("");
  const [outrosCustos, setOutrosCustos] = useState("");
  const [entregas, setEntregas] = useState("1");

  const [historico, setHistorico] = useState<CalculoFrete[]>([]);

  const [resultado, setResultado] = useState<{
    distancia: number;
    custoKm: number;
    custoDistancia: number;
    pedagios: number;
    combustivel: number;
    outrosCustos: number;
    total: number;
    porEntrega: number;
  } | null>(null);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);

      if (salvo) {
        setHistorico(JSON.parse(salvo));
      }
    } catch {
      setHistorico([]);
    }
  }, []);

  const calcularFrete = () => {
    const distanciaNumero = Number(distancia) || 0;
    const custoKmNumero = Number(custoKm) || 0;
    const pedagiosNumero = Number(pedagios) || 0;
    const combustivelNumero = Number(combustivel) || 0;
    const outrosNumero = Number(outrosCustos) || 0;
    const entregasNumero = Math.max(Number(entregas) || 1, 1);

    if (distanciaNumero <= 0) {
      alert("Informe a distância.");
      return;
    }

    if (custoKmNumero <= 0) {
      alert("Informe o custo por KM.");
      return;
    }

    const custoDistancia = distanciaNumero * custoKmNumero;

    const total =
      custoDistancia +
      pedagiosNumero +
      combustivelNumero +
      outrosNumero;

    const porEntrega = total / entregasNumero;

    setResultado({
      distancia: distanciaNumero,
      custoKm: custoKmNumero,
      custoDistancia,
      pedagios: pedagiosNumero,
      combustivel: combustivelNumero,
      outrosCustos: outrosNumero,
      total,
      porEntrega,
    });
  };

  const salvarCalculo = () => {
    if (!resultado) {
      alert("Calcule o frete antes de salvar.");
      return;
    }

    const novoCalculo: CalculoFrete = {
      id: Date.now(),
      origem,
      destino,
      distancia: resultado.distancia,
      custoKm: resultado.custoKm,
      pedagios: resultado.pedagios,
      combustivel: resultado.combustivel,
      outrosCustos: resultado.outrosCustos,
      entregas: Math.max(Number(entregas) || 1, 1),
      total: resultado.total,
      porEntrega: resultado.porEntrega,
      data: new Date().toLocaleDateString("pt-BR"),
    };

    const novaLista = [novoCalculo, ...historico];

    setHistorico(novaLista);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novaLista));

    alert("Cálculo de frete salvo.");
  };

  const excluirCalculo = (id: number) => {
    const confirmar = confirm(
      "Tem certeza que deseja excluir este cálculo?"
    );

    if (!confirmar) return;

    const novaLista = historico.filter((item) => item.id !== id);

    setHistorico(novaLista);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novaLista));
  };

  const limpar = () => {
    setOrigem("");
    setDestino("");
    setDistancia("");
    setCustoKm("");
    setPedagios("");
    setCombustivel("");
    setOutrosCustos("");
    setEntregas("1");
    setResultado(null);
  };

  return (
    <section className="fretePage">
      <div className="pageHeader">
        <div>
          <h2>Calculadora de Frete</h2>
          <p>
            Calcule o custo de transporte para suas licitações.
          </p>
        </div>
      </div>

      <div className="freteLayout">
        <div className="freteCard">
          <div className="freteCardHeader">
            <div>
              <h3>
                <Truck size={20} />
                Dados do transporte
              </h3>

              <p>
                Informe os dados necessários para calcular o frete.
              </p>
            </div>
          </div>

          <div className="freteGrid">
            <div className="formGroup">
              <label>Origem</label>

              <div className="inputIcon">
                <MapPin size={17} />

                <input
                  type="text"
                  placeholder="Ex.: Mateus Leme - MG"
                  value={origem}
                  onChange={(e) => setOrigem(e.target.value)}
                />
              </div>
            </div>

            <div className="formGroup">
              <label>Destino</label>

              <div className="inputIcon">
                <MapPin size={17} />

                <input
                  type="text"
                  placeholder="Ex.: Carangola - MG"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                />
              </div>
            </div>

            <div className="formGroup">
              <label>Distância total (KM)</label>

              <div className="inputIcon">
                <Route size={17} />

                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Ex.: 320"
                  value={distancia}
                  onChange={(e) => setDistancia(e.target.value)}
                />
              </div>
            </div>

            <div className="formGroup">
              <label>Custo por KM</label>

              <div className="moneyInput">
                <span>R$</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex.: 2,50"
                  value={custoKm}
                  onChange={(e) => setCustoKm(e.target.value)}
                />
              </div>
            </div>

            <div className="formGroup">
              <label>Pedágios</label>

              <div className="moneyInput">
                <span>R$</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={pedagios}
                  onChange={(e) => setPedagios(e.target.value)}
                />
              </div>
            </div>

            <div className="formGroup">
              <label>Combustível adicional</label>

              <div className="moneyInput">
                <span>R$</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={combustivel}
                  onChange={(e) => setCombustivel(e.target.value)}
                />
              </div>
            </div>

            <div className="formGroup">
              <label>Outros custos</label>

              <div className="moneyInput">
                <span>R$</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={outrosCustos}
                  onChange={(e) => setOutrosCustos(e.target.value)}
                />
              </div>
            </div>

            <div className="formGroup">
              <label>Quantidade de entregas</label>

              <div className="inputIcon">
                <Package size={17} />

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={entregas}
                  onChange={(e) => setEntregas(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="freteActions">
            <button
              className="secondaryBtn"
              onClick={limpar}
              type="button"
            >
              <RotateCcw size={16} />
              Limpar
            </button>

            <button
              className="primaryBtn"
              onClick={calcularFrete}
              type="button"
            >
              <Calculator size={17} />
              Calcular frete
            </button>
          </div>
        </div>

        <div className="freteResultCard">
          <div className="freteResultHeader">
            <div>
              <h3>
                <Calculator size={20} />
                Resultado
              </h3>

              <p>
                Resumo do custo calculado.
              </p>
            </div>
          </div>

          {!resultado ? (
            <div className="emptyResult">
              <Truck size={42} />

              <strong>Nenhum cálculo realizado</strong>

              <span>
                Preencha os dados ao lado e clique em
                "Calcular frete".
              </span>
            </div>
          ) : (
            <>
              <div className="freteTotalBox">
                <span>Custo total do frete</span>

                <strong>{brl(resultado.total)}</strong>
              </div>

              <div className="freteResultGrid">
                <div>
                  <span>Distância</span>
                  <strong>
                    {resultado.distancia.toLocaleString("pt-BR")} KM
                  </strong>
                </div>

                <div>
                  <span>Custo por KM</span>
                  <strong>{brl(resultado.custoKm)}</strong>
                </div>

                <div>
                  <span>Custo da distância</span>
                  <strong>{brl(resultado.custoDistancia)}</strong>
                </div>

                <div>
                  <span>Pedágios</span>
                  <strong>{brl(resultado.pedagios)}</strong>
                </div>

                <div>
                  <span>Combustível</span>
                  <strong>{brl(resultado.combustivel)}</strong>
                </div>

                <div>
                  <span>Outros custos</span>
                  <strong>{brl(resultado.outrosCustos)}</strong>
                </div>
              </div>

              <div className="fretePerDelivery">
                <span>
                  Frete por entrega ({entregas}{" "}
                  {Number(entregas) === 1 ? "entrega" : "entregas"})
                </span>

                <strong>{brl(resultado.porEntrega)}</strong>
              </div>

              <div className="freteActions">
                <button
                  className="primaryBtn"
                  onClick={salvarCalculo}
                  type="button"
                >
                  <Save size={16} />
                  Salvar cálculo
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="freteHistoryCard">
        <div className="freteHistoryHeader">
          <div>
            <h3>Histórico de fretes</h3>

            <p>
              Cálculos salvos anteriormente.
            </p>
          </div>

          <span className="historyCount">
            {historico.length}{" "}
            {historico.length === 1 ? "cálculo" : "cálculos"}
          </span>
        </div>

        {historico.length === 0 ? (
          <div className="emptyHistory">
            Nenhum cálculo de frete salvo.
          </div>
        ) : (
          <div className="freteHistoryList">
            {historico.map((item) => (
              <div className="freteHistoryItem" key={item.id}>
                <div className="historyRoute">
                  <div>
                    <span>Origem</span>
                    <strong>
                      {item.origem || "Não informado"}
                    </strong>
                  </div>

                  <Route size={18} />

                  <div>
                    <span>Destino</span>
                    <strong>
                      {item.destino || "Não informado"}
                    </strong>
                  </div>
                </div>

                <div>
                  <span>Distância</span>
                  <strong>{item.distancia} KM</strong>
                </div>

                <div>
                  <span>Entregas</span>
                  <strong>{item.entregas}</strong>
                </div>

                <div>
                  <span>Frete total</span>
                  <strong>{brl(item.total)}</strong>
                </div>

                <div>
                  <span>Por entrega</span>
                  <strong>{brl(item.porEntrega)}</strong>
                </div>

                <div className="historyDate">
                  <span>Data</span>
                  <strong>{item.data}</strong>
                </div>

                <button
                  className="iconDangerBtn"
                  onClick={() => excluirCalculo(item.id)}
                  title="Excluir cálculo"
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}