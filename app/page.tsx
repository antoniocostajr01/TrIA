"use client";

import React, { useState } from "react";
import CitizenMapView from "@/components/CitizenMapView";
import VolunteerTriageView from "@/components/VolunteerTriageView";
import ShelterDashboardView from "@/components/ShelterDashboardView";
import DonorChatbot from "@/components/DonorChatbot";
import { useTria } from "@/context/TriaContext";
import {
  Building2,
  Camera,
  MapPin,
  Recycle,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";

type ActiveTab = "cidadao" | "voluntario" | "abrigo";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("cidadao");
  const { shelters, alerts, recycledTextileKg, resetDemoData } = useTria();

  const openAlertsCount = alerts.filter((a) => a.status === "aberto").length;
  const totalAcolhidos = shelters.reduce((acc, s) => acc + s.ocupacaoAtual, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Topbar Unificada com Seletor Rápido das 3 Frentes */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                Tr
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    TrIA
                  </h1>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    Porto Alegre · PLACON & SMAS
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Quem abriga também precisa de abrigo
                </p>
              </div>
            </div>

            <button
              onClick={resetDemoData}
              title="Restaurar dados iniciais da demonstração"
              className="lg:hidden inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          {/* Seletor das 3 Frentes do MVP */}
          <nav className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab("cidadao")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "cidadao"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              1. Cidadão (Mapa de Doações)
            </button>

            <button
              onClick={() => setActiveTab("voluntario")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "voluntario"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Camera className="w-4 h-4 text-indigo-600" />
              2. Voluntário (Triagem IA)
            </button>

            <button
              onClick={() => setActiveTab("abrigo")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "abrigo"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-4 h-4 text-purple-600" />
              3. Organização do Abrigo
              {openAlertsCount > 0 && (
                <span className="bg-red-600 text-white text-[11px] px-1.5 py-0.2 rounded-full">
                  {openAlertsCount}
                </span>
              )}
            </button>
          </nav>

          {/* Indicadores rápidos + Reset Demo */}
          <div className="hidden lg:flex items-center gap-3 text-xs">
            <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-semibold text-slate-700">
              Acolhidos: <strong>{totalAcolhidos}</strong>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-semibold text-emerald-800 flex items-center gap-1">
              <Recycle className="w-3.5 h-3.5" />
              Reciclagem: <strong>{recycledTextileKg} kg</strong>
            </div>
            <button
              onClick={resetDemoData}
              title="Restaurar dados iniciais da demonstração"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === "cidadao" && <CitizenMapView />}
        {activeTab === "voluntario" && <VolunteerTriageView />}
        {activeTab === "abrigo" && <ShelterDashboardView />}
      </main>

      {/* Chatbot Flutuante de Orientação ao Doador */}
      <DonorChatbot />

      {/* Rodapé com Modelo Non-Profit + Economia Circular */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-600" />
            <span>
              <strong>TrIA (Hackathon CEUE 2026/2 · Tecnopuc)</strong> · Plataforma Non-Profit integrada aos protocolos do PLACON Porto Alegre.
            </span>
          </div>
          <div>
            Sustentabilidade técnica via Economia Circular Têxtil ({recycledTextileKg} kg destinados à reciclagem industrial).
          </div>
        </div>
      </footer>
    </div>
  );
}
