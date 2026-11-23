"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  CATEGORY_META,
  SupplyCategory,
  useTria,
} from "@/context/TriaContext";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  MapPin,
  Navigation,
  Phone,
  Users,
} from "lucide-react";

const PoaMapCanvas = dynamic(() => import("./PoaMapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[430px] lg:h-[540px] rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-slate-500 text-sm font-medium">
      Carregando mapa de abrigos de Porto Alegre...
    </div>
  ),
});

export default function CitizenMapView() {
  const { shelters } = useTria();
  const [selectedCategory, setSelectedCategory] = useState<
    SupplyCategory | "todas"
  >("todas");
  const [selectedShelterId, setSelectedShelterId] = useState<string>(
    shelters[0]?.id || "sesi-rs"
  );

  const selectedShelter =
    shelters.find((s) => s.id === selectedShelterId) || shelters[0];

  const categoriesList = Object.keys(CATEGORY_META) as SupplyCategory[];

  const sortedShelters = [...shelters].sort((a, b) => {
    if (selectedCategory === "todas") {
      const aCrit = Object.values(a.estoque).filter(
        (c) => c.status === "critico"
      ).length;
      const bCrit = Object.values(b.estoque).filter(
        (c) => c.status === "critico"
      ).length;
      return bCrit - aCrit;
    }
    const order = { critico: 0, estavel: 1, excedente: 2 };
    return (
      order[a.estoque[selectedCategory].status] -
      order[b.estoque[selectedCategory].status]
    );
  });

  return (
    <div className="space-y-6">
      {/* Barra de Filtro do Doador */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              Frente do Cidadão Doador
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              O que você quer doar hoje? Veja onde seu item é urgente
            </h2>
            <p className="text-sm text-slate-600">
              Evite levar doações para depósitos já lotados. Selecione o item abaixo para filtrar os abrigos de Porto Alegre em tempo real.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium text-slate-600 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
              Urgente
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              Estável
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-500 inline-block" />
              Coleta Suspensa (Excesso)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setSelectedCategory("todas")}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
              selectedCategory === "todas"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Visão Geral (Todos os Itens)
          </button>
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {CATEGORY_META[cat].label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Mapa + Lista Direcionada */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <PoaMapCanvas
            shelters={shelters}
            selectedCategory={selectedCategory}
            selectedShelterId={selectedShelter?.id || null}
            onSelectShelter={setSelectedShelterId}
          />

          {/* Detalhe do Abrigo Selecionado no Mapa */}
          {selectedShelter && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-semibold text-indigo-600">
                    {selectedShelter.tipo}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedShelter.nome}
                  </h3>
                  <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {selectedShelter.endereco} · {selectedShelter.bairro}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    {selectedShelter.ocupacaoAtual}/{selectedShelter.capacidade} acolhidos
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${selectedShelter.nome} ${selectedShelter.endereco} Porto Alegre`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Traçar Rota
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4">
                {categoriesList.map((cat) => {
                  const st = selectedShelter.estoque[cat];
                  const isCrit = st.status === "critico";
                  const isExc = st.status === "excedente";
                  return (
                    <div
                      key={cat}
                      className={`p-3 rounded-xl border text-xs ${
                        isCrit
                          ? "bg-red-50/70 border-red-200 text-red-900"
                          : isExc
                          ? "bg-slate-100 border-slate-300 text-slate-600"
                          : "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between gap-1">
                        <span>{CATEGORY_META[cat].label}</span>
                        {isCrit ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        ) : isExc ? (
                          <Ban className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <div className="mt-1 font-semibold">
                        {isCrit
                          ? "URGENTE (Priorizar)"
                          : isExc
                          ? "SUSPENSO (Lotado)"
                          : "Recebendo normal"}
                      </div>
                      <div className="mt-0.5 text-[11px] opacity-80 line-clamp-1">
                        {st.detalhe}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Coluna da Direita: Ranking de Onde Levar */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">
              {selectedCategory === "todas"
                ? "Abrigos por Nível de Necessidade em POA"
                : `Onde doar: ${CATEGORY_META[selectedCategory].label}`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Clique em um abrigo para focar no mapa e ver todas as carências.
            </p>

            <div className="space-y-3 mt-3">
              {sortedShelters.map((shelter) => {
                const isSelected = shelter.id === selectedShelter?.id;
                const criticalCats = categoriesList.filter(
                  (c) => shelter.estoque[c].status === "critico"
                );
                const surplusCats = categoriesList.filter(
                  (c) => shelter.estoque[c].status === "excedente"
                );

                const specificStatus =
                  selectedCategory !== "todas"
                    ? shelter.estoque[selectedCategory].status
                    : null;

                return (
                  <div
                    key={shelter.id}
                    onClick={() => setSelectedShelterId(shelter.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {shelter.nome}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {shelter.bairro} · {shelter.endereco}
                        </p>
                      </div>

                      {specificStatus === "critico" && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700 shrink-0">
                          Levar Aqui (Urgente)
                        </span>
                      )}
                      {specificStatus === "excedente" && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700 shrink-0">
                          Não Levar (Suspenso)
                        </span>
                      )}
                      {specificStatus === "estavel" && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 shrink-0">
                          Estoque Estável
                        </span>
                      )}
                      {!specificStatus && (
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                            criticalCats.length > 0
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {criticalCats.length > 0
                            ? `${criticalCats.length} itens urgentes`
                            : "Abastecido"}
                        </span>
                      )}
                    </div>

                    {selectedCategory !== "todas" ? (
                      <p className="text-xs text-slate-700 mt-2 font-medium">
                        {shelter.estoque[selectedCategory].detalhe} (
                        {shelter.estoque[selectedCategory].quantidade}/
                        {shelter.estoque[selectedCategory].meta}{" "}
                        {shelter.estoque[selectedCategory].unidade})
                      </p>
                    ) : (
                      <div className="mt-2.5 space-y-1.5">
                        {criticalCats.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[11px] font-bold text-red-700">
                              Falta:
                            </span>
                            {criticalCats.map((c) => (
                              <span
                                key={c}
                                className="text-[11px] bg-red-50 text-red-800 border border-red-200 px-2 py-0.5 rounded-md font-medium"
                              >
                                {CATEGORY_META[c].label}
                              </span>
                            ))}
                          </div>
                        )}
                        {surplusCats.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[11px] font-bold text-slate-500">
                              Suspenso (Excesso):
                            </span>
                            {surplusCats.map((c) => (
                              <span
                                key={c}
                                className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium line-through"
                              >
                                {CATEGORY_META[c].label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {shelter.contato}
                      </span>
                      <span>
                        Ocupação:{" "}
                        <strong className="text-slate-700">
                          {shelter.ocupacaoAtual}/{shelter.capacidade}
                        </strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
