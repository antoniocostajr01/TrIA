# TrIA · Interface web

Base responsiva do TrIA para o Hackathon CEUE, com Next.js, React, TypeScript, Tailwind CSS e Leaflet. A identidade segue o Figma TrIA: violeta `#4B2FD6`, fundo `#F6F4EE`, títulos em DM Serif Display e textos em Atkinson Hyperlegible Next. As fontes são distribuídas localmente via Fontsource, sem requisições ao Google Fonts em tempo de execução.

## Executar

Requer Node.js 20.9+ e npm.

```sh
cd app-web
npm ci
npm run dev
```

Abra http://localhost:3000. Para abrir no celular na mesma rede, use o IP local do computador na porta 3000. A aplicação escuta em `0.0.0.0`; a disponibilidade depende da rede e do firewall.

```sh
npm run typecheck
npm run build
npm start
```

## O que funciona

- **Cidadão:** mapa de Porto Alegre, seleção de abrigo, busca por nome/bairro e seis filtros de doação. A categoria determina o status exibido: urgente, recebendo ou coleta suspensa.
- **Voluntário:** seleção de abrigo, registro manual com quantidade inteira de 1 a 10.000 e unidade por categoria, histórico de entradas, foto de referência local (JPG/PNG/WebP, até 5 MB) e contador de peças para reciclagem da rede. A foto não é analisada nem enviada.
- **Gestor:** estoque derivado das entradas locais, mural com publicação de pedidos e manifestação demonstrativa de interesse. Publica pedidos e registra remessas simuladas, atualizando os estoques de origem e destino. Não envia mensagens externas nem executa transporte físico.
- **Geral:** navegação por perfil no topo em desktop e na barra inferior em mobile, ajuda e restauração da demo.

## Estrutura e funcionamento

- `src/app/`: página, layout, metadados e estilos responsivos.
- `src/components/tria-app.tsx`: interface e estado compartilhado entre os perfis. Mantém entradas, alertas e reciclagem no navegador com a chave `tria-ui-demo-v1`. A leitura ocorre após a montagem para evitar divergência de hidratação; a escrita começa depois dessa leitura. Se o armazenamento estiver indisponível, a sessão continua em memória.
- `src/components/shelter-map.tsx`: Leaflet carregado apenas no cliente, pinos com texto de status nos popups e foco ao selecionar um abrigo. OpenStreetMap fornece os tiles, exigindo internet.
- `src/lib/demo-data.ts`: cinco abrigos e estoques fictícios baseados no cenário da documentação. `targets` define referências demonstrativas por categoria: estoque abaixo de 40% é crítico, acima de 150% é excedente; os demais valores são estáveis. Quantidades têm unidade fixa por categoria para impedir somas incompatíveis nesta base.

O estoque é calculado a partir do cenário inicial mais as entradas. Trocar de perfil mantém o mesmo estado; recarregar recupera os registros locais. A busca restringe lista e mapa. O status geral considera qualquer categoria crítica; filtros mostram especificamente a categoria selecionada.

## Limites desta etapa

Sem backend, login, Gemini, câmera ao vivo, reconhecimento automático, sincronização entre dispositivos/abas ou logística física de transferências. Não requer chave de API. Não há solicitações de permissões de câmera. Dados e pedidos são simulados; nomes/coordenadas vêm da skill do projeto e não representam locais com atendimento confirmado. Não utilizar para orientar doações reais. As estimativas de referência não são parâmetros operacionais validados.

`Restaurar demo` limpa os registros locais e recupera o cenário inicial. A foto não é persistida. Dados de abrigos externos são apenas demonstrativos e nenhuma notificação é enviada ao manifestar interesse.

## Referência visual do Figma

Arquivo: https://www.figma.com/design/jY1KlsflqTTO7Wj28tJqhh/TrIA

- Design system: página `26:81`, cores `26:86`.
- Gestor: `7:40`; navegação lateral, métricas e painéis com gráficos adaptados ao estoque das seis categorias.
- Voluntário: `5:178`; categorias em cartões de toque, contador de quantidade e botão principal de 64 px. A interface mantém as seis categorias do produto em vez do recorte apenas têxtil da referência.
- Doador: `9:188`; hierarquia das necessidades e bloco “Por favor, não envie” ao selecionar um abrigo. O mapa existente permanece disponível.
- Logo B2 · Três pilhas (glass): ícone claro `31:223`, exportado diretamente para `public/brand/tria-glass.png` e usado na marca, ajuda, rodapé e favicon. O wordmark em minúsculas segue `31:237`. O PNG é mantido como exportado; os SVGs em `public/figma/` são os ícones originais das telas utilizadas, sem redesenho.

`src/app/figma-theme.css` concentra os tokens e a adaptação responsiva sobre os estilos da base. `src/components/brand.tsx` centraliza a marca; `manager-overview.tsx` calcula as métricas e a cobertura por categoria a partir do mesmo estado local da interface. Não soma unidades diferentes; as barras mostram a razão entre quantidade e referência de cada categoria, com teto visual de 200%. O lote de reciclagem é da rede inteira, identificado no cartão.

A referência contém também autenticação, lotes de roupas e integrações com banco/IA. Esses fluxos não foram implementados nesta atualização visual. Gráficos e métricas usam o cenário local existente, sem indicadores fictícios de uma operação ao vivo.

## Fluxos completos para demonstração mobile

O perfil **Hub de triagem** registra entradas, mantém histórico, separa peças para reciclagem e envia remessas simuladas a locais em falta. O **Abrigo** consulta estoque, publica pedidos e recebe remessas simuladas; o **Doador** filtra o mapa, identifica suspensão por excesso e consulta orientações do abrigo selecionado.

`TransferPanel` cruza excedentes e faltas por categoria com regras determinísticas, sem afirmar uso de IA. Uma remessa reduz a quantidade na origem e acrescenta a mesma quantidade ao destino. O histórico é persistido junto às entradas, alertas e reciclagem. As sugestões desaparecem quando o déficit é atendido. A movimentação é apenas do cenário local.

Para ensaios isolados, `/?demo=videos&profile=citizen`, `/?demo=videos&profile=manager` e `/?demo=videos&profile=volunteer` usam a chave `tria-video-demo-v1`, separada do armazenamento normal. O hub começa selecionado no Demhab; as demais perspectivas começam no Sesi. Links rápidos navegam entre as seções de cada perfil. A restauração da demo também limpa seu histórico de remessas.
