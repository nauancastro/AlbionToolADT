# Albion Profit Radar

SPA em Angular para cálculo de lucro de **Refino**, **Crafting** e **Arbitragem (Flipping)**
no Albion Online. Sem backend: tudo roda no navegador, com configurações persistidas em
`LocalStorage` e cotações consumidas diretamente da
[Albion Online Data Project API](https://www.albion-online-data.com/api/).

## Módulos

- **Painel do Usuário** (`/painel`) — servidor, Spec por linha de recurso, foco diário,
  bônus de ilha/servidor, taxas de loja por cidade, status Premium.
- **Smart Route Finder** (`/rotas`) — escolha cidade de compra do bruto e cidade de
  refino/venda; a tabela ranqueia T4-T8 × encantamentos .0-.4 por margem de lucro,
  diferenciando Sell Order (lucro demorado) de Buy Order (lucro imediato).
- **Carrinho de Craft/Refino** (`/carrinho`) — seleção múltipla de refinos e
  equipamentos para calcular uma viagem completa: peso total (com sugestão de
  montaria), economia de Diários, e comparativo Foco vs. Sem Foco / Venda Local vs.
  Black Market.

## Arquitetura

```
src/app/
  core/
    models/     # enums e interfaces de domínio (itens, mercado, receitas, settings)
    data/       # catálogo estático (itens gerados, receitas, cidades)
    services/   # CacheService, MarketDataService, UserSettingsService,
                # RefiningCalculatorService, BulkCalculatorService, CartService
  shared/       # pipes (prata, peso) e componentes reutilizáveis
  features/
    routes/     # Smart Route Finder
    crafting/   # Carrinho de Craft/Refino bulk
    user-panel/ # Painel do Usuário
  layout/       # nav bar / shell
```

### Cache e batching

`CacheService` grava cotações no `LocalStorage` com TTL de ~20 minutos. Antes de
qualquer chamada à API, `MarketDataService` verifica o cache por item; apenas os
itens ausentes/expirados são buscados, agrupados em lotes de até 40 IDs por
requisição para minimizar chamadas de rede.

### Matemática de jogo (aproximada)

As fórmulas de RRR (Resource Return Rate), custo de Foco e economia de Diários em
`core/services/rrr.util.ts` e `core/services/journal.util.ts` são aproximações
documentadas em código — os valores exatos variam entre patches do jogo. Ajuste as
constantes conforme necessário.

## Desenvolvimento

```bash
npm install
npm start          # ng serve — http://localhost:4200
npm run build       # build de produção em dist/albion-profit-tool/browser
```

## Docker

```bash
docker compose up --build   # sobe em http://localhost:8080
```

O `Dockerfile` usa build multi-stage (Node 22 → build Angular; Nginx alpine →
serve estático) com `nginx.conf` configurado para fallback de SPA e cache de
assets com hash.
