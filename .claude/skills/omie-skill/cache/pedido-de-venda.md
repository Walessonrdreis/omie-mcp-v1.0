# Pedido de Venda

Pedidos de venda: incluir, alterar, consultar, listar.

### `omie_pedido_venda_consultar`

Consulta um Pedido de Venda específico, com todos os itens/impostos. Método Omie: ConsultarPedido. Identifique por codigo_pedido ou codigo_pedido_integracao.

**Parâmetros:**

  - `codigo_pedido` (number, opcional)
  - `codigo_pedido_integracao` (string, opcional)

**Tipo:** use-case (lógica própria)

### `omie_pedido_venda_incluir` (⚠️ destrutiva)

Cria um novo Pedido de Venda. Método Omie: IncluirPedido. Precisa de codigo_cliente (o cliente precisa ter UF preenchida no cadastro, senão a Omie recusa — teste ao vivo), data_previsao, codigo_categoria (via omie_chamar_api resource 'geral/categorias' call 'ListarCategorias' — use uma categoria de receita), codigo_conta_corrente (via omie_contas_correntes_listar) e itens (codigo_item_integracao, codigo_produto, quantidade, valor_unitario). etapa (padrão '10') e codigo_parcela (padrão '000' = à vista) são opcionais.

**Parâmetros:**

  - `codigo_pedido_integracao` (string, opcional) — Código de integração do pedido (opcional).
  - `codigo_cliente` (number, **obrigatório**) — Código Omie do cliente (precisa ter UF preenchida no cadastro, senão a Omie recusa o pedido).
  - `data_previsao` (string, **obrigatório**) — Data prevista de entrega/faturamento, formato dd/mm/aaaa.
  - `etapa` (string, opcional) — Etapa inicial (padrão '10' = Pedido de Venda).
  - `codigo_parcela` (string, opcional) — Condição de pagamento (padrão '000' = à vista).
  - `codigo_categoria` (string, **obrigatório**) — Código da categoria financeira (ver omie_chamar_api com resource 'geral/categorias', call 'ListarCategorias' — use uma categoria de receita, ex: '1.01.01').
  - `codigo_conta_corrente` (number, **obrigatório**) — Código da conta corrente de recebimento (via omie_contas_correntes_listar).
  - `consumidor_final` (string, opcional)
  - `itens` (array, **obrigatório**) — Itens do pedido.

**Tipo:** use-case (lógica própria)

### `omie_pedido_venda_alterar` (⚠️ destrutiva)

Altera um Pedido de Venda existente. Método Omie: AlterarPedidoVenda. Identifique por codigo_pedido ou codigo_pedido_integracao e reenvie os dados (mesmos campos de omie_pedido_venda_incluir) — os itens enviados substituem os itens atuais do pedido.

**Parâmetros:**

  - `codigo_pedido` (number, opcional) — Código Omie do pedido a alterar.
  - `codigo_pedido_integracao` (string, opcional) — Código de integração do pedido a alterar (alternativa).
  - `codigo_cliente` (number, **obrigatório**)
  - `data_previsao` (string, **obrigatório**)
  - `etapa` (string, opcional)
  - `codigo_parcela` (string, opcional)
  - `codigo_categoria` (string, **obrigatório**)
  - `codigo_conta_corrente` (number, **obrigatório**)
  - `consumidor_final` (string, opcional)
  - `itens` (array, **obrigatório**)

**Tipo:** use-case (lógica própria)

### `omie_pedido_venda_excluir` (⚠️ destrutiva)

Exclui um Pedido de Venda. Método Omie: ExcluirPedido. Identifique por codigo_pedido ou codigo_pedido_integracao. A Omie recusa se o pedido já estiver faturado.

**Parâmetros:**

  - `codigo_pedido` (number, opcional)
  - `codigo_pedido_integracao` (string, opcional)

**Tipo:** use-case (lógica própria)

### `omie_pedido_venda_listar`

Lista Pedidos de Venda cadastrados, com paginação e filtros (aceita filtro 'etapa', ex: '20' = Separar Estoque). Método Omie: ListarPedidos. Atenção: pedidos CANCELADOS não têm a etapa resetada pela Omie — sempre cheque infoCadastro.cancelado antes de considerar um pedido como realmente naquela etapa. Para já vir filtrado e resumido por produto, use omie_pedido_venda_produtos_para_separar.

**Parâmetros:**

  - `param` (objeto livre, **obrigatório**) — campos conforme documentação oficial da Omie para este método (não tipado no MCP; a ferramenta repassa o objeto direto).

**Tipo:** passthrough (`produtos/pedido` → `ListarPedidos`)

### `omie_pedido_venda_etapas_listar`

Lista o catálogo de etapas de faturamento da Omie (kanban de vendas, OS, compras, etc.), com código e descrição de cada etapa por tipo de operação. Método Omie: ListarEtapasFaturamento (recurso 'produtos/etapafat'). Diferente da etapa de Ordem de Produção (configurável por conta, sem tradução via API), essas etapas são um catálogo fixo e documentado pela Omie.

**Parâmetros:**

  - `param` (objeto livre, **obrigatório**) — campos conforme documentação oficial da Omie para este método (não tipado no MCP; a ferramenta repassa o objeto direto).

**Tipo:** passthrough (`produtos/etapafat` → `ListarEtapasFaturamento`)

### `omie_pedido_venda_produtos_para_separar`

Lista os produtos que precisam ser separados do estoque para despacho: busca os Pedidos de Venda na etapa 'Separar Estoque' (código '20' por padrão, catálogo fixo da Omie), remove os cancelados (a Omie não reseta a etapa de pedidos cancelados) e devolve, por item de pedido, o produto (código/SKU/descrição/quantidade — já vem no próprio pedido, sem cruzar outro endpoint) e um resumo agregado por produto (quantidade total a separar, em quantos pedidos). Use quando o usuário perguntar 'quais produtos preciso separar', 'o que tá pendente de expedição', etc. Suporta paginação, o filtro etapa_codigo (para outras etapas do funil de vendas, ex: '50' Faturar) e o parâmetro genérico 'filtros' (critérios campo/operador/valor sobre qualquer campo do item, ex: descricaoProduto, quantidade).

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem de pedidos (padrão 1).
  - `registros_por_pagina` (number, opcional) — Pedidos por página (padrão 20 — cada pedido tem um payload pesado, com todos os campos fiscais; evite valores altos).
  - `etapa_codigo` (string, opcional) — Código da etapa a filtrar (catálogo fixo da Omie para 'Venda de Produto'). Padrão '20' = Separar Estoque. Outros códigos comuns: '10' Pedido de Venda, '50' Faturar, '60' Faturado, '70' Entrega.
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)

### `omie_pedido_venda_listar_com_cliente`

Lista Pedidos de Venda JÁ com o nome do cliente (razão social/nome fantasia), a etapa por extenso e os ITENS de cada pedido (produto/SKU/descrição/quantidade/unidade) resolvidos — a Omie só devolve o código do cliente e o código cru da etapa na listagem crua. Também expõe 'cancelado' e 'faturado' já como booleano, e o valor total do pedido. Suporta paginação e o filtro opcional etapa_codigo (ex: '20' Separar Estoque, '50' Faturar); sem esse filtro, traz pedidos de todas as etapas. Também aceita o parâmetro genérico 'filtros' (critérios campo/operador/valor sobre qualquer campo do pedido já resolvido, ex: 'cliente.razaoSocial', 'valorTotalPedido').

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem de pedidos (padrão 1).
  - `registros_por_pagina` (number, opcional) — Pedidos por página (padrão 20 — cada pedido tem um payload pesado, com todos os campos fiscais; evite valores altos).
  - `etapa_codigo` (string, opcional) — Filtra por uma etapa específica do funil de vendas (ex: '20' = Separar Estoque, '50' = Faturar). Se omitido, traz pedidos de todas as etapas.
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)

### `omie_pedido_venda_separar_estoque_listar`

Atalho pro relatório que precisa ser acompanhado com mais frequência: pedidos na etapa 'Separar Estoque' (código '20', fixo), já com cliente, os ITENS de cada pedido (produto/SKU/descrição/quantidade/unidade) e valor total resolvidos — mesmo formato de omie_pedido_venda_listar_com_cliente, mas sem precisar passar etapa_codigo toda vez. Os pedidos cancelados são removidos por padrão (a Omie não reseta a etapa de um pedido cancelado); use incluir_cancelados=true pra vê-los também. Suporta paginação e o parâmetro genérico 'filtros' (mesmo formato de omie_pedido_venda_listar_com_cliente).

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem de pedidos (padrão 1).
  - `registros_por_pagina` (number, opcional) — Pedidos por página (padrão 20 — cada pedido tem um payload pesado, com todos os campos fiscais; evite valores altos).
  - `incluir_cancelados` (boolean, opcional) — Se true, inclui também os pedidos cancelados (por padrão são removidos — a Omie não reseta a etapa de um pedido quando ele é cancelado, então sem esse filtro apareceriam pedidos cancelados como se ainda precisassem ser separados).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria)
