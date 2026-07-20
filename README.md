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

## API HTTP local (opcional, pra consumir de um frontend/backend próprio)

Além do servidor MCP (stdio, pro Claude), existe um segundo transporte —
`src/httpServer.ts` — que expõe **as mesmas ferramentas** (`allTools` +
`handleToolCall`, o mesmo registry do MCP) como uma API REST simples, pra
quem quiser montar um frontend ou outro backend consumindo essa lógica sem
falar o protocolo MCP.

```bash
npm run dev:http    # desenvolvimento (tsx)
npm run start:http  # produção (build + node dist/httpServer.js)
```

- `GET /tools` — lista todas as ferramentas disponíveis (nome + descrição). Passe
  `?schema` (ex: `/tools?schema`) pra já vir com o JSON Schema do payload de cada
  uma junto.
- `GET /tools/<nome>/schema` — JSON Schema do payload de UMA ferramenta específica
  (campos, tipos, quais são obrigatórios, descrição de cada um) — útil pra um
  frontend montar o formulário/payload certo sem adivinhar.
- `GET /tools/<nome>?campo=valor&outroCampo=valor` — chama a ferramenta direto
  pela URL (dá pra testar no navegador, sem Postman/curl). Cada valor da query
  string é interpretado como JSON quando possível (`true`, `123`, `"texto"`),
  senão fica como string.
- `POST /tools/<nome>` — chama a ferramenta; o corpo da requisição (JSON) é o
  payload da ferramenta. Preferível pra payloads grandes/aninhados (ex: arrays
  em `codigos_conta_corrente`).

Exemplos:
```bash
# ver o payload esperado por uma ferramenta
curl http://127.0.0.1:3939/tools/omie_fluxo_caixa_gerar/schema

# chamar direto pela URL (também funciona colado na barra do navegador)
curl "http://127.0.0.1:3939/tools/omie_familias_listar?pagina=1&registros_por_pagina=5"

# chamar via POST (corpo JSON)
curl -X POST http://127.0.0.1:3939/tools/omie_fluxo_caixa_gerar \
  -H "Content-Type: application/json" \
  -d '{"data_inicio":"01/07/2026","data_fim":"31/07/2026","agrupamento":"dia"}'
```

> ⚠️ **Só para uso local.** Escuta em `127.0.0.1` (não aceita conexão de fora
> da máquina), sem autenticação, sem validação de origem. **Não expor essa
> porta pra fora da máquina/rede local** antes de adicionar autenticação —
> mesma ressalva de segurança já feita sobre transformar o omie-mcp num
> Connector remoto (ver seção de segurança). A intenção é: usar local agora
> pra desenvolver contra ele, migrar pra um serviço exposto de verdade só
> depois de implementar segurança mínima (auth, validação de entrada).

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
  omieClient.ts             # cliente HTTP genérico (auth, retries, throttle) — nunca tem regra de negócio
  index.ts                   # bootstrap do servidor MCP (stdio), registra allTools + genérica
  httpServer.ts               # bootstrap do servidor HTTP (local, opcional) — mesmo allTools + genérica
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
    clientesFornecedores/           # módulo em camadas (gateway reutilizável por outros módulos)
      infrastructure/
        gateways/
      presentation/
        mcp/
      clientesFornecedores-register.ts
      index.ts
    contasCorrentes/                # módulo em camadas (gateway reutilizável, mesmo padrão de clientesFornecedores)
      infrastructure/
        gateways/
      presentation/
        mcp/
      contasCorrentes-register.ts
      index.ts
    fluxoCaixa/                     # módulo em camadas (cruza com contasCorrentes/)
      application/
        use-cases/                    # agrega lançamentos em fluxo de caixa por dia/mês/conta
        dto/
      infrastructure/
        gateways/
      presentation/
        mcp/
      fluxoCaixa-register.ts
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
- `omie_produtos_listar` — passthrough, lista produtos (campo `quantidade_estoque` NÃO confiável,
  vem sempre 0). Aceita `filtrar_apenas_familia` (código da família, achado testando o WSDL — não
  documentado na página de ajuda) pra restringir a uma família de produtos
- `omie_familias_listar` — passthrough, famílias de produtos
- `omie_produtos_listar_com_estoque` — **use-case**: lista produtos já com quantidade e valor em
  estoque calculados (venda e custo médio), cruzando o cadastro de produtos com a posição de
  estoque em todos os locais (reaproveita o `EstoqueOmieGateway` do módulo `estoque`). Também
  aceita `filtrar_apenas_familia` — filtra por família e já vem com o estoque calculado numa
  chamada só

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
- `omie_pedido_venda_listar_com_cliente` — **use-case**: lista pedidos já com o nome do cliente
  (reaproveita o `ClientesOmieGateway` do módulo `clientesFornecedores`), a etapa por extenso e os **itens do
  pedido** (produto/SKU/descrição/quantidade/unidade) resolvidos, `cancelado`/`faturado` como
  booleano e o valor total do pedido. Filtro `etapa_codigo` opcional (sem ele, traz todas as
  etapas — **não** filtra cancelados por padrão, diferente da tool acima)
- `omie_pedido_venda_separar_estoque_listar` — **use-case**: atalho pro relatório mais acompanhado
  no dia a dia — mesmo formato de `omie_pedido_venda_listar_com_cliente`, mas com `etapa_codigo`
  fixo em "Separar Estoque" e cancelados **removidos por padrão** (parâmetro `incluir_cancelados`
  pra ver também os cancelados). Internamente reaproveita `ListarPedidosComClienteUseCase`.

> Achado importante testando: pedidos **cancelados não têm a `etapa` resetada pela Omie** — um
> pedido cancelado continua aparecendo como se estivesse em "Separar Estoque" se foi cancelado
> nessa fase. Por isso `omie_pedido_venda_produtos_para_separar` sempre cruza com
> `infoCadastro.cancelado` antes de considerar um pedido como realmente pendente; já
> `omie_pedido_venda_listar_com_cliente` é uma listagem genérica e expõe `cancelado` pra quem
> chamar decidir o que fazer com isso.

### Clientes e Fornecedores (`src/modules/clientesFornecedores/`)
> Na Omie, cliente e fornecedor são o MESMO cadastro (`geral/clientes`), diferenciados só pela
> `tag` (`Cliente`, `Fornecedor`, `Colaborador`, `Sócios`, podendo ter mais de uma) — não existe
> endpoint `geral/fornecedores` separado.

- `omie_clientes_consultar` — passthrough, um cliente/fornecedor específico (razão social, nome
  fantasia, CNPJ/CPF, contato, endereço, tags)
- `omie_clientes_listar` — passthrough, lista clientes/fornecedores; aceita filtro avançado via
  `clientesFiltro` (ex: `{"tags": [{"tag": "Fornecedor"}]}`)
- `omie_fornecedores_listar` — **use-case leve**: atalho pra `omie_clientes_listar` já filtrado
  pela tag `Fornecedor`, com busca por razão social/nome fantasia/CNPJ-CPF e `apenas_ativos`
  (remove inativos client-side, já que o filtro `clientesFiltro.tags` não combina com filtro de
  status na mesma chamada de forma direta)

> **Escopo atual: só leitura (consulta/listagem).** A pedido do usuário, o CRUD completo (incluir,
> alterar, excluir) de clientes/fornecedores fica pra depois — só depois que o MCP tiver segurança
> mínima implantada (ver seção de rate limit/segurança e `src/httpServer.ts`).

### Contas Correntes (`src/modules/contasCorrentes/`)
- `omie_contas_correntes_listar` — passthrough, lista contas correntes (bancos, caixas, cartões,
  maquininhas) com código, descrição, banco, tipo e saldo inicial registrado

### Fluxo de Caixa (`src/modules/fluxoCaixa/`)
- `omie_fluxo_caixa_gerar` — **use-case**: monta o fluxo de caixa (entradas, saídas, saldo do
  período e acumulado) num formato tabular, agrupado por dia ou mês e por conta corrente. A Omie
  não tem esse relatório pronto — só `financas/mf` `ListarMovimentos`, lançamento por lançamento de
  contas a pagar/receber, paginado a 100/vez — então esta ferramenta busca todos os lançamentos do
  período, separa **realizado** (já pago/recebido, pela data de pagamento) de **previsto** (em
  aberto, ainda não liquidado, pela data de vencimento, excluindo cancelados) e agrega tudo,
  resolvendo o nome da conta corrente (reaproveita `ContasCorrentesOmieGateway`, do módulo
  `contasCorrentes`). Formato pensado pra já poder ser exportado como planilha no futuro. Por
  padrão (`apenas_favoritas: true`) restringe às **contas favoritas** definidas pelo usuário
  (`src/modules/fluxoCaixa/application/contas-favoritas.ts`: Cartão NuBank, Stone, Banco do
  Brasil, Wix, iFood, Sicoob, Itaú, Cartão Elo LEANDRO, Amazon, CAIXA LOJA — as ~39 demais contas
  cadastradas na Omie, ex: cartões antigos e adquirentes específicas, ficam de fora); use
  `apenas_favoritas: false` pra ver todas as contas, ou `codigos_conta_corrente` pra uma lista
  customizada.

> **Saldo real (opcional, `usar_saldo_real: true`)**: por padrão o saldo acumulado é só a variação
> líquida **dentro do período consultado**, não o saldo bancário real — a Omie não expõe histórico
> de saldo diário por conta via API. Com `usar_saldo_real: true`, a ferramenta ancora o cálculo no
> `saldo_inicial`/`saldo_data` que estiver cadastrado em cada conta corrente (via
> `omie_contas_correntes_listar`): soma os lançamentos realizados entre a `saldo_data` e o início
> do período pedido, chegando num `saldoRealAcumulado` próximo do saldo bancário real — não é um
> valor hardcoded no MCP, é lido do cadastro Omie, então quando alguém configurar o saldo real de
> cada conta lá (ex: em 01/01), o cálculo já passa a refletir isso automaticamente, sem mexer no
> código. Contas sem `saldo_data`/`saldo_inicial` configurados (ou com `saldo_data` posterior ao
> início do período) recebem `saldoRealAcumulado: null` em vez de um número inventado. Buscar esse
> offset dispara uma chamada extra (movimentos entre a `saldo_data` mais antiga entre as contas e o
> início do período) — pode ser lento se a `saldo_data` estiver muito no passado.
>
> **Achado importante testando**: a Omie rejeita **duas chamadas concorrentes do mesmo método**
> (erro "Já existe uma requisição desse método sendo executada"), mesmo com parâmetros diferentes —
> por isso os passes de realizado/previsto (ambos usam `ListarMovimentos`) rodam em sequência, não
> em paralelo, dentro do use-case. É uma restrição adicional ao rate limit já documentado na seção
> abaixo, específica pra chamadas concorrentes do mesmo `call`.
>
> Períodos longos geram muitas páginas (ex: só os recebimentos de ~3 semanas já passaram de 3.700
> registros) — prefira períodos de até ~3 meses por chamada.

### Compras (`src/tools/compras.ts`)
- `omie_requisicao_compra_incluir` / `omie_pedido_compra_incluir`

### Genérica (cobre todos os outros módulos)
- `omie_chamar_api` — recebe `resource` (caminho do módulo), `call` (método) e `param` (parâmetros), permitindo acessar qualquer endpoint listado em https://developer.omie.com.br/service-list/ (clientes, financeiro, CRM, vendas, NF-e, serviços, etc.)

## Rate limit da Omie — como o MCP se protege

A Omie bloqueia rajadas de chamadas de duas formas: **"consumo indevido"** (rate
limit propriamente dito) e **"consumo redundante"** (chamadas muito parecidas em
sequência rápida — já aconteceu na prática ao consultar ~20 clientes em paralelo
pra montar um relatório de pedidos). A proteção é **centralizada no
`OmieClient`** (`src/omieClient.ts`), então todo módulo se beneficia automaticamente,
sem precisar reimplementar nada:

- **Throttle** — toda chamada respeita um espaçamento mínimo (300ms) desde a
  chamada anterior feita pela mesma instância de `OmieClient`, mesmo que várias
  cheguem ao mesmo tempo (`Promise.all`, `mapWithConcurrency`, etc.). Isso reduz
  a chance de cair em "consumo redundante" antes mesmo de precisar de retry.
- **Retry com espera correta** — se a Omie ainda assim bloquear, o `OmieClient`
  tenta de novo (até 4 vezes), respeitando o tempo que a própria Omie sugere na
  mensagem de erro (ex: "Aguarde 57 segundos") em vez de um backoff fixo curto.
- **`mapWithConcurrency`** (`src/shared/concurrency.ts`) — usado por gateways que
  buscam vários registros por código em lote (`ProdutosOmieGateway.consultarProdutosPorCodigo`,
  `ClientesOmieGateway.consultarClientesPorCodigo`), limita a concorrência do
  próprio código a 5 chamadas simultâneas, complementando o throttle do cliente.

**Regra pra módulos novos:**
1. Nunca chamar `Promise.all`/`Promise.allSettled` num array de códigos sem limite
   de concorrência — sempre usar `mapWithConcurrency`.
2. **Nunca rodar duas chamadas do MESMO método (`call`) em paralelo**, mesmo com
   parâmetros diferentes — a Omie rejeita com "Já existe uma requisição desse
   método sendo executada" (achado ao construir `fluxoCaixa`, que precisa de dois
   passes de `ListarMovimentos`). Rode em sequência (`await` um, depois o outro).
3. Chamadas paralelas de métodos **diferentes** (ex: buscar produtos e estoque ao
   mesmo tempo) são seguras e não precisam de nada disso, o throttle do cliente já cobre.

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
