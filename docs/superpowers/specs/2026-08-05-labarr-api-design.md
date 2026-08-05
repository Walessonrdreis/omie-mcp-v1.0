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
contexto** — as regras de protocolo são **copiadas** para o novo módulo
`integracao`, nunca importadas.

## Decisões travadas (confirmadas)

| # | Decisão |
|---|---|
| 1 | **API nova, monólito separado do SPA** — repo novo com `apps/api`, pastas `integracao` e `dominio` rodando no mesmo processo/deploy. Sem hop HTTP entre as duas. |
| 2 | **API de domínio ≠ Sheets** — a camada `dominio` é um código distinto e agnóstico de fonte. O Sheets fica só na ponta de export. |
| 3 | **Store = Postgres**. |
| 4 | **Hospedagem = ADR em aberto** (Render gerenciado vs VPS+Supabase), decidir em F0. |
| 5 | **omie-mcp = contexto/referência apenas** — protocolo copiado, não importado. |
| 6 | **Escopo** = catálogo + estoque + OPs (em fases), com `dominio` e `integracao` obrigatoriamente presentes. |
| 7 | **Caminho de leitura MVP** = Omie direto; híbrido com espelho organizado fica para quando existir DB organizado (opção "C" no futuro). |
| 8 | **Separação do submit** — um submit → `dominio` recebe TUDO → grava tudo no store → `mapeamento` extrai subconjunto obrigatório da Omie → `integracao` POST → `codigoOmie` gravado de volta. Postgres e Omie **não** são uma transação única; falha é marcada para reprocessamento. Real na Fase 3. |
| 9 | **MVP 2.0 no SPA** — rotas novas consomem a nova API; rotas legadas continuam no GAS intactas. |

## Arquitetura

```
SPA (Vercel — rotas legadas: GAS atual; rotas novas: nova API)
 │
 └──► apps/api (monólito, 1 deploy — Render ou VPS conforme ADR F0)
        ├── server/         roteia action → handler; valida sessão; envelope {success, data}
        ├── dominio/        regras de negócio: catalogo, saldos, auth, mapeamentos, ledger
        ├── integracao/     cliente Omie fino: client, catalogo, saldos, OPs, mapeamento
        ├── store/          Postgres (migrations)
        └── sheets-export/  job → abas de leitura UX (espelho PRODUTOS_OMIE, relatórios)

Omie API ─── integracao ─── dominio ─── Postgres ─── sheets-export ───► Sheets (destino)
```

O monólito é **um serviço**: `dominio` chama `integracao` por função/interface no
mesmo processo — não há chamada HTTP entre eles.

## Componentes

### 2.1 `apps/api/src/`

- **`server/`** — HTTP (Express — mesmo stack já usado e testado no omie-mcp),
  roteia `action → handler`,
  valida sessão, responde envelope `{success: true, data}` / `{success: false,
  error}`.
- **`dominio/`** — `catalogo.ts`, `saldos.ts`, `auth.ts`, `mapeamentos.ts` (+
  ledger/lotes quando chegarem). Regras de negócio puras, sem saber se a fonte é
  Omie, Postgres ou Sheets.
- **`integracao/`** — `omie-client.ts` (throttle 300ms, retry "Aguarde N
  segundos", máx. 5 conc.), `catalogo.ts`, `saldos.ts`, `ops.ts`,
  `mapeamento.ts`. Cliente fino e específico para este app — nada de "MCP para
  tudo".
- **`store/`** — migrations Postgres.
- **`sheets-export/`** — job que empurra projeções limpas para as abas.

### 2.2 Contrato preservado

A nova API implementa o **mesmo protocolo de actions** do GAS Web App:

- GET `?action=&sessionToken=&isTestMode=&limit=&offset=`
- POST JSON como `text/plain` com `{action, sessionToken, isTestMode,
  correlationId}`
- Envelope `{success: true, data}` / `{success: false, error}`

O SPA troca **apenas a base URL**. `apiFetch`, fila, timeouts, retries e dedupe
por `correlationId` ficam intactos.

### 2.3 Entidades Postgres iniciais

- `produtos` — espelho do catálogo Omie (projeção, não fonte).
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
  pé até a decisão de desligar o GAS para aquele módulo.

## Fluxo de dados

### Leitura

```
SPA → dominio → integracao → Omie    (catálogo comercial + saldo comercial)
SPA → dominio → Postgres             (estado operacional: ledger, lotes, saldos setoriais)
Sheets ⇏ fluxos                      (não participa da leitura — só recebe export)
```

- **Catálogo comercial:** `dominio/catalogo` → `integracao/catalogo`
  (`geral/produtos`, Listar/Consultar). A resposta alimenta o espelho `produtos`
  no Postgres e o `mapeamento_nome_codigo`.
- **Saldo comercial:** `integracao/saldos` agrega `estoque/movestoque`. Regra
  conhecida: `quantidade_estoque` vem **sempre 0** nessa conta — nunca usar.
- **Operacional:** continua sendo estado do `dominio`, agora no Postgres.
  Inclui saldos que só existem no SPA (por setor/lote, sem-embalagem/embalado,
  perdas/reprocesso) — a Omie não tem isso.
- **Resolvedor por feature** decide a fonte. O "futuro C com DB organizado" é só
  trocar o resolvedor; a API de domínio não muda.

### Submit (Fase 3)

```
1 submit (todos os campos)
  │
  ▼
dominio recebe TUDO → grava tudo no Postgres
  │
  ▼
mapeamento.ts extrai o subconjunto obrigatório da Omie
  │
  ▼
integracao POST → Omie devolve código → codigo_omie gravado de volta no registro
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

Regras do `integracao` (copiadas do omie-mcp):

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

`dominio` e `integracao` são testáveis sem rede:

- **`integracao`:** testes de contrato com a Omie via mock HTTP (transport
  injetável no `OmieClient`). Cobre throttle, retry "aguarde N", máx. 5 conc.,
  falhou-vs-não-encontrado.
- **`dominio`:** testes puros de regra (ledger, saldos, mapeamento nome↔código)
  sem depender de Omie nem Postgres.
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
  `mapeamento_nome_codigo`; rota nova `/catalogo-omie` no SPA.
- **F2 — Estoque:** leitura (ListarProdutos + `estoque/movestoque` agregado);
  rota nova `/estoque-omie`.
- **F3 — OPs:** produção → Omie/OPs com a separação de submit; rota nova
  `/producao-omie`.

## Fora de escopo

- Port dos módulos de produção (torra, refino, temperagem, descasque,
  embalagem, confeitaria) — só o caminho de leitura de catálogo/estoque e o
  submit de OPs.
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
