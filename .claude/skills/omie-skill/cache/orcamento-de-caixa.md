# Orçamento de Caixa

Orçamento de caixa/previsão financeira.

### `omie_orcamento_caixa_consultar`

Consulta o orçamento de caixa NATIVO da Omie (previsto x realizado) por categoria financeira, num mês/ano. Método Omie: ListarOrcamentos (recurso 'financas/caixa'). Diferente de omie_fluxo_caixa_gerar (que calcula manualmente a partir de contas a pagar/receber), este é o relatório pronto da própria Omie, organizado por categoria (ex: '1.01.01 Vendas'), não por conta corrente/dia. Suporta o parâmetro genérico 'filtros' (ex: filtrar só categorias com diferença entre previsto e realizado).

**Parâmetros:**

  - `ano` (number, **obrigatório**) — Ano do orçamento, ex: 2026.
  - `mes` (number, **obrigatório**) — Mês do orçamento (1 a 12).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)
