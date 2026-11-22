"use client";

import { useEffect, useRef, useState } from "react";
import {
  categories,
  type Alert,
  type CategoryId,
  type Shelter,
} from "@/lib/demo-data";
import { collectionHubs } from "@/lib/collection-hubs";
import { Check, Loader2, MessageSquare, Send, Sparkles, X } from "lucide-react";

export type TriaChatAction =
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

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  appliedLabels?: string[];
};

const QUICK_BY_PROFILE = {
  citizen: [
    "Onde precisa de mais doações agora?",
    "Quero doar roupas, onde levo?",
    "O que posso doar hoje?",
  ],
  volunteer: [
    "Chegaram 25 roupas e 30 litros de água aqui",
    "Registrar 15 kits de higiene no estoque",
    "Como está o estoque deste abrigo?",
  ],
  manager: [
    "Como está o estoque do meu abrigo?",
    "Registrar 40 litros de água e 10 cobertores",
    "O que priorizar nos alertas?",
  ],
} as const;

export function TriaChatbot({
  profile,
  activeShelterId,
  shelters,
  alerts,
  onApplyActions,
}: {
  profile: "citizen" | "volunteer" | "manager";
  activeShelterId: string;
  shelters: Shelter[];
  alerts: Alert[];
  onApplyActions: (actions: TriaChatAction[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Olá! Posso te mostrar onde doar com mais urgência (incluindo hubs para roupas) ou ajudar o abrigo a registrar entradas direto no estoque.",
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    const nextHistory = [...messages, userMsg].map((m) => ({
      role: m.role,
      text: m.text,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch("/api/tria-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: nextHistory,
          profile,
          activeShelterId,
          shelters,
          hubs: collectionHubs,
          alerts,
        }),
      });
      const data = await resp.json();
      const actions: TriaChatAction[] = Array.isArray(data.actions)
        ? data.actions
        : [];

      const appliedLabels: string[] = [];
      if (actions.length > 0) {
        onApplyActions(actions);
        for (const act of actions) {
          if (act.type === "register_entry") {
            const cat = categories.find((c) => c.id === act.category);
            const sh = shelters.find((s) => s.id === act.shelterId);
            appliedLabels.push(
              `+${act.quantity} ${cat?.unit || ""} de ${cat?.label || act.category} (${sh?.name || act.shelterId})`,
            );
          } else if (act.type === "register_recycle") {
            appliedLabels.push(`+${act.quantity} peças para reciclagem`);
          }
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text:
            data.reply ||
            "Verifique os estoques no mapa ou me informe quais itens chegaram.",
          appliedLabels: appliedLabels.length > 0 ? appliedLabels : undefined,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: "Erro de conexão com o assistente. Tente novamente em instantes.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const quickPrompts = QUICK_BY_PROFILE[profile];
  const activeShelter = shelters.find((s) => s.id === activeShelterId);

  return (
    <div className="tria-chat-root">
      {!open ? (
        <button
          type="button"
          className="tria-chat-fab"
          onClick={() => setOpen(true)}
          aria-label="Abrir assistente TrIA"
        >
          <MessageSquare size={18} />
          <span>
            {profile === "citizen" ? "Onde doar? Chat IA" : "Registrar via Chat IA"}
          </span>
        </button>
      ) : (
        <section
          className="tria-chat-window"
          role="dialog"
          aria-label="Assistente Inteligente TrIA"
        >
          <header className="tria-chat-header">
            <div>
              <strong>
                <Sparkles size={15} />
                Assistente TrIA
              </strong>
              <small>
                {profile === "citizen"
                  ? "Orientação de doações e hubs"
                  : `Operando em ${activeShelter?.name || "Abrigo"}`}
              </small>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Fechar chat"
              onClick={() => setOpen(false)}
            >
              <X size={17} />
            </button>
          </header>

          <div className="tria-chat-messages" ref={listRef}>
            {messages.map((m) => (
              <div key={m.id} className={`tria-chat-bubble ${m.role}`}>
                <p>{m.text}</p>
                {m.appliedLabels && (
                  <div className="tria-chat-applied">
                    {m.appliedLabels.map((lbl, idx) => (
                      <span key={idx}>
                        <Check size={12} />
                        {lbl}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="tria-chat-bubble assistant">
                <span className="tria-chat-typing">
                  <Loader2 size={14} className="spin-icon" />
                  Consultando rede TrIA...
                </span>
              </div>
            )}
          </div>

          <div className="tria-chat-quick">
            {quickPrompts.map((qp) => (
              <button
                key={qp}
                type="button"
                disabled={loading}
                onClick={() => sendMessage(qp)}
              >
                {qp}
              </button>
            ))}
          </div>

          <form
            className="tria-chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                profile === "citizen"
                  ? "Ex: Tenho roupas e água, onde levo?"
                  : "Ex: Chegaram 20 casacos e 30L de água"
              }
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Enviar mensagem"
            >
              <Send size={15} />
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
