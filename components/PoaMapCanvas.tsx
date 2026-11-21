"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  CATEGORY_META,
  Shelter,
  SupplyCategory,
} from "@/context/TriaContext";

interface PoaMapCanvasProps {
  shelters: Shelter[];
  selectedCategory: SupplyCategory | "todas";
  selectedShelterId: string | null;
  onSelectShelter: (id: string) => void;
}

export default function PoaMapCanvas({
  shelters,
  selectedCategory,
  selectedShelterId,
  onSelectShelter,
}: PoaMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-30.028, -51.175],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    shelters.forEach((shelter) => {
      let pinColor = "#f59e0b"; // amber
      let badgeText = "Atenção";
      let pulse = false;

      if (selectedCategory === "todas") {
        const hasCritical = Object.values(shelter.estoque).some(
          (c) => c.status === "critico"
        );
        if (hasCritical) {
          pinColor = "#ef4444"; // red
          badgeText = "Precisa Urgente";
          pulse = true;
        } else {
          pinColor = "#10b981"; // emerald
          badgeText = "Abastecido";
        }
      } else {
        const catStock = shelter.estoque[selectedCategory];
        if (catStock.status === "critico") {
          pinColor = "#ef4444";
          badgeText = `Urgente: ${CATEGORY_META[selectedCategory].label}`;
          pulse = true;
        } else if (catStock.status === "excedente") {
          pinColor = "#64748b";
          badgeText = "Coleta Suspensa (Excesso)";
        } else {
          pinColor = "#10b981";
          badgeText = "Recebendo Normal";
        }
      }

      const isSelected = shelter.id === selectedShelterId;
      const size = isSelected ? 40 : 32;

      const icon = L.divIcon({
        className: "custom-tria-marker",
        html: `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;">
            ${
              pulse
                ? `<span style="position:absolute;width:100%;height:100%;border-radius:9999px;background:${pinColor};opacity:0.45;animation:ping 1.6s cubic-bezier(0,0,0.2,1) infinite;"></span>`
                : ""
            }
            <div style="position:relative;width:${size - 6}px;height:${
          size - 6
        }px;border-radius:9999px;background:${pinColor};border:${
          isSelected ? "4px solid #0f172a" : "3px solid #ffffff"
        };box-shadow:0 4px 10px rgba(0,0,0,0.28);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:11px;">
              ${Math.round((shelter.ocupacaoAtual / shelter.capacidade) * 100)}%
            </div>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([shelter.lat, shelter.lng], { icon });
      marker.on("click", () => {
        onSelectShelter(shelter.id);
      });

      marker.bindTooltip(
        `<div style="font-weight:700;font-size:12px;">${shelter.nome}</div><div style="font-size:11px;color:#334155;">${badgeText}</div>`,
        { direction: "top", offset: [0, -14] }
      );

      marker.addTo(layer);
    });
  }, [shelters, selectedCategory, selectedShelterId, onSelectShelter]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[430px] lg:h-[540px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner z-0"
    />
  );
}
