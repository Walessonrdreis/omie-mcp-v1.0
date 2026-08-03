# Ordem de Produção

Criar, alterar, excluir e consultar Ordens de Produção (OP).

### `omie_op_incluir` (⚠️ destrutiva)

Inclui uma nova Ordem de Produção (OP) na Omie. Método Omie: IncluirOrdemProducao. Precisa de nCodProduto (o produto já precisa ter estrutura/BOM preenchida, senão a Omie recusa — veja omie_estrutura_incluir), dDtPrevisao (dd/mm/aaaa) e nQtde. codigo_local_estoque é opcional (padrão 0, testado ao vivo: a Omie exige o campo mesmo assim, mesmo a doc pública marcando como opcional).

**Parâmetros:**

  - `cCodIntOP` (string, opcional) — Código de integração da OP (opcional).
  - `nCodProduto` (number, **obrigatório**) — Código Omie do produto a produzir (precisa já ter estrutura/BOM preenchida).
  - `dDtPrevisao` (string, **obrigatório**) — Data prevista de conclusão, formato dd/mm/aaaa.
  - `nQtde` (number, **obrigatório**) — Quantidade a produzir.
  - `codigo_local_estoque` (number, opcional) — Local de estoque (testado ao vivo — obrigatório na Omie, mesmo a doc pública marcando como opcional; 0 = local padrão).

**Tipo:** use-case (lógica própria)

### `omie_op_alterar` (⚠️ destrutiva)

Altera uma Ordem de Produção existente. Método Omie: AlterarOrdemProducao. Identifique por nCodOP ou cCodIntOP e reenvie os dados (nCodProduto, dDtPrevisao, nQtde).

**Parâmetros:**

  - `nCodOP` (number, opcional) — Código Omie da OP a alterar.
  - `cCodIntOP` (string, opcional) — Código de integração da OP a alterar (alternativa).
  - `nCodProduto` (number, **obrigatório**) — Código Omie do produto.
  - `dDtPrevisao` (string, **obrigatório**) — Data prevista de conclusão, formato dd/mm/aaaa.
  - `nQtde` (number, **obrigatório**) — Quantidade a produzir.
  - `codigo_local_estoque` (number, opcional)

**Tipo:** use-case (lógica própria)

### `omie_op_excluir` (⚠️ destrutiva)

Exclui uma Ordem de Produção. Método Omie: ExcluirOrdemProducao. Identifique por nCodOP ou cCodIntOP.

**Parâmetros:**

  - `nCodOP` (number, opcional) — Código Omie da OP.
  - `cCodIntOP` (string, opcional) — Código de integração da OP (alternativa).

**Tipo:** use-case (lógica própria)

### `omie_op_consultar`

Consulta uma Ordem de Produção específica (por código Omie ou código interno), com os insumos utilizados. Método Omie: ConsultarOrdemProducao. O produto vem só como código (nCodProduto) e a etapa como código cru (cEtapa) — para descrição/SKU do produto, use omie_produtos_consultar ou omie_op_listar_com_produto.

**Parâmetros:**

  - `nCodOP` (number, opcional) — Código Omie da OP.
  - `cCodIntOP` (string, opcional) — Código de integração da OP (alternativa).

**Tipo:** use-case (lógica própria)

### `omie_op_listar`

Lista as Ordens de Produção cadastradas, com paginação e filtros. Método Omie: ListarOrdemProducao. Devolve só o código do produto (nCodProduto, sem descrição/SKU) e a etapa como código cru (cEtapa, configurável por conta, sem tradução via API). Para já vir com a descrição do produto, use omie_op_listar_com_produto.

**Parâmetros:**

  - `param` (objeto livre, **obrigatório**) — campos conforme documentação oficial da Omie para este método (não tipado no MCP; a ferramenta repassa o objeto direto).

**Tipo:** passthrough (`produtos/op` → `ListarOrdemProducao`)

### `omie_op_listar_com_produto`

Lista Ordens de Produção JÁ com a descrição/SKU do produto de cada OP (a Omie só devolve o código do produto na listagem crua, sem descrição — esta ferramenta busca o cadastro de cada produto envolvido e junta). Também expõe 'concluida' (true/false, campo confiável) além do 'etapaCodigo' cru (a etapa do kanban é configurável por conta — de 3 a 6 fases com nomes próprios — e a API não tem endpoint pra traduzir o código pro nome; se você souber o significado das etapas dessa conta, pode interpretar etapaCodigo). Suporta paginação (pagina/registros_por_pagina), o filtro apenas_nao_concluidas e o parâmetro genérico 'filtros' — lista de critérios (campo/operador/valor) aplicados sobre QUALQUER campo do resultado já enriquecido (ex: descricaoProduto, codigoSku, quantidade), com operadores igual/diferente/contem/maior_que/menor_que/entre. Ex: filtros: [{ campo: 'descricaoProduto', operador: 'contem', valor: '100kg' }].

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem de OPs (padrão 1).
  - `registros_por_pagina` (number, opcional) — Quantidade de OPs por página (padrão 20 — cada OP dispara uma busca de produto).
  - `apenas_nao_concluidas` (boolean, opcional) — Se true, remove da lista as OPs já concluídas (cConcluida = 'S').
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)
