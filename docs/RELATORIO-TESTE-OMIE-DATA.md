# Relatório de teste — skill `omie-data`

- **Data:** 2026-08-04
- **Escopo:** pacote `packages/omie-data` (CLI `configurar` / `produtos`)
- **Credencial:** validada e salva com sucesso (hash `47e6a577d73a290c`) — **App Secret não é reproduzido neste relatório**
- **Tipo:** teste exploratório para levantar bugs e melhorias — **sem correção de código nesta sessão**

---

## 1. Resumo executivo

| # | Severidade | Achado | Status |
|---|-----------|--------|--------|
| 1 | 🔴 Alta | App Secret gravado **em texto plano** e `data/` **fora do `.gitignore`** — um `git add .` vaza o secret | Confirmado |
| 2 | 🟠 Média | Diretório de dados depende de `process.cwd()` — CLI inconsistente conforme o diretório de execução | Confirmado |
| 3 | 🟡 Baixa | Assertion do libuv + exit 127 ao encerrar o processo mesmo após sucesso | Confirmado |
| 4 | 🟡 Baixa | Guard de entrypoint quebrado no Windows (CLI mudo) | **Resolvido** (`pathToFileURL`) |
| 5 | 🔵 Sugestão | Cliente HTTP sem retry/throttling e sem checagem de `response.status` | Lido no código |
| 6 | 🔵 Sugestão | Caminho `produtos` sem `try/catch` — erro vira stack trace, não linha JSON | Lido no código |
| 7 | 🔵 Sugestão | `parseArgv` sem validação de valores vazios/faltantes | Lido no código |
| 8 | 🔵 Sugestão | `collectProdutos` com paginação sem teto e sem delay entre páginas | Lido no código |
| 9 | 🔵 Sugestão | `translateProdutos` assume campos obrigatórios que podem faltar | Lido no código |
| 10 | 🔵 Sugestão | "Credencial ativa" na verdade pega o primeiro `.json` da pasta — sem marcação de ativa | Lido no código |
| 11 | ✅ Verde | Suíte de testes: **42/42 passando** (20 arquivos, `vitest`) | Confirmado |

---

## 2. O que foi testado (evidência)

Todos os comandos abaixo foram executados nesta sessão, exceto onde indicado.

| Comando | Cwd | Saída | Exit |
|---------|-----|-------|------|
| `npm --prefix packages/omie-data test` | raiz | `Test Files 20 passed / Tests 42 passed` | 0 |
| `npm --prefix packages/omie-data run build` | raiz | `tsc -p tsconfig.json` (ok) | 0 |
| `node packages/omie-data/dist/cli.js configurar --app-key … --app-secret …` | raiz | `{"status":"ok","hash":"47e6a577d73a290c"}` + assertion libuv | 127 |
| `node packages/omie-data/dist/cli.js produtos` | raiz | `{"status":"sem_dado","produtos":[],"geradoEm":null,"idadeMs":null}` | 0 |
| `node dist/cli.js produtos` (via `cd packages/omie-data`) | `packages/omie-data` | `{"status":"sem_credencial"}` | 1 |
| `git status --short` | raiz | `?? data/` | 0 |
| `node packages/omie-data/dist/cli.js produtos --atualizar` | — | **Não executado** (solicitação do usuário) — teste de API real pendente | — |

Arquivos gerados no teste:
- `data/omie-data/credentials/47e6a577d73a290c.json` — credencial salva (contém App Secret em claro).

---

## 3. Bugs confirmados

### 3.1 🔴 Secret em texto plano + `data/` fora do `.gitignore` (segurança)

- **Causa:** `salvarCredencial` (`infrastructure/credenciais.ts:14-25`) grava `app_secret` em claro em `data/omie-data/credentials/<hash>.json`. O `.gitignore` da raiz não inclui `data/`.
- **Reprodução:** `git status --short` → `?? data/`. O arquivo tem 84 bytes com `{ app_key, app_secret }` legível.
- **Impacto:** um `git add .` + push cometeria o App Secret no repositório.
- **Correção sugerida:** adicionar `data/` ao `.gitignore` (imediato) e avaliar armazenar o secret em algo menos exposto (var de ambiente, keyring, ou arquivo com permissão restrita).

### 3.2 🟠 Diretório de dados depende do `cwd`

- **Causa:** `diretorioDados()` (`infrastructure/caminhos.ts:3-6`) retorna `process.cwd()/data/omie-data` (ou `$OMIE_DATA_DIR`). O `configurar` rodou na raiz e salvou em `C:\Users\Dell\Projects\omie-mcp\data\omie-data\...`; o `produtos` rodado de `packages/omie-data` procurou em `packages/omie-data\data\omie-data\...`.
- **Reprodução:** (a) rodar `configurar` da raiz; (b) rodar `produtos` de `packages/omie-data` → `{"status":"sem_credencial"}` apesar da credencial existir.
- **Impacto:** funciona apenas por convenção (as skills sempre rodam da raiz). Qualquer cwd diferente quebra a leitura/gravação de dados e credenciais silenciosamente.
- **Correção sugerida:** ancorar o diretório de dados em local estável (ex.: `~/...` ou o diretório do pacote), ou exigir `OMIE_DATA_DIR` sempre, com resolução explícita e consistente.

### 3.3 🟡 Assertion do libuv + exit 127 na saída do processo

- **Causa:** `process.exit()` (`cli.ts:43` e `cli.ts:58`) é chamado enquanto o HTTP client ainda tem handles de rede em fechamento. No Windows o libuv aborta com `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 76` e o processo sai com 127.
- **Reprodução:** rodar `configurar` com credencial válida → o JSON `{"status":"ok"}` é impresso e o exit code final é 127.
- **Impacto:** baixo (a gravação já ocorreu antes do exit), mas exit code errado pode confundir scripts que checam o status.
- **Correção sugerida:** não chamar `process.exit()` no caminho de sucesso — deixar o Node encerrar naturalmente após `main()`; ou encerrar/aguardar o client antes do exit.

### 3.4 🟡 Guard de entrypoint quebrado no Windows — **RESOLVIDO**

- **Causa:** `cli.ts` comparava `import.meta.url === file://${process.argv[1]}`; no Windows `process.argv[1]` usa backslashes (`C:\Users\...`) e `import.meta.url` usa forward slashes (`file:///C:/Users/...`), então `main()` nunca rodava — o CLI ficava mudo.
- **Correção aplicada:** `cli.ts:65` usa `pathToFileURL(process.argv[1]).href`. Confirmado funcionando.

---

## 4. Melhorias sugeridas (lidas no código, não validadas em runtime)

1. **Cliente HTTP — retry/throttling e status** (`infrastructure/omie-http-client-real.ts:11-35`): um único `fetch` por página, sem retry e sem respeitar rate-limit (escolha conhecida do commit `dc3a7f6`). Também não checa `response.status`: se a Omie devolver HTTP 4xx/5xx com corpo não-JSON, `JSON.parse(texto)` (linha 27) estoura `SyntaxError` cru.
2. **`produtos` sem `try/catch`** (`cli.ts:46-58`): qualquer erro em `collectProdutos`/`translateProdutos` (rede, parse, banco) vira stack trace no stderr em vez da linha JSON que a skill espera. O contrato da skill quebra.
3. **`parseArgv` sem validação** (`cli.ts:15-33`): `--app-key ""` ou flag sem valor produz `undefined` no comando; não há guarda de valores vazios.
4. **Paginação sem teto/delay** (`application/collect-produtos.ts:18-38`): o `while (pagina <= totalPaginas)` não limita iterações nem insere pausa entre páginas — risco de throttle em catálogos grandes.
5. **`translateProdutos` assume campos obrigatórios** (`application/translate-produtos.ts:32-44`): `valor_unitario` e `unidade` são usados direto; se a Omie devolver produto/serviço sem esses campos, `formatarMoeda(undefined)` quebra (`.toFixed` de `undefined`) ou viola `NOT NULL` do schema.
6. **"Credencial ativa" é na verdade a primeira do diretório** (`infrastructure/credenciais.ts:33-45`): `carregarCredencialAtiva` lista `.json` e pega `arquivos[0]` — sem marcação de qual é ativa. Com 2+ credenciais, o comportamento é não-determinístico.
7. **`consultarProdutos` lê `gerado_em` de `linhas[0]`** (`application/consultar-produtos.ts:41-42`): depende do invariante de que a tradução carimba todas as linhas com o mesmo timestamp; um `ORDER BY` explícito deixaria isso explícito.
8. **Banco criado mesmo sem dado** (`infrastructure/database.ts:3-23`): `abrirBanco` cria o arquivo `.db` no primeiro `produtos` mesmo sem dados coletados.
9. **Sem controle de concorrência:** dois `produtos --atualizar` simultâneos escreveriam o mesmo SQLite.

---

## 5. Conclusão / próximos passos

Ordem sugerida de correção (não executada nesta sessão):

1. **Adicionar `data/` ao `.gitignore`** — urgente, evita vazamento do App Secret.
2. **Ancorar o data dir** em local estável (`caminhos.ts`) — destrava uso fora da raiz.
3. **Eliminar a assertion do libuv** — remover `process.exit()` no sucesso ou encerrar o client antes.
4. **`try/catch` no caminho `produtos`** — manter o contrato de saída JSON.
5. **Retry/throttling + checagem de status** no `OmieHttpClientReal` e tratamento de corpo não-JSON.
6. **Validação no `parseArgv`** e **teto/delay na paginação**.
7. **Robustez no `translateProdutos`** para campos ausentes.

**Pendente de teste:** `node packages/omie-data/dist/cli.js produtos --atualizar` (busca real na Omie + gravação do DB), que não foi executado a pedido do usuário.
