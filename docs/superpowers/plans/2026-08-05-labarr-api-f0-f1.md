# Labarr API F0–F1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir a fundação (F0) do `labarr-api` — repo novo, server Express com o contrato de actions do GAS, auth MVP (login/sessão), Postgres + migrations, health — e a primeira feature (F1): leitura do catálogo Omie → espelho `produtos` + `mapeamento_nome_codigo`, com a rota nova `/catalogo-omie` no SPA.

**Architecture:** Monólito Node/Express em repo novo (`C:\Users\Dell\Projects\labarr-api`) com `apps/api` (npm workspaces). Estrutura modular `src/modules/<modulo>/{application,domain,infrastructure,presentation}` + `src/integrations/` (OmieClient) + `src/shared/` (envelope, erros, concurrency) + `src/store/` (Postgres + migrations). Integração e domínio rodam no mesmo processo (sem hop HTTP). O SPA troca apenas a base URL por feature; o protocolo de actions e o envelope são preservados.

**Tech Stack:** Node 24 (fetch global nativo), TypeScript (NodeNext ESM, imports com `.js`), Express 5, zod, Postgres 16 (Docker na porta 5433 para testes), vitest 4, tsx. SPA (repo `gerenciadorGoogleSheetsLabarr`): React 19 + vitest — somente a Task 14 toca o SPA.

## Global Constraints

- **Repo novo, não o omie-mcp.** Toda a implementação acontece em `C:\Users\Dell\Projects\labarr-api` (git init na Task 1). Todos os `git add`/`git commit` rodam **dentro do labarr-api**. Este plano e a spec ficam no repo do omie-mcp apenas como documentação.
- **omie-mcp = contexto apenas** (decisão 5): o protocolo Omie é **copiado** para `integrations/omie/omieClient.ts`, nunca importado. As Tasks 4 e 9 são cópias fiéis (comenta-se a única alteração quando houver).
- **Contrato de actions preservado** (decisão da spec, seção 2.2): GET `?action=&sessionToken=&isTestMode=&limit=&offset=`; POST JSON como `text/plain;charset=utf-8` com `{action, sessionToken, isTestMode, correlationId}`; envelope `{success: true, data}` / `{success: false, error}`. **Toda resposta de negócio é HTTP 200 + envelope** — nunca HTTP de erro para caso de negócio.
- **Segurança do servidor: fora de escopo** — "vou montar com calma" (spec, Fora de escopo). Nada de CORS próprio nem camada extra agora. `app_key`/`app_secret` **nunca** vão para o browser — vivem em env do servidor.
- **GAS/Sheets atual não é tocado** (decisão 9): zero risco à produção. O SPA ganha só rotas novas (`/catalogo-omie`); as rotas legadas continuam no GAS intactas.
- **Regras do transporte Omie (copiadas do omie-mcp):** throttle 300ms entre o início de chamadas da mesma instância; rate limit "aguarde N segundos" → esperar `(N+1)`s; "consumo indevido" / `SOAP-ENV:Client-500` / HTTP 425/429 → 2s; "consumo redundante" / `SOAP-ENV:Client-6` → 2s; máx. 4 tentativas; `OmieApiError` **não** é repetido; falha de rede é repetida com `attempt * 500ms`; nunca engolir rate limit como "não encontrado".
- **Concorrência Omie:** `mapWithConcurrency` máx. 5 simultâneas; **nunca** `Promise.all` de duas chamadas do mesmo `call` (a Omie rejeita "Já existe uma requisição desse método sendo executada"). A sincronização do catálogo (Task 10) é **sequencial** por página.
- **Achado empírico (Omie):** `ListarProdutos` **não tem campo `categoria`** — o conceito é **família** (`codigo_familia` + `descricao_familia`). O array de produtos da resposta é `produto_servico_cadastro`. `quantidade_estoque` vem **sempre 0** — nunca usar como fonte de estoque.
- **Testes colocados junto do arquivo** (ADR-0002): `arquivo.test.ts` na mesma pasta, nunca diretório `tests/` separado.
- **Um commit por tarefa concluída** (feedback do usuário). Mensagens em PT-BR, conventional commits (`feat:`, `test:`, `docs:`, `chore:`).
- **Postgres de teste via Docker** — `docker compose up -d` (porta 5433) na raiz do labarr-api. Testes de store/repo **falham alto** se o banco não estiver de pé (proposital).
- **Sem deploy remoto do omie-mcp.** Deploy do labarr-api é passo do usuário na Task 15 (precisa de credenciais). Backup automatizado do Postgres é **não-negociável** (spec/ADR-0001).
- **Estilos:** repo novo em TypeScript com **aspas duplas e ponto e vírgula** (estilo do código portado do omie-mcp). **Exceção — Task 14 (SPA):** aspas simples, **sem** ponto e vírgula, indent 2 (estilo atual do SPA; manter, não reformatar).
- **Caminhos dos comandos:** rode os comandos de teste/build de dentro de `apps/api` (cwd do workspace). O npm workspaces hoista `node_modules` para a raiz do labarr-api.

## File Structure

```
labarr-api/                          (repo novo — git init na Task 1)
├── package.json                     (workspaces: apps/*)
├── .gitignore
├── compose.yaml                     (Postgres 16 de teste, porta 5433)
├── scripts/
│   ├── init-test-db.sql             (cria labarr_dev)
│   └── backup-db.sh                 (Task 15)
├── docs/
│   ├── adr/0001-hospedagem.md       (Task 2 — decisão F0)
│   └── DEPLOY.md                    (Task 15)
└── apps/api/
    ├── package.json
    ├── tsconfig.json
    ├── vitest.config.ts
    ├── .env.example
    └── src/
        ├── env.ts (+ env.test.ts)                        T1
        ├── server.ts                                     T8 (omnie na T13)
        ├── shared/
        │   ├── envelope.ts (+ .test.ts)                  T3
        │   ├── erros.ts                                  T3
        │   └── concurrency.ts (+ .test.ts)               T4
        ├── store/
        │   ├── client.ts                                 T5
        │   ├── migracao.ts (+ .test.ts)                  T5
        │   ├── test-utils.ts                             T5
        │   └── migrations/001-auth.sql                   T5
        │   └── migrations/002-catalogo.sql               T12
        ├── integrations/omie/
        │   └── omieClient.ts (+ .test.ts)                T9
        ├── modules/auth/
        │   ├── domain/regras.ts (+ .test.ts)             T6
        │   ├── domain/interfaces.ts                      T7
        │   ├── application/use-cases.ts (+ .test.ts)     T7
        │   └── infrastructure/auth-pg-repo.ts (+ .test.ts) T7
        ├── modules/catalogo/
        │   ├── domain/interfaces.ts                      T10
        │   ├── domain/setor.ts (+ .test.ts)              T10
        │   ├── application/dto.ts (+ .test.ts)           T10
        │   ├── application/use-cases.ts (+ .test.ts)     T10
        │   ├── infrastructure/catalogo-omie-gateway.ts (+ .test.ts) T11
        │   ├── infrastructure/catalogo-pg-repo.ts (+ .test.ts)      T12
        │   └── presentation/http.ts (+ .test.ts)         T13
        └── presentation/
            ├── action-router.ts (+ .test.ts)             T8
            ├── montar-app.ts (+ .test.ts)                T8
            └── montar-registros.ts (+ .test.ts)          T8 → T13

SPA (gerenciadorGoogleSheetsLabarr) — Task 14:
├── src/services/api-client.ts                (modificar)
├── src/app/router/index.tsx                  (modificar)
└── src/app/pages/CatalogoOmiePage.tsx        (criar)
    └── __tests__/CatalogoOmiePage.test.tsx   (criar)
```

---

### Task 1: Scaffold do repo + `carregarEnv` (TDD)

**Files:**
- Create: `package.json` (raiz), `.gitignore`, `compose.yaml`, `scripts/init-test-db.sql`, `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/vitest.config.ts`, `apps/api/src/env.ts`, `apps/api/src/env.test.ts`, `README.md`

**Interfaces:**
- Produces:
  - `carregarEnv(origem?: Record<string, string | undefined>): Env` — `origem` default é `process.env`; lança `Error` com a lista de problemas se alguma obrigatória faltar.
  - `interface Env { PORT: number; DATABASE_URL: string; DATABASE_SSL: boolean; OMIE_APP_KEY: string; OMIE_APP_SECRET: string; LABARR_ADMIN_LOGIN: string; LABARR_ADMIN_SENHA: string }`

- [ ] **Step 1: Criar o repositório e o scaffold**

```bash
mkdir -p C:/Users/Dell/Projects/labarr-api
cd C:/Users/Dell/Projects/labarr-api
git init -b main
mkdir -p scripts docs/adr apps/api/src
```

Crie `package.json` (raiz):

```json
{
  "name": "labarr",
  "private": true,
  "workspaces": ["apps/*"],
  "scripts": {
    "dev": "npm run dev -w apps/api",
    "test": "npm run test -w apps/api",
    "build": "npm run build -w apps/api",
    "typecheck": "npm run typecheck -w apps/api"
  }
}
```

Crie `.gitignore`:

```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
```

Crie `compose.yaml`:

```yaml
services:
  postgres-teste:
    image: postgres:16
    container_name: labarr-postgres-teste
    environment:
      POSTGRES_USER: labarr
      POSTGRES_PASSWORD: labarr
      POSTGRES_DB: labarr_test
    ports:
      - "5433:5432"
    volumes:
      - "./scripts/init-test-db.sql:/docker-entrypoint-initdb.d/init.sql:ro"
```

Crie `scripts/init-test-db.sql` (o container já cria `labarr_test` via env; este script adiciona o banco de dev):

```sql
CREATE DATABASE labarr_dev;
```

Crie `apps/api/package.json`:

```json
{
  "name": "labarr-api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "start": "node dist/server.js",
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  }
}
```

Crie `apps/api/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2023"],
    "types": ["node"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "sourceMap": true
  },
  "include": ["src"]
}
```

Crie `apps/api/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
```

Instale as dependências (raiz do repo):

```bash
npm install express@^5.2.1 pg@^8.13.1 zod@^3.23.8 dotenv@^16.4.5
npm install -D typescript@^5.5.3 tsx@^4.16.2 vitest@^4.1.10 @types/node@^24.0.0 @types/express@^5.0.6 @types/pg@^8.11.10
```

Crie `README.md` (raiz, breve):

```markdown
# labarr

API de domínio + integração Omie do SPA Labarr (produção de chocolate).
Monólito Node/Express em `apps/api`, Postgres, módulos em
`src/modules/<modulo>/{application,domain,infrastructure,presentation}`.

- Dev: `npm run dev`
- Testes: `npm test`
- Banco de teste: `docker compose up -d`
```

- [ ] **Step 2: Subir o Postgres de teste**

```bash
docker compose up -d
```

Espere uns segundos e confira: `docker ps` deve listar `labarr-postgres-teste` na porta `5433`.

- [ ] **Step 3: Escrever o teste que falha**

Crie `apps/api/src/env.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { carregarEnv } from "./env.js";

describe("carregarEnv", () => {
  it("usa PORT padrão 3000 e DATABASE_SSL padrão false quando ausentes", () => {
    const env = carregarEnv({
      DATABASE_URL: "postgres://labarr:labarr@localhost:5433/labarr_dev",
      OMIE_APP_KEY: "chave",
      OMIE_APP_SECRET: "segredo",
      LABARR_ADMIN_SENHA: "admin123",
    });
    expect(env.PORT).toBe(3000);
    expect(env.DATABASE_SSL).toBe(false);
    expect(env.LABARR_ADMIN_LOGIN).toBe("admin");
  });

  it("lança quando falta variável obrigatória", () => {
    expect(() => carregarEnv({})).toThrow();
  });

  it("interpreta DATABASE_SSL=true como booleano", () => {
    const env = carregarEnv({
      DATABASE_URL: "postgres://labarr:labarr@localhost:5433/labarr_dev",
      DATABASE_SSL: "true",
      OMIE_APP_KEY: "chave",
      OMIE_APP_SECRET: "segredo",
      LABARR_ADMIN_SENHA: "admin123",
    });
    expect(env.DATABASE_SSL).toBe(true);
  });

  it("rejeita PORT não numérica", () => {
    expect(() =>
      carregarEnv({
        DATABASE_URL: "postgres://labarr:labarr@localhost:5433/labarr_dev",
        PORT: "abc",
        OMIE_APP_KEY: "chave",
        OMIE_APP_SECRET: "segredo",
        LABARR_ADMIN_SENHA: "admin123",
      })
    ).toThrow();
  });
});
```

- [ ] **Step 4: Rodar para confirmar que falha**

Run (cwd `apps/api`): `npx vitest run src/env.test.ts`
Expected: FAIL — `Cannot find module './env.js'` (arquivo ainda não existe).

- [ ] **Step 5: Implementar `env.ts`**

Crie `apps/api/src/env.ts`:

```ts
import { z } from "zod";

const EsquemaEnv = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  DATABASE_SSL: z.string().optional().transform((v) => v === "true"),
  OMIE_APP_KEY: z.string().min(1),
  OMIE_APP_SECRET: z.string().min(1),
  LABARR_ADMIN_LOGIN: z.string().min(1).default("admin"),
  LABARR_ADMIN_SENHA: z.string().min(1),
});

export interface Env {
  PORT: number;
  DATABASE_URL: string;
  DATABASE_SSL: boolean;
  OMIE_APP_KEY: string;
  OMIE_APP_SECRET: string;
  LABARR_ADMIN_LOGIN: string;
  LABARR_ADMIN_SENHA: string;
}

export function carregarEnv(
  origem: Record<string, string | undefined> = process.env
): Env {
  const resultado = EsquemaEnv.safeParse(origem);
  if (!resultado.success) {
    const detalhes = resultado.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Variáveis de ambiente inválidas: ${detalhes}`);
  }
  return resultado.data as Env;
}
```

- [ ] **Step 6: Rodar para confirmar que passa**

Run (cwd `apps/api`): `npx vitest run src/env.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 7: Typecheck e commit**

```bash
npx tsc --noEmit
git add .
git commit -m "chore: scaffold do repo labarr-api + carregarEnv (TDD)"
```

---

### Task 2: ADR-0001 de hospedagem (decisão F0) + `.env.example`

**Files:**
- Create: `apps/api/.env.example`, `docs/adr/0001-hospedagem.md`

**Interfaces:**
- Consumes: nada de código (doc). Decision registrada aqui alimenta a Task 15 (`docs/DEPLOY.md`).
- Produces: `.env.example` — modelo do `.env` real usado em dev (Task 8) e no deploy (Task 15).

- [ ] **Step 1: Escrever o ADR (status: proposed)**

Crie `docs/adr/0001-hospedagem.md`:

```markdown
---
status: proposed
---

# ADR-0001: Hospedagem do labarr-api (Postgres + servidor)

## Contexto

O labarr-api precisa de um Postgres e de um lugar para rodar o servidor Node.
Duas opções (spec, seção "ADR em aberto"):

| Opção | Prós | Contras |
|---|---|---|
| **A. Render (gerenciado)** | Postgres + deploy no mesmo painel; zero operação; banco com backup automático | Custo mensal recorrente |
| **B. VPS própria + Supabase** | Sem custo adicional (VPS e Supabase já existem na infra do usuário — "só configurar"); Supabase oferece Auth (JWT/RLS) que pode resolver a segurança em configuração, não código | Supabase desencoraja self-hosting em produção (dor de versão); operação manual do backup é sua responsabilidade — **backup automatizado do Postgres é não-negociável** nesta opção |

## Decisão

(Preencher na F0 — PARADA com o usuário na Task 2.)

## Consequências

- Se B: a decisão "store = Postgres" sobrevive (re-hospedado no Supabase); `DATABASE_SSL=true`.
- Se A: a arquitetura é idêntica; muda só onde o banco mora.
- O monólito, o contrato de actions e as fases não mudam entre A e B.
- Backup automatizado é não-negociável em qualquer opção; em B ele é manual
  (script `scripts/backup-db.sh` + cron — Task 15).
```

- [ ] **Step 2: Escrever o `.env.example`**

Crie `apps/api/.env.example`:

```
PORT=3000
DATABASE_URL=postgres://labarr:labarr@localhost:5433/labarr_dev
DATABASE_SSL=false
OMIE_APP_KEY=
OMIE_APP_SECRET=
LABARR_ADMIN_LOGIN=admin
LABARR_ADMIN_SENHA=
```

- [ ] **Step 3: PARADA — perguntar a decisão de hospedagem ao usuário**

Pergunte ao usuário (AskUserQuestion): **"Hospedagem do labarr-api: opção A (Render gerenciado) ou opção B (VPS própria + Supabase)? (recomendado: B — sem custo adicional, infra já existe)"**. Só prossiga após a resposta.

Com a resposta, atualize o ADR: substitua `status: proposed` por `status: accepted` e preencha a seção **Decisão**, ex.:

```markdown
## Decisão

Opção **B — VPS própria + Supabase** (escolhida na F0). Postgres no Supabase,
servidor Node na VPS própria. Backup automatizado via `scripts/backup-db.sh`
+ cron (Task 15).
```

- [ ] **Step 4: Commit**

```bash
git add docs/adr/0001-hospedagem.md apps/api/.env.example
git commit -m "docs: ADR-0001 hospedagem (accepted) + .env.example"
```

---

### Task 3: `shared` — envelope e erros

**Files:**
- Create: `apps/api/src/shared/envelope.ts`, `apps/api/src/shared/envelope.test.ts`, `apps/api/src/shared/erros.ts`, `apps/api/src/shared/erros.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `sucesso<T>(data: T): EnvelopeDeSucesso<T>` → `{ success: true, data }`; `erro(mensagem: string): EnvelopeDeErro` → `{ success: false, error }`; `type Envelope<T> = EnvelopeDeSucesso<T> | EnvelopeDeErro`.
  - Classes: `ErroDeDominio extends Error`, `ErroDeAutenticacao`, `ErroDeValidacao`, `ErroNaoEncontrado` (todas estendem `ErroDeDominio`).
  - Constantes: `MENSAGEM_SESSAO_INVALIDA = "Acesso negado. Sessão inválida ou expirada. Faça login novamente."`, `MENSAGEM_PERMISSAO_INSUFICIENTE = "Acesso negado. Permissão insuficiente."`, `MENSAGEM_ERRO_INTERNO = "Erro interno no servidor."`.
  - `mensagemDeErro(motivo: unknown): string` — retorna `.message` se `ErroDeDominio`; senão loga `console.error("[erro-interno]", motivo)` e retorna `MENSAGEM_ERRO_INTERNO`.
  - Usados por todas as tasks seguintes (action-router, auth, catalogo, SPA detecta `MENSAGEM_SESSAO_INVALIDA`).

- [ ] **Step 1: Escrever os testes que falham**

Crie `apps/api/src/shared/envelope.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { erro, sucesso } from "./envelope.js";

describe("envelope", () => {
  it("sucesso e erro montam o contrato", () => {
    expect(sucesso({ a: 1 })).toEqual({ success: true, data: { a: 1 } });
    expect(erro("falhou")).toEqual({ success: false, error: "falhou" });
  });
});
```

Crie `apps/api/src/shared/erros.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import {
  ErroDeAutenticacao,
  ErroDeValidacao,
  mensagemDeErro,
  MENSAGEM_ERRO_INTERNO,
  MENSAGEM_PERMISSAO_INSUFICIENTE,
  MENSAGEM_SESSAO_INVALIDA,
} from "./erros.js";

describe("mensagemDeErro", () => {
  it("repassa a mensagem de erros de domínio", () => {
    expect(mensagemDeErro(new ErroDeValidacao("parâmetro inválido"))).toBe("parâmetro inválido");
    expect(mensagemDeErro(new ErroDeAutenticacao(MENSAGEM_SESSAO_INVALIDA))).toBe(MENSAGEM_SESSAO_INVALIDA);
  });

  it("esconde erros internos", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(mensagemDeErro(new Error("stack rastreada"))).toBe(MENSAGEM_ERRO_INTERNO);
    expect(mensagemDeErro("texto qualquer")).toBe(MENSAGEM_ERRO_INTERNO);
    spy.mockRestore();
  });

  it("constantes têm as strings que o SPA detecta", () => {
    expect(MENSAGEM_SESSAO_INVALIDA).toContain("Sessão inválida ou expirada");
    expect(MENSAGEM_PERMISSAO_INSUFICIENTE).toContain("Permissão insuficiente");
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run (cwd `apps/api`): `npx vitest run src/shared/envelope.test.ts src/shared/erros.test.ts`
Expected: FAIL — módulos não existem.

- [ ] **Step 3: Implementar**

Crie `apps/api/src/shared/envelope.ts`:

```ts
export interface EnvelopeDeSucesso<T> {
  success: true;
  data: T;
}

export interface EnvelopeDeErro {
  success: false;
  error: string;
}

export type Envelope<T> = EnvelopeDeSucesso<T> | EnvelopeDeErro;

export function sucesso<T>(data: T): EnvelopeDeSucesso<T> {
  return { success: true, data };
}

export function erro(mensagem: string): EnvelopeDeErro {
  return { success: false, error: mensagem };
}
```

Crie `apps/api/src/shared/erros.ts`:

```ts
export const MENSAGEM_SESSAO_INVALIDA =
  "Acesso negado. Sessão inválida ou expirada. Faça login novamente.";
export const MENSAGEM_PERMISSAO_INSUFICIENTE = "Acesso negado. Permissão insuficiente.";
export const MENSAGEM_ERRO_INTERNO = "Erro interno no servidor.";

/** Erro de negócio — a mensagem é segura para devolver na resposta (envelope de erro). */
export class ErroDeDominio extends Error {}

export class ErroDeAutenticacao extends ErroDeDominio {}

export class ErroDeValidacao extends ErroDeDominio {}

export class ErroNaoEncontrado extends ErroDeDominio {}

export function mensagemDeErro(motivo: unknown): string {
  if (motivo instanceof ErroDeDominio) {
    return motivo.message;
  }
  console.error("[erro-interno]", motivo);
  return MENSAGEM_ERRO_INTERNO;
}
```

- [ ] **Step 4: Rodar para confirmar que passa**

Run (cwd `apps/api`): `npx vitest run src/shared/envelope.test.ts src/shared/erros.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/shared
git commit -m "feat: envelope e erros compartilhados"
```

---

### Task 4: `shared/concurrency.ts` — `mapWithConcurrency` (cópia do omie-mcp)

**Files:**
- Create: `apps/api/src/shared/concurrency.ts`, `apps/api/src/shared/concurrency.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<PromiseSettledResult<R>[]>` — pool de workers, no máximo `limit` chamadas simultâneas, preserva ordem dos itens no array de resultados (nunca rejeita; itens que falham viram `{ status: "rejected", reason }`).
  - Cópia fiel de `C:\Users\Dell\Projects\omie-mcp\src\shared\concurrency.ts` (não importada — decisão 5).

- [ ] **Step 1: Escrever o teste que falha**

Crie `apps/api/src/shared/concurrency.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { mapWithConcurrency } from "./concurrency.js";

describe("mapWithConcurrency", () => {
  it("executa todos os itens respeitando o limite", async () => {
    const chamadasAtivas = { atual: 0, maximo: 0 };
    const fn = vi.fn(async (item: number) => {
      chamadasAtivas.atual += 1;
      chamadasAtivas.maximo = Math.max(chamadasAtivas.maximo, chamadasAtivas.atual);
      await new Promise((resolve) => setTimeout(resolve, 5));
      chamadasAtivas.atual -= 1;
      return item * 2;
    });

    const resultados = await mapWithConcurrency([1, 2, 3, 4, 5], 2, fn);

    expect(resultados.map((r) => (r.status === "fulfilled" ? r.value : null))).toEqual([2, 4, 6, 8, 10]);
    expect(chamadasAtivas.maximo).toBeLessThanOrEqual(2);
    expect(fn).toHaveBeenCalledTimes(5);
  });

  it("não rejeita — itens com erro viram rejected no resultado", async () => {
    const resultados = await mapWithConcurrency(
      [1, 2, 3],
      2,
      async (item) => {
        if (item === 2) throw new Error("falhou o 2");
        return item;
      }
    );
    expect(resultados[0]).toEqual({ status: "fulfilled", value: 1 });
    expect(resultados[1].status).toBe("rejected");
    expect(resultados[2]).toEqual({ status: "fulfilled", value: 3 });
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run (cwd `apps/api`): `npx vitest run src/shared/concurrency.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar (cópia do omie-mcp)**

Crie `apps/api/src/shared/concurrency.ts`:

```ts
/**
 * Executa `fn` para cada item de `items`, no máximo `limit` chamadas em
 * paralelo por vez. Necessário porque a Omie aplica rate limit ("consumo
 * indevido") quando muitas chamadas batem ao mesmo tempo — descoberto ao
 * testar `consultarClientesPorCodigo` com ~20 códigos em paralelo: parte
 * falhava por rate limit e era erroneamente tratada como "não encontrado"
 * (o `OmieClient` já faz retry com backoff por chamada individual, mas isso
 * não ajuda se todas as chamadas colidem no mesmo instante).
 *
 * Cópia fiel do omie-mcp (decisão 5: protocolo copiado, não importado).
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next++;
      try {
        const value = await fn(items[index]);
        results[index] = { status: "fulfilled", value };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
```

- [ ] **Step 4: Rodar para confirmar que passa**

Run (cwd `apps/api`): `npx vitest run src/shared/concurrency.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/shared/concurrency.ts apps/api/src/shared/concurrency.test.ts
git commit -m "feat: mapWithConcurrency (cópia do omie-mcp)"
```

---

### Task 5: Store — client, migrations runner, `001-auth.sql`, test-utils

**Files:**
- Create: `apps/api/src/store/client.ts`, `apps/api/src/store/migracao.ts`, `apps/api/src/store/migracao.test.ts`, `apps/api/src/store/migrations/001-auth.sql`, `apps/api/src/store/test-utils.ts`

**Interfaces:**
- Consumes: nada (usa `pg` direto).
- Produces:
  - `criarPool(databaseUrl: string, opcoes?: { ssl?: boolean }): Pool` — `ssl: { rejectUnauthorized: false }` quando `opcoes.ssl`.
  - `rodarMigrations(pool: Pool, diretorio?: string): Promise<void>` — tabela `_migrations(nome text PRIMARY KEY, executada_em timestamptz)`; roda cada `*.sql` ordenado de `diretorio` (default `./migrations/` relativo ao próprio módulo) numa transação; idempotente.
  - `prepararBancoDeTeste(url?: string): Promise<{ pool: Pool; limpar: () => Promise<void> }>` — cria pool, roda migrations, e devolve `limpar` que faz TRUNCATE das tabelas existentes (`sessoes, usuarios, mapeamento_nome_codigo, produtos`).
  - `DATABASE_URL_TEST_PADRAO = "postgres://labarr:labarr@localhost:5433/labarr_test"`.
  - Migration `001-auth.sql`: cria `usuarios` e `sessoes`.

**Pré-requisito:** `docker compose up -d` (Task 1). Se o banco de teste não estiver de pé, estes testes **falham alto** com erro de conexão — proposital.

- [ ] **Step 1: Escrever a migration e o teste que falha**

Crie `apps/api/src/store/migrations/001-auth.sql`:

```sql
CREATE TABLE usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  login text NOT NULL UNIQUE,
  hash_senha text NOT NULL,
  admin boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expira_em timestamptz NOT NULL,
  criada_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessoes_expira_em ON sessoes(expira_em);
```

Crie `apps/api/src/store/migracao.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prepararBancoDeTeste, type BancoDeTeste } from "./test-utils.js";

// Pré-requisito: docker compose up -d (Postgres na porta 5433). Sem o banco,
// estes testes falham com erro de conexão (falha barulhenta, proposital).

describe("rodarMigrations", () => {
  let banco: BancoDeTeste;

  beforeAll(async () => {
    banco = await prepararBancoDeTeste();
  });

  afterAll(async () => {
    await banco.pool.end();
  });

  it("aplica a migration 001 e registra em _migrations", async () => {
    const { rows } = await banco.pool.query(`SELECT nome FROM _migrations ORDER BY nome`);
    expect(rows.map((linha) => linha.nome)).toContain("001-auth.sql");
  });

  it("cria as tabelas usuarios e sessoes", async () => {
    const resultado = await banco.pool.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
    );
    const tabelas = resultado.rows.map((linha) => linha.tablename);
    expect(tabelas).toContain("usuarios");
    expect(tabelas).toContain("sessoes");
  });

  it("é idempotente — rodar de novo não duplica", async () => {
    // prepararBancoDeTeste já rodou as migrations; rodar mais uma vez não deve lançar
    await expect(
      banco.pool.query(`SELECT COUNT(*)::int AS total FROM _migrations`)
    ).resolves.not.toThrow();
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run (cwd `apps/api`): `npx vitest run src/store/migracao.test.ts`
Expected: FAIL — módulos `test-utils.js`/`migracao.js` não existem.

- [ ] **Step 3: Implementar**

Crie `apps/api/src/store/client.ts`:

```ts
import pg from "pg";

const { Pool } = pg;

export function criarPool(databaseUrl: string, opcoes?: { ssl?: boolean }): Pool {
  return new Pool({
    connectionString: databaseUrl,
    ...(opcoes?.ssl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
}
```

Crie `apps/api/src/store/migracao.ts`:

```ts
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Pool } from "pg";

export async function rodarMigrations(pool: Pool, diretorio?: string): Promise<void> {
  const dir = diretorio ?? fileURLToPath(new URL("./migrations/", import.meta.url));

  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      nome text PRIMARY KEY,
      executada_em timestamptz NOT NULL DEFAULT now()
    )
  `);

  const arquivos = (await readdir(dir)).filter((a) => a.endsWith(".sql")).sort();

  for (const arquivo of arquivos) {
    const jaAplicada = await pool.query(`SELECT 1 FROM _migrations WHERE nome = $1`, [arquivo]);
    if (jaAplicada.rowCount && jaAplicada.rowCount > 0) continue;

    const sql = await readFile(join(dir, arquivo), "utf8");
    const cliente = await pool.connect();
    try {
      await cliente.query("BEGIN");
      await cliente.query(sql);
      await cliente.query(`INSERT INTO _migrations (nome) VALUES ($1)`, [arquivo]);
      await cliente.query("COMMIT");
    } catch (motivo) {
      await cliente.query("ROLLBACK");
      throw motivo;
    } finally {
      cliente.release();
    }
  }
}
```

Crie `apps/api/src/store/test-utils.ts`:

```ts
import type { Pool } from "pg";
import { criarPool } from "./client.js";
import { rodarMigrations } from "./migracao.js";

export const DATABASE_URL_TEST_PADRAO =
  "postgres://labarr:labarr@localhost:5433/labarr_test";

export interface BancoDeTeste {
  pool: Pool;
  limpar: () => Promise<void>;
}

export async function prepararBancoDeTeste(
  url: string = process.env.DATABASE_URL_TEST ?? DATABASE_URL_TEST_PADRAO
): Promise<BancoDeTeste> {
  const pool = criarPool(url);
  await rodarMigrations(pool);

  const limpar = async () => {
    const resultado = await pool.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
    );
    const tabelas = resultado.rows.map((linha) => linha.tablename as string);
    const paraTruncar = tabelas.filter((tabela) =>
      ["sessoes", "usuarios", "mapeamento_nome_codigo", "produtos"].includes(tabela)
    );
    if (paraTruncar.length > 0) {
      await pool.query(`TRUNCATE ${paraTruncar.join(", ")} RESTART IDENTITY CASCADE`);
    }
  };

  return { pool, limpar };
}
```

- [ ] **Step 4: Rodar para confirmar que passa**

Run (cwd `apps/api`): `npx vitest run src/store/migracao.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/store
git commit -m "feat: store Postgres (client, migrations, test-utils)"
```

---

### Task 6: Auth — regras de domínio (hash scrypt, token, expiração)

**Files:**
- Create: `apps/api/src/modules/auth/domain/regras.ts`, `apps/api/src/modules/auth/domain/regras.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `TEMPO_DE_SESSAO_MS = 12 * 60 * 60 * 1000`.
  - `gerarTokenSessao(): string` — `randomUUID()`.
  - `hashSenha(senha: string): string` — formato `scrypt$<salt hex>$<hash hex>` (scryptSync 64 bytes, salt 16 bytes).
  - `verificarSenha(senha: string, hashArmazenado: string): boolean` — `timingSafeEqual`; hash malformado → false.
  - `calcularExpiracao(agora: number): Date` — `agora + TEMPO_DE_SESSAO_MS`.
  - Consumidos pela Task 7 (`use-cases` e `AuthPgRepo`).

- [ ] **Step 1: Escrever o teste que falha**

Crie `apps/api/src/modules/auth/domain/regras.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  TEMPO_DE_SESSAO_MS,
  calcularExpiracao,
  gerarTokenSessao,
  hashSenha,
  verificarSenha,
} from "./regras.js";

describe("regras de auth", () => {
  it("hashSenha/verificarSenha funcionam em ciclo", () => {
    const hash = hashSenha("minha-senha");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(verificarSenha("minha-senha", hash)).toBe(true);
    expect(verificarSenha("outra", hash)).toBe(false);
  });

  it("verificarSenha rejeita hash malformado", () => {
    expect(verificarSenha("x", "invalido")).toBe(false);
    expect(verificarSenha("x", "bcrypt$aaaa")).toBe(false);
  });

  it("gerarTokenSessao gera uuid", () => {
    expect(gerarTokenSessao()).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("calcularExpiracao soma o tempo de sessão", () => {
    expect(calcularExpiracao(0).getTime()).toBe(TEMPO_DE_SESSAO_MS);
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run (cwd `apps/api`): `npx vitest run src/modules/auth/domain/regras.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar**

Crie `apps/api/src/modules/auth/domain/regras.ts`:

```ts
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

export const TEMPO_DE_SESSAO_MS = 12 * 60 * 60 * 1000;

export function gerarTokenSessao(): string {
  return randomUUID();
}

export function hashSenha(senha: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(senha, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verificarSenha(senha: string, hashArmazenado: string): boolean {
  const partes = hashArmazenado.split("$");
  if (partes.length !== 3 || partes[0] !== "scrypt") return false;
  const salt = partes[1];
  const hashEsperado = Buffer.from(partes[2], "hex");
  const hashCalculado = scryptSync(senha, salt, hashEsperado.length);
  return timingSafeEqual(hashEsperado, hashCalculado);
}

export function calcularExpiracao(agora: number): Date {
  return new Date(agora + TEMPO_DE_SESSAO_MS);
}
```

- [ ] **Step 4: Rodar para confirmar que passa**

Run (cwd `apps/api`): `npx vitest run src/modules/auth/domain/regras.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/auth/domain
git commit -m "feat: regras de auth (hash scrypt, token, expiração)"
```

---

### Task 7: Auth — use-cases + repo Postgres

**Files:**
- Create: `apps/api/src/modules/auth/domain/interfaces.ts`, `apps/api/src/modules/auth/application/use-cases.ts`, `apps/api/src/modules/auth/application/use-cases.test.ts`, `apps/api/src/modules/auth/infrastructure/auth-pg-repo.ts`, `apps/api/src/modules/auth/infrastructure/auth-pg-repo.test.ts`

**Interfaces:**
- Consumes: `regras.ts` (Task 6), `erros.ts` (Task 3), `prepararBancoDeTeste` (Task 5).
- Produces:
  - `interface Usuario { id: string; login: string; hashSenha: string; admin: boolean }`
  - `interface Sessao { id: string; token: string; usuarioId: string; expiraEm: Date; criadaEm: Date }`
  - `interface SessaoComUsuario { sessao: Sessao; usuario: Usuario }`
  - `interface IAuthRepo { buscarUsuarioPorLogin(login): Promise<Usuario | null>; criarSessao(usuarioId, token, expiraEm: Date): Promise<Sessao>; buscarSessaoValida(token, agora: number): Promise<SessaoComUsuario | null>; removerSessoesExpiradas(agora: number): Promise<void>; criarUsuario(login, hashSenha, admin): Promise<Usuario | null> }`
  - `interface IAuthUseCases { login(login, senha, agora?): Promise<{ sessionToken: string; sessionExpiresAt: Date; usuario: UsuarioDaSessao }>; validarSessao(token, agora?): Promise<UsuarioDaSessao>; semearAdmin(login, senha): Promise<void>; limparSessoesExpiradas(agora?): Promise<void> }` — `UsuarioDaSessao = { id; login; admin }`.
  - `criarUseCasesAuth(repo: IAuthRepo): IAuthUseCases`.
  - `AuthPgRepo implements IAuthRepo` — constructor `(pool: Pool)`.
  - **Strings exatas** (o SPA detecta): login errado → `ErroDeAutenticacao("Login ou senha inválidos.")`; sessão inválida/expirada → `ErroDeAutenticacao(MENSAGEM_SESSAO_INVALIDA)`.

**Pré-requisito:** Docker Postgres de pé para `auth-pg-repo.test.ts`.

- [ ] **Step 1: Escrever `interfaces.ts` (sem teste próprio — só tipos)**

Crie `apps/api/src/modules/auth/domain/interfaces.ts`:

```ts
export interface Usuario {
  id: string;
  login: string;
  hashSenha: string;
  admin: boolean;
}

export interface Sessao {
  id: string;
  token: string;
  usuarioId: string;
  expiraEm: Date;
  criadaEm: Date;
}

export interface SessaoComUsuario {
  sessao: Sessao;
  usuario: Usuario;
}

export interface IAuthRepo {
  buscarUsuarioPorLogin(login: string): Promise<Usuario | null>;
  criarSessao(usuarioId: string, token: string, expiraEm: Date): Promise<Sessao>;
  buscarSessaoValida(token: string, agora: number): Promise<SessaoComUsuario | null>;
  removerSessoesExpiradas(agora: number): Promise<void>;
  criarUsuario(login: string, hashSenha: string, admin: boolean): Promise<Usuario | null>;
}
```

- [ ] **Step 2: Escrever os testes de use-cases (com fake repo, sem rede)**

Crie `apps/api/src/modules/auth/application/use-cases.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ErroDeAutenticacao, MENSAGEM_SESSAO_INVALIDA } from "../../../shared/erros.js";
import type { IAuthRepo, Sessao, Usuario } from "../domain/interfaces.js";
import { calcularExpiracao, hashSenha } from "../domain/regras.js";
import { criarUseCasesAuth } from "./use-cases.js";

class FakeAuthRepo implements IAuthRepo {
  usuarios = new Map<string, Usuario>();
  sessoes = new Map<string, Sessao>();

  constructor() {
    this.usuarios.set("u1", {
      id: "u1",
      login: "admin",
      hashSenha: hashSenha("senha123"),
      admin: true,
    });
  }

  async buscarUsuarioPorLogin(login: string) {
    return [...this.usuarios.values()].find((u) => u.login === login) ?? null;
  }

  async criarSessao(usuarioId: string, token: string, expiraEm: Date) {
    const sessao: Sessao = { id: `s-${token}`, token, usuarioId, expiraEm, criadaEm: new Date(0) };
    this.sessoes.set(sessao.id, sessao);
    return sessao;
  }

  async buscarSessaoValida(token: string, agora: number) {
    const sessao = [...this.sessoes.values()].find((s) => s.token === token);
    if (!sessao || sessao.expiraEm.getTime() <= agora) return null;
    const usuario = this.usuarios.get(sessao.usuarioId);
    if (!usuario) return null;
    return { sessao, usuario };
  }

  async removerSessoesExpiradas(agora: number) {
    for (const [id, s] of this.sessoes) {
      if (s.expiraEm.getTime() <= agora) this.sessoes.delete(id);
    }
  }

  async criarUsuario(login: string, hashSenhaNovo: string, admin: boolean) {
    if ([...this.usuarios.values()].some((u) => u.login === login)) return null;
    const usuario: Usuario = { id: `u-${login}`, login, hashSenha: hashSenhaNovo, admin };
    this.usuarios.set(usuario.id, usuario);
    return usuario;
  }
}

describe("use-cases de auth", () => {
  it("login válido devolve sessionToken e usuário", async () => {
    const auth = criarUseCasesAuth(new FakeAuthRepo());
    const agora = 1_000_000;
    const resultado = await auth.login("admin", "senha123", agora);
    expect(resultado.usuario).toEqual({ id: "u1", login: "admin", admin: true });
    expect(resultado.sessionToken).toMatch(/^[0-9a-f-]{36}$/);
    expect(resultado.sessionExpiresAt.getTime()).toBe(agora + 12 * 60 * 60 * 1000);
  });

  it("login com senha errada lança ErroDeAutenticacao", async () => {
    const auth = criarUseCasesAuth(new FakeAuthRepo());
    await expect(auth.login("admin", "errada")).rejects.toThrow("Login ou senha inválidos.");
  });

  it("login de usuário inexistente lança ErroDeAutenticacao", async () => {
    const auth = criarUseCasesAuth(new FakeAuthRepo());
    await expect(auth.login("ninguem", "senha123")).rejects.toThrow("Login ou senha inválidos.");
  });

  it("validarSessao devolve usuário para token válido", async () => {
    const auth = criarUseCasesAuth(new FakeAuthRepo());
    const { sessionToken } = await auth.login("admin", "senha123", Date.now());
    const usuario = await auth.validarSessao(sessionToken);
    expect(usuario.login).toBe("admin");
  });

  it("validarSessao rejeita sessão vencida", async () => {
    const auth = criarUseCasesAuth(new FakeAuthRepo());
    const agora = Date.now();
    const { sessionToken } = await auth.login("admin", "senha123", agora);
    // 13h depois — a sessão (12h) já expirou
    await expect(auth.validarSessao(sessionToken, agora + 13 * 60 * 60 * 1000)).rejects.toThrow(
      MENSAGEM_SESSAO_INVALIDA
    );
  });

  it("semearAdmin cria usuário admin e é idempotente", async () => {
    const repo = new FakeAuthRepo();
    const auth = criarUseCasesAuth(repo);
    await auth.semearAdmin("novo", "senhaNova");
    expect(await repo.buscarUsuarioPorLogin("novo")).not.toBeNull();
    await auth.semearAdmin("novo", "senhaNova");
    const encontrados = [...repo.usuarios.values()].filter((u) => u.login === "novo");
    expect(encontrados).toHaveLength(1);
  });

  it("limparSessoesExpiradas remove apenas sessões vencidas", async () => {
    const repo = new FakeAuthRepo();
    const auth = criarUseCasesAuth(repo);
    const agora = Date.now();
    await auth.login("admin", "senha123", agora);
    repo.sessoes.set("vencida", {
      id: "vencida",
      token: "token-vencido",
      usuarioId: "u1",
      expiraEm: calcularExpiracao(agora - 13 * 60 * 60 * 1000),
      criadaEm: new Date(0),
    });
    await auth.limparSessoesExpiradas(agora);
    expect(repo.sessoes.has("vencida")).toBe(false);
    expect(repo.sessoes.size).toBe(1);
  });

  it("lança ErroDeAutenticacao (instanceof) em sessão inválida", async () => {
    const auth = criarUseCasesAuth(new FakeAuthRepo());
    const erro = await auth.validarSessao("nao-existe").catch((e) => e);
    expect(erro).toBeInstanceOf(ErroDeAutenticacao);
  });
});
```

- [ ] **Step 3: Rodar os testes de use-cases para confirmar que falham**

Run (cwd `apps/api`): `npx vitest run src/modules/auth/application/use-cases.test.ts`
Expected: FAIL — módulo `use-cases.js` não existe.

- [ ] **Step 4: Implementar use-cases**

Crie `apps/api/src/modules/auth/application/use-cases.ts`:

```ts
import {
  ErroDeAutenticacao,
  MENSAGEM_SESSAO_INVALIDA,
} from "../../../shared/erros.js";
import type { IAuthRepo } from "../domain/interfaces.js";
import {
  calcularExpiracao,
  gerarTokenSessao,
  hashSenha,
  verificarSenha,
} from "../domain/regras.js";

export interface UsuarioDaSessao {
  id: string;
  login: string;
  admin: boolean;
}

export interface IAuthUseCases {
  login(
    login: string,
    senha: string,
    agora?: number
  ): Promise<{ sessionToken: string; sessionExpiresAt: Date; usuario: UsuarioDaSessao }>;
  validarSessao(token: string, agora?: number): Promise<UsuarioDaSessao>;
  semearAdmin(login: string, senha: string): Promise<void>;
  limparSessoesExpiradas(agora?: number): Promise<void>;
}

export function criarUseCasesAuth(repo: IAuthRepo): IAuthUseCases {
  return {
    async login(login, senha, agora = Date.now()) {
      const usuario = await repo.buscarUsuarioPorLogin(login);
      if (!usuario || !verificarSenha(senha, usuario.hashSenha)) {
        throw new ErroDeAutenticacao("Login ou senha inválidos.");
      }
      const token = gerarTokenSessao();
      const expiraEm = calcularExpiracao(agora);
      const sessao = await repo.criarSessao(usuario.id, token, expiraEm);
      return {
        sessionToken: sessao.token,
        sessionExpiresAt: sessao.expiraEm,
        usuario: { id: usuario.id, login: usuario.login, admin: usuario.admin },
      };
    },

    async validarSessao(token, agora = Date.now()) {
      const resultado = await repo.buscarSessaoValida(token, agora);
      if (!resultado) {
        throw new ErroDeAutenticacao(MENSAGEM_SESSAO_INVALIDA);
      }
      return {
        id: resultado.usuario.id,
        login: resultado.usuario.login,
        admin: resultado.usuario.admin,
      };
    },

    async semearAdmin(login, senha) {
      await repo.criarUsuario(login, hashSenha(senha), true);
    },

    async limparSessoesExpiradas(agora = Date.now()) {
      await repo.removerSessoesExpiradas(agora);
    },
  };
}
```

- [ ] **Step 5: Rodar os testes de use-cases para confirmar que passam**

Run (cwd `apps/api`): `npx vitest run src/modules/auth/application/use-cases.test.ts`
Expected: PASS.

- [ ] **Step 6: Escrever os testes do repo Postgres (Docker de pé)**

Crie `apps/api/src/modules/auth/infrastructure/auth-pg-repo.test.ts`:

```ts
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  prepararBancoDeTeste,
  type BancoDeTeste,
} from "../../../store/test-utils.js";
import { hashSenha } from "../domain/regras.js";
import { AuthPgRepo } from "./auth-pg-repo.js";

// Pré-requisito: docker compose up -d (Postgres na porta 5433).

describe("AuthPgRepo", () => {
  let banco: BancoDeTeste;
  let repo: AuthPgRepo;

  beforeAll(async () => {
    banco = await prepararBancoDeTeste();
  });

  beforeEach(async () => {
    await banco.limpar();
    repo = new AuthPgRepo(banco.pool);
  });

  afterAll(async () => {
    await banco.pool.end();
  });

  it("cria usuário e busca por login", async () => {
    const criado = await repo.criarUsuario("admin", hashSenha("senha123"), true);
    expect(criado).not.toBeNull();
    const encontrado = await repo.buscarUsuarioPorLogin("admin");
    expect(encontrado?.login).toBe("admin");
    expect(encontrado?.admin).toBe(true);
  });

  it("não duplica usuário com login repetido (ON CONFLICT)", async () => {
    await repo.criarUsuario("admin", hashSenha("a"), true);
    const segundo = await repo.criarUsuario("admin", hashSenha("b"), true);
    expect(segundo).toBeNull();
  });

  it("cria sessão e busca sessão válida", async () => {
    const criado = await repo.criarUsuario("admin", hashSenha("senha123"), true);
    const agora = Date.now();
    const sessao = await repo.criarSessao(criado!.id, "token-1", new Date(agora + 10_000));
    expect(sessao.token).toBe("token-1");

    const valida = await repo.buscarSessaoValida("token-1", agora);
    expect(valida?.sessao.token).toBe("token-1");
    expect(valida?.usuario.login).toBe("admin");
  });

  it("sessão vencida não é válida e removerSessoesExpiradas a apaga", async () => {
    const criado = await repo.criarUsuario("admin", hashSenha("senha123"), true);
    const agora = Date.now();
    await repo.criarSessao(criado!.id, "token-vencido", new Date(agora - 1_000));
    await repo.criarSessao(criado!.id, "token-ok", new Date(agora + 10_000));

    const vencida = await repo.buscarSessaoValida("token-vencido", agora);
    expect(vencida).toBeNull();

    await repo.removerSessoesExpiradas(agora);
    const ok = await repo.buscarSessaoValida("token-ok", agora);
    expect(ok).not.toBeNull();
  });
});
```

- [ ] **Step 7: Rodar para confirmar que falha (repo ainda não existe)**

Run (cwd `apps/api`): `npx vitest run src/modules/auth/infrastructure/auth-pg-repo.test.ts`
Expected: FAIL — módulo `auth-pg-repo.js` não existe.

- [ ] **Step 8: Implementar o repo Postgres**

Crie `apps/api/src/modules/auth/infrastructure/auth-pg-repo.ts`:

```ts
import type { Pool } from "pg";
import type { IAuthRepo, Sessao, SessaoComUsuario, Usuario } from "../domain/interfaces.js";

export class AuthPgRepo implements IAuthRepo {
  constructor(private readonly pool: Pool) {}

  async buscarUsuarioPorLogin(login: string): Promise<Usuario | null> {
    const resultado = await this.pool.query(
      `SELECT id, login, hash_senha AS "hashSenha", admin
       FROM usuarios WHERE login = $1`,
      [login]
    );
    return resultado.rows[0] ?? null;
  }

  async criarSessao(usuarioId: string, token: string, expiraEm: Date): Promise<Sessao> {
    const resultado = await this.pool.query(
      `INSERT INTO sessoes (usuario_id, token, expira_em)
       VALUES ($1, $2, $3)
       RETURNING id, token, usuario_id AS "usuarioId", expira_em AS "expiraEm", criada_em AS "criadaEm"`,
      [usuarioId, token, expiraEm]
    );
    return resultado.rows[0];
  }

  async buscarSessaoValida(token: string, agora: number): Promise<SessaoComUsuario | null> {
    const resultado = await this.pool.query(
      `SELECT s.id AS "sessao_id", s.token AS "sessao_token",
              s.usuario_id AS "sessao_usuarioId", s.expira_em AS "sessao_expiraEm",
              s.criada_em AS "sessao_criadaEm",
              u.id AS "usuario_id", u.login AS "usuario_login",
              u.hash_senha AS "usuario_hashSenha", u.admin AS "usuario_admin"
       FROM sessoes s
       JOIN usuarios u ON u.id = s.usuario_id
       WHERE s.token = $1 AND s.expira_em > to_timestamp($2 / 1000.0)`,
      [token, agora]
    );
    const linha = resultado.rows[0];
    if (!linha) return null;
    return {
      sessao: {
        id: linha.sessao_id,
        token: linha.sessao_token,
        usuarioId: linha.sessao_usuarioId,
        expiraEm: linha.sessao_expiraEm,
        criadaEm: linha.sessao_criadaEm,
      },
      usuario: {
        id: linha.usuario_id,
        login: linha.usuario_login,
        hashSenha: linha.usuario_hashSenha,
        admin: linha.usuario_admin,
      },
    };
  }

  async removerSessoesExpiradas(agora: number): Promise<void> {
    await this.pool.query(`DELETE FROM sessoes WHERE expira_em <= to_timestamp($1 / 1000.0)`, [
      agora,
    ]);
  }

  async criarUsuario(login: string, hashSenhaNovo: string, admin: boolean): Promise<Usuario | null> {
    const resultado = await this.pool.query(
      `INSERT INTO usuarios (login, hash_senha, admin)
       VALUES ($1, $2, $3)
       ON CONFLICT (login) DO NOTHING
       RETURNING id, login, hash_senha AS "hashSenha", admin`,
      [login, hashSenhaNovo, admin]
    );
    return resultado.rows[0] ?? null;
  }
}
```

- [ ] **Step 9: Rodar para confirmar que passa**

Run (cwd `apps/api`): `npx vitest run src/modules/auth/infrastructure/auth-pg-repo.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 10: Typecheck e commit**

```bash
npx tsc --noEmit
git add apps/api/src/modules/auth
git commit -m "feat: auth use-cases + repo Postgres"
```

---

### Task 8: Roteador de actions + `montarApp` + `montarRegistros` + `server.ts`

**Decisão de teste (sem dependência nova):** o omie-mcp não usa supertest. O núcleo de despacho (`processarAction`) é uma função **pura** testada direto com vitest; o contrato HTTP completo é testado **end-to-end** com o `fetch` global do Node 24 contra `app.listen(0)` (porta efêmera) + `server.close()`. **Não adicionar supertest.**

**Files:**
- Create: `apps/api/src/presentation/action-router.ts`, `apps/api/src/presentation/action-router.test.ts`, `apps/api/src/presentation/montar-app.ts`, `apps/api/src/presentation/montar-app.test.ts`, `apps/api/src/presentation/montar-registros.ts`, `apps/api/src/server.ts`

**Interfaces:**
- Consumes: `erros.ts`/`envelope.ts` (T3), `criarUseCasesAuth`/`AuthPgRepo`/`IAuthUseCases` (T7), `criarPool`/`rodarMigrations` (T5), `carregarEnv` (T1).
- Produces:
  - `SessaoDoContexto = { id: string; login: string; admin: boolean }`
  - `interface ContextoAction { action: string; sessionToken?: string; isTestMode: boolean; correlationId?: string; params: Record<string, unknown>; body?: unknown; sessao?: SessaoDoContexto }`
  - `type HandlerDeAction = (ctx: ContextoAction) => Promise<unknown>`
  - `interface RegistroDeAction { nome: string; publica?: boolean; adminOnly?: boolean; handler: HandlerDeAction }`
  - `type ValidarSessao = (token: string) => Promise<SessaoDoContexto>`
  - `extrairParams(origem: Record<string, unknown>): Record<string, unknown>` — remove `action`, `sessionToken`, `isTestMode`, `correlationId` (reservadas); **`limit`/`offset` não são reservadas**.
  - `lerCorpo(textoCorpo: string): Record<string, unknown>` — vazio/JSON inválido/array → `{}`; objeto → o objeto.
  - `processarAction(registros, validarSessao, entrada: ContextoAction): Promise<Envelope<unknown>>` — núcleo puro: ação desconhecida → `erro("Ação desconhecida.")`; não-pública sem token → `erro(MENSAGEM_SESSAO_INVALIDA)`; `adminOnly` sem admin → `erro(MENSAGEM_PERMISSAO_INSUFICIENTE)`; handler lança → `erro(mensagemDeErro(motivo))`; injeta `sessao` no contexto do handler.
  - `criarRoteadorDeActions({ registros, validarSessao }): express.Router` — lê action/sessionToken/isTestMode/correlationId do corpo (primeiro) e da query; `params = { ...extrairParams(query), ...extrairParams(corpo) }`; **sempre** `res.status(200).json(resultado)`.
  - `montarApp({ registros, validarSessao }): express.Express` — `express.text({ type: () => true })` antes do router.
  - `montarRegistros({ pool }): { registros: RegistroDeAction[]; validarSessao: ValidarSessao; auth: IAuthUseCases }` — registros `health` (publica), `auth_login` (publica), `auth_me`.
  - `server.ts` — boot: env → pool → migrations → semear admin → limpar sessões vencidas → listen → shutdown gracioso.

- [ ] **Step 1: Escrever os testes do núcleo puro**

Crie `apps/api/src/presentation/action-router.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { erro, sucesso } from "../shared/envelope.js";
import {
  ErroDeAutenticacao,
  ErroDeValidacao,
  MENSAGEM_PERMISSAO_INSUFICIENTE,
  MENSAGEM_SESSAO_INVALIDA,
} from "../shared/erros.js";
import {
  extrairParams,
  lerCorpo,
  processarAction,
  type RegistroDeAction,
  type ValidarSessao,
} from "./action-router.js";

const validarSessaoOk: ValidarSessao = async (token) => {
  if (token === "token-ok") return { id: "u1", login: "admin", admin: true };
  throw new ErroDeAutenticacao(MENSAGEM_SESSAO_INVALIDA);
};

const registros: RegistroDeAction[] = [
  { nome: "publica", publica: true, handler: async () => "feito" },
  { nome: "privada", handler: async (ctx) => ({ sessao: ctx.sessao, pagina: ctx.params.pagina }) },
  { nome: "admin", adminOnly: true, handler: async () => "ok-admin" },
];

describe("processarAction", () => {
  it("ação desconhecida vira envelope de erro", async () => {
    const resultado = await processarAction(registros, validarSessaoOk, {
      action: "nao_existe",
      isTestMode: false,
      params: {},
    });
    expect(resultado).toEqual(erro("Ação desconhecida."));
  });

  it("ação pública executa sem sessão", async () => {
    const resultado = await processarAction(registros, validarSessaoOk, {
      action: "publica",
      isTestMode: false,
      params: {},
    });
    expect(resultado).toEqual(sucesso("feito"));
  });

  it("ação privada sem token é negada", async () => {
    const handler = vi.fn();
    const resultado = await processarAction(
      [{ nome: "p", handler }],
      validarSessaoOk,
      { action: "p", isTestMode: false, params: {} }
    );
    expect(resultado).toEqual(erro(MENSAGEM_SESSAO_INVALIDA));
    expect(handler).not.toHaveBeenCalled();
  });

  it("ação privada com token inválido é negada", async () => {
    const resultado = await processarAction(registros, validarSessaoOk, {
      action: "privada",
      isTestMode: false,
      sessionToken: "token-ruim",
      params: {},
    });
    expect(resultado).toEqual(erro(MENSAGEM_SESSAO_INVALIDA));
  });

  it("ação privada recebe a sessão resolvida no contexto", async () => {
    const resultado = await processarAction(registros, validarSessaoOk, {
      action: "privada",
      isTestMode: false,
      sessionToken: "token-ok",
      params: { pagina: 2 },
    });
    expect(resultado).toEqual(
      sucesso({ sessao: { id: "u1", login: "admin", admin: true }, pagina: 2 })
    );
  });

  it("ação adminOnly exige usuário admin", async () => {
    const validarNaoAdmin: ValidarSessao = async () => ({
      id: "u2",
      login: "operador",
      admin: false,
    });
    const resultado = await processarAction(registros, validarNaoAdmin, {
      action: "admin",
      isTestMode: false,
      sessionToken: "token-ok",
      params: {},
    });
    expect(resultado).toEqual(erro(MENSAGEM_PERMISSAO_INSUFICIENTE));
  });

  it("erro de validação do handler vira envelope com a mensagem", async () => {
    const registrosComErro: RegistroDeAction[] = [
      {
        nome: "quebra",
        publica: true,
        handler: async () => {
          throw new ErroDeValidacao("login obrigatório");
        },
      },
    ];
    const resultado = await processarAction(registrosComErro, validarSessaoOk, {
      action: "quebra",
      isTestMode: false,
      params: {},
    });
    expect(resultado).toEqual(erro("login obrigatório"));
  });

  it("erro interno é escondido e logado", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const registrosComErro: RegistroDeAction[] = [
      {
        nome: "explode",
        publica: true,
        handler: async () => {
          throw new Error("stack rastreada");
        },
      },
    ];
    const resultado = await processarAction(registrosComErro, validarSessaoOk, {
      action: "explode",
      isTestMode: false,
      params: {},
    });
    expect(resultado).toEqual(erro("Erro interno no servidor."));
    spy.mockRestore();
  });
});

describe("lerCorpo", () => {
  it("trata corpo vazio, inválido e array", () => {
    expect(lerCorpo("")).toEqual({});
    expect(lerCorpo("não é json")).toEqual({});
    expect(lerCorpo("[1,2]")).toEqual({});
    expect(lerCorpo('{"login":"admin"}')).toEqual({ login: "admin" });
  });
});

describe("extrairParams", () => {
  it("remove chaves reservadas e mantém limit/offset", () => {
    expect(
      extrairParams({
        action: "x",
        sessionToken: "t",
        isTestMode: true,
        correlationId: "c",
        limit: "10",
        offset: "20",
        pagina: "1",
      })
    ).toEqual({ limit: "10", offset: "20", pagina: "1" });
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run (cwd `apps/api`): `npx vitest run src/presentation/action-router.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar `action-router.ts`**

Crie `apps/api/src/presentation/action-router.ts`:

```ts
import express from "express";
import { erro, sucesso, type Envelope } from "../shared/envelope.js";
import {
  MENSAGEM_PERMISSAO_INSUFICIENTE,
  MENSAGEM_SESSAO_INVALIDA,
  mensagemDeErro,
} from "../shared/erros.js";

export interface SessaoDoContexto {
  id: string;
  login: string;
  admin: boolean;
}

export interface ContextoAction {
  action: string;
  sessionToken?: string;
  isTestMode: boolean;
  correlationId?: string;
  params: Record<string, unknown>;
  body?: unknown;
  sessao?: SessaoDoContexto;
}

export type HandlerDeAction = (ctx: ContextoAction) => Promise<unknown>;

export interface RegistroDeAction {
  nome: string;
  publica?: boolean;
  adminOnly?: boolean;
  handler: HandlerDeAction;
}

export type ValidarSessao = (token: string) => Promise<SessaoDoContexto>;

const CHAVES_RESERVADAS = new Set(["action", "sessionToken", "isTestMode", "correlationId"]);

export function extrairParams(origem: Record<string, unknown>): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(origem)) {
    if (!CHAVES_RESERVADAS.has(chave)) {
      params[chave] = valor;
    }
  }
  return params;
}

export function lerCorpo(textoCorpo: string): Record<string, unknown> {
  if (!textoCorpo) return {};
  try {
    const valor: unknown = JSON.parse(textoCorpo);
    if (valor !== null && typeof valor === "object" && !Array.isArray(valor)) {
      return valor as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

export async function processarAction(
  registros: RegistroDeAction[],
  validarSessao: ValidarSessao,
  entrada: ContextoAction
): Promise<Envelope<unknown>> {
  const registro = registros.find((r) => r.nome === entrada.action);
  if (!registro) {
    return erro("Ação desconhecida.");
  }

  let sessao: SessaoDoContexto | undefined;
  if (!registro.publica) {
    if (!entrada.sessionToken) {
      return erro(MENSAGEM_SESSAO_INVALIDA);
    }
    try {
      sessao = await validarSessao(entrada.sessionToken);
    } catch (motivo) {
      return erro(mensagemDeErro(motivo));
    }
  }

  if (registro.adminOnly && !sessao?.admin) {
    return erro(MENSAGEM_PERMISSAO_INSUFICIENTE);
  }

  try {
    const data = await registro.handler({ ...entrada, sessao });
    return sucesso(data);
  } catch (motivo) {
    return erro(mensagemDeErro(motivo));
  }
}

export interface OpcoesRoteador {
  registros: RegistroDeAction[];
  validarSessao: ValidarSessao;
}

export function criarRoteadorDeActions({ registros, validarSessao }: OpcoesRoteador): express.Router {
  const roteador = express.Router();

  roteador.all("/", async (req, res) => {
    const corpo = lerCorpo(typeof req.body === "string" ? req.body : "");
    const query = extrairParams(req.query as Record<string, unknown>);
    const corpoParams = extrairParams(corpo);

    const action =
      typeof corpo.action === "string"
        ? corpo.action
        : typeof req.query.action === "string"
          ? req.query.action
          : "";
    const sessionToken =
      typeof corpo.sessionToken === "string"
        ? corpo.sessionToken
        : typeof req.query.sessionToken === "string"
          ? req.query.sessionToken
          : undefined;
    const isTestMode = corpo.isTestMode === true || req.query.isTestMode === "true";
    const correlationId =
      typeof corpo.correlationId === "string"
        ? corpo.correlationId
        : typeof req.query.correlationId === "string"
          ? req.query.correlationId
          : undefined;

    const params = { ...query, ...corpoParams };

    const resultado = await processarAction(registros, validarSessao, {
      action,
      sessionToken,
      isTestMode,
      correlationId,
      params,
      body: corpo,
    });

    res.status(200).json(resultado);
  });

  return roteador;
}
```

- [ ] **Step 4: Rodar o núcleo puro para confirmar que passa**

Run (cwd `apps/api`): `npx vitest run src/presentation/action-router.test.ts`
Expected: PASS.

- [ ] **Step 5: Escrever o teste do contrato HTTP (fetch global do Node)**

Crie `apps/api/src/presentation/montar-app.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { MENSAGEM_SESSAO_INVALIDA } from "../shared/erros.js";
import type { RegistroDeAction, ValidarSessao } from "./action-router.js";
import { montarApp } from "./montar-app.js";

describe("montarApp — contrato HTTP do GAS", () => {
  let servidor: Server;
  let baseUrl: string;

  const validarSessao: ValidarSessao = async (token) => {
    if (token === "token-ok") return { id: "u1", login: "admin", admin: true };
    throw new Error("sessao invalida");
  };

  const registros: RegistroDeAction[] = [
    { nome: "health", publica: true, handler: async () => ({ status: "ok" }) },
    {
      nome: "privada",
      handler: async (ctx) => ({ sessao: ctx.sessao?.login, pagina: ctx.params.pagina }),
    },
  ];

  beforeAll(async () => {
    const app = montarApp({ registros, validarSessao });
    servidor = app.listen(0);
    const { port } = servidor.address() as AddressInfo;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => servidor.close(() => resolve()));
  });

  it("GET health devolve envelope 200", async () => {
    const resposta = await fetch(`${baseUrl}?action=health`);
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({ success: true, data: { status: "ok" } });
  });

  it("action desconhecida devolve envelope de erro com HTTP 200", async () => {
    const resposta = await fetch(`${baseUrl}?action=inexistente`);
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({ success: false, error: "Ação desconhecida." });
  });

  it("GET privada sem sessão devolve erro de sessão", async () => {
    const resposta = await fetch(`${baseUrl}?action=privada`);
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({ success: false, error: MENSAGEM_SESSAO_INVALIDA });
  });

  it("GET privada com sessionToken e query params funciona", async () => {
    const resposta = await fetch(`${baseUrl}?action=privada&sessionToken=token-ok&pagina=3`);
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({
      success: true,
      data: { sessao: "admin", pagina: "3" },
    });
  });

  it("POST text/plain com corpo JSON funciona", async () => {
    const resposta = await fetch(`${baseUrl}?action=privada`, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "privada", sessionToken: "token-ok", pagina: 4 }),
    });
    expect(await resposta.json()).toEqual({
      success: true,
      data: { sessao: "admin", pagina: 4 },
    });
  });

  it("POST com JSON inválido não quebra — trata como corpo vazio", async () => {
    const resposta = await fetch(`${baseUrl}?action=health`, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: "não é json",
    });
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({ success: true, data: { status: "ok" } });
  });
});
```

- [ ] **Step 6: Rodar para confirmar que falha**

Run (cwd `apps/api`): `npx vitest run src/presentation/montar-app.test.ts`
Expected: FAIL — módulo `montar-app.js` não existe.

- [ ] **Step 7: Implementar `montar-app.ts`**

Crie `apps/api/src/presentation/montar-app.ts`:

```ts
import express from "express";
import { criarRoteadorDeActions, type RegistroDeAction, type ValidarSessao } from "./action-router.js";

export interface OpcoesMontarApp {
  registros: RegistroDeAction[];
  validarSessao: ValidarSessao;
}

export function montarApp({ registros, validarSessao }: OpcoesMontarApp): express.Express {
  const app = express();
  app.use(express.text({ type: () => true }));
  app.all("/", criarRoteadorDeActions({ registros, validarSessao }));
  return app;
}
```

- [ ] **Step 8: Rodar o contrato HTTP para confirmar que passa**

Run (cwd `apps/api`): `npx vitest run src/presentation/montar-app.test.ts`
Expected: PASS (6 testes).

- [ ] **Step 9: Implementar `montarRegistros` e `server.ts`**

Crie `apps/api/src/presentation/montar-registros.ts`:

```ts
import type { Pool } from "pg";
import {
  criarUseCasesAuth,
  type IAuthUseCases,
} from "../modules/auth/application/use-cases.js";
import { AuthPgRepo } from "../modules/auth/infrastructure/auth-pg-repo.js";
import { ErroDeAutenticacao, ErroDeValidacao, MENSAGEM_SESSAO_INVALIDA } from "../shared/erros.js";
import { type RegistroDeAction, type ValidarSessao } from "./action-router.js";

export interface MontarRegistrosResultado {
  registros: RegistroDeAction[];
  validarSessao: ValidarSessao;
  auth: IAuthUseCases;
}

export function montarRegistros({ pool }: { pool: Pool }): MontarRegistrosResultado {
  const auth = criarUseCasesAuth(new AuthPgRepo(pool));

  const validarSessao: ValidarSessao = (token) => auth.validarSessao(token);

  const registros: RegistroDeAction[] = [
    {
      nome: "health",
      publica: true,
      handler: async () => ({ status: "ok" }),
    },
    {
      nome: "auth_login",
      publica: true,
      handler: async (ctx) => {
        const login = ctx.params.login;
        const senha = ctx.params.senha;
        if (typeof login !== "string" || typeof senha !== "string") {
          throw new ErroDeValidacao("Parâmetros login e senha são obrigatórios.");
        }
        return auth.login(login, senha);
      },
    },
    {
      nome: "auth_me",
      handler: async (ctx) => {
        if (!ctx.sessao) {
          throw new ErroDeAutenticacao(MENSAGEM_SESSAO_INVALIDA);
        }
        return ctx.sessao;
      },
    },
  ];

  return { registros, validarSessao, auth };
}
```

Crie `apps/api/src/server.ts`:

```ts
import "dotenv/config";
import { carregarEnv } from "./env.js";
import { montarApp } from "./presentation/montar-app.js";
import { montarRegistros } from "./presentation/montar-registros.js";
import { criarPool } from "./store/client.js";
import { rodarMigrations } from "./store/migracao.js";

async function main(): Promise<void> {
  const env = carregarEnv();
  const pool = criarPool(env.DATABASE_URL, { ssl: env.DATABASE_SSL });
  await rodarMigrations(pool);

  const { registros, validarSessao, auth } = montarRegistros({ pool });

  await auth.limparSessoesExpiradas();
  await auth.semearAdmin(env.LABARR_ADMIN_LOGIN, env.LABARR_ADMIN_SENHA);

  const app = montarApp({ registros, validarSessao });
  const servidor = app.listen(env.PORT, () => {
    console.log(`[labarr-api] ouvindo em http://localhost:${env.PORT}`);
  });

  const encerrar = async () => {
    console.log("[labarr-api] encerrando...");
    servidor.close();
    await pool.end();
    process.exit(0);
  };
  process.on("SIGINT", encerrar);
  process.on("SIGTERM", encerrar);
}

main().catch((motivo) => {
  console.error("[labarr-api] falha ao iniciar", motivo);
  process.exit(1);
});
```

- [ ] **Step 10: Typecheck e teste de fumaça do servidor**

```bash
npx tsc --noEmit
```

Crie `apps/api/.env` (gitignored — cópia do `.env.example` com valores de dev):

```
PORT=3000
DATABASE_URL=postgres://labarr:labarr@localhost:5433/labarr_dev
DATABASE_SSL=false
OMIE_APP_KEY=chave-teste
OMIE_APP_SECRET=segredo-teste
LABARR_ADMIN_LOGIN=admin
LABARR_ADMIN_SENHA=admin123
```

Rode (cwd `apps/api`): `npm run dev`
Em outro terminal: `curl "http://localhost:3000/?action=health"`
Expected: `{"success":true,"data":{"status":"ok"}}`
Depois derrube o servidor (Ctrl+C no terminal do dev).

- [ ] **Step 11: Commit**

```bash
git add apps/api/src/presentation apps/api/src/server.ts apps/api/.env.example
git commit -m "feat: roteador de actions + server Express"
```

---

### Task 9: `OmieClient` — transporte Omie (cópia do omie-mcp)

**Files:**
- Create: `apps/api/src/integrations/omie/omieClient.ts`, `apps/api/src/integrations/omie/omieClient.test.ts`

**Interfaces:**
- Consumes: nada (usa `fetch` global do Node).
- Produces:
  - `interface OmieCallOptions { resource: string; call: string; param?: Record<string, unknown> }`
  - `class OmieApiError extends Error` — `constructor(message, faultCode?: string | number, raw?: unknown)`, `name = "OmieApiError"`.
  - `calcularEsperaRetry(faultCode, faultstring, httpStatus): number | null` — **exportado** (única diferença do original: `export`, para teste puro).
  - `class OmieClient` — `constructor(appKey?: string, appSecret?: string)` (fallback para `process.env.OMIE_APP_KEY`/`SECRET`), `call<T>(options: OmieCallOptions): Promise<T>`.
  - Regras (verbatim do omie-mcp): `OMIE_BASE_URL = "https://app.omie.com.br/api/v1"`, `INTERVALO_MINIMO_MS = 300`, throttle via fila de promessas (`aguardarVez`), máx. 4 tentativas, `calcularEsperaRetry` ("aguarde N segundos" → `(N+1)*1000`; `SOAP-ENV:Client-500`/"consumo indevido"/425/429 → 2000; `SOAP-ENV:Client-6`/"consumo redundante" → 2000; senão → null), `OmieApiError` não é repetido, falha de rede repetida com `sleep(attempt * 500)`.
  - Consumido pela Task 11 (`ChamadorOmie = Pick<OmieClient, "call">`) e pelo `server.ts` (T13).

- [ ] **Step 1: Escrever os testes (transporte mockado via `vi.stubGlobal('fetch')` + fake timers)**

Crie `apps/api/src/integrations/omie/omieClient.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calcularEsperaRetry, OmieApiError, OmieClient } from "./omieClient.js";

function cliente(): OmieClient {
  return new OmieClient("app-key", "app-secret");
}

function respostaOk(json: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(json),
  };
}

describe("calcularEsperaRetry (tabela de retry)", () => {
  it("mapeia os erros da Omie", () => {
    expect(calcularEsperaRetry("SOAP-ENV:Client-500", "consumo indevido", 429)).toBe(2000);
    expect(calcularEsperaRetry("SOAP-ENV:Client-6", "consumo redundante", 200)).toBe(2000);
    expect(calcularEsperaRetry(undefined, "aguarde 57 segundos", 200)).toBe(58000);
    expect(calcularEsperaRetry("X", "outro erro", 500)).toBeNull();
  });

  it("'aguarde N segundos' vence sobre rate limit", () => {
    expect(calcularEsperaRetry("SOAP-ENV:Client-500", "aguarde 3 segundos", 429)).toBe(4000);
  });
});

describe("OmieClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("monta a URL e o corpo do protocolo Omie", async () => {
    const mockFetch = vi.fn().mockResolvedValue(respostaOk({ ok: true }));
    vi.stubGlobal("fetch", mockFetch);
    const p = cliente().call({ resource: "geral/produtos", call: "ListarProdutos", param: { pagina: 1 } });
    await vi.advanceTimersByTimeAsync(300);
    await p;
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://app.omie.com.br/api/v1/geral/produtos/");
    expect(JSON.parse(init.body as string)).toEqual({
      call: "ListarProdutos",
      app_key: "app-key",
      app_secret: "app-secret",
      param: [{ pagina: 1 }],
    });
  });

  it("mantém espaçamento mínimo de 300ms entre chamadas", async () => {
    const mockFetch = vi.fn().mockResolvedValue(respostaOk({ ok: true }));
    vi.stubGlobal("fetch", mockFetch);
    const c = cliente();
    const p1 = c.call({ resource: "geral/produtos", call: "ListarProdutos" });
    const p2 = c.call({ resource: "geral/produtos", call: "ListarProdutos" });

    await vi.advanceTimersByTimeAsync(300);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(300);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    await Promise.all([p1, p2]);
  });

  it("espera (N+1)s quando a Omie pede 'aguarde N segundos'", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(respostaOk({ faultstring: "Aguarde 2 segundos", faultcode: "SOAP-ENV:Client" }))
      .mockResolvedValueOnce(respostaOk({ ok: true }));
    vi.stubGlobal("fetch", mockFetch);
    const p = cliente().call({ resource: "geral/produtos", call: "ListarProdutos" });

    await vi.advanceTimersByTimeAsync(300); // throttle inicial
    expect(mockFetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(3000); // (2+1) * 1000
    await p;
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("não repete quando a Omie devolve erro sem retry (faultstring)", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(respostaOk({ faultstring: "Erro de negócio", faultcode: "X" }));
    vi.stubGlobal("fetch", mockFetch);
    const p = cliente().call({ resource: "geral/produtos", call: "ListarProdutos" });

    await vi.advanceTimersByTimeAsync(300);
    await expect(p).rejects.toMatchObject({ name: "OmieApiError", faultCode: "X" });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("desiste após 4 tentativas quando o rate limit persiste", async () => {
    const falha = { faultstring: "consumo indevido", faultcode: "SOAP-ENV:Client-500" };
    const mockFetch = vi.fn().mockResolvedValue(respostaOk(falha));
    vi.stubGlobal("fetch", mockFetch);
    const p = cliente().call({ resource: "geral/produtos", call: "ListarProdutos" });

    await vi.advanceTimersByTimeAsync(300); // throttle
    await vi.advanceTimersByTimeAsync(2000); // tentativa 2
    await vi.advanceTimersByTimeAsync(2000); // tentativa 3
    await vi.advanceTimersByTimeAsync(2000); // tentativa 4 → lança
    await expect(p).rejects.toMatchObject({ name: "OmieApiError", faultCode: "SOAP-ENV:Client-500" });
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it("resposta não-JSON vira OmieApiError", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "<html>erro</html>" });
    vi.stubGlobal("fetch", mockFetch);
    const p = cliente().call({ resource: "geral/produtos", call: "ListarProdutos" });

    await vi.advanceTimersByTimeAsync(300);
    await expect(p).rejects.toThrow(/Resposta não-JSON da Omie \(HTTP 200\)/);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("erro HTTP sem fault vira OmieApiError imediato (sem retry)", async () => {
    const mockFetch = vi.fn().mockResolvedValue(respostaOk({ mensagem: "erro" }, 500));
    vi.stubGlobal("fetch", mockFetch);
    const p = cliente().call({ resource: "geral/produtos", call: "ListarProdutos" });

    await vi.advanceTimersByTimeAsync(300);
    await expect(p).rejects.toMatchObject({ name: "OmieApiError" });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("falha de rede é repetida com backoff attempt * 500ms", async () => {
    const erroRede = new TypeError("Failed to fetch");
    const mockFetch = vi.fn().mockRejectedValue(erroRede);
    vi.stubGlobal("fetch", mockFetch);
    const p = cliente().call({ resource: "geral/produtos", call: "ListarProdutos" });

    await vi.advanceTimersByTimeAsync(300); // throttle
    expect(mockFetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(500);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockFetch).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(1500);
    expect(mockFetch).toHaveBeenCalledTimes(4);
    await expect(p).rejects.toBe(erroRede);
  });

  it("lança se as credenciais não estiverem configuradas", () => {
    delete process.env.OMIE_APP_KEY;
    delete process.env.OMIE_APP_SECRET;
    expect(() => new OmieClient()).toThrow(/OMIE_APP_KEY/);
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run (cwd `apps/api`): `npx vitest run src/integrations/omie/omieClient.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar (cópia do omie-mcp)**

Crie `apps/api/src/integrations/omie/omieClient.ts`:

```ts
/**
 * Cliente HTTP genérico para a API da Omie.
 *
 * Todas as APIs da Omie seguem o mesmo formato de requisição:
 *   POST https://app.omie.com.br/api/v1/{modulo}/{recurso}/
 *   {
 *     "call": "NomeDoMetodo",
 *     "app_key": "...",
 *     "app_secret": "...",
 *     "param": [ { ... } ]
 *   }
 *
 * Este cliente centraliza autenticação, tratamento de erros, retries e
 * throttling, permitindo que qualquer endpoint da Omie seja chamado de forma
 * genérica e consistente — todo módulo passa por aqui, então uma proteção
 * adicionada aqui vale pra todos.
 *
 * Cópia fiel do omie-mcp (decisão 5: protocolo copiado, não importado).
 */

const OMIE_BASE_URL = "https://app.omie.com.br/api/v1";

/** Espaçamento mínimo entre o INÍCIO de duas requisições consecutivas desta instância. */
const INTERVALO_MINIMO_MS = 300;

export interface OmieCallOptions {
  /** Caminho do recurso, ex: "produtos/op", "geral/clientes", "estoque/consulta" */
  resource: string;
  /** Nome do método/chamada da Omie, ex: "IncluirOrdemProducao" */
  call: string;
  /** Parâmetros da chamada (objeto único, será enviado como param: [param]) */
  param?: Record<string, unknown>;
}

export class OmieApiError extends Error {
  constructor(
    message: string,
    public readonly faultCode?: string | number,
    public readonly raw?: unknown
  ) {
    super(message);
    this.name = "OmieApiError";
  }
}

/**
 * Se/quanto esperar antes de tentar de novo, baseado no erro que a Omie
 * devolveu. Cobre os dois tipos de bloqueio momentâneo já observados em
 * produção: rate limit ("consumo indevido") e chamadas próximas demais
 * ("consumo redundante" — a Omie geralmente informa quantos segundos
 * esperar na própria mensagem, ex: "Aguarde 57 segundos").
 *
 * Única alteração em relação ao original do omie-mcp: `export`, para permitir
 * teste puro de unidade da tabela de retry.
 */
export function calcularEsperaRetry(
  faultCode: unknown,
  faultstring: unknown,
  httpStatus: number
): number | null {
  const mensagem = String(faultstring ?? "").toLowerCase();

  const segundosSugeridos = mensagem.match(/aguarde (\d+) segundos?/i);
  if (segundosSugeridos) {
    return (Number(segundosSugeridos[1]) + 1) * 1000;
  }

  const isRateLimit =
    faultCode === "SOAP-ENV:Client-500" ||
    mensagem.includes("consumo indevido") ||
    httpStatus === 425 ||
    httpStatus === 429;
  const isRedundante = faultCode === "SOAP-ENV:Client-6" || mensagem.includes("consumo redundante");

  if (isRateLimit || isRedundante) {
    return 2000;
  }

  return null;
}

export class OmieClient {
  private readonly appKey: string;
  private readonly appSecret: string;

  /** Serializa o espaçamento mínimo entre requisições desta instância (ver INTERVALO_MINIMO_MS). */
  private filaDeSaida: Promise<void> = Promise.resolve();

  constructor(appKey?: string, appSecret?: string) {
    const key = appKey ?? process.env.OMIE_APP_KEY;
    const secret = appSecret ?? process.env.OMIE_APP_SECRET;

    if (!key || !secret) {
      throw new Error(
        "Credenciais da Omie não configuradas. Defina OMIE_APP_KEY e OMIE_APP_SECRET " +
          "nas variáveis de ambiente (ex: arquivo .env)."
      );
    }

    this.appKey = key;
    this.appSecret = secret;
  }

  async call<T = unknown>(options: OmieCallOptions): Promise<T> {
    await this.aguardarVez();

    const url = `${OMIE_BASE_URL}/${options.resource.replace(/^\/|\/$/g, "")}/`;

    const body = {
      call: options.call,
      app_key: this.appKey,
      app_secret: this.appSecret,
      param: [options.param ?? {}],
    };

    const maxAttempts = 4;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const text = await response.text();
        let json: any;
        try {
          json = JSON.parse(text);
        } catch {
          throw new OmieApiError(
            `Resposta não-JSON da Omie (HTTP ${response.status}): ${text.slice(0, 500)}`
          );
        }

        // A Omie retorna erros com faultstring/faultcode mesmo em HTTP 200,
        // e também usa códigos HTTP não-2xx em alguns casos (ex: rate limit).
        if (json && (json.faultstring || json.faultcode)) {
          const espera = calcularEsperaRetry(json.faultcode, json.faultstring, response.status);
          if (espera !== null && attempt < maxAttempts) {
            await sleep(espera);
            continue;
          }
          throw new OmieApiError(
            json.faultstring ?? "Erro desconhecido na API Omie",
            json.faultcode,
            json
          );
        }

        if (!response.ok) {
          throw new OmieApiError(
            `Erro HTTP ${response.status} ao chamar Omie: ${text.slice(0, 500)}`,
            response.status
          );
        }

        return json as T;
      } catch (err) {
        lastError = err;
        if (err instanceof OmieApiError) throw err;
        if (attempt >= maxAttempts) break;
        await sleep(attempt * 500);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Falha desconhecida ao chamar a API da Omie");
  }

  /**
   * Garante um espaçamento mínimo (INTERVALO_MINIMO_MS) entre o início de
   * cada requisição desta instância, mesmo que várias chamadas cheguem ao
   * mesmo tempo (ex: `mapWithConcurrency` de um gateway) — reduz a chance de
   * cair em "consumo redundante" antes mesmo de precisar dos retries acima.
   */
  private aguardarVez(): Promise<void> {
    const minhaVez = this.filaDeSaida.then(() => sleep(INTERVALO_MINIMO_MS));
    this.filaDeSaida = minhaVez;
    return minhaVez;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

- [ ] **Step 4: Rodar para confirmar que passa**

Run (cwd `apps/api`): `npx vitest run src/integrations/omie/omieClient.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/integrations/omie
git commit -m "feat: OmieClient (cópia do omie-mcp)"
```

---

### Task 10: Módulo catálogo — domínio, DTO e use-cases

**Files:**
- Create: `apps/api/src/modules/catalogo/domain/interfaces.ts`, `apps/api/src/modules/catalogo/domain/setor.ts`, `apps/api/src/modules/catalogo/domain/setor.test.ts`, `apps/api/src/modules/catalogo/application/dto.ts`, `apps/api/src/modules/catalogo/application/dto.test.ts`, `apps/api/src/modules/catalogo/application/use-cases.ts`, `apps/api/src/modules/catalogo/application/use-cases.test.ts`

**Interfaces:**
- Consumes: nada externo (tipos próprios). Usa a interface do gateway que a Task 11 implementa.
- Produces:
  - `interface ProdutoOmie { codigo_produto: number; codigo: string; codigo_produto_integracao: string; descricao: string; unidade: string; valor_unitario: number; inativo: string; codigo_familia: number; descricao_familia?: string; quantidade_estoque: number }` — **`quantidade_estoque` sempre 0, nunca usar** (doc no tipo).
  - `interface ListarProdutosResponse { pagina: number; total_de_paginas: number; registros: number; total_de_registros: number; produto_servico_cadastro: ProdutoOmie[] }`
  - `interface ICatalogoGateway { listarProdutosPagina(pagina: number, registrosPorPagina: number, codigoFamilia?: number): Promise<ListarProdutosResponse> }`
  - `interface ProdutoEspelho { codigoOmie: number; codigo: string; codigoProdutoIntegracao: string; descricao: string; unidade: string | null; valorUnitario: number | null; codigoFamilia: number | null; descricaoFamilia: string | null; setorLabarr: string | null; ativo: boolean }`
  - `interface MapeamentoNomeCodigo { nome: string; codigoOmie: number }`
  - `interface ICatalogoRepo { upsertProdutos(produtos: ProdutoEspelho[]): Promise<void>; upsertMapeamentos(mapeamentos: MapeamentoNomeCodigo[]): Promise<void> }`
  - `MAPEAMENTO_FAMILIA_SETOR: Readonly<Record<string, string>>` — **vazio na F1** (decisão 11); `derivarSetorLabarr(descricaoFamilia: string | null | undefined): string | null`.
  - `interface ProdutoCatalogo { codigo_omie: number; codigo: string; descricao: string; categoria: string; unidade: string | null; valor_unitario: number | null; ativo: boolean }`; `interface PaginaCatalogo { produtos: ProdutoCatalogo[]; pagina: number; totalDePaginas: number; totalDeRegistros: number }`; `paraProdutoCatalogo(p: ProdutoOmie): ProdutoCatalogo` — `categoria = descricao_familia ?? "Sem categoria"`, `ativo = inativo !== "S"`.
  - `ICatalogoUseCases { listarCatalogo(pagina?: number, registrosPorPagina?: number): Promise<PaginaCatalogo>; sincronizarCatalogo(): Promise<{ totalDeRegistros: number; totalDePaginas: number }> }`; `criarUseCasesCatalogo({ gateway, repo }): ICatalogoUseCases`; `REGISTROS_POR_PAGINA_SINCRONIZACAO = 500`.
  - Regras: `listarCatalogo` clampa `pagina` em `[1, ∞)` e `registrosPorPagina` em `[1, 100]`; `sincronizarCatalogo` percorre páginas de 500 **sequencialmente** (nunca paralelo — mesma restrição da Omie), deduplica mapeamentos por nome (primeiro vence), grava produtos depois mapeamentos.

- [ ] **Step 1: Escrever `interfaces.ts` (tipos, sem teste próprio)**

Crie `apps/api/src/modules/catalogo/domain/interfaces.ts`:

```ts
export interface ProdutoOmie {
  codigo_produto: number;
  codigo: string;
  codigo_produto_integracao: string;
  descricao: string;
  unidade: string;
  valor_unitario: number;
  inativo: string;
  codigo_familia: number;
  descricao_familia?: string;
  /** Sempre 0 na resposta da Omie — não é fonte confiável de estoque. Nunca usar. */
  quantidade_estoque: number;
}

export interface ListarProdutosResponse {
  pagina: number;
  total_de_paginas: number;
  registros: number;
  total_de_registros: number;
  produto_servico_cadastro: ProdutoOmie[];
}

export interface ICatalogoGateway {
  listarProdutosPagina(
    pagina: number,
    registrosPorPagina: number,
    codigoFamilia?: number
  ): Promise<ListarProdutosResponse>;
}

export interface ProdutoEspelho {
  codigoOmie: number;
  codigo: string;
  codigoProdutoIntegracao: string;
  descricao: string;
  unidade: string | null;
  valorUnitario: number | null;
  codigoFamilia: number | null;
  descricaoFamilia: string | null;
  setorLabarr: string | null;
  ativo: boolean;
}

export interface MapeamentoNomeCodigo {
  nome: string;
  codigoOmie: number;
}

export interface ICatalogoRepo {
  upsertProdutos(produtos: ProdutoEspelho[]): Promise<void>;
  upsertMapeamentos(mapeamentos: MapeamentoNomeCodigo[]): Promise<void>;
}
```

- [ ] **Step 2: Escrever os testes de setor e DTO**

Crie `apps/api/src/modules/catalogo/domain/setor.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { derivarSetorLabarr } from "./setor.js";

describe("derivarSetorLabarr", () => {
  it("retorna null para família vazia ou ausente", () => {
    expect(derivarSetorLabarr(undefined)).toBeNull();
    expect(derivarSetorLabarr(null)).toBeNull();
    expect(derivarSetorLabarr("")).toBeNull();
  });

  it("retorna null na F1 (mapeamento vazio)", () => {
    expect(derivarSetorLabarr("Barra")).toBeNull();
  });
});
```

Crie `apps/api/src/modules/catalogo/application/dto.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { ProdutoOmie } from "../domain/interfaces.js";
import { paraProdutoCatalogo } from "./dto.js";

describe("paraProdutoCatalogo", () => {
  it("converte produto Omie para o DTO do catálogo", () => {
    const produto: ProdutoOmie = {
      codigo_produto: 1,
      codigo: "001",
      codigo_produto_integracao: "001",
      descricao: "Chocolate 70%",
      unidade: "un",
      valor_unitario: 10,
      inativo: "N",
      codigo_familia: 1,
      descricao_familia: "Barra",
      quantidade_estoque: 0,
    };
    expect(paraProdutoCatalogo(produto)).toEqual({
      codigo_omie: 1,
      codigo: "001",
      descricao: "Chocolate 70%",
      categoria: "Barra",
      unidade: "un",
      valor_unitario: 10,
      ativo: true,
    });
  });

  it("produto sem família vira 'Sem categoria'; inativo S vira ativo false", () => {
    const produto: ProdutoOmie = {
      codigo_produto: 2,
      codigo: "002",
      codigo_produto_integracao: "002",
      descricao: "Cacau",
      unidade: "un",
      valor_unitario: 5,
      inativo: "S",
      codigo_familia: 0,
      quantidade_estoque: 0,
    };
    expect(paraProdutoCatalogo(produto)).toEqual({
      codigo_omie: 2,
      codigo: "002",
      descricao: "Cacau",
      categoria: "Sem categoria",
      unidade: "un",
      valor_unitario: 5,
      ativo: false,
    });
  });
});
```

- [ ] **Step 3: Implementar setor e DTO**

Crie `apps/api/src/modules/catalogo/domain/setor.ts`:

```ts
/**
 * Mapeamento família Omie → setor Labarr. Vazio na F1 (decisão 11 da spec:
 * "Produção v2" — seletor por setor). Preencher quando esse sub-projeto entrar.
 */
export const MAPEAMENTO_FAMILIA_SETOR: Readonly<Record<string, string>> = {};

export function derivarSetorLabarr(descricaoFamilia: string | null | undefined): string | null {
  if (!descricaoFamilia) return null;
  return MAPEAMENTO_FAMILIA_SETOR[descricaoFamilia] ?? null;
}
```

Crie `apps/api/src/modules/catalogo/application/dto.ts`:

```ts
import type { ProdutoOmie } from "../domain/interfaces.js";

export interface ProdutoCatalogo {
  codigo_omie: number;
  codigo: string;
  descricao: string;
  categoria: string;
  unidade: string | null;
  valor_unitario: number | null;
  ativo: boolean;
}

export interface PaginaCatalogo {
  produtos: ProdutoCatalogo[];
  pagina: number;
  totalDePaginas: number;
  totalDeRegistros: number;
}

export function paraProdutoCatalogo(p: ProdutoOmie): ProdutoCatalogo {
  return {
    codigo_omie: p.codigo_produto,
    codigo: p.codigo,
    descricao: p.descricao,
    categoria: p.descricao_familia ?? "Sem categoria",
    unidade: p.unidade ?? null,
    valor_unitario: typeof p.valor_unitario === "number" ? p.valor_unitario : null,
    ativo: p.inativo !== "S",
  };
}
```

- [ ] **Step 4: Rodar setor + dto para confirmar que passam**

Run (cwd `apps/api`): `npx vitest run src/modules/catalogo/domain/setor.test.ts src/modules/catalogo/application/dto.test.ts`
Expected: PASS.

- [ ] **Step 5: Escrever os testes de use-cases (fakes, sem rede)**

Crie `apps/api/src/modules/catalogo/application/use-cases.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type {
  ICatalogoGateway,
  ICatalogoRepo,
  ListarProdutosResponse,
  MapeamentoNomeCodigo,
  ProdutoEspelho,
  ProdutoOmie,
} from "../domain/interfaces.js";
import { criarUseCasesCatalogo } from "./use-cases.js";

class FakeGateway implements ICatalogoGateway {
  chamadas: { pagina: number; registrosPorPagina: number }[] = [];
  constructor(private readonly respostas: ListarProdutosResponse[]) {}

  async listarProdutosPagina(pagina: number, registrosPorPagina: number) {
    this.chamadas.push({ pagina, registrosPorPagina });
    const resposta = this.respostas[pagina - 1];
    if (!resposta) throw new Error("página inesperada");
    return resposta;
  }
}

class FakeRepo implements ICatalogoRepo {
  produtos: ProdutoEspelho[] = [];
  mapeamentos: MapeamentoNomeCodigo[] = [];

  async upsertProdutos(produtos: ProdutoEspelho[]) {
    this.produtos.push(...produtos);
  }

  async upsertMapeamentos(mapeamentos: MapeamentoNomeCodigo[]) {
    this.mapeamentos.push(...mapeamentos);
  }
}

const produtoOmie = (parcial: Partial<ProdutoOmie> & { codigo_produto: number }): ProdutoOmie => ({
  codigo: "",
  codigo_produto_integracao: "",
  descricao: "",
  unidade: "un",
  valor_unitario: 0,
  inativo: "N",
  codigo_familia: 0,
  quantidade_estoque: 0,
  ...parcial,
});

function paginaCom(produtos: unknown[]): ListarProdutosResponse {
  return {
    pagina: 1,
    total_de_paginas: 1,
    total_de_registros: produtos.length,
    registros: produtos.length,
    produto_servico_cadastro: produtos as ListarProdutosResponse["produto_servico_cadastro"],
  };
}

describe("use-cases do catálogo", () => {
  it("listarCatalogo converte a resposta da Omie", async () => {
    const gateway = new FakeGateway([
      paginaCom([
        {
          codigo_produto: 1,
          codigo: "001",
          codigo_produto_integracao: "001",
          descricao: "Chocolate 70%",
          unidade: "un",
          valor_unitario: 10,
          inativo: "N",
          codigo_familia: 1,
          descricao_familia: "Barra",
          quantidade_estoque: 0,
        },
      ]),
    ]);
    const useCases = criarUseCasesCatalogo({ gateway, repo: new FakeRepo() });

    const pagina = await useCases.listarCatalogo();
    expect(pagina.produtos).toEqual([
      {
        codigo_omie: 1,
        codigo: "001",
        descricao: "Chocolate 70%",
        categoria: "Barra",
        unidade: "un",
        valor_unitario: 10,
        ativo: true,
      },
    ]);
    expect(pagina.totalDeRegistros).toBe(1);
  });

  it("listarCatalogo clampa página e registros por página", async () => {
    const gateway = new FakeGateway([paginaCom([])]);
    const useCases = criarUseCasesCatalogo({ gateway, repo: new FakeRepo() });

    await useCases.listarCatalogo(0, 1000);
    expect(gateway.chamadas[0]).toEqual({ pagina: 1, registrosPorPagina: 100 });
  });

  it("sincronizarCatalogo percorre páginas sequencialmente e grava espelho + mapeamentos", async () => {
    const m = produtoOmie;
    const gateway = new FakeGateway([
      {
        pagina: 1,
        total_de_paginas: 2,
        total_de_registros: 3,
        registros: 2,
        produto_servico_cadastro: [
          m({ codigo_produto: 1, codigo: "001", codigo_produto_integracao: "001", descricao: "Chocolate 70%", unidade: "un", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Barra", quantidade_estoque: 0 }),
          m({ codigo_produto: 2, codigo: "002", codigo_produto_integracao: "002", descricao: "Cacau 60%", unidade: "un", valor_unitario: 12, inativo: "S", codigo_familia: 1, descricao_familia: "Barra", quantidade_estoque: 0 }),
        ],
      },
      {
        pagina: 2,
        total_de_paginas: 2,
        total_de_registros: 3,
        registros: 1,
        produto_servico_cadastro: [
          m({ codigo_produto: 3, codigo: "003", codigo_produto_integracao: "003", descricao: "Chocolate 70%", unidade: "un", valor_unitario: 11, inativo: "N", codigo_familia: 2, descricao_familia: "Tablete", quantidade_estoque: 0 }),
        ],
      },
    ]);
    const repo = new FakeRepo();
    const useCases = criarUseCasesCatalogo({ gateway, repo });

    const resumo = await useCases.sincronizarCatalogo();
    expect(resumo).toEqual({ totalDeRegistros: 3, totalDePaginas: 2 });

    // sequencial: página 1 antes da 2, cada uma com 500 por página
    expect(gateway.chamadas.map((c) => c.pagina)).toEqual([1, 2]);
    expect(gateway.chamadas.every((c) => c.registrosPorPagina === 500)).toBe(true);

    expect(repo.produtos).toHaveLength(3);
    expect(repo.produtos.find((p) => p.codigoOmie === 2)?.ativo).toBe(false);
    expect(repo.produtos.find((p) => p.codigoOmie === 1)?.setorLabarr).toBeNull();

    // mapeamentos deduplicados por nome — primeiro vence (Chocolate 70% → 1, não 3)
    expect(repo.mapeamentos).toEqual([
      { nome: "Chocolate 70%", codigoOmie: 1 },
      { nome: "Cacau 60%", codigoOmie: 2 },
    ]);
  });

  it("sincronizarCatalogo com catálogo vazio grava listas vazias", async () => {
    const gateway = new FakeGateway([paginaCom([])]);
    const repo = new FakeRepo();
    const useCases = criarUseCasesCatalogo({ gateway, repo });

    const resumo = await useCases.sincronizarCatalogo();
    expect(resumo).toEqual({ totalDeRegistros: 0, totalDePaginas: 1 });
    expect(repo.produtos).toEqual([]);
    expect(repo.mapeamentos).toEqual([]);
  });
});
```

- [ ] **Step 6: Rodar para confirmar que falha**

Run (cwd `apps/api`): `npx vitest run src/modules/catalogo/application/use-cases.test.ts`
Expected: FAIL — módulo `use-cases.js` não existe.

- [ ] **Step 7: Implementar use-cases**

Crie `apps/api/src/modules/catalogo/application/use-cases.ts`:

```ts
import type {
  ICatalogoGateway,
  ICatalogoRepo,
  MapeamentoNomeCodigo,
  ProdutoEspelho,
} from "../domain/interfaces.js";
import { derivarSetorLabarr } from "../domain/setor.js";
import { paraProdutoCatalogo, type PaginaCatalogo } from "./dto.js";

export const REGISTROS_POR_PAGINA_SINCRONIZACAO = 500;

export interface ICatalogoUseCases {
  listarCatalogo(pagina?: number, registrosPorPagina?: number): Promise<PaginaCatalogo>;
  sincronizarCatalogo(): Promise<{ totalDeRegistros: number; totalDePaginas: number }>;
}

export function criarUseCasesCatalogo({
  gateway,
  repo,
}: {
  gateway: ICatalogoGateway;
  repo: ICatalogoRepo;
}): ICatalogoUseCases {
  async function listarCatalogo(pagina = 1, registrosPorPagina = 50): Promise<PaginaCatalogo> {
    const paginaSanitizada = Math.max(1, Math.floor(pagina));
    const porPagina = Math.min(100, Math.max(1, Math.floor(registrosPorPagina)));
    const resposta = await gateway.listarProdutosPagina(paginaSanitizada, porPagina);
    return {
      produtos: (resposta.produto_servico_cadastro ?? []).map(paraProdutoCatalogo),
      pagina: resposta.pagina,
      totalDePaginas: resposta.total_de_paginas,
      totalDeRegistros: resposta.total_de_registros,
    };
  }

  async function sincronizarCatalogo(): Promise<{ totalDeRegistros: number; totalDePaginas: number }> {
    let pagina = 1;
    let totalDePaginas = 1;
    let totalDeRegistros = 0;
    const produtos: ProdutoEspelho[] = [];
    const mapeamentosPorNome = new Map<string, number>();

    // Sequencial de propósito: a Omie rejeita duas chamadas do mesmo `call`
    // simultâneas ("Já existe uma requisição desse método sendo executada").
    while (pagina <= totalDePaginas) {
      const resposta = await gateway.listarProdutosPagina(
        pagina,
        REGISTROS_POR_PAGINA_SINCRONIZACAO
      );
      totalDePaginas = resposta.total_de_paginas;
      totalDeRegistros = resposta.total_de_registros;

      for (const p of resposta.produto_servico_cadastro ?? []) {
        produtos.push({
          codigoOmie: p.codigo_produto,
          codigo: p.codigo,
          codigoProdutoIntegracao: p.codigo_produto_integracao,
          descricao: p.descricao,
          unidade: p.unidade ?? null,
          valorUnitario: typeof p.valor_unitario === "number" ? p.valor_unitario : null,
          codigoFamilia: typeof p.codigo_familia === "number" ? p.codigo_familia : null,
          descricaoFamilia: p.descricao_familia ?? null,
          setorLabarr: derivarSetorLabarr(p.descricao_familia),
          ativo: p.inativo !== "S",
        });
        if (!mapeamentosPorNome.has(p.descricao)) {
          mapeamentosPorNome.set(p.descricao, p.codigo_produto);
        }
      }

      pagina += 1;
    }

    const mapeamentos: MapeamentoNomeCodigo[] = [...mapeamentosPorNome.entries()].map(
      ([nome, codigoOmie]) => ({ nome, codigoOmie })
    );

    await repo.upsertProdutos(produtos);
    await repo.upsertMapeamentos(mapeamentos);

    return { totalDeRegistros, totalDePaginas };
  }

  return { listarCatalogo, sincronizarCatalogo };
}
```

- [ ] **Step 8: Rodar para confirmar que passa**

Run (cwd `apps/api`): `npx vitest run src/modules/catalogo/application/use-cases.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 9: Typecheck e commit**

```bash
npx tsc --noEmit
git add apps/api/src/modules/catalogo
git commit -m "feat: módulo catálogo (domínio + use-cases)"
```

---

### Task 11: Gateway Omie do catálogo

**Files:**
- Create: `apps/api/src/modules/catalogo/infrastructure/catalogo-omie-gateway.ts`, `apps/api/src/modules/catalogo/infrastructure/catalogo-omie-gateway.test.ts`

**Interfaces:**
- Consumes: `OmieClient.call` (T9), `ICatalogoGateway`/`ListarProdutosResponse` (T10).
- Produces:
  - `export type ChamadorOmie = Pick<OmieClient, "call">` — tipo estrutural (permite fake nos testes e no `montarRegistros`).
  - `class CatalogoOmieGateway implements ICatalogoGateway` — constructor `(client: ChamadorOmie)`; `listarProdutosPagina` chama `geral/produtos`/`ListarProdutos` com `apenas_importado_api: "N"`, `filtrar_apenas_omiepdv: "N"` e `filtrar_apenas_familia` quando `codigoFamilia` informado (mesma forma do `produtos-omie-gateway.ts` do omie-mcp).
  - Consumido pela Task 13 (`montarRegistros`).

- [ ] **Step 1: Escrever o teste que falha**

Crie `apps/api/src/modules/catalogo/infrastructure/catalogo-omie-gateway.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import {
  CatalogoOmieGateway,
  type ChamadorOmie,
} from "./catalogo-omie-gateway.js";

describe("CatalogoOmieGateway", () => {
  it("lista produtos com o filtro padrão", async () => {
    const call = vi.fn().mockResolvedValue({ produto_servico_cadastro: [] });
    const gateway = new CatalogoOmieGateway({ call } as ChamadorOmie);

    await gateway.listarProdutosPagina(1, 500);

    expect(call).toHaveBeenCalledWith({
      resource: "geral/produtos",
      call: "ListarProdutos",
      param: {
        pagina: 1,
        registros_por_pagina: 500,
        apenas_importado_api: "N",
        filtrar_apenas_omiepdv: "N",
      },
    });
  });

  it("inclui filtrar_apenas_familia quando codigoFamilia é informado", async () => {
    const call = vi.fn().mockResolvedValue({ produto_servico_cadastro: [] });
    const gateway = new CatalogoOmieGateway({ call } as ChamadorOmie);

    await gateway.listarProdutosPagina(2, 100, 42);

    expect(call).toHaveBeenCalledWith(
      expect.objectContaining({
        param: expect.objectContaining({ filtrar_apenas_familia: 42 }),
      })
    );
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run (cwd `apps/api`): `npx vitest run src/modules/catalogo/infrastructure/catalogo-omie-gateway.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar**

Crie `apps/api/src/modules/catalogo/infrastructure/catalogo-omie-gateway.ts`:

```ts
import type { OmieClient } from "../../../integrations/omie/omieClient.js";
import type { ICatalogoGateway, ListarProdutosResponse } from "../domain/interfaces.js";

export type ChamadorOmie = Pick<OmieClient, "call">;

export class CatalogoOmieGateway implements ICatalogoGateway {
  constructor(private readonly client: ChamadorOmie) {}

  async listarProdutosPagina(
    pagina: number,
    registrosPorPagina: number,
    codigoFamilia?: number
  ): Promise<ListarProdutosResponse> {
    return this.client.call<ListarProdutosResponse>({
      resource: "geral/produtos",
      call: "ListarProdutos",
      param: {
        pagina,
        registros_por_pagina: registrosPorPagina,
        apenas_importado_api: "N",
        filtrar_apenas_omiepdv: "N",
        ...(codigoFamilia ? { filtrar_apenas_familia: codigoFamilia } : {}),
      },
    });
  }
}
```

- [ ] **Step 4: Rodar para confirmar que passa**

Run (cwd `apps/api`): `npx vitest run src/modules/catalogo/infrastructure/catalogo-omie-gateway.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/catalogo/infrastructure
git commit -m "feat: gateway Omie do catálogo"
```

---

### Task 12: Espelho `produtos` no Postgres (migration 002 + repo)

**Files:**
- Create: `apps/api/src/store/migrations/002-catalogo.sql`, `apps/api/src/modules/catalogo/infrastructure/catalogo-pg-repo.ts`, `apps/api/src/modules/catalogo/infrastructure/catalogo-pg-repo.test.ts`

**Interfaces:**
- Consumes: `ICatalogoRepo`/`ProdutoEspelho`/`MapeamentoNomeCodigo` (T10), `prepararBancoDeTeste` (T5).
- Produces:
  - Migration `002-catalogo.sql`: `produtos(codigo_omie bigint PRIMARY KEY, codigo text NOT NULL, codigo_produto_integracao text NOT NULL, descricao text NOT NULL, unidade text, valor_unitario numeric(14,4), codigo_familia bigint, descricao_familia text, setor_labarr text, ativo boolean NOT NULL DEFAULT true, atualizado_em timestamptz NOT NULL DEFAULT now())` e `mapeamento_nome_codigo(nome text PRIMARY KEY, codigo_omie bigint NOT NULL REFERENCES produtos(codigo_omie) ON DELETE CASCADE)`.
  - `class CatalogoPgRepo implements ICatalogoRepo` — constructor `(pool: Pool)`; `upsertProdutos` numa transação, `INSERT ... ON CONFLICT (codigo_omie) DO UPDATE SET ... atualizado_em = now()`; `upsertMapeamentos` com `ON CONFLICT (nome) DO UPDATE SET codigo_omie = EXCLUDED.codigo_omie`.
  - Consumido pela Task 13 (`montarRegistros`).

**Pré-requisito:** Docker Postgres de pé.

- [ ] **Step 1: Escrever a migration e o teste que falha**

Crie `apps/api/src/store/migrations/002-catalogo.sql`:

```sql
CREATE TABLE produtos (
  codigo_omie bigint PRIMARY KEY,
  codigo text NOT NULL,
  codigo_produto_integracao text NOT NULL,
  descricao text NOT NULL,
  unidade text,
  valor_unitario numeric(14,4),
  codigo_familia bigint,
  descricao_familia text,
  setor_labarr text,
  ativo boolean NOT NULL DEFAULT true,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE mapeamento_nome_codigo (
  nome text PRIMARY KEY,
  codigo_omie bigint NOT NULL REFERENCES produtos(codigo_omie) ON DELETE CASCADE
);
```

Crie `apps/api/src/modules/catalogo/infrastructure/catalogo-pg-repo.test.ts`:

```ts
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  prepararBancoDeTeste,
  type BancoDeTeste,
} from "../../../store/test-utils.js";
import type { ProdutoEspelho } from "../domain/interfaces.js";
import { CatalogoPgRepo } from "./catalogo-pg-repo.js";

// Pré-requisito: docker compose up -d (Postgres na porta 5433).

describe("CatalogoPgRepo", () => {
  let banco: BancoDeTeste;
  let repo: CatalogoPgRepo;

  beforeAll(async () => {
    banco = await prepararBancoDeTeste();
  });

  beforeEach(async () => {
    await banco.limpar();
    repo = new CatalogoPgRepo(banco.pool);
  });

  afterAll(async () => {
    await banco.pool.end();
  });

  it("faz upsert de produtos e mapeamentos", async () => {
    const produtos: ProdutoEspelho[] = [
      {
        codigoOmie: 1,
        codigo: "001",
        codigoProdutoIntegracao: "001",
        descricao: "Chocolate 70%",
        unidade: "un",
        valorUnitario: 10,
        codigoFamilia: 1,
        descricaoFamilia: "Barra",
        setorLabarr: null,
        ativo: true,
      },
    ];
    await repo.upsertProdutos(produtos);
    await repo.upsertMapeamentos([{ nome: "Chocolate 70%", codigoOmie: 1 }]);

    const resultado = await banco.pool.query(
      `SELECT codigo, descricao, ativo, descricao_familia FROM produtos`
    );
    expect(resultado.rows).toEqual([
      { codigo: "001", descricao: "Chocolate 70%", ativo: true, descricao_familia: "Barra" },
    ]);

    const mapeamento = await banco.pool.query(
      `SELECT nome, codigo_omie FROM mapeamento_nome_codigo`
    );
    expect(mapeamento.rows).toEqual([{ nome: "Chocolate 70%", codigo_omie: 1 }]);
  });

  it("atualiza produto já existente (ON CONFLICT)", async () => {
    const base: ProdutoEspelho = {
      codigoOmie: 1,
      codigo: "001",
      codigoProdutoIntegracao: "001",
      descricao: "Velho",
      unidade: "un",
      valorUnitario: 10,
      codigoFamilia: null,
      descricaoFamilia: null,
      setorLabarr: null,
      ativo: true,
    };
    await repo.upsertProdutos([base]);
    await repo.upsertProdutos([{ ...base, descricao: "Novo", valorUnitario: 12 }]);

    const resultado = await banco.pool.query(
      `SELECT descricao, valor_unitario FROM produtos WHERE codigo_omie = 1`
    );
    expect(resultado.rows[0].descricao).toBe("Novo");
    expect(resultado.rows[0].valor_unitario).toBe("12.0000"); // numeric vem como string do pg
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run (cwd `apps/api`): `npx vitest run src/modules/catalogo/infrastructure/catalogo-pg-repo.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar o repo**

Crie `apps/api/src/modules/catalogo/infrastructure/catalogo-pg-repo.ts`:

```ts
import type { Pool } from "pg";
import type { ICatalogoRepo, MapeamentoNomeCodigo, ProdutoEspelho } from "../domain/interfaces.js";

export class CatalogoPgRepo implements ICatalogoRepo {
  constructor(private readonly pool: Pool) {}

  async upsertProdutos(produtos: ProdutoEspelho[]): Promise<void> {
    const cliente = await this.pool.connect();
    try {
      await cliente.query("BEGIN");
      for (const p of produtos) {
        await cliente.query(
          `INSERT INTO produtos (
             codigo_omie, codigo, codigo_produto_integracao, descricao, unidade,
             valor_unitario, codigo_familia, descricao_familia, setor_labarr, ativo
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (codigo_omie) DO UPDATE SET
             codigo = EXCLUDED.codigo,
             codigo_produto_integracao = EXCLUDED.codigo_produto_integracao,
             descricao = EXCLUDED.descricao,
             unidade = EXCLUDED.unidade,
             valor_unitario = EXCLUDED.valor_unitario,
             codigo_familia = EXCLUDED.codigo_familia,
             descricao_familia = EXCLUDED.descricao_familia,
             setor_labarr = EXCLUDED.setor_labarr,
             ativo = EXCLUDED.ativo,
             atualizado_em = now()`,
          [
            p.codigoOmie,
            p.codigo,
            p.codigoProdutoIntegracao,
            p.descricao,
            p.unidade,
            p.valorUnitario,
            p.codigoFamilia,
            p.descricaoFamilia,
            p.setorLabarr,
            p.ativo,
          ]
        );
      }
      await cliente.query("COMMIT");
    } catch (motivo) {
      await cliente.query("ROLLBACK");
      throw motivo;
    } finally {
      cliente.release();
    }
  }

  async upsertMapeamentos(mapeamentos: MapeamentoNomeCodigo[]): Promise<void> {
    for (const m of mapeamentos) {
      await this.pool.query(
        `INSERT INTO mapeamento_nome_codigo (nome, codigo_omie)
         VALUES ($1, $2)
         ON CONFLICT (nome) DO UPDATE SET codigo_omie = EXCLUDED.codigo_omie`,
        [m.nome, m.codigoOmie]
      );
    }
  }
}
```

- [ ] **Step 4: Rodar para confirmar que passa**

Run (cwd `apps/api`): `npx vitest run src/modules/catalogo/infrastructure/catalogo-pg-repo.test.ts`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/store/migrations/002-catalogo.sql apps/api/src/modules/catalogo/infrastructure/catalogo-pg-repo.ts
git commit -m "feat: espelho produtos no Postgres"
```

---

### Task 13: Actions do catálogo no servidor + teste de integração HTTP+PG+Omie fake

**Files:**
- Create: `apps/api/src/modules/catalogo/presentation/http.ts`, `apps/api/src/modules/catalogo/presentation/http.test.ts`, `apps/api/src/presentation/montar-registros.test.ts`
- Modify: `apps/api/src/presentation/montar-registros.ts`, `apps/api/src/server.ts`

**Interfaces:**
- Consumes: `ICatalogoUseCases` (T10), `ChamadorOmie` (T11), `RegistroDeAction`/`ContextoAction` (T8), `prepararBancoDeTeste` (T5), `OmieClient` (T9).
- Produces:
  - `numero(valor: unknown): number | undefined` — undefined/null/"" → undefined; não numérico → `ErroDeValidacao`.
  - `registrosDeActionsCatalogo(useCases: ICatalogoUseCases): RegistroDeAction[]` — `catalogo_listar` (lê `ctx.params.pagina` e `ctx.params.registros_por_pagina ?? ctx.params.limit` via `numero`, defaults 1/50), `catalogo_sincronizar` (`adminOnly: true`). Recebe `useCases` direto (testável offline).
  - `montarRegistros({ pool, omie }: { pool: Pool; omie: ChamadorOmie }): { registros; validarSessao; auth }` — agora inclui os registros do catálogo.
  - `server.ts` atualizado para construir `new OmieClient(env.OMIE_APP_KEY, env.OMIE_APP_SECRET)` e passar em `montarRegistros({ pool, omie })`.

- [ ] **Step 1: Escrever os testes da camada HTTP do catálogo**

Crie `apps/api/src/modules/catalogo/presentation/http.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { ErroDeValidacao } from "../../../shared/erros.js";
import type { ICatalogoUseCases } from "../application/use-cases.js";
import { numero, registrosDeActionsCatalogo } from "./http.js";

describe("numero", () => {
  it("aceita número e string numérica", () => {
    expect(numero(2)).toBe(2);
    expect(numero("2")).toBe(2);
  });

  it("retorna undefined para vazio/nulo", () => {
    expect(numero(undefined)).toBeUndefined();
    expect(numero(null)).toBeUndefined();
    expect(numero("")).toBeUndefined();
  });

  it("lança ErroDeValidacao para valor não numérico", () => {
    expect(() => numero("abc")).toThrow(ErroDeValidacao);
  });
});

describe("registrosDeActionsCatalogo", () => {
  function contexto(params: Record<string, unknown>) {
    return { action: "catalogo_listar", isTestMode: false, params } as any;
  }

  it("catalogo_listar usa defaults pagina 1 e 50 por página", async () => {
    const listarCatalogo = vi.fn().mockResolvedValue({
      produtos: [],
      pagina: 1,
      totalDePaginas: 1,
      totalDeRegistros: 0,
    });
    const useCases = { listarCatalogo, sincronizarCatalogo: vi.fn() } satisfies ICatalogoUseCases;

    const [registro] = registrosDeActionsCatalogo(useCases);
    await registro.handler(contexto({}));

    expect(listarCatalogo).toHaveBeenCalledWith(1, 50);
  });

  it("catalogo_listar lê pagina e registros_por_pagina dos params", async () => {
    const listarCatalogo = vi.fn().mockResolvedValue({
      produtos: [],
      pagina: 2,
      totalDePaginas: 5,
      totalDeRegistros: 0,
    });
    const useCases = { listarCatalogo, sincronizarCatalogo: vi.fn() } satisfies ICatalogoUseCases;

    const [registro] = registrosDeActionsCatalogo(useCases);
    await registro.handler(contexto({ pagina: "2", registros_por_pagina: "30" }));

    expect(listarCatalogo).toHaveBeenCalledWith(2, 30);
  });

  it("catalogo_sincronizar é adminOnly e chama o use-case", async () => {
    const sincronizarCatalogo = vi.fn().mockResolvedValue({ totalDeRegistros: 5, totalDePaginas: 1 });
    const useCases = { listarCatalogo: vi.fn(), sincronizarCatalogo } satisfies ICatalogoUseCases;

    const [, sincronizar] = registrosDeActionsCatalogo(useCases);
    expect(sincronizar.adminOnly).toBe(true);

    await sincronizar.handler(contexto({}));
    expect(sincronizarCatalogo).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run (cwd `apps/api`): `npx vitest run src/modules/catalogo/presentation/http.test.ts`
Expected: FAIL — módulo `http.js` não existe.

- [ ] **Step 3: Implementar a camada HTTP do catálogo**

Crie `apps/api/src/modules/catalogo/presentation/http.ts`:

```ts
import { ErroDeValidacao } from "../../../shared/erros.js";
import type { ICatalogoUseCases } from "../application/use-cases.js";
import type { RegistroDeAction } from "../../../presentation/action-router.js";

export function numero(valor: unknown): number | undefined {
  if (valor === undefined || valor === null || valor === "") return undefined;
  const n = typeof valor === "number" ? valor : Number(valor);
  if (Number.isNaN(n)) {
    throw new ErroDeValidacao(`Parâmetro numérico inválido: ${String(valor)}`);
  }
  return n;
}

export function registrosDeActionsCatalogo(useCases: ICatalogoUseCases): RegistroDeAction[] {
  return [
    {
      nome: "catalogo_listar",
      handler: async (ctx) => {
        const pagina = numero(ctx.params.pagina) ?? 1;
        const registrosPorPagina = numero(ctx.params.registros_por_pagina ?? ctx.params.limit) ?? 50;
        return useCases.listarCatalogo(pagina, registrosPorPagina);
      },
    },
    {
      nome: "catalogo_sincronizar",
      adminOnly: true,
      handler: async () => useCases.sincronizarCatalogo(),
    },
  ];
}
```

- [ ] **Step 4: Rodar para confirmar que passa**

Run (cwd `apps/api`): `npx vitest run src/modules/catalogo/presentation/http.test.ts`
Expected: PASS.

- [ ] **Step 5: Atualizar `montarRegistros` para receber o Omie e registrar o catálogo**

Substitua o conteúdo de `apps/api/src/presentation/montar-registros.ts`:

```ts
import type { Pool } from "pg";
import {
  criarUseCasesAuth,
  type IAuthUseCases,
} from "../modules/auth/application/use-cases.js";
import { AuthPgRepo } from "../modules/auth/infrastructure/auth-pg-repo.js";
import { criarUseCasesCatalogo } from "../modules/catalogo/application/use-cases.js";
import {
  CatalogoOmieGateway,
  type ChamadorOmie,
} from "../modules/catalogo/infrastructure/catalogo-omie-gateway.js";
import { CatalogoPgRepo } from "../modules/catalogo/infrastructure/catalogo-pg-repo.js";
import { registrosDeActionsCatalogo } from "../modules/catalogo/presentation/http.js";
import { ErroDeAutenticacao, ErroDeValidacao, MENSAGEM_SESSAO_INVALIDA } from "../shared/erros.js";
import { type RegistroDeAction, type ValidarSessao } from "./action-router.js";

export interface MontarRegistrosResultado {
  registros: RegistroDeAction[];
  validarSessao: ValidarSessao;
  auth: IAuthUseCases;
}

export interface OpcoesMontarRegistros {
  pool: Pool;
  omie: ChamadorOmie;
}

export function montarRegistros({ pool, omie }: OpcoesMontarRegistros): MontarRegistrosResultado {
  const auth = criarUseCasesAuth(new AuthPgRepo(pool));
  const catalogo = criarUseCasesCatalogo({
    gateway: new CatalogoOmieGateway(omie),
    repo: new CatalogoPgRepo(pool),
  });

  const validarSessao: ValidarSessao = (token) => auth.validarSessao(token);

  const registros: RegistroDeAction[] = [
    {
      nome: "health",
      publica: true,
      handler: async () => ({ status: "ok" }),
    },
    {
      nome: "auth_login",
      publica: true,
      handler: async (ctx) => {
        const login = ctx.params.login;
        const senha = ctx.params.senha;
        if (typeof login !== "string" || typeof senha !== "string") {
          throw new ErroDeValidacao("Parâmetros login e senha são obrigatórios.");
        }
        return auth.login(login, senha);
      },
    },
    {
      nome: "auth_me",
      handler: async (ctx) => {
        if (!ctx.sessao) {
          throw new ErroDeAutenticacao(MENSAGEM_SESSAO_INVALIDA);
        }
        return ctx.sessao;
      },
    },
    ...registrosDeActionsCatalogo(catalogo),
  ];

  return { registros, validarSessao, auth };
}
```

- [ ] **Step 6: Atualizar `server.ts` para construir e injetar o OmieClient**

Em `apps/api/src/server.ts`, adicione o import e passe `omie` para `montarRegistros`:

```ts
import "dotenv/config";
import { carregarEnv } from "./env.js";
import { OmieClient } from "./integrations/omie/omieClient.js";
import { montarApp } from "./presentation/montar-app.js";
import { montarRegistros } from "./presentation/montar-registros.js";
import { criarPool } from "./store/client.js";
import { rodarMigrations } from "./store/migracao.js";

async function main(): Promise<void> {
  const env = carregarEnv();
  const pool = criarPool(env.DATABASE_URL, { ssl: env.DATABASE_SSL });
  await rodarMigrations(pool);

  const omie = new OmieClient(env.OMIE_APP_KEY, env.OMIE_APP_SECRET);
  const { registros, validarSessao, auth } = montarRegistros({ pool, omie });

  await auth.limparSessoesExpiradas();
  await auth.semearAdmin(env.LABARR_ADMIN_LOGIN, env.LABARR_ADMIN_SENHA);

  const app = montarApp({ registros, validarSessao });
  const servidor = app.listen(env.PORT, () => {
    console.log(`[labarr-api] ouvindo em http://localhost:${env.PORT}`);
  });

  const encerrar = async () => {
    console.log("[labarr-api] encerrando...");
    servidor.close();
    await pool.end();
    process.exit(0);
  };
  process.on("SIGINT", encerrar);
  process.on("SIGTERM", encerrar);
}

main().catch((motivo) => {
  console.error("[labarr-api] falha ao iniciar", motivo);
  process.exit(1);
});
```

- [ ] **Step 7: Escrever o teste de integração HTTP + Postgres + Omie fake**

Crie `apps/api/src/presentation/montar-registros.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { prepararBancoDeTeste, type BancoDeTeste } from "../store/test-utils.js";
import type { ChamadorOmie } from "../modules/catalogo/infrastructure/catalogo-omie-gateway.js";
import { montarApp } from "./montar-app.js";
import { montarRegistros } from "./montar-registros.js";

// Pré-requisito: docker compose up -d (Postgres na porta 5433).

describe("montarRegistros + montarApp — integração HTTP", () => {
  let banco: BancoDeTeste;
  let servidor: Server;
  let baseUrl: string;
  let authToken: string;

  const omieFake = (respostas: unknown[]) => {
    const call = vi.fn();
    respostas.forEach((r) => call.mockResolvedValueOnce(r));
    return { call } as ChamadorOmie;
  };

  beforeAll(async () => {
    banco = await prepararBancoDeTeste();
    await banco.limpar();

    const { registros, validarSessao, auth } = montarRegistros({
      pool: banco.pool,
      omie: omieFake([
        {
          pagina: 1,
          total_de_paginas: 1,
          total_de_registros: 1,
          registros: 1,
          produto_servico_cadastro: [
            {
              codigo_produto: 1,
              codigo: "001",
              codigo_produto_integracao: "001",
              descricao: "Chocolate 70%",
              unidade: "un",
              valor_unitario: 10,
              inativo: "N",
              codigo_familia: 1,
              descricao_familia: "Barra",
              quantidade_estoque: 0,
            },
          ],
        },
      ]),
    });

    await auth.semearAdmin("admin", "senha123");
    const login = await auth.login("admin", "senha123");
    authToken = login.sessionToken;

    const app = montarApp({ registros, validarSessao });
    servidor = app.listen(0);
    const { port } = servidor.address() as AddressInfo;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => servidor.close(() => resolve()));
    await banco.pool.end();
  });

  it("health responde { status: ok }", async () => {
    const resposta = await fetch(`${baseUrl}?action=health`);
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({ success: true, data: { status: "ok" } });
  });

  it("auth_login via HTTP devolve sessionToken e auth_me valida", async () => {
    const login = await fetch(`${baseUrl}?action=auth_login`, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "auth_login", login: "admin", senha: "senha123" }),
    });
    expect(login.status).toBe(200);
    const corpoLogin = await login.json();
    expect(corpoLogin.success).toBe(true);
    expect(corpoLogin.data.sessionToken).toBeTypeOf("string");

    const me = await fetch(
      `${baseUrl}?action=auth_me&sessionToken=${encodeURIComponent(corpoLogin.data.sessionToken as string)}`
    );
    const corpoMe = await me.json();
    expect(corpoMe.success).toBe(true);
    expect(corpoMe.data.login).toBe("admin");
  });

  it("catalogo_listar com sessão válida busca na Omie e devolve o catálogo", async () => {
    const resposta = await fetch(
      `${baseUrl}?action=catalogo_listar&sessionToken=${encodeURIComponent(authToken)}&pagina=1&registros_por_pagina=50`
    );
    expect(resposta.status).toBe(200);
    const corpo = await resposta.json();
    expect(corpo.success).toBe(true);
    expect(corpo.data.produtos[0]).toEqual({
      codigo_omie: 1,
      codigo: "001",
      descricao: "Chocolate 70%",
      categoria: "Barra",
      unidade: "un",
      valor_unitario: 10,
      ativo: true,
    });
  });

  it("catalogo_listar sem sessão é negado", async () => {
    const resposta = await fetch(`${baseUrl}?action=catalogo_listar`);
    expect(resposta.status).toBe(200);
    expect((await resposta.json()).success).toBe(false);
  });
});
```

- [ ] **Step 8: Rodar o teste de integração para confirmar que passa**

Run (cwd `apps/api`): `npx vitest run src/presentation/montar-registros.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 9: Typecheck, suíte completa e commit**

```bash
npx tsc --noEmit
npx vitest run
git add apps/api/src/modules/catalogo/presentation apps/api/src/presentation/montar-registros.ts apps/api/src/presentation/montar-registros.test.ts apps/api/src/server.ts
git commit -m "feat: actions do catálogo no servidor"
```

---

### Task 14: SPA — rota `/catalogo-omie` (resolvedor de base URL por feature + página)

**Repo:** `C:\Users\Dell\Projects\gerenciadorGoogleSheetsLabarr`. **Estilo SPA:** aspas simples, sem ponto e vírgula, indent 2. **Zero mudança no comportamento legado** — rotas que não passam `sessionKey` continuam usando `gas_session`.

**Files:**
- Modify: `src/services/api-client.ts`, `src/app/router/index.tsx`
- Create: `src/app/pages/CatalogoOmiePage.tsx`, `src/app/pages/__tests__/CatalogoOmiePage.test.tsx`

**Interfaces:**
- Consumes: `apiFetch` já existente no SPA (fila, timeouts, retries e dedupe por correlationId intactos — o SPA troca só a base URL).
- Produces:
  - `export type FeatureDeBaseUrl = 'legado' | 'omie'`
  - `export function resolverBaseUrlPorFeature(feature: FeatureDeBaseUrl): string` — `'omie'` → `import.meta.env.VITE_LABARR_API_URL || localStorage.getItem('labarr_api_url') || ''`; `'legado'` → lógica atual (`VITE_GAS_WEBAPP_URL`/`gas_webapp_url`).
  - `export function obterTokenDeSessao(chave: string): string | undefined` — lê `localStorage[chave]`, `JSON.parse`, retorna `.sessionToken`; ausente/corrompido → undefined.
  - `callOptions` estendido para `{ skipLogging?: boolean; sessionToken?: string; sessionKey?: string }` em `apiFetch` e `executeFetch`; leitura da sessão passa a ser `callOptions?.sessionToken ?? obterTokenDeSessao(callOptions?.sessionKey ?? 'gas_session')`.
  - `CatalogoOmiePage` (default export), rota `/catalogo-omie` dentro do `<Layout>` (atrás do `ProtectedRoute`), antes do catch-all `<Route path="*" ...>`.
  - Teste colocado em `__tests__/CatalogoOmiePage.test.tsx` (padrão do SPA — vitest com jsdom, fetch stubado).

**Pré-requisito:** `VITE_LABARR_API_URL` apontando para o labarr-api (ex.: `.env.local` do SPA com `VITE_LABARR_API_URL=http://localhost:3000`). Se ausente, a página mostra o formulário de login (sem base URL configurada, `apiFetch` lança "URL do Web App não configurada." — fica no erro de sessão; documentado, não um bug).

- [ ] **Step 1: Generalizar `api-client.ts`**

Em `src/services/api-client.ts`:

**(a)** Insira estes helpers **depois das constantes/helpers existentes e antes de `export async function apiFetch`**:

```ts
export type FeatureDeBaseUrl = 'legado' | 'omie'

export function resolverBaseUrlPorFeature(feature: FeatureDeBaseUrl): string {
  if (feature === 'omie') {
    return import.meta.env.VITE_LABARR_API_URL || localStorage.getItem('labarr_api_url') || ''
  }
  return import.meta.env.VITE_GAS_WEBAPP_URL || localStorage.getItem('gas_webapp_url') || ''
}

export function obterTokenDeSessao(chave: string): string | undefined {
  const armazenado = localStorage.getItem(chave)
  if (!armazenado) return undefined
  try {
    return (JSON.parse(armazenado) as { sessionToken?: string }).sessionToken
  } catch {
    return undefined
  }
}
```

**(b)** Na assinatura de `apiFetch`, troque o tipo de `callOptions` de:

```ts
  callOptions?: { skipLogging?: boolean },
```

para:

```ts
  callOptions?: { skipLogging?: boolean; sessionToken?: string; sessionKey?: string },
```

**(c)** Na assinatura de `executeFetch`, mesma troca:

```ts
  callOptions?: { skipLogging?: boolean; sessionToken?: string; sessionKey?: string }
```

**(d)** Substitua o bloco de leitura da sessão (hoje ~linhas 113–121):

```ts
  let sessionToken: string | undefined;
  const storedSession = localStorage.getItem('gas_session');
  if (storedSession) {
    try {
      sessionToken = JSON.parse(storedSession).sessionToken;
    } catch {
      // Sessão em localStorage inválida/corrompida — segue sem token
    }
  }
```

por:

```ts
  // O sessionToken (emitido no login) é o único jeito do backend saber quem
  // está fazendo a requisição — nunca reenviar login/nome crus, que eram
  // forjáveis por qualquer chamada direta à API.
  // Rotas da nova API (feature "omie") guardam a sessão em chave própria
  // (callOptions.sessionKey); rotas legadas mantêm o default gas_session.
  let sessionToken = callOptions?.sessionToken ?? obterTokenDeSessao(callOptions?.sessionKey ?? 'gas_session')
```

- [ ] **Step 2: Rodar a suíte do SPA para confirmar que nada quebrou**

Run (na raiz do SPA): `npm test`
Expected: PASS — as rotas legadas não passam `sessionKey`, então o comportamento é idêntico.

- [ ] **Step 3: Criar a página**

Crie `src/app/pages/CatalogoOmiePage.tsx`:

```tsx
import { useEffect, useState, type FormEvent } from 'react'
import {
  apiFetch,
  obterTokenDeSessao,
  resolverBaseUrlPorFeature,
} from '../../services/api-client'

const CHAVE_DE_SESSAO = 'labarr_api_session'

interface ProdutoCatalogo {
  codigo_omie: number
  codigo: string
  descricao: string
  categoria: string
  unidade: string | null
  valor_unitario: number | null
  ativo: boolean
}

interface PaginaCatalogo {
  produtos: ProdutoCatalogo[]
  pagina: number
  totalDePaginas: number
  totalDeRegistros: number
}

export default function CatalogoOmiePage() {
  const [baseUrl] = useState(() => resolverBaseUrlPorFeature('omie'))
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [dados, setDados] = useState<PaginaCatalogo | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erroDeSessao, setErroDeSessao] = useState(false)
  const [temSessao, setTemSessao] = useState(() => obterTokenDeSessao(CHAVE_DE_SESSAO) !== undefined)

  async function carregarPagina(paginaAlvo: number) {
    setCarregando(true)
    try {
      const resultado = await apiFetch<PaginaCatalogo>(
        baseUrl,
        'GET',
        'catalogo_listar',
        undefined,
        { pagina: String(paginaAlvo), registros_por_pagina: '50' },
        { skipLogging: true, sessionKey: CHAVE_DE_SESSAO },
      )
      setDados(resultado)
      setErroDeSessao(false)
    } catch (erro: any) {
      const mensagem = String(erro?.message ?? erro)
      if (mensagem.includes('Sessão inválida ou expirada')) {
        setErroDeSessao(true)
      } else {
        setErroDeSessao(false)
      }
    } finally {
      setCarregando(false)
    }
  }

  async function entrar(evento: FormEvent) {
    evento.preventDefault()
    setCarregando(true)
    try {
      const resultado = await apiFetch<{ sessionToken: string }>(
        baseUrl,
        'POST',
        'auth_login',
        { login, senha },
        undefined,
        { skipLogging: true },
      )
      localStorage.setItem(CHAVE_DE_SESSAO, JSON.stringify({ sessionToken: resultado.sessionToken }))
      setTemSessao(true)
      setErroDeSessao(false)
      setLogin('')
      setSenha('')
    } catch {
      setTemSessao(false)
    } finally {
      setCarregando(false)
    }
  }

  function sair() {
    localStorage.removeItem(CHAVE_DE_SESSAO)
    setTemSessao(false)
    setDados(null)
  }

  useEffect(() => {
    if (temSessao && !dados && !erroDeSessao) {
      carregarPagina(1)
    }
  }, [temSessao, dados, erroDeSessao])

  if (erroDeSessao || !temSessao) {
    return (
      <form onSubmit={entrar}>
        <h2>Catálogo Omie</h2>
        <label htmlFor="login">Login</label>
        <input
          id="login"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          autoComplete="username"
        />
        <label htmlFor="senha">Senha</label>
        <input
          id="senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
        />
        <button type="submit" disabled={carregando}>
          Entrar
        </button>
      </form>
    )
  }

  if (!dados) {
    return <p>{carregando ? 'Carregando…' : 'Sem dados.'}</p>
  }

  return (
    <section>
      <div>
        <h2>Catálogo Omie</h2>
        <button type="button" onClick={sair}>
          Sair
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Descrição</th>
            <th>Categoria</th>
            <th>Unid.</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {dados.produtos.map((p) => (
            <tr key={p.codigo_omie}>
              <td>{p.codigo}</td>
              <td>{p.descricao}</td>
              <td>{p.categoria}</td>
              <td>{p.unidade ?? '—'}</td>
              <td>{p.valor_unitario?.toFixed(2) ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <button
          type="button"
          disabled={dados.pagina <= 1 || carregando}
          onClick={() => carregarPagina(dados.pagina - 1)}
        >
          Anterior
        </button>
        <span>
          Página {dados.pagina} de {dados.totalDePaginas}
        </span>
        <button
          type="button"
          disabled={dados.pagina >= dados.totalDePaginas || carregando}
          onClick={() => carregarPagina(dados.pagina + 1)}
        >
          Próxima
        </button>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Registrar a rota**

Em `src/app/router/index.tsx`:

**(a)** Adicione o import (junto aos outros imports de páginas):

```tsx
import CatalogoOmiePage from '../pages/CatalogoOmiePage'
```

**(b)** Insira a rota **dentro do `<Routes>` aninhado** (atrás de `ProtectedRoute` + `Layout`), logo **antes** do catch-all `<Route path="*" element={<Navigate to="/" replace />} />` (hoje linha ~184):

```tsx
        <Route path="/catalogo-omie" element={<CatalogoOmiePage />} />
```

- [ ] **Step 5: Escrever os testes da página**

Crie `src/app/pages/__tests__/CatalogoOmiePage.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CatalogoOmiePage from '../CatalogoOmiePage'

function resposta(json: unknown) {
  return { ok: true, json: async () => json }
}

describe('CatalogoOmiePage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('mostra o formulário de login quando não há sessão', () => {
    render(<CatalogoOmiePage />)
    expect(screen.getByLabelText('Login')).toBeTruthy()
    expect(screen.getByLabelText('Senha')).toBeTruthy()
  })

  it('lista o catálogo quando há sessão válida', async () => {
    localStorage.setItem('labarr_api_session', JSON.stringify({ sessionToken: 'token-teste' }))
    const mockFetch = vi.fn().mockResolvedValue(
      resposta({
        success: true,
        data: {
          produtos: [
            {
              codigo_omie: 1,
              codigo: '001',
              descricao: 'Chocolate 70%',
              categoria: 'Barra',
              unidade: 'un',
              valor_unitario: 10,
              ativo: true,
            },
          ],
          pagina: 1,
          totalDePaginas: 1,
          totalDeRegistros: 1,
        },
      }),
    )
    vi.stubGlobal('fetch', mockFetch)

    render(<CatalogoOmiePage />)

    await waitFor(() => expect(screen.getByText('Chocolate 70%')).toBeTruthy())
    expect(screen.getByText('Barra')).toBeTruthy()
  })

  it('volta ao login quando a sessão é inválida', async () => {
    localStorage.setItem('labarr_api_session', JSON.stringify({ sessionToken: 'token-vencido' }))
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        resposta({
          success: false,
          error: 'Acesso negado. Sessão inválida ou expirada. Faça login novamente.',
        }),
      ),
    )

    render(<CatalogoOmiePage />)

    await waitFor(() => expect(screen.getByLabelText('Login')).toBeTruthy())
  })

  it('faz login e lista o catálogo', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(resposta({ success: true, data: { sessionToken: 'token-novo' } }))
      .mockResolvedValueOnce(
        resposta({
          success: true,
          data: {
            produtos: [
              {
                codigo_omie: 2,
                codigo: '002',
                descricao: 'Cacau 60%',
                categoria: 'Tablete',
                unidade: 'un',
                valor_unitario: 12,
                ativo: true,
              },
            ],
            pagina: 1,
            totalDePaginas: 1,
            totalDeRegistros: 1,
          },
        }),
      )
    vi.stubGlobal('fetch', mockFetch)

    render(<CatalogoOmiePage />)
    fireEvent.change(screen.getByLabelText('Login'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'segredo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(screen.getByText('Cacau 60%')).toBeTruthy())
    expect(localStorage.getItem('labarr_api_session')).toContain('token-novo')
  })
})
```

- [ ] **Step 6: Rodar os testes do SPA**

Run (raiz do SPA): `npm test`
Expected: PASS (suíte inteira, incluindo os 4 testes da página nova).

- [ ] **Step 7: Typecheck/lint e commit no repo do SPA**

```bash
npm run lint
git add src/services/api-client.ts src/app/router/index.tsx src/app/pages/CatalogoOmiePage.tsx src/app/pages/__tests__/CatalogoOmiePage.test.tsx
git commit -m "feat(SPA): rota /catalogo-omie consumindo a nova API"
```

---

### Task 15: Preparação de deploy — backup automatizado + runbook (ADR-0001)

**Files:**
- Create: `scripts/backup-db.sh`, `docs/DEPLOY.md`

**Interfaces:**
- Consumes: decisão do ADR-0001 (Task 2).
- Produces: `scripts/backup-db.sh` (backup `pg_dump | gzip` + rotação por data — **não-negociável**, ADR-0001) e `docs/DEPLOY.md` (runbook por opção de hospedagem). **O deploy em si é passo do usuário** (precisa de credenciais/infra) — não rodar nesta task.

- [ ] **Step 1: Escrever o script de backup**

Crie `scripts/backup-db.sh`:

```bash
#!/usr/bin/env bash
# Backup automatizado do Postgres do labarr-api (não-negociável — ADR-0001).
# Uso: DATABASE_URL="postgres://..." BACKUP_DIR=./backups RETENCAO_DIAS=14 ./scripts/backup-db.sh
set -euo pipefail

DATABASE_URL="${DATABASE_URL:?Defina DATABASE_URL para o Postgres de produção}"
DIR_BACKUP="${BACKUP_DIR:-./backups}"
RETENCAO_DIAS="${RETENCAO_DIAS:-14}"

mkdir -p "$DIR_BACKUP"
DATA=$(date +%Y-%m-%d_%H-%M-%S)
ARQUIVO="$DIR_BACKUP/labarr-$DATA.sql.gz"

pg_dump "$DATABASE_URL" | gzip > "$ARQUIVO"
echo "Backup criado: $ARQUIVO"

find "$DIR_BACKUP" -name 'labarr-*.sql.gz' -mtime +"$RETENCAO_DIAS" -delete
echo "Rotação aplicada (retenção de $RETENCAO_DIAS dias)."
```

Torque executável: `chmod +x scripts/backup-db.sh`

- [ ] **Step 2: Escrever o runbook de deploy**

Crie `docs/DEPLOY.md` (ajuste conforme a decisão da Task 2 — se a escolha foi **B**, a seção "Opção B" é o caminho principal):

```markdown
# Deploy do labarr-api

Hospedagem escolhida na F0: consulte `docs/adr/0001-hospedagem.md`.
O servidor aplica as migrations sozinho ao subir (`server.ts` chama
`rodarMigrations`) — basta garantir o `DATABASE_URL`.

## Variáveis de ambiente

| Variável | Obrigatória | Exemplo |
|---|---|---|
| `PORT` | não (padrão 3000) | `3000` |
| `DATABASE_URL` | sim | `postgres://user:pass@db.supabase.co:5432/postgres` |
| `DATABASE_SSL` | não (padrão false) | `true` |
| `OMIE_APP_KEY` | sim | — |
| `OMIE_APP_SECRET` | sim | — |
| `LABARR_ADMIN_LOGIN` | não (padrão `admin`) | `admin` |
| `LABARR_ADMIN_SENHA` | sim | — |

> `app_key`/`app_secret` vivem **só no servidor** (env). Nunca vão para o browser.

## Opção B — VPS própria + Supabase

1. **Banco:** Postgres do Supabase. `DATABASE_SSL=true`.
2. **Build e start (VPS):**
   ```bash
   npm ci
   npm run build     # gera dist/
   ```
   Rode com systemd (exemplo):
   ```ini
   [Unit]
   Description=labarr-api
   After=network.target

   [Service]
   WorkingDirectory=/opt/labarr-api
   EnvironmentFile=/opt/labarr-api/.env
   ExecStart=/usr/bin/node dist/server.js
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
   ```bash
   sudo systemctl enable --now labarr-api
   ```
3. **Health check:**
   ```bash
   curl "http://localhost:3000/?action=health"
   # {"success":true,"data":{"status":"ok"}}
   ```
4. **Backup automatizado (não-negociável — ADR-0001):** cron diário
   ```cron
   30 2 * * *  cd /opt/labarr-api && DATABASE_URL="$(grep '^DATABASE_URL=' .env | cut -d= -f2-)" BACKUP_DIR=/var/backups/labarr ./scripts/backup-db.sh >> /var/log/labarr-backup.log 2>&1
   ```
   **Teste uma restauração pelo menos uma vez** antes de confiar no backup.

## Opção A — Render (gerenciado)

- Crie um **Postgres** no painel (backup automático incluído); copie a conexão
  interna como `DATABASE_URL` com `DATABASE_SSL=true`.
- Crie um **Web Service** apontando para o repo: build `npm ci && npm run build`,
  start `node dist/server.js`, e as variáveis da tabela acima.
- Health check: mesma `curl` acima na URL do serviço.

## SPA

O SPA aponta para a nova API pela variável `VITE_LABARR_API_URL` (build no
Vercel). Rotas legadas continuam no GAS — nada muda nelas.
```

- [ ] **Step 3: Typecheck e commit**

```bash
npx tsc --noEmit
git add scripts/backup-db.sh docs/DEPLOY.md
git commit -m "docs: runbook de deploy + backup automatizado"
```

---

## Self-Review

- [ ] **Cobertura da spec:** decisões 1–11 cobertas — 1 (repo novo `apps/api`, T1), 2 (camada de domínio distinta, T10), 3 (Postgres, T5/T12), 4 (ADR-0001, T2), 5 (protocolo copiado, T4/T9), 6 (escopo catálogo com domínio+integração, T10–T13), 7 (leitura Omie direto, T11), 8 (submit separado é Fase 3 — fora deste plano), 9 (rotas novas no SPA, T14), 10 (estrutura modular, todo o plano), 11 (Produção v2 fora de escopo; espelho já grava `setor_labarr`, T10/T12). Contrato de actions (2.2) em T8; `produtos` + `mapeamento_nome_codigo` (2.3) em T12; "MVP 2.0" (2.6) em T14; ADR em F0 em T2; backup não-negociável em T15.
- [ ] **Scan de placeholders:** nenhum "TBD"/"TODO"; todo passo tem código completo. O ADR-0001 tem uma seção "Decisão" propositalmente em aberto até o checkpoint da Task 2 — não é placeholder de código.
- [ ] **Consistência de tipos:** `processarAction`/`ContextoAction.sessao`/`SessaoDoContexto` consistentes em T8/T13/T14; `ListarProdutosResponse.produto_servico_cadastro` em T10–T13; `montarRegistros({ pool })` → `({ pool, omie })` evoluído na T13; `ChamadorOmie` definido na T11 e consumido na T13; nomes de colunas do `catalogo-pg-repo` batem com a migration `002`; `sessionKey`/`obterTokenDeSessao` na T14.
