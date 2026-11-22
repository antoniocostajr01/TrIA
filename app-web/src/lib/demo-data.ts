import {
  Shirt,
  Droplets,
  Utensils,
  Sparkles,
  BedDouble,
  PawPrint,
} from "lucide-react";

export const categories = [
  {
    id: "roupas",
    label: "Roupas e agasalhos",
    short: "Roupas",
    icon: Shirt,
    unit: "peças",
  },
  {
    id: "agua",
    label: "Água potável",
    short: "Água",
    icon: Droplets,
    unit: "litros",
  },
  {
    id: "alimentos",
    label: "Alimentos",
    short: "Alimentos",
    icon: Utensils,
    unit: "kg",
  },
  {
    id: "higiene",
    label: "Higiene e limpeza",
    short: "Higiene",
    icon: Sparkles,
    unit: "kits",
  },
  {
    id: "colchoes_cama",
    label: "Colchões e cama",
    short: "Colchões",
    icon: BedDouble,
    unit: "unidades",
  },
  {
    id: "racao_pet",
    label: "Ração pet",
    short: "Pets",
    icon: PawPrint,
    unit: "kg",
  },
] as const;
export type CategoryId = (typeof categories)[number]["id"];
export type Status = "critical" | "stable" | "surplus";
export type Shelter = {
  id: string;
  name: string;
  district: string;
  coordinates: [number, number];
  stock: Record<CategoryId, number>;
};
// Cenário fictício: nomes e coordenadas fornecidos pela documentação do projeto.
// Quantidades não representam disponibilidade ou operação atual destes locais.
export const shelters: Shelter[] = [
  {
    id: "sesi",
    name: "Ginásio do Sesi-RS",
    district: "Rubem Berta · Zona Norte",
    coordinates: [-30.0008, -51.1147],
    stock: {
      roupas: 18,
      agua: 20,
      alimentos: 120,
      higiene: 55,
      colchoes_cama: 8,
      racao_pet: 30,
    },
  },
  {
    id: "doroteia",
    name: "Colégio Santa Dorotéia",
    district: "Passo d’Areia · Zona Norte",
    coordinates: [-30.0182, -51.1614],
    stock: {
      roupas: 420,
      agua: 180,
      alimentos: 250,
      higiene: 8,
      colchoes_cama: 60,
      racao_pet: 35,
    },
  },
  {
    id: "demhab",
    name: "Abrigo Demhab",
    district: "Santana · Região Central",
    coordinates: [-30.0485, -51.2089],
    stock: {
      roupas: 320,
      agua: 400,
      alimentos: 100,
      higiene: 60,
      colchoes_cama: 5,
      racao_pet: 4,
    },
  },
  {
    id: "farrapos",
    name: "Clube Farrapos",
    district: "Higienópolis · Zona Norte",
    coordinates: [-30.0125, -51.182],
    stock: {
      roupas: 95,
      agua: 140,
      alimentos: 15,
      higiene: 5,
      colchoes_cama: 110,
      racao_pet: 30,
    },
  },
  {
    id: "dias",
    name: "Albergue Dias da Cruz",
    district: "Azenha · Região Central",
    coordinates: [-30.0562, -51.2154],
    stock: {
      roupas: 12,
      agua: 120,
      alimentos: 85,
      higiene: 9,
      colchoes_cama: 30,
      racao_pet: 25,
    },
  },
];
export const targets: Record<CategoryId, number> = {
  roupas: 100,
  agua: 200,
  alimentos: 100,
  higiene: 60,
  colchoes_cama: 50,
  racao_pet: 40,
};
export function stockStatus(category: CategoryId, quantity: number): Status {
  return quantity < targets[category] * 0.4
    ? "critical"
    : quantity > targets[category] * 1.5
      ? "surplus"
      : "stable";
}
export const statusLabels: Record<Status, string> = {
  critical: "Urgente",
  stable: "Recebendo",
  surplus: "Coleta suspensa",
};
export type Entry = {
  id: string;
  shelterId: string;
  category: CategoryId;
  quantity: number;
  date: string;
};
export type Alert = {
  id: string;
  shelterId: string;
  message: string;
  supported: boolean;
};
export const initialAlerts: Alert[] = [
  {
    id: "seed-1",
    shelterId: "sesi",
    message:
      "Precisamos de água potável e roupas de frio para receber novas famílias.",
    supported: false,
  },
  {
    id: "seed-2",
    shelterId: "doroteia",
    message:
      "Kits de higiene são nossa prioridade neste momento. Toda ajuda conta.",
    supported: false,
  },
];
