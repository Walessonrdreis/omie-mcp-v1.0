# Correções pós-revisão-final — módulo de estoque no omie-data

Data: 2026-08-06

## Achado Important #1 — `translateProdutos` quebra com posição de estoque malformada

**Arquivo:** `packages/omie-data/src/modules/produtos/application/translate-produtos.ts`

**Problema:** o parse de `raw_estoque.payload_json` era `any` e os campos `fisico`/`nCMC`
eram somados sem proteção. Uma posição sem `fisico` ou `nCMC` (comum em itens nunca
custeados) produzia `NaN` no acumulador, que ao ser gravado em `view_produtos`
(coluna `REAL NOT NULL`) disparava `SqliteError: NOT NULL constraint failed`. Como
`translateProdutos` roda fora de transação, a exceção no meio do loop deixava
`view_produtos` com mistura de linhas antigas e novas.

**Fix:**
- Tipado o parse como `PosicaoEstoqueOmieBruta` (import de
  `../../estoque/domain/estoque.js`).
- Acumuladores agora usam `Number(posicao.fisico) || 0` e
  `Number(posicao.nCMC) || 0`, com fallback para 0 em qualquer valor ausente,
  `null` ou não numérico.

**TDD — RED:**
Teste novo `"posição de estoque malformada (fisico/nCMC ausentes) não quebra a
tradução"` em `translate-produtos.test.ts`, inserindo uma posição em `raw_estoque`
sem `fisico` nem `nCMC`. Antes do fix:

```
FAIL  ... > posição de estoque malformada (fisico/nCMC ausentes) não quebra a tradução
AssertionError: expected [Function] to not throw an error but 'SqliteError: NOT NULL constraint fail…' was thrown
"SqliteError: NOT NULL constraint failed: view_produtos.quantidade_em_estoque"
```

**TDD — GREEN:**
Após o fix, suíte completa: `85 passed (85)`, incluindo o teste novo, que confirma
`quantidade_em_estoque = 0`, `valor_em_estoque_custo = 0`, `valor_em_estoque_venda = 0`
para a posição malformada.

## Achado Minor #3 — coluna "Estoque" do CLI não bate com o spec

**Arquivo:** `packages/omie-data/src/cli.ts`, função `formatarResultadoProdutos`.

**Problema:** a coluna "Estoque" mostrava `String(produto.quantidadeEmEstoque)`
(ex: `"12"`), enquanto o spec
(`docs/superpowers/specs/2026-08-06-estoque-omie-data-design.md`, linhas 158-159)
pede `quantidade_em_estoque` formatada com 2 casas decimais + unidade.

**Fix:** coluna passou a usar
``` `${produto.quantidadeEmEstoque.toFixed(2).replace(".", ",")} ${produto.unidade}` ```
— decimal com vírgula, seguindo a mesma convenção brasileira já usada em
`formatarMoeda` (ex: `"R$ 1.234,50"`) no restante do arquivo. Resultado para o
fixture do teste (`quantidadeEmEstoque: 12`, `unidade: "UND"`): `"12,00 UND"`.

**TDD — RED/GREEN:**
O teste `"formata os produtos como tabela legível, sem JSON cru"` em `cli.test.ts`
foi atualizado de `expect(texto).toContain("12")` (frouxo demais, passava mesmo com
o bug) para `expect(texto).toContain("12,00 UND")`, que pina o formato exato exigido
pelo spec. Com o código antigo (`String(produto.quantidadeEmEstoque)` = `"12"`) essa
asserção falharia; com o fix aplicado, passa.

## Suíte completa e build

```
npm test  -> Test Files 13 passed (13) / Tests 85 passed (85)
npm run build -> tsc -p tsconfig.json (sem erros)
```
