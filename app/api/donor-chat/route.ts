import { NextRequest, NextResponse } from "next/server";
import { CATEGORY_META, SupplyCategory } from "@/context/TriaContext";

function buildSmartLocalReply(message: string, shelters: any[]): string {
  const q = message.toLowerCase();

  const catKeywords: Array<{ cat: SupplyCategory; terms: string[] }> = [
    {
      cat: "roupas",
      terms: ["roupa", "agasalho", "casaco", "moletom", "calça", "camisa", "sapato", "calçado", "meia", "vestuário"],
    },
    {
      cat: "agua",
      terms: ["água", "agua", "galão", "fardo", "garrafa", "sede", "potável"],
    },
    {
      cat: "alimentos",
      terms: ["comida", "alimento", "cesta", "arroz", "feijão", "leite", "marmita"],
    },
    {
      cat: "higiene",
      terms: ["higiene", "fralda", "sabonete", "limpeza", "escova", "absorvente", "cloro"],
    },
    {
      cat: "colchoes_cama",
      terms: ["colchão", "colchao", "cobertor", "manta", "cama", "lençol", "travesseiro", "toalha"],
    },
    {
      cat: "racao_pet",
      terms: ["ração", "racao", "pet", "cachorro", "cão", "gato", "animal"],
    },
  ];

  // Verifica se o usuário perguntou de um abrigo específico
  const mentionedShelter = shelters.find(
    (s) =>
      q.includes(s.nome.toLowerCase()) ||
      (q.includes("sesi") && s.id === "sesi-rs") ||
      (q.includes("dorot") && s.id === "santa-doroteia") ||
      (q.includes("demhab") && s.id === "demhab") ||
      (q.includes("farrapos") && s.id === "clube-farrapos") ||
      (q.includes("dias da cruz") && s.id === "dias-da-cruz")
  );

  if (mentionedShelter) {
    const crit = Object.values(mentionedShelter.estoque)
      .filter((c: any) => c.status === "critico")
      .map((c: any) => `${CATEGORY_META[c.categoria as SupplyCategory].label} (${c.detalhe})`);
    const exc = Object.values(mentionedShelter.estoque)
      .filter((c: any) => c.status === "excedente")
      .map((c: any) => CATEGORY_META[c.categoria as SupplyCategory].label);

    return `No ${mentionedShelter.nome} (${mentionedShelter.endereco}, ${mentionedShelter.bairro}):\n• O que mais precisa agora: ${
      crit.length > 0 ? crit.join("; ") : "nenhum item em estado crítico no momento"
    }.\n${
      exc.length > 0
        ? `• Evite levar para lá: ${exc.join(", ")} (coleta suspensa por excesso de estoque).`
        : "• Todos os recebimentos estão abertos."
    }`;
  }

  // Verifica se o usuário falou de uma categoria específica
  const matchedCat = catKeywords.find((ck) =>
    ck.terms.some((t) => q.includes(t))
  );

  if (matchedCat) {
    const cat = matchedCat.cat;
    const label = CATEGORY_META[cat].label;
    const urgentShelters = shelters.filter(
      (s) => s.estoque[cat]?.status === "critico"
    );
    const suspendedShelters = shelters.filter(
      (s) => s.estoque[cat]?.status === "excedente"
    );

    const urgentText =
      urgentShelters.length > 0
        ? urgentShelters
            .map(
              (s) =>
                `${s.nome} (${s.bairro} - ${s.endereco}: ${s.estoque[cat].detalhe})`
            )
            .join(" e ")
        : "nenhum abrigo está em alerta vermelho para esse item agora, mas abrigos em status estável estão recebendo";

    const suspendedText =
      suspendedShelters.length > 0
        ? `Evite levar para ${suspendedShelters
            .map((s) => s.nome)
            .join(" ou ")}, pois a coleta de ${label.toLowerCase()} está suspensa lá por excesso.`
        : "";

    return `Para doar ${label}:\n• Prioridade máxima: ${urgentText}.\n${
      suspendedText ? `• Atenção: ${suspendedText}` : ""
    }`;
  }

  // Resumo geral dos mais críticos da cidade
  const ranking = [...shelters]
    .map((s) => ({
      shelter: s,
      critList: Object.values(s.estoque)
        .filter((c: any) => c.status === "critico")
        .map((c: any) => CATEGORY_META[c.categoria as SupplyCategory].label),
    }))
    .filter((r) => r.critList.length > 0)
    .sort((a, b) => b.critList.length - a.critList.length);

  if (ranking.length === 0) {
    return "No momento todos os abrigos monitorados em Porto Alegre estão com estoques estáveis! Você pode consultar o mapa para ver o ponto mais próximo de você.";
  }

  const topLines = ranking
    .slice(0, 3)
    .map(
      (r) =>
        `• ${r.shelter.nome} (${r.shelter.bairro}): precisa urgente de ${r.critList.join(", ")}.`
    )
    .join("\n");

  return `Aqui estão os abrigos que mais precisam de doações agora em Porto Alegre:\n${topLines}\n\nMe diga o que você tem em casa (ex: roupas de frio, água, fraldas, alimentos ou ração) que eu te indico o melhor endereço!`;
}

export async function POST(req: NextRequest) {
  try {
    const { message, shelters, alerts } = await req.json();

    if (!message || !Array.isArray(shelters)) {
      return NextResponse.json(
        { reply: "Como posso ajudar você a direcionar sua doação hoje?" },
        { status: 200 }
      );
    }

    const fallbackReply = buildSmartLocalReply(message, shelters);
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (apiKey) {
      try {
        const snapshot = shelters
          .map((s: any) => {
            const crits = Object.values(s.estoque)
              .filter((c: any) => c.status === "critico")
              .map(
                (c: any) =>
                  `${CATEGORY_META[c.categoria as SupplyCategory]?.label || c.categoria} (${c.quantidade}/${c.meta} ${c.unidade} - ${c.detalhe})`
              );
            const excs = Object.values(s.estoque)
              .filter((c: any) => c.status === "excedente")
              .map(
                (c: any) =>
                  CATEGORY_META[c.categoria as SupplyCategory]?.label || c.categoria
              );
            return `- ${s.nome} (${s.bairro}, ${s.endereco}, ocupação ${s.ocupacaoAtual}/${s.capacidade}): URGENTE=[${
              crits.join("; ") || "nenhum"
            }] | SUSPENSO_POR_EXCESSO=[${excs.join(", ") || "nenhum"}]`;
          })
          .join("\n");

        const openAlerts = (alerts || [])
          .filter((a: any) => a.status === "aberto")
          .map(
            (a: any) =>
              `- Alerta de ${a.shelterName}: precisa de ${a.quantidadeNecessaria} ${a.unidade} de ${a.itemEspecifico}`
          )
          .join("\n");

        const prompt = `Você é o Assistente de Doações da plataforma TrIA em Porto Alegre.
Responda ao cidadão em português de forma muito clara, acolhedora, direta e curta (máximo 4 linhas ou 3 tópicos curtos, SEM usar travessão "—").
Use EXCLUSIVAMENTE os dados reais em tempo real abaixo para indicar qual abrigo mais precisa do item, informar o endereço/bairro e alertar onde NÃO levar caso haja excesso:

ESTADO ATUAL DOS ABRIGOS EM PORTO ALEGRE:
${snapshot}

ALERTAS URGENTES ABERTOS:
${openAlerts || "Nenhum alerta extra."}

PERGUNTA DO CIDADÃO: "${message}"`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          apiKey
        )}`;

        const resp = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.25, maxOutputTokens: 280 },
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const text =
            data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            return NextResponse.json({
              reply: text,
              provider: "gemini-2.5-flash",
            });
          }
        }
      } catch {
        // usa fallback calculado sobre o estoque real
      }
    }

    return NextResponse.json({
      reply: fallbackReply,
      provider: "estoque-tempo-real",
    });
  } catch {
    return NextResponse.json({
      reply:
        "No momento o Ginásio do Sesi-RS (Zona Norte) e o Albergue Dias da Cruz (Azenha) são os que mais precisam de roupas de frio, água e kits de higiene.",
      provider: "fallback",
    });
  }
}
