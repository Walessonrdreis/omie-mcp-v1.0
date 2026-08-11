# Ordem de produção — armadilhas

O que `produtos/op` faz diferente do que você espera. Formato fixo: o que você
espera → o que acontece → como contornar → evidência.

← [Ordem de produção](README.md) · [Índice](../README.md)

## 1. `cEtapa` é um código, e o catálogo está em outro recurso

**Você espera:** que `ListarOrdemProducao` ou `ConsultarOrdemProducao` devolvam
o nome da etapa junto com o código.

**O que acontece:** você recebe `"20"` e mais nada 🔧 (`op-gateway.ts:12-18`).
Códigos observados nesta conta ✅: `"10"`, `"20"`, `"30"`, `"40"` em OPs
abertas; `"60"` e `"80"` em concluídas.

**Mas a tradução existe** — em `produtos/etapafat`, o mesmo endpoint que serve o
pedido de venda, na operação `"28" — Ordem de Produção` ✅:

| `cEtapa` | Padrão da Omie | Nome nesta conta | OPs |
|---|---|---|---|
| `"10"` | A Produzir | **FABRICA** | 54 |
| `"20"` | Produzindo | **LOJA** | 2 |
| `"30"` | Qualidade | **PEDIDOS GRANDES** | 2 |
| `"40"` | Conferido | **Embalado** | 5 |
| `"60"` | Concluído | Concluído | 1349 |
| `"80"` | Armazenado | Armazenado | 310 |

> **Correção de 10/08/2026.** Esta página afirmava que a API não expunha o
> catálogo. Estava errado: a varredura completa das 1722 OPs mostra que o
> conjunto de valores distintos de `cEtapa` é exatamente o catálogo da operação
> `"28"`, sem um único código fora dele ✅.

O que era verdade continua: **cada conta renomeia as etapas**. Esta rebatizou
quatro das seis, com nomes que não parecem de kanban de produção ("FABRICA",
"LOJA", "PEDIDOS GRANDES"). Era essa customização que fazia o código parecer
intraduzível — e é exatamente o que `cDescricao` entrega.

Cai junto a suspeita sobre a numeração: `"60"` e `"80"` em OPs concluídas não é
anomalia, são "Concluído" e "Armazenado", dois estados pós-conclusão. **A ordem
é real.**

**Como contornar:** baixe `ListarEtapasFaturamento` uma vez, filtre a operação
`"28"` e resolva em memória. Prefira `cDescricao` e caia para `cDescrPadrao` só
quando ele vier vazio. Continue tratando código desconhecido exibindo o número
cru: uma etapa criada no ERP depois do seu último cache vai aparecer.

**Evidência:** catálogo e varredura em
[../pedido-venda/etapas.md](../pedido-venda/etapas.md) ✅;
`op-gateway.ts:12-18` 🔧 documenta o contrato antigo.

## 2. O wrapper `identificacao` só vale na escrita

**Você espera:** o mesmo formato de `param` nos quatro métodos do recurso.

**O que acontece:** `Incluir` e `Alterar` exigem os campos dentro de
`{ "identificacao": { ... } }`; `Consultar` e `Excluir` recebem a chave direto
na raiz 🔧 (`op-omie-gateway.ts:39,47` × `:31,55`).

**Como contornar:** não escreva um helper que monte `param` uma vez só para o
recurso inteiro. A regra é por método, não por endpoint — e ela não aparece em
nenhum outro recurso desta doc.

**Evidência:** `op-omie-gateway.ts:27-57` 🔧; detalhes em
[escrita.md](escrita.md).

## 3. A OP exige estrutura, e a maioria dos produtos não tem

**Você espera:** poder criar OP para qualquer produto do catálogo.

**O que acontece:** a Omie recusa se o produto não tiver malha cadastrada 🔧
(`op-gateway.ts:38-42`). Nesta conta, **653 dos 2021 produtos** têm estrutura ✅:
dois terços do catálogo não podem virar OP.

**Como contornar:** valide antes de oferecer o produto numa tela de criação de
OP — a lista de produtos com estrutura sai de `ListarEstruturas`, ver
[../estrutura/leitura.md](../estrutura/leitura.md). Deixar o usuário escolher e
falhar depois é a pior ordem.

**Evidência:** `op-gateway.ts:38-42` 🔧 (comentário registrando teste ao vivo);
contagem em [../estrutura/README.md](../estrutura/README.md) ✅.

## 4. A listagem não sabe o nome do produto

**Você espera:** que uma listagem de OPs traga o que se precisa para exibi-las.

**O que acontece:** vem `nCodProduto` cru, sem SKU e sem descrição ✅ — e **não
existe consulta de produtos em lote**. Montar a tela das 63 OPs abertas produto
a produto custa até 64 requisições e ~19 s só de espaçamento.

**Como contornar:** baixe o catálogo uma vez (41 requisições ✅), indexe por
`codigo_produto` e sirva os nomes do índice — que serve estoque e estrutura
também. Compensa a partir de ~40 produtos distintos.

**Evidência:** coleta de 10/08/2026 ✅; a conta em [leitura.md](leitura.md).

## 5. A quantidade dos insumos já vem multiplicada

**Você espera:** que `itensDetalhes[].nQtde` seja por unidade, como
`quantProdMalha` na estrutura.

**O que acontece:** é o consumo **total** da OP ✅. Numa OP de 82 unidades, o
insumo de `0,08` por unidade aparece como `6,56`.

**Como contornar:** quem lê a estrutura multiplica; quem lê os itens da OP não.
Multiplicar duas vezes infla o consumo silenciosamente.

**Evidência:** três insumos conferidos contra a ficha técnica em
[campos-itens.md](campos-itens.md) ✅.

## 6. Os insumos da OP não são a estrutura atual

**Você espera:** que os itens da OP reflitam a ficha técnica do produto.

**O que acontece:** são uma cópia congelada no dia da criação ✅. Numa OP de
2024, quatro dos seis insumos nem estão mais na estrutura de hoje, e o consumo
unitário do que restou mudou.

**Como contornar:** para saber o que uma OP consumiu, consulte a OP — nunca
recalcule pela estrutura. E não escreva teste que compare os dois: ele quebra na
primeira alteração de receita.

**Evidência:** comparação completa em [campos-itens.md](campos-itens.md) ✅.

## 7. Metade da resposta não está na interface do repo

**Você espera:** que `OrdemProducao` descreva o que a API devolve.

**O que acontece:** a API entrega bem mais ✅ — e o repo trata como opcional
coisas que sempre vêm:

| A API devolve | A interface diz 🔧 |
|---|---|
| Seis campos de auditoria em `outrasInf` (`h*`, `dAlteracao`, `uInc`, `uAlt`) | Só três campos |
| `observacoes` **também na listagem** | Só em `OrdemProducaoDetalhada`, opcional |
| `cUtilizarDoEstoque` e `info` em cada item | Não declarados |
| `itens: null` na consulta | Não declarado |

**Como contornar:** não use a presença de `observacoes` para distinguir listagem
de consulta — o discriminador confiável é `itensDetalhes`. E lembre que a
auditoria (quem criou a OP, quando foi concluída) **já está na listagem**: não
custa uma consulta extra.

**Evidência:** `op-gateway.ts:1-28,65-73` 🔧 contra a coleta de 10/08/2026 ✅;
tabelas em [campos.md](campos.md).

## 8. O único filtro é `cConcluida`

**Você espera:** filtrar por produto, etapa, número da OP ou data.

**O que acontece:** os nove nomes plausíveis são recusados com `Client-5001` ✅.
Sobra `cConcluida`, que particiona a base exatamente: 63 abertas contra 1659
concluídas ✅.

**Como contornar:** use `cConcluida: "N"` — a pergunta do chão de fábrica passa
a caber em **uma** requisição em vez de 18. Para qualquer outro recorte, varra e
filtre em memória. Kanban por etapa é agrupamento no cliente.

**Evidência:** nove tags testadas uma a uma em 10/08/2026 ✅; tabelas em
[leitura-filtros.md](leitura-filtros.md).

## 9. `dConclusao` preenchida não quer dizer OP concluída

**Você espera:** que a data de conclusão só exista em OP concluída — e que dê
para usá-la como indicador de estado.

**O que acontece:** entre três OPs abertas inspecionadas, uma trazia
`dConclusao: "25/08/2025"` e `hConclusao` preenchidos com `cConcluida: "N"` ✅.
As outras duas trouxeram os dois campos como `""` — string vazia, nunca ausente.

**Como contornar:** o estado da OP é `cConcluida`, e mais nada. Um relatório que
conta "OPs concluídas" pela presença da data classifica errado, e o erro só
aparece nas poucas OPs que passaram por conclusão e reabertura.

**Evidência:** listagem de OPs abertas em 10/08/2026 ✅; campos em
[campos.md](campos.md).

## Próximo

- [campos.md](campos.md) — o inventário completo de campos
- [campos-itens.md](campos-itens.md) — os insumos
- [leitura-filtros.md](leitura-filtros.md) — o que dá e o que não dá para filtrar
