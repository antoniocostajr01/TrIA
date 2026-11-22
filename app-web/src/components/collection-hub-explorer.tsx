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
} from "lucide-react";
import { collectionHubs } from "@/lib/collection-hubs";
import { categories, type CategoryId } from "@/lib/demo-data";
const LocationMap = dynamic(() => import("./shelter-map"), {
  ssr: false,
  loading: () => (
    <div className="map-loading">Preparando pontos de coleta…</div>
  ),
});
export function CollectionHubExplorer() {
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const filtered = collectionHubs.filter((h) =>
    `${h.name} ${h.district}`
      .toLocaleLowerCase("pt-BR")
      .includes(query.toLocaleLowerCase("pt-BR")),
  );
  const hub = collectionHubs.find((h) => h.id === selected);
  const locations = filtered.map((h) => ({
    ...h,
    status:
      category !== "all" && h.paused.includes(category)
        ? ("surplus" as const)
        : ("stable" as const),
    details: [
      h.address,
      h.hours,
      category === "all"
        ? "Recebimento e triagem de doações"
        : h.accepting.includes(category)
          ? `Recebendo ${categories.find((c) => c.id === category)?.label.toLowerCase()}`
          : "Recebimento deste item suspenso",
    ],
  }));
  return (
    <>
      <section className="stats" aria-label="Rede de pontos de coleta">
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
            <Heart />
          </span>
          <div>
            <strong>06</strong>
            <span>categorias de doação</span>
          </div>
        </article>
        <article className="stat-card">
          <span className="stat-icon">
            <MapPin />
          </span>
          <div>
            <strong>POA</strong>
            <span>uma rede de cuidado</span>
          </div>
        </article>
      </section>
      <section className="explore-section">
        <div className="section-heading">
          <div>
            <h2>Onde levar sua doação?</h2>
            <p>Escolha um item e encontre um hub que possa recebê-lo.</p>
          </div>
        </div>
        <div className="category-filters" aria-label="Filtrar hubs por doação">
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
        <div className="explore-grid">
          <div className="shelter-list">
            <div className="search-field">
              <Search size={18} />
              <input
                aria-label="Buscar hub ou região"
                placeholder="Buscar hub ou região"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="list-caption">
              <span>
                {filtered.length}{" "}
                {filtered.length === 1 ? "ponto de coleta" : "pontos de coleta"}
              </span>
              <span>Porto Alegre</span>
            </div>
            <div className="shelter-scroll">
              {filtered.map((h) => {
                const paused =
                  category !== "all" && h.paused.includes(category);
                return (
                  <button
                    key={h.id}
                    className={`shelter-card ${selected === h.id ? "selected" : ""}`}
                    aria-pressed={selected === h.id}
                    onClick={() => setSelected(h.id)}
                  >
                    <div className="shelter-card-top">
                      <span className="shelter-avatar">
                        <Package size={20} />
                      </span>
                      <span
                        className={`status-badge ${paused ? "surplus" : "stable"}`}
                      >
                        {paused ? "Item suspenso" : "Recebendo doações"}
                      </span>
                    </div>
                    <h3>{h.name}</h3>
                    <p>{h.district}</p>
                    <div className="hub-card-info">
                      <MapPin size={14} />
                      <span>{h.address}</span>
                    </div>
                    <div className="hub-card-info">
                      <Clock3 size={14} />
                      <span>{h.hours}</span>
                    </div>
                    <div className="need-tags">
                      {h.accepting.map((id) => {
                        const c = categories.find((c) => c.id === id)!;
                        return (
                          <span key={id}>
                            <c.icon size={13} />
                            {c.short}
                          </span>
                        );
                      })}
                    </div>
                    <span className="hub-view-label">
                      {selected === h.id
                        ? "Ponto selecionado no mapa"
                        : "Ver ponto de coleta no mapa"}
                    </span>
                  </button>
                );
              })}
              {!filtered.length && (
                <div className="empty-state">
                  <Search />
                  <h3>Nenhum hub encontrado</h3>
                  <p>Tente outro nome ou região.</p>
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
                <i className="stable" />
                Recebendo doações
              </span>
              <span>
                <i className="surplus" />
                Item suspenso
              </span>
            </div>
          </div>
        </div>
      </section>
      {hub && (
        <section
          className="hub-detail panel"
          aria-label="Detalhes do ponto de coleta"
        >
          <div className="panel-heading">
            <span className="soft-icon">
              <Package />
            </span>
            <div>
              <h2>{hub.name}</h2>
              <p>Recebimento, triagem e encaminhamento para a rede.</p>
            </div>
          </div>
          <div className="hub-detail-address">
            <p>
              <MapPin size={19} />
              {hub.address}
            </p>
            <p>
              <Clock3 size={19} />
              {hub.hours}
            </p>
          </div>
          <h3>O que você pode trazer</h3>
          <div className="accepted-items">
            {hub.accepting.map((id) => {
              const c = categories.find((c) => c.id === id)!;
              return (
                <span key={id}>
                  <CheckCircle2 size={16} />
                  {c.label}
                </span>
              );
            })}
          </div>
          {hub.paused.length > 0 && (
            <div className="hub-paused">
              <PauseCircle size={19} />
              <span>
                Recebimento suspenso:{" "}
                {hub.paused
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
          <strong>Você doa. O hub organiza. A rede acolhe.</strong>
          <p>
            Leve itens em boas condições ao ponto de coleta. O hub faz a triagem
            e encaminha aos abrigos.
          </p>
        </div>
      </div>
    </>
  );
}
