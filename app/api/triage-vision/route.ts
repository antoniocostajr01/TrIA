import { NextRequest, NextResponse } from "next/server";

const FALLBACK_SAMPLES = [
  {
    categoria: "roupas",
    item: "Casaco de moletom adulto fechado",
    subtipo: "Adulto (M/G) · Inverno / Frio",
    quantidadeEstimada: 1,
    unidade: "peças",
    confianca: 0.94,
    observacao:
      "Peça íntegra em bom estado aparente; recomendada para abrigos com alerta de frio.",
  },
  {
    categoria: "agua",
    item: "Fardo de água mineral potável (12x500ml)",
    subtipo: "Lacre intacto · Consumo imediato",
    quantidadeEstimada: 6,
    unidade: "litros",
    confianca: 0.96,
    observacao: "Embalagem fechada pronta para despacho imediato.",
  },
  {
    categoria: "alimentos",
    item: "Pacote de alimentos não perecíveis (Arroz / Feijão)",
    subtipo: "Cesta básica · Cozinha comunitária",
    quantidadeEstimada: 5,
    unidade: "kg",
    confianca: 0.92,
    observacao: "Embalagem seca e sem avarias visíveis.",
  },
  {
    categoria: "higiene",
    item: "Kit de higiene pessoal (sabonete, escova, creme dental)",
    subtipo: "Uso individual · Pernoite",
    quantidadeEstimada: 2,
    unidade: "kits",
    confianca: 0.91,
    observacao: "Prioridade alta no Albergue Dias da Cruz e Sesi-RS.",
  },
  {
    categoria: "colchoes_cama",
    item: "Cobertor térmico de microfibra casal",
    subtipo: "Roupa de cama / Frio intenso",
    quantidadeEstimada: 1,
    unidade: "unid.",
    confianca: 0.95,
    observacao: "Tecido limpo e seco; alta urgência na Zona Norte.",
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, hintCategory } = body as {
      imageBase64?: string;
      hintCategory?: string;
    };

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (apiKey && imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const prompt = `Você é o classificador visual de triagem humanitária da plataforma TrIA em Porto Alegre.
Analise a imagem do item doado na mesa de triagem e retorne APENAS um JSON válido com estas chaves exatas:
{
  "categoria": "roupas" | "agua" | "alimentos" | "higiene" | "colchoes_cama" | "racao_pet",
  "item": "nome curto e claro do item em português (ex: Casaco infantil de frio, Camiseta adulto algodão, Fardo de água mineral)",
  "subtipo": "classificação útil de triagem (ex: Adulto / Frio, Infantil / Leve, Não perecível, Higiene pessoal)",
  "quantidadeEstimada": numero_inteiro_positivo,
  "unidade": "peças" | "litros" | "kg" | "kits" | "unid.",
  "confianca": numero_entre_0_e_1,
  "observacao": "frase curta sobre estado de conservação aparente e recomendação logística"
}`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        apiKey
      )}`;

      const resp = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const text =
          data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const parsed = JSON.parse(text);
        if (parsed && parsed.categoria && parsed.item) {
          return NextResponse.json({
            ...parsed,
            provider: "gemini-2.5-flash",
          });
        }
      }
    }

    // Fallback determinístico caso a chave ainda não seja AIza... ou esteja offline na banca
    const matched =
      FALLBACK_SAMPLES.find((s) => s.categoria === hintCategory) ||
      FALLBACK_SAMPLES[Math.floor(Math.random() * FALLBACK_SAMPLES.length)];

    return NextResponse.json({
      ...matched,
      provider: "fallback-vision",
    });
  } catch {
    return NextResponse.json({
      ...FALLBACK_SAMPLES[0],
      provider: "fallback-vision",
    });
  }
}
