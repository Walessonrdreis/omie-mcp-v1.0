# Características de Produto

Características/atributos de produto.

### `omie_caracteristica_incluir` (⚠️ destrutiva)

Cria uma nova característica reutilizável de produto (ex: 'Cor', 'Tamanho'), que depois pode ser associada a produtos. Método Omie: IncluirCaracteristica (recurso 'geral/caracteristicas').

**Parâmetros:**

  - `cod_int_caracteristica` (string, **obrigatório**) — Código de integração único que você inventa.
  - `nome` (string, **obrigatório**) — Nome da característica, ex: 'Cor', 'Tamanho'.
  - `valor_definido` (string, opcional) — 'S' se os valores permitidos são uma lista fechada (ver conteudos_permitidos).
  - `conteudos_permitidos` (array, opcional) — Lista de valores permitidos, se valor_definido='S' (ex: ['Azul', 'Verde', 'Vermelho']).

**Tipo:** use-case (lógica própria)

### `omie_caracteristica_alterar` (⚠️ destrutiva)

Altera uma característica de produto já existente. Método Omie: AlterarCaracteristica.

**Parâmetros:**

  - `codigo_caracteristica` (number, **obrigatório**) — Código da característica na Omie (nCodCaract).
  - `nome` (string, opcional)

**Tipo:** use-case (lógica própria)

### `omie_caracteristica_excluir` (⚠️ destrutiva)

Remove uma característica de produto. Método Omie: ExcluirCaracteristica. Testado ao vivo: exclusão funciona de verdade, sem deixar rastro.

**Parâmetros:**

  - `codigo_caracteristica` (number, **obrigatório**) — Código da característica na Omie (nCodCaract).

**Tipo:** use-case (lógica própria)

### `omie_caracteristica_consultar`

Busca os detalhes de uma característica de produto. Método Omie: ConsultarCaracteristica.

**Parâmetros:**

  - `codigo_caracteristica` (number, **obrigatório**) — Código da característica na Omie (nCodCaract).

**Tipo:** use-case (lógica própria)

### `omie_caracteristica_listar`

Lista as características de produto cadastradas. Método Omie: ListarCaracteristicas. Suporta paginação e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)
