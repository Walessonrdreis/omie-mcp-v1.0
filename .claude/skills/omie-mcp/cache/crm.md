# CRM

Oportunidades, fases, origens e soluções de CRM.

### `omie_crm_conta_incluir` (⚠️ destrutiva)

Cria uma nova Conta no CRM (empresa/pessoa no funil de vendas — diferente do cadastro de Cliente/Fornecedor). Método Omie: IncluirConta (recurso 'crm/contas'). Testado ao vivo: os blocos de endereço (uf/cidade) e email são exigidos, mesmo com poucos campos.

**Parâmetros:**

  - `cod_int_conta` (string, **obrigatório**) — Código de integração único que você inventa.
  - `nome` (string, **obrigatório**)
  - `uf` (string, **obrigatório**) — UF, ex: 'DF'.
  - `cidade` (string, **obrigatório**)
  - `email` (string, **obrigatório**)

**Tipo:** use-case (lógica própria)

### `omie_crm_conta_alterar` (⚠️ destrutiva)

Altera uma Conta do CRM já existente. Método Omie: AlterarConta.

**Parâmetros:**

  - `codigo_conta` (number, **obrigatório**) — Código da conta no CRM (nCod).
  - `nome` (string, opcional)
  - `uf` (string, opcional)
  - `cidade` (string, opcional)
  - `email` (string, opcional)

**Tipo:** use-case (lógica própria)

### `omie_crm_conta_excluir` (⚠️ destrutiva)

Remove uma Conta do CRM. Método Omie: ExcluirConta.

**Parâmetros:**

  - `codigo_conta` (number, **obrigatório**) — Código da conta no CRM (nCod).

**Tipo:** use-case (lógica própria)

### `omie_crm_conta_consultar`

Busca os detalhes de uma Conta do CRM. Método Omie: ConsultarConta.

**Parâmetros:**

  - `codigo_conta` (number, **obrigatório**) — Código da conta no CRM (nCod).

**Tipo:** use-case (lógica própria)

### `omie_crm_conta_listar`

Lista as Contas do CRM. Método Omie: ListarContas. Suporta paginação e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)

### `omie_crm_contato_incluir` (⚠️ destrutiva)

Cria um novo Contato do CRM, vinculado a uma Conta. Método Omie: IncluirContato (recurso 'crm/contatos').

**Parâmetros:**

  - `cod_int_contato` (string, **obrigatório**) — Código de integração único que você inventa.
  - `nome` (string, **obrigatório**)
  - `sobrenome` (string, **obrigatório**)
  - `codigo_conta` (number, **obrigatório**) — Código da conta do CRM à qual este contato pertence (nCod).
  - `email` (string, opcional)

**Tipo:** use-case (lógica própria)

### `omie_crm_contato_alterar` (⚠️ destrutiva)

Altera um Contato do CRM já existente. Método Omie: AlterarContato.

**Parâmetros:**

  - `codigo_contato` (number, **obrigatório**) — Código do contato no CRM (nCod).
  - `nome` (string, opcional)
  - `sobrenome` (string, opcional)
  - `email` (string, opcional)

**Tipo:** use-case (lógica própria)

### `omie_crm_contato_excluir` (⚠️ destrutiva)

Remove um Contato do CRM. Método Omie: ExcluirContato.

**Parâmetros:**

  - `codigo_contato` (number, **obrigatório**) — Código do contato no CRM (nCod).

**Tipo:** use-case (lógica própria)

### `omie_crm_contato_consultar`

Busca os detalhes de um Contato do CRM. Método Omie: ConsultarContato.

**Parâmetros:**

  - `codigo_contato` (number, **obrigatório**) — Código do contato no CRM (nCod).

**Tipo:** use-case (lógica própria)

### `omie_crm_contato_listar`

Lista os Contatos do CRM. Método Omie: ListarContatos. Suporta paginação e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)

### `omie_crm_oportunidade_incluir` (⚠️ destrutiva)

Cria uma nova Oportunidade no funil de vendas do CRM. Método Omie: IncluirOportunidade (recurso 'crm/oportunidades'). Exige conta e contato já cadastrados, mais 'codigo_solucao' (ver omie_crm_solucoes_listar) e 'codigo_origem' (ver omie_crm_origens_listar) — testado ao vivo, ambos obrigatórios mesmo não estando claro assim na doc pública.

**Parâmetros:**

  - `cod_int_oportunidade` (string, **obrigatório**) — Código de integração único que você inventa.
  - `descricao` (string, **obrigatório**) — Descrição da oportunidade.
  - `codigo_conta` (number, **obrigatório**) — Código da conta do CRM (nCodConta).
  - `codigo_contato` (number, **obrigatório**) — Código do contato do CRM (nCodContato).
  - `codigo_solucao` (number, **obrigatório**) — Código da solução/produto ofertado — ver omie_crm_solucoes_listar.
  - `codigo_origem` (number, **obrigatório**) — Código da origem do lead — ver omie_crm_origens_listar.

**Tipo:** use-case (lógica própria)

### `omie_crm_oportunidade_alterar` (⚠️ destrutiva)

Altera uma Oportunidade já existente. Método Omie: AlterarOportunidade.

**Parâmetros:**

  - `codigo_oportunidade` (number, **obrigatório**) — Código da oportunidade no CRM (nCodOp).
  - `descricao` (string, opcional)

**Tipo:** use-case (lógica própria)

### `omie_crm_oportunidade_excluir` (⚠️ destrutiva)

Remove uma Oportunidade do CRM. Método Omie: ExcluirOportunidade.

**Parâmetros:**

  - `codigo_oportunidade` (number, **obrigatório**) — Código da oportunidade no CRM (nCodOp).

**Tipo:** use-case (lógica própria)

### `omie_crm_oportunidade_consultar`

Busca os detalhes de uma Oportunidade do CRM. Método Omie: ConsultarOportunidade.

**Parâmetros:**

  - `codigo_oportunidade` (number, **obrigatório**) — Código da oportunidade no CRM (nCodOp).

**Tipo:** use-case (lógica própria)

### `omie_crm_oportunidade_listar`

Lista as Oportunidades do funil de vendas do CRM. Método Omie: ListarOportunidades. Suporta paginação e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)

### `omie_crm_fases_listar`

Lista as fases do funil de vendas do CRM (ex: '01 Prospect'). Método Omie: ListarFases (recurso 'crm/fases').

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)

### `omie_crm_solucoes_listar`

Lista as soluções/produtos cadastrados no CRM, usadas no campo 'codigo_solucao' de omie_crm_oportunidade_incluir. Método Omie: ListarSolucoes (recurso 'crm/solucoes').

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)

### `omie_crm_origens_listar`

Lista as origens de lead cadastradas no CRM, usadas no campo 'codigo_origem' de omie_crm_oportunidade_incluir. Método Omie: ListarOrigens (recurso 'crm/origens').

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)
