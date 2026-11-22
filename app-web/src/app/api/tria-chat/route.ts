import { NextRequest, NextResponse } from "next/server";
import {
  categories,
  stockStatus,
  targets,
  type CategoryId,
  type Shelter,
  type Alert,
} from "@/lib/demo-data";
import type { CollectionHub } from "@/lib/collection-hubs";

const MODELS_CASCADE = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite"];

const VALID_CATEGORIES = new Set<string>(categories.map((c) => c.id));

type ChatAction =
  | {
      type: "register_entry";
      shelterId: string;
      category: CategoryId;
      quantity: number;
    }
  | {
      type: "register_recycle";
      quantity: number;
    };

function buildLocalFallback(params: {
  message: string;
  profile: "citizen" | "volunteer" | "manager";
  activeShelterId: string;
  shelters: Shelter[];
  hubs: CollectionHub[];
}): { reply: string; actions: ChatAction[] } {
  const { message, profile, activeShelterId, shelters, hubs } = params;
  const q = message.toLowerCase();
  const activeShelter =
    shelters.find((s) => s.id === activeShelterId) || shelters[0];

  if (profile !== "citizen") {
    // Tenta extrair números + categorias para cadastro rápido offline/fallback
    const actions: ChatAction[] = [];
    const catMatchers: Array<{ id: CategoryId; regex: RegExp }> = [
      { id: "roupas", regex: /(\d+)\s*(?:peças?|pecas?|roupas?|casacos?|agasalhos?)/i },
      { id: "agua", regex: /(\d+)\s*(?:l|litros?|garrafas?|fardos?)?\s*(?:de\s*)?(?:água|agua)/i },
      { id: "alimentos", regex: /(\d+)\s*(?:kg|quilos?|cestas?)?\s*(?:de\s*)?(?:alimentos?|comida|arroz|feij[aã]o)/i },
      { id: "higiene", regex: /(\d+)\s*(?:kits?)?\s*(?:de\s*)?(?:higiene|fraldas?|limpeza|sabonete)/i },
      { id: "colchoes_cama", regex: /(\d+)\s*(?:unidades?|unid\.?)?\s*(?:de\s*)?(?:colch[õo]es|colchao|cobertores?|mantas?)/i },
      { id: "racao_pet", regex: /(\d+)\s*(?:kg)?\s*(?:de\s*)?(?:ra[çc][aã]o|pet)/i },
    ];

    if (
      q.includes("registr") ||
      q.includes("cheg") ||
      q.includes("adicion") ||
      q.includes("entr") ||
      q.includes("lanç") ||
      q.includes("lanc")
    ) {
      for (const m of catMatchers) {
        const hit = message.match(m.regex);
        if (hit && Number(hit[1]) > 0) {
          actions.push({
            type: "register_entry",
            shelterId: activeShelter.id,
            category: m.id,
            quantity: Math.min(10000, Number(hit[1])),
          });
        }
      }
    }

    if (actions.length > 0) {
      const summary = actions
        .map((a) => {
          if (a.type !== "register_entry") return "";
          const cat = categories.find((c) => c.id === a.category);
          return `+${a.quantity} ${cat?.unit || ""} de ${cat?.label || a.category}`;
        })
        .join(", ");
      return {
        reply: `Registrado no estoque de ${activeShelter.name}: ${summary}. A dashboard e os indicadores já foram atualizados.`,
        actions,
      };
    }

    const crit = categories
      .filter(
        (c) => stockStatus(c.id, activeShelter.stock[c.id]) === "critical",
      )
      .map((c) => `${c.label} (${activeShelter.stock[c.id]}/${targets[c.id]} ${c.unit})`);

    return {
      reply: `Resumo de ${activeShelter.name}: ${
        crit.length > 0
          ? `itens críticos agora em ${crit.join(", ")}.`
          : "sem rupturas críticas no momento."
      } Você pode me pedir para registrar entradas (ex: "Chegaram 25 roupas e 40 litros de água").`,
      actions: [],
    };
  }

  // Modo cidadão doador
  const hubsAcceptingClothes = hubs.filter((h) => h.accepting.includes("roupas"));
  const criticalShelters = shelters
    .map((s) => ({
      shelter: s,
      crits: categories
        .filter((c) => stockStatus(c.id, s.stock[c.id]) === "critical")
        .map((c) => c.label),
    }))
    .filter((item) => item.crits.length > 0)
    .sort((a, b) => b.crits.length - a.crits.length);

  if (
    q.includes("roupa") ||
    q.includes("agasalho") ||
    q.includes("casaco") ||
    q.includes("vest")
  ) {
    const hubNames = hubsAcceptingClothes
      .map((h) => `${h.name} (${h.address})`)
      .join(" ou ");
    const directShelters = shelters
      .filter((s) => stockStatus("roupas", s.stock.roupas) === "critical")
      .map((s) => s.name)
      .join(" e ");

    return {
      reply: `Para doar roupas, recomendamos levar primeiro a um Hub de Coleta para triagem organizada: ${hubNames}. (Atenção: o Hub Norte está com roupas pausado.) Se preferir, você também pode entregar direto nos abrigos com falta crítica: ${directShelters || "Albergue Dias da Cruz e Sesi-RS"}.`,
      actions: [],
    };
  }

  const top = criticalShelters
    .slice(0, 3)
    .map((c) => `• ${c.shelter.name} (${c.shelter.district}): precisa de ${c.crits.join(", ")}`)
    .join("\n");

  return {
    reply: `Estes são os abrigos que mais precisam agora:\n${top}\n\nPara roupas, sugerimos entregar em um Hub de Coleta (como o Hub Centro ou Hub Leste) para triagem, ou direto no abrigo se for mais prático para você.`,
    actions: [],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      message?: string;
      history?: Array<{ role: "user" | "assistant"; text: string }>;
      profile?: "citizen" | "volunteer" | "manager";
      activeShelterId?: string;
      shelters?: Shelter[];
      hubs?: CollectionHub[];
      alerts?: Alert[];
    };

    const message = body?.message?.trim() || "";
    const profile = body?.profile || "citizen";
    const shelters = Array.isArray(body?.shelters) ? body.shelters : [];
    const hubs = Array.isArray(body?.hubs) ? body.hubs : [];
    const alerts = Array.isArray(body?.alerts) ? body.alerts : [];
    const activeShelterId = body?.activeShelterId || shelters[0]?.id || "sesi";
    const history = Array.isArray(body?.history) ? body.history.slice(-6) : [];

    if (!message || shelters.length === 0) {
      return NextResponse.json(
        { reply: "Como posso ajudar você hoje?", actions: [] },
        { status: 200 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({
        ...buildLocalFallback({
          message,
          profile,
          activeShelterId,
          shelters,
          hubs,
        }),
        provider: "fallback",
      });
    }

    const sheltersSummary = shelters
      .map((s) => {
        const items = categories
          .map((c) => {
            const q = s.stock[c.id];
            const st = stockStatus(c.id, q);
            return `${c.id}(${c.label}): ${q}/${targets[c.id]} ${c.unit} [${st}]`;
          })
          .join("; ");
        return `- id="${s.id}" nome="${s.name}" bairro="${s.district}": ${items}`;
      })
      .join("\n");

    const hubsSummary = hubs
      .map(
        (h) =>
          `- id="${h.id}" nome="${h.name}" endereço="${h.address}" horário="${h.hours}" aceita=[${h.accepting.join(
            ", ",
          )}] pausado=[${h.paused.join(", ") || "nenhum"}]`,
      )
      .join("\n");

    const alertsSummary = alerts
      .map((a) => `- abrigo="${a.shelterId}": ${a.message}`)
      .join("\n");

    const historyText = history
      .map((h) => `${h.role === "user" ? "Usuário" : "TrIA"}: ${h.text}`)
      .join("\n");

    const activeShelterName =
      shelters.find((s) => s.id === activeShelterId)?.name || activeShelterId;

    const systemPrompt = `Você é o Assistente Inteligente da plataforma TrIA em Porto Alegre.
Perfil ativo do usuário na interface: "${profile}" (citizen = Doador; volunteer = Voluntário na triagem; manager = Organização do Abrigo).
Abrigo selecionado no painel agora: id="${activeShelterId}" (${activeShelterName}).

ESTADO ATUAL DOS ABRIGOS:
${sheltersSummary}

HUBS DE COLETA DISPONÍVEIS:
${hubsSummary}

ALERTAS ABERTOS:
${alertsSummary || "Nenhum."}

HISTÓRICO RECENTE:
${historyText || "Início da conversa."}

MENSAGEM ATUAL DO USUÁRIO: "${message}"

REGRAS OBRIGATÓRIAS:
1. Responda sempre em português claro, curto e direto (sem travessão "—").
2. SE o perfil for "citizen" (Doador):
   - Diga onde precisa de mais doações, o que ele pode doar e onde levar.
   - SEMPRE sugira que DOAÇÕES DE ROUPAS sejam levadas preferencialmente para um Hub de Coleta que esteja aceitando roupas (ex: Hub Centro, Hub Leste ou Hub Sul; avise que o Hub Norte está com roupas pausado), explicando que isso organiza a triagem, mas deixe claro que ele também pode levar direto ao abrigo se preferir.
   - Nunca registre entradas no estoque no modo "citizen" ("actions": []).
3. SE o perfil for "volunteer" ou "manager" (Voluntário ou Abrigo):
   - Ajude a analisar estoques, organizar prioridades e responder dúvidas operacionais.
   - SE o usuário pedir para registrar, dar entrada, adicionar ou informar que chegaram itens no estoque (ex: "chegaram 20 casacos e 50L de água", "registra 10 cobertores no Demhab"), retorne os lançamentos em "actions" com:
     {"type": "register_entry", "shelterId": "<id valido do abrigo, padrao: ${activeShelterId}>", "category": "roupas"|"agua"|"alimentos"|"higiene"|"colchoes_cama"|"racao_pet", "quantity": <inteiro positivo>}
   - Se o usuário pedir para adicionar peças descartadas/ruins para reciclagem têxtil, use:
     {"type": "register_recycle", "quantity": <inteiro positivo>}
   - Confirme na resposta ("reply") exatamente o que foi registrado no estoque.

Retorne APENAS um JSON válido com estas 2 chaves:
{
  "reply": "texto da resposta para exibir no chat",
  "actions": []
}`;

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
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.25,
            },
          }),
        });

        clearTimeout(timeout);

        if (resp.ok) {
          const data = await resp.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const parsed = JSON.parse(rawText);

          if (parsed && typeof parsed.reply === "string") {
            const safeActions: ChatAction[] = [];
            if (profile !== "citizen" && Array.isArray(parsed.actions)) {
              for (const act of parsed.actions) {
                if (
                  act?.type === "register_entry" &&
                  VALID_CATEGORIES.has(act.category) &&
                  Number(act.quantity) > 0
                ) {
                  const targetShelter = shelters.some(
                    (s) => s.id === act.shelterId,
                  )
                    ? act.shelterId
                    : activeShelterId;
                  safeActions.push({
                    type: "register_entry",
                    shelterId: targetShelter,
                    category: act.category as CategoryId,
                    quantity: Math.min(10000, Math.round(Number(act.quantity))),
                  });
                } else if (
                  act?.type === "register_recycle" &&
                  Number(act.quantity) > 0
                ) {
                  safeActions.push({
                    type: "register_recycle",
                    quantity: Math.min(10000, Math.round(Number(act.quantity))),
                  });
                }
              }
            }

            return NextResponse.json({
              reply: parsed.reply,
              actions: safeActions,
              provider: model,
            });
          }
        }
      } catch {
        // tenta próximo modelo
      }
    }

    return NextResponse.json({
      ...buildLocalFallback({
        message,
        profile,
        activeShelterId,
        shelters,
        hubs,
      }),
      provider: "fallback",
    });
  } catch {
    return NextResponse.json({
      reply:
        "Não consegui consultar a rede agora. Tente novamente em instantes.",
      actions: [],
      provider: "fallback",
    });
  }
}
