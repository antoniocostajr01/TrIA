"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import {
  type Shelter,
  type CategoryId,
  stockStatus,
  statusLabels,
} from "@/lib/demo-data";
import "leaflet/dist/leaflet.css";
function Focus({ shelter }: { shelter: Shelter | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (shelter) map.flyTo(shelter.coordinates, 13, { duration: 0.8 });
  }, [shelter, map]);
  return null;
}
export default function ShelterMap({
  shelters,
  category,
  selected,
  onSelect,
}: {
  shelters: Shelter[];
  category: CategoryId | "all";
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <MapContainer
      center={[-30.026, -51.165]}
      zoom={12}
      scrollWheelZoom={false}
      className="shelter-map"
      aria-label="Mapa dos abrigos de demonstração em Porto Alegre"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Focus shelter={shelters.find((s) => s.id === selected)} />
      {shelters.map((s) => {
        const status =
          category === "all"
            ? Object.entries(s.stock).some(
                ([c, q]) => stockStatus(c as CategoryId, q) === "critical",
              )
              ? "critical"
              : "stable"
            : stockStatus(category, s.stock[category]);
        const icon = L.divIcon({
          className: "map-marker-wrapper",
          html: `<span class="map-pin ${status} ${selected === s.id ? "selected" : ""}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/></svg></span>`,
          iconSize: [42, 48],
          iconAnchor: [21, 45],
        });
        return (
          <Marker
            key={s.id}
            title={s.name}
            alt={s.name}
            position={s.coordinates}
            icon={icon}
            eventHandlers={{ click: () => onSelect(s.id) }}
          >
            <Popup>
              <strong>{s.name}</strong>
              <br />
              {s.district}
              <br />
              {category === "all"
                ? "Consulte as necessidades na lista."
                : statusLabels[status]}
              <br />
              <small>Cenário simulado</small>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
