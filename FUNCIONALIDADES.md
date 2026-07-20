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
| Consultar Estrutura de Produto | Mostra a ficha técnica (BOM) de um produto: quais insumos e quantidades compõem ele. |

## Produtos

| Funcionalidade | O que faz |
|---|---|
| Consultar Produto | Busca o cadastro completo de um produto (preço, NCM, família, etc.). |
| Listar Produtos | Lista os produtos cadastrados, com filtros e paginação. |
| Listar Famílias de Produtos | Lista as famílias/categorias de produtos cadastradas. |

## Estoque

| Funcionalidade | O que faz |
|---|---|
| Estoque Total do Produto | Soma quanto você tem de um produto **somando todos os locais de estoque** — a Omie só mostra por local, essa ferramenta já entrega o total pronto. |
| Registrar Ajuste de Estoque | Lança uma movimentação manual (ex: consumo de insumo, entrada de produto acabado). |
| Listar Movimentos de Estoque | Lista as entradas/saídas de um produto em um período. |

## Compras

| Funcionalidade | O que faz |
|---|---|
| Incluir Requisição de Compra | Solicita a compra de insumos para produção. |
| Incluir Pedido de Compra | Registra um pedido de compra de insumos. |

## Qualquer outra coisa da Omie

Além do que está na tabela acima, o Claude também consegue acessar **qualquer outro
módulo da Omie** (clientes, financeiro/contas a pagar e receber, CRM, vendas, NF-e,
serviços/NFS-e, painel do contador, etc.), mesmo sem uma ferramenta dedicada pra
isso ainda. Basta pedir o que você precisa e o Claude descobre o jeito certo de
buscar na Omie.

---

*Se alguma funcionalidade não existir ainda ou não trouxer o dado do jeito que você
precisa, é só pedir — o MCP está em evolução conforme a necessidade do dia a dia.*
