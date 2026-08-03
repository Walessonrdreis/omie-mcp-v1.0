# Contas a Receber

Contas a receber: incluir, alterar, consultar, listar.

### `omie_contas_receber_listar`

Lista as contas a receber JÁ com o nome do cliente resolvido (a Omie só devolve o código do cliente). Retorna: cliente (razão social), valor, data de vencimento, status (PAGO/ABERTO/VENCIDO), documento fiscal, número do pedido e categoria. Suporta paginação e filtro por data_alteracao_de/ate (data de última alteração do lançamento, não vencimento — útil pra achar lançamentos recentes). Use em vez de omie_chamar_api para ter os dados legíveis.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 20).
  - `data_alteracao_de` (string, opcional) — Filtra por data de ÚLTIMA ALTERAÇÃO do lançamento, formato DD/MM/AAAA (não é a data de vencimento). Útil pra achar lançamentos criados/atualizados recentemente.
  - `data_alteracao_ate` (string, opcional) — Fim do intervalo de data de última alteração, formato DD/MM/AAAA.

**Tipo:** use-case (lógica própria)

### `omie_contas_receber_boleto_gerar` (⚠️ destrutiva)

Gera o boleto de um título de contas a receber. Método Omie: GerarBoleto (recurso 'financas/contareceberboleto'). Requer que a conta Omie tenha convênio bancário/boleto configurado — sem isso a Omie recusa com erro (ex: 'Não temos suporte para geração da remessa de pagamento para o banco -sem instituição-', testado ao vivo nesta conta).

**Parâmetros:**

  - `codigo_titulo` (number, **obrigatório**) — Código do título de contas a receber na Omie (codigo_lancamento_omie).

**Tipo:** use-case (lógica própria)

### `omie_contas_receber_boleto_obter`

Busca o link/dados do boleto já gerado de um título (ou avisa que nenhum foi gerado). Método Omie: ObterBoleto.

**Parâmetros:**

  - `codigo_titulo` (number, **obrigatório**) — Código do título de contas a receber na Omie (codigo_lancamento_omie).

**Tipo:** use-case (lógica própria)

### `omie_contas_receber_boleto_prorrogar` (⚠️ destrutiva)

Prorroga (adia) a data de vencimento de um boleto já gerado. Método Omie: ProrrogarBoleto.

**Parâmetros:**

  - `codigo_titulo` (number, **obrigatório**) — Código do título de contas a receber na Omie.
  - `nova_data_vencimento` (string, **obrigatório**) — Nova data de vencimento, formato dd/mm/aaaa.

**Tipo:** use-case (lógica própria)

### `omie_contas_receber_boleto_cancelar` (⚠️ destrutiva)

Cancela o boleto gerado de um título. Método Omie: CancelarBoleto.

**Parâmetros:**

  - `codigo_titulo` (number, **obrigatório**) — Código do título de contas a receber na Omie (codigo_lancamento_omie).

**Tipo:** use-case (lógica própria)
