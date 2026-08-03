# Contas Correntes

Contas correntes e extrato.

### `omie_contas_correntes_listar`

Lista as contas correntes cadastradas (bancos, caixas, cartões, maquininhas), com código, descrição, banco, tipo e saldo inicial registrado. Método Omie: ListarContasCorrentes (recurso 'geral/contacorrente').

**Parâmetros:**

  - `param` (objeto livre, **obrigatório**) — campos conforme documentação oficial da Omie para este método (não tipado no MCP; a ferramenta repassa o objeto direto).

**Tipo:** passthrough (`geral/contacorrente` → `ListarContasCorrentes`)

### `omie_extrato_conta_corrente_consultar`

Consulta o extrato de uma conta corrente num período: movimentos (data, descrição, valor, categoria, situação — conciliado ou não) e saldos (anterior, atual, conciliado, disponível). Método Omie: ListarExtrato (recurso 'financas/extrato'). Suporta o parâmetro genérico 'filtros' sobre os movimentos (ex: natureza, categoria, situacao).

**Parâmetros:**

  - `codigo_conta_corrente` (number, **obrigatório**) — Código da conta corrente (nCodCC, ver omie_contas_correntes_listar).
  - `periodo_inicial` (string, **obrigatório**) — Início do período, formato dd/mm/aaaa.
  - `periodo_final` (string, **obrigatório**) — Fim do período, formato dd/mm/aaaa.
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)
