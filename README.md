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

## Arquitetura

Existem **dois formatos de módulo**, escolhidos conforme a necessidade:

- **Passthrough (flat)** — `src/tools/<modulo>.ts`, um array de `ToolDef` que mapeia
  1:1 pra um `resource`+`call` da Omie, sem lógica própria. Use quando a Omie já
  devolve o dado do jeito que o usuário precisa (a maioria dos casos).
- **Módulo em camadas** — `src/modules/<modulo>/`, com `application/use-cases`,
  `infrastructure/gateways` e `presentation/mcp`. Use quando a API da Omie **não**
  entrega o dado pronto — ex: `estoque` não tem "estoque total do produto", só
  posição por local de estoque (paginada); o use-case busca tudo e soma. Nesse
  caso a regra de negócio (paginação, filtro, agregação) não pode viver dentro do
  `OmieClient` (que é genérico) nem da definição da tool (que é só metadado MCP).

Em ambos os formatos, o `ToolDef` (`src/tools/types.ts`) é o contrato comum:
`PassthroughToolDef` (resource/call) ou `UseCaseToolDef` (`execute` customizado).
`src/tools/registry.ts` agrega todos os módulos num único array (`allTools`) e
decide qual caminho seguir; `src/index.ts` só itera esse array e registra cada
ferramenta no servidor MCP — **adicionar um módulo novo não exige alterar
`index.ts`**, só criar o módulo e importá-lo no registry.

```
src/
  omieClient.ts             # cliente HTTP genérico (auth, retries, erros) — nunca tem regra de negócio
  index.ts                   # bootstrap do servidor MCP, registra allTools + genérica
  tools/
    types.ts                 # ToolDef (Passthrough | UseCase), helper defineTool()
    registry.ts               # agrega os módulos e expõe handleToolCall()
    generic.ts                 # ferramenta omie_chamar_api (fallback p/ qualquer endpoint)
    compras.ts                  # passthrough: Requisição e pedido de compra
  modules/
    ordemProducao/                 # módulo em camadas (cruza com produtos/)
      application/
        use-cases/                    # ex: listar OPs já com descrição do produto
        dto/
      infrastructure/
        gateways/
      presentation/
        mcp/
      ordemProducao-register.ts
      index.ts
    estoque/                       # módulo em camadas (tem lógica própria)
      application/
        use-cases/                    # regra de negócio (ex: somar estoque entre locais)
        dto/                            # schemas zod + tipos de entrada/saída do use-case
      infrastructure/
        gateways/                        # isola as chamadas Omie específicas do módulo
      presentation/
        mcp/                              # definição das ToolDefs expostas via MCP
      estoque-register.ts                  # agrega as tools do módulo
      index.ts                              # barrel export
    produtos/                      # módulo em camadas (mesma estrutura, cruza com estoque/)
      application/
        use-cases/                    # ex: listar produtos com quantidade/valor em estoque
        dto/
      infrastructure/
        gateways/
      presentation/
        mcp/
      produtos-register.ts
      index.ts
    pedidoVenda/                   # módulo em camadas
      application/
        use-cases/                    # ex: produtos que precisam ser separados p/ despacho
        dto/
      infrastructure/
        gateways/
      presentation/
        mcp/
      pedidoVenda-register.ts
      index.ts
```

> Módulos em camadas podem depender do gateway de outro módulo quando o relatório
> cruza dois domínios (ex: `produtos` usa o `EstoqueOmieGateway` de `estoque` para
> calcular valor em estoque por produto; `ordemProducao` usa o `ProdutosOmieGateway` de
> `produtos` para resolver a descrição das OPs) — é uma dependência explícita entre
> módulos, não duplicação de código de acesso à Omie.

## Ferramentas disponíveis

### Ordem de Produção (`src/modules/ordemProducao/`)
- `omie_op_incluir` / `omie_op_alterar` / `omie_op_excluir` — passthrough
- `omie_op_consultar` — passthrough, uma OP com os insumos utilizados (produto só como código)
- `omie_op_listar` — passthrough, lista OPs cruas (produto só como código, etapa como código cru)
- `omie_op_listar_com_produto` — **use-case**: lista OPs já com a descrição/SKU do produto
  resolvidos (reaproveita o `ProdutosOmieGateway` do módulo `produtos`) e o campo `concluida`
  (true/false, confiável) além do `etapaCodigo` cru
- `omie_estrutura_consultar` — passthrough, estrutura de produtos (BOM / ficha técnica)

> A etapa (`cEtapa`) de uma OP é um código de kanban **configurável por conta** (3 a 6 fases,
> nomes definidos pelo próprio usuário na Omie) e a API não tem endpoint pra traduzir o código
> pro nome da fase — por isso as ferramentas não tentam interpretá-lo, só expõem o campo
> `concluida` (derivado de `cConcluida`, esse sim confiável) e o código cru pra quem já souber o
> significado das etapas da própria conta.

### Produtos (`src/modules/produtos/`)
- `omie_produtos_consultar` — passthrough, cadastro de um produto específico
- `omie_produtos_listar` — passthrough, lista produtos (campo `quantidade_estoque` NÃO confiável, vem sempre 0)
- `omie_familias_listar` — passthrough, famílias de produtos
- `omie_produtos_listar_com_estoque` — **use-case**: lista produtos já com quantidade e valor em
  estoque calculados (venda e custo médio), cruzando o cadastro de produtos com a posição de
  estoque em todos os locais (reaproveita o `EstoqueOmieGateway` do módulo `estoque`)

### Estoque (`src/modules/estoque/`)
- `omie_estoque_ajuste_incluir` — passthrough, registra ajuste de estoque
- `omie_estoque_movimentos_listar` — passthrough, lista movimentos por período
- `omie_estoque_total_produto` — **use-case**: soma o estoque físico de um produto em
  todos os locais de estoque, já que a Omie só expõe posição por local

> `omie_estoque_consultar` (`ConsultarEstoque`) foi removida: testamos e o método não
> existe na API Omie atual (retorna `Method "ConsultarEstoque" not exists`).

### Pedido de Venda (`src/modules/pedidoVenda/`)
- `omie_pedido_venda_consultar` — passthrough, um pedido específico com todos os itens/impostos
- `omie_pedido_venda_listar` — passthrough, lista pedidos (aceita filtro `etapa` nativo da Omie)
- `omie_pedido_venda_etapas_listar` — passthrough, catálogo de etapas de faturamento (kanban de
  vendas/OS/compras) com código e descrição — ao contrário da etapa de OP, aqui é fixo e documentado
- `omie_pedido_venda_produtos_para_separar` — **use-case**: lista os produtos que precisam ser
  separados do estoque para despacho (pedidos na etapa "Separar Estoque", código `20` por padrão),
  já removendo os cancelados e devolvendo um resumo agregado por produto (quantidade total, em
  quantos pedidos)

> Achado importante testando: pedidos **cancelados não têm a `etapa` resetada pela Omie** — um
> pedido cancelado continua aparecendo como se estivesse em "Separar Estoque" se foi cancelado
> nessa fase. Por isso `omie_pedido_venda_produtos_para_separar` sempre cruza com
> `infoCadastro.cancelado` antes de considerar um pedido como realmente pendente.

### Compras (`src/tools/compras.ts`)
- `omie_requisicao_compra_incluir` / `omie_pedido_compra_incluir`

### Genérica (cobre todos os outros módulos)
- `omie_chamar_api` — recebe `resource` (caminho do módulo), `call` (método) e `param` (parâmetros), permitindo acessar qualquer endpoint listado em https://developer.omie.com.br/service-list/ (clientes, financeiro, CRM, vendas, NF-e, serviços, etc.)

## Adicionando um novo módulo

**Passthrough** (a Omie já devolve o dado pronto):
1. Crie `src/tools/<modulo>.ts` exportando um array de `ToolDef` (use `defineTool()` de `src/tools/types.ts`).
2. Importe e concatene esse array em `allTools`, em `src/tools/registry.ts`.

**Em camadas** (precisa agregar/combinar chamadas Omie — copie `src/modules/estoque/` como referência):
1. `application/use-cases/` — a regra de negócio (recebe um gateway, devolve o resultado já pronto pro usuário).
2. `application/dto/` — schema zod do `param` de entrada e tipo do resultado.
3. `infrastructure/gateways/` — só chamadas Omie (resource/call), sem regra de negócio.
4. `presentation/mcp/` — a `ToolDef` com `execute` instanciando gateway + use-case.
5. `<modulo>-register.ts` + `index.ts` — barrel export do array de tools.
6. Importe o array em `allTools`, em `src/tools/registry.ts`.

Em ambos os casos, `src/index.ts` registra a ferramenta automaticamente — nada muda lá.

## Próximos passos (roadmap)

- Adicionar módulos dedicados para Financeiro, Vendas/NF-e e CRM conforme a necessidade (mesmo padrão de arquivo).
- Adicionar cache/paginação automática para listagens grandes.
- Adicionar testes automatizados com mocks da API Omie.

## Segurança

Nunca commite o arquivo `.env` nem exponha `OMIE_APP_KEY`/`OMIE_APP_SECRET` em repositórios públicos.
