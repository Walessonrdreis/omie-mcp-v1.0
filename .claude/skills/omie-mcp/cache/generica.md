# Genérica

Chamada genérica pra qualquer endpoint da Omie, quando não existe tool específica.

### `omie_chamar_api`

Chama qualquer endpoint da API da Omie (ERP), permitindo acessar todos os módulos: Geral (clientes, fornecedores, projetos), CRM, Finanças (contas a pagar/receber, extrato), Compras/Estoque/Produção (produtos, estrutura, ordens de produção, estoque), Vendas e NF-e, Serviços e NFS-e, Painel do Contador, entre outros. Use quando não houver uma ferramenta específica (omie_op_*, omie_estrutura_*, etc.) para a operação desejada. Consulte https://developer.omie.com.br/service-list/ para descobrir o 'resource' (caminho do módulo) e o 'call' (nome do método) corretos.

**Parâmetros:**

  - `param` (objeto livre, **obrigatório**) — campos conforme documentação oficial da Omie para este método (não tipado no MCP; a ferramenta repassa o objeto direto).
