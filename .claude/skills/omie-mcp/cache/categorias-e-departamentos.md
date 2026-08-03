# Categorias e Departamentos

Categorias financeiras e departamentos.

### `omie_categoria_incluir` (⚠️ destrutiva)

Cria uma nova categoria financeira, como filha de uma categoria pai já existente. Método Omie: IncluirCategoria (recurso 'geral/categorias'). Testado ao vivo: você informa o código da categoria PAI ('categoria_superior', ex: '2.09') e a Omie GERA e devolve o código da nova categoria filha (ex: '2.09.04') — não é você quem escolhe o código. ⚠️ IMPORTANTE, testado ao vivo: não existe exclusão de categoria na API, e tentar 'inativar' via alterar (campo conta_inativa) não teve efeito real — categorias criadas ficam permanentemente ativas na conta. Confirme antes de criar.

**Parâmetros:**

  - `categoria_superior` (string, **obrigatório**) — Código da categoria PAI (grupo), ex: '2.09'. A Omie gera o código do filho automaticamente (ex: '2.09.04') e devolve na resposta.
  - `descricao` (string, **obrigatório**)

**Tipo:** use-case (lógica própria)

### `omie_categoria_alterar` (⚠️ destrutiva)

Altera a descrição de uma categoria já existente. Método Omie: AlterarCategoria.

**Parâmetros:**

  - `codigo` (string, **obrigatório**) — Código da categoria (ex: '2.09.04').
  - `descricao` (string, opcional)

**Tipo:** use-case (lógica própria)

### `omie_categoria_consultar`

Busca os detalhes de uma categoria financeira. Método Omie: ConsultarCategoria.

**Parâmetros:**

  - `codigo` (string, **obrigatório**) — Código da categoria (ex: '2.09.04').

**Tipo:** use-case (lógica própria)

### `omie_categoria_listar`

Lista as categorias financeiras cadastradas (plano de categorias usado em contas a pagar/receber, fluxo de caixa, DRE). Método Omie: ListarCategorias. Suporta paginação e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)

### `omie_departamento_incluir` (⚠️ destrutiva)

Cria um novo departamento/centro de custo, como filho de um departamento pai já existente. Método Omie: IncluirDepartamento (recurso 'geral/departamentos'). Testado ao vivo: 'codigo_pai' é o código do departamento ONDE incluir o novo (não o código do novo departamento) — a Omie gera e devolve o código do filho na resposta.

**Parâmetros:**

  - `codigo_pai` (string, **obrigatório**) — Código do departamento/centro de custo PAI (onde o novo será incluído) — ver omie_departamento_listar. A Omie gera e devolve o código do novo departamento.
  - `descricao` (string, **obrigatório**)

**Tipo:** use-case (lógica própria)

### `omie_departamento_alterar` (⚠️ destrutiva)

Altera a descrição de um departamento já existente. Método Omie: AlterarDepartamento.

**Parâmetros:**

  - `codigo` (string, **obrigatório**) — Código do departamento (devolvido ao incluir, ou visto no listar).
  - `descricao` (string, opcional)

**Tipo:** use-case (lógica própria)

### `omie_departamento_excluir` (⚠️ destrutiva)

Remove um departamento/centro de custo. Método Omie: ExcluirDepartamento. Diferente de Categoria, testado ao vivo que a exclusão funciona de verdade, sem deixar rastro.

**Parâmetros:**

  - `codigo` (string, **obrigatório**) — Código do departamento.

**Tipo:** use-case (lógica própria)

### `omie_departamento_consultar`

Busca os detalhes de um departamento/centro de custo. Método Omie: ConsultarDepartamento.

**Parâmetros:**

  - `codigo` (string, **obrigatório**) — Código do departamento.

**Tipo:** use-case (lógica própria)

### `omie_departamento_listar`

Lista os departamentos/centros de custo cadastrados (estrutura hierárquica). Método Omie: ListarDepartamentos. Suporta paginação e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)
