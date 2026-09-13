import { NextResponse } from "next/server";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ItemImportado = {
  numero: number;
  descricao: string;
  quantidade: number;
  valorEstimado: number;
  valorTotalEstimado: number;
};

type FragmentoTexto = {
  pagina: number;
  texto: string;
  x: number;
  y: number;
};

type LinhaPDF = {
  pagina: number;
  texto: string;
};

function converterNumero(valor: string) {
  if (!valor) return 0;

  let limpo = valor
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .replace(/[^\d.,-]/g, "");

  if (!limpo) return 0;

  // Formato brasileiro: 1.234,56
  if (limpo.includes(",")) {
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  } else {
    // Quando há apenas ponto, tenta distinguir milhar de decimal.
    const partes = limpo.split(".");
    if (partes.length > 2) {
      limpo = partes.join("");
    } else if (partes.length === 2 && partes[1].length === 3) {
      limpo = partes.join("");
    }
  }

  const numero = Number(limpo);
  return Number.isFinite(numero) ? numero : 0;
}

function limparDescricao(texto: string) {
  return texto
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/^[\-–—|]+\s*/, "")
    .replace(/\s*[|]+\s*$/, "")
    .trim();
}

function normalizarLinha(texto: string) {
  return texto
    .replace(/\u00a0/g, " ")
    .replace(/[|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ehCabecalhoOuRodape(linha: string) {
  const texto = normalizarLinha(linha);

  if (!texto) return true;

  return (
    /^(ITEM|ITENS|CÓDIGO|CODIGO|DESCRIÇÃO|DESCRICAO|ESPECIFICAÇÃO|ESPECIFICACAO|QTD\.?|QTDE\.?|QUANTIDADE|UND\.?|UNID\.?|UNIDADE|VLR\.?|VALOR|VALOR UNITÁRIO|VALOR UNITARIO|VALOR TOTAL|TOTAL|PREFEITURA|PROCESSO|PREGÃO|PREGAO|EDITAL|OBJETO|CRITÉRIO|CRITERIO|LOTE|GRUPO|NEXUS ASSESSORIA)\b/i.test(
      texto
    ) ||
    /^p[aá]gina\s+\d+/i.test(texto) ||
    /^\d+\s+de\s+\d+$/i.test(texto)
  );
}

function extrairValoresMonetarios(texto: string) {
  const matches = [
    ...texto.matchAll(
      /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}|\d+\.\d{2})(?!\d)/gi
    ),
  ];

  return matches.map((match) => ({
    bruto: match[0],
    valor: converterNumero(match[1]),
    indice: match.index ?? 0,
  }));
}

function extrairQuantidadeEUnidade(texto: string) {
  const limpo = normalizarLinha(texto);

  // 10 UN / 10,5 KG / 1.000 UND
  let match = limpo.match(
    /(\d{1,9}(?:[.,]\d{1,4})?)\s*(UN|UND|UNID|UNIDADE|KG|G|MG|L|LT|ML|M|M2|M²|M3|M³|CM|MM|CX|CAIXA|PCT|PACOTE|KIT|PAR|JG|JOGO|SV|SERV|SERVIÇO|SERVICO|H|HR|DIA|MES|MÊS)\b/i
  );

  if (match) {
    return {
      quantidade: converterNumero(match[1]),
      unidade: match[2],
      inicio: match.index ?? 0,
      fim: (match.index ?? 0) + match[0].length,
    };
  }

  // UN 10 / KG 2,5
  match = limpo.match(
    /\b(UN|UND|UNID|UNIDADE|KG|G|MG|L|LT|ML|M|M2|M²|M3|M³|CM|MM|CX|CAIXA|PCT|PACOTE|KIT|PAR|JG|JOGO|SV|SERV|SERVIÇO|SERVICO|H|HR|DIA|MES|MÊS)\s*(\d{1,9}(?:[.,]\d{1,4})?)/i
  );

  if (match) {
    return {
      quantidade: converterNumero(match[2]),
      unidade: match[1],
      inicio: match.index ?? 0,
      fim: (match.index ?? 0) + match[0].length,
    };
  }

  return null;
}

function extrairNumeroInicial(texto: string) {
  const match = normalizarLinha(texto).match(
    /^(?:ITEM\s*)?(\d{1,6})(?:\s*[.ªº)\-:]\s*|\s+)/i
  );

  if (!match) {
    const somenteNumero = normalizarLinha(texto).match(/^(\d{1,6})[.)-]?$/);
    if (!somenteNumero) return null;

    return {
      numero: Number(somenteNumero[1]),
      restante: "",
    };
  }

  return {
    numero: Number(match[1]),
    restante: normalizarLinha(texto.slice(match[0].length)),
  };
}

function tentarMontarItem(
  numero: number,
  partes: string[]
): ItemImportado | null {
  const texto = normalizarLinha(partes.join(" "));
  if (!texto) return null;

  const valores = extrairValoresMonetarios(texto);
  if (valores.length === 0) return null;

  // Preferimos os dois últimos valores monetários: unitário e total.
  // Se existir somente um valor, usamos como unitário e calculamos o total.
  const valorTotal = valores.length >= 2 ? valores[valores.length - 1] : null;
  const valorUnitario =
    valores.length >= 2 ? valores[valores.length - 2] : valores[valores.length - 1];

  const textoAntesDosValores = texto.slice(0, valorUnitario.indice).trim();
  const qtd = extrairQuantidadeEUnidade(textoAntesDosValores);

  let quantidade = qtd?.quantidade ?? 0;
  let descricao = textoAntesDosValores;

  if (qtd) {
    descricao = `${textoAntesDosValores.slice(0, qtd.inicio)} ${textoAntesDosValores.slice(
      qtd.fim
    )}`;
  } else {
    // Fallback: a última expressão numérica antes dos preços costuma ser a quantidade.
    const qtdFallback = textoAntesDosValores.match(
      /(?:^|\s)(\d{1,9}(?:[.,]\d{1,4})?)\s*$/
    );

    if (qtdFallback) {
      quantidade = converterNumero(qtdFallback[1]);
      descricao = textoAntesDosValores.slice(0, qtdFallback.index).trim();
    }
  }

  // Alguns PDFs trazem unidade em uma linha e quantidade em outra, e a junção pode
  // deixar a unidade no final da descrição. Remove somente unidades conhecidas.
  descricao = descricao.replace(
    /\b(UN|UND|UNID|UNIDADE|KG|G|MG|L|LT|ML|M|M2|M²|M3|M³|CM|MM|CX|CAIXA|PCT|PACOTE|KIT|PAR|JG|JOGO|SV|SERV|SERVIÇO|SERVICO|H|HR|DIA|MES|MÊS)\s*$/i,
    ""
  );

  descricao = limparDescricao(descricao);

  const valorEstimado = valorUnitario.valor;
  const valorTotalEstimado = valorTotal?.valor ?? quantidade * valorEstimado;

  if (
    !Number.isFinite(numero) ||
    numero <= 0 ||
    !descricao ||
    quantidade <= 0 ||
    valorEstimado <= 0 ||
    valorTotalEstimado <= 0
  ) {
    return null;
  }

  return {
    numero,
    descricao,
    quantidade,
    valorEstimado,
    valorTotalEstimado,
  };
}

function analisarLinhas(linhas: LinhaPDF[]) {
  const resultado: ItemImportado[] = [];

  let numeroAtual: number | null = null;
  let partesAtuais: string[] = [];

  const finalizarAtual = () => {
    if (numeroAtual === null) return;

    const item = tentarMontarItem(numeroAtual, partesAtuais);
    if (item) resultado.push(item);

    numeroAtual = null;
    partesAtuais = [];
  };

  for (const linhaInfo of linhas) {
    const linha = normalizarLinha(linhaInfo.texto);
    if (!linha || ehCabecalhoOuRodape(linha)) continue;

    const inicioItem = extrairNumeroInicial(linha);

    if (inicioItem) {
      // Ao encontrar um novo número, tenta fechar o item anterior antes de iniciar o próximo.
      finalizarAtual();

      numeroAtual = inicioItem.numero;
      partesAtuais = inicioItem.restante ? [inicioItem.restante] : [];

      // Itens inteiros em uma única linha são muito comuns.
      const itemLinhaUnica = tentarMontarItem(numeroAtual, partesAtuais);
      if (itemLinhaUnica) {
        resultado.push(itemLinhaUnica);
        numeroAtual = null;
        partesAtuais = [];
      }

      continue;
    }

    if (numeroAtual !== null) {
      partesAtuais.push(linha);

      // Assim que houver informação suficiente, fecha o item. Isso evita engolir o
      // cabeçalho/descrição do próximo bloco quando o PDF estiver quebrado em várias linhas.
      const itemCompleto = tentarMontarItem(numeroAtual, partesAtuais);
      if (itemCompleto) {
        resultado.push(itemCompleto);
        numeroAtual = null;
        partesAtuais = [];
      }
    }
  }

  finalizarAtual();

  // Remove duplicados exatos/por número, preservando a primeira ocorrência válida.
  const vistos = new Set<number>();
  return resultado.filter((item) => {
    if (vistos.has(item.numero)) return false;
    vistos.add(item.numero);
    return true;
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const arquivo = formData.get("arquivo");

    if (!(arquivo instanceof File)) {
      return NextResponse.json(
        { erro: "Nenhum arquivo PDF foi enviado." },
        { status: 400 }
      );
    }

    if (
      arquivo.type !== "application/pdf" &&
      !arquivo.name.toLowerCase().endsWith(".pdf")
    ) {
      return NextResponse.json(
        { erro: "O arquivo enviado não é um PDF." },
        { status: 400 }
      );
    }

    const arrayBuffer = await arquivo.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
    }).promise;

    const fragmentos: FragmentoTexto[] = [];

    for (let pagina = 1; pagina <= pdf.numPages; pagina++) {
      const page = await pdf.getPage(pagina);
      const content = await page.getTextContent();

      const itensTexto = content.items as Array<{
        str?: string;
        transform?: number[];
      }>;

      for (const item of itensTexto) {
        const texto = item.str?.trim() || "";
        if (!texto) continue;

        fragmentos.push({
          pagina,
          texto,
          x: item.transform?.[4] || 0,
          y: item.transform?.[5] || 0,
        });
      }
    }

    if (fragmentos.length === 0) {
      return NextResponse.json(
        {
          erro:
            "Não foi possível encontrar texto no PDF. O arquivo pode ser escaneado (imagem). Nesse caso é necessário OCR.",
        },
        { status: 400 }
      );
    }

    const linhasAgrupadas: LinhaPDF[] = [];
    const toleranciaY = 3.5;

    // Agrupa página por página para nunca misturar linhas que possuem o mesmo Y
    // em páginas diferentes.
    for (let pagina = 1; pagina <= pdf.numPages; pagina++) {
      const daPagina = fragmentos
        .filter((fragmento) => fragmento.pagina === pagina)
        .sort((a, b) => {
          if (Math.abs(a.y - b.y) > toleranciaY) return b.y - a.y;
          return a.x - b.x;
        });

      let linhaAtual: { y: number; textos: { texto: string; x: number }[] } | null =
        null;

      const salvarLinha = () => {
        if (!linhaAtual) return;

        const texto = normalizarLinha(
          linhaAtual.textos
            .sort((a, b) => a.x - b.x)
            .map((parte) => parte.texto)
            .join(" ")
        );

        if (texto) linhasAgrupadas.push({ pagina, texto });
      };

      for (const item of daPagina) {
        if (!linhaAtual || Math.abs(linhaAtual.y - item.y) > toleranciaY) {
          salvarLinha();
          linhaAtual = {
            y: item.y,
            textos: [{ texto: item.texto, x: item.x }],
          };
        } else {
          linhaAtual.textos.push({ texto: item.texto, x: item.x });
        }
      }

      salvarLinha();
    }

    const itens = analisarLinhas(linhasAgrupadas);

    if (itens.length === 0) {
      // Retorna uma pequena amostra para facilitar diagnóstico futuro no console,
      // sem expor o documento inteiro na interface.
      console.warn("PDF sem itens reconhecidos. Amostra de linhas:",
        linhasAgrupadas.slice(0, 30).map((linha) => `[p${linha.pagina}] ${linha.texto}`)
      );

      return NextResponse.json(
        {
          erro:
            "Encontrei texto no PDF, mas não consegui reconhecer os itens automaticamente. O layout pode ser diferente do padrão ou o documento pode ser uma tabela convertida em imagem.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      sucesso: true,
      itens,
    });
  } catch (error) {
    console.error("Erro ao processar PDF:", error);

    return NextResponse.json(
      {
        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao processar o PDF.",
      },
      { status: 500 }
    );
  }
}
