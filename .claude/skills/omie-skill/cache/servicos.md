# Serviços

Cadastro e NFS-e de serviços.

### `omie_servico_incluir` (⚠️ destrutiva)

Cadastra um novo serviço prestado pela empresa (cadastro, não é uma venda/OS). Método Omie: IncluirCadastroServico (recurso 'servicos/servico').

**Parâmetros:**

  - `cod_int_servico` (string, **obrigatório**) — Código de integração único que você inventa.
  - `descricao` (string, **obrigatório**) — Descrição breve do serviço.
  - `codigo` (string, **obrigatório**) — Código interno do serviço (SKU de serviço).
  - `preco_unitario` (number, **obrigatório**)
  - `descricao_completa` (string, opcional)
  - `codigo_categoria` (string, opcional)

**Tipo:** use-case (lógica própria)

### `omie_servico_alterar` (⚠️ destrutiva)

Altera um serviço já cadastrado. Método Omie: AlterarCadastroServico.

**Parâmetros:**

  - `codigo_servico` (number, **obrigatório**) — Código do serviço na Omie (nCodServ).
  - `descricao` (string, opcional)
  - `preco_unitario` (number, opcional)
  - `descricao_completa` (string, opcional)

**Tipo:** use-case (lógica própria)

### `omie_servico_excluir` (⚠️ destrutiva)

Remove um serviço do cadastro. Método Omie: ExcluirCadastroServico.

**Parâmetros:**

  - `codigo_servico` (number, **obrigatório**) — Código do serviço na Omie (nCodServ).

**Tipo:** use-case (lógica própria)

### `omie_servico_consultar`

Busca os detalhes de um serviço cadastrado. Método Omie: ConsultarCadastroServico.

**Parâmetros:**

  - `codigo_servico` (number, **obrigatório**) — Código do serviço na Omie (nCodServ).

**Tipo:** use-case (lógica própria)

### `omie_servico_listar`

Lista os serviços cadastrados. Método Omie: ListarCadastroServico. Suporta paginação e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)

### `omie_os_incluir` (⚠️ destrutiva)

Cria uma nova Ordem de Serviço (venda de serviço para um cliente). Método Omie: IncluirOS (recurso 'servicos/os'). Cada item precisa de 'codigo_servico_municipal' e 'codigo_servico_lc116' — use omie_servicos_lc116_listar pra achar um código válido (ex: '1.01' = Análise e Desenvolvimento de Sistemas). Testado ao vivo: esses códigos precisam ser um código já cadastrado na tabela LC116, texto livre é recusado.

**Parâmetros:**

  - `cod_int_os` (string, **obrigatório**) — Código de integração único que você inventa.
  - `codigo_cliente` (number, **obrigatório**) — Código do cliente na Omie (nCodCli).
  - `codigo_condicao_pagamento` (string, opcional) — Código da condição de pagamento (padrão '999' = à vista).
  - `data_previsao` (string, **obrigatório**) — Data prevista, formato dd/mm/aaaa.
  - `etapa` (string, opcional) — Etapa da OS: 00, 10, 20, 30, 40 ou 50 (padrão '10').
  - `quantidade_parcelas` (number, opcional)
  - `codigo_categoria` (string, **obrigatório**) — Categoria financeira (ex: '1.01.02').
  - `codigo_conta_corrente` (number, **obrigatório**) — Código da conta corrente (nCodCC).
  - `itens` (array, **obrigatório**)

**Tipo:** use-case (lógica própria)

### `omie_os_alterar` (⚠️ destrutiva)

Altera uma Ordem de Serviço já existente (data prevista, etapa). Método Omie: AlterarOS.

**Parâmetros:**

  - `codigo_os` (number, **obrigatório**) — Código da OS na Omie (nCodOS).
  - `data_previsao` (string, opcional)
  - `etapa` (string, opcional)

**Tipo:** use-case (lógica própria)

### `omie_os_excluir` (⚠️ destrutiva)

Remove uma Ordem de Serviço. Método Omie: ExcluirOS.

**Parâmetros:**

  - `codigo_os` (number, **obrigatório**) — Código da OS na Omie (nCodOS).

**Tipo:** use-case (lógica própria)

### `omie_os_consultar`

Busca os detalhes de uma Ordem de Serviço (itens, valores, se faturada/cancelada). Método Omie: ConsultarOS.

**Parâmetros:**

  - `codigo_os` (number, **obrigatório**) — Código da OS na Omie (nCodOS).

**Tipo:** use-case (lógica própria)

### `omie_os_listar`

Lista as Ordens de Serviço cadastradas. Método Omie: ListarOS. Suporta paginação e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)

### `omie_nfse_listar`

Lista as NFS-e (nota fiscal de serviço) já emitidas. Método Omie: ListarNFSEs (recurso 'servicos/nfse'). SOMENTE LEITURA — não emite NFS-e (mesma cautela do módulo NF-e de produto: documento fiscal com efeito legal). Suporta paginação, filtro por período de emissão e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `emissao_de` (string, opcional) — Filtra por data de emissão, formato dd/mm/aaaa.
  - `emissao_ate` (string, opcional) — Fim do período de emissão, formato dd/mm/aaaa.
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)

### `omie_servicos_lc116_listar`

Lista os códigos válidos da Lei Complementar 116 (classificação de serviços), usados nos campos 'codigo_servico_lc116'/'codigo_servico_municipal' de omie_os_incluir. Método Omie: ListarLC116 (recurso 'servicos/lc116'). Use o parâmetro genérico 'filtros' pra buscar por descrição (ex: filtro 'contem' em 'descricao').

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)
