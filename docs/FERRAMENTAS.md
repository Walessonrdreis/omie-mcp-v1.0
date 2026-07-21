# Ferramentas disponíveis — referência técnica

> Gerado automaticamente a partir do registro real de ferramentas (`src/tools/registry.ts`, `src/tools/generic.ts`) via `npm run doc-ferramentas`. Não editar à mão — description/parâmetros/`destructive` vêm direto do código, então rodar o script de novo após mudar uma tool mantém isso sincronizado. Para o que cada ferramenta *faz* em linguagem de negócio, ver `FUNCIONALIDADES.md`; para arquitetura/limitações de cada módulo, ver `README.md`.

**Como chamar:** via MCP (protocolo padrão) ou via API HTTP local (`src/httpServer.ts`, ver `docs/SEGURANCA.md`) — `POST /tools/<nome>` com o payload abaixo no corpo JSON (sem o wrapper `param`, é liso: `{campo: valor, ...}`). Ferramentas marcadas **⚠️ destrutiva** exigem `"confirmar": true` no payload quando chamadas pela API HTTP.

## Índice

- [Genérica](#generica)
- [Ordem de Produção](#ordem-de-producao)
- [Produtos](#produtos)
- [Estoque](#estoque)
- [Pedido de Venda](#pedido-de-venda)
- [Clientes e Fornecedores](#clientes-e-fornecedores)
- [Contas Correntes](#contas-correntes)
- [Fluxo de Caixa](#fluxo-de-caixa)
- [Estrutura de Produtos](#estrutura-de-produtos)
- [Notas Fiscais (NF-e)](#notas-fiscais-nf-e)
- [Compras](#compras)
- [PIX](#pix)
- [Orçamento de Caixa](#orcamento-de-caixa)
- [Serviços](#servicos)
- [CRM](#crm)
- [Cadastros Auxiliares](#cadastros-auxiliares)
- [Categorias e Departamentos](#categorias-e-departamentos)
- [Características de Produto](#caracteristicas-de-produto)
- [Nota de Entrada](#nota-de-entrada)
- [Contas a Pagar](#contas-a-pagar)
- [Contas a Receber](#contas-a-receber)

## Genérica

### `omie_chamar_api`

Chama qualquer endpoint da API da Omie (ERP), permitindo acessar todos os módulos: Geral (clientes, fornecedores, projetos), CRM, Finanças (contas a pagar/receber, extrato), Compras/Estoque/Produção (produtos, estrutura, ordens de produção, estoque), Vendas e NF-e, Serviços e NFS-e, Painel do Contador, entre outros. Use quando não houver uma ferramenta específica (omie_op_*, omie_estrutura_*, etc.) para a operação desejada. Consulte https://developer.omie.com.br/service-list/ para descobrir o 'resource' (caminho do módulo) e o 'call' (nome do método) corretos.

**Parâmetros:**

  - `param` (objeto livre, **obrigatório**) — campos conforme documentação oficial da Omie para este método (não tipado no MCP; a ferramenta repassa o objeto direto).

## Ordem de Produção

### `omie_op_incluir` ⚠️ **destrutiva**

Inclui uma nova Ordem de Produção (OP) na Omie. Método Omie: IncluirOrdemProducao. Precisa de nCodProduto (o produto já precisa ter estrutura/BOM preenchida, senão a Omie recusa — veja omie_estrutura_incluir), dDtPrevisao (dd/mm/aaaa) e nQtde. codigo_local_estoque é opcional (padrão 0, testado ao vivo: a Omie exige o campo mesmo assim, mesmo a doc pública marcando como opcional).

**Parâmetros:**

  - `cCodIntOP` (string, opcional) — Código de integração da OP (opcional).
  - `nCodProduto` (number, **obrigatório**) — Código Omie do produto a produzir (precisa já ter estrutura/BOM preenchida).
  - `dDtPrevisao` (string, **obrigatório**) — Data prevista de conclusão, formato dd/mm/aaaa.
  - `nQtde` (number, **obrigatório**) — Quantidade a produzir.
  - `codigo_local_estoque` (number, opcional) — Local de estoque (testado ao vivo — obrigatório na Omie, mesmo a doc pública marcando como opcional; 0 = local padrão).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_op_alterar` ⚠️ **destrutiva**

Altera uma Ordem de Produção existente. Método Omie: AlterarOrdemProducao. Identifique por nCodOP ou cCodIntOP e reenvie os dados (nCodProduto, dDtPrevisao, nQtde).

**Parâmetros:**

  - `nCodOP` (number, opcional) — Código Omie da OP a alterar.
  - `cCodIntOP` (string, opcional) — Código de integração da OP a alterar (alternativa).
  - `nCodProduto` (number, **obrigatório**) — Código Omie do produto.
  - `dDtPrevisao` (string, **obrigatório**) — Data prevista de conclusão, formato dd/mm/aaaa.
  - `nQtde` (number, **obrigatório**) — Quantidade a produzir.
  - `codigo_local_estoque` (number, opcional)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_op_excluir` ⚠️ **destrutiva**

Exclui uma Ordem de Produção. Método Omie: ExcluirOrdemProducao. Identifique por nCodOP ou cCodIntOP.

**Parâmetros:**

  - `nCodOP` (number, opcional) — Código Omie da OP.
  - `cCodIntOP` (string, opcional) — Código de integração da OP (alternativa).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_op_consultar`

Consulta uma Ordem de Produção específica (por código Omie ou código interno), com os insumos utilizados. Método Omie: ConsultarOrdemProducao. O produto vem só como código (nCodProduto) e a etapa como código cru (cEtapa) — para descrição/SKU do produto, use omie_produtos_consultar ou omie_op_listar_com_produto.

**Parâmetros:**

  - `nCodOP` (number, opcional) — Código Omie da OP.
  - `cCodIntOP` (string, opcional) — Código de integração da OP (alternativa).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_op_listar`

Lista as Ordens de Produção cadastradas, com paginação e filtros. Método Omie: ListarOrdemProducao. Devolve só o código do produto (nCodProduto, sem descrição/SKU) e a etapa como código cru (cEtapa, configurável por conta, sem tradução via API). Para já vir com a descrição do produto, use omie_op_listar_com_produto.

**Parâmetros:**

  - `param` (objeto livre, **obrigatório**) — campos conforme documentação oficial da Omie para este método (não tipado no MCP; a ferramenta repassa o objeto direto).

**Tipo:** passthrough (`produtos/op` → `ListarOrdemProducao`)

### `omie_op_listar_com_produto`

Lista Ordens de Produção JÁ com a descrição/SKU do produto de cada OP (a Omie só devolve o código do produto na listagem crua, sem descrição — esta ferramenta busca o cadastro de cada produto envolvido e junta). Também expõe 'concluida' (true/false, campo confiável) além do 'etapaCodigo' cru (a etapa do kanban é configurável por conta — de 3 a 6 fases com nomes próprios — e a API não tem endpoint pra traduzir o código pro nome; se você souber o significado das etapas dessa conta, pode interpretar etapaCodigo). Suporta paginação (pagina/registros_por_pagina), o filtro apenas_nao_concluidas e o parâmetro genérico 'filtros' — lista de critérios (campo/operador/valor) aplicados sobre QUALQUER campo do resultado já enriquecido (ex: descricaoProduto, codigoSku, quantidade), com operadores igual/diferente/contem/maior_que/menor_que/entre. Ex: filtros: [{ campo: 'descricaoProduto', operador: 'contem', valor: '100kg' }].

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem de OPs (padrão 1).
  - `registros_por_pagina` (number, opcional) — Quantidade de OPs por página (padrão 20 — cada OP dispara uma busca de produto).
  - `apenas_nao_concluidas` (boolean, opcional) — Se true, remove da lista as OPs já concluídas (cConcluida = 'S').
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

## Produtos

### `omie_produtos_consultar`

Consulta o cadastro de um produto específico. Método Omie: ConsultarProduto.

**Parâmetros:**

  - `param` (objeto livre, **obrigatório**) — campos conforme documentação oficial da Omie para este método (não tipado no MCP; a ferramenta repassa o objeto direto).

**Tipo:** passthrough (`geral/produtos` → `ConsultarProduto`)

### `omie_produtos_incluir` ⚠️ **destrutiva**

Cria um novo produto/serviço no cadastro. Método Omie: IncluirProduto. Campos obrigatórios (testado ao vivo — a doc pública da Omie erra ao marcar 'codigo' como opcional): codigo (SKU), descricao, unidade. Opcionais comuns: codigo_produto_integracao, ncm, valor_unitario, ean, codigo_familia (via omie_familias_listar), tipoItem, peso_liq, peso_bruto, marca, modelo. Retorna codigo_produto (código Omie gerado).

**Parâmetros:**

  - `codigo` (string, **obrigatório**) — Código/SKU do produto (obrigatório na Omie, apesar da doc pública dizer o contrário).
  - `codigo_produto_integracao` (string, opcional) — Código de integração externo, se você mantém um.
  - `descricao` (string, **obrigatório**) — Descrição/nome do produto.
  - `unidade` (string, **obrigatório**) — Unidade de medida (ex: UN, KG, CX).
  - `ncm` (string, opcional) — Código NCM (obrigatório pra produtos, opcional pra serviços).
  - `valor_unitario` (number, opcional) — Preço unitário de venda.
  - `ean` (string, opcional)
  - `codigo_familia` (number, opcional) — Código da família (via omie_familias_listar).
  - `tipoItem` (string, opcional)
  - `peso_liq` (number, opcional)
  - `peso_bruto` (number, opcional)
  - `marca` (string, opcional)
  - `modelo` (string, opcional)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_produtos_alterar` ⚠️ **destrutiva**

Altera um produto/serviço já cadastrado. Método Omie: AlterarProduto. Precisa identificar o produto por codigo_produto, codigo (SKU) ou codigo_produto_integracao, e enviar os campos que devem mudar (mesmos campos aceitos em omie_produtos_incluir).

**Parâmetros:**

  - `codigo_produto` (number, opcional) — Código Omie do produto a alterar.
  - `codigo` (string, opcional) — SKU do produto a alterar (alternativa ao codigo_produto).
  - `codigo_produto_integracao` (string, opcional) — Código de integração do produto a alterar (alternativa).
  - `descricao` (string, opcional)
  - `unidade` (string, opcional)
  - `ncm` (string, opcional)
  - `valor_unitario` (number, opcional)
  - `ean` (string, opcional)
  - `codigo_familia` (number, opcional)
  - `tipoItem` (string, opcional)
  - `peso_liq` (number, opcional)
  - `peso_bruto` (number, opcional)
  - `marca` (string, opcional)
  - `modelo` (string, opcional)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_produtos_excluir` ⚠️ **destrutiva**

Exclui um produto/serviço do cadastro. Método Omie: ExcluirProduto. Identifique o produto por codigo_produto, codigo (SKU) ou codigo_produto_integracao (só um deles é suficiente). A Omie recusa a exclusão se o produto já tiver movimentação (pedido, estoque, OP, etc.).

**Parâmetros:**

  - `codigo_produto` (number, opcional)
  - `codigo` (string, opcional)
  - `codigo_produto_integracao` (string, opcional)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_produtos_listar`

Lista produtos cadastrados, com filtros e paginação. Método Omie: ListarProdutos. Aceita filtrar_apenas_familia (código da família, via omie_familias_listar) pra listar só produtos de uma família. Atenção: o campo quantidade_estoque retornado aqui NÃO é confiável (vem sempre 0) — para saber a quantidade/valor real em estoque use omie_produtos_listar_com_estoque ou omie_estoque_total_produto.

**Parâmetros:**

  - `param` (objeto livre, **obrigatório**) — campos conforme documentação oficial da Omie para este método (não tipado no MCP; a ferramenta repassa o objeto direto).

**Tipo:** passthrough (`geral/produtos` → `ListarProdutos`)

### `omie_familias_listar`

Lista as famílias de produtos cadastradas, com paginação. Método Omie: PesquisarFamilias (recurso 'geral/familias'). Campos típicos: pagina, registros_por_pagina.

**Parâmetros:**

  - `param` (objeto livre, **obrigatório**) — campos conforme documentação oficial da Omie para este método (não tipado no MCP; a ferramenta repassa o objeto direto).

**Tipo:** passthrough (`geral/familias` → `PesquisarFamilias`)

### `omie_produtos_listar_com_estoque`

Lista produtos JÁ com a quantidade e o valor em estoque calculados (somando todos os locais de estoque cadastrados na Omie). A Omie não entrega esse cruzamento pronto — o cadastro de produtos não tem estoque confiável e a posição de estoque não tem os dados do produto — então esta ferramenta busca os dois e junta. Use para relatórios do tipo 'lista de produtos com valor em estoque', 'quais produtos tenho parado', etc. Devolve, por produto: quantidadeEmEstoque, valorEmEstoqueVenda (preço de venda) e valorEmEstoqueCusto (custo médio). Suporta paginação (pagina/registros_por_pagina), o filtro apenas_com_estoque (remove produtos com estoque zerado) e filtrar_apenas_familia (código da família, via omie_familias_listar) pra restringir a uma família de produtos. Também aceita o parâmetro genérico 'filtros' (critérios campo/operador/valor sobre qualquer campo do item, ex: descricao, valorEmEstoqueVenda).

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem de produtos (padrão 1).
  - `registros_por_pagina` (number, opcional) — Quantidade de produtos por página (padrão 50).
  - `apenas_com_estoque` (boolean, opcional) — Se true, remove da lista os produtos com quantidade em estoque igual a zero.
  - `filtrar_apenas_familia` (number, opcional) — Código da família de produtos pra filtrar (obtido via omie_familias_listar, campo 'codigo'). Se omitido, lista produtos de todas as famílias.
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

## Estoque

### `omie_estoque_ajuste_incluir` ⚠️ **destrutiva**

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

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_estoque_ajuste_excluir` ⚠️ **destrutiva**

Exclui um ajuste de estoque (pelo id_ajuste devolvido na inclusão). Método Omie: ExcluirAjusteEstoque. ATENÇÃO: isso reverte o ajuste, mas NÃO desfaz a dependência já criada no produto — ele continua sem poder ser excluído (ver nota em omie_estoque_ajuste_incluir).

**Parâmetros:**

  - `id_ajuste` (number, **obrigatório**) — Código do ajuste a excluir (devolvido em id_ajuste na inclusão). ATENÇÃO: excluir o ajuste não desfaz a dependência criada no produto — a Omie mantém um histórico permanente que passa a impedir excluir esse produto depois.

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_estoque_movimentos_listar`

Lista os movimentos de estoque (entradas/saídas) de um produto em um período, por local de estoque. Método Omie: ListarMovimentos (recurso 'estoque/movestoque').

**Parâmetros:**

  - `param` (objeto livre, **obrigatório**) — campos conforme documentação oficial da Omie para este método (não tipado no MCP; a ferramenta repassa o objeto direto).

**Tipo:** passthrough (`estoque/movestoque` → `ListarMovimentos`)

### `omie_estoque_total_produto`

Calcula o estoque TOTAL de um produto, somando a posição física (e saldo/reservado) em TODOS os locais de estoque cadastrados na Omie. A Omie não expõe esse total pronto — só posições por local, paginadas — então esta ferramenta busca todas as páginas e consolida. Use quando o usuário perguntar 'quanto tenho no total desse produto', sem se referir a um local específico.

**Parâmetros:**

  - `codigo_produto` (number, **obrigatório**) — Código do produto na Omie (nCodProd/codigo_produto), obtido via omie_produtos_consultar ou omie_produtos_listar.

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

## Pedido de Venda

### `omie_pedido_venda_consultar`

Consulta um Pedido de Venda específico, com todos os itens/impostos. Método Omie: ConsultarPedido. Identifique por codigo_pedido ou codigo_pedido_integracao.

**Parâmetros:**

  - `codigo_pedido` (number, opcional)
  - `codigo_pedido_integracao` (string, opcional)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_pedido_venda_incluir` ⚠️ **destrutiva**

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

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_pedido_venda_alterar` ⚠️ **destrutiva**

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

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_pedido_venda_excluir` ⚠️ **destrutiva**

Exclui um Pedido de Venda. Método Omie: ExcluirPedido. Identifique por codigo_pedido ou codigo_pedido_integracao. A Omie recusa se o pedido já estiver faturado.

**Parâmetros:**

  - `codigo_pedido` (number, opcional)
  - `codigo_pedido_integracao` (string, opcional)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

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

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_pedido_venda_listar_com_cliente`

Lista Pedidos de Venda JÁ com o nome do cliente (razão social/nome fantasia), a etapa por extenso e os ITENS de cada pedido (produto/SKU/descrição/quantidade/unidade) resolvidos — a Omie só devolve o código do cliente e o código cru da etapa na listagem crua. Também expõe 'cancelado' e 'faturado' já como booleano, e o valor total do pedido. Suporta paginação e o filtro opcional etapa_codigo (ex: '20' Separar Estoque, '50' Faturar); sem esse filtro, traz pedidos de todas as etapas. Também aceita o parâmetro genérico 'filtros' (critérios campo/operador/valor sobre qualquer campo do pedido já resolvido, ex: 'cliente.razaoSocial', 'valorTotalPedido').

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem de pedidos (padrão 1).
  - `registros_por_pagina` (number, opcional) — Pedidos por página (padrão 20 — cada pedido tem um payload pesado, com todos os campos fiscais; evite valores altos).
  - `etapa_codigo` (string, opcional) — Filtra por uma etapa específica do funil de vendas (ex: '20' = Separar Estoque, '50' = Faturar). Se omitido, traz pedidos de todas as etapas.
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_pedido_venda_separar_estoque_listar`

Atalho pro relatório que precisa ser acompanhado com mais frequência: pedidos na etapa 'Separar Estoque' (código '20', fixo), já com cliente, os ITENS de cada pedido (produto/SKU/descrição/quantidade/unidade) e valor total resolvidos — mesmo formato de omie_pedido_venda_listar_com_cliente, mas sem precisar passar etapa_codigo toda vez. Os pedidos cancelados são removidos por padrão (a Omie não reseta a etapa de um pedido cancelado); use incluir_cancelados=true pra vê-los também. Suporta paginação e o parâmetro genérico 'filtros' (mesmo formato de omie_pedido_venda_listar_com_cliente).

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem de pedidos (padrão 1).
  - `registros_por_pagina` (number, opcional) — Pedidos por página (padrão 20 — cada pedido tem um payload pesado, com todos os campos fiscais; evite valores altos).
  - `incluir_cancelados` (boolean, opcional) — Se true, inclui também os pedidos cancelados (por padrão são removidos — a Omie não reseta a etapa de um pedido quando ele é cancelado, então sem esse filtro apareceriam pedidos cancelados como se ainda precisassem ser separados).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

## Clientes e Fornecedores

### `omie_clientes_consultar`

Consulta o cadastro de um cliente ou fornecedor específico (razão social, nome fantasia, CNPJ/CPF, contato, endereço) — na Omie, cliente e fornecedor usam o MESMO cadastro ('geral/clientes'), diferenciados pela tag ('Cliente'/'Fornecedor'/'Colaborador'/'Sócios', campo 'tags'). Método Omie: ConsultarCliente.

**Parâmetros:**

  - `param` (objeto livre, **obrigatório**) — campos conforme documentação oficial da Omie para este método (não tipado no MCP; a ferramenta repassa o objeto direto).

**Tipo:** passthrough (`geral/clientes` → `ConsultarCliente`)

### `omie_clientes_listar`

Lista clientes/fornecedores cadastrados, com paginação e filtros. Método Omie: ListarClientes (recurso 'geral/clientes'). Aceita filtro avançado via 'clientesFiltro' (ex: {"tags": [{"tag": "Fornecedor"}]} pra listar só fornecedores — ver também omie_fornecedores_listar, que já vem pronto com esse filtro).

**Parâmetros:**

  - `param` (objeto livre, **obrigatório**) — campos conforme documentação oficial da Omie para este método (não tipado no MCP; a ferramenta repassa o objeto direto).

**Tipo:** passthrough (`geral/clientes` → `ListarClientes`)

### `omie_fornecedores_listar`

Lista fornecedores cadastrados — atalho pra omie_clientes_listar já filtrado pela tag 'Fornecedor' (a Omie não separa cliente de fornecedor em cadastros diferentes, só por tag). Suporta paginação e busca por razão social/nome fantasia/CNPJ-CPF, além de apenas_ativos (remove inativos).

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 20).
  - `razao_social` (string, opcional) — Filtra por razão social (busca parcial).
  - `nome_fantasia` (string, opcional) — Filtra por nome fantasia (busca parcial).
  - `cnpj_cpf` (string, opcional) — Filtra por CNPJ/CPF exato.
  - `apenas_ativos` (boolean, opcional) — Se true, remove da lista os fornecedores marcados como inativos.

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_clientes_incluir` ⚠️ **destrutiva**

Cria um novo cliente/fornecedor no cadastro (lembre: é o MESMO cadastro na Omie, diferenciado só pela tag — use tags: [{ tag: 'Cliente' }] ou [{ tag: 'Fornecedor' }]). Método Omie: IncluirCliente. Campos obrigatórios (testado ao vivo — a doc pública da Omie erra ao marcar 'codigo_cliente_integracao' como opcional): codigo_cliente_integracao, razao_social, cnpj_cpf. Opcionais comuns: nome_fantasia, email, tags, telefone, endereço.

**Parâmetros:**

  - `codigo_cliente_integracao` (string, **obrigatório**) — Código de integração (obrigatório na Omie, apesar da doc pública dizer o contrário).
  - `razao_social` (string, **obrigatório**) — Razão social (ou nome, se pessoa física).
  - `cnpj_cpf` (string, **obrigatório**) — CNPJ ou CPF.
  - `nome_fantasia` (string, opcional)
  - `email` (string, opcional)
  - `tags` (array, opcional) — Ex: [{ tag: 'Cliente' }] ou [{ tag: 'Fornecedor' }].
  - `telefone1_ddd` (string, opcional)
  - `telefone1_numero` (string, opcional)
  - `endereco` (string, opcional)
  - `endereco_numero` (string, opcional)
  - `bairro` (string, opcional)
  - `complemento` (string, opcional)
  - `estado` (string, opcional)
  - `cidade` (string, opcional)
  - `cep` (string, opcional)
  - `observacao` (string, opcional)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_clientes_alterar` ⚠️ **destrutiva**

Altera um cliente/fornecedor já cadastrado. Método Omie: AlterarCliente. Identifique por codigo_cliente_omie ou codigo_cliente_integracao, e envie os campos que devem mudar (mesmos aceitos em omie_clientes_incluir).

**Parâmetros:**

  - `codigo_cliente_omie` (number, opcional) — Código Omie do cliente a alterar.
  - `codigo_cliente_integracao` (string, opcional) — Código de integração do cliente a alterar (alternativa).
  - `razao_social` (string, opcional)
  - `cnpj_cpf` (string, opcional)
  - `nome_fantasia` (string, opcional)
  - `email` (string, opcional)
  - `tags` (array, opcional)
  - `telefone1_ddd` (string, opcional)
  - `telefone1_numero` (string, opcional)
  - `endereco` (string, opcional)
  - `endereco_numero` (string, opcional)
  - `bairro` (string, opcional)
  - `complemento` (string, opcional)
  - `estado` (string, opcional)
  - `cidade` (string, opcional)
  - `cep` (string, opcional)
  - `observacao` (string, opcional)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_clientes_excluir` ⚠️ **destrutiva**

Exclui um cliente/fornecedor do cadastro. Método Omie: ExcluirCliente. Identifique por codigo_cliente_omie ou codigo_cliente_integracao. A Omie recusa se já houver movimentação (pedido, conta a pagar/receber, etc.).

**Parâmetros:**

  - `codigo_cliente_omie` (number, opcional)
  - `codigo_cliente_integracao` (string, opcional)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

## Contas Correntes

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

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

## Fluxo de Caixa

### `omie_fluxo_caixa_gerar`

Monta o fluxo de caixa (entradas, saídas e saldo) num formato tabular pronto pra leitura ou exportação futura pra planilha — a Omie NÃO tem esse relatório pronto, só lançamento por lançamento de contas a pagar/receber (financas/mf ListarMovimentos), então esta ferramenta busca todos os lançamentos do período, separa REALIZADO (já pago/recebido, pela data de pagamento) de PREVISTO (contas em aberto ainda não liquidadas, pela data de vencimento, excluindo canceladas) e agrega por dia ou mês E por conta corrente (nome já resolvido). Cada linha do resultado traz: período, conta corrente, entradas/saídas realizadas, saldo do período e acumulado, e o mesmo para o previsto (projeção incluindo o que ainda vai vencer). IMPORTANTE: o saldo acumulado é a variação DENTRO do período pedido, não o saldo bancário real (isso vem explicado no campo avisoSaldo da resposta). Períodos longos geram muitas páginas na Omie e podem demorar — prefira períodos de até ~3 meses por chamada.

**Parâmetros:**

  - `data_inicio` (string, **obrigatório**) — Data inicial do período, formato dd/mm/aaaa.
  - `data_fim` (string, **obrigatório**) — Data final do período, formato dd/mm/aaaa.
  - `agrupamento` (string, opcional) — Granularidade das linhas do fluxo: 'dia' (padrão) ou 'mes'.
  - `incluir_previsto` (boolean, opcional) — Se true (padrão), inclui também o que está previsto (contas a pagar/receber em aberto, ainda não liquidadas) além do que já foi realizado (pago/recebido). Se false, mostra só o realizado.
  - `apenas_favoritas` (boolean, opcional) — Se true (padrão), restringe o fluxo às contas correntes marcadas como favoritas pelo usuário (Cartão NuBank, Stone, Banco do Brasil, Wix, iFood, Sicoob, Itaú, Cartão Elo LEANDRO, Amazon, CAIXA LOJA), ignorando as demais dezenas de contas cadastradas na Omie (cartões antigos, adquirentes específicas, etc.). Se false, considera todas as contas.
  - `codigos_conta_corrente` (array, opcional) — Lista explícita de códigos de conta corrente (nCodCC, via omie_contas_correntes_listar) pra restringir o fluxo — sobrepõe apenas_favoritas quando informado.
  - `usar_saldo_real` (boolean, opcional) — Se true, ancora o saldo acumulado no saldo_inicial/saldo_data cadastrado de cada conta corrente (via omie_contas_correntes_listar) — busca os movimentos realizados entre a saldo_data e o início do período pedido e soma ao saldo_inicial, chegando num valor próximo do saldo bancário real (em vez de só a variação dentro do período). Requer que a conta tenha saldo_data/saldo_inicial configurados na Omie (data anterior ou igual a data_inicio) — contas sem isso configurado ficam com saldoRealAcumulado nulo. Pode ser mais lento (busca movimentos extras desde a saldo_data). Padrão: false.

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

## Estrutura de Produtos

### `omie_estrutura_listar`

Lista os produtos que TÊM estrutura (BOM/ficha técnica) cadastrada, já com o nome do produto e o nome de cada insumo/componente (a Omie devolve isso pronto — não precisa cruzar com o cadastro de produtos). Método Omie: ListarEstruturas (recurso 'malha'). Suporta paginação (pagina/registros_por_pagina, padrão 50) e o parâmetro genérico 'filtros' (critérios campo/operador/valor sobre qualquer campo do produto, ex: descricaoProduto, itens).

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Quantidade de produtos por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_estrutura_buscar_por_produto`

Busca a estrutura (BOM/ficha técnica) de um produto pelo NOME/descrição (ou trecho dela) ou pelo código, sem precisar saber o código interno da Omie de antemão — ex: 'qual a estrutura do produto 100kg'. Internamente pagina ListarEstruturas e filtra pela descrição/código do produto (a Omie não tem busca por texto nesse endpoint). Devolve os produtos que baterem, já com nome e quantidade de cada insumo. Se vier mais de um resultado, refine o termo de busca.

**Parâmetros:**

  - `termo` (string, **obrigatório**) — Nome/descrição (ou trecho dela) ou código do produto a procurar, ex: '100kg', 'PROD-001'.

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_estrutura_incluir` ⚠️ **destrutiva**

Adiciona um ou mais insumos/componentes à estrutura (BOM/ficha técnica) de um produto. Método Omie: IncluirEstrutura. O produto pai (idProduto) precisa ser do tipo '03 - Produto em Processo' ou '04 - Produto Acabado' (a Omie recusa outros tipos). Cada item exige intMalha (identificador único que você inventa pro item, ex: 'ITEM-001' — testado ao vivo: é obrigatório mesmo a doc pública da Omie dizendo o contrário), idProdMalha (código do produto/insumo componente, já cadastrado) e quantProdMalha.

**Parâmetros:**

  - `idProduto` (number, **obrigatório**) — Código Omie do produto pai (precisa ser tipo '03 - Produto em Processo' ou '04 - Produto Acabado', senão a Omie recusa).
  - `itens` (array, **obrigatório**) — Insumos/componentes a adicionar.

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_estrutura_alterar` ⚠️ **destrutiva**

Altera item(ns) já existentes na estrutura de um produto (ex: mudar quantidade de um insumo). Método Omie: AlterarEstrutura. Cada item precisa de idMalha (identifica o item — veja em omie_estrutura_buscar_por_produto/omie_estrutura_listar) e idProdMalha (testado ao vivo: obrigatório mesmo só pra mudar quantidade).

**Parâmetros:**

  - `idProduto` (number, **obrigatório**) — Código Omie do produto pai.
  - `itens` (array, **obrigatório**) — Itens a alterar.

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_estrutura_excluir` ⚠️ **destrutiva**

Remove um item específico da estrutura (BOM) de um produto. Método Omie: ExcluirEstrutura. Precisa de idProduto (produto pai) e idMalha (identifica o item — veja em omie_estrutura_buscar_por_produto/omie_estrutura_listar).

**Parâmetros:**

  - `idProduto` (number, **obrigatório**) — Código Omie do produto pai.
  - `idMalha` (number, **obrigatório**) — Identificador do item de estrutura a remover.

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

## Notas Fiscais (NF-e)

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

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_nfe_consultar`

Consulta o detalhe completo de uma nota fiscal (NF-e) específica: itens (descrição, NCM, CFOP, quantidade, valores), títulos financeiros gerados pela nota, e dados de emissão. Método Omie: ConsultarNF. Informe 'chave' (chave de acesso de 44 dígitos) OU 'codigo' (código interno da nota na Omie, nIdNF) — um dos dois é obrigatório.

**Parâmetros:**

  - `chave` (string, opcional) — Chave de acesso da NF-e (44 dígitos).
  - `codigo` (number, opcional) — Código interno da nota na Omie (nIdNF).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

## Compras

### `omie_pedido_compra_incluir` ⚠️ **destrutiva**

Cria um novo pedido de compra (fornecedor, itens, previsão de entrega). Método Omie: IncluirPedCompra (recurso 'produtos/pedidocompra'). Testado ao vivo: 'codigo_conta_corrente' (nCodCC) precisa ser um código de CONTA CORRENTE (ver omie_contas_correntes_listar) — apesar do nome sugerir centro de custo/departamento, a Omie recusa código de departamento aqui.

**Parâmetros:**

  - `cod_int_pedido` (string, **obrigatório**) — Código de integração único (máx. 20 caracteres) — você inventa.
  - `data_previsao` (string, **obrigatório**) — Data prevista de entrega, formato dd/mm/aaaa.
  - `quantidade_parcelas` (number, opcional)
  - `codigo_fornecedor` (number, **obrigatório**) — Código do fornecedor na Omie (nCodFor).
  - `codigo_conta_corrente` (number, **obrigatório**) — Código da conta corrente (nCodCC, ver omie_contas_correntes_listar). Testado ao vivo: apesar do nome sugerir centro de custo/departamento, a Omie exige aqui um código de CONTA CORRENTE — usar código de departamento é recusado.
  - `codigo_categoria` (string, opcional) — Categoria financeira (ex: '2.09.01').
  - `itens` (array, **obrigatório**)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_pedido_compra_alterar` ⚠️ **destrutiva**

Altera um pedido de compra já existente. Método Omie: AlteraPedCompra. Se 'itens' for enviado, SUBSTITUI os itens atuais do pedido (não faz merge).

**Parâmetros:**

  - `codigo_pedido` (number, **obrigatório**) — Código do pedido na Omie (nCodPed).
  - `quantidade_parcelas` (number, opcional)
  - `itens` (array, opcional) — Se enviado, SUBSTITUI os itens atuais do pedido (não faz merge).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_pedido_compra_excluir` ⚠️ **destrutiva**

Remove um pedido de compra. Método Omie: ExcluirPedCompra.

**Parâmetros:**

  - `codigo_pedido` (number, **obrigatório**) — Código do pedido na Omie (nCodPed).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_pedido_compra_consultar`

Busca os detalhes completos de um pedido de compra (itens, quantidade recebida, valores). Método Omie: ConsultarPedCompra.

**Parâmetros:**

  - `codigo_pedido` (number, **obrigatório**) — Código do pedido na Omie (nCodPed).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_pedido_compra_listar`

Lista os pedidos de compra cadastrados, com resumo (fornecedor, conta corrente, valor total, quantidade de itens). Método Omie: PesquisarPedCompra. Suporta paginação e o parâmetro genérico 'filtros'. Testado ao vivo: a Omie esconde pedidos por padrão nessa listagem — o MCP já pede todas as situações (pendente/faturado/recebido/cancelado/encerrado/parciais) pra sempre trazer tudo.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_requisicao_compra_incluir` ⚠️ **destrutiva**

Solicita a compra de insumos para produção (requisição de compra). Método Omie: IncluirReq (recurso 'produtos/requisicaocompra').

**Parâmetros:**

  - `cod_int_requisicao` (string, **obrigatório**) — Código de integração único (máx. 20 caracteres) — você inventa.
  - `codigo_categoria` (string, **obrigatório**) — Categoria financeira (ex: '2.09.01').
  - `data_sugestao` (string, **obrigatório**) — Data sugerida de compra, formato dd/mm/aaaa.
  - `itens` (array, **obrigatório**)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_requisicao_compra_alterar` ⚠️ **destrutiva**

Altera uma requisição de compra já existente. Método Omie: AlterarReq. Se 'itens' for enviado, SUBSTITUI os itens atuais da requisição (não faz merge).

**Parâmetros:**

  - `codigo_requisicao` (number, **obrigatório**) — Código da requisição na Omie (codReqCompra).
  - `codigo_categoria` (string, opcional)
  - `data_sugestao` (string, opcional)
  - `itens` (array, opcional) — Se enviado, SUBSTITUI os itens atuais da requisição (não faz merge).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_requisicao_compra_excluir` ⚠️ **destrutiva**

Remove uma requisição de compra. Método Omie: ExcluirReq.

**Parâmetros:**

  - `codigo_requisicao` (number, **obrigatório**) — Código da requisição na Omie (codReqCompra).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_requisicao_compra_consultar`

Busca os detalhes de uma requisição de compra específica. Método Omie: ConsultarReq.

**Parâmetros:**

  - `codigo_requisicao` (number, **obrigatório**) — Código da requisição na Omie (codReqCompra).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_requisicao_compra_listar`

Lista as requisições de compra cadastradas. Método Omie: PesquisarReq. Suporta paginação e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

## PIX

### `omie_pix_listar`

Lista os PIX gerados para títulos de contas a receber, com resumo (título, valor, emissão, vencimento, status). Método Omie: ListarPix (recurso 'financas/pix'). Suporta paginação, filtro por período de emissão/status e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `emissao_de` (string, opcional) — Filtra por data de emissão, formato dd/mm/aaaa.
  - `emissao_ate` (string, opcional) — Fim do período de emissão, formato dd/mm/aaaa.
  - `status` (string, opcional) — Filtra por status (ex: 'LIQUIDADO', 'AGUARDANDO', 'CANCELADO').
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_pix_obter`

Busca o PIX (QR Code, copia-e-cola, status) de um título de contas a receber. Método Omie: ObterPix.

**Parâmetros:**

  - `codigo_titulo` (number, **obrigatório**) — Código do título de contas a receber na Omie.

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_pix_obter_status`

Consulta rapidamente só o status de pagamento de um PIX. Método Omie: ObterStatusPix.

**Parâmetros:**

  - `codigo_titulo` (number, **obrigatório**) — Código do título de contas a receber na Omie.

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_pix_gerar` ⚠️ **destrutiva**

Gera um PIX (QR Code + copia-e-cola) para cobrar um título de contas a receber. Método Omie: GerarPix (recurso 'financas/pix').

**Parâmetros:**

  - `codigo_titulo` (number, **obrigatório**) — Código do título de contas a receber na Omie.
  - `valor` (number, **obrigatório**) — Valor do PIX a cobrar.
  - `codigo_conta_corrente` (number, **obrigatório**) — Código da conta corrente que vai receber (nCodCC/nIdConta).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_pix_cancelar` ⚠️ **destrutiva**

Cancela um PIX gerado (ainda não pago). Método Omie: CancelarPix.

**Parâmetros:**

  - `id_pix` (number, **obrigatório**) — Identificador do PIX na Omie (nIdPix, ver omie_pix_obter).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

## Orçamento de Caixa

### `omie_orcamento_caixa_consultar`

Consulta o orçamento de caixa NATIVO da Omie (previsto x realizado) por categoria financeira, num mês/ano. Método Omie: ListarOrcamentos (recurso 'financas/caixa'). Diferente de omie_fluxo_caixa_gerar (que calcula manualmente a partir de contas a pagar/receber), este é o relatório pronto da própria Omie, organizado por categoria (ex: '1.01.01 Vendas'), não por conta corrente/dia. Suporta o parâmetro genérico 'filtros' (ex: filtrar só categorias com diferença entre previsto e realizado).

**Parâmetros:**

  - `ano` (number, **obrigatório**) — Ano do orçamento, ex: 2026.
  - `mes` (number, **obrigatório**) — Mês do orçamento (1 a 12).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

## Serviços

### `omie_servico_incluir` ⚠️ **destrutiva**

Cadastra um novo serviço prestado pela empresa (cadastro, não é uma venda/OS). Método Omie: IncluirCadastroServico (recurso 'servicos/servico').

**Parâmetros:**

  - `cod_int_servico` (string, **obrigatório**) — Código de integração único que você inventa.
  - `descricao` (string, **obrigatório**) — Descrição breve do serviço.
  - `codigo` (string, **obrigatório**) — Código interno do serviço (SKU de serviço).
  - `preco_unitario` (number, **obrigatório**)
  - `descricao_completa` (string, opcional)
  - `codigo_categoria` (string, opcional)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_servico_alterar` ⚠️ **destrutiva**

Altera um serviço já cadastrado. Método Omie: AlterarCadastroServico.

**Parâmetros:**

  - `codigo_servico` (number, **obrigatório**) — Código do serviço na Omie (nCodServ).
  - `descricao` (string, opcional)
  - `preco_unitario` (number, opcional)
  - `descricao_completa` (string, opcional)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_servico_excluir` ⚠️ **destrutiva**

Remove um serviço do cadastro. Método Omie: ExcluirCadastroServico.

**Parâmetros:**

  - `codigo_servico` (number, **obrigatório**) — Código do serviço na Omie (nCodServ).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_servico_consultar`

Busca os detalhes de um serviço cadastrado. Método Omie: ConsultarCadastroServico.

**Parâmetros:**

  - `codigo_servico` (number, **obrigatório**) — Código do serviço na Omie (nCodServ).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_servico_listar`

Lista os serviços cadastrados. Método Omie: ListarCadastroServico. Suporta paginação e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_os_incluir` ⚠️ **destrutiva**

Cria uma nova Ordem de Serviço (venda de serviço para um cliente). Método Omie: IncluirOS (recurso 'servicos/os'). Cada item precisa de 'codigo_servico_municipal' e 'codigo_servico_lc116' — use omie_servicos_lc116_listar pra achar um código válido (ex: '1.01' = Análise e Desenvolvimento de Sistemas). Testado ao vivo: esses códigos precisam ser um código já cadastrado na tabela LC116, texto livre é recusado.

**Parâmetros:**

  - `cod_int_os` (string, **obrigatório**) — Código de integração único que você inventa.
  - `codigo_cliente` (number, **obrigatório**) — Código do cliente na Omie (nCodCli).
  - `codigo_condicao_pagamento` (string, opcional) — Código da condição de pagamento (padrão '999' = à vista).
  - `data_previsao` (string, **obrigatório**) — Data prevista, formato dd/mm/aaaa.
  - `etapa` (string, opcional) — Etapa da OS: 00, 10, 20, 30, 40 ou 50 (padrão '10').
  - `quantidade_parcelas` (number, opcional)
  - `codigo_categoria` (string, **obrigatório**) — Categoria financeira (ex: '1.01.02').
  - `codigo_conta_corrente` (number, **obrigatório**) — Código da conta corrente (nCodCC).
  - `itens` (array, **obrigatório**)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_os_alterar` ⚠️ **destrutiva**

Altera uma Ordem de Serviço já existente (data prevista, etapa). Método Omie: AlterarOS.

**Parâmetros:**

  - `codigo_os` (number, **obrigatório**) — Código da OS na Omie (nCodOS).
  - `data_previsao` (string, opcional)
  - `etapa` (string, opcional)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_os_excluir` ⚠️ **destrutiva**

Remove uma Ordem de Serviço. Método Omie: ExcluirOS.

**Parâmetros:**

  - `codigo_os` (number, **obrigatório**) — Código da OS na Omie (nCodOS).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_os_consultar`

Busca os detalhes de uma Ordem de Serviço (itens, valores, se faturada/cancelada). Método Omie: ConsultarOS.

**Parâmetros:**

  - `codigo_os` (number, **obrigatório**) — Código da OS na Omie (nCodOS).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_os_listar`

Lista as Ordens de Serviço cadastradas. Método Omie: ListarOS. Suporta paginação e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_nfse_listar`

Lista as NFS-e (nota fiscal de serviço) já emitidas. Método Omie: ListarNFSEs (recurso 'servicos/nfse'). SOMENTE LEITURA — não emite NFS-e (mesma cautela do módulo NF-e de produto: documento fiscal com efeito legal). Suporta paginação, filtro por período de emissão e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `emissao_de` (string, opcional) — Filtra por data de emissão, formato dd/mm/aaaa.
  - `emissao_ate` (string, opcional) — Fim do período de emissão, formato dd/mm/aaaa.
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_servicos_lc116_listar`

Lista os códigos válidos da Lei Complementar 116 (classificação de serviços), usados nos campos 'codigo_servico_lc116'/'codigo_servico_municipal' de omie_os_incluir. Método Omie: ListarLC116 (recurso 'servicos/lc116'). Use o parâmetro genérico 'filtros' pra buscar por descrição (ex: filtro 'contem' em 'descricao').

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

## CRM

### `omie_crm_conta_incluir` ⚠️ **destrutiva**

Cria uma nova Conta no CRM (empresa/pessoa no funil de vendas — diferente do cadastro de Cliente/Fornecedor). Método Omie: IncluirConta (recurso 'crm/contas'). Testado ao vivo: os blocos de endereço (uf/cidade) e email são exigidos, mesmo com poucos campos.

**Parâmetros:**

  - `cod_int_conta` (string, **obrigatório**) — Código de integração único que você inventa.
  - `nome` (string, **obrigatório**)
  - `uf` (string, **obrigatório**) — UF, ex: 'DF'.
  - `cidade` (string, **obrigatório**)
  - `email` (string, **obrigatório**)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_crm_conta_alterar` ⚠️ **destrutiva**

Altera uma Conta do CRM já existente. Método Omie: AlterarConta.

**Parâmetros:**

  - `codigo_conta` (number, **obrigatório**) — Código da conta no CRM (nCod).
  - `nome` (string, opcional)
  - `uf` (string, opcional)
  - `cidade` (string, opcional)
  - `email` (string, opcional)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_crm_conta_excluir` ⚠️ **destrutiva**

Remove uma Conta do CRM. Método Omie: ExcluirConta.

**Parâmetros:**

  - `codigo_conta` (number, **obrigatório**) — Código da conta no CRM (nCod).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_crm_conta_consultar`

Busca os detalhes de uma Conta do CRM. Método Omie: ConsultarConta.

**Parâmetros:**

  - `codigo_conta` (number, **obrigatório**) — Código da conta no CRM (nCod).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_crm_conta_listar`

Lista as Contas do CRM. Método Omie: ListarContas. Suporta paginação e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_crm_contato_incluir` ⚠️ **destrutiva**

Cria um novo Contato do CRM, vinculado a uma Conta. Método Omie: IncluirContato (recurso 'crm/contatos').

**Parâmetros:**

  - `cod_int_contato` (string, **obrigatório**) — Código de integração único que você inventa.
  - `nome` (string, **obrigatório**)
  - `sobrenome` (string, **obrigatório**)
  - `codigo_conta` (number, **obrigatório**) — Código da conta do CRM à qual este contato pertence (nCod).
  - `email` (string, opcional)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_crm_contato_alterar` ⚠️ **destrutiva**

Altera um Contato do CRM já existente. Método Omie: AlterarContato.

**Parâmetros:**

  - `codigo_contato` (number, **obrigatório**) — Código do contato no CRM (nCod).
  - `nome` (string, opcional)
  - `sobrenome` (string, opcional)
  - `email` (string, opcional)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_crm_contato_excluir` ⚠️ **destrutiva**

Remove um Contato do CRM. Método Omie: ExcluirContato.

**Parâmetros:**

  - `codigo_contato` (number, **obrigatório**) — Código do contato no CRM (nCod).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_crm_contato_consultar`

Busca os detalhes de um Contato do CRM. Método Omie: ConsultarContato.

**Parâmetros:**

  - `codigo_contato` (number, **obrigatório**) — Código do contato no CRM (nCod).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_crm_contato_listar`

Lista os Contatos do CRM. Método Omie: ListarContatos. Suporta paginação e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_crm_oportunidade_incluir` ⚠️ **destrutiva**

Cria uma nova Oportunidade no funil de vendas do CRM. Método Omie: IncluirOportunidade (recurso 'crm/oportunidades'). Exige conta e contato já cadastrados, mais 'codigo_solucao' (ver omie_crm_solucoes_listar) e 'codigo_origem' (ver omie_crm_origens_listar) — testado ao vivo, ambos obrigatórios mesmo não estando claro assim na doc pública.

**Parâmetros:**

  - `cod_int_oportunidade` (string, **obrigatório**) — Código de integração único que você inventa.
  - `descricao` (string, **obrigatório**) — Descrição da oportunidade.
  - `codigo_conta` (number, **obrigatório**) — Código da conta do CRM (nCodConta).
  - `codigo_contato` (number, **obrigatório**) — Código do contato do CRM (nCodContato).
  - `codigo_solucao` (number, **obrigatório**) — Código da solução/produto ofertado — ver omie_crm_solucoes_listar.
  - `codigo_origem` (number, **obrigatório**) — Código da origem do lead — ver omie_crm_origens_listar.

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_crm_oportunidade_alterar` ⚠️ **destrutiva**

Altera uma Oportunidade já existente. Método Omie: AlterarOportunidade.

**Parâmetros:**

  - `codigo_oportunidade` (number, **obrigatório**) — Código da oportunidade no CRM (nCodOp).
  - `descricao` (string, opcional)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_crm_oportunidade_excluir` ⚠️ **destrutiva**

Remove uma Oportunidade do CRM. Método Omie: ExcluirOportunidade.

**Parâmetros:**

  - `codigo_oportunidade` (number, **obrigatório**) — Código da oportunidade no CRM (nCodOp).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_crm_oportunidade_consultar`

Busca os detalhes de uma Oportunidade do CRM. Método Omie: ConsultarOportunidade.

**Parâmetros:**

  - `codigo_oportunidade` (number, **obrigatório**) — Código da oportunidade no CRM (nCodOp).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_crm_oportunidade_listar`

Lista as Oportunidades do funil de vendas do CRM. Método Omie: ListarOportunidades. Suporta paginação e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_crm_fases_listar`

Lista as fases do funil de vendas do CRM (ex: '01 Prospect'). Método Omie: ListarFases (recurso 'crm/fases').

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_crm_solucoes_listar`

Lista as soluções/produtos cadastrados no CRM, usadas no campo 'codigo_solucao' de omie_crm_oportunidade_incluir. Método Omie: ListarSolucoes (recurso 'crm/solucoes').

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_crm_origens_listar`

Lista as origens de lead cadastradas no CRM, usadas no campo 'codigo_origem' de omie_crm_oportunidade_incluir. Método Omie: ListarOrigens (recurso 'crm/origens').

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

## Cadastros Auxiliares

### `omie_bancos_listar`

Lista os bancos cadastrados na Omie (tabela oficial do Bacen, 1233 registros). Método Omie: ListarBancos (recurso 'geral/bancos'). Suporta paginação, filtro nativo por nome, e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `nome` (string, opcional) — Filtra pelo nome do banco (busca nativa da Omie).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_cidades_listar`

Lista/pesquisa cidades brasileiras (tabela IBGE, 5734 registros). Método Omie: PesquisarCidades (recurso 'geral/cidades'). Suporta paginação, filtro nativo por UF e por nome (contém), e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `uf` (string, opcional) — Filtra por UF (2 letras, ex: 'DF').
  - `contendo` (string, opcional) — Filtra por nome da cidade (contém), ex: 'Brasilia'.
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_paises_listar`

Lista países (tabela com código ISO). Método Omie: ListarPaises (recurso 'geral/paises'). Sem paginação (lista inteira, ~250 países); suporta filtro nativo por código ISO/descrição e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `codigo_iso` (string, opcional) — Filtra pelo código ISO de 2 letras, ex: 'BR'.
  - `descricao` (string, opcional) — Filtra pela descrição do país.
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_ncm_listar`

Lista/pesquisa códigos NCM (tabela oficial da Receita Federal, ~14 mil registros). Método Omie: ListarNCM (recurso 'produtos/ncm'). Suporta paginação, filtro nativo por código (prefixo) e descrição, e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `codigo` (string, opcional) — Filtra por código NCM (formato 9999.99.99).
  - `descricao` (string, opcional) — Filtra pela descrição do NCM.
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_unidade_consultar`

Consulta a descrição de uma unidade de medida pelo código (ex: 'UN', 'KG', 'CX'). Método Omie: ListarUnidades (recurso 'geral/unidade'). Testado ao vivo: diferente das demais listagens, este endpoint exige o código exato (não pagina/lista tudo).

**Parâmetros:**

  - `codigo` (string, **obrigatório**) — Código da unidade de medida, ex: 'UN', 'KG', 'CX'.

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

## Categorias e Departamentos

### `omie_categoria_incluir` ⚠️ **destrutiva**

Cria uma nova categoria financeira, como filha de uma categoria pai já existente. Método Omie: IncluirCategoria (recurso 'geral/categorias'). Testado ao vivo: você informa o código da categoria PAI ('categoria_superior', ex: '2.09') e a Omie GERA e devolve o código da nova categoria filha (ex: '2.09.04') — não é você quem escolhe o código. ⚠️ IMPORTANTE, testado ao vivo: não existe exclusão de categoria na API, e tentar 'inativar' via alterar (campo conta_inativa) não teve efeito real — categorias criadas ficam permanentemente ativas na conta. Confirme antes de criar.

**Parâmetros:**

  - `categoria_superior` (string, **obrigatório**) — Código da categoria PAI (grupo), ex: '2.09'. A Omie gera o código do filho automaticamente (ex: '2.09.04') e devolve na resposta.
  - `descricao` (string, **obrigatório**)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_categoria_alterar` ⚠️ **destrutiva**

Altera a descrição de uma categoria já existente. Método Omie: AlterarCategoria.

**Parâmetros:**

  - `codigo` (string, **obrigatório**) — Código da categoria (ex: '2.09.04').
  - `descricao` (string, opcional)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_categoria_consultar`

Busca os detalhes de uma categoria financeira. Método Omie: ConsultarCategoria.

**Parâmetros:**

  - `codigo` (string, **obrigatório**) — Código da categoria (ex: '2.09.04').

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_categoria_listar`

Lista as categorias financeiras cadastradas (plano de categorias usado em contas a pagar/receber, fluxo de caixa, DRE). Método Omie: ListarCategorias. Suporta paginação e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_departamento_incluir` ⚠️ **destrutiva**

Cria um novo departamento/centro de custo, como filho de um departamento pai já existente. Método Omie: IncluirDepartamento (recurso 'geral/departamentos'). Testado ao vivo: 'codigo_pai' é o código do departamento ONDE incluir o novo (não o código do novo departamento) — a Omie gera e devolve o código do filho na resposta.

**Parâmetros:**

  - `codigo_pai` (string, **obrigatório**) — Código do departamento/centro de custo PAI (onde o novo será incluído) — ver omie_departamento_listar. A Omie gera e devolve o código do novo departamento.
  - `descricao` (string, **obrigatório**)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_departamento_alterar` ⚠️ **destrutiva**

Altera a descrição de um departamento já existente. Método Omie: AlterarDepartamento.

**Parâmetros:**

  - `codigo` (string, **obrigatório**) — Código do departamento (devolvido ao incluir, ou visto no listar).
  - `descricao` (string, opcional)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_departamento_excluir` ⚠️ **destrutiva**

Remove um departamento/centro de custo. Método Omie: ExcluirDepartamento. Diferente de Categoria, testado ao vivo que a exclusão funciona de verdade, sem deixar rastro.

**Parâmetros:**

  - `codigo` (string, **obrigatório**) — Código do departamento.

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_departamento_consultar`

Busca os detalhes de um departamento/centro de custo. Método Omie: ConsultarDepartamento.

**Parâmetros:**

  - `codigo` (string, **obrigatório**) — Código do departamento.

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_departamento_listar`

Lista os departamentos/centros de custo cadastrados (estrutura hierárquica). Método Omie: ListarDepartamentos. Suporta paginação e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

## Características de Produto

### `omie_caracteristica_incluir` ⚠️ **destrutiva**

Cria uma nova característica reutilizável de produto (ex: 'Cor', 'Tamanho'), que depois pode ser associada a produtos. Método Omie: IncluirCaracteristica (recurso 'geral/caracteristicas').

**Parâmetros:**

  - `cod_int_caracteristica` (string, **obrigatório**) — Código de integração único que você inventa.
  - `nome` (string, **obrigatório**) — Nome da característica, ex: 'Cor', 'Tamanho'.
  - `valor_definido` (string, opcional) — 'S' se os valores permitidos são uma lista fechada (ver conteudos_permitidos).
  - `conteudos_permitidos` (array, opcional) — Lista de valores permitidos, se valor_definido='S' (ex: ['Azul', 'Verde', 'Vermelho']).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_caracteristica_alterar` ⚠️ **destrutiva**

Altera uma característica de produto já existente. Método Omie: AlterarCaracteristica.

**Parâmetros:**

  - `codigo_caracteristica` (number, **obrigatório**) — Código da característica na Omie (nCodCaract).
  - `nome` (string, opcional)

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_caracteristica_excluir` ⚠️ **destrutiva**

Remove uma característica de produto. Método Omie: ExcluirCaracteristica. Testado ao vivo: exclusão funciona de verdade, sem deixar rastro.

**Parâmetros:**

  - `codigo_caracteristica` (number, **obrigatório**) — Código da característica na Omie (nCodCaract).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_caracteristica_consultar`

Busca os detalhes de uma característica de produto. Método Omie: ConsultarCaracteristica.

**Parâmetros:**

  - `codigo_caracteristica` (number, **obrigatório**) — Código da característica na Omie (nCodCaract).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_caracteristica_listar`

Lista as características de produto cadastradas. Método Omie: ListarCaracteristicas. Suporta paginação e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

## Nota de Entrada

### `omie_nota_entrada_listar`

Lista as notas de entrada (recebimento físico de mercadoria vinda de compra) já registradas. Método Omie: ListarNotaEnt (recurso 'produtos/notaentrada'). SOMENTE LEITURA — não inclui/altera nota de entrada (é lançamento fiscal/financeiro definitivo, sem round-trip seguro de teste). Suporta paginação, filtro por data de última alteração e o parâmetro genérico 'filtros'.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 50).
  - `data_alteracao_de` (string, opcional) — Filtra por data de última alteração, formato dd/mm/aaaa (não é a data da nota).
  - `data_alteracao_ate` (string, opcional) — Fim do período de alteração, formato dd/mm/aaaa.
  - `filtros` (array, opcional) — Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }].

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_nota_entrada_consultar`

Busca os detalhes completos de uma nota de entrada (itens com CFOP/NCM, valores). Método Omie: ConsultarNotaEnt.

**Parâmetros:**

  - `codigo_nota` (number, **obrigatório**) — Código da nota de entrada na Omie (nCodNotaEnt).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

## Contas a Pagar

### `omie_contas_pagar_listar`

Lista as contas a pagar JÁ com o nome do fornecedor resolvido (a Omie só devolve o código do fornecedor). Retorna: fornecedor (razão social), valor, data de vencimento, status (PAGO/ABERTO/VENCIDO), documento fiscal, categoria e observação. Suporta paginação e filtro por data_alteracao_de/ate (data de última alteração do lançamento, não vencimento — útil pra achar lançamentos recentes). Use em vez de omie_chamar_api para ter os dados legíveis.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 20).
  - `data_alteracao_de` (string, opcional) — Filtra por data de ÚLTIMA ALTERAÇÃO do lançamento, formato DD/MM/AAAA (não é a data de vencimento). Útil pra achar lançamentos criados/atualizados recentemente.
  - `data_alteracao_ate` (string, opcional) — Fim do intervalo de data de última alteração, formato DD/MM/AAAA.

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

## Contas a Receber

### `omie_contas_receber_listar`

Lista as contas a receber JÁ com o nome do cliente resolvido (a Omie só devolve o código do cliente). Retorna: cliente (razão social), valor, data de vencimento, status (PAGO/ABERTO/VENCIDO), documento fiscal, número do pedido e categoria. Suporta paginação e filtro por data_alteracao_de/ate (data de última alteração do lançamento, não vencimento — útil pra achar lançamentos recentes). Use em vez de omie_chamar_api para ter os dados legíveis.

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 20).
  - `data_alteracao_de` (string, opcional) — Filtra por data de ÚLTIMA ALTERAÇÃO do lançamento, formato DD/MM/AAAA (não é a data de vencimento). Útil pra achar lançamentos criados/atualizados recentemente.
  - `data_alteracao_ate` (string, opcional) — Fim do intervalo de data de última alteração, formato DD/MM/AAAA.

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_contas_receber_boleto_gerar` ⚠️ **destrutiva**

Gera o boleto de um título de contas a receber. Método Omie: GerarBoleto (recurso 'financas/contareceberboleto'). Requer que a conta Omie tenha convênio bancário/boleto configurado — sem isso a Omie recusa com erro (ex: 'Não temos suporte para geração da remessa de pagamento para o banco -sem instituição-', testado ao vivo nesta conta).

**Parâmetros:**

  - `codigo_titulo` (number, **obrigatório**) — Código do título de contas a receber na Omie (codigo_lancamento_omie).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_contas_receber_boleto_obter`

Busca o link/dados do boleto já gerado de um título (ou avisa que nenhum foi gerado). Método Omie: ObterBoleto.

**Parâmetros:**

  - `codigo_titulo` (number, **obrigatório**) — Código do título de contas a receber na Omie (codigo_lancamento_omie).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_contas_receber_boleto_prorrogar` ⚠️ **destrutiva**

Prorroga (adia) a data de vencimento de um boleto já gerado. Método Omie: ProrrogarBoleto.

**Parâmetros:**

  - `codigo_titulo` (number, **obrigatório**) — Código do título de contas a receber na Omie.
  - `nova_data_vencimento` (string, **obrigatório**) — Nova data de vencimento, formato dd/mm/aaaa.

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

### `omie_contas_receber_boleto_cancelar` ⚠️ **destrutiva**

Cancela o boleto gerado de um título. Método Omie: CancelarBoleto.

**Parâmetros:**

  - `codigo_titulo` (number, **obrigatório**) — Código do título de contas a receber na Omie (codigo_lancamento_omie).

**Tipo:** use-case (lógica própria, pode combinar mais de uma chamada Omie)

---

**Total:** 116 ferramentas, sendo 51 marcadas como destrutivas (incluem/alteram/excluem dado na Omie) + a ferramenta genérica `omie_chamar_api`, que pode chamar qualquer método (incluindo destrutivos — detectados por prefixo do nome do método: Incluir/Alterar/Excluir/Cancelar/Deletar, ver `src/httpServer.ts`).

## Limitações gerais (valem para todas as ferramentas)

- **Rate limit da Omie**: a API tem limite de chamadas por segundo/minuto por App Key — ver seção "Rate limit da Omie" no `README.md` para o mecanismo de proteção do MCP.
- **Rate limit da API HTTP local**: 120 requisições/minuto por processo — ver `docs/SEGURANCA.md`.
- **Confirmação obrigatória em destrutivas** (via API HTTP): `"confirmar": true` no payload, senão `400` — ver `docs/SEGURANCA.md`.
- **Campos obrigatórios divergentes da doc pública Omie**: vários módulos descobriram, testando ao vivo, campos que a doc da Omie marca como opcionais mas que a API recusa sem eles (ex: `codigo_local_estoque` em OP, `intMalha` em Estrutura, `codigo` em Produto). Ver notas de cada módulo no `README.md`.
- **Nem toda ferramenta tem exclusão real**: Categoria financeira, por exemplo, não tem endpoint de exclusão na API Omie — uma vez criada, fica permanentemente ativa.
- **Produto com movimentação não pode ser excluído**: qualquer ajuste de estoque, pedido ou nota vinculados a um produto bloqueiam a exclusão dele permanentemente, mesmo se o ajuste/pedido for excluído depois.
