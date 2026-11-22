import { type CategoryId } from "./demo-data";
export type CollectionHub = {
  id: string;
  name: string;
  district: string;
  address: string;
  hours: string;
  coordinates: [number, number];
  accepting: CategoryId[];
  paused: CategoryId[];
};
// Pontos de coleta fictícios exclusivos do cenário de apresentação.
// Não representam serviços, endereços ou horários de atendimento verificados.
export const collectionHubs: CollectionHub[] = [
  {
    id: "hub-centro",
    name: "Hub Centro · Estação do Cuidado",
    district: "Centro Histórico",
    address: "Rua do Acolhimento, 120 · Centro Histórico",
    hours: "Segunda a sábado, 9h às 18h",
    coordinates: [-30.033, -51.222],
    accepting: [
      "roupas",
      "agua",
      "alimentos",
      "higiene",
      "colchoes_cama",
      "racao_pet",
    ],
    paused: [],
  },
  {
    id: "hub-norte",
    name: "Hub Norte · Rede Solidária",
    district: "Zona Norte",
    address: "Av. da Solidariedade, 450 · Zona Norte",
    hours: "Todos os dias, 8h às 19h",
    coordinates: [-30.005, -51.165],
    accepting: ["agua", "alimentos", "higiene", "colchoes_cama", "racao_pet"],
    paused: ["roupas"],
  },
  {
    id: "hub-leste",
    name: "Hub Leste · Ponto de Encontro",
    district: "Zona Leste",
    address: "Rua da União, 85 · Zona Leste",
    hours: "Segunda a sábado, 10h às 18h",
    coordinates: [-30.061, -51.158],
    accepting: ["roupas", "agua", "alimentos", "higiene", "racao_pet"],
    paused: ["colchoes_cama"],
  },
  {
    id: "hub-sul",
    name: "Hub Sul · Casa da Partilha",
    district: "Zona Sul",
    address: "Av. do Cuidado, 210 · Zona Sul",
    hours: "Segunda a sábado, 9h às 17h",
    coordinates: [-30.095, -51.223],
    accepting: [
      "roupas",
      "agua",
      "alimentos",
      "higiene",
      "colchoes_cama",
      "racao_pet",
    ],
    paused: [],
  },
];
