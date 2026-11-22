"use client";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
import type { Status } from "@/lib/demo-data";
import "leaflet/dist/leaflet.css";
export type MapLocation = {
  id: string;
  name: string;
  district: string;
  coordinates: [number, number];
  status: Status;
  details: string[];
  badge?: number;
  pointType?: "hub" | "shelter";
};
function Focus({ location }: { location: MapLocation | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (location)
      map.flyTo(location.coordinates, 13, {
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 0.6,
      });
  }, [location?.id, map]);
  return null;
}
function FitLocations({
  locations,
  selected,
}: {
  locations: MapLocation[];
  selected: string | null;
}) {
  const map = useMap();
  const locationKey = locations
    .map((l) => `${l.id}:${l.coordinates.join(",")}`)
    .join("|");
  useEffect(() => {
    const fit = () => {
      map.invalidateSize();
      if (!selected && locations.length)
        map.fitBounds(
          locations.map((l) => l.coordinates),
          { padding: [36, 46], maxZoom: 12, animate: false },
        );
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, locationKey, selected]);
  return null;
}
export default function LocationMap({
  locations,
  selected,
  onSelect,
  kind = "shelters",
}: {
  locations: MapLocation[];
  selected: string | null;
  onSelect: (id: string) => void;
  kind?: "hubs" | "shelters";
}) {
  const focus = locations.find((l) => l.id === selected);
  const [mapKey] = useState(() => `poa-map-${Math.random().toString(36).slice(2)}`);
  return (
    <MapContainer
      key={mapKey}
      center={kind === "hubs" ? [-30.045, -51.19] : [-30.026, -51.165]}
      zoom={12}
      scrollWheelZoom={false}
      className="shelter-map"
      aria-label={
        kind === "hubs"
          ? "Mapa dos hubs de coleta em Porto Alegre"
          : "Mapa de necessidades dos abrigos em Porto Alegre"
      }
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitLocations locations={locations} selected={selected} />
      <Focus location={focus} />
      {locations.map((l) => {
        const isHub = l.pointType ? l.pointType === "hub" : kind === "hubs";
        const shape = isHub
          ? '<path d="m3 7 9-4 9 4v10l-9 4-9-4Z"/><path d="m3 7 9 4 9-4M12 11v10M7.5 5l9 4"/>'
          : '<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>';
        const icon = L.divIcon({
          className: "map-marker-wrapper",
          html: `<span aria-hidden="true" class="map-pin ${l.status} ${selected === l.id ? "selected" : ""}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${shape}</svg>${l.badge ? `<b class="pin-count">${l.badge}</b>` : ""}</span>`,
          iconSize: [42, 48],
          iconAnchor: [21, 45],
        });
        return (
          <Marker
            key={l.id}
            title={l.name}
            alt={l.name}
            position={l.coordinates}
            icon={icon}
            eventHandlers={{ click: () => onSelect(l.id) }}
          >
            <Popup>
              <div className="location-popup">
                <strong>{l.name}</strong>
                <small>{l.district}</small>
                {l.details.map((d) => (
                  <p key={d}>{d}</p>
                ))}
              </div>
            </Popup>
            {selected === l.id && (
              <Tooltip permanent direction="top" offset={[0, -43]}>
                {kind === "hubs"
                  ? "Ponto de coleta selecionado"
                  : "Abrigo selecionado"}
              </Tooltip>
            )}
          </Marker>
        );
      })}
    </MapContainer>
  );
}
