# Estoque

Saldo e ajustes de estoque, por local.

### `omie_estoque_ajuste_incluir` (⚠️ destrutiva)

Registra um ajuste/movimentação manual de estoque (ex: consumo de insumos, entrada de produto acabado da produção, correção de inventário). Método Omie: IncluirAjusteEstoque. Campos: id_prod, data (dd/mm/aaaa), tipo (ENT/SAI/SLD/TRF), quan, origem (AJU/PDV) e motivo — testado ao vivo, só aceita 'INI'/'INV'/'OPE'/'PDV' (não documentado na doc pública). ATENÇÃO (testado ao vivo): depois de QUALQUER ajuste de estoque num produto, esse produto nunca mais pode ser excluído (a Omie mantém um 'Movimento de Estoque (calculado)' permanente, mesmo se o ajuste for excluído depois) — avise o usuário antes de ajustar estoque de um produto de teste/temporário.

**Parâmetros:**

  - `id_prod` (number, **obrigatório**) — Código Omie do produto.
  - `data` (string, **obrigatório**) — Data do ajuste, formato dd/mm/aaaa.
  - `tipo` (string, **obrigatório**) — ENT = entrada, SAI = saída, SLD = saldo, TRF = transferência entre locais.
  - `quan` (number, **obrigatório**) — Quantidade movimentada.
  - `valor` (number, opcional) — Valor unitário do movimento.
  - `obs` (string, opcional)
  - `origem` (string, opcional)
  - `motivo` (string, **obrigatório**) — Testado ao vivo — só esses 4 valores são aceitos pela Omie (não documentado na doc pública): INI = estoque inicial, INV = inventário/divergência, OPE = operacional, PDV = ponto de venda.
  - `codigo_local_estoque` (number, opcional)
  - `codigo_local_estoque_destino` (number, opcional) — Obrigatório quando tipo = 'TRF' (local de destino da transferência).

**Tipo:** use-case (lógica própria)

### `omie_estoque_ajuste_excluir` (⚠️ destrutiva)

Exclui um ajuste de estoque (pelo id_ajuste devolvido na inclusão). Método Omie: ExcluirAjusteEstoque. ATENÇÃO: isso reverte o ajuste, mas NÃO desfaz a dependência já criada no produto — ele continua sem poder ser excluído (ver nota em omie_estoque_ajuste_incluir).

**Parâmetros:**

  - `id_ajuste` (number, **obrigatório**) — Código do ajuste a excluir (devolvido em id_ajuste na inclusão). ATENÇÃO: excluir o ajuste não desfaz a dependência criada no produto — a Omie mantém um histórico permanente que passa a impedir excluir esse produto depois.

**Tipo:** use-case (lógica própria)

### `omie_estoque_movimentos_listar`

Lista os movimentos de estoque (entradas/saídas) agregados por produto e por dia. Método Omie: ListarMovimentos (recurso 'estoque/movestoque'). ATENÇÃO: NÃO existe filtro por produto nem por período — os únicos parâmetros aceitos são pagina, registros_por_pagina e codigo_local_estoque, e omitir o local traz só o local padrão. Filtre produto e data em memória. Ver docs/omie-api/movimentos-estoque/.

**Parâmetros:**

  - `param` (objeto livre, **obrigatório**) — campos conforme documentação oficial da Omie para este método (não tipado no MCP; a ferramenta repassa o objeto direto).

**Tipo:** passthrough (`estoque/movestoque` → `ListarMovimentos`)

### `omie_estoque_total_produto`

Calcula o estoque TOTAL de um produto, somando a posição física (e saldo/reservado) em TODOS os locais de estoque cadastrados na Omie. A Omie não expõe esse total pronto — só posições por local, paginadas — então esta ferramenta busca todas as páginas e consolida. Use quando o usuário perguntar 'quanto tenho no total desse produto', sem se referir a um local específico.

**Parâmetros:**

  - `codigo_produto` (number, **obrigatório**) — Código do produto na Omie (nCodProd/codigo_produto), obtido via omie_produtos_consultar ou omie_produtos_listar.

**Tipo:** use-case (lógica própria)
