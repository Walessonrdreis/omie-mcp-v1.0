# Produtos — armadilhas

O que `geral/produtos` faz diferente do que você espera. Formato fixo: o que
você espera → o que acontece → como contornar → evidência.

← [Produtos](README.md) · [Índice](../README.md)

## 1. `codigo` opcional na doc, obrigatório na prática

**Você espera:** a doc pública da Omie marca `codigo` (SKU) como opcional no
`IncluirProduto`, então dá pra criar produto só com `descricao` e `unidade`.

**O que acontece:** a inclusão falha. `codigo` é exigido de fato.

**Como contornar:** sempre gere um SKU antes de incluir. Se não tem um esquema
de codificação, derive um determinístico do seu lado — nunca deixe a Omie
decidir, porque ela não decide.

**Evidência:** `src/modules/produtos/domain/interfaces/produtos-gateway.ts:21-25`
🔧 — comentário de contrato registrando teste ao vivo contra a API real.

## 2. Produto com qualquer movimento de estoque nunca mais pode ser excluído

**Você espera:** ajustou o estoque por engano, exclui o ajuste, e o produto
volta a ser excluível.

**O que acontece:** a Omie exclui o ajuste normalmente, mas o "Movimento de
Estoque (calculado)" resultante fica registrado para sempre no produto. A
partir do primeiro ajuste, `ExcluirProduto` recusa com erro de dependência —
permanentemente, mesmo com o ajuste já excluído.

**Como contornar:** não há desfazer. Trate `IncluirAjusteEstoque` como
operação de sentido único sobre o ciclo de vida do produto. Para produtos de
teste, use uma conta de sandbox; em produção, prefira **inativar**
(`inativo: "S"`) a excluir.

**Evidência:** `src/modules/estoque/domain/interfaces/estoque-gateway.ts:66-72`
🔧 — comentário registrando teste ao vivo. Detalhado do lado do estoque em
[../estoque/armadilhas.md](../estoque/armadilhas.md).

## 3. Não existe consulta em lote

**Você espera:** passar uma lista de códigos e receber os produtos de uma vez,
como faria com um `WHERE id IN (...)`.

**O que acontece:** `ConsultarProduto` resolve **um** produto por chamada. Não
há endpoint que aceite lista. Enriquecer N produtos custa N requisições, com
espaçamento mínimo de 300ms entre elas.

**Como contornar:** quando N passa de algumas dezenas, **liste e indexe em
memória**. O catálogo desta conta tem 2021 produtos ✅ — 41 chamadas a 50 por
página contra 2021 chamadas individuais. O repo já deduplica e paraleliza com
concorrência 5, o que ajuda mas não muda a ordem de grandeza.

**Evidência:** `produtos-gateway.ts:70-75` e
`src/integrations/omie/omieClient.ts:23` (`INTERVALO_MINIMO_MS = 300`) 🔧;
contagem de 2021 registros observada em 10/08/2026 ✅.

## 4. A consulta traz mais campos que a listagem

**Você espera:** listar e consultar devolvem a mesma coisa, só que uma em
lote.

**O que acontece:** `ConsultarProduto` é um **superconjunto** de
`ListarProdutos` ✅. Só a consulta traz `caracteristicas`, `variacao`,
`id_produto_variacao`, `modalidade_icms`, `videos`, `tabelas_preco`,
`componentes_kit`, `medicamento`, `combustivel`, `veiculo` e `armamento`. A
listagem não tem nenhum campo exclusivo.

Pior: `imagens` existe nos dois, mas com contratos diferentes. Na listagem o
campo é **omitido** quando o produto não tem imagem; na consulta ele vem `[]`
✅. E vizinhos vazios não seguem a mesma regra — `videos`, `tabelas_preco` e
`componentes_kit` vazios vêm `null`, não `[]` ✅.

**Como contornar:** se precisa de característica, variação ou kit, não tem
jeito — é consulta produto a produto (e cai na armadilha 3). No parsing, trate
`undefined`, `null` e `[]` como o mesmo "vazio".

**Evidência:** coleta de 10/08/2026, `ListarProdutos` (3 registros) e
`ConsultarProduto` (`codigo_produto: 9116171984`) ✅. Lista completa em
[campos.md](campos.md).

## 5. `quantidade_estoque` sempre vem `0`

**Você espera:** o cadastro do produto traz o saldo, então dá pra montar
inventário só com `ListarProdutos`.

**O que acontece:** `quantidade_estoque` veio `0` em **todos** os registros
observados, tanto na listagem quanto na consulta ✅ — inclusive em produtos com
saldo real. É um `0` que significa "não sei", não "zero unidades".

**Como contornar:** cruze com `estoque/consulta`. É o que o módulo `produtos`
faz para calcular quantidade e valor reais.

**Evidência:** `produtos-omie-gateway.ts:16-22` 🔧 e coleta de 10/08/2026 ✅.
O saldo real está em [../estoque/campos.md](../estoque/campos.md).

## 6. Omitir os flags de filtro muda o cadastro, não só o filtro

**Você espera:** `apenas_importado_api` e `filtrar_apenas_omiepdv` são filtros
opcionais; omiti-los traz tudo.

**O que acontece:** omiti-los traz **menos** — 593 registros contra 2021 com
os dois em `"N"` ✅. E o mesmo produto volta com conteúdo fiscal diferente: com
os flags, `cfop`, `csosn_icms`, `cst_pis`, `cst_cofins` e `class_trib` vêm
`""` e as alíquotas `0`; sem os flags, vêm preenchidos, mais `origem_imposto`
e `dadosIbpt` ✅.

**Como contornar:** para catálogo e chão de fábrica, envie os dois `"N"` — é o
que o gateway faz e é o que traz o cadastro completo. Para leitura fiscal,
**não confie na resposta com os flags**: ela zera o fiscal.

**Evidência:** coleta de 10/08/2026, duas chamadas com
`registros_por_pagina: 1` variando só os flags ✅; comportamento do gateway em
`produtos-omie-gateway.ts:34-40` 🔧. Tabela comparativa em
[leitura.md](leitura.md).

## 7. `caracteristicas` fala outro dialeto

**Você espera:** `geral/produtos` é snake do começo ao fim.

**O que acontece:** o bloco `caracteristicas` da consulta vem em estilo
húngaro — `cNomeCaract`, `cConteudo`, `nCodCaract`, `cExibirItemNF` ✅. É o
único ponto do recurso onde os dois estilos convivem na mesma resposta.

**Como contornar:** normalize na borda, como recomenda
[../glossario/campos.md](../glossario/campos.md). Um parser que assume snake
para o objeto inteiro quebra silenciosamente aqui — os campos viram
`undefined`, não erro.

**Evidência:** `ConsultarProduto` em 10/08/2026 ✅.

## Próximo

- [campos.md](campos.md) — o inventário completo de campos
- [../convencoes/erros.md](../convencoes/erros.md) — por que a falha vem em
  HTTP 200
