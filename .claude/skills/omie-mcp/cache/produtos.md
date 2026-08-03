# Produtos

Cadastro de produtos/serviços, famílias e consulta.

### `omie_produtos_consultar`

Consulta o cadastro de um produto específico. Método Omie: ConsultarProduto.

**Parâmetros:**

  - `param` (objeto livre, **obrigatório**) — campos conforme documentação oficial da Omie para este método (não tipado no MCP; a ferramenta repassa o objeto direto).

**Tipo:** passthrough (`geral/produtos` → `ConsultarProduto`)

### `omie_produtos_incluir` (⚠️ destrutiva)

Cria um novo produto/serviço no cadastro. Método Omie: IncluirProduto. Campos obrigatórios (testado ao vivo — a doc pública da Omie erra ao marcar 'codigo' como opcional): codigo (SKU), descricao, unidade. Opcionais comuns: codigo_produto_integracao, ncm, valor_unitario, ean, codigo_familia (via omie_familias_listar), tipoItem, peso_liq, peso_bruto, marca, modelo. Retorna codigo_produto (código Omie gerado).

**Parâmetros:**

  - `codigo` (string, **obrigatório**) — Código/SKU do produto (obrigatório na Omie, apesar da doc pública dizer o contrário).
  - `codigo_produto_integracao` (string, opcional) — Código de integração externo, se você mantém um.
  - `descricao` (string, **obrigatório**) — Descrição/nome do produto.
  - `unidade` (string, **obrigatório**) — Unidade de medida (ex: UN, KG, CX).
  - `ncm` (string, opcional) — Código NCM (obrigatório pra produtos, opcional pra serviços).
  - `valor_unitario` (number, opcional) — Preço unitário de venda.
  - `ean` (string, opcional)
  - `codigo_familia` (number, opcional) — Código da família (via omie_familias_listar).
  - `tipoItem` (string, opcional)
  - `peso_liq` (number, opcional)
  - `peso_bruto` (number, opcional)
  - `marca` (string, opcional)
  - `modelo` (string, opcional)

**Tipo:** use-case (lógica própria)

### `omie_produtos_alterar` (⚠️ destrutiva)

Altera um produto/serviço já cadastrado. Método Omie: AlterarProduto. Precisa identificar o produto por codigo_produto, codigo (SKU) ou codigo_produto_integracao, e enviar os campos que devem mudar (mesmos campos aceitos em omie_produtos_incluir).

**Parâmetros:**

  - `codigo_produto` (number, opcional) — Código Omie do produto a alterar.
  - `codigo` (string, opcional) — SKU do produto a alterar (alternativa ao codigo_produto).
  - `codigo_produto_integracao` (string, opcional) — Código de integração do produto a alterar (alternativa).
  - `descricao` (string, opcional)
  - `unidade` (string, opcional)
  - `ncm` (string, opcional)
  - `valor_unitario` (number, opcional)
  - `ean` (string, opcional)
  - `codigo_familia` (number, opcional)
  - `tipoItem` (string, opcional)
  - `peso_liq` (number, opcional)
  - `peso_bruto` (number, opcional)
  - `marca` (string, opcional)
  - `modelo` (string, opcional)

**Tipo:** use-case (lógica própria)

### `omie_produtos_excluir` (⚠️ destrutiva)

Exclui um produto/serviço do cadastro. Método Omie: ExcluirProduto. Identifique o produto por codigo_produto, codigo (SKU) ou codigo_produto_integracao (só um deles é suficiente). A Omie recusa a exclusão se o produto já tiver movimentação (pedido, estoque, OP, etc.).

**Parâmetros:**

  - `codigo_produto` (number, opcional)
  - `codigo` (string, opcional)
  - `codigo_produto_integracao` (string, opcional)

**Tipo:** use-case (lógica própria)

### `omie_produtos_listar`

Lista produtos cadastrados, com filtros e paginação. Método Omie: ListarProdutos. Aceita filtrar_apenas_familia (código da família, via omie_familias_listar) pra listar só produtos de uma família. Atenção: o campo quantidade_estoque retornado aqui NÃO é confiável (vem sempre 0) — para saber a quantidade/valor real em estoque use omie_produtos_listar_com_estoque ou omie_estoque_total_produto.

**Parâmetros:**

  - `param` (objeto livre, **obrigatório**) — campos conforme documentação oficial da Omie para este método (não tipado no MCP; a ferramenta repassa o objeto direto).

**Tipo:** passthrough (`geral/produtos` → `ListarProdutos`)

### `omie_familias_listar` (cacheável (servidor))

Lista as famílias de produtos cadastradas, com paginação. Método Omie: PesquisarFamilias (recurso 'geral/familias'). Campos típicos: pagina, registros_por_pagina.

**Parâmetros:**

  - `param` (objeto livre, **obrigatório**) — campos conforme documentação oficial da Omie para este método (não tipado no MCP; a ferramenta repassa o objeto direto).

**Tipo:** passthrough (`geral/familias` → `PesquisarFamilias`)

### `omie_produtos_listar_com_estoque`

Lista produtos JÁ com a quantidade e o valor em estoque calculados (somando todos os locais de estoque cadastrados na Omie). A Omie não entrega esse cruzamento pronto — o cadastro de produtos não tem estoque confiável e a posição de estoque não tem os dados do produto — então esta ferramenta busca os dois e junta. Use para relatórios do tipo 'lista de produtos com valor em estoque', 'quais produtos tenho parado', etc. Devolve, por produto: quantidadeEmEstoque, valorEmEstoqueVenda (preço de venda) e valorEmEstoqueCusto (custo médio). Suporta paginação (pagina/registros_por_pagina), o filtro apenas_com_estoque (remove produtos com estoque zerado) e filtrar_apenas_familia (código da família, via omie_familias_listar) pra restringir a uma família de produtos. Também aceita o parâmetro genérico 'filtros' (critérios campo/operador/valor sobre qualquer campo do item, ex: descricao, valorEmEstoqueVenda).

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem de produtos (padrão 1).
  - `registros_por_pagina` (number, opcional) — Quantidade de produtos por página (padrão 50).
  - `apenas_com_estoque` (boolean, opcional) — Se true, remove da lista os produtos com quantidade em estoque igual a zero.
  - `filtrar_apenas_familia` (number, opcional) — Código da família de produtos pra filtrar (obtido via omie_familias_listar, campo 'codigo'). Se omitido, lista produtos de todas as famílias.
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)
