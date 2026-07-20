# omie-mcp

Servidor MCP (Model Context Protocol) para integração do Claude com a API da [Omie](https://www.omie.com.br/).

Permite que o Claude consulte e execute operações no ERP Omie via ferramentas MCP. Nesta v1, o foco é o módulo **Chão de Fábrica** (Ordens de Produção, Estrutura de Produtos, Estoque e Compras de insumos), com uma ferramenta genérica que já cobre **todos os demais módulos** da Omie (Geral, CRM, Finanças, Vendas/NF-e, Serviços/NFS-e, Painel do Contador).

## Configuração

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env` e preencha com sua App Key e App Secret da Omie (obtidas em https://developer.omie.com.br/my-apps/):
   ```bash
   cp .env.example .env
   ```

3. Compile:
   ```bash
   npm run build
   ```

4. Registre o servidor no seu cliente MCP (ex: Claude Desktop / Claude Code), apontando para `dist/index.js`, com as variáveis de ambiente `OMIE_APP_KEY` e `OMIE_APP_SECRET`.

   Exemplo de configuração (`claude_desktop_config.json` ou equivalente):
   ```json
   {
     "mcpServers": {
       "omie": {
         "command": "node",
         "args": ["/caminho/completo/para/omie-mcp/dist/index.js"],
         "env": {
           "OMIE_APP_KEY": "sua_app_key",
           "OMIE_APP_SECRET": "seu_app_secret"
         }
       }
     }
   }
   ```

## Ferramentas disponíveis

### Chão de Fábrica (módulo dedicado)
- `omie_op_incluir` / `omie_op_alterar` / `omie_op_excluir` / `omie_op_consultar` / `omie_op_listar` — Ordens de Produção
- `omie_estrutura_consultar` — Estrutura de produtos (BOM / ficha técnica)
- `omie_produtos_consultar` / `omie_produtos_listar` — Cadastro de produtos
- `omie_estoque_consultar` / `omie_estoque_ajuste_incluir` / `omie_estoque_movimentos_listar` — Estoque
- `omie_requisicao_compra_incluir` / `omie_pedido_compra_incluir` — Compras de insumos

### Genérica (cobre todos os outros módulos)
- `omie_chamar_api` — recebe `resource` (caminho do módulo), `call` (método) e `param` (parâmetros), permitindo acessar qualquer endpoint listado em https://developer.omie.com.br/service-list/ (clientes, financeiro, CRM, vendas, NF-e, serviços, etc.)

## Próximos passos (roadmap)

- Adicionar ferramentas dedicadas para módulos de alto uso (Financeiro, Vendas/NF-e, CRM) conforme a necessidade.
- Adicionar cache/paginação automática para listagens grandes.
- Adicionar testes automatizados com mocks da API Omie.

## Segurança

Nunca commite o arquivo `.env` nem exponha `OMIE_APP_KEY`/`OMIE_APP_SECRET` em repositórios públicos.
