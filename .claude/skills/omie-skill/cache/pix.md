# PIX

Cobranças e recebimentos via PIX.

### `omie_pix_listar`

Lista os PIX gerados para títulos de contas a receber, com resumo (título, valor, emissão, vencimento, status). Método Omie: ListarPix (recurso 'financas/pix'). Suporta paginação, filtro por período de emissão/status e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `emissao_de` (string, opcional) — Filtra por data de emissão, formato dd/mm/aaaa.
  - `emissao_ate` (string, opcional) — Fim do período de emissão, formato dd/mm/aaaa.
  - `status` (string, opcional) — Filtra por status (ex: 'LIQUIDADO', 'AGUARDANDO', 'CANCELADO').
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)

### `omie_pix_obter`

Busca o PIX (QR Code, copia-e-cola, status) de um título de contas a receber. Método Omie: ObterPix.

**Parâmetros:**

  - `codigo_titulo` (number, **obrigatório**) — Código do título de contas a receber na Omie.

**Tipo:** use-case (lógica própria)

### `omie_pix_obter_status`

Consulta rapidamente só o status de pagamento de um PIX. Método Omie: ObterStatusPix.

**Parâmetros:**

  - `codigo_titulo` (number, **obrigatório**) — Código do título de contas a receber na Omie.

**Tipo:** use-case (lógica própria)

### `omie_pix_gerar` (⚠️ destrutiva)

Gera um PIX (QR Code + copia-e-cola) para cobrar um título de contas a receber. Método Omie: GerarPix (recurso 'financas/pix').

**Parâmetros:**

  - `codigo_titulo` (number, **obrigatório**) — Código do título de contas a receber na Omie.
  - `valor` (number, **obrigatório**) — Valor do PIX a cobrar.
  - `codigo_conta_corrente` (number, **obrigatório**) — Código da conta corrente que vai receber (nCodCC/nIdConta).

**Tipo:** use-case (lógica própria)

### `omie_pix_cancelar` (⚠️ destrutiva)

Cancela um PIX gerado (ainda não pago). Método Omie: CancelarPix.

**Parâmetros:**

  - `id_pix` (number, **obrigatório**) — Identificador do PIX na Omie (nIdPix, ver omie_pix_obter).

**Tipo:** use-case (lógica própria)
