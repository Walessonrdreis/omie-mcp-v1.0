# Dicionário de campos

O mesmo conceito tem nome diferente em cada recurso da Omie. Esta é a tabela
canônica para traduzir entre eles.

← [Índice](../README.md)

## Como ler

Um conceito por linha, uma coluna por recurso. `—` significa que aquele recurso
não expõe o conceito.

As colunas chegam por fase: **produtos** e **estrutura** agora (v1); estoque e
ordem de produção na v2; pedido de venda na v3.

## Tabela

| Conceito | produtos | estrutura |
|---|---|---|
| ID interno do produto | `codigo_produto` | `idProduto` / `idProdMalha` |
| Código do usuário (SKU) | `codigo` | `codProduto` / `codProdMalha` |
| Código de integração | `codigo_produto_integracao` | `intProduto` / `intProdMalha` |
| Descrição do produto | `descricao` | `descrProduto` / `descrProdMalha` |
| Unidade | `unidade` | `unidProduto` / `unidProdMalha` |
| ID da família | `codigo_familia` | `idFamilia` / `idFamMalha` |
| Descrição da família | `descricao_familia` | `descrFamilia` / `descrFamMalha` |
| Peso líquido | `peso_liq` | `pesoLiqProduto` / `pesoLiqProdMalha` |
| Peso bruto | `peso_bruto` | `pesoBrutoProduto` / `pesoBrutoProdMalha` |
| Quantidade | — | `quantProdMalha` |
| Código de status da resposta | `codigo_status` | `codStatus` |
| Descrição do status | `descricao_status` | `descrStatus` |

Onde a célula de estrutura tem dois nomes separados por `/`, o primeiro descreve
o **produto pai** e o segundo o **componente** — ver
[conceitos.md](conceitos.md) 🔧.

**Ressalva:** a tabela nomeia o campo, não garante que ele venha. Em
`geral/malha`, `intProduto` e `intProdMalha` (mais o `intMalha`, que não tem
equivalente em produtos) **não aparecem em nenhuma resposta de leitura** ✅,
embora a interface do repo os declare obrigatórios. `intMalha` ainda é exigido
na escrita 🔧. Ou seja: o conceito "código de integração" existe no payload de
entrada da malha, mas não no de saída — ver
[../estrutura/campos.md](../estrutura/campos.md).

Fontes: `src/modules/produtos/domain/interfaces/produtos-gateway.ts:1-11,26-55`
e `src/modules/estrutura/domain/interfaces/estrutura-gateway.ts:6-43` 🔧.

## Padrões de renomeação

Reconhecer o padrão poupa consultar a tabela toda hora.

**1. Três estilos de nomenclatura, um por família de recurso** 🔧

| Estilo | Cara | Recursos |
|---|---|---|
| snake | `codigo_produto`, `valor_unitario` | `geral/produtos` (com uma exceção, abaixo), `produtos/pedido` |
| húngaro | `nCodProduto`, `cCodIntOP` | `produtos/op`, `estoque/consulta` |
| camelo abreviado | `idProdMalha`, `descrFamMalha` | `geral/malha` |

O mesmo dado atravessa os três estilos conforme você percorre a cadeia
produto → malha → OP.

**O estilo é do recurso, não da resposta — com uma exceção conhecida:** o bloco
`caracteristicas`, devolvido por `ConsultarProduto`, vem em húngaro
(`cNomeCaract`, `cConteudo`, `nCodCaract`) dentro de um recurso snake ✅. É o
único ponto onde os dois estilos convivem na mesma resposta. Um parser que
assume snake para o objeto inteiro não dá erro ali: os campos simplesmente viram
`undefined`. Ver [../produtos/armadilhas.md](../produtos/armadilhas.md).

**2. No estilo húngaro, o prefixo indica o tipo** 🔧

| Prefixo | Tipo | Exemplo |
|---|---|---|
| `n` | número | `nCodProduto`, `nQtde` |
| `c` | string | `cCodIntOP`, `cEtapa` |
| `d` | data | `dDtPrevisao`, `dConclusao` |

Útil ao ler um campo desconhecido: `nCodProjeto` é um número, `cObs` é texto.

**3. Em `geral/malha`, o sufixo `Malha` marca o componente** 🔧

`descrProduto` é o produto pai; `descrProdMalha` é o insumo. Sem o sufixo, o
campo fala do pai.

**4. Status de escrita vem sempre em par código + descrição** 🔧

O nome muda (`codigo_status`/`descricao_status`, `codStatus`/`descrStatus`,
`cCodStatus`/`cDesStatus`), mas a forma é a mesma: um código curto e uma
mensagem legível.

**5. `codigo_produto_integracao` × `cCodIntOP`** 🔧

Ambos são "código de integração", mas de **entidades diferentes**: o primeiro
identifica um produto, o segundo uma ordem de produção. O prefixo/sufixo diz de
qual entidade o campo fala — não assuma que "integração" significa sempre
produto.

## Recomendação para quem integra

Traduza para nomes estáveis na borda e **nunca propague o nome da Omie para
dentro do seu app** 🔧. Um front que conhece `nCodProduto`, `codigo_produto` e
`nCodProd` como coisas diferentes já nasceu com dívida.

Sugestão de nomes neutros:

| Conceito | Nome sugerido |
|---|---|
| ID interno do produto | `produtoId` |
| Código do usuário (SKU) | `produtoSku` |
| Descrição do produto | `produtoDescricao` |
| Quantidade | `quantidade` |
| Unidade | `unidade` |

O modelo completo, com as agregações, sai na fase v3 em
`90-modelo-frontend.md`.

## Próximo

- [conceitos.md](conceitos.md) — o que os termos significam
- [../convencoes/tipos-formatos.md](../convencoes/tipos-formatos.md) — os
  formatos que esses campos carregam
