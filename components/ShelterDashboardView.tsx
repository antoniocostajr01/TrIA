"use client";

import React, { useEffect, useState } from "react";
import {
  CATEGORY_META,
  SupplyCategory,
  useTria,
} from "@/context/TriaContext";
import {
  AlertTriangle,
  ArrowLeftRight,
  BellPlus,
  Building2,
  CheckCircle2,
  HandHeart,
  Sparkles,
  Truck,
} from "lucide-react";

interface MatchSuggestion {
  id: string;
  fromShelterId: string;
  fromShelterName: string;
  toShelterId: string;
  toShelterName: string;
  categoria: SupplyCategory;
  categoriaLabel: string;
  quantidadeSugerida: number;
  unidade: string;
  distanciaKm: number;
  motivo: string;
}

export default function ShelterDashboardView() {
  const {
    shelters,
    activeShelterId,
    setActiveShelterId,
    alerts,
    createAlert,
    pledgeSupportToAlert,
    executeTransferBetweenShelters,
  } = useTria();

  const activeShelter =
    shelters.find((s) => s.id === activeShelterId) || shelters[0];

  const [aiDiagnostico, setAiDiagnostico] = useState<string>(
    "Carregando análise inteligente do estoque e cruzamento com outros abrigos..."
  );
  const [matches, setMatches] = useState<MatchSuggestion[]>([]);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Novo alerta
  const [alertCat, setAlertCat] = useState<SupplyCategory>("agua");
  const [alertDesc, setAlertDesc] = useState("");
  const [alertQtd, setAlertQtd] = useState<number>(150);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3800);
  };

  useEffect(() => {
    let cancelled = false;
    const runMatch = async () => {
      setLoadingMatch(true);
      try {
        const resp = await fetch("/api/shelter-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activeShelterId: activeShelter.id,
            shelters,
          }),
        });
        const data = await resp.json();
        if (!cancelled) {
          setAiDiagnostico(
            data.diagnosticoLocal || "Análise de estoque concluída."
          );
          setMatches(data.parceriasSugeridas || []);
        }
      } catch {
        if (!cancelled) {
          setAiDiagnostico(
            "Análise local ativa: verifique os itens em vermelho abaixo e acione remessa entre abrigos parceiros."
          );
        }
      } finally {
        if (!cancelled) setLoadingMatch(false);
      }
    };
    runMatch();
    return () => {
      cancelled = true;
    };
  }, [activeShelter.id, shelters]);

  const handleEmitAlert = (e: React.FormEvent) => {
    e.preventDefault();
    createAlert({
      shelterId: activeShelter.id,
      categoria: alertCat,
      itemEspecifico:
        alertDesc.trim() ||
        `Reposição urgente de ${CATEGORY_META[alertCat].label}`,
      quantidadeNecessaria: Math.max(1, Number(alertQtd) || 50),
      urgencia: "alta",
    });
    setAlertDesc("");
    triggerToast(`Alerta emitido no mural da rede por ${activeShelter.nome}!`);
  };

  const categoriesList = Object.keys(CATEGORY_META) as SupplyCategory[];

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="bg-indigo-950 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {toastMsg}
        </div>
      )}

      {/* Seletor do Abrigo Gestor */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
            Frente da Organização do Abrigo · Gestão e Autogerência
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Painel do Abrigo: Estoque, Alertas e Parcerias via IA
          </h2>
          <p className="text-sm text-slate-600">
            Visualize o estoque local, emita alertas para a rede e feche transferências diretas com abrigos que têm excedente.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            Gerenciando:
          </label>
          <select
            value={activeShelter.id}
            onChange={(e) => setActiveShelterId(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {shelters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} ({s.ocupacaoAtual}/{s.capacidade} vagas)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Card de Feedback da IA + Matchmaking entre Abrigos */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-300">
              <Sparkles className="w-4 h-4" />
              Diagnóstico IA do Estoque & Matchmaking entre Abrigos de POA
            </span>
            <p className="text-sm text-slate-100 leading-relaxed">
              {loadingMatch ? "Atualizando leitura da rede..." : aiDiagnostico}
            </p>
          </div>
          <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 text-xs shrink-0">
            <div className="text-indigo-200 font-semibold">Logística Parceira</div>
            <div className="font-bold flex items-center gap-1.5 mt-0.5">
              <Truck className="w-4 h-4 text-emerald-400" />
              Defesa Civil / Transporte Solidário SMAS
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-200 flex items-center gap-1.5">
            <ArrowLeftRight className="w-4 h-4" />
            Parcerias Diretas Sugeridas pela IA (Excedente ↔ Falta Crítica)
          </h3>

          {matches.length === 0 ? (
            <p className="text-xs text-slate-300 bg-white/5 p-3.5 rounded-xl">
              Nenhum descompasso crítico/excedente pendente para este abrigo no momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                        {m.categoriaLabel} · {m.distanciaKm} km de distância
                      </span>
                      <span className="text-xs font-extrabold text-emerald-300">
                        {m.quantidadeSugerida} {m.unidade}
                      </span>
                    </div>
                    <div className="text-sm font-bold">
                      {m.fromShelterName} → {m.toShelterName}
                    </div>
                    <p className="text-xs text-slate-300">{m.motivo}</p>
                  </div>

                  <button
                    onClick={() => {
                      executeTransferBetweenShelters({
                        fromShelterId: m.fromShelterId,
                        toShelterId: m.toShelterId,
                        categoria: m.categoria,
                        quantidade: m.quantidadeSugerida,
                      });
                      triggerToast(
                        `Parceria confirmada: ${m.quantidadeSugerida} ${m.unidade} de ${m.categoriaLabel} transferidos de ${m.fromShelterName} para ${m.toShelterName}!`
                      );
                    }}
                    className="w-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    Acionar Remessa entre Abrigos ({m.quantidadeSugerida}{" "}
                    {m.unidade})
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Estoque Detalhado do Abrigo Selecionado */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Estoque Atual de {activeShelter.nome}
            </h3>
            <p className="text-xs text-slate-500">
              Os níveis abaixo alimentam automaticamente o Mapa do Cidadão e o Matchmaking da IA.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriesList.map((cat) => {
            const st = activeShelter.estoque[cat];
            const pct = Math.min(
              100,
              Math.round((st.quantidade / Math.max(1, st.meta)) * 100)
            );
            const isCrit = st.status === "critico";
            const isExc = st.status === "excedente";

            return (
              <div
                key={cat}
                className={`p-4 rounded-xl border ${
                  isCrit
                    ? "border-red-200 bg-red-50/40"
                    : isExc
                    ? "border-indigo-200 bg-indigo-50/30"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {CATEGORY_META[cat].label}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      isCrit
                        ? "bg-red-100 text-red-700"
                        : isExc
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {isCrit
                      ? "Crítico"
                      : isExc
                      ? "Excedente (Coleta Suspensa)"
                      : "Estável"}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {st.quantidade}{" "}
                    <span className="text-xs font-semibold text-slate-500">
                      / meta {st.meta} {st.unidade}
                    </span>
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    {pct}%
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                  <div
                    className={`h-full transition-all ${
                      isCrit
                        ? "bg-red-500"
                        : isExc
                        ? "bg-indigo-600"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <p className="text-xs text-slate-600 mt-2">{st.detalhe}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mural de Alertas entre Abrigos (Emissão + Manifestação de Apoio) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Emitir Alerta */}
        <form
          onSubmit={handleEmitAlert}
          className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 h-fit"
        >
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BellPlus className="w-4 h-4 text-red-600" />
              Emitir Alerta de Suprimento
            </h3>
            <p className="text-xs text-slate-500">
              Publique uma necessidade urgente de {activeShelter.nome} para que outros abrigos da rede se manifestem.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">
              Categoria Necessária
            </label>
            <select
              value={alertCat}
              onChange={(e) => setAlertCat(e.target.value as SupplyCategory)}
              className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900"
            >
              {categoriesList.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_META[c].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">
              Especificação do Pedido
            </label>
            <input
              type="text"
              placeholder="Ex: Fraldas G, cobertores térmicos, água"
              value={alertDesc}
              onChange={(e) => setAlertDesc(e.target.value)}
              className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">
              Quantidade Necessária ({CATEGORY_META[alertCat].unidadePadrao})
            </label>
            <input
              type="number"
              min={1}
              value={alertQtd}
              onChange={(e) => setAlertQtd(Number(e.target.value))}
              className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
          >
            Publicar Alerta na Rede TrIA
          </button>
        </form>

        {/* Mural de Alertas Ativos */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Mural de Alertas dos Abrigos (Autogerência entre Unidades)
            </h3>
            <p className="text-xs text-slate-500">
              Abrigos com estoque disponível podem se manifestar abaixo para suprir total ou parcialmente cada pedido.
            </p>
          </div>

          <div className="space-y-3">
            {alerts.map((al) => {
              const totalPledged = al.manifestacoes.reduce(
                (acc, m) => acc + m.quantidade,
                0
              );
              const restante = Math.max(
                0,
                al.quantidadeNecessaria - totalPledged
              );

              return (
                <div
                  key={al.id}
                  className={`p-4 rounded-xl border ${
                    al.status === "atendido"
                      ? "bg-emerald-50/40 border-emerald-200"
                      : "bg-slate-50 border-slate-200"
                  } space-y-3`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-md bg-red-100 text-red-800">
                          {CATEGORY_META[al.categoria].label}
                        </span>
                        <span className="text-xs text-slate-500">
                          {al.criadoEm}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        {al.shelterName} ({al.bairro}): {al.itemEspecifico}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-700">
                        Meta: {al.quantidadeNecessaria} {al.unidade}
                      </div>
                      <div
                        className={`text-xs font-extrabold ${
                          al.status === "atendido"
                            ? "text-emerald-700"
                            : "text-red-600"
                        }`}
                      >
                        {al.status === "atendido"
                          ? "100% Suprido pela Rede"
                          : `Faltam ${restante} ${al.unidade}`}
                      </div>
                    </div>
                  </div>

                  {/* Manifestações já registradas */}
                  {al.manifestacoes.length > 0 && (
                    <div className="space-y-1.5 pl-3 border-l-2 border-indigo-400">
                      {al.manifestacoes.map((m) => (
                        <div
                          key={m.id}
                          className="text-xs text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200"
                        >
                          <strong className="text-indigo-700">
                            {m.fromShelterName}
                          </strong>{" "}
                          comprometeu{" "}
                          <strong>
                            {m.quantidade} {al.unidade}
                          </strong>
                          : &ldquo;{m.mensagem}&rdquo;
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Botão para o abrigo ativo suprir o alerta de outro abrigo */}
                  {al.status === "aberto" && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                      <span className="text-xs text-slate-600">
                        Respondendo como:{" "}
                        <strong className="text-slate-900">
                          {activeShelter.id === al.shelterId
                            ? "Ginásio Colégio Santa Dorotéia (Parceiro com excedente)"
                            : activeShelter.nome}
                        </strong>
                      </span>

                      <button
                        onClick={() => {
                          const donorId =
                            activeShelter.id === al.shelterId
                              ? "santa-doroteia"
                              : activeShelter.id;
                          const lote = Math.min(
                            restante,
                            Math.max(20, Math.round(restante / 2))
                          );
                          pledgeSupportToAlert({
                            alertId: al.id,
                            fromShelterId: donorId,
                            quantidade: lote,
                            mensagem: `Lote de ${lote} ${al.unidade} separado e pronto para coleta da Defesa Civil / Transporte Solidário.`,
                          });
                          triggerToast(
                            `Apoio registrado no alerta! +${lote} ${al.unidade} enviados para ${al.shelterName}.`
                          );
                        }}
                        className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors"
                      >
                        <HandHeart className="w-3.5 h-3.5" />
                        Manifestar Apoio e Suprir Lote
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
