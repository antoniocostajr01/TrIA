"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  CATEGORY_META,
  SupplyCategory,
  useTria,
} from "@/context/TriaContext";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Clock,
  PlusCircle,
  Recycle,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";

interface VisionClassification {
  categoria: SupplyCategory;
  item: string;
  subtipo: string;
  quantidadeEstimada: number;
  unidade: string;
  confianca: number;
  observacao: string;
  provider?: string;
}

export default function VolunteerTriageView() {
  const {
    shelters,
    activeShelterId,
    setActiveShelterId,
    addDonation,
    triageLog,
    recycledTextileKg,
    discardedPiecesCount,
    registerDiscardedTextile,
  } = useTria();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const stableTicksRef = useRef<number>(0);
  const cooldownUntilRef = useRef<number>(0);

  const [cameraActive, setCameraActive] = useState(false);
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(true);
  const [autoSaveToStock, setAutoSaveToStock] = useState(false);
  const [stabilityPercent, setStabilityPercent] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [visionResult, setVisionResult] =
    useState<VisionClassification | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Estado do formulário manual
  const [manualCategory, setManualCategory] =
    useState<SupplyCategory>("roupas");
  const [manualItem, setManualItem] = useState("");
  const [manualSubtipo, setManualSubtipo] = useState("Triagem manual");
  const [manualQtd, setManualQtd] = useState<number>(10);

  const activeShelter =
    shelters.find((s) => s.id === activeShelterId) || shelters[0];

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setStabilityPercent(0);
    prevFrameRef.current = null;
    stableTicksRef.current = 0;
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 640, height: 480 },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch {
      showToast(
        "Não foi possível acessar a câmera. Você pode enviar uma foto ou usar os botões de teste abaixo."
      );
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const analyzeFrameBase64 = async (
    dataUrl: string,
    hintCategory?: SupplyCategory
  ) => {
    setAnalyzing(true);
    setCapturedPreview(dataUrl);
    try {
      const resp = await fetch("/api/triage-vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dataUrl, hintCategory }),
      });
      const data: VisionClassification = await resp.json();
      setVisionResult(data);

      if (autoSaveToStock && data && data.categoria) {
        addDonation({
          shelterId: activeShelter.id,
          categoria: data.categoria,
          item: data.item,
          subtipo: data.subtipo,
          quantidade: data.quantidadeEstimada || 1,
          origem: "camera_ia",
        });
        showToast(
          `Auto-registrado no estoque: +${data.quantidadeEstimada || 1} ${
            data.unidade
          } (${data.item})`
        );
      }
    } catch {
      showToast("Erro ao analisar imagem.");
    } finally {
      setAnalyzing(false);
    }
  };

  const captureCurrentVideoFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    canvas.width = 480;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.8);
    cooldownUntilRef.current = Date.now() + 2600;
    stableTicksRef.current = 0;
    setStabilityPercent(0);
    analyzeFrameBase64(jpegDataUrl);
  };

  // Loop de visão computacional leve no <canvas> (diferença de pixels para detectar item parado por ~0,6s)
  useEffect(() => {
    if (!cameraActive || !autoCaptureEnabled) {
      setStabilityPercent(0);
      return;
    }

    const smallCanvas = document.createElement("canvas");
    smallCanvas.width = 48;
    smallCanvas.height = 36;
    const smallCtx = smallCanvas.getContext("2d");

    const interval = setInterval(() => {
      if (
        !videoRef.current ||
        videoRef.current.readyState < 2 ||
        analyzing ||
        Date.now() < cooldownUntilRef.current ||
        !smallCtx
      ) {
        return;
      }

      smallCtx.drawImage(videoRef.current, 0, 0, 48, 36);
      const frame = smallCtx.getImageData(0, 0, 48, 36).data;

      if (prevFrameRef.current) {
        let diffSum = 0;
        const totalPixels = 48 * 36;
        for (let i = 0; i < frame.length; i += 4) {
          diffSum +=
            Math.abs(frame[i] - prevFrameRef.current[i]) +
            Math.abs(frame[i + 1] - prevFrameRef.current[i + 1]) +
            Math.abs(frame[i + 2] - prevFrameRef.current[i + 2]);
        }
        const avgDiff = diffSum / (totalPixels * 3);

        // Quando o objeto entrou e ficou parado na mesa (baixo movimento entre frames)
        if (avgDiff > 1.2 && avgDiff < 12) {
          stableTicksRef.current += 1;
        } else if (avgDiff >= 12) {
          stableTicksRef.current = 0;
        }

        const pct = Math.min(100, Math.round((stableTicksRef.current / 6) * 100));
        setStabilityPercent(pct);

        if (stableTicksRef.current >= 6) {
          captureCurrentVideoFrame();
        }
      }
      prevFrameRef.current = new Uint8ClampedArray(frame);
    }, 110);

    return () => clearInterval(interval);
  }, [cameraActive, autoCaptureEnabled, analyzing]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        analyzeFrameBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const confirmVisionEntry = () => {
    if (!visionResult) return;
    addDonation({
      shelterId: activeShelter.id,
      categoria: visionResult.categoria,
      item: visionResult.item,
      subtipo: visionResult.subtipo,
      quantidade: Number(visionResult.quantidadeEstimada) || 1,
      origem: "camera_ia",
    });
    showToast(
      `Adicionado ao estoque de ${activeShelter.nome}: +${visionResult.quantidadeEstimada} ${visionResult.unidade} (${visionResult.item})`
    );
    setVisionResult(null);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const itemLabel =
      manualItem.trim() || CATEGORY_META[manualCategory].label;
    addDonation({
      shelterId: activeShelter.id,
      categoria: manualCategory,
      item: itemLabel,
      subtipo: manualSubtipo,
      quantidade: Math.max(1, Number(manualQtd) || 1),
      origem: "manual",
    });
    showToast(
      `Cadastro manual salvo em ${activeShelter.nome}: +${manualQtd} ${CATEGORY_META[manualCategory].unidadePadrao}`
    );
    setManualItem("");
  };

  const categoriesList = Object.keys(CATEGORY_META) as SupplyCategory[];

  return (
    <div className="space-y-6">
      {feedbackToast && (
        <div className="bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {feedbackToast}
          </span>
        </div>
      )}

      {/* Cabeçalho de Seleção do Abrigo onde o Voluntário está atuando */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
            Frente do Voluntário · Mesa de Triagem
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Triagem Rápida sem Burocracia (Câmera + IA ou Manual)
          </h2>
          <p className="text-sm text-slate-600">
            Peças ruins vão direto para o lote de reciclagem têxtil. Itens bons passam pela câmera (1 frame automático) ou lançamento manual.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <label className="text-xs font-bold text-slate-600 uppercase">
            Abrigo Atual:
          </label>
          <select
            value={activeShelter.id}
            onChange={(e) => setActiveShelterId(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {shelters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} ({s.bairro})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Faixa Economia Circular: Descarte Rápido -> Reciclagem Têxtil */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-900 text-white rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300">
              <Recycle className="w-4 h-4" />
              Economia Circular Non-Profit · Descarte Zero-Fricção
            </div>
            <h3 className="text-lg font-bold">
              Roupa rasgada, mofada ou imprópria? Não gaste tempo na câmera
            </h3>
            <p className="text-xs text-emerald-100 max-w-2xl">
              O voluntário descarta na mão em 0s e soma ao fardo de reciclagem têxtil (desfibramento/estopa industrial). A margem mínima gerada custeia domínio, nuvem e tokens da IA da plataforma.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur px-4 py-2.5 rounded-xl border border-white/15">
              <div className="text-[11px] text-emerald-200 uppercase font-semibold">
                Acumulado para Reciclagem
              </div>
              <div className="text-lg font-extrabold">
                {recycledTextileKg} kg{" "}
                <span className="text-xs font-normal text-emerald-200">
                  ({discardedPiecesCount} peças descartadas)
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                registerDiscardedTextile(1, 0.35);
                showToast(
                  "+1 peça imprópria enviada ao fardo de reciclagem têxtil (+0,35 kg)"
                );
              }}
              className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl border border-white/20 transition-colors"
            >
              +1 Peça Ruim (0,35 kg)
            </button>
            <button
              onClick={() => {
                registerDiscardedTextile(10, 3.5);
                showToast(
                  "Saco com 10 peças impróprias registrado para reciclagem têxtil (+3,5 kg)"
                );
              }}
              className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors"
            >
              +1 Saco Descarte (3,5 kg)
            </button>
          </div>
        </div>
      </div>

      {/* Grid Principal: Câmera/IA (Esquerda) + Manual e Histórico (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna 1: Pipeline em 3 Etapas (Câmera + Estabilidade Canvas + API Gemini Flash) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Triagem por Câmera e Visão Computacional + IA
              </h3>
              <p className="text-xs text-slate-500">
                1. Visor de câmera ao vivo · 2. Visão computacional local (Canvas) detecta item parado (0,6s) e captura 1 frame JPEG · 3. Gemini Flash classifica
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Abrir Câmera
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors"
                >
                  <CameraOff className="w-4 h-4" />
                  Fechar Câmera
                </button>
              )}

              <label className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                Enviar Foto
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Opções de Automação da Mesa */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs">
            <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoCaptureEnabled}
                onChange={(e) => setAutoCaptureEnabled(e.target.checked)}
                className="rounded text-indigo-600"
              />
              Auto-capturar frame ao estabilizar na mesa (0,6s)
            </label>
            <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSaveToStock}
                onChange={(e) => setAutoSaveToStock(e.target.checked)}
                className="rounded text-indigo-600"
              />
              Somar direto no estoque sem pedir confirmação
            </label>
          </div>

          {/* Visor de Câmera / Preview */}
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-slate-800">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${
                cameraActive ? "block" : "hidden"
              }`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {!cameraActive && capturedPreview && (
              <img
                src={capturedPreview}
                alt="Frame capturado"
                className="w-full h-full object-contain"
              />
            )}

            {!cameraActive && !capturedPreview && (
              <div className="text-center p-6 space-y-2">
                <Camera className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">
                  Câmera desligada
                </p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Abra a câmera apontada para a mesa de triagem, envie uma foto ou teste o classificador com 1 clique nos exemplos abaixo.
                </p>
              </div>
            )}

            {/* Barra de Estabilidade do Canvas */}
            {cameraActive && (
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3 bg-slate-900/85 backdrop-blur px-3.5 py-2 rounded-xl border border-white/10 text-white">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] font-semibold mb-1">
                    <span>Estabilidade do item na mesa (Canvas)</span>
                    <span>{stabilityPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-100"
                      style={{ width: `${stabilityPercent}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={captureCurrentVideoFrame}
                  disabled={analyzing}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg shrink-0"
                >
                  Capturar Frame Agora
                </button>
              </div>
            )}

            {analyzing && (
              <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-2">
                <div className="w-8 h-8 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-bold">
                  Analisando frame com Gemini Flash...
                </p>
              </div>
            )}
          </div>

          {/* Botões de Simulação Rápida para Demo no Notebook */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Testar pipeline de visão em 1 clique (sem precisar abrir câmera):
            </span>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { cat: "roupas", label: "Simular Casaco de Frio" },
                  { cat: "agua", label: "Simular Fardo de Água" },
                  { cat: "alimentos", label: "Simular Cesta / Arroz" },
                  { cat: "colchoes_cama", label: "Simular Cobertor" },
                  { cat: "higiene", label: "Simular Kit Higiene" },
                ] as const
              ).map((sample) => (
                <button
                  key={sample.cat}
                  onClick={() => analyzeFrameBase64("", sample.cat)}
                  className="text-xs font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* Card de Resultado da IA */}
          {visionResult && (
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                  Item Identificado ({Math.round((visionResult.confianca || 0.93) * 100)}% confiança)
                </span>
                <span className="text-[11px] text-slate-500">
                  Motor: {visionResult.provider || "gemini-2.5-flash"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">
                    Categoria
                  </label>
                  <select
                    value={visionResult.categoria}
                    onChange={(e) =>
                      setVisionResult({
                        ...visionResult,
                        categoria: e.target.value as SupplyCategory,
                        unidade:
                          CATEGORY_META[e.target.value as SupplyCategory]
                            .unidadePadrao,
                      })
                    }
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                  >
                    {categoriesList.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_META[c].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">
                    Item Identificado
                  </label>
                  <input
                    type="text"
                    value={visionResult.item}
                    onChange={(e) =>
                      setVisionResult({ ...visionResult, item: e.target.value })
                    }
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">
                    Quantidade ({visionResult.unidade})
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={visionResult.quantidadeEstimada}
                    onChange={(e) =>
                      setVisionResult({
                        ...visionResult,
                        quantidadeEstimada: Number(e.target.value) || 1,
                      })
                    }
                    className="w-full mt-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-600">
                <strong>Subtipo:</strong> {visionResult.subtipo} ·{" "}
                {visionResult.observacao}
              </p>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setVisionResult(null)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2"
                >
                  Descartar leitura
                </button>
                <button
                  onClick={confirmVisionEntry}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-colors"
                >
                  Confirmar Entrada em {activeShelter.nome}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Coluna 2: Cadastro Manual Rápido + Histórico de Triagem */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleManualSubmit}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4"
          >
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                Cadastro Manual Rápido (Lotes / Caixas)
              </h3>
              <p className="text-xs text-slate-500">
                Para registrar fardos fechados ou lotes já contados sem usar a câmera.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-700">
                  Categoria do Suprimento
                </label>
                <select
                  value={manualCategory}
                  onChange={(e) =>
                    setManualCategory(e.target.value as SupplyCategory)
                  }
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_META[cat].label} (
                      {CATEGORY_META[cat].unidadePadrao})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">
                  Descrição / Item
                </label>
                <input
                  type="text"
                  placeholder="Ex: Casacos infantis / Arroz 5kg"
                  value={manualItem}
                  onChange={(e) => setManualItem(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">
                  Quantidade ({CATEGORY_META[manualCategory].unidadePadrao})
                </label>
                <input
                  type="number"
                  min={1}
                  value={manualQtd}
                  onChange={(e) => setManualQtd(Number(e.target.value))}
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
            >
              Somar ao Estoque de {activeShelter.nome}
            </button>
          </form>

          {/* Histórico Recente da Triagem */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Últimas Entradas Registradas na Rede
            </h3>

            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {triageLog.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      +{entry.quantidade} {entry.unidade} · {entry.item}
                    </div>
                    <div className="text-slate-500">
                      {entry.shelterName} · {entry.subtipo}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        entry.origem === "camera_ia"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {entry.origem === "camera_ia" ? "Câmera IA" : "Manual"}
                    </span>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {entry.horario}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
