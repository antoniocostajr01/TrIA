import { NextRequest, NextResponse } from "next/server";

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}

export async function POST(req: NextRequest) {
  try {
    const { activeShelterId, shelters } = await req.json();
    const current = shelters.find((s: any) => s.id === activeShelterId) || shelters[0];

    // Calcula automaticamente matches reais baseados na distância em POA e estoques excedentes vs críticos
    const matchesDeterminiscos: Array<{
      id: string;
      fromShelterId: string;
      fromShelterName: string;
      toShelterId: string;
      toShelterName: string;
      categoria: string;
      categoriaLabel: string;
      quantidadeSugerida: number;
      unidade: string;
      distanciaKm: number;
      motivo: string;
    }> = [];

    const catLabels: Record<string, string> = {
      roupas: "Roupas e Agasalhos",
      agua: "Água Potável",
      alimentos: "Alimentos e Cestas",
      higiene: "Higiene e Limpeza",
      colchoes_cama: "Colchões e Cobertores",
      racao_pet: "Ração e Insumos Pet",
    };

    for (const catKey of Object.keys(current.estoque)) {
      const itemLocal = current.estoque[catKey];
      if (itemLocal.status === "critico") {
        const deficit = Math.max(20, itemLocal.meta - itemLocal.quantidade);
        for (const other of shelters) {
          if (other.id === current.id) continue;
          const otherItem = other.estoque[catKey];
          if (otherItem && otherItem.status === "excedente") {
            const sobra = Math.max(20, otherItem.quantidade - otherItem.meta);
            const qtd = Math.min(deficit, sobra);
            const dist = haversineKm(
              current.lat,
              current.lng,
              other.lat,
              other.lng
            );
            matchesDeterminiscos.push({
              id: `match-${other.id}-${current.id}-${catKey}`,
              fromShelterId: other.id,
              fromShelterName: other.nome,
              toShelterId: current.id,
              toShelterName: current.nome,
              categoria: catKey,
              categoriaLabel: catLabels[catKey] || catKey,
              quantidadeSugerida: qtd,
              unidade: itemLocal.unidade,
              distanciaKm: dist,
              motivo: `${other.nome} está com +${sobra} ${itemLocal.unidade} acima da meta a ${dist} km, enquanto ${current.nome} opera em nível crítico (${itemLocal.quantidade}/${itemLocal.meta}).`,
            });
          }
        }
      } else if (itemLocal.status === "excedente") {
        const sobra = Math.max(20, itemLocal.quantidade - itemLocal.meta);
        for (const other of shelters) {
          if (other.id === current.id) continue;
          const otherItem = other.estoque[catKey];
          if (otherItem && otherItem.status === "critico") {
            const deficit = Math.max(20, otherItem.meta - otherItem.quantidade);
            const qtd = Math.min(deficit, sobra);
            const dist = haversineKm(
              current.lat,
              current.lng,
              other.lat,
              other.lng
            );
            matchesDeterminiscos.push({
              id: `match-${current.id}-${other.id}-${catKey}`,
              fromShelterId: current.id,
              fromShelterName: current.nome,
              toShelterId: other.id,
              toShelterName: other.nome,
              categoria: catKey,
              categoriaLabel: catLabels[catKey] || catKey,
              quantidadeSugerida: qtd,
              unidade: itemLocal.unidade,
              distanciaKm: dist,
              motivo: `Seu abrigo possui excedente de +${sobra} ${itemLocal.unidade} que pode suprir o alerta crítico de ${other.nome} (a ${dist} km).`,
            });
          }
        }
      }
    }

    matchesDeterminiscos.sort((a, b) => a.distanciaKm - b.distanciaKm);

    const criticos = Object.values(current.estoque)
      .filter((c: any) => c.status === "critico")
      .map((c: any) => catLabels[c.categoria]);
    const excedentes = Object.values(current.estoque)
      .filter((c: any) => c.status === "excedente")
      .map((c: any) => catLabels[c.categoria]);

    let diagnosticoIA =
      criticos.length > 0
        ? `Atenção operacional em ${current.nome} (${current.ocupacaoAtual}/${current.capacidade} acolhidos): déficit crítico detectado em ${criticos.join(
            ", "
          )}. ${
            excedentes.length > 0
              ? `Há excedente em ${excedentes.join(
                  ", "
                )} com coleta recomendada para suspensão no mapa público.`
              : "Recomendado acionar remessa direta dos abrigos parceiros com estoque excedente abaixo."
          }`
        : `Estoque de ${current.nome} encontra-se sem rupturas críticas no momento.${
            excedentes.length > 0
              ? ` Excedentes em ${excedentes.join(
                  ", "
                )} podem ser redistribuídos via Transporte Solidário / Defesa Civil para unidades em alerta.`
              : ""
          }`;

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (apiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          apiKey
        )}`;
        const prompt = `Analise rapidamente em até 2 frases diretas (sem usar travessão) a situação do estoque do abrigo "${current.nome}" (${current.ocupacaoAtual}/${current.capacidade} vagas) em Porto Alegre:
Itens críticos: ${criticos.join(", ") || "nenhum"}.
Itens excedentes: ${excedentes.join(", ") || "nenhum"}.
Matches encontrados na rede: ${matchesDeterminiscos.length}.`;

        const resp = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.25, maxOutputTokens: 160 },
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (txt) diagnosticoIA = txt;
        }
      } catch {
        // usa diagnóstico calculado
      }
    }

    return NextResponse.json({
      diagnosticoLocal: diagnosticoIA,
      criticosCount: criticos.length,
      excedentesCount: excedentes.length,
      parceriasSugeridas: matchesDeterminiscos.slice(0, 5),
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao processar análise de estoque" },
      { status: 500 }
    );
  }
}
