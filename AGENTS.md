# TrIA - Guia do Agente no Repositório

Para qualquer tarefa de planejamento, criação de código, interface, rotas de IA ou preparação de pitch neste repositório, **leia e siga a skill do projeto** em [`.agents/skills/tria-context/SKILL.md`](.agents/skills/tria-context/SKILL.md).

## Regras Rápidas do Projeto
- **Produto:** Plataforma **TrIA** (*"Quem abriga também precisa de abrigo"*), conectando **3 frentes** em um único Web App com seletor rápido de perfil no topo:
  1. **Cidadão Comum:** Mapa interativo de Porto Alegre (`Leaflet`) + filtro *"O que você quer doar?"* mostrando onde o item é urgente e onde está suspenso por excesso.
  2. **Voluntário:** Cadastro de doações para todas as categorias (*Roupas/Agasalhos, Água, Alimentos, Higiene/Limpeza, Colchões/Cama, Ração Pet*) via **Pipeline em 3 etapas (Câmera ao vivo `<video>` → Visão computacional leve no `<canvas>` que detecta o item parado por ~0,6s e captura 1 frame JPEG → API Gemini Flash classifica categoria/subtipo/quantidade)**, além de opção de captura/upload manual, lançamento manual rápido e registro de lote descartado para **Reciclagem Têxtil**.
  3. **Organização do Abrigo:** Dashboard de estoque local, **Mural de Alertas** entre abrigos (pedidos e manifestações de apoio) e **Análise & Matchmaking com IA** sugerindo parcerias/transferências diretas entre abrigos com excedente e abrigos com falta.
- **Sustentabilidade:** Modelo **Non-Profit / Filantrópico** sustentado por **economia circular têxtil** (reciclagem de roupas impróprias descartadas na triagem para cobrir domínio, nuvem e tokens de IA) + parceria operacional com órgãos públicos (SMAS / Defesa Civil / PLACON 2025) para transporte físico.
- **Stack:** Next.js (App Router + TypeScript + Tailwind CSS) + estado reativo persistido em `localStorage` (com sincronização entre abas) + rotas `/api/*` para Gemini Flash com fallback resiliente para a apresentação da banca.
