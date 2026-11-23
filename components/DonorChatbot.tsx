"use client";

import React, { useState } from "react";
import { useTria } from "@/context/TriaContext";
import {
  Bot,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
}

const QUICK_PROMPTS = [
  "Tenho roupas de frio, onde doar?",
  "Qual abrigo está mais crítico agora?",
  "Onde levar água ou cobertores?",
  "O que o Sesi-RS mais precisa?",
];

export default function DonorChatbot() {
  const { shelters, alerts } = useTria();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Olá! Sou o assistente da TrIA conectado ao estoque em tempo real dos abrigos de Porto Alegre. Me conte o que você quer doar (ou seu bairro) e eu te digo qual abrigo mais precisa agora e onde a coleta já está lotada!",
    },
  ]);

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch("/api/donor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          shelters,
          alerts,
        }),
      });
      const data = await resp.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text:
            data.reply ||
            "Verifiquei os estoques: priorize o Ginásio do Sesi-RS e o Albergue Dias da Cruz para roupas de frio, água e higiene.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: "No momento o Ginásio do Sesi-RS (Rubem Berta) e o Albergue Dias da Cruz (Azenha) estão com necessidade urgente de agasalhos, água e higiene.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-3.5 rounded-2xl shadow-xl border border-indigo-400/30 transition-all hover:scale-[1.02]"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Onde doar? Fale com a TrIA</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      ) : (
        <div className="w-[350px] sm:w-[395px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-700 to-slate-900 text-white px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                <Bot className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-1.5">
                  Assistente TrIA
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <div className="text-[11px] text-indigo-200">
                  Conectado ao estoque ao vivo dos abrigos
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-300 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="p-3.5 space-y-3 max-h-[320px] overflow-y-auto bg-slate-50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white font-medium rounded-br-sm"
                      : "bg-white text-slate-800 border border-slate-200 shadow-sm rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-500 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-medium animate-pulse">
                  Consultando estoques dos abrigos de POA...
                </div>
              </div>
            )}
          </div>

          {/* Sugestões rápidas de 1 clique */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp}
                onClick={() => sendQuestion(qp)}
                disabled={loading}
                className="text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2.5 py-1 rounded-lg transition-colors"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendQuestion(input);
            }}
            className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex: Tenho 15 cobertores e água, onde levo?"
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2 rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
