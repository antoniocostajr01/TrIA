---
name: tria-context
description: >-
  Complete product, domain, architecture, and implementation guide for the TrIA
  platform (Hackathon CEUE 2026/2 - Tecnopuc). Use this skill whenever planning,
  scaffolding, coding, debugging, or writing pitch/documentation for TrIA,
  including its 3 fronts (Citizen Map, Volunteer AI Triage, and Shelter
  Dashboard & AI Matchmaking), circular economy sustainability model, or Porto
  Alegre shelter data.
---

# TrIA: Contexto do Projeto e Guia de Implementação

> **Tagline / Conceito:** *"Do seu abrigo, para o abrigo certo"* / *"Organizando o abrigo de quem precisa de abrigo."*
> **Equipe TrIA:** Antônio Costa, Fernando Sulzbach, Leonel Ferraz (Líder), Rafael Toneto.

---

## 1. Visão Geral e Problema Real (Porto Alegre 2024 a 2026)

Na enchente de maio de 2024 em Porto Alegre (mais de 150 abrigos simultâneos; 124 operando sem gestão ou abastecimento centralizado segundo a *Matinal*), o gargalo principal não foi falta de solidariedade, mas **descompasso logístico e sobrecarga de triagem**:
- **70% de roupas nos Correios:** das 11 mil toneladas recebidas pelos Correios até 15/05/2024, cerca de 7,7 mil toneladas eram vestuário (apenas 3 mil toneladas entregues até aquela data), levando à suspensão da coleta de roupas em 16/05.
- **Abundância localizada vs. escassez crítica:** abrigos com alta visibilidade (ex.: *Colégio Santa Dorotéia*) não tinham falta de itens, enquanto o *Ginásio do Sesi-RS* (180 pessoas, ~30 crianças) ficou sem água e pediu banheiros químicos, cobertores e toalhas pela imprensa.
- **Aprendizado de campo (entrevista com voluntário real de triagem, 21/11/2026):**
  - Separar peça boa de peça ruim (rasgada, suja, com mau cheiro) já é um processo rápido e mecânico para o humano.
  - **Excesso de etapas burocráticas na triagem atrapalha e vira bagunça.**
  - O papel da tecnologia na ponta deve ser **eliminar digitação ao contabilizar o que entra no estoque** e **orientar o doador na origem** para evitar que o abrigo receba o que já está sobrando.
- **Contexto institucional atual (2025 e 2026):** a rede permanente hoje é coordenada pela **SMAS** (após extinção gradual da FASC, PLCE 001/2025), com forte demanda sazonal (Operação Inverno 2026 superou 44 mil acolhimentos) e resposta a emergências regida pelo **PLACON 2025**.

---

## 2. Arquitetura do Produto: As 3 Frentes do MVP

O sistema é um **Web App único** com **seletor rápido de perfil no topo** (`Cidadão / Mapa`, `Voluntário / Triagem`, `Gestor do Abrigo / Dashboard`), sem login obrigatório na demo para fluidez máxima na banca.

### Frente 1: Cidadão Comum (Mapa Interativo de Abrigos)
- **Mapa interativo de Porto Alegre** (`Leaflet` / `OpenStreetMap`, zero custo de chave).
- **Pinos coloridos por status do abrigo:**
  - Vermelho (`Crítico / Urgente`): falta aguda de itens essenciais.
  - Amarelo (`Atenção`): demandas pontuais.
  - Verde (`Estável / Coleta Suspensa para excedentes`): abrigo abastecido.
- **Filtro inteligente "O que você quer doar?":**
  - O cidadão escolhe uma categoria (*Roupas/Agasalhos*, *Água*, *Alimentos*, *Higiene/Limpeza*, *Colchões/Cama*, *Ração Pet*).
  - O mapa destaca onde aquele item é **Urgente** e sinaliza claramente onde o recebimento daquele item está **Suspenso por excesso**, direcionando a doação para o abrigo certo antes de sair de casa.

### Frente 2: Voluntário na Ponta (Triagem com Câmera/IA + Cadastro Manual)
- **Fricção zero no descarte:** itens visivelmente inutilizáveis (rasgados, mofados, sujos) são descartados de imediato pelo voluntário e podem ser somados em 1 toque ao **Lote de Reciclagem Têxtil** (economia circular), sem gastar chamada de API.
- **Pipeline de entrada por imagem em 3 etapas (Câmera + Visão Computacional local + API de IA):**
  1. **Visor de Câmera ao Vivo (`<video>` sem gravação de vídeo):** a câmera fica aberta no navegador apontada para a mesa de triagem (com opção também de botão manual **"Capturar Agora"** ou **Upload de Foto** para testes no notebook).
  2. **Gatilho por Visão Computacional Leve no Navegador (`<canvas>`):** um loop local compara a diferença de pixels entre frames (custo zero, sem rede) para detectar quando um item entrou na mesa e ficou **estável/parado por ~0,6s**. Nesse instante, captura automaticamente **1 único frame JPEG leve (~80 KB)**.
  3. **Classificação via API de IA Multimodal (Gemini 2.5 Flash em `/api/triage-vision`):** recebe o frame JPEG e preenche automaticamente o JSON estruturado:
     - `categoria`: `"roupas" | "agua" | "alimentos" | "higiene" | "colchoes_cama" | "racao_pet"`
     - `item`: descrição curta (ex.: `"Casaco infantil de inverno"`, `"Fardo de água mineral 500ml"`)
     - `subtipo`: detalhes úteis (ex.: `"Infantil / Frio"`, `"Não perecível"`)
     - `quantidadeEstimada`: número inteiro sugerido (ex.: `1` peça, `12` garrafas)
     - `unidade`: `"pecas" | "litros" | "unidades" | "kits" | "kg"`
- **Cadastro Manual Rápido:** botões rápidos de categoria + quantidade para lançamentos diretos sem câmera.
- Ao confirmar (ou em modo contínuo), o item **entra imediatamente no estoque do abrigo selecionado**, atualizando o Mapa do Cidadão e a Dashboard do Abrigo em tempo real.

### Frente 3: Organização do Abrigo (Dashboard, Alertas e Matchmaking IA)
- **Painel de Estoque Local:** visão das 6 categorias no abrigo atual, com barras de nível (*Crítico*, *Estável*, *Excedente*) e botão rápido para alterar status.
- **Mural de Alertas entre Abrigos:**
  - O gestor emite um alerta dizendo qual suprimento mais precisa (ex.: *"Precisamos urgente de 100L de água e 40 cobertores"*).
  - Outros abrigos cadastrados na plataforma visualizam o alerta e clicam em **"Manifestar apoio / Suprir demanda"** informando quanto conseguem enviar.
- **IA de Feedback de Estoque & Matchmaking entre Abrigos:**
  - Analisa o estado atual do estoque do abrigo (apontando riscos de desabastecimento ou acúmulo excessivo).
  - Cruza automaticamente o estoque de todos os abrigos de Porto Alegre e **indica parcerias diretas** entre abrigos com excedente e abrigos com déficit próximo (ex.: *"O Colégio Santa Dorotéia tem +220 peças de agasalho excedentes a 3,4 km do Ginásio Sesi-RS, que está em alerta crítico de roupa de frio"*).
  - Botão de **1 clique ("Solicitar / Enviar Remessa")** que registra a transferência entre os abrigos na hora durante a demo.

---

## 3. Modelo de Sustentabilidade (Non-Profit + Economia Circular + Apoio Público)

- **Natureza Non-Profit / Filantrópica:** plataforma gratuita para abrigos, OSCs, voluntários e cidadãos.
- **Economia Circular Têxtil (receita para autossustento técnico):**
  - Em 2024, toneladas de roupas impróprias para uso viraram passivo nos depósitos.
  - O TrIA contabiliza o volume de têxteis descartados na triagem e direciona esses lotes para **reciclagem têxtil / desfibramento / produção de estopa e retalhos industriais**.
  - A margem mínima gerada por essa destinação cobre os custos enxutos de manutenção da plataforma:
    - Domínio `.com.br`: ~R$ 40/ano.
    - Hospedagem Web/Serverless: R$ 0 no tier básico (escalonamento sob demanda).
    - Modelo de IA (Gemini Flash): custo *pay-as-you-go* inferior a US$ 0,10 por 1.000 fotos analisadas.
- **Parceria com Órgãos Públicos (SMAS / Defesa Civil / PLACON 2025):**
  - O poder público entra com o suporte logístico de distribuição física entre os abrigos (caminhões da Defesa Civil / Transporte Solidário) e adoção institucional nos protocolos do PLACON e na rotina sazonal (Operação Inverno / Campanha do Agasalho).

---

## 4. Stack Técnica e Estrutura no Repositório

- **Framework:** Next.js (App Router) + React + TypeScript + Tailwind CSS (`lucide-react` para ícones).
- **Mapa:** `leaflet` / `react-leaflet` (renderizado client-side com `dynamic(..., { ssr: false })`).
- **IA (Server-Side API Routes no Next.js):**
  - `app/api/triage-vision/route.ts`: recebe imagem (base64) e retorna JSON estruturado da doação via Gemini Flash (`@google/genai`), com fallback inteligente caso a chave não esteja configurada no ambiente local.
  - `app/api/shelter-match/route.ts`: recebe o snapshot dos estoques e alertas de todos os abrigos e retorna diagnóstico do estoque local + lista de sugestões de parceria/transferência entre abrigos via Gemini Flash (também com fallback determinístico instantâneo para nunca falhar no palco).
- **Estado Compartilhado (`context/TriaContext.tsx` + `localStorage`):**
  - Mantém abrigos, estoques, alertas entre abrigos, histórico de triagem e contador de reciclagem têxtil sincronizados entre as 3 frentes instantaneamente (e usa `BroadcastChannel` / `storage` event para sincronizar até entre duas abas abertas no mesmo navegador!).

---

## 5. Dados Base de Porto Alegre (Seed Realista para Demo)

Sempre inicializar o estado com abrigos reais e coordenadas de Porto Alegre:
1. **Ginásio do Sesi-RS (Zona Norte - Rubem Berta)** (`[-30.0008, -51.1147]`): lotação alta (180/180), **Crítico** em *Água*, *Colchões/Cama* e *Roupas de Frio*, *Estável* em *Alimentos*.
2. **Colégio Santa Dorotéia (Passo d'Areia)** (`[-30.0182, -51.1614]`): ocupação moderada (110/150), **Excedente (Coleta Suspensa)** em *Roupas/Agasalhos* (+320 peças) e *Alimentos*, *Crítico* em *Higiene/Limpeza*.
3. **Centro de Triagem e Abrigo Demhab (Santana)** (`[-30.0485, -51.2089]`): **Excedente** em *Roupas/Agasalhos* e *Água*, *Crítico* em *Ração Pet* e *Colchões/Cama*.
4. **Clube Farrapos (Higienópolis)** (`[-30.0125, -51.1820]`): **Crítico** em *Alimentos* e *Higiene/Limpeza*, *Excedente* em *Colchões/Cama*.
5. **Albergue Municipal Dias da Cruz - SMAS (Azenha)** (`[-30.0562, -51.2154]`): operação permanente/Inverno, **Crítico** em *Roupas/Agasalhos* e *Higiene/Limpeza*.
