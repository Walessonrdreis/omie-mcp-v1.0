# Produtos — campos da resposta

Campos de `produto_servico_cadastro[]` em `ListarProdutos`, e o que
`ConsultarProduto` acrescenta.

← [Produtos](README.md) · [Índice](../README.md)

## Núcleo (o que o repo modela)

Estes são os campos que `ProdutoOmie` declara
(`src/modules/produtos/domain/interfaces/produtos-gateway.ts:1-11`). A coluna
"Sempre vem?" foi verificada em 10/08/2026 contra a conta real, com
`registros_por_pagina: 3`.

| Campo | Tipo | Sempre vem? | Significado | Sinônimo |
|---|---|---|---|---|
| `codigo_produto` | number | ✅ sim | ID interno gerado pela Omie | `idProduto` (estrutura) |
| `codigo` | string | ✅ sim | SKU definido pelo usuário | `codProduto` (estrutura) |
| `codigo_produto_integracao` | string | ✅ sim, mas `""` | Chave definida por quem integra | `intProduto` (estrutura) |
| `descricao` | string | ✅ sim | Nome do produto | `descrProduto` (estrutura) |
| `unidade` | string | ✅ sim | Unidade de medida (`UND`, `KG`) | `unidProduto` (estrutura) |
| `valor_unitario` | number | ✅ sim | Preço de venda cadastrado | — |
| `inativo` | string | ✅ sim | Flag `"S"`/`"N"` | — |
| `codigo_familia` | number | ✅ sim | ID da família | `idFamilia` (estrutura) |
| `descricao_familia` | string | ✅ sim | Nome da família | `descrFamilia` (estrutura) |

`descricao_familia` é opcional na interface TS (`descricao_familia?`) mas veio
preenchido em todos os registros observados ✅. Trate como presente, não
garantido.

A tradução completa entre recursos está em
[../glossario/campos.md](../glossario/campos.md).

## O que a resposta real traz além disso

A interface do repo modela 9 campos. A resposta real de `ListarProdutos` traz
**cerca de 60** ✅. Os que o repo ignora, agrupados:

| Grupo | Campos | Sempre vem? |
|---|---|---|
| Identificação extra | `codInt_familia`, `importado_api`, `tipoItem` | ✅ sim |
| Descrição livre | `descr_detalhada`, `obs_internas`, `marca`, `modelo` | ✅ sim, podem vir `""` |
| Físico | `peso_liq`, `peso_bruto`, `altura`, `largura`, `profundidade` | ✅ sim, `0` quando não cadastrado |
| Logística | `lead_time`, `dias_garantia`, `dias_crossdocking`, `estoque_minimo` | ✅ sim |
| Estoque | `quantidade_estoque` | ✅ sim, **sempre `0`** — ver [armadilhas.md](armadilhas.md) |
| Fiscal | `ncm`, `cest`, `cfop`, `cst_icms`, `csosn_icms`, `cst_pis`, `cst_cofins`, `class_trib`, `cst_ibs_cbs`, `codigo_beneficio`, `motivo_deson_icms` | ✅ sim, conteúdo depende dos filtros — ver [armadilhas.md](armadilhas.md) |
| Alíquotas | `aliquota_icms`, `aliquota_pis`, `aliquota_cofins`, `aliquota_ibpt`, `aliquota_cbs`, `aliquota_ibs_uf`, `aliquota_ibs_mun`, `per_icms_fcp` | ✅ sim |
| Reduções | `red_base_icms`, `red_base_pis`, `red_base_cofins`, `perc_reducao_cbs`, `perc_reducao_ibs_uf`, `perc_reducao_ibs_mun` | ✅ sim |
| Flags | `bloqueado`, `bloquear_exclusao`, `produto_lote`, `produto_variacao`, `exibir_descricao_nfe`, `exibir_descricao_pedido` | ✅ sim, `"S"`/`"N"` |
| Comercial | `ean` | ✅ sim, pode vir `""` |
| Objetos | `info`, `recomendacoes_fiscais` | ✅ sim |
| Condicionais | `imagens`, `dadosIbpt`, `origem_imposto` | ✅ **não** — ausentes em parte dos registros |

`imagens` só aparece nos registros que têm imagem cadastrada ✅. Não confunda
"campo ausente" com "sem imagem": ambos significam a mesma coisa aqui, mas o
código precisa tratar `undefined`, não `[]`.

`dadosIbpt` e `origem_imposto` aparecem ou não conforme os filtros da
requisição — ver [armadilhas.md](armadilhas.md).

## `info` — auditoria do cadastro

| Campo | Tipo | Sempre vem? | Significado |
|---|---|---|---|
| `dInc` / `hInc` | string | ✅ sim | Data e hora de inclusão (`DD/MM/AAAA`, `HH:MM:SS`) |
| `dAlt` / `hAlt` | string | ✅ sim | Data e hora da última alteração |
| `uInc` / `uAlt` | string | ✅ sim | Código do usuário Omie que incluiu/alterou |

Os formatos seguem
[../convencoes/tipos-formatos.md](../convencoes/tipos-formatos.md). O usuário
vem como código interno (`P000823983`), não como nome ✅.

## O que só existe em `ConsultarProduto`

A consulta devolve **tudo que a listagem devolve, mais os campos abaixo** ✅.
A listagem não tem nenhum campo exclusivo.

| Campo | Tipo | Sempre vem? | Significado |
|---|---|---|---|
| `caracteristicas` | array | ✅ sim | Características do produto — chaves em estilo húngaro (`cNomeCaract`, `cConteudo`, `nCodCaract`) |
| `imagens` | array | ✅ sim | Vem `[]` quando não há imagem, ao contrário da listagem |
| `variacao` | string | ✅ sim | Flag `"S"`/`"N"` |
| `id_produto_variacao` | number | ✅ sim | `0` quando não é variação |
| `modalidade_icms` | string | ✅ sim | Modalidade de base de cálculo do ICMS |
| `videos` | null/array | ✅ sim | `null` quando vazio |
| `tabelas_preco` | null/array | ✅ sim | `null` quando vazio |
| `componentes_kit` | null/array | ✅ sim | `null` quando vazio |
| `medicamento` | null/object | ✅ sim | Bloco fiscal específico; `null` quando não se aplica |
| `combustivel` | null/object | ✅ sim | Idem |
| `veiculo` | null/object | ✅ sim | Idem |
| `armamento` | null/object | ✅ sim | Idem |

Note a inconsistência: `imagens` vazio vem `[]`, mas `videos`, `tabelas_preco`
e `componentes_kit` vazios vêm `null` ✅. Não assuma array.

`caracteristicas` é o único bloco de `geral/produtos` em estilo húngaro — o
resto do recurso é snake. Ver
[../glossario/campos.md](../glossario/campos.md).

## Próximo

- [leitura.md](leitura.md) — como pedir esses campos
- [armadilhas.md](armadilhas.md) — onde eles enganam
