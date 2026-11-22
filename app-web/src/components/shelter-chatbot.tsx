"use client";

import { useEffect, useRef, useState } from "react";
import {
  categories,
  type Alert,
  type CategoryId,
  type Shelter,
} from "@/lib/demo-data";
import { collectionHubs } from "@/lib/collection-hubs";
import {
  Building2,
  Check,
  ImagePlus,
  Loader2,
  Send,
  Sparkles,
  X,
} from "lucide-react";

export type ShelterChatAction =
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

type ShelterChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  imagePreview?: string;
  appliedLabels?: string[];
};

const SHELTER_PROMPTS = [
  "Como está o estoque deste abrigo?",
  "Chegaram 25 roupas e 30 litros de água aqui",
  "Registrar 15 kits de higiene no estoque",
];

export function ShelterChatbot({
  profile,
  activeShelterId,
  shelters,
  alerts,
  onApplyActions,
}: {
  profile: "volunteer" | "manager";
  activeShelterId: string;
  shelters: Shelter[];
  alerts: Alert[];
  onApplyActions: (actions: ShelterChatAction[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ShelterChatMessage[]>([
    {
      id: "shelter-welcome",
      role: "assistant",
      text: "Olá, equipe do abrigo! Você pode digitar o que chegou (ex: '20 casacos e 40L de água') ou enviar uma foto dos itens pelo ícone de imagem que eu identifico e lanço direto na dashboard.",
    },
  ]);

  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function sendMessage(text: string, customImage?: string | null) {
    const trimmed = text.trim();
    const imgToSend = customImage !== undefined ? customImage : attachedImage;
    if ((!trimmed && !imgToSend) || loading) return;

    const userMsg: ShelterChatMessage = {
      id: `su-${Date.now()}`,
      role: "user",
      text: trimmed || "Foto de doação enviada para registro no estoque.",
      imagePreview: imgToSend || undefined,
    };

    const nextHistory = [...messages, userMsg].map((m) => ({
      role: m.role,
      text: m.text,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachedImage(null);
    setLoading(true);

    try {
      const resp = await fetch("/api/tria-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          imageBase64: imgToSend || undefined,
          history: nextHistory,
          profile,
          activeShelterId,
          shelters,
          hubs: collectionHubs,
          alerts,
        }),
      });
      const data = await resp.json();
      const actions: ShelterChatAction[] = Array.isArray(data.actions)
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
          id: `sa-${Date.now()}`,
          role: "assistant",
          text:
            data.reply ||
            "Não consegui interpretar os itens. Informe a quantidade e o tipo ou envie outra foto.",
          appliedLabels: appliedLabels.length > 0 ? appliedLabels : undefined,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `sa-${Date.now()}`,
          role: "assistant",
          text: "Erro ao comunicar com o assistente do abrigo. Tente novamente.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handlePickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAttachedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const activeShelter = shelters.find((s) => s.id === activeShelterId);

  return (
    <div className="tria-chat-root">
      {!open ? (
        <button
          type="button"
          className="tria-chat-fab shelter-fab"
          onClick={() => setOpen(true)}
          aria-label="Abrir copiloto do abrigo"
        >
          <Building2 size={18} />
          <span>Estoque & Foto via Chat IA</span>
        </button>
      ) : (
        <section
          className="tria-chat-window"
          role="dialog"
          aria-label="Copiloto do Abrigo TrIA"
        >
          <header className="tria-chat-header">
            <div>
              <strong>
                <Sparkles size={15} />
                Copiloto do Abrigo
              </strong>
              <small>
                {activeShelter?.name || "Abrigo"} · Texto ou Foto
              </small>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Fechar chat do abrigo"
              onClick={() => setOpen(false)}
            >
              <X size={17} />
            </button>
          </header>

          <div className="tria-chat-messages" ref={listRef}>
            {messages.map((m) => (
              <div key={m.id} className={`tria-chat-bubble ${m.role}`}>
                {m.imagePreview && (
                  <img
                    src={m.imagePreview}
                    alt="Foto enviada pelo abrigo"
                    className="tria-chat-bubble-img"
                  />
                )}
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
                  Processando entrada no estoque...
                </span>
              </div>
            )}
          </div>

          <div className="tria-chat-quick">
            {SHELTER_PROMPTS.map((qp) => (
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

          {attachedImage && (
            <div className="tria-chat-attachment-bar">
              <img src={attachedImage} alt="Prévia da foto anexada" />
              <span>Foto pronta para envio com IA</span>
              <button
                type="button"
                aria-label="Remover foto anexada"
                onClick={() => setAttachedImage(null)}
              >
                <X size={14} />
              </button>
            </div>
          )}

          <form
            className="tria-chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              ref={fileRef}
              hidden
              onChange={handlePickPhoto}
            />
            <button
              type="button"
              className="tria-chat-photo-btn"
              aria-label="Anexar ou tirar foto para o estoque"
              title="Enviar ou tirar foto de doação"
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus size={16} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                attachedImage
                  ? "Opcional: adicione nota sobre a foto..."
                  : "Digite itens ou envie foto..."
              }
            />
            <button
              type="submit"
              className="tria-chat-send-btn"
              disabled={loading || (!input.trim() && !attachedImage)}
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
