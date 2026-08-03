# Cadastros Auxiliares

Bancos, cidades, países, NCM, unidades, etc.

### `omie_bancos_listar`

Lista os bancos cadastrados na Omie (tabela oficial do Bacen, 1233 registros). Método Omie: ListarBancos (recurso 'geral/bancos'). Suporta paginação, filtro nativo por nome, e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `nome` (string, opcional) — Filtra pelo nome do banco (busca nativa da Omie).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)

### `omie_cidades_listar`

Lista/pesquisa cidades brasileiras (tabela IBGE, 5734 registros). Método Omie: PesquisarCidades (recurso 'geral/cidades'). Suporta paginação, filtro nativo por UF e por nome (contém), e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `uf` (string, opcional) — Filtra por UF (2 letras, ex: 'DF').
  - `contendo` (string, opcional) — Filtra por nome da cidade (contém), ex: 'Brasilia'.
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)

### `omie_paises_listar`

Lista países (tabela com código ISO). Método Omie: ListarPaises (recurso 'geral/paises'). Sem paginação (lista inteira, ~250 países); suporta filtro nativo por código ISO/descrição e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `codigo_iso` (string, opcional) — Filtra pelo código ISO de 2 letras, ex: 'BR'.
  - `descricao` (string, opcional) — Filtra pela descrição do país.
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)

### `omie_ncm_listar`

Lista/pesquisa códigos NCM (tabela oficial da Receita Federal, ~14 mil registros). Método Omie: ListarNCM (recurso 'produtos/ncm'). Suporta paginação, filtro nativo por código (prefixo) e descrição, e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `codigo` (string, opcional) — Filtra por código NCM (formato 9999.99.99).
  - `descricao` (string, opcional) — Filtra pela descrição do NCM.
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)

### `omie_unidade_consultar`

Consulta a descrição de uma unidade de medida pelo código (ex: 'UN', 'KG', 'CX'). Método Omie: ListarUnidades (recurso 'geral/unidade'). Testado ao vivo: diferente das demais listagens, este endpoint exige o código exato (não pagina/lista tudo).

**Parâmetros:**

  - `codigo` (string, **obrigatório**) — Código da unidade de medida, ex: 'UN', 'KG', 'CX'.

**Tipo:** use-case (lógica própria)
