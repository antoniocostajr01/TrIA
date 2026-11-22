"use client";

import { useEffect, useRef, useState } from "react";
import type { Alert, Shelter } from "@/lib/demo-data";
import { collectionHubs } from "@/lib/collection-hubs";
import { Loader2, MessageSquare, Send, Sparkles, X } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const DONOR_PROMPTS = [
  "Onde precisa de mais doações agora?",
  "Quero doar roupas, onde levo?",
  "O que posso doar hoje?",
];

export function DonorChatbot({
  shelters,
  alerts,
}: {
  shelters: Shelter[];
  alerts: Alert[];
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "donor-welcome",
      role: "assistant",
      text: "Olá! Quer ajudar hoje? Me diga o que você tem para doar e eu te indico o melhor ponto — para roupas, sempre sugerimos um Hub de Coleta aberto, mas você também pode levar direto a um abrigo.",
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
      id: `du-${Date.now()}`,
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
          profile: "citizen",
          shelters,
          hubs: collectionHubs,
          alerts,
        }),
      });
      const data = await resp.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `da-${Date.now()}`,
          role: "assistant",
          text:
            data.reply ||
            "Você pode consultar no mapa os hubs abertos para roupas e os abrigos com falta urgente.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `da-${Date.now()}`,
          role: "assistant",
          text: "Erro de conexão com o assistente de doações. Tente novamente em instantes.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tria-chat-root">
      {!open ? (
        <button
          type="button"
          className="tria-chat-fab"
          onClick={() => setOpen(true)}
          aria-label="Abrir chat de orientação ao doador"
        >
          <MessageSquare size={18} />
          <span>Onde doar? Chat IA</span>
        </button>
      ) : (
        <section
          className="tria-chat-window"
          role="dialog"
          aria-label="Assistente de Doações TrIA"
        >
          <header className="tria-chat-header">
            <div>
              <strong>
                <Sparkles size={15} />
                Assistente de Doações
              </strong>
              <small>Abrigos urgentes e Hubs para roupas</small>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Fechar chat do doador"
              onClick={() => setOpen(false)}
            >
              <X size={17} />
            </button>
          </header>

          <div className="tria-chat-messages" ref={listRef}>
            {messages.map((m) => (
              <div key={m.id} className={`tria-chat-bubble ${m.role}`}>
                <p>{m.text}</p>
              </div>
            ))}
            {loading && (
              <div className="tria-chat-bubble assistant">
                <span className="tria-chat-typing">
                  <Loader2 size={14} className="spin-icon" />
                  Consultando abrigos e hubs...
                </span>
              </div>
            )}
          </div>

          <div className="tria-chat-quick">
            {DONOR_PROMPTS.map((qp) => (
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
              placeholder="Ex: Tenho roupas e água, onde levo?"
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
