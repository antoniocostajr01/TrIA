"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  categories,
  targets,
  stockStatus,
  type Shelter,
  type Alert,
  type CategoryId,
} from "@/lib/demo-data";
const LocationMap = dynamic(() => import("./shelter-map"), {
  ssr: false,
  loading: () => (
    <div className="map-loading">Preparando mapa de necessidades…</div>
  ),
});
export function ShelterNeedsExplorer({
  shelters,
  alerts,
}: {
  shelters: Shelter[];
  alerts: Alert[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const needs = (s: Shelter) =>
    categories.filter(
      (c) =>
        (category === "all" || category === c.id) &&
        stockStatus(c.id, s.stock[c.id]) === "critical",
    );
  const ordered = [...shelters].sort(
    (a, b) =>
      Number(b.id === selected) - Number(a.id === selected) ||
      needs(b).length - needs(a).length,
  );
  const locations = shelters.map((s) => ({
    ...s,
    status: needs(s).length ? ("critical" as const) : ("stable" as const),
    badge: needs(s).length,
    details: [
      ...needs(s).map(
        (c) =>
          `Faltam ${targets[c.id] - s.stock[c.id]} ${c.unit} de ${c.short.toLowerCase()}`,
      ),
      ...alerts
        .filter((a) => a.shelterId === s.id)
        .map((a) => `Pedido: ${a.message}`),
    ],
  }));
  return (
    <section className="shelter-needs-explorer" id="mapa-abrigos">
      <div className="section-heading">
        <div>
          <span className="eyebrow">DESTINO DAS DOAÇÕES</span>
          <h2>Do que cada abrigo precisa?</h2>
          <p>Veja as faltas no estoque e os pedidos publicados pela rede.</p>
        </div>
        <span className="count-pill">{shelters.length} abrigos</span>
      </div>
      <div
        className="category-filters"
        aria-label="Filtrar necessidades dos abrigos"
      >
        <button
          className={`filter-chip ${category === "all" ? "active" : ""}`}
          aria-pressed={category === "all"}
          onClick={() => setCategory("all")}
        >
          Todas as necessidades
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={`filter-chip ${category === c.id ? "active" : ""}`}
            aria-pressed={category === c.id}
            onClick={() => setCategory(c.id)}
          >
            <c.icon size={18} />
            {c.short}
          </button>
        ))}
      </div>
      <div className="needs-map-layout">
        <div className="map-panel">
          <LocationMap
            locations={locations}
            selected={selected}
            onSelect={setSelected}
          />
          <div className="map-legend">
            <span>
              <i className="critical" />
              Falta urgente
            </span>
            <span>
              <i className="stable" />
              Sem falta crítica
            </span>
          </div>
        </div>
        <div className="needs-cards">
          {ordered.map((s) => {
            const missing = needs(s);
            const requests = alerts.filter((a) => a.shelterId === s.id);
            return (
              <article
                key={s.id}
                className={`needs-shelter-card ${s.id === selected ? "selected" : ""}`}
              >
                <button
                  className="needs-card-select"
                  aria-pressed={s.id === selected}
                  onClick={() => setSelected(s.id)}
                >
                  <span className="shelter-avatar">
                    <MapPin size={19} />
                  </span>
                  <span>
                    <strong>{s.name}</strong>
                    <small>{s.district}</small>
                  </span>
                  <span
                    className={`status-badge ${missing.length ? "critical" : "stable"}`}
                  >
                    {missing.length
                      ? `${missing.length} ${missing.length === 1 ? "urgente" : "urgentes"}`
                      : "Sem urgência"}
                  </span>
                </button>
                <div className="shelter-stock-needs">
                  <h3>
                    {category === "all"
                      ? "Necessidades de estoque"
                      : `Necessidade de ${categories.find((c) => c.id === category)?.short.toLowerCase()}`}
                  </h3>
                  {missing.length ? (
                    missing.map((c) => (
                      <div className="shelter-need-row" key={c.id}>
                        <c.icon size={19} />
                        <span>
                          <strong>{c.label}</strong>
                          <small>
                            Em estoque: {s.stock[c.id]} {c.unit}
                          </small>
                        </span>
                        <b>
                          Faltam {targets[c.id] - s.stock[c.id]}
                          <small>{c.unit}</small>
                        </b>
                      </div>
                    ))
                  ) : (
                    <p className="stock-covered">
                      <CheckCircle2 size={17} />
                      Sem falta crítica nesta seleção.
                    </p>
                  )}
                </div>
                <div className="shelter-open-requests">
                  <h3>
                    <MessageCircle size={17} />
                    Pedidos do abrigo
                  </h3>
                  {requests.length ? (
                    requests.map((a) => <p key={a.id}>{a.message}</p>)
                  ) : (
                    <p className="no-requests">Nenhum pedido publicado.</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <p className="needs-map-hint">
        <AlertTriangle size={16} />
        As faltas acompanham o estoque. Os pedidos são publicados pelos próprios
        abrigos.
      </p>
    </section>
  );
}
