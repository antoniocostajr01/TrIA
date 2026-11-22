"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Clock3,
  Package,
  Search,
  CheckCircle2,
  PauseCircle,
  Heart,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { collectionHubs } from "@/lib/collection-hubs";
import {
  categories,
  stockStatus,
  targets,
  type CategoryId,
  type Shelter,
  type Status,
} from "@/lib/demo-data";

const LocationMap = dynamic(() => import("./shelter-map"), {
  ssr: false,
  loading: () => (
    <div className="map-loading">Preparando pontos de doação em Porto Alegre…</div>
  ),
});

type UnifiedPoint = {
  id: string;
  pointType: "hub" | "shelter";
  name: string;
  district: string;
  addressOrNote: string;
  hoursOrMeta: string;
  coordinates: [number, number];
  status: Status;
  priorityRank: number;
  acceptingCategories: CategoryId[];
  criticalCategories: CategoryId[];
  pausedCategories: CategoryId[];
  details: string[];
};

export function CollectionHubExplorer({ shelters }: { shelters: Shelter[] }) {
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [pointFilter, setPointFilter] = useState<"all" | "hub" | "shelter">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const unifiedPoints: UnifiedPoint[] = [
    ...collectionHubs.map((h) => {
      const paused = category !== "all" && h.paused.includes(category);
      const isClothes = category === "roupas";
      // Se for roupa e o hub estiver aceitando, tem prioridade máxima (rank 0)
      const priorityRank = paused ? 4 : isClothes ? 0 : 1;

      return {
        id: h.id,
        pointType: "hub" as const,
        name: h.name,
        district: h.district,
        addressOrNote: h.address,
        hoursOrMeta: h.hours,
        coordinates: h.coordinates,
        status: paused ? ("surplus" as const) : ("stable" as const),
        priorityRank,
        acceptingCategories: h.accepting,
        criticalCategories: [],
        pausedCategories: h.paused,
        details: [
          h.address,
          h.hours,
          category === "all"
            ? "Hub de coleta e triagem"
            : paused
              ? "Recebimento deste item suspenso neste hub"
              : isClothes
                ? "Prioritário para roupas · Triagem centralizada"
                : `Recebendo ${categories.find((c) => c.id === category)?.label.toLowerCase()}`,
        ],
      };
    }),
    ...shelters.map((s) => {
      const criticalCats = categories
        .filter((c) => stockStatus(c.id, s.stock[c.id]) === "critical")
        .map((c) => c.id);
      const pausedCats = categories
        .filter((c) => stockStatus(c.id, s.stock[c.id]) === "surplus")
        .map((c) => c.id);
      const acceptingCats = categories
        .filter((c) => stockStatus(c.id, s.stock[c.id]) !== "surplus")
        .map((c) => c.id);

      const specificStatus: Status =
        category === "all"
          ? criticalCats.length > 0
            ? "critical"
            : "stable"
          : stockStatus(category, s.stock[category]);

      // Quando é roupa: abrigos aparecem depois dos hubs abertos (rank 2 se crítico, 3 se estável, 4 se suspenso).
      // Nas outras categorias: abrigos críticos ficam no topo (rank 0), depois hubs/estáveis (1-2), depois suspensos (4).
      let priorityRank = 2;
      if (specificStatus === "surplus") {
        priorityRank = 4;
      } else if (category === "roupas") {
        priorityRank = specificStatus === "critical" ? 2 : 3;
      } else {
        priorityRank = specificStatus === "critical" ? 0 : 2;
      }

      return {
        id: s.id,
        pointType: "shelter" as const,
        name: s.name,
        district: s.district,
        addressOrNote: "Entrega direta no abrigo",
        hoursOrMeta:
          criticalCats.length > 0
            ? `${criticalCats.length} necessidade(s) urgente(s)`
            : "Estoque equilibrado",
        coordinates: s.coordinates,
        status: specificStatus,
        priorityRank,
        acceptingCategories: acceptingCats,
        criticalCategories: criticalCats,
        pausedCategories: pausedCats,
        details: [
          `Abrigo direto · ${s.district}`,
          category === "all"
            ? criticalCats.length > 0
              ? `Urgente: ${criticalCats
                  .map((id) => categories.find((c) => c.id === id)?.short)
                  .join(", ")}`
              : "Recebendo doações"
            : specificStatus === "critical"
              ? `Urgente: faltam ${targets[category] - s.stock[category]} ${
                  categories.find((c) => c.id === category)?.unit
                }`
              : specificStatus === "surplus"
                ? "Coleta suspensa por excesso"
                : "Recebendo normalmente",
        ],
      };
    }),
  ];

  const filtered = unifiedPoints
    .filter((p) => (pointFilter === "all" ? true : p.pointType === pointFilter))
    .filter((p) =>
      `${p.name} ${p.district} ${p.addressOrNote}`
        .toLocaleLowerCase("pt-BR")
        .includes(query.toLocaleLowerCase("pt-BR")),
    )
    .sort((a, b) => a.priorityRank - b.priorityRank);

  const selectedPoint = unifiedPoints.find((p) => p.id === selected);

  const locations = filtered.map((p) => ({
    id: p.id,
    name: p.name,
    district: p.district,
    coordinates: p.coordinates,
    status: p.status,
    pointType: p.pointType,
    badge:
      p.pointType === "shelter" && p.criticalCategories.length > 0
        ? p.criticalCategories.length
        : undefined,
    details: p.details,
  }));

  return (
    <>
      <section className="stats" aria-label="Rede de pontos de doação">
        <article className="stat-card">
          <span className="stat-icon">
            <Package />
          </span>
          <div>
            <strong>{collectionHubs.length.toString().padStart(2, "0")}</strong>
            <span>hubs de coleta</span>
          </div>
        </article>
        <article className="stat-card">
          <span className="stat-icon">
            <Building2 />
          </span>
          <div>
            <strong>{shelters.length.toString().padStart(2, "0")}</strong>
            <span>abrigos na rede</span>
          </div>
        </article>
        <article className="stat-card">
          <span className="stat-icon">
            <MapPin />
          </span>
          <div>
            <strong>{(collectionHubs.length + shelters.length).toString().padStart(2, "0")}</strong>
            <span>pontos em Porto Alegre</span>
          </div>
        </article>
      </section>

      <section className="explore-section">
        <div className="section-heading">
          <div>
            <h2>Onde levar sua doação?</h2>
            <p>
              {category === "roupas"
                ? "Para roupas, priorizamos os Hubs de Coleta para facilitar a triagem — mas você também pode levar direto aos abrigos."
                : "Veja os 4 hubs de triagem e os 8 abrigos espalhados por Porto Alegre."}
            </p>
          </div>
        </div>

        <div className="category-filters" aria-label="Filtrar pontos por doação">
          <button
            className={`filter-chip ${category === "all" ? "active" : ""}`}
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
          >
            Todos os itens
          </button>
          {categories.map((c) => (
            <button
              className={`filter-chip ${category === c.id ? "active" : ""}`}
              aria-pressed={category === c.id}
              key={c.id}
              onClick={() => setCategory(c.id)}
            >
              <c.icon size={18} />
              {c.short}
            </button>
          ))}
        </div>

        <div className="point-type-pills" aria-label="Filtrar por tipo de ponto">
          <button
            type="button"
            className={pointFilter === "all" ? "active" : ""}
            onClick={() => setPointFilter("all")}
          >
            Todos ({unifiedPoints.length})
          </button>
          <button
            type="button"
            className={pointFilter === "hub" ? "active" : ""}
            onClick={() => setPointFilter("hub")}
          >
            Hubs de Triagem ({collectionHubs.length})
          </button>
          <button
            type="button"
            className={pointFilter === "shelter" ? "active" : ""}
            onClick={() => setPointFilter("shelter")}
          >
            Abrigos Diretos ({shelters.length})
          </button>
        </div>

        <div className="explore-grid">
          <div className="shelter-list">
            <div className="search-field">
              <Search size={18} />
              <input
                aria-label="Buscar abrigo, hub ou região"
                placeholder="Buscar abrigo, hub ou região"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="list-caption">
              <span>
                {filtered.length}{" "}
                {filtered.length === 1 ? "local encontrado" : "locais encontrados"}
              </span>
              <span>
                {category === "roupas" ? "Hubs priorizados" : "Porto Alegre"}
              </span>
            </div>
            <div className="shelter-scroll">
              {filtered.map((p) => {
                const isClothesHub =
                  category === "roupas" &&
                  p.pointType === "hub" &&
                  p.status !== "surplus";

                return (
                  <button
                    key={p.id}
                    className={`shelter-card ${selected === p.id ? "selected" : ""}`}
                    aria-pressed={selected === p.id}
                    onClick={() => setSelected(p.id)}
                  >
                    <div className="shelter-card-top">
                      <span className="shelter-avatar">
                        {p.pointType === "hub" ? (
                          <Package size={20} />
                        ) : (
                          <Building2 size={20} />
                        )}
                      </span>
                      <span className={`status-badge ${p.status}`}>
                        {p.status === "surplus"
                          ? "Item suspenso"
                          : p.status === "critical"
                            ? "Precisa urgente"
                            : isClothesHub
                              ? "Prioridade p/ roupas"
                              : "Recebendo"}
                      </span>
                    </div>
                    <div className="point-kind-label">
                      {p.pointType === "hub" ? "Hub de Triagem" : "Abrigo Direto"}
                    </div>
                    <h3>{p.name}</h3>
                    <p>{p.district}</p>
                    <div className="hub-card-info">
                      <MapPin size={14} />
                      <span>{p.addressOrNote}</span>
                    </div>
                    <div className="hub-card-info">
                      <Clock3 size={14} />
                      <span>{p.hoursOrMeta}</span>
                    </div>

                    {p.pointType === "hub" ? (
                      <div className="need-tags">
                        {p.acceptingCategories.slice(0, 4).map((id) => {
                          const c = categories.find((c) => c.id === id)!;
                          return (
                            <span key={id}>
                              <c.icon size={13} />
                              {c.short}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      p.criticalCategories.length > 0 && (
                        <div className="need-tags">
                          {p.criticalCategories.slice(0, 4).map((id) => {
                            const c = categories.find((c) => c.id === id)!;
                            return (
                              <span key={id} className="urgent-tag">
                                <AlertTriangle size={12} />
                                {c.short}
                              </span>
                            );
                          })}
                        </div>
                      )
                    )}

                    <span className="hub-view-label">
                      {selected === p.id
                        ? "Selecionado no mapa"
                        : "Ver local no mapa"}
                    </span>
                  </button>
                );
              })}
              {!filtered.length && (
                <div className="empty-state">
                  <Search />
                  <h3>Nenhum ponto encontrado</h3>
                  <p>Tente outro nome, bairro ou tipo de ponto.</p>
                </div>
              )}
            </div>
          </div>

          <div className="map-panel">
            <LocationMap
              locations={locations}
              selected={selected}
              onSelect={setSelected}
              kind="hubs"
            />
            <div className="map-legend">
              <span>
                <i className="critical" />
                Abrigo urgente
              </span>
              <span>
                <i className="stable" />
                Hub / Abrigo recebendo
              </span>
              <span>
                <i className="surplus" />
                Item suspenso
              </span>
            </div>
          </div>
        </div>
      </section>

      {selectedPoint && (
        <section
          className="hub-detail panel"
          aria-label="Detalhes do ponto selecionado"
        >
          <div className="panel-heading">
            <span className="soft-icon">
              {selectedPoint.pointType === "hub" ? <Package /> : <Building2 />}
            </span>
            <div>
              <h2>{selectedPoint.name}</h2>
              <p>
                {selectedPoint.pointType === "hub"
                  ? "Hub de recebimento, triagem e encaminhamento para a rede."
                  : "Abrigo permanente ou emergencial com recebimento direto."}
              </p>
            </div>
          </div>
          <div className="hub-detail-address">
            <p>
              <MapPin size={19} />
              {selectedPoint.district} · {selectedPoint.addressOrNote}
            </p>
            <p>
              <Clock3 size={19} />
              {selectedPoint.hoursOrMeta}
            </p>
          </div>
          <h3>
            {selectedPoint.pointType === "hub"
              ? "O que você pode trazer"
              : selectedPoint.criticalCategories.length > 0
                ? "Itens mais urgentes neste abrigo"
                : "Itens aceitos neste abrigo"}
          </h3>
          <div className="accepted-items">
            {(selectedPoint.pointType === "shelter" &&
            selectedPoint.criticalCategories.length > 0
              ? selectedPoint.criticalCategories
              : selectedPoint.acceptingCategories
            ).map((id) => {
              const c = categories.find((c) => c.id === id)!;
              return (
                <span key={id}>
                  <CheckCircle2 size={16} />
                  {c.label}
                </span>
              );
            })}
          </div>
          {selectedPoint.pausedCategories.length > 0 && (
            <div className="hub-paused">
              <PauseCircle size={19} />
              <span>
                Recebimento suspenso por excesso:{" "}
                {selectedPoint.pausedCategories
                  .map((id) => categories.find((c) => c.id === id)!.label)
                  .join(", ")}
                .
              </span>
            </div>
          )}
        </section>
      )}

      <div className="care-note">
        <span className="care-icon">
          <Heart size={21} />
        </span>
        <div>
          <strong>Você doa. O hub organiza. O abrigo acolhe.</strong>
          <p>
            Para roupas, priorize os Hubs de Coleta que fazem a triagem rápida —
            ou entregue diretamente nos abrigos quando houver demanda urgente perto de você.
          </p>
        </div>
      </div>
    </>
  );
}
