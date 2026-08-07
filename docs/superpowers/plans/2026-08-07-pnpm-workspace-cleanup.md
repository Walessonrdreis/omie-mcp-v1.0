# Corrigir ambiente pnpm da raiz + conectar omie-data como workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir a mistura npm/pnpm no `node_modules` da raiz (que já quebrou o `vitest`) e conectar `packages/omie-data` como dependência real do workspace pnpm da raiz, com um teste de regressão provando a ligação — pré-requisito do plano `2026-08-07-cache-mcp-op.md`.

**Architecture:** A raiz já tem `pnpm-workspace.yaml` (`packages: ['apps/*', 'packages/*']`), criado para o sub-projeto `labarr-api` (`packages/shared`), mas nunca usado de fato — o `node_modules` atual está com resíduo de `npm install` rodado por cima. Este plano: (1) reinstala a raiz limpa com pnpm; (2) adiciona `omie-data` como dependência declarada do workspace, com `declaration: true` no seu `tsconfig.json` pra emitir `.d.ts`; (3) prova a ligação com um teste real.

**Tech Stack:** pnpm 10.x, TypeScript (NodeNext), Vitest.

## Global Constraints

- Não remover nem alterar `packages/shared` (pertence ao `labarr-api`, fora de escopo deste plano) — só ler/confirmar que continua intacto.
- `pnpm-workspace.yaml` não precisa mudar — `packages/*` já cobre `packages/omie-data`.
- Build (`pnpm run build`, raiz) + suíte completa (`pnpm test`, raiz) antes de cada commit.
- Um commit por task concluída.
- Nenhum comando `npm install`/`npm run` na raiz a partir de agora — tudo via `pnpm`. `packages/omie-data` continua podendo usar seus próprios scripts (`npm test`/`npm run build` dentro da pasta), mas a instalação de dependências passa a ser só via `pnpm install` rodado na raiz (que agora cobre todos os workspaces, incluindo `omie-data`) — o velho workaround de `npm install --prefix packages/omie-data` fica obsoleto.

---

### Task 1: Reinstalar `node_modules` da raiz limpo, só com pnpm

**Files:**
- Nenhum arquivo de código — só `node_modules/` (não versionado) e verificação de `pnpm-lock.yaml` (não deve mudar de forma inesperada).

**What changes:** Remove o `node_modules` da raiz (contaminado por uma mistura de `npm install` rodado sobre uma estrutura pnpm) e reinstala do zero respeitando `pnpm-lock.yaml`.

**Test strategy:** Não há teste novo — a validação é a suíte existente da raiz (`vitest`) voltar a rodar sem o erro `ERR_PACKAGE_PATH_NOT_EXPORTED` que está ocorrendo hoje.

- [ ] **Step 1: Confirmar o estado quebrado atual (evidência do problema, opcional mas recomendado)**

Run: `cd /caminho/do/repo && rm -rf dist && pnpm test 2>&1 | head -20` (usando o `node_modules` NPM-contaminado que já existe)
Expected: erro `ERR_PACKAGE_PATH_NOT_EXPORTED` mencionando `vite/package.json`, confirmando a mistura npm/pnpm.

- [ ] **Step 2: Remover `node_modules` da raiz**

```bash
rm -rf node_modules
```

- [ ] **Step 3: Reinstalar com pnpm**

```bash
pnpm install
```

Expected: instala sem erros. `pnpm-lock.yaml` não deve ter alterações significativas (a raiz já estava corretamente descrita nele) — rode `git diff pnpm-lock.yaml` depois e confirme que o diff é vazio ou trivial (ex: só resolução de hash/versão idêntica).

- [ ] **Step 4: Verificar `packages/shared` (labarr-api) não foi afetado**

Run: `ls packages/shared/node_modules 2>&1 | head -5`
Expected: continua existindo (pnpm workspaces compartilha/gerencia isso junto, não deve quebrar).

- [ ] **Step 5: Rodar a suíte da raiz e confirmar que passa**

Run: `pnpm test`
Expected: PASS, sem o erro `ERR_PACKAGE_PATH_NOT_EXPORTED` — os testes já existentes da raiz (ex: `src/**/*.test.ts`) devem rodar normalmente.

- [ ] **Step 6: Rodar o build da raiz e confirmar que passa**

Run: `pnpm run build`
Expected: `tsc -p tsconfig.json` sem erros.

- [ ] **Step 7: Commit**

```bash
git add pnpm-lock.yaml
git commit -m "chore: reinstalar node_modules da raiz limpo via pnpm (corrige mistura com npm que quebrava o vitest)"
```

Nota: se `pnpm-lock.yaml` não tiver nenhuma mudança real (diff vazio), não há nada pra commitar neste step — confirme com `git status --short` antes de tentar. Se vazio, marque o step como feito e siga (o `node_modules` reinstalado não é rastreado pelo git).

---

### Task 2: Adicionar `packages/omie-data` como dependência do workspace raiz

**Files:**
- Modify: `package.json` (raiz)
- Modify: `packages/omie-data/tsconfig.json`
- Modify: `packages/omie-data/src/index.ts`
- Create: `src/integrations/omie-data/workspace-link.test.ts`

**Interfaces:**
- Produces: o pacote `omie-data` passa a exportar publicamente `abrirBanco(caminho: string): Database.Database` a partir do seu `index.ts` — ponto de entrada que o plano `2026-08-07-cache-mcp-op.md` vai estender com mais exports (não remova nem renomeie o que este task adiciona).

**Test strategy:** Teste de regressão real (não é só prova de conceito descartável) — se a ligação do workspace quebrar no futuro (ex: alguém reverte `declaration: true`, ou remove a dependência do `package.json` da raiz), este teste falha imediatamente na suíte da raiz.

- [ ] **Step 1: Escrever o teste que falha**

Crie `src/integrations/omie-data/workspace-link.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { abrirBanco } from "omie-data";

describe("workspace omie-data", () => {
  it("expõe abrirBanco importável do pacote omie-data via workspace pnpm", () => {
    expect(typeof abrirBanco).toBe("function");
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `pnpm test -- workspace-link.test.ts`
Expected: FAIL — `Cannot find package 'omie-data'` (ou erro de resolução de módulo equivalente), porque `omie-data` ainda não é uma dependência declarada da raiz.

- [ ] **Step 3: Adicionar `declaration: true` no tsconfig do `omie-data`**

Edite `packages/omie-data/tsconfig.json` — adicione `"declaration": true` dentro de `compilerOptions`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src"]
}
```

Sem isso, o `tsc` não emite arquivos `.d.ts` em `dist/`, e a raiz não consegue tipar a importação de `omie-data`.

- [ ] **Step 4: Popular `packages/omie-data/src/index.ts` com o export real**

O arquivo hoje só tem `export {};` (placeholder vazio). Substitua por:

```typescript
export { abrirBanco } from "./infrastructure/database.js";
```

- [ ] **Step 5: Rebuildar `omie-data` e confirmar que `dist/index.js` + `dist/index.d.ts` existem**

Run (dentro de `packages/omie-data`): `rm -rf dist && npm run build`
Expected: sem erros. Confirme com `ls dist/index.js dist/index.d.ts` — os dois arquivos devem existir.

- [ ] **Step 6: Adicionar `omie-data` como dependência da raiz**

Edite `package.json` (raiz), dentro de `"dependencies"`, adicione:

```json
"omie-data": "workspace:*"
```

(mantenha as outras dependências existentes inalteradas, só adicione esta linha)

- [ ] **Step 7: Reinstalar pra pnpm linkar o workspace**

Run (na raiz): `pnpm install`
Expected: sem erros. `pnpm-lock.yaml` agora deve ter uma entrada nova pra `omie-data` na seção `importers: .`.

- [ ] **Step 8: Rodar o teste e confirmar que passa**

Run: `pnpm test -- workspace-link.test.ts`
Expected: PASS.

- [ ] **Step 9: Rodar a suíte completa da raiz + build, confirmar que tudo passa**

```bash
pnpm test
pnpm run build
```

Expected: ambos limpos, sem erros novos.

- [ ] **Step 10: Commit**

```bash
git add package.json pnpm-lock.yaml packages/omie-data/tsconfig.json packages/omie-data/src/index.ts src/integrations/omie-data/workspace-link.test.ts
git commit -m "feat: conectar omie-data como dependência do workspace pnpm da raiz"
```

---

### Task 3: Atualizar documentação da instalação (o workaround antigo de npm fica obsoleto)

**Files:**
- Modify: `packages/omie-data/CONTEXT.md`
- Modify: `README.md` (raiz), seção de configuração, se mencionar instalação de dependências

**What changes:** O bug conhecido "`npm install` reintroduz `omie-mcp:file:../..` no `package.json` do `omie-data`, sempre rodar com `cd packages/omie-data` antes" não se aplica mais depois deste plano — a instalação correta agora é `pnpm install` rodado na raiz, cobrindo todos os workspaces de uma vez.

- [ ] **Step 1: Atualizar `packages/omie-data/CONTEXT.md`**

Adicione ao final do arquivo uma seção nova:

```markdown

## Instalação de dependências

Este pacote é um workspace do pnpm da raiz do repo. Instale/atualize
dependências sempre rodando `pnpm install` **na raiz** do repo — nunca
`npm install` dentro desta pasta (o antigo workaround de `cd
packages/omie-data && npm install` ficou obsoleto depois que o pacote
virou dependência real do workspace pnpm; ver
`docs/superpowers/plans/2026-08-07-pnpm-workspace-cleanup.md`).
```

- [ ] **Step 2: Conferir se `README.md` da raiz menciona `npm install` como setup — se sim, atualizar pra `pnpm install`**

Run: `grep -n "npm install" README.md`

Se houver ocorrência na seção de "Configuração" (setup inicial do projeto), troque `npm install` por `pnpm install` nessa linha específica. Se não houver ocorrência, pule este step.

- [ ] **Step 3: Commit**

```bash
git add packages/omie-data/CONTEXT.md README.md
git commit -m "docs: atualizar instrução de instalação — pnpm install na raiz substitui o workaround antigo de npm"
```

---

## Resumo de tasks

| # | Task |
|---|------|
| 1 | Reinstalar node_modules da raiz limpo via pnpm |
| 2 | Conectar omie-data como dependência do workspace pnpm |
| 3 | Atualizar documentação da instalação |

## Fora de escopo

- Qualquer mudança em `packages/shared` ou `apps/api` (labarr-api).
- Migrar `packages/omie-data` para usar pnpm em vez de npm nos seus próprios scripts internos (`test`/`build` continuam `vitest run`/`tsc`, agnósticos de gerenciador — só a instalação de dependências muda).
- Módulo de Ordem de Produção em si — plano separado, `2026-08-07-cache-mcp-op.md`, depende deste.
