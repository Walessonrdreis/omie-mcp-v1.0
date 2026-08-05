# Labarr — API de domínio + integração Omie (evolução do SPA)

Status: aprovado (Seções 1–5 + 2.6). ADR de hospedagem em aberto — decisão em F0.

## Contexto

O SPA **Labarr** (gerenciador de produção de chocolate) hoje usa **Google Sheets
como API e quase-DB**: o Apps Script (GAS) é o backend, a planilha guarda todo o
estado operacional. Esta spec evoluí a arquitetura para a **API Omie** entrar
como fonte de dados, com o Sheets passando a ser apenas um **destino de dados
limpos** (abas organizadas para leitura UX), não mais um quase-DB.

Restrição de produção: **o backend GAS/Sheets atual não pode ser tocado** — a
produção continua funcionando. A evolução acontece por **rotas novas no SPA**
(MVP 2.0), convivendo com o MVP 1.0 em modo aditivo.

Referência de protocolo Omie: o repositório `omie-mcp` continua sendo **apenas
contexto** — as regras de protocolo são **copiadas** para o transporte Omie
(`integrations/omie/`) e os gateways dos módulos, nunca importadas.

## Decisões travadas (confirmadas)

| # | Decisão |
|---|---|
| 1 | **API nova, monólito separado do SPA** — repo novo com `apps/api` (estrutura modular, decisão 10); integração e domínio rodam no mesmo processo/deploy. Sem hop HTTP entre eles. |
| 2 | **API de domínio ≠ Sheets** — a camada de domínio (use-cases/domain dos módulos) é um código distinto e agnóstico de fonte. O Sheets fica só na ponta de export. |
| 3 | **Store = Postgres**. |
| 4 | **Hospedagem = ADR em aberto** (Render gerenciado vs VPS+Supabase), decidir em F0. |
| 5 | **omie-mcp = contexto/referência apenas** — protocolo copiado, não importado. |
| 6 | **Escopo** = catálogo + estoque + OPs (em fases), com camada de domínio e camada de integração obrigatoriamente presentes (módulos + gateways). |
| 7 | **Caminho de leitura MVP** = Omie direto; híbrido com espelho organizado fica para quando existir DB organizado (opção "C" no futuro). |
| 8 | **Separação do submit** — um submit → use-cases do módulo recebem TUDO → grava tudo no store → módulo `mapeamentos` extrai subconjunto obrigatório da Omie → gateway Omie faz POST → `codigoOmie` gravado de volta. Postgres e Omie **não** são uma transação única; falha é marcada para reprocessamento. Real na Fase 3. |
| 9 | **MVP 2.0 no SPA** — rotas novas consomem a nova API; rotas legadas continuam no GAS intactas. |
| 10 | **Estrutura da API em módulos** — `src/modules/<modulo>/{application,domain,infrastructure,presentation}` + `src/integrations/` + `src/shared/` (mesmo padrão do omie-mcp, a estrutura preferida para as APIs do usuário). |
| 11 | **Produção v2 = sub-projeto futuro** — a visão de seletor de produto **por setor** (filtra o catálogo geral da Omie pelas categorias do setor) e **estoque v2 por tipo de produto** fica registrada nesta spec, fora do escopo de F0–F3. O espelho `produtos` já nasce com categoria/setor para o v2 não exigir migração. |

## Arquitetura

```
SPA (Vercel — rotas legadas: GAS atual; rotas novas: nova API)
 │
 └──► apps/api (monólito, 1 deploy — Render ou VPS conforme ADR F0)
        ├── modules/         cada módulo de negócio com application/domain/
        │                    infrastructure/presentation (ver 2.1)
        ├── integrations/    transporte Omie compartilhado (omieClient)
        ├── shared/          utilitários transversais (concurrency, erros, envelope)
        ├── store/           Postgres (client + migrations)
        └── sheets-export/   job → abas de leitura UX (espelho PRODUTOS_OMIE, relatórios)

Omie API ─── gateways dos módulos ─── modules ─── store (Postgres) ─── sheets-export ───► Sheets (destino)
```

O monólito é **um serviço**: `application/use-cases` chama `infrastructure/gateways`
por interface no mesmo processo — não há chamada HTTP entre eles.

## Componentes

### 2.1 `apps/api/src/` — estrutura modular (padrão do omie-mcp)

```
src/
├── modules/
│   ├── catalogo/            application/  dto + use-cases
│   │                        domain/       interfaces
│   │                        infrastructure/ gateways (catalogo-omie-gateway.ts)
│   │                        presentation/ http (handlers por action)
│   ├── estoque/             idem (ListarProdutos + estoque/movestoque agregado)
│   ├── ops/                 idem (produção → Omie/OPs, submit separado — Fase 3)
│   ├── auth/                idem (sessão/token, login)
│   └── mapeamentos/         idem (nome ↔ codigo_omie)
├── integrations/
│   └── omie/omieClient.ts   transporte Omie compartilhado (throttle 300ms,
│                            retry "Aguarde N segundos", máx. 5 conc.)
├── shared/                  transversais: concurrency (mapWithConcurrency),
│                            erros, envelope, logging — testes colocados
├── store/                   Postgres: client + migrations
└── sheets-export/           job → abas de leitura UX

entry: server.ts (ou httpServer.ts) — Express, roteia action → handler do
módulo, valida sessão, responde envelope {success, data}/{success, error}.
```

Cada módulo segue a mesma anatomia do omie-mcp: `application/dto` +
`application/use-cases` (regras de negócio), `domain/interfaces` (contratos),
`infrastructure/gateways` (acesso à fonte — para a Omie, um gateway por módulo
tipo `produtos-omie-gateway.ts`), `presentation/http` (handler de cada action
do contrato). O transporte HTTP Omie é único e compartilhado em
`integrations/omie/omieClient.ts`; o que muda por módulo é o gateway. Utilitários
transversais (concorrência, erros, envelope) ficam em `shared/`.

O cliente Omie é **fino e específico para este app** — nada de "MCP para tudo".

### 2.2 Contrato preservado

A nova API implementa o **mesmo protocolo de actions** do GAS Web App:

- GET `?action=&sessionToken=&isTestMode=&limit=&offset=`
- POST JSON como `text/plain` com `{action, sessionToken, isTestMode,
  correlationId}`
- Envelope `{success: true, data}` / `{success: false, error}`

O SPA troca **apenas a base URL**. `apiFetch`, fila, timeouts, retries e dedupe
por `correlationId` ficam intactos.

### 2.3 Entidades Postgres iniciais

- `produtos` — espelho do catálogo Omie (projeção, não fonte). Já nasce com a
  dimensão **categoria/setor** (código de categoria Omie + setor Labarr) — base
  que o sub-projeto "Produção v2" reutiliza sem exigir migração.
- `mapeamento_nome_codigo` — ligação nome ↔ `codigo_omie` (necessária na Fase 3).
- `listas` — listas que hoje vivem na planilha (TipoCacau, TipoMovimento, etc.).
- `usuarios` / `sessoes` — auth MVP migrada do SPA.

Futuro: `movimentos`, `lotes`, `lotes_relacionamento`, `saldos_operacionais`.

### 2.4 Sheets = destino

A planilha deixa de ser quase-DB. Recebe apenas exports limpos: espelho
`PRODUTOS_OMIE`, saldos por produto/setor/lote, relatórios — via `sheets-export`
(endpoint protegido e/ou cron). As abas legadas que as rotas antigas ainda usam
continuam servidas pelo GAS até o módulo ser desligado.

### 2.5 GAS

Estrangler fig: módulos são portados um a um. O GAS só é desligado por módulo
quando a rota nova correspondente estiver estável.

### 2.6 MVP 2.0 no SPA (produção intacta)

- Nenhuma tela atual é modificada nem redeployada.
- O SPA ganha **rotas novas** (ex.: `/estoque-omie`, `/catalogo-omie`, e no
  futuro `/producao-omie`) que consomem a nova API.
- `api-client.ts` ganha um **resolvedor de base URL por feature**: rota legada →
  URL do GAS; rota nova → URL da nova API. O mecanismo de rede não muda.
- Zero risco à produção: GAS/Sheets atual não é tocado. MVP 2.0 convive com o
  1.0 em modo aditivo.
- Fases do SPA acopladas às fases do backend (F1 → rota de catálogo, F2 → rota
  de estoque, F3 → rota de produção com submit separado). A rota antiga fica de
  pé até a decisão de desligar o GAS para aquele módulo. O seletor por setor e o
  estoque v2 por tipo (sub-projeto "Produção v2") nascem em rotas novas, sem
  tocar nas atuais.

## Fluxo de dados

### Leitura

```
SPA → use-cases do módulo → gateway Omie   (catálogo + saldo comercial)
SPA → use-cases do módulo → store (Postgres) (estado operacional: ledger, lotes, saldos setoriais)
Sheets ⇏ fluxos                            (não participa da leitura — só recebe export)
```

- **Catálogo comercial:** use-cases do módulo `catalogo` → gateway
  `catalogo-omie-gateway.ts` (`geral/produtos`, Listar/Consultar). A resposta
  alimenta o espelho `produtos` no Postgres e o `mapeamento_nome_codigo`.
  O gateway expõe o filtro por família da Omie (`filtrar_apenas_familia`) —
  base que o v2 reutiliza para o seletor de produto por setor.
- **Saldo comercial:** módulo `estoque` agrega `estoque/movestoque` via gateway
  Omie. Regra conhecida: `quantidade_estoque` vem **sempre 0** nessa conta —
  nunca usar.
- **Operacional:** continua sendo estado do domínio (módulos), agora no
  Postgres. Inclui saldos que só existem no SPA (por setor/lote,
  sem-embalagem/embalado, perdas/reprocesso) — a Omie não tem isso.
- **Resolvedor por feature** decide a fonte. O "futuro C com DB organizado" é só
  trocar o resolvedor; os use-cases do domínio não mudam.

### Submit (Fase 3)

```
1 submit (todos os campos)
  │
  ▼
use-cases do módulo recebem TUDO → grava tudo no store (Postgres)
  │
  ▼
módulo mapeamentos extrai o subconjunto obrigatório da Omie
  │
  ▼
gateway Omie faz POST → Omie devolve código → codigo_omie gravado de volta no registro
```

- **Não é transação única:** Postgres e Omie são duas escritas independentes.
  Falha da Omie → registro marcado para reprocessar pelo padrão sync-incremental
  (hash-gate + LockService) que o SPA já usa, com `correlationId` como
  idempotência.
- A separação de submit é implementada na **Fase 3** (produção → Omie/OPs).
  Fases 1–2 mexem só na **leitura**.
- Catálogo/estoque têm fluxo mais simples: leitura da Omie → espelho, sem submit
  duplo.

## Erros e consistência

Regras do transporte/gateways Omie (copiadas do omie-mcp):

- **Throttle:** 300ms entre chamadas consecutivas na mesma instância.
- **Rate-limit:** a Omie responde `Aguarde N segundos` — o cliente extrai o N e
  espera antes de repetir. Não engolir a falha como "não encontrado" (bug já
  conhecido no omie-mcp).
- **Concorrência:** `mapWithConcurrency` com máx. 5 simultâneas; nunca
  `Promise.all` de duas chamadas do mesmo `call`, mesmo com params diferentes
  (a Omie rejeita "Já existe uma requisição desse método sendo executada").
- **Falhou vs. não existe:** distinguir pelos campos da resposta de erro.

Consistência entre fontes:

- Espelho `produtos` no Postgres é **projeção** do catálogo Omie, não fonte.
  Quem reconcilia é o job/rota "sync catálogo" (na F1).
- `codigo_omie` é a **chave de ligação** entre Postgres e Omie. Registro sem
  `codigo_omie` = pendente de integração.
- Leitura da Omie caindo → o SPA mantém o fallback atual (stale-while-revalidate
  + IndexedDB); o backend novo responde o mesmo envelope de erro da UI.

## Testes

As camadas de domínio e integração são testáveis sem rede:

- **`integrations/omie` + gateways:** testes de contrato com a Omie via mock
  HTTP (transport injetável no `OmieClient`). Cobre throttle, retry "aguarde N",
  máx. 5 conc., falhou-vs-não-encontrado.
- **`application`/`domain` dos módulos:** testes puros de regra (ledger, saldos,
  mapeamento nome↔código) sem depender de Omie nem Postgres.
- **`store`:** migrations testadas subindo num Postgres de teste (local/Docker),
  não no de produção.
- **`server`:** teste do roteador action→handler (mesma ferramenta do omie-mcp:
  vitest).
- **Regra mantida do SPA:** testes sempre colocados junto do arquivo que testam,
  não em diretório separado.

## Fases

- **F0 — Fundação:** repo, server, auth MVP, Postgres + migrations, contrato de
  actions, deploy, health. **Decide o ADR de hospedagem.**
- **F1 — Catálogo:** leitura do catálogo Omie → espelho `produtos` +
  `mapeamento_nome_codigo`; rota nova `/catalogo-omie` no SPA. O espelho grava
  categoria/setor desde o início (2.3).
- **F2 — Estoque:** leitura (ListarProdutos + `estoque/movestoque` agregado);
  rota nova `/estoque-omie`.
- **F3 — OPs:** produção → Omie/OPs com a separação de submit; rota nova
  `/producao-omie`.

## Fora de escopo

- Port dos módulos de produção (torra, refino, temperagem, descasque,
  embalagem, confeitaria) — **Produção v2**, sub-projeto futuro com o próprio
  ciclo (brainstorm → spec → plano). Nesta spec, só o caminho de leitura de
  catálogo/estoque e o submit de OPs.
- Visão do v2 registrada para o próximo brainstorm: na Omie existe **um catálogo
  geral** — o seletor de produto de cada setor filtra esse catálogo pelas
  **categorias Omie** do setor (por baixo é o geral da Omie; o usuário vê só o
  que corresponde ao setor dele), e o **estoque v2** lista **por tipo de
  produto** (cada tela de estoque mostra o correspondente). O espelho `produtos`
  já carrega categoria/setor (2.3) para isso não exigir migração.
- Migração do histórico operacional das abas para o Postgres.
- Segurança servidor/CORS robusta — "vou montar com calma" (não implementar
  agora; `app_key`/`app_secret` **nunca** vão para o browser, vivem em env do
  servidor).
- Deploy remoto do omie-mcp.

## ADR em aberto — Hospedagem (decidir em F0)

**Status: proposed.** A spec não bloqueia nisso — F0 precisa de placeholder para
as duas opções.

| Opção | Prós | Contras |
|---|---|---|
| **A. Render (gerenciado)** | Postgres + deploy no mesmo painel; zero operação; banco com backup automático | Custo mensal recorrente |
| **B. VPS própria + Supabase** | Sem custo adicional (VPS e Supabase já existem na infra do usuário — "só configurar"); Supabase oferece Postgres + **Auth (JWT/RLS)** que pode resolver a "segurança com calma" em configuração, não código | Supabase desencoraja self-hosting em produção (dor de versão); operação manual do backup é sua responsabilidade — **backup automatizado do Postgres é não-negociável** nesta opção |

Se B: a decisão de store = Postgres sobrevive (re-hospedado no Supabase). Se A: a
arquitetura é idêntica, muda só onde o banco mora. O monólito, o contrato de
actions e as fases não mudam entre A e B.
