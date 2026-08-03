# Nota de Entrada

Consulta de notas de entrada (somente leitura).

### `omie_nota_entrada_listar`

Lista as notas de entrada (recebimento físico de mercadoria vinda de compra) já registradas. Método Omie: ListarNotaEnt (recurso 'produtos/notaentrada'). SOMENTE LEITURA — não inclui/altera nota de entrada (é lançamento fiscal/financeiro definitivo, sem round-trip seguro de teste). Suporta paginação, filtro por data de última alteração e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `data_alteracao_de` (string, opcional) — Filtra por data de última alteração, formato dd/mm/aaaa (não é a data da nota).
  - `data_alteracao_ate` (string, opcional) — Fim do período de alteração, formato dd/mm/aaaa.
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)

### `omie_nota_entrada_consultar`

Busca os detalhes completos de uma nota de entrada (itens com CFOP/NCM, valores). Método Omie: ConsultarNotaEnt.

**Parâmetros:**

  - `codigo_nota` (number, **obrigatório**) — Código da nota de entrada na Omie (nCodNotaEnt).

**Tipo:** use-case (lógica própria)
