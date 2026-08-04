# omie-data — Cliente Real + Credenciais + Comandos de Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar o critério de aceite pendente do piloto Produtos da skill `omie-data`: adicionar um cliente HTTP real pra API Omie, um fluxo de configuração de credenciais, e comandos de skill (`/omie-data:configurar`, `/omie-data:produtos`) que permitam ao usuário testar contra a Omie de verdade numa conversa do Claude Code.

**Architecture:** Duas novas peças de infraestrutura em `packages/omie-data` (`OmieHttpClientReal`, `credenciais.ts`), duas funções de orquestração testáveis (`rodarConfigurar`, `rodarProdutos`) reaproveitando o pipeline já existente (`collectProdutos`/`translateProdutos`/`consultarProdutos`), um CLI fino (`cli.ts`) que faz parsing de argv e imprime JSON, e dois comandos de skill em `.claude/commands/omie-data/` que rodam o CLI via terminal e formatam a saída.

**Tech Stack:** TypeScript, Vitest, `fetch` nativo do Node, `node:crypto`, `node:fs`.

## Global Constraints

- `packages/omie-data` não pode importar nada de `src/` do omie-mcp (portabilidade futura) — o protocolo HTTP da Omie é reimplementado do zero em `OmieHttpClientReal`, não importado.
- Todo dado de negócio devolvido ao usuário é sempre a versão traduzida (`view_produtos`), nunca o JSON cru.
- `OmieHttpClientReal` não tem retry automático nem throttling nesta versão (YAGNI — spec, "Fora de escopo").
- Credencial fica em `data/omie-data/credentials/<hash>.json`, fora do `.db` de dados (spec, seção "Arquitetura").
- `rodarProdutos` nunca decide sozinho se busca dado novo — quem chama decide (mesma regra de `consultarProdutos` do piloto anterior).
- Este piloto assume uma única credencial ativa salva por vez (spec, "Fora de escopo": seleção multi-conta fica pra depois).

---

### Task 1: Caminhos de dados + módulo de credenciais

**Files:**
- Create: `packages/omie-data/src/infrastructure/caminhos.ts`
- Create: `packages/omie-data/src/infrastructure/credenciais.ts`
- Test: `packages/omie-data/src/infrastructure/credenciais.test.ts`

**Interfaces:**
- Consumes: nenhum (task independente).
- Produces:
  - `function diretorioDados(): string` — resolve pra `process.env.OMIE_DATA_DIR` se definida, senão `path.join(process.cwd(), "data", "omie-data")`. A variável de ambiente existe só pra permitir testes isolados sem tocar o diretório real.
  - `function hashCredencial(appKey: string): string` — hash SHA-256 (16 hex chars) determinístico do App Key.
  - `function salvarCredencial(appKey: string, appSecret: string): string` — grava `{app_key, app_secret}` em `<diretorioDados()>/credentials/<hash>.json` (cria diretórios se preciso), retorna o hash.
  - `interface CredencialSalva { hash: string; appKey: string; appSecret: string }`
  - `function carregarCredencialAtiva(): CredencialSalva | null` — lê o diretório de credenciais; se vazio ou inexistente, `null`; senão lê o primeiro arquivo `.json` encontrado.

- [ ] **Step 1: Escrever o teste que falha**

```typescript
// packages/omie-data/src/infrastructure/credenciais.test.ts
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  carregarCredencialAtiva,
  hashCredencial,
  salvarCredencial,
} from "./credenciais.js";

describe("credenciais", () => {
  let dirTemp: string;

  beforeEach(() => {
    dirTemp = mkdtempSync(join(tmpdir(), "omie-data-cred-"));
    process.env.OMIE_DATA_DIR = dirTemp;
  });

  afterEach(() => {
    delete process.env.OMIE_DATA_DIR;
    rmSync(dirTemp, { recursive: true, force: true });
  });

  it("hashCredencial é determinístico para o mesmo App Key", () => {
    expect(hashCredencial("abc123")).toBe(hashCredencial("abc123"));
    expect(hashCredencial("abc123")).not.toBe(hashCredencial("outro"));
  });

  it("carregarCredencialAtiva retorna null quando nada foi salvo", () => {
    expect(carregarCredencialAtiva()).toBeNull();
  });

  it("salva e depois carrega a credencial ativa", () => {
    const hash = salvarCredencial("minha-app-key", "meu-app-secret");

    const credencial = carregarCredencialAtiva();

    expect(credencial).not.toBeNull();
    expect(credencial!.hash).toBe(hash);
    expect(credencial!.appKey).toBe("minha-app-key");
    expect(credencial!.appSecret).toBe("meu-app-secret");
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm --prefix packages/omie-data test -- credenciais.test.ts`
Expected: FAIL com "Cannot find module './credenciais.js'"

- [ ] **Step 3: Implementar `caminhos.ts`**

```typescript
// packages/omie-data/src/infrastructure/caminhos.ts
import path from "node:path";

export function diretorioDados(): string {
  return process.env.OMIE_DATA_DIR ?? path.join(process.cwd(), "data", "omie-data");
}
```

- [ ] **Step 4: Implementar `credenciais.ts`**

```typescript
// packages/omie-data/src/infrastructure/credenciais.ts
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { diretorioDados } from "./caminhos.js";

export function hashCredencial(appKey: string): string {
  return createHash("sha256").update(appKey).digest("hex").slice(0, 16);
}

function diretorioCredenciais(): string {
  return path.join(diretorioDados(), "credentials");
}

export function salvarCredencial(appKey: string, appSecret: string): string {
  const hash = hashCredencial(appKey);
  const dir = diretorioCredenciais();
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    path.join(dir, `${hash}.json`),
    JSON.stringify({ app_key: appKey, app_secret: appSecret }, null, 2)
  );

  return hash;
}

export interface CredencialSalva {
  hash: string;
  appKey: string;
  appSecret: string;
}

export function carregarCredencialAtiva(): CredencialSalva | null {
  const dir = diretorioCredenciais();
  if (!existsSync(dir)) return null;

  const arquivos = readdirSync(dir).filter((nome) => nome.endsWith(".json"));
  if (arquivos.length === 0) return null;

  const [arquivo] = arquivos;
  const hash = arquivo.replace(/\.json$/, "");
  const conteudo = JSON.parse(readFileSync(path.join(dir, arquivo), "utf-8"));

  return { hash, appKey: conteudo.app_key, appSecret: conteudo.app_secret };
}
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

Run: `npm --prefix packages/omie-data test -- credenciais.test.ts`
Expected: PASS (3 testes)

- [ ] **Step 6: Commit**

```bash
git add packages/omie-data/src/infrastructure/caminhos.ts packages/omie-data/src/infrastructure/credenciais.ts packages/omie-data/src/infrastructure/credenciais.test.ts
git commit -m "feat(omie-data): módulo de credenciais (salvar/carregar por App Key)"
```

---

### Task 2: Cliente HTTP real (`OmieHttpClientReal`)

**Files:**
- Create: `packages/omie-data/src/infrastructure/omie-http-client-real.ts`
- Test: `packages/omie-data/src/infrastructure/omie-http-client-real.test.ts`

**Interfaces:**
- Consumes: `IOmieHttpClient`, `ListarProdutosResponseBruto` (`src/domain/omie-http-client.ts`, já existentes do piloto anterior).
- Produces: `class OmieHttpClientReal implements IOmieHttpClient` — construtor `(appKey: string, appSecret: string)`, método `listarProdutosPagina(pagina, registrosPorPagina): Promise<ListarProdutosResponseBruto>`.

- [ ] **Step 1: Escrever o teste que falha**

```typescript
// packages/omie-data/src/infrastructure/omie-http-client-real.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { OmieHttpClientReal } from "./omie-http-client-real.js";

describe("OmieHttpClientReal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("monta a URL e o payload corretos e devolve o JSON da resposta", async () => {
    const respostaFake = {
      pagina: 1,
      total_de_paginas: 1,
      produto_servico_cadastro: [{ codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 0 }],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      text: async () => JSON.stringify(respostaFake),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("minha-key", "meu-secret");
    const resultado = await client.listarProdutosPagina(1, 50);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe("https://app.omie.com.br/api/v1/geral/produtos/");
    const corpo = JSON.parse(opcoes.body);
    expect(corpo.call).toBe("ListarProdutos");
    expect(corpo.app_key).toBe("minha-key");
    expect(corpo.app_secret).toBe("meu-secret");
    expect(corpo.param).toEqual([{ pagina: 1, registros_por_pagina: 50, apenas_importado_api: "N" }]);

    expect(resultado).toEqual(respostaFake);
  });

  it("rejeita com mensagem legível quando a Omie devolve faultstring", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      text: async () => JSON.stringify({ faultstring: "Erro de autenticação", faultcode: "SOAP-ENV:Client-101" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("key-invalida", "secret-invalido");

    await expect(client.listarProdutosPagina(1, 50)).rejects.toThrow("Erro de autenticação");
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm --prefix packages/omie-data test -- omie-http-client-real.test.ts`
Expected: FAIL com "Cannot find module './omie-http-client-real.js'"

- [ ] **Step 3: Implementar `omie-http-client-real.ts`**

```typescript
// packages/omie-data/src/infrastructure/omie-http-client-real.ts
import { IOmieHttpClient, ListarProdutosResponseBruto } from "../domain/omie-http-client.js";

const OMIE_BASE_URL = "https://app.omie.com.br/api/v1";

export class OmieHttpClientReal implements IOmieHttpClient {
  constructor(
    private readonly appKey: string,
    private readonly appSecret: string
  ) {}

  async listarProdutosPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarProdutosResponseBruto> {
    const response = await fetch(`${OMIE_BASE_URL}/geral/produtos/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        call: "ListarProdutos",
        app_key: this.appKey,
        app_secret: this.appSecret,
        param: [{ pagina, registros_por_pagina: registrosPorPagina, apenas_importado_api: "N" }],
      }),
    });

    const texto = await response.text();
    const json = JSON.parse(texto);

    if (json && (json.faultstring || json.faultcode)) {
      throw new Error(json.faultstring ?? "Erro desconhecido na API Omie");
    }

    return json as ListarProdutosResponseBruto;
  }
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm --prefix packages/omie-data test -- omie-http-client-real.test.ts`
Expected: PASS (2 testes)

- [ ] **Step 5: Commit**

```bash
git add packages/omie-data/src/infrastructure/omie-http-client-real.ts packages/omie-data/src/infrastructure/omie-http-client-real.test.ts
git commit -m "feat(omie-data): OmieHttpClientReal (cliente HTTP real, sem retry/throttling)"
```

---

### Task 3: Orquestração de `configurar` (`rodarConfigurar`)

**Files:**
- Create: `packages/omie-data/src/application/rodar-configurar.ts`
- Test: `packages/omie-data/src/application/rodar-configurar.test.ts`

**Interfaces:**
- Consumes: `IOmieHttpClient` (Task já existente do piloto anterior), `FakeOmieHttpClient` (piloto anterior), `salvarCredencial`, `hashCredencial` (Task 1).
- Produces:
  - `type ResultadoConfigurar = { status: "ok"; hash: string } | { status: "invalido"; erro: string }`
  - `async function rodarConfigurar(appKey: string, appSecret: string, client: IOmieHttpClient): Promise<ResultadoConfigurar>` — valida chamando `client.listarProdutosPagina(1, 1)`; se rejeitar, devolve `{status:"invalido", erro}`; se funcionar, salva a credencial e devolve `{status:"ok", hash}`.

- [ ] **Step 1: Escrever o teste que falha**

```typescript
// packages/omie-data/src/application/rodar-configurar.test.ts
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FakeOmieHttpClient } from "../infrastructure/fake-omie-http-client.js";
import { carregarCredencialAtiva, hashCredencial } from "../infrastructure/credenciais.js";
import { rodarConfigurar } from "./rodar-configurar.js";
import { IOmieHttpClient } from "../domain/omie-http-client.js";

describe("rodarConfigurar", () => {
  let dirTemp: string;

  beforeEach(() => {
    dirTemp = mkdtempSync(join(tmpdir(), "omie-data-cfg-"));
    process.env.OMIE_DATA_DIR = dirTemp;
  });

  afterEach(() => {
    delete process.env.OMIE_DATA_DIR;
    rmSync(dirTemp, { recursive: true, force: true });
  });

  it("salva a credencial quando a validação funciona", async () => {
    const client = new FakeOmieHttpClient([]);

    const resultado = await rodarConfigurar("app-key-valida", "app-secret-valido", client);

    expect(resultado).toEqual({ status: "ok", hash: hashCredencial("app-key-valida") });
    expect(carregarCredencialAtiva()?.appKey).toBe("app-key-valida");
  });

  it("não salva nada quando a validação falha", async () => {
    const clientInvalido: IOmieHttpClient = {
      listarProdutosPagina: async () => {
        throw new Error("Erro de autenticação");
      },
    };

    const resultado = await rodarConfigurar("app-key-invalida", "app-secret-invalido", clientInvalido);

    expect(resultado).toEqual({ status: "invalido", erro: "Erro de autenticação" });
    expect(carregarCredencialAtiva()).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm --prefix packages/omie-data test -- rodar-configurar.test.ts`
Expected: FAIL com "Cannot find module './rodar-configurar.js'"

- [ ] **Step 3: Implementar `rodar-configurar.ts`**

```typescript
// packages/omie-data/src/application/rodar-configurar.ts
import { IOmieHttpClient } from "../domain/omie-http-client.js";
import { salvarCredencial } from "../infrastructure/credenciais.js";

export type ResultadoConfigurar =
  | { status: "ok"; hash: string }
  | { status: "invalido"; erro: string };

export async function rodarConfigurar(
  appKey: string,
  appSecret: string,
  client: IOmieHttpClient
): Promise<ResultadoConfigurar> {
  try {
    await client.listarProdutosPagina(1, 1);
  } catch (erro) {
    return { status: "invalido", erro: erro instanceof Error ? erro.message : String(erro) };
  }

  const hash = salvarCredencial(appKey, appSecret);
  return { status: "ok", hash };
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm --prefix packages/omie-data test -- rodar-configurar.test.ts`
Expected: PASS (2 testes)

- [ ] **Step 5: Commit**

```bash
git add packages/omie-data/src/application/rodar-configurar.ts packages/omie-data/src/application/rodar-configurar.test.ts
git commit -m "feat(omie-data): rodarConfigurar valida e salva credencial"
```

---

### Task 4: Orquestração de `produtos` (`rodarProdutos`)

**Files:**
- Create: `packages/omie-data/src/application/rodar-produtos.ts`
- Test: `packages/omie-data/src/application/rodar-produtos.test.ts`

**Interfaces:**
- Consumes: `collectProdutos`, `translateProdutos`, `consultarProdutos`, `ResultadoConsultaProdutos` (piloto anterior), `abrirBanco` (piloto anterior), `IOmieHttpClient`/`FakeOmieHttpClient` (piloto anterior).
- Produces: `async function rodarProdutos(db: Database.Database, client: IOmieHttpClient, atualizar: boolean): Promise<ResultadoConsultaProdutos>` — se `atualizar` for `true`, roda `collectProdutos` + `translateProdutos` antes de consultar; sempre termina chamando `consultarProdutos(db)`.

- [ ] **Step 1: Escrever o teste que falha**

```typescript
// packages/omie-data/src/application/rodar-produtos.test.ts
import { describe, expect, it } from "vitest";
import { abrirBanco } from "../infrastructure/database.js";
import { FakeOmieHttpClient } from "../infrastructure/fake-omie-http-client.js";
import { rodarProdutos } from "./rodar-produtos.js";

describe("rodarProdutos", () => {
  it("sem atualizar e sem dado prévio, retorna sem_dado", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([]);

    const resultado = await rodarProdutos(db, client, false);

    expect(resultado.status).toBe("sem_dado");

    db.close();
  });

  it("com atualizar=true, coleta e traduz antes de consultar", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Fam 1" },
    ]);

    const resultado = await rodarProdutos(db, client, true);

    expect(resultado.status).toBe("dado_disponivel");
    expect(resultado.produtos).toHaveLength(1);
    expect(resultado.produtos[0].nome).toBe("Produto A");

    db.close();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm --prefix packages/omie-data test -- rodar-produtos.test.ts`
Expected: FAIL com "Cannot find module './rodar-produtos.js'"

- [ ] **Step 3: Implementar `rodar-produtos.ts`**

```typescript
// packages/omie-data/src/application/rodar-produtos.ts
import type Database from "better-sqlite3";
import { IOmieHttpClient } from "../domain/omie-http-client.js";
import { collectProdutos } from "./collect-produtos.js";
import { translateProdutos } from "./translate-produtos.js";
import { consultarProdutos, ResultadoConsultaProdutos } from "./consultar-produtos.js";

export async function rodarProdutos(
  db: Database.Database,
  client: IOmieHttpClient,
  atualizar: boolean
): Promise<ResultadoConsultaProdutos> {
  if (atualizar) {
    await collectProdutos(db, client);
    translateProdutos(db);
  }

  return consultarProdutos(db);
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm --prefix packages/omie-data test -- rodar-produtos.test.ts`
Expected: PASS (2 testes)

- [ ] **Step 5: Commit**

```bash
git add packages/omie-data/src/application/rodar-produtos.ts packages/omie-data/src/application/rodar-produtos.test.ts
git commit -m "feat(omie-data): rodarProdutos orquestra collect+translate+consultar"
```

---

### Task 5: CLI (`cli.ts`)

**Files:**
- Create: `packages/omie-data/src/cli.ts`
- Test: `packages/omie-data/src/cli.test.ts`
- Modify: `packages/omie-data/package.json` (adiciona `"bin"` e ajusta `"scripts"` se necessário)

**Interfaces:**
- Consumes: `rodarConfigurar` (Task 3), `rodarProdutos` (Task 4), `carregarCredencialAtiva` (Task 1), `OmieHttpClientReal` (Task 2), `abrirBanco` (piloto anterior), `diretorioDados` (Task 1).
- Produces: `function parseArgv(argv: string[]): ComandoCli` — função pura, testável sem tocar filesystem/rede/stdout. `type ComandoCli = { tipo: "configurar"; appKey: string; appSecret: string } | { tipo: "produtos"; atualizar: boolean } | { tipo: "desconhecido" }`. O restante do arquivo (execução real, leitura de credenciais, chamada de rede, `console.log`) não é coberto por teste unitário nesta task — é testado manualmente no critério de aceite do plano (rodar o comando de skill de verdade).

- [ ] **Step 1: Escrever o teste que falha**

```typescript
// packages/omie-data/src/cli.test.ts
import { describe, expect, it } from "vitest";
import { parseArgv } from "./cli.js";

describe("parseArgv", () => {
  it("reconhece 'configurar --app-key X --app-secret Y'", () => {
    const comando = parseArgv(["configurar", "--app-key", "minha-key", "--app-secret", "meu-secret"]);
    expect(comando).toEqual({ tipo: "configurar", appKey: "minha-key", appSecret: "meu-secret" });
  });

  it("reconhece 'produtos' sem --atualizar", () => {
    const comando = parseArgv(["produtos"]);
    expect(comando).toEqual({ tipo: "produtos", atualizar: false });
  });

  it("reconhece 'produtos --atualizar'", () => {
    const comando = parseArgv(["produtos", "--atualizar"]);
    expect(comando).toEqual({ tipo: "produtos", atualizar: true });
  });

  it("retorna 'desconhecido' pra qualquer outra entrada", () => {
    expect(parseArgv([])).toEqual({ tipo: "desconhecido" });
    expect(parseArgv(["outra-coisa"])).toEqual({ tipo: "desconhecido" });
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm --prefix packages/omie-data test -- cli.test.ts`
Expected: FAIL com "Cannot find module './cli.js'"

- [ ] **Step 3: Implementar `cli.ts`**

```typescript
// packages/omie-data/src/cli.ts
import path from "node:path";
import { abrirBanco } from "./infrastructure/database.js";
import { carregarCredencialAtiva } from "./infrastructure/credenciais.js";
import { diretorioDados } from "./infrastructure/caminhos.js";
import { OmieHttpClientReal } from "./infrastructure/omie-http-client-real.js";
import { rodarConfigurar } from "./application/rodar-configurar.js";
import { rodarProdutos } from "./application/rodar-produtos.js";

export type ComandoCli =
  | { tipo: "configurar"; appKey: string; appSecret: string }
  | { tipo: "produtos"; atualizar: boolean }
  | { tipo: "desconhecido" };

export function parseArgv(argv: string[]): ComandoCli {
  const [sub, ...resto] = argv;

  if (sub === "configurar") {
    const indiceKey = resto.indexOf("--app-key");
    const indiceSecret = resto.indexOf("--app-secret");
    if (indiceKey === -1 || indiceSecret === -1) return { tipo: "desconhecido" };
    return {
      tipo: "configurar",
      appKey: resto[indiceKey + 1],
      appSecret: resto[indiceSecret + 1],
    };
  }

  if (sub === "produtos") {
    return { tipo: "produtos", atualizar: resto.includes("--atualizar") };
  }

  return { tipo: "desconhecido" };
}

async function main() {
  const comando = parseArgv(process.argv.slice(2));

  if (comando.tipo === "configurar") {
    const client = new OmieHttpClientReal(comando.appKey, comando.appSecret);
    const resultado = await rodarConfigurar(comando.appKey, comando.appSecret, client);
    console.log(JSON.stringify(resultado));
    process.exit(resultado.status === "ok" ? 0 : 1);
  }

  if (comando.tipo === "produtos") {
    const credencial = carregarCredencialAtiva();
    if (!credencial) {
      console.log(JSON.stringify({ status: "sem_credencial" }));
      process.exit(1);
    }

    const db = abrirBanco(path.join(diretorioDados(), `${credencial.hash}.db`));
    const client = new OmieHttpClientReal(credencial.appKey, credencial.appSecret);
    const resultado = await rodarProdutos(db, client, comando.atualizar);
    db.close();
    console.log(JSON.stringify(resultado));
    process.exit(0);
  }

  console.error("Comando desconhecido. Uso: cli.js configurar --app-key X --app-secret Y | cli.js produtos [--atualizar]");
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm --prefix packages/omie-data test -- cli.test.ts`
Expected: PASS (4 testes)

- [ ] **Step 5: Adicionar `bin` ao `package.json`**

Abra `packages/omie-data/package.json` e adicione a chave `"bin"` (mantendo o resto do arquivo como está):

```json
  "bin": {
    "omie-data": "dist/cli.js"
  },
```

- [ ] **Step 6: Build e rodar a suíte completa do pacote**

Run: `npm --prefix packages/omie-data run build`
Expected: compila sem erro.

Run: `npm --prefix packages/omie-data test`
Expected: todos os testes (Tasks 1-5 desta feature + as 7 tasks do piloto anterior) passam juntos.

- [ ] **Step 7: Commit**

```bash
git add packages/omie-data/src/cli.ts packages/omie-data/src/cli.test.ts packages/omie-data/package.json
git commit -m "feat(omie-data): cli.ts com subcomandos configurar e produtos"
```

---

### Task 6: Comandos de skill (`/omie-data:configurar`, `/omie-data:produtos`)

**Files:**
- Create: `.claude/commands/omie-data/configurar.md`
- Create: `.claude/commands/omie-data/produtos.md`

**Interfaces:**
- Consumes: o CLI construído nas Tasks 1-5 (`node packages/omie-data/dist/cli.js configurar|produtos`).

- [ ] **Step 1: Criar `.claude/commands/omie-data/configurar.md`**

```markdown
---
description: Configura a credencial da Omie (App Key/App Secret) usada pela skill omie-data — valida contra a API antes de salvar.
argument-hint: opcional — "app-key SUA_KEY app-secret SEU_SECRET"; se omitido, pergunta os dois valores
---

Objetivo: configurar (ou trocar) a credencial que a skill `omie-data` usa
pra buscar dados reais da Omie.

1. Se `$ARGUMENTS` já trouxer App Key e App Secret, use-os. Senão, pergunte
   ao usuário um de cada vez, nesta ordem — nunca peça os dois na mesma
   pergunta:
   - "App Key: ..."
   - "App Secret: ..."
2. Garanta que o pacote está compilado antes de rodar o CLI:
   `npm --prefix packages/omie-data run build`
3. Rode o CLI com os valores coletados:
   `node packages/omie-data/dist/cli.js configurar --app-key "<APP_KEY>" --app-secret "<APP_SECRET>"`
4. O CLI imprime uma linha JSON:
   - `{"status":"ok","hash":"..."}` → avise o usuário que a credencial foi
     validada e salva com sucesso.
   - `{"status":"invalido","erro":"..."}` → mostre o erro reportado pela
     Omie e pergunte se o usuário quer tentar de novo com outros valores.
5. Nunca imprima o App Secret de volta pro usuário depois de configurado
   (evite ecoar segredo na conversa desnecessariamente).
```

- [ ] **Step 2: Criar `.claude/commands/omie-data/produtos.md`**

```markdown
---
description: Consulta produtos reais na Omie via skill omie-data (cache traduzido) — pergunta antes de atualizar dado antigo.
argument-hint: pedido em texto livre, ex: "lista de produtos" (opcional)
---

Objetivo: responder sobre produtos usando o cache traduzido da skill
`omie-data`, perguntando ao usuário antes de buscar dado novo na Omie.

1. Garanta que o pacote está compilado: `npm --prefix packages/omie-data run build`
2. Rode: `node packages/omie-data/dist/cli.js produtos`
3. O CLI imprime uma linha JSON. Trate cada caso:
   - `{"status":"sem_credencial"}` → avise que não há credencial
     configurada e sugira rodar `/omie-data:configurar` primeiro. Pare
     aqui.
   - `{"status":"sem_dado", ...}` → avise que ainda não há produtos
     coletados pra essa credencial e pergunte se quer buscar agora.
   - `{"status":"dado_disponivel","produtos":[...],"geradoEm":"...","idadeMs":N}`
     → informe a idade do dado (converta `idadeMs` pra algo legível, ex:
     "coletado há 2 horas") e pergunte se o usuário quer usar esse dado
     como está ou atualizar antes de responder.
4. Se o usuário confirmar que quer buscar/atualizar, rode:
   `node packages/omie-data/dist/cli.js produtos --atualizar`
   e use o resultado dessa segunda chamada daqui pra frente.
5. Formate a lista final de produtos pro usuário (nome, código, categoria,
   valor formatado, ativo/inativo) — nunca devolva o JSON cru do CLI.
   Se `produtos` vier vazio mesmo com `status: dado_disponivel`, diga
   isso claramente ("nenhum produto encontrado"), não é erro.
```

- [ ] **Step 3: Commit**

```bash
git add .claude/commands/omie-data/configurar.md .claude/commands/omie-data/produtos.md
git commit -m "feat(omie-data): comandos de skill /omie-data:configurar e /omie-data:produtos"
```

---

## Prompt pra retomar em uma nova sessão

Se esta execução for interrompida, cole isto numa sessão nova do Claude
Code, na raiz do repo (`C:\Users\walll\Projetos\omie-mcp`), branch
`omie-skill-clean`:

```
Continuar a execução do plano docs/superpowers/plans/2026-08-04-omie-data-cliente-real-e-credenciais.md via subagent-driven-development.

Contexto: este plano é a continuação do piloto Produtos da skill omie-data
(já mergeado em omie-skill-clean). Ele adiciona cliente HTTP real,
credenciais e comandos de skill (/omie-data:configurar, /omie-data:produtos).

Passos:
1. Confirme que está na branch omie-skill-clean, atualizada com o remoto
   (git status, git log --oneline -3 — o topo deve ser sobre
   "consultarProdutos" ou mais recente).
2. Rode a skill using-git-worktrees pra criar um worktree isolado a partir
   de omie-skill-clean (NÃO deixe a ferramenta nativa de worktree branchar
   do branch padrão do repo — se usar EnterWorktree e ele branchar errado,
   desfaça e crie manualmente com
   `git worktree add .worktrees/<nome> -b worktree-<nome>` a partir de
   omie-skill-clean).
3. Verifique se já existe um ledger em
   `.superpowers/sdd/2026-08-04-omie-data-cliente-real-e-credenciais/progress.md`
   dentro do worktree — se existir, retome de onde parou (não reprocesse
   tasks já marcadas `complete`). Se não existir, comece do zero.
4. Siga a skill subagent-driven-development normalmente: brief por task,
   implementador (modelo conforme a complexidade — tasks 1-4 são
   mecânicas/isoladas, cabem em modelo mais barato; Task 5 (cli.ts) e a
   revisão final merecem modelo padrão ou superior), revisão por task,
   fix loop se necessário, revisão final de branch inteira, merge local em
   omie-skill-clean, push.
5. Atenção a um problema já visto neste projeto: rodar `npm install` (ou
   `npm --prefix packages/omie-data install`) a partir da raiz do
   monorepo pode reintroduzir "omie-mcp":"file:../.." em
   packages/omie-data/package.json — sempre `cd packages/omie-data` antes
   de instalar, e conferir `git diff packages/omie-data/package.json`
   antes de commitar.
6. Depois do merge, o critério de aceite manual (rodar /omie-data:configurar
   e /omie-data:produtos com credenciais reais) fica pro usuário testar —
   não tente simular isso com credenciais falsas.
```

## Critério de aceite manual (fora do escopo de teste automatizado)

Depois da Task 6, com credenciais reais suas: rode `/omie-data:configurar`
numa conversa do Claude Code, depois `/omie-data:produtos`, e confirme que
a lista de produtos da sua conta Omie aparece formatada. Isso fecha a
validação end-to-end que ficou pendente desde o piloto anterior — não é
uma task com commit, é o passo manual que você (usuário) roda depois que
a branch estiver pronta.
