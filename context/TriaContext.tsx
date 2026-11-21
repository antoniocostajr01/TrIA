"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type SupplyCategory =
  | "roupas"
  | "agua"
  | "alimentos"
  | "higiene"
  | "colchoes_cama"
  | "racao_pet";

export type StockStatus = "critico" | "estavel" | "excedente";

export interface CategoryStock {
  categoria: SupplyCategory;
  quantidade: number;
  meta: number;
  unidade: string;
  status: StockStatus;
  detalhe: string;
}

export interface Shelter {
  id: string;
  nome: string;
  bairro: string;
  endereco: string;
  lat: number;
  lng: number;
  ocupacaoAtual: number;
  capacidade: number;
  tipo: string;
  contato: string;
  estoque: Record<SupplyCategory, CategoryStock>;
}

export interface ShelterAlertPledge {
  id: string;
  fromShelterId: string;
  fromShelterName: string;
  quantidade: number;
  mensagem: string;
  criadoEm: string;
}

export interface ShelterAlert {
  id: string;
  shelterId: string;
  shelterName: string;
  bairro: string;
  categoria: SupplyCategory;
  itemEspecifico: string;
  quantidadeNecessaria: number;
  unidade: string;
  urgencia: "alta" | "media";
  status: "aberto" | "atendido";
  criadoEm: string;
  manifestacoes: ShelterAlertPledge[];
}

export interface TriageEntry {
  id: string;
  shelterId: string;
  shelterName: string;
  categoria: SupplyCategory;
  item: string;
  subtipo: string;
  quantidade: number;
  unidade: string;
  origem: "camera_ia" | "manual";
  horario: string;
}

export const CATEGORY_META: Record<
  SupplyCategory,
  { label: string; unidadePadrao: string; icone: string; cor: string }
> = {
  roupas: {
    label: "Roupas e Agasalhos",
    unidadePadrao: "peças",
    icone: "Shirt",
    cor: "indigo",
  },
  agua: {
    label: "Água Potável",
    unidadePadrao: "litros",
    icone: "Droplets",
    cor: "sky",
  },
  alimentos: {
    label: "Alimentos e Cestas",
    unidadePadrao: "kg",
    icone: "Utensils",
    cor: "amber",
  },
  higiene: {
    label: "Higiene e Limpeza",
    unidadePadrao: "kits",
    icone: "Sparkles",
    cor: "teal",
  },
  colchoes_cama: {
    label: "Colchões e Cobertores",
    unidadePadrao: "unid.",
    icone: "BedDouble",
    cor: "purple",
  },
  racao_pet: {
    label: "Ração e Insumos Pet",
    unidadePadrao: "kg",
    icone: "PawPrint",
    cor: "orange",
  },
};

export function computeStatus(quantidade: number, meta: number): StockStatus {
  const ratio = meta > 0 ? quantidade / meta : 1;
  if (ratio < 0.45) return "critico";
  if (ratio > 1.35) return "excedente";
  return "estavel";
}

export const INITIAL_SHELTERS: Shelter[] = [
  {
    id: "sesi-rs",
    nome: "Ginásio do Sesi-RS",
    bairro: "Rubem Berta (Zona Norte)",
    endereco: "Av. Assis Brasil, 8787",
    lat: -30.0008,
    lng: -51.1147,
    ocupacaoAtual: 180,
    capacidade: 180,
    tipo: "Abrigo Emergencial / PLACON",
    contato: "(51) 3347-8787",
    estoque: {
      roupas: {
        categoria: "roupas",
        quantidade: 85,
        meta: 260,
        unidade: "peças",
        status: "critico",
        detalhe: "Falta agasalho infantil e roupa de frio G",
      },
      agua: {
        categoria: "agua",
        quantidade: 90,
        meta: 540,
        unidade: "litros",
        status: "critico",
        detalhe: "Estoque para menos de 12 horas",
      },
      alimentos: {
        categoria: "alimentos",
        quantidade: 240,
        meta: 300,
        unidade: "kg",
        status: "estavel",
        detalhe: "Marmitas e não perecíveis em dia",
      },
      higiene: {
        categoria: "higiene",
        quantidade: 45,
        meta: 150,
        unidade: "kits",
        status: "critico",
        detalhe: "Faltam fraldas infantis, toalhas e sabonete",
      },
      colchoes_cama: {
        categoria: "colchoes_cama",
        quantidade: 60,
        meta: 180,
        unidade: "unid.",
        status: "critico",
        detalhe: "Déficit de 120 cobertores e roupas de cama",
      },
      racao_pet: {
        categoria: "racao_pet",
        quantidade: 55,
        meta: 70,
        unidade: "kg",
        status: "estavel",
        detalhe: "22 cães e 8 gatos acolhidos",
      },
    },
  },
  {
    id: "santa-doroteia",
    nome: "Ginásio Colégio Santa Dorotéia",
    bairro: "Passo d'Areia",
    endereco: "Rua Mal. Andrea, 275",
    lat: -30.0182,
    lng: -51.1614,
    ocupacaoAtual: 115,
    capacidade: 150,
    tipo: "Abrigo Comunitário Parceiro",
    contato: "(51) 3341-1900",
    estoque: {
      roupas: {
        categoria: "roupas",
        quantidade: 590,
        meta: 220,
        unidade: "peças",
        status: "excedente",
        detalhe: "+370 peças excedentes triadas (coleta suspensa)",
      },
      agua: {
        categoria: "agua",
        quantidade: 620,
        meta: 350,
        unidade: "litros",
        status: "excedente",
        detalhe: "+270L disponíveis para redistribuição",
      },
      alimentos: {
        categoria: "alimentos",
        quantidade: 380,
        meta: 220,
        unidade: "kg",
        status: "excedente",
        detalhe: "Depósito cheio de cestas básicas",
      },
      higiene: {
        categoria: "higiene",
        quantidade: 35,
        meta: 110,
        unidade: "kits",
        status: "critico",
        detalhe: "Faltam kits de limpeza pesada e cloro",
      },
      colchoes_cama: {
        categoria: "colchoes_cama",
        quantidade: 230,
        meta: 140,
        unidade: "unid.",
        status: "excedente",
        detalhe: "+90 cobertores e mantas prontos para envio",
      },
      racao_pet: {
        categoria: "racao_pet",
        quantidade: 48,
        meta: 50,
        unidade: "kg",
        status: "estavel",
        detalhe: "Estoque equilibrado",
      },
    },
  },
  {
    id: "demhab",
    nome: "Centro Logístico e Abrigo Demhab",
    bairro: "Santana",
    endereco: "Av. Princesa Isabel, 1115",
    lat: -30.0485,
    lng: -51.2089,
    ocupacaoAtual: 140,
    capacidade: 200,
    tipo: "Equipamento Público Municipal",
    contato: "(51) 3289-7200",
    estoque: {
      roupas: {
        categoria: "roupas",
        quantidade: 780,
        meta: 300,
        unidade: "peças",
        status: "excedente",
        detalhe: "Lotação máxima de vestuário (coleta suspensa)",
      },
      agua: {
        categoria: "agua",
        quantidade: 850,
        meta: 450,
        unidade: "litros",
        status: "excedente",
        detalhe: "Abastecido pela Defesa Civil",
      },
      alimentos: {
        categoria: "alimentos",
        quantidade: 290,
        meta: 280,
        unidade: "kg",
        status: "estavel",
        detalhe: "Fluxo regular",
      },
      higiene: {
        categoria: "higiene",
        quantidade: 210,
        meta: 140,
        unidade: "kits",
        status: "excedente",
        detalhe: "+70 kits disponíveis para outros abrigos",
      },
      colchoes_cama: {
        categoria: "colchoes_cama",
        quantidade: 65,
        meta: 170,
        unidade: "unid.",
        status: "critico",
        detalhe: "Alta demanda por colchões de solteiro",
      },
      racao_pet: {
        categoria: "racao_pet",
        quantidade: 18,
        meta: 85,
        unidade: "kg",
        status: "critico",
        detalhe: "Urgente: ração para cães de porte médio/grande",
      },
    },
  },
  {
    id: "clube-farrapos",
    nome: "Abrigo Clube Farrapos",
    bairro: "Higienópolis",
    endereco: "Rua Prof. Cristiano Fischer, 1331",
    lat: -30.0125,
    lng: -51.182,
    ocupacaoAtual: 128,
    capacidade: 160,
    tipo: "Abrigo Social / Clube Parceiro",
    contato: "(51) 3342-1044",
    estoque: {
      roupas: {
        categoria: "roupas",
        quantidade: 230,
        meta: 240,
        unidade: "peças",
        status: "estavel",
        detalhe: "Atendimento normal",
      },
      agua: {
        categoria: "agua",
        quantidade: 310,
        meta: 360,
        unidade: "litros",
        status: "estavel",
        detalhe: "Estoque regular",
      },
      alimentos: {
        categoria: "alimentos",
        quantidade: 70,
        meta: 240,
        unidade: "kg",
        status: "critico",
        detalhe: "Precisa de arroz, feijão, leite e óleo",
      },
      higiene: {
        categoria: "higiene",
        quantidade: 40,
        meta: 130,
        unidade: "kits",
        status: "critico",
        detalhe: "Faltam absorventes, escovas e pasta de dente",
      },
      colchoes_cama: {
        categoria: "colchoes_cama",
        quantidade: 225,
        meta: 140,
        unidade: "unid.",
        status: "excedente",
        detalhe: "+85 colchões e travesseiros extras",
      },
      racao_pet: {
        categoria: "racao_pet",
        quantidade: 115,
        meta: 65,
        unidade: "kg",
        status: "excedente",
        detalhe: "+50 kg de ração disponíveis para repasse",
      },
    },
  },
  {
    id: "dias-da-cruz",
    nome: "Albergue Municipal Dias da Cruz (SMAS)",
    bairro: "Azenha",
    endereco: "Av. Azenha, 366",
    lat: -30.0562,
    lng: -51.2154,
    ocupacaoAtual: 95,
    capacidade: 100,
    tipo: "Rede Permanente SMAS / Operação Inverno",
    contato: "(51) 3289-4955",
    estoque: {
      roupas: {
        categoria: "roupas",
        quantidade: 55,
        meta: 190,
        unidade: "peças",
        status: "critico",
        detalhe: "Falta agasalho masculino M/G e calçados fechados",
      },
      agua: {
        categoria: "agua",
        quantidade: 210,
        meta: 220,
        unidade: "litros",
        status: "estavel",
        detalhe: "Abastecimento DMAE regular",
      },
      alimentos: {
        categoria: "alimentos",
        quantidade: 165,
        meta: 180,
        unidade: "kg",
        status: "estavel",
        detalhe: "Integrado ao Restaurante Popular",
      },
      higiene: {
        categoria: "higiene",
        quantidade: 25,
        meta: 110,
        unidade: "kits",
        status: "critico",
        detalhe: "Urgente: kits de banho individual para pernoite",
      },
      colchoes_cama: {
        categoria: "colchoes_cama",
        quantidade: 95,
        meta: 110,
        unidade: "unid.",
        status: "estavel",
        detalhe: "Mantas higienizadas",
      },
      racao_pet: {
        categoria: "racao_pet",
        quantidade: 30,
        meta: 35,
        unidade: "kg",
        status: "estavel",
        detalhe: "Baixa demanda atual",
      },
    },
  },
];

const INITIAL_ALERTS: ShelterAlert[] = [
  {
    id: "alert-1",
    shelterId: "sesi-rs",
    shelterName: "Ginásio do Sesi-RS",
    bairro: "Rubem Berta",
    categoria: "agua",
    itemEspecifico: "Galões e fardos de água mineral potável",
    quantidadeNecessaria: 250,
    unidade: "litros",
    urgencia: "alta",
    status: "aberto",
    criadoEm: "Há 18 min",
    manifestacoes: [],
  },
  {
    id: "alert-2",
    shelterId: "sesi-rs",
    shelterName: "Ginásio do Sesi-RS",
    bairro: "Rubem Berta",
    categoria: "colchoes_cama",
    itemEspecifico: "Cobertores térmicos, mantas e toalhas de banho (30 crianças no local)",
    quantidadeNecessaria: 90,
    unidade: "unid.",
    urgencia: "alta",
    status: "aberto",
    criadoEm: "Há 32 min",
    manifestacoes: [],
  },
  {
    id: "alert-3",
    shelterId: "dias-da-cruz",
    shelterName: "Albergue Municipal Dias da Cruz (SMAS)",
    bairro: "Azenha",
    categoria: "roupas",
    itemEspecifico: "Casacos de frio adulto M/G e meias para pernoite",
    quantidadeNecessaria: 120,
    unidade: "peças",
    urgencia: "alta",
    status: "aberto",
    criadoEm: "Há 45 min",
    manifestacoes: [
      {
        id: "pledge-1",
        fromShelterId: "demhab",
        fromShelterName: "Centro Logístico e Abrigo Demhab",
        quantidade: 60,
        mensagem: "Separamos 60 agasalhos M/G triados para envio via Transporte Solidário.",
        criadoEm: "Há 12 min",
      },
    ],
  },
  {
    id: "alert-4",
    shelterId: "clube-farrapos",
    shelterName: "Abrigo Clube Farrapos",
    bairro: "Higienópolis",
    categoria: "alimentos",
    itemEspecifico: "Cestas básicas, leite UHT e arroz para cozinha comunitária",
    quantidadeNecessaria: 140,
    unidade: "kg",
    urgencia: "alta",
    status: "aberto",
    criadoEm: "Há 1h",
    manifestacoes: [],
  },
];

const INITIAL_TRIAGE_LOG: TriageEntry[] = [
  {
    id: "tr-1",
    shelterId: "santa-doroteia",
    shelterName: "Ginásio Colégio Santa Dorotéia",
    categoria: "roupas",
    item: "Lote de casacos de moletom adulto",
    subtipo: "Adulto / Inverno",
    quantidade: 15,
    unidade: "peças",
    origem: "camera_ia",
    horario: "17:10",
  },
  {
    id: "tr-2",
    shelterId: "demhab",
    shelterName: "Centro Logístico e Abrigo Demhab",
    categoria: "agua",
    item: "Fardos de água mineral 500ml",
    subtipo: "Potável lacrada",
    quantidade: 48,
    unidade: "litros",
    origem: "camera_ia",
    horario: "17:04",
  },
];

interface TriaContextType {
  shelters: Shelter[];
  activeShelterId: string;
  setActiveShelterId: (id: string) => void;
  alerts: ShelterAlert[];
  triageLog: TriageEntry[];
  recycledTextileKg: number;
  discardedPiecesCount: number;
  addDonation: (params: {
    shelterId: string;
    categoria: SupplyCategory;
    item: string;
    subtipo: string;
    quantidade: number;
    origem: "camera_ia" | "manual";
  }) => void;
  registerDiscardedTextile: (pecas: number, kgEstimado: number) => void;
  createAlert: (params: {
    shelterId: string;
    categoria: SupplyCategory;
    itemEspecifico: string;
    quantidadeNecessaria: number;
    urgencia: "alta" | "media";
  }) => void;
  pledgeSupportToAlert: (params: {
    alertId: string;
    fromShelterId: string;
    quantidade: number;
    mensagem: string;
  }) => void;
  executeTransferBetweenShelters: (params: {
    fromShelterId: string;
    toShelterId: string;
    categoria: SupplyCategory;
    quantidade: number;
  }) => void;
  resetDemoData: () => void;
}

const TriaContext = createContext<TriaContextType | undefined>(undefined);

const STORAGE_KEY = "tria_poa_state_v1";

export function TriaProvider({ children }: { children: React.ReactNode }) {
  const [shelters, setShelters] = useState<Shelter[]>(INITIAL_SHELTERS);
  const [activeShelterId, setActiveShelterId] = useState<string>("sesi-rs");
  const [alerts, setAlerts] = useState<ShelterAlert[]>(INITIAL_ALERTS);
  const [triageLog, setTriageLog] = useState<TriageEntry[]>(INITIAL_TRIAGE_LOG);
  const [recycledTextileKg, setRecycledTextileKg] = useState<number>(420);
  const [discardedPiecesCount, setDiscardedPiecesCount] = useState<number>(1180);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.shelters) setShelters(parsed.shelters);
        if (parsed.alerts) setAlerts(parsed.alerts);
        if (parsed.triageLog) setTriageLog(parsed.triageLog);
        if (typeof parsed.recycledTextileKg === "number")
          setRecycledTextileKg(parsed.recycledTextileKg);
        if (typeof parsed.discardedPiecesCount === "number")
          setDiscardedPiecesCount(parsed.discardedPiecesCount);
      }
    } catch {
      // ignore storage errors
    }
    setHydrated(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.shelters) setShelters(parsed.shelters);
          if (parsed.alerts) setAlerts(parsed.alerts);
          if (parsed.triageLog) setTriageLog(parsed.triageLog);
          if (typeof parsed.recycledTextileKg === "number")
            setRecycledTextileKg(parsed.recycledTextileKg);
          if (typeof parsed.discardedPiecesCount === "number")
            setDiscardedPiecesCount(parsed.discardedPiecesCount);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          shelters,
          alerts,
          triageLog,
          recycledTextileKg,
          discardedPiecesCount,
        })
      );
    } catch {
      // ignore
    }
  }, [
    shelters,
    alerts,
    triageLog,
    recycledTextileKg,
    discardedPiecesCount,
    hydrated,
  ]);

  const addDonation: TriaContextType["addDonation"] = ({
    shelterId,
    categoria,
    item,
    subtipo,
    quantidade,
    origem,
  }) => {
    const target = shelters.find((s) => s.id === shelterId);
    if (!target) return;

    const unidade = CATEGORY_META[categoria].unidadePadrao;
    const now = new Date();
    const horario = now.toTimeString().slice(0, 5);

    setShelters((prev) =>
      prev.map((s) => {
        if (s.id !== shelterId) return s;
        const currentCat = s.estoque[categoria];
        const novaQtd = currentCat.quantidade + quantidade;
        const novoStatus = computeStatus(novaQtd, currentCat.meta);
        return {
          ...s,
          estoque: {
            ...s.estoque,
            [categoria]: {
              ...currentCat,
              quantidade: novaQtd,
              status: novoStatus,
              detalhe: `Atualizado às ${horario} (+${quantidade} ${unidade}: ${item})`,
            },
          },
        };
      })
    );

    setTriageLog((prev) => [
      {
        id: `tr-${Date.now()}`,
        shelterId,
        shelterName: target.nome,
        categoria,
        item,
        subtipo,
        quantidade,
        unidade,
        origem,
        horario,
      },
      ...prev.slice(0, 24),
    ]);
  };

  const registerDiscardedTextile = (pecas: number, kgEstimado: number) => {
    setDiscardedPiecesCount((prev) => prev + pecas);
    setRecycledTextileKg((prev) => Number((prev + kgEstimado).toFixed(1)));
  };

  const createAlert: TriaContextType["createAlert"] = ({
    shelterId,
    categoria,
    itemEspecifico,
    quantidadeNecessaria,
    urgencia,
  }) => {
    const shelter = shelters.find((s) => s.id === shelterId);
    if (!shelter) return;

    const newAlert: ShelterAlert = {
      id: `alert-${Date.now()}`,
      shelterId,
      shelterName: shelter.nome,
      bairro: shelter.bairro,
      categoria,
      itemEspecifico,
      quantidadeNecessaria,
      unidade: CATEGORY_META[categoria].unidadePadrao,
      urgencia,
      status: "aberto",
      criadoEm: "Agora mesmo",
      manifestacoes: [],
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const pledgeSupportToAlert: TriaContextType["pledgeSupportToAlert"] = ({
    alertId,
    fromShelterId,
    quantidade,
    mensagem,
  }) => {
    const donor = shelters.find((s) => s.id === fromShelterId);
    const alertObj = alerts.find((a) => a.id === alertId);
    if (!donor || !alertObj) return;

    executeTransferBetweenShelters({
      fromShelterId,
      toShelterId: alertObj.shelterId,
      categoria: alertObj.categoria,
      quantidade,
    });

    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id !== alertId) return a;
        const novasManif = [
          ...a.manifestacoes,
          {
            id: `pledge-${Date.now()}`,
            fromShelterId,
            fromShelterName: donor.nome,
            quantidade,
            mensagem,
            criadoEm: "Agora mesmo",
          },
        ];
        const totalSuprido = novasManif.reduce(
          (acc, m) => acc + m.quantidade,
          0
        );
        return {
          ...a,
          manifestacoes: novasManif,
          status:
            totalSuprido >= a.quantidadeNecessaria ? "atendido" : "aberto",
        };
      })
    );
  };

  const executeTransferBetweenShelters: TriaContextType["executeTransferBetweenShelters"] =
    ({ fromShelterId, toShelterId, categoria, quantidade }) => {
      const now = new Date().toTimeString().slice(0, 5);
      const fromName =
        shelters.find((s) => s.id === fromShelterId)?.nome || "Abrigo parceiro";
      const toName =
        shelters.find((s) => s.id === toShelterId)?.nome || "Abrigo receptor";

      setShelters((prev) =>
        prev.map((s) => {
          if (s.id === fromShelterId) {
            const cat = s.estoque[categoria];
            const novaQtd = Math.max(0, cat.quantidade - quantidade);
            return {
              ...s,
              estoque: {
                ...s.estoque,
                [categoria]: {
                  ...cat,
                  quantidade: novaQtd,
                  status: computeStatus(novaQtd, cat.meta),
                  detalhe: `Enviou ${quantidade} ${cat.unidade} para ${toName} às ${now}`,
                },
              },
            };
          }
          if (s.id === toShelterId) {
            const cat = s.estoque[categoria];
            const novaQtd = cat.quantidade + quantidade;
            return {
              ...s,
              estoque: {
                ...s.estoque,
                [categoria]: {
                  ...cat,
                  quantidade: novaQtd,
                  status: computeStatus(novaQtd, cat.meta),
                  detalhe: `Recebeu ${quantidade} ${cat.unidade} de ${fromName} às ${now}`,
                },
              },
            };
          }
          return s;
        })
      );
    };

  const resetDemoData = () => {
    setShelters(INITIAL_SHELTERS);
    setAlerts(INITIAL_ALERTS);
    setTriageLog(INITIAL_TRIAGE_LOG);
    setRecycledTextileKg(420);
    setDiscardedPiecesCount(1180);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <TriaContext.Provider
      value={{
        shelters,
        activeShelterId,
        setActiveShelterId,
        alerts,
        triageLog,
        recycledTextileKg,
        discardedPiecesCount,
        addDonation,
        registerDiscardedTextile,
        createAlert,
        pledgeSupportToAlert,
        executeTransferBetweenShelters,
        resetDemoData,
      }}
    >
      {children}
    </TriaContext.Provider>
  );
}

export function useTria() {
  const ctx = useContext(TriaContext);
  if (!ctx) throw new Error("useTria must be used within TriaProvider");
  return ctx;
}
