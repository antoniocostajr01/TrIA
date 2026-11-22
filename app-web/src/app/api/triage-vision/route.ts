import { NextRequest, NextResponse } from "next/server";

const VALID_CATEGORIES = new Set([
  "roupas",
  "agua",
  "alimentos",
  "higiene",
  "colchoes_cama",
  "racao_pet",
]);

const MODELS_CASCADE = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
];

const FALLBACK_SAMPLE = {
  category: "roupas",
  item: "Peça de vestuário / agasalho (Fallback)",
  quantity: 1,
  confidence: 0.9,
  observation: "Fallback local ativado porque os modelos da API estavam indisponíveis.",
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { imageBase64?: string };
    const imageBase64 = body?.imageBase64;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "Imagem não enviada." },
        { status: 400 },
      );
    }

    const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const cleanBase64 = imageBase64.replace(
      /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
      "",
    );

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json({
        ...FALLBACK_SAMPLE,
        provider: "fallback",
        warning: "GEMINI_API_KEY não configurada em app-web/.env.local.",
      });
    }

    const prompt = `Você é o classificador visual da plataforma TrIA para triagem de doações em abrigos de Porto Alegre.
Analise a imagem enviada e retorne APENAS um JSON válido com estas chaves exatas:
{
  "category": "roupas" | "agua" | "alimentos" | "higiene" | "colchoes_cama" | "racao_pet" | "nao_identificado",
  "item": "descrição específica do que você está vendo em português (ex: Camiseta de algodão cinza, Casaco de moletom adulto, Garrafa de água mineral, Sabonete em barra)",
  "quantity": numero_inteiro_positivo,
  "confidence": numero_entre_0_e_1,
  "observation": "frase curta com detalhes úteis (cor, público adulto/infantil, estação frio/leve ou estado aparente)"
}
Se a imagem não mostrar nenhum item de doação identificável (foto preta, borrada ou parede vazia), use category "nao_identificado" e quantity 1.`;

    let lastError = "Nenhum modelo respondeu.";

    for (const model of MODELS_CASCADE) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 9000);

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          apiKey,
        )}`;

        const resp = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType,
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

        clearTimeout(timeout);

        if (resp.ok) {
          const data = await resp.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const parsed = JSON.parse(rawText);

          if (parsed && parsed.category === "nao_identificado") {
            return NextResponse.json({
              category: "roupas",
              item: String(parsed.item || "Item não identificado claramente"),
              quantity: 1,
              confidence: Number(parsed.confidence) || 0.3,
              observation: String(
                parsed.observation ||
                  "Não foi possível identificar o item com clareza. Tente aproximar e iluminar melhor.",
              ),
              provider: model,
              unidentified: true,
            });
          }

          if (parsed && VALID_CATEGORIES.has(parsed.category)) {
            return NextResponse.json({
              category: parsed.category,
              item: String(parsed.item || "Item identificado"),
              quantity: Math.max(1, Math.round(Number(parsed.quantity) || 1)),
              confidence: Number(parsed.confidence) || 0.92,
              observation: String(parsed.observation || ""),
              provider: model,
            });
          }
        } else {
          const errPayload = await resp.json().catch(() => ({}));
          lastError =
            errPayload?.error?.message || `HTTP ${resp.status} em ${model}`;
        }
      } catch (err) {
        lastError =
          err instanceof Error ? err.message : `Timeout/erro em ${model}`;
      }
    }

    return NextResponse.json({
      ...FALLBACK_SAMPLE,
      provider: "fallback",
      warning: lastError,
    });
  } catch {
    return NextResponse.json({
      ...FALLBACK_SAMPLE,
      provider: "fallback",
      warning: "Falha ao processar imagem localmente.",
    });
  }
}
