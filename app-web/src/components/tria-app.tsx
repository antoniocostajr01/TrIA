"use client";
import { useEffect, useRef, useState } from "react";
import { CollectionHubExplorer } from "./collection-hub-explorer";
import { ShelterNeedsExplorer } from "./shelter-needs-explorer";
import { Brand } from "./brand";
import { TransferPanel, type Transfer } from "./transfer-panel";
import { ManagerOverview } from "./manager-overview";
import { DonorChatbot } from "./donor-chatbot";
import { ShelterChatbot, type ShelterChatAction } from "./shelter-chatbot";
import {
  Heart,
  MapPin,
  ScanLine,
  LayoutDashboard,
  ChevronDown,
  Plus,
  Check,
  X,
  Camera,
  CameraOff,
  ImagePlus,
  Loader2,
  Recycle,
  Package,
  CircleHelp,
  HandHeart,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import {
  categories,
  shelters as seedShelters,
  targets,
  stockStatus,
  initialAlerts,
  type CategoryId,
  type Entry,
  type Alert,
  type Shelter,
} from "@/lib/demo-data";
type Profile = "citizen" | "volunteer" | "manager";
const profiles = [
  { id: "citizen", label: "Quero doar", mobile: "Doar", icon: MapPin },
  {
    id: "volunteer",
    label: "Hub de triagem",
    mobile: "Triagem",
    icon: ScanLine,
  },
  {
    id: "manager",
    label: "Meu abrigo",
    mobile: "Abrigo",
    icon: LayoutDashboard,
  },
] as const;
const storageKey = "tria-ui-demo-v1";
export default function TriaApp() {
  const [profile, setProfile] = useState<Profile>("citizen");
  const [managerSection, setManagerSection] = useState("visao-geral");
  const [shelterId, setShelterId] = useState("sesi");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [recycled, setRecycled] = useState(0);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const activeStorageKey = useRef(storageKey);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");
  const [help, setHelp] = useState(false);
  const [formCategory, setFormCategory] = useState<CategoryId>("roupas");
  const [quantity, setQuantity] = useState("1");
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [aiResult, setAiResult] = useState<{
    item: string;
    confidence: number;
    observation: string;
    provider: string;
    warning?: string;
  } | null>(null);
  const [alertForm, setAlertForm] = useState(false);
  const [message, setMessage] = useState("");
  const upload = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const stableTicksRef = useRef(0);
  const cooldownUntilRef = useRef(0);
  const helpDialog = useRef<HTMLElement>(null);
  const helpButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "videos")
      activeStorageKey.current = "tria-video-demo-v1";
    const initialProfile = params.get("profile");
    if (["citizen", "volunteer", "manager"].includes(initialProfile || ""))
      setProfile(initialProfile as Profile);
    if (initialProfile === "volunteer") setShelterId("demhab");
    try {
      const raw = localStorage.getItem(activeStorageKey.current);
      if (raw) {
        const data = JSON.parse(raw);
        if (
          Array.isArray(data.entries) &&
          Array.isArray(data.alerts) &&
          Number.isFinite(data.recycled)
        ) {
          setEntries(
            data.entries.filter(
              (e: Entry) =>
                seedShelters.some((s) => s.id === e.shelterId) &&
                categories.some((c) => c.id === e.category) &&
                Number.isSafeInteger(e.quantity) &&
                e.quantity > 0,
            ),
          );
          setAlerts(
            data.alerts.filter(
              (a: Alert) =>
                seedShelters.some((s) => s.id === a.shelterId) &&
                typeof a.message === "string",
            ),
          );
          setRecycled(Math.max(0, data.recycled));
          if (Array.isArray(data.transfers))
            setTransfers(
              data.transfers.filter(
                (t: Transfer) =>
                  t &&
                  seedShelters.some((s) => s.id === t.fromId) &&
                  seedShelters.some((s) => s.id === t.toId) &&
                  t.fromId !== t.toId &&
                  categories.some((c) => c.id === t.category) &&
                  Number.isSafeInteger(t.quantity) &&
                  t.quantity > 0,
              ),
            );
        }
      }
    } catch {
      /* Estado inválido retorna ao cenário inicial. */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(
          activeStorageKey.current,
          JSON.stringify({ entries, alerts, recycled, transfers }),
        );
      } catch {
        /* A interface continua utilizável sem persistência. */
      }
    }
  }, [entries, alerts, recycled, transfers, ready]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!help) return;
    const previousFocus = helpButton.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHelp(false);
      if (event.key === "Tab") {
        const buttons =
          helpDialog.current?.querySelectorAll<HTMLButtonElement>("button");
        if (!buttons?.length) return;
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("keydown", close);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [help]);
  const shelters = seedShelters.map((s) => ({
    ...s,
    stock: Object.fromEntries(
      Object.entries(s.stock).map(([c, q]) => [
        c,
        q +
          entries
            .filter((e) => e.shelterId === s.id && e.category === c)
            .reduce((sum, e) => sum + e.quantity, 0) +
          transfers
            .filter((t) => t.category === c && t.toId === s.id)
            .reduce((sum, t) => sum + t.quantity, 0) -
          transfers
            .filter((t) => t.category === c && t.fromId === s.id)
            .reduce((sum, t) => sum + t.quantity, 0),
      ]),
    ) as Shelter["stock"],
  }));
  const current = shelters.find((s) => s.id === shelterId)!;
  const formInfo = categories.find((c) => c.id === formCategory)!;

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
    prevFrameRef.current = null;
    stableTicksRef.current = 0;
  }

  async function startCamera() {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setToast("Câmera ao vivo indisponível neste navegador. Use 'Tirar / enviar foto'.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play().catch(() => {});
      }
      setCameraOn(true);
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "NotAllowedError") {
        setToast("Permissão de câmera negada no navegador. Libere nos ajustes do site.");
      } else {
        setToast("Não foi possível abrir a câmera ao vivo. Use 'Tirar / enviar foto'.");
      }
    }
  }

  async function analyzeImageWithAI(dataUrl: string) {
    setPhoto(dataUrl);
    setAnalyzingPhoto(true);
    try {
      const resp = await fetch("/api/triage-vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dataUrl }),
      });
      const data = await resp.json();
      if (data?.category && categories.some((c) => c.id === data.category)) {
        setFormCategory(data.category);
      }
      if (data?.quantity) {
        setQuantity(String(Math.max(1, Number(data.quantity) || 1)));
      }
      setAiResult({
        item: data.item || "Item identificado",
        confidence: data.confidence || 0.9,
        observation: data.observation || "",
        provider: data.provider || "fallback",
        warning: data.warning,
      });
      if (data.unidentified) {
        setToast("Imagem pouco nítida — aproxime o item e tente novamente.");
      } else if (data.provider?.startsWith("gemini")) {
        setToast(`IA (${data.provider}): ${data.item}`);
      } else if (data.warning) {
        setToast("IA indisponível no momento — usando fallback local.");
      }
    } catch {
      setToast("Erro ao chamar a rota de análise de imagem.");
    } finally {
      setAnalyzingPhoto(false);
    }
  }

  function captureVideoFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    const vw = video.videoWidth || 480;
    const vh = video.videoHeight || 360;
    const scale = Math.min(1, 640 / Math.max(vw, vh));
    canvas.width = Math.round(vw * scale);
    canvas.height = Math.round(vh * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const jpeg = canvas.toDataURL("image/jpeg", 0.82);
    cooldownUntilRef.current = Date.now() + 2800;
    stableTicksRef.current = 0;
    stopCamera();
    analyzeImageWithAI(jpeg);
  }

  useEffect(() => {
    if (!cameraOn) return;
    const smallCanvas = document.createElement("canvas");
    smallCanvas.width = 48;
    smallCanvas.height = 36;
    const smallCtx = smallCanvas.getContext("2d");

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (
        !video ||
        video.readyState < 2 ||
        analyzingPhoto ||
        Date.now() < cooldownUntilRef.current ||
        !smallCtx
      ) {
        return;
      }
      smallCtx.drawImage(video, 0, 0, 48, 36);
      const frame = smallCtx.getImageData(0, 0, 48, 36).data;
      if (prevFrameRef.current) {
        let diff = 0;
        for (let i = 0; i < frame.length; i += 4) {
          diff +=
            Math.abs(frame[i] - prevFrameRef.current[i]) +
            Math.abs(frame[i + 1] - prevFrameRef.current[i + 1]) +
            Math.abs(frame[i + 2] - prevFrameRef.current[i + 2]);
        }
        const avgDiff = diff / (48 * 36 * 3);
        if (avgDiff > 1.2 && avgDiff < 11) {
          stableTicksRef.current += 1;
        } else if (avgDiff >= 11) {
          stableTicksRef.current = 0;
        }
        if (stableTicksRef.current >= 6) {
          captureVideoFrame();
        }
      }
      prevFrameRef.current = new Uint8ClampedArray(frame);
    }, 110);

    return () => clearInterval(interval);
  }, [cameraOn, analyzingPhoto]);

  useEffect(() => {
    if (profile !== "volunteer") stopCamera();
  }, [profile]);

  function register(event: React.FormEvent) {
    event.preventDefault();
    const count = Number(quantity);
    if (!Number.isSafeInteger(count) || count < 1 || count > 10000) return;
    setEntries((prev) => [
      {
        id: crypto.randomUUID(),
        shelterId,
        category: formCategory,
        quantity: count,
        date: new Date().toISOString(),
      },
      ...prev,
    ]);
    setQuantity("1");
    setToast("Entrada registrada no estoque.");
  }
  function handleChatActions(actions: ShelterChatAction[]) {
    const newEntries: Entry[] = [];
    let recycledAdded = 0;

    for (const act of actions) {
      if (act.type === "register_entry") {
        newEntries.push({
          id: crypto.randomUUID(),
          shelterId: act.shelterId,
          category: act.category,
          quantity: act.quantity,
          date: new Date().toISOString(),
        });
      } else if (act.type === "register_recycle") {
        recycledAdded += act.quantity;
      }
    }

    if (newEntries.length > 0) {
      setEntries((prev) => [...newEntries, ...prev]);
      setToast(
        `${newEntries.length} lançamento(s) registrado(s) via Assistente IA.`,
      );
    }
    if (recycledAdded > 0) {
      setRecycled((n) => n + recycledAdded);
    }
  }

  function transfer(
    fromId: string,
    toId: string,
    category: CategoryId,
    quantity: number,
  ) {
    const source = shelters.find((s) => s.id === fromId);
    if (
      !source ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      source.stock[category] < quantity
    )
      return;
    setTransfers((prev) => [
      {
        id: crypto.randomUUID(),
        fromId,
        toId,
        category,
        quantity,
        date: new Date().toISOString(),
      },
      ...prev,
    ]);
    setToast("Remessa registrada. Os dois estoques foram atualizados.");
  }
  function reset() {
    setEntries([]);
    setAlerts(initialAlerts);
    setRecycled(0);
    setTransfers([]);
    setToast("Dados restaurados.");
  }
  return (
    <div className={`app-shell profile-${profile}`}>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="/" aria-label="TrIA, início">
            <Brand />
          </a>
          <nav className="profile-switch" aria-label="Escolha seu perfil">
            {profiles.map((p) => (
              <button
                key={p.id}
                className={profile === p.id ? "active" : ""}
                aria-pressed={profile === p.id}
                onClick={() => setProfile(p.id)}
              >
                <p.icon size={17} />
                <span>{p.label}</span>
              </button>
            ))}
          </nav>
          <div className="header-right">
            <button
              className="icon-button"
              ref={helpButton}
              aria-label="Sobre o TrIA"
              onClick={() => setHelp(true)}
            >
              <CircleHelp size={21} />
            </button>
          </div>
        </div>
      </header>
      {profile === "manager" && (
        <aside className="manager-sidebar">
          <a href="/" aria-label="TrIA, início">
            <Brand />
          </a>
          <div className="sidebar-shelter">
            <span>ABRIGO</span>
            <strong>{current.name}</strong>
            <small>Porto Alegre</small>
          </div>
          <nav aria-label="Navegação do painel">
            <a
              className={managerSection === "visao-geral" ? "active" : ""}
              aria-current={
                managerSection === "visao-geral" ? "location" : undefined
              }
              href="#visao-geral"
              onClick={() => setManagerSection("visao-geral")}
            >
              <img src="/figma/7-imgIconGrid.svg" alt="" />
              Visão geral
            </a>
            <a
              className={managerSection === "estoque" ? "active" : ""}
              aria-current={
                managerSection === "estoque" ? "location" : undefined
              }
              href="#estoque"
              onClick={() => setManagerSection("estoque")}
            >
              <img src="/figma/7-imgIconBox.svg" alt="" />
              Estoque
            </a>
            <a
              className={managerSection === "mural" ? "active" : ""}
              aria-current={managerSection === "mural" ? "location" : undefined}
              href="#mural"
              onClick={() => setManagerSection("mural")}
            >
              <img src="/figma/7-imgIconHeart.svg" alt="" />
              Necessidades
            </a>
            <button onClick={() => setProfile("citizen")}>
              <img src="/figma/7-imgIconShare.svg" alt="" />
              Página pública
            </button>
          </nav>
          <div className="sidebar-note">
            <ShieldCheck size={21} />
            <strong>Uma rede que acolhe.</strong>
            <p>Do seu abrigo, para o abrigo certo.</p>
          </div>
        </aside>
      )}
      <main>
        <div className="context-line">
          <span>
            <MapPin size={15} /> Porto Alegre, RS
          </span>
          <span className="context-note">
            <ShieldCheck size={15} /> Uma rede de cuidado, conectada.
          </span>
        </div>
        <section className="page-heading" id="inicio">
          <div>
            <div className="eyebrow">
              {profile === "citizen"
                ? "SOLIDARIEDADE COM DIREÇÃO"
                : profile === "volunteer"
                  ? "MENOS ETAPAS. MAIS CUIDADO."
                  : "QUEM ABRIGA TAMBÉM PRECISA DE ABRIGO"}
            </div>
            <h1>
              {profile === "citizen" ? (
                <>
                  Sua doação, no <span>lugar certo.</span>
                </>
              ) : profile === "volunteer" ? (
                <>
                  Hub de triagem.
                  <br />
                  <span>Cada item conta.</span>
                </>
              ) : (
                <>Visão geral do abrigo</>
              )}
            </h1>
            <p>
              {profile === "citizen"
                ? "Encontre um hub de coleta (recomendado para roupas) ou leve direto a um dos abrigos da cidade."
                : profile === "volunteer"
                  ? "Receba doações, veja os pedidos da rede e distribua para quem precisa."
                  : "Acompanhe necessidades, organize o estoque e conecte sua rede."}
            </p>
          </div>
        </section>
        {profile === "citizen" ? (
          <CollectionHubExplorer shelters={shelters} />
        ) : (
          <>
            <div className="workspace-toolbar">
              <div>
                <span className="field-label">Você está organizando</span>
                <div className="select-wrap">
                  <Building2 size={18} />
                  <select
                    aria-label="Selecionar abrigo"
                    value={shelterId}
                    onChange={(e) => setShelterId(e.target.value)}
                  >
                    {shelters.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
            <nav className="section-shortcuts" aria-label="Seções deste perfil">
              {(profile === "volunteer"
                ? [
                    ["mapa-abrigos", "Mapa de abrigos"],
                    ["registrar", "Registrar"],
                    ["entradas", "Entradas"],
                    ["reciclagem", "Reciclagem"],
                    ["redistribuir", "Distribuir"],
                  ]
                : [
                    ["visao-geral", "Resumo"],
                    ["estoque", "Estoque"],
                    ["mural", "Mural"],
                    ["redistribuir", "Remessas"],
                  ]
              ).map(([id, label]) => (
                <a key={id} href={`#${id}`}>
                  {label}
                </a>
              ))}
            </nav>
            {profile === "volunteer" ? (
              <>
                <ShelterNeedsExplorer shelters={shelters} alerts={alerts} />
                <div className="work-grid">
                  <section className="panel triage-panel" id="registrar">
                    <div className="panel-heading">
                      <span className="soft-icon">
                        <ScanLine size={21} />
                      </span>
                      <div>
                        <h2>Registrar doação</h2>
                        <p>Um registro simples. Uma ajuda que chega.</p>
                      </div>
                    </div>
                    <div className={`capture-area ${photo || cameraOn ? "has-photo" : ""}`}>
                      <div
                        className="camera-live-wrap"
                        style={{ display: cameraOn ? "flex" : "none" }}
                      >
                        <video ref={videoRef} autoPlay playsInline muted />
                        <button
                          type="button"
                          className="button primary capture-now-btn"
                          onClick={captureVideoFrame}
                        >
                          Capturar frame
                        </button>
                      </div>
                      {!cameraOn && photo && (
                        <img
                          src={photo}
                          alt="Foto selecionada para classificação por IA"
                        />
                      )}
                      {!cameraOn && !photo && (
                        <>
                          <span className="camera-circle">
                            <img src="/figma/5-imgIconCamera.svg" alt="" />
                          </span>
                          <h3>Menos digitação, mais acolhimento.</h3>
                          <p>
                            Tire uma foto ou aponte a câmera para identificar a
                            categoria automaticamente com IA.
                          </p>
                        </>
                      )}
                      {analyzingPhoto && (
                        <div className="capture-loading">
                          <Loader2 size={20} className="spin-icon" />
                          <span>Identificando item com IA...</span>
                        </div>
                      )}
                    </div>
                    <canvas ref={canvasRef} hidden />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      ref={upload}
                      hidden
                      aria-label="Tirar ou selecionar foto do item"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (
                          !["image/jpeg", "image/png", "image/webp"].includes(
                            file.type,
                          ) ||
                          file.size > 5 * 1024 * 1024
                        ) {
                          setToast(
                            "Escolha uma imagem JPG, PNG ou WebP de até 5 MB.",
                          );
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === "string") {
                            stopCamera();
                            analyzeImageWithAI(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <div className="capture-actions">
                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => upload.current?.click()}
                      >
                        <ImagePlus size={17} />
                        {photo ? "Nova foto" : "Tirar / enviar foto"}
                      </button>
                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => (cameraOn ? stopCamera() : startCamera())}
                      >
                        {cameraOn ? (
                          <>
                            <CameraOff size={17} />
                            Fechar câmera
                          </>
                        ) : (
                          <>
                            <Camera size={17} />
                            Câmera ao vivo
                          </>
                        )}
                      </button>
                    </div>
                    {aiResult && (
                      <div className="ai-detection-box">
                        <div className="ai-detection-top">
                          <strong>
                            IA ({aiResult.provider === "fallback" ? "Fallback" : aiResult.provider}):{" "}
                            {aiResult.item}
                          </strong>
                          <span>
                            {Math.round(aiResult.confidence * 100)}% confiança
                          </span>
                        </div>
                        {aiResult.warning ? (
                          <p className="ai-warning-text">
                            Aviso da chave: {aiResult.warning}
                          </p>
                        ) : (
                          aiResult.observation && <p>{aiResult.observation}</p>
                        )}
                      </div>
                    )}
                    <form onSubmit={register} className="entry-form">
                      <fieldset className="category-picker">
                        <legend>1. O que chegou?</legend>
                        <div className="donation-tiles">
                          {categories.map((c) => (
                            <button
                              type="button"
                              key={c.id}
                              className={`donation-tile tile-${c.id} ${formCategory === c.id ? "selected" : ""}`}
                              aria-pressed={formCategory === c.id}
                              onClick={() => setFormCategory(c.id)}
                            >
                              <c.icon size={28} />
                              <span>{c.label}</span>
                            </button>
                          ))}
                        </div>
                      </fieldset>
                      <label
                        className="quantity-label"
                        htmlFor="donation-quantity"
                      >
                        2. Qual a quantidade? <span>({formInfo.unit})</span>
                      </label>
                      <div className="quantity-stepper">
                        <button
                          type="button"
                          aria-label="Diminuir quantidade"
                          disabled={Number(quantity) <= 1}
                          onClick={() =>
                            setQuantity(
                              String(Math.max(1, (Number(quantity) || 1) - 1)),
                            )
                          }
                        >
                          <img src="/figma/5-imgIconMinus.svg" alt="" />
                        </button>
                        <input
                          id="donation-quantity"
                          aria-label={`Quantidade em ${formInfo.unit}`}
                          type="number"
                          min="1"
                          max="10000"
                          step="1"
                          required
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                        />
                        <button
                          type="button"
                          aria-label="Aumentar quantidade"
                          disabled={Number(quantity) >= 10000}
                          onClick={() =>
                            setQuantity(
                              String(
                                Math.min(10000, (Number(quantity) || 0) + 1),
                              ),
                            )
                          }
                        >
                          <img src="/figma/5-imgIconPlus.svg" alt="" />
                        </button>
                      </div>
                      <button
                        className="button primary full"
                        type="submit"
                        disabled={!ready}
                      >
                        <img src="/figma/5-imgIcone1.svg" alt="" />
                        Registrar entrada
                      </button>
                      <p className="form-hint">
                        A IA sugere categoria e quantidade pela foto; confira
                        antes de registrar.
                      </p>
                    </form>
                  </section>
                  <div className="right-column">
                    <section className="panel" id="entradas">
                      <div className="section-heading">
                        <h2>Últimas entradas</h2>
                        <span className="count-pill">
                          {
                            entries.filter((e) => e.shelterId === shelterId)
                              .length
                          }
                        </span>
                      </div>
                      <p className="muted">Doações registradas neste abrigo.</p>
                      <div className="entry-list">
                        {entries
                          .filter((e) => e.shelterId === shelterId)
                          .slice(0, 5)
                          .map((e) => {
                            const c = categories.find(
                              (c) => c.id === e.category,
                            )!;
                            return (
                              <div className="entry-item" key={e.id}>
                                <span className="soft-icon">
                                  <c.icon size={19} />
                                </span>
                                <div>
                                  <strong>{c.label}</strong>
                                  <small>
                                    {new Date(e.date).toLocaleString("pt-BR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      day: "2-digit",
                                      month: "2-digit",
                                    })}
                                  </small>
                                </div>
                                <b>
                                  +{e.quantity} <small>{c.unit}</small>
                                </b>
                              </div>
                            );
                          })}
                        {!entries.some((e) => e.shelterId === shelterId) && (
                          <div className="empty-state">
                            <Package size={30} />
                            <h3>Pronto para o primeiro gesto</h3>
                            <p>
                              As entradas que você registrar aparecerão aqui.
                            </p>
                          </div>
                        )}
                      </div>
                    </section>
                    <section className="recycle-panel" id="reciclagem">
                      <span className="soft-icon">
                        <Recycle size={23} />
                      </span>
                      <h2>Um novo destino para os têxteis.</h2>
                      <p>
                        Peças sem condição de uso podem entrar no lote de
                        reciclagem.
                      </p>
                      <div className="recycle-bottom">
                        <div>
                          <strong>{recycled}</strong>
                          <span>peças no lote da rede</span>
                        </div>
                        <button
                          className="button secondary"
                          disabled={!ready}
                          onClick={() => {
                            setRecycled((n) => n + 1);
                            setToast(
                              "Uma peça adicionada ao lote de reciclagem.",
                            );
                          }}
                        >
                          <Plus size={16} />1 peça
                        </button>
                      </div>
                    </section>
                    <TransferPanel
                      shelters={shelters}
                      currentId={shelterId}
                      mode="send"
                      transfers={transfers}
                      onTransfer={transfer}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <ManagerOverview
                  shelter={current}
                  entries={entries}
                  recycled={recycled}
                  alertCount={alerts.length}
                />
                <div className="inventory-heading" id="estoque">
                  <h2>Estoque por categoria</h2>
                  <p>Itens disponíveis no abrigo.</p>
                </div>
                <section
                  className="inventory-grid"
                  aria-label="Estoque do abrigo"
                >
                  {categories.map((c) => {
                    const q = current.stock[c.id];
                    const status = stockStatus(c.id, q);
                    return (
                      <article className="inventory-card" key={c.id}>
                        <div className="inventory-top">
                          <span className="soft-icon">
                            <c.icon size={21} />
                          </span>
                          <span className={`status-badge ${status}`}>
                            {status === "surplus"
                              ? "Excedente"
                              : status === "stable"
                                ? "Estável"
                                : "Crítico"}
                          </span>
                        </div>
                        <h3>{c.label}</h3>
                        <div className="stock-value">
                          {q}
                          <span>{c.unit}</span>
                        </div>
                        <div className={`stock-track ${status}`}>
                          <span
                            style={{
                              width: `${Math.min(100, (q / targets[c.id]) * 100)}%`,
                            }}
                          />
                        </div>
                        <p>
                          Referência de abastecimento: {targets[c.id]} {c.unit}
                        </p>
                      </article>
                    );
                  })}
                </section>
                <div className="work-grid manager-grid" id="mural">
                  <section className="panel">
                    <div className="section-heading">
                      <div>
                        <h2>Mural da rede</h2>
                        <p>Necessidades que conectam abrigos.</p>
                      </div>
                      <button
                        className="button secondary small"
                        onClick={() => setAlertForm((v) => !v)}
                        aria-expanded={alertForm}
                      >
                        {alertForm ? <X size={16} /> : <Plus size={16} />}
                        <span>{alertForm ? "Fechar" : "Novo alerta"}</span>
                      </button>
                    </div>
                    {alertForm && (
                      <form
                        className="alert-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!message.trim()) return;
                          setAlerts((a) => [
                            {
                              id: crypto.randomUUID(),
                              shelterId,
                              message: message.trim(),
                              supported: false,
                            },
                            ...a,
                          ]);
                          setMessage("");
                          setAlertForm(false);
                          setToast("Alerta publicado no mural da rede.");
                        }}
                      >
                        <label htmlFor="alert-message">
                          Do que seu abrigo precisa?
                        </label>
                        <textarea
                          id="alert-message"
                          required
                          maxLength={240}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Ex.: Precisamos de 20 kits de higiene."
                        />
                        <button className="button primary" disabled={!ready}>
                          Publicar alerta
                        </button>
                      </form>
                    )}
                    <div className="alerts">
                      {alerts.map((a) => (
                        <article className="alert-item" key={a.id}>
                          <div className="alert-author">
                            <span className="soft-icon">
                              <Building2 size={17} />
                            </span>
                            <strong>
                              {shelters.find((s) => s.id === a.shelterId)?.name}
                            </strong>
                          </div>
                          <p>{a.message}</p>
                          {a.shelterId === shelterId ? (
                            <span className="own-alert">
                              <Clock3 size={14} />
                              Publicado pelo seu abrigo
                            </span>
                          ) : (
                            <button
                              className={`text-button ${a.supported ? "supported" : ""}`}
                              disabled={!ready || a.supported}
                              onClick={() => {
                                setAlerts((prev) =>
                                  prev.map((item) =>
                                    item.id === a.id
                                      ? { ...item, supported: true }
                                      : item,
                                  ),
                                );
                                setToast("Interesse em apoiar registrado.");
                              }}
                            >
                              {a.supported ? (
                                <Check size={16} />
                              ) : (
                                <HandHeart size={16} />
                              )}{" "}
                              {a.supported
                                ? "Interesse de apoio registrado"
                                : "Manifestar interesse em apoiar"}
                            </button>
                          )}
                        </article>
                      ))}
                    </div>
                  </section>
                  <TransferPanel
                    shelters={shelters}
                    currentId={shelterId}
                    mode="receive"
                    transfers={transfers}
                    onTransfer={transfer}
                  />
                </div>
              </>
            )}
          </>
        )}
        <footer>
          <div className="footer-brand">
            <Brand compact />
            <span>Do seu abrigo, para o abrigo certo.</span>
          </div>
          <div>
            <span>TrIA · Rede de apoio</span>
            <button onClick={reset}>Restaurar dados</button>
          </div>
        </footer>
      </main>
      <nav className="mobile-nav" aria-label="Perfis no celular">
        {profiles.map((p) => (
          <button
            key={p.id}
            aria-pressed={profile === p.id}
            className={profile === p.id ? "active" : ""}
            onClick={() => {
              setProfile(p.id);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <p.icon size={20} />
            <span>{p.mobile}</span>
          </button>
        ))}
      </nav>
      {profile === "citizen" ? (
        <DonorChatbot shelters={shelters} alerts={alerts} />
      ) : (
        <ShelterChatbot
          profile={profile}
          activeShelterId={shelterId}
          shelters={shelters}
          alerts={alerts}
          onApplyActions={handleChatActions}
        />
      )}
      <div className="toast-container" role="status" aria-live="polite">
        {toast && (
          <div className="toast">
            <CheckCircle2 size={19} />
            <span>{toast}</span>
            <button
              className="icon-button"
              aria-label="Fechar aviso"
              onClick={() => setToast("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <section
            ref={helpDialog}
            className="help-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              autoFocus
              className="icon-button modal-close"
              aria-label="Fechar informações"
              onClick={() => setHelp(false)}
            >
              <X />
            </button>
            <Brand />
            <h2 id="help-title">Sobre o TrIA</h2>
            <p>
              Encontre onde doar, registre a chegada de itens e acompanhe as
              necessidades dos abrigos.
            </p>
            <p>
              Conecte excedentes a quem precisa, organize a triagem e dê um novo
              destino aos têxteis separados para reciclagem.
            </p>
            <button
              className="button primary full"
              onClick={() => setHelp(false)}
            >
              Continuar
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
