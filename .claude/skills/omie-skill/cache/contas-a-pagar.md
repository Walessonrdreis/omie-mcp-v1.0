# Contas a Pagar

Contas a pagar: incluir, alterar, consultar, listar.

### `omie_contas_pagar_listar`

Lista as contas a pagar JÁ com o nome do fornecedor resolvido (a Omie só devolve o código do fornecedor). Retorna: fornecedor (razão social), valor, data de vencimento, status (PAGO/ABERTO/VENCIDO), documento fiscal, categoria e observação. Suporta paginação e filtro por data_alteracao_de/ate (data de última alteração do lançamento, não vencimento — útil pra achar lançamentos recentes). Use em vez de omie_chamar_api para ter os dados legíveis.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 20).
  - `data_alteracao_de` (string, opcional) — Filtra por data de ÚLTIMA ALTERAÇÃO do lançamento, formato DD/MM/AAAA (não é a data de vencimento). Útil pra achar lançamentos criados/atualizados recentemente.
  - `data_alteracao_ate` (string, opcional) — Fim do intervalo de data de última alteração, formato DD/MM/AAAA.

**Tipo:** use-case (lógica própria)
