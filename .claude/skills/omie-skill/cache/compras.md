# Compras

Requisições e pedidos de compra.

### `omie_pedido_compra_incluir` (⚠️ destrutiva)

Cria um novo pedido de compra (fornecedor, itens, previsão de entrega). Método Omie: IncluirPedCompra (recurso 'produtos/pedidocompra'). Testado ao vivo: 'codigo_conta_corrente' (nCodCC) precisa ser um código de CONTA CORRENTE (ver omie_contas_correntes_listar) — apesar do nome sugerir centro de custo/departamento, a Omie recusa código de departamento aqui.

**Parâmetros:**

  - `cod_int_pedido` (string, **obrigatório**) — Código de integração único (máx. 20 caracteres) — você inventa.
  - `data_previsao` (string, **obrigatório**) — Data prevista de entrega, formato dd/mm/aaaa.
  - `quantidade_parcelas` (number, opcional)
  - `codigo_fornecedor` (number, **obrigatório**) — Código do fornecedor na Omie (nCodFor).
  - `codigo_conta_corrente` (number, **obrigatório**) — Código da conta corrente (nCodCC, ver omie_contas_correntes_listar). Testado ao vivo: apesar do nome sugerir centro de custo/departamento, a Omie exige aqui um código de CONTA CORRENTE — usar código de departamento é recusado.
  - `codigo_categoria` (string, opcional) — Categoria financeira (ex: '2.09.01').
  - `itens` (array, **obrigatório**)

**Tipo:** use-case (lógica própria)

### `omie_pedido_compra_alterar` (⚠️ destrutiva)

Altera um pedido de compra já existente. Método Omie: AlteraPedCompra. Se 'itens' for enviado, SUBSTITUI os itens atuais do pedido (não faz merge).

**Parâmetros:**

  - `codigo_pedido` (number, **obrigatório**) — Código do pedido na Omie (nCodPed).
  - `quantidade_parcelas` (number, opcional)
  - `itens` (array, opcional) — Se enviado, SUBSTITUI os itens atuais do pedido (não faz merge).

**Tipo:** use-case (lógica própria)

### `omie_pedido_compra_excluir` (⚠️ destrutiva)

Remove um pedido de compra. Método Omie: ExcluirPedCompra.

**Parâmetros:**

  - `codigo_pedido` (number, **obrigatório**) — Código do pedido na Omie (nCodPed).

**Tipo:** use-case (lógica própria)

### `omie_pedido_compra_consultar`

Busca os detalhes completos de um pedido de compra (itens, quantidade recebida, valores). Método Omie: ConsultarPedCompra.

**Parâmetros:**

  - `codigo_pedido` (number, **obrigatório**) — Código do pedido na Omie (nCodPed).

**Tipo:** use-case (lógica própria)

### `omie_pedido_compra_listar`

Lista os pedidos de compra cadastrados, com resumo (fornecedor, conta corrente, valor total, quantidade de itens). Método Omie: PesquisarPedCompra. Suporta paginação e o parâmetro genérico 'filtros'. Testado ao vivo: a Omie esconde pedidos por padrão nessa listagem — o MCP já pede todas as situações (pendente/faturado/recebido/cancelado/encerrado/parciais) pra sempre trazer tudo.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)

### `omie_requisicao_compra_incluir` (⚠️ destrutiva)

Solicita a compra de insumos para produção (requisição de compra). Método Omie: IncluirReq (recurso 'produtos/requisicaocompra').

**Parâmetros:**

  - `cod_int_requisicao` (string, **obrigatório**) — Código de integração único (máx. 20 caracteres) — você inventa.
  - `codigo_categoria` (string, **obrigatório**) — Categoria financeira (ex: '2.09.01').
  - `data_sugestao` (string, **obrigatório**) — Data sugerida de compra, formato dd/mm/aaaa.
  - `itens` (array, **obrigatório**)

**Tipo:** use-case (lógica própria)

### `omie_requisicao_compra_alterar` (⚠️ destrutiva)

Altera uma requisição de compra já existente. Método Omie: AlterarReq. Se 'itens' for enviado, SUBSTITUI os itens atuais da requisição (não faz merge).

**Parâmetros:**

  - `codigo_requisicao` (number, **obrigatório**) — Código da requisição na Omie (codReqCompra).
  - `codigo_categoria` (string, opcional)
  - `data_sugestao` (string, opcional)
  - `itens` (array, opcional) — Se enviado, SUBSTITUI os itens atuais da requisição (não faz merge).

**Tipo:** use-case (lógica própria)

### `omie_requisicao_compra_excluir` (⚠️ destrutiva)

Remove uma requisição de compra. Método Omie: ExcluirReq.

**Parâmetros:**

  - `codigo_requisicao` (number, **obrigatório**) — Código da requisição na Omie (codReqCompra).

**Tipo:** use-case (lógica própria)

### `omie_requisicao_compra_consultar`

Busca os detalhes de uma requisição de compra específica. Método Omie: ConsultarReq.

**Parâmetros:**

  - `codigo_requisicao` (number, **obrigatório**) — Código da requisição na Omie (codReqCompra).

**Tipo:** use-case (lógica própria)

### `omie_requisicao_compra_listar`

Lista as requisições de compra cadastradas. Método Omie: PesquisarReq. Suporta paginação e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)
