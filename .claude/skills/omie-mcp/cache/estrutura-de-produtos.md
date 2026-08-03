# Estrutura de Produtos

Estrutura/BOM de produtos (insumos por produto).

### `omie_estrutura_listar`

Lista os produtos que TÊM estrutura (BOM/ficha técnica) cadastrada, já com o nome do produto e o nome de cada insumo/componente (a Omie devolve isso pronto — não precisa cruzar com o cadastro de produtos). Método Omie: ListarEstruturas (recurso 'malha'). Suporta paginação (pagina/registros_por_pagina, padrão 50) e o parâmetro genérico 'filtros' (critérios campo/operador/valor sobre qualquer campo do produto, ex: descricaoProduto, itens).

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Quantidade de produtos por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)

### `omie_estrutura_buscar_por_produto`

Busca a estrutura (BOM/ficha técnica) de um produto pelo NOME/descrição (ou trecho dela) ou pelo código, sem precisar saber o código interno da Omie de antemão — ex: 'qual a estrutura do produto 100kg'. Internamente pagina ListarEstruturas e filtra pela descrição/código do produto (a Omie não tem busca por texto nesse endpoint). Devolve os produtos que baterem, já com nome e quantidade de cada insumo. Se vier mais de um resultado, refine o termo de busca.

**Parâmetros:**

  - `termo` (string, **obrigatório**) — Nome/descrição (ou trecho dela) ou código do produto a procurar, ex: '100kg', 'PROD-001'.

**Tipo:** use-case (lógica própria)

### `omie_estrutura_incluir` (⚠️ destrutiva)

Adiciona um ou mais insumos/componentes à estrutura (BOM/ficha técnica) de um produto. Método Omie: IncluirEstrutura. O produto pai (idProduto) precisa ser do tipo '03 - Produto em Processo' ou '04 - Produto Acabado' (a Omie recusa outros tipos). Cada item exige intMalha (identificador único que você inventa pro item, ex: 'ITEM-001' — testado ao vivo: é obrigatório mesmo a doc pública da Omie dizendo o contrário), idProdMalha (código do produto/insumo componente, já cadastrado) e quantProdMalha.

**Parâmetros:**

  - `idProduto` (number, **obrigatório**) — Código Omie do produto pai (precisa ser tipo '03 - Produto em Processo' ou '04 - Produto Acabado', senão a Omie recusa).
  - `itens` (array, **obrigatório**) — Insumos/componentes a adicionar.

**Tipo:** use-case (lógica própria)

### `omie_estrutura_alterar` (⚠️ destrutiva)

Altera item(ns) já existentes na estrutura de um produto (ex: mudar quantidade de um insumo). Método Omie: AlterarEstrutura. Cada item precisa de idMalha (identifica o item — veja em omie_estrutura_buscar_por_produto/omie_estrutura_listar) e idProdMalha (testado ao vivo: obrigatório mesmo só pra mudar quantidade).

**Parâmetros:**

  - `idProduto` (number, **obrigatório**) — Código Omie do produto pai.
  - `itens` (array, **obrigatório**) — Itens a alterar.

**Tipo:** use-case (lógica própria)

### `omie_estrutura_excluir` (⚠️ destrutiva)

Remove um item específico da estrutura (BOM) de um produto. Método Omie: ExcluirEstrutura. Precisa de idProduto (produto pai) e idMalha (identifica o item — veja em omie_estrutura_buscar_por_produto/omie_estrutura_listar).

**Parâmetros:**

  - `idProduto` (number, **obrigatório**) — Código Omie do produto pai.
  - `idMalha` (number, **obrigatório**) — Identificador do item de estrutura a remover.

**Tipo:** use-case (lógica própria)
