# Funcionalidades do MCP Omie

Lista do que você pode pedir pro Claude fazer, hoje, usando essa integração com a Omie.

## Produção

| Funcionalidade | O que faz |
|---|---|
| Incluir Ordem de Produção | Cria uma nova OP na Omie (produto, quantidade, data prevista, insumos). |
| Alterar Ordem de Produção | Atualiza uma OP já existente. |
| Excluir Ordem de Produção | Remove uma OP. |
| Consultar Ordem de Produção | Busca os detalhes de uma OP específica. |
| Listar Ordens de Produção | Lista as OPs cadastradas, com filtros. |
| Listar Ordens de Produção com Produto | Lista as OPs já com o **nome/código do produto** de cada uma (a Omie só mostra o código bruto na listagem) e se está concluída ou não. |
| Listar Estruturas de Produto | Lista todos os produtos que têm ficha técnica (BOM) cadastrada, já com o nome do produto e de cada insumo/componente. |
| Buscar Estrutura por Produto | Acha a ficha técnica (BOM) de um produto **pelo nome** (ou parte dele) ou código, sem precisar saber o código interno da Omie — ex: "qual a estrutura do produto 100kg". |
| Incluir Item na Estrutura | Adiciona um insumo/componente à ficha técnica de um produto. |
| Alterar Item da Estrutura | Muda a quantidade (ou outros dados) de um insumo já cadastrado na estrutura. |
| Excluir Item da Estrutura | Remove um insumo/componente da ficha técnica de um produto. |

## Produtos

| Funcionalidade | O que faz |
|---|---|
| Consultar Produto | Busca o cadastro completo de um produto (preço, NCM, família, etc.). |
| Listar Produtos | Lista os produtos cadastrados, com filtros e paginação — inclusive **filtrar por família** e **buscar por nome/descrição**. |
| Incluir Produto | Cria um novo produto/serviço no cadastro. |
| Alterar Produto | Atualiza um produto/serviço já cadastrado. |
| Excluir Produto | Remove um produto/serviço do cadastro (a Omie recusa se já tiver movimentação). |
| Listar Famílias de Produtos | Lista as famílias/categorias de produtos cadastradas. |
| Listar Produtos com Valor em Estoque | Lista todos os produtos já com a **quantidade e o valor em estoque calculados** (preço de venda e custo médio), somando todos os locais — sem precisar cruzar cadastro + estoque na mão. Também pode ser **filtrado por família**. |

## Estoque

| Funcionalidade | O que faz |
|---|---|
| Estoque Total do Produto | Soma quanto você tem de um produto **somando todos os locais de estoque** — a Omie só mostra por local, essa ferramenta já entrega o total pronto. |
| Registrar Ajuste de Estoque | Lança uma movimentação manual (ex: consumo de insumo, entrada de produto acabado, correção de inventário). ⚠️ Depois de ajustar o estoque de um produto, ele nunca mais pode ser excluído do cadastro. |
| Excluir Ajuste de Estoque | Reverte um ajuste lançado (não desfaz a restrição de exclusão do produto, ver acima). |
| Listar Movimentos de Estoque | Lista as entradas/saídas de um produto em um período. |

## Pedido de Venda

| Funcionalidade | O que faz |
|---|---|
| Consultar Pedido de Venda | Busca os detalhes completos de um pedido específico. |
| Incluir Pedido de Venda | Cria um novo pedido de venda (cliente, itens, categoria financeira, conta corrente). |
| Alterar Pedido de Venda | Atualiza um pedido de venda já cadastrado. |
| Excluir Pedido de Venda | Remove um pedido de venda (a Omie recusa se já estiver faturado). |
| Listar Pedidos de Venda | Lista os pedidos cadastrados, com filtros. |
| Listar Etapas do Funil de Vendas | Mostra as fases possíveis de um pedido (Pedido de Venda, Separar Estoque, Faturar, Faturado, Entrega). |
| Produtos para Separar (Expedição) | Lista **os produtos que precisam ser separados do estoque agora** para despachar pedidos em aberto, já removendo os cancelados, com um resumo de quanto separar de cada produto e em quantos pedidos ele aparece. |
| Listar Pedidos com Nome do Cliente | Lista os pedidos já com **nome do cliente**, etapa por extenso, valor total, se está cancelado/faturado e **os itens de cada pedido (produto e quantidade)** — sem precisar consultar cliente por cliente ou abrir pedido por pedido na mão. |
| Pedidos em Separar Estoque | Atalho direto pro acompanhamento do dia a dia: já filtra pelos pedidos em "Separar Estoque" e remove os cancelados, trazendo cliente, itens (produto e quantidade) e valor de cada pedido — sem precisar informar a etapa toda vez. |

## Clientes e Fornecedores

> Na Omie, cliente e fornecedor ficam no mesmo cadastro — só muda a "etiqueta" (tag).

| Funcionalidade | O que faz |
|---|---|
| Consultar Cliente/Fornecedor | Busca o cadastro completo de um cliente ou fornecedor específico (razão social, nome fantasia, CNPJ/CPF, contato, endereço). |
| Listar Clientes/Fornecedores | Lista os cadastros, com filtros (por nome, CNPJ, etc.). |
| Listar Fornecedores | Atalho já filtrado só pelos fornecedores, com busca por nome/CNPJ e opção de esconder os inativos. |
| Incluir Cliente/Fornecedor | Cria um novo cliente ou fornecedor no cadastro (a tag define qual). |
| Alterar Cliente/Fornecedor | Atualiza um cliente/fornecedor já cadastrado. |
| Excluir Cliente/Fornecedor | Remove um cliente/fornecedor do cadastro (a Omie recusa se já tiver movimentação). |

## Financeiro

| Funcionalidade | O que faz |
|---|---|
| Listar Contas Correntes | Lista bancos, caixas, cartões e maquininhas cadastrados, com saldo inicial. |
| Listar Contas a Pagar | Lista as contas a pagar já com o **nome do fornecedor** (a Omie só devolve o código), valor, vencimento, status (pago/aberto/vencido), documento fiscal, categoria e observação. Dá pra filtrar por lançamentos alterados/criados num período. |
| Listar Contas a Receber | Lista as contas a receber já com o **nome do cliente** (a Omie só devolve o código), valor, vencimento, status, documento fiscal, número do pedido e categoria. Dá pra filtrar por lançamentos alterados/criados num período. |
| Gerar Fluxo de Caixa | Monta o **fluxo de caixa** (entradas, saídas e saldo) por dia ou por mês e por conta corrente, já separando o que **já aconteceu** (realizado) do que **ainda vai vencer** (previsto) — em formato de tabela, pronto pra virar planilha no futuro. A Omie não tem esse relatório pronto, só lançamento por lançamento; esta ferramenta busca tudo e organiza. Por padrão mostra só as **contas favoritas** (Cartão NuBank, Stone, Banco do Brasil, Wix, iFood, Sicoob, Itaú, Cartão Elo LEANDRO, Amazon, CAIXA LOJA) — dá pra pedir todas as contas ou uma lista específica. Opcionalmente (`usar_saldo_real`), aproxima do **saldo bancário real** usando o saldo configurado no cadastro da conta na Omie — quando alguém atualizar esse saldo lá, o cálculo já reflete automaticamente. |

## Notas Fiscais (NF-e)

> Somente leitura por decisão de projeto: nota fiscal emitida é documento com efeito legal e não
> tem como "testar com segurança" (criar → excluir sem rastro) como os demais módulos. A API da
> Omie também não expõe um jeito simples de emitir NF-e do zero — emissão é resolvida no próprio
> ERP, não aqui.

| Funcionalidade | O que faz |
|---|---|
| Listar Notas Fiscais | Lista as NF-e já emitidas/registradas, com resumo (número, série, chave, cliente, valor, se está cancelada), filtro por período de emissão, status e tipo (entrada/saída). |
| Consultar Nota Fiscal | Busca o detalhe completo de uma nota (pela chave de acesso ou pelo código interno): itens, NCM/CFOP, valores e os títulos financeiros gerados por ela. |

## Compras

| Funcionalidade | O que faz |
|---|---|
| Incluir Pedido de Compra | Cria um novo pedido de compra (fornecedor, itens, previsão de entrega, conta corrente). |
| Alterar Pedido de Compra | Atualiza um pedido de compra já cadastrado. |
| Excluir Pedido de Compra | Remove um pedido de compra. |
| Consultar Pedido de Compra | Busca os detalhes completos de um pedido (itens, quantidade recebida, valores). |
| Listar Pedidos de Compra | Lista os pedidos de compra cadastrados, com filtros. |
| Incluir Requisição de Compra | Solicita a compra de insumos para produção. |
| Alterar Requisição de Compra | Atualiza uma requisição de compra já cadastrada. |
| Excluir Requisição de Compra | Remove uma requisição de compra. |
| Consultar Requisição de Compra | Busca os detalhes de uma requisição específica. |
| Listar Requisições de Compra | Lista as requisições de compra cadastradas, com filtros. |

## Qualquer outra coisa da Omie

Além do que está na tabela acima, o Claude também consegue acessar **qualquer outro
módulo da Omie** (clientes, financeiro/contas a pagar e receber, CRM, vendas, NF-e,
serviços/NFS-e, painel do contador, etc.), mesmo sem uma ferramenta dedicada pra
isso ainda. Basta pedir o que você precisa e o Claude descobre o jeito certo de
buscar na Omie.

---

*Se alguma funcionalidade não existir ainda ou não trouxer o dado do jeito que você
precisa, é só pedir — o MCP está em evolução conforme a necessidade do dia a dia.*
