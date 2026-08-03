# Notas Fiscais (NF-e)

Emissão e consulta de NF-e.

### `omie_nfe_listar`

Lista notas fiscais (NF-e) já emitidas/registradas na Omie, com resumo (número, série, chave, cliente, valor total, cancelada ou não). Método Omie: ListarNF (recurso 'nfconsultar'). Suporta paginação (pagina/registros_por_pagina, padrão 50), filtro por período de emissão (data_de/data_ate, dd/mm/aaaa), por status (apenas_canceladas), por tipo (entrada/saida) e o parâmetro genérico 'filtros' sobre qualquer campo do resumo (ex: cliente, valorTotal). Este módulo é SOMENTE LEITURA — não emite nem cancela nota fiscal (documento com efeito legal, sem round-trip seguro de teste).

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Quantidade de notas por página (padrão 50).
  - `data_de` (string, opcional) — Filtra notas emitidas a partir desta data (formato dd/mm/aaaa).
  - `data_ate` (string, opcional) — Filtra notas emitidas até esta data (formato dd/mm/aaaa).
  - `apenas_canceladas` (boolean, opcional) — Se true, lista só as notas canceladas. Se false, só as não canceladas. Padrão: todas.
  - `tipo` (string, opcional) — Filtra por tipo de nota: entrada (compra) ou saida (venda). Padrão: todas.
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)

### `omie_nfe_consultar`

Consulta o detalhe completo de uma nota fiscal (NF-e) específica: itens (descrição, NCM, CFOP, quantidade, valores), títulos financeiros gerados pela nota, e dados de emissão. Método Omie: ConsultarNF. Informe 'chave' (chave de acesso de 44 dígitos) OU 'codigo' (código interno da nota na Omie, nIdNF) — um dos dois é obrigatório.

**Parâmetros:**

  - `chave` (string, opcional) — Chave de acesso da NF-e (44 dígitos).
  - `codigo` (number, opcional) — Código interno da nota na Omie (nIdNF).

**Tipo:** use-case (lógica própria)
