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

Exige uma API key: gere uma com `npm run gerar-api-key`, coloque em
`HTTP_API_KEY` no `.env` — o servidor recusa subir sem ela. Toda rota exige o
header `Authorization: Bearer <HTTP_API_KEY>` (retorna 401 sem isso). Ainda só
escuta em `127.0.0.1`; API key é o mínimo pra este estágio (local,
single-user) — não é suficiente sozinha se isso for exposto pra fora um dia.

Duas camadas extra de proteção:
- **Rate limit** — no máximo 120 requisições por minuto (janela fixa); acima
  disso responde `429`.
- **Confirmação em operações destrutivas** — ferramentas que incluem, alteram
  ou excluem dado na Omie (`omie_op_incluir/alterar/excluir`,
  `omie_estoque_ajuste_incluir`, `omie_requisicao_compra_incluir`,
  `omie_pedido_compra_incluir`, e qualquer chamada via `omie_chamar_api` cujo
  `call` comece com `Incluir`/`Alterar`/`Excluir`/`Cancelar`/`Deletar`) exigem
  `"confirmar": true` no payload, senão respondem `400` — evita chamada
  destrutiva acidental (script com bug, loop, etc.).

```bash
npm run gerar-api-key  # gera a chave e mostra a linha pra colar no .env
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
curl -H "Authorization: Bearer $HTTP_API_KEY" http://127.0.0.1:3939/tools/omie_fluxo_caixa_gerar/schema

# chamar direto pela URL (também funciona colado na barra do navegador)
curl -H "Authorization: Bearer $HTTP_API_KEY" "http://127.0.0.1:3939/tools/omie_familias_listar?pagina=1&registros_por_pagina=5"

# chamar via POST (corpo JSON)
curl -H "Authorization: Bearer $HTTP_API_KEY" -X POST http://127.0.0.1:3939/tools/omie_fluxo_caixa_gerar \
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
    contasPagar/                    # módulo em camadas (resolve nome do fornecedor via clientesFornecedores)
      application/
        use-cases/
        dto/
      infrastructure/
        gateways/
      presentation/
        mcp/
      contasPagar-register.ts
      index.ts
    contasReceber/                  # módulo em camadas (resolve nome do cliente via clientesFornecedores)
      application/
        use-cases/
        dto/
      infrastructure/
        gateways/
      presentation/
        mcp/
      contasReceber-register.ts
      index.ts
```

> Módulos em camadas podem depender do gateway de outro módulo quando o relatório
> cruza dois domínios (ex: `produtos` usa o `EstoqueOmieGateway` de `estoque` para
> calcular valor em estoque por produto; `ordemProducao` usa o `ProdutosOmieGateway` de
> `produtos` para resolver a descrição das OPs) — é uma dependência explícita entre
> módulos, não duplicação de código de acesso à Omie.

## Ferramentas disponíveis

> **Filtro genérico (`filtros`):** várias ferramentas de listagem "enriquecida" (que já resolvem
> nome de cliente/produto etc.) aceitam um parâmetro opcional `filtros`: lista de critérios
> `{ campo, operador, valor }` aplicada sobre QUALQUER campo do resultado, mesmo os que a Omie
> não filtra nativamente (`src/shared/filtro.ts`). Operadores: `igual`, `diferente`, `contem`
> (ignora maiúsculas/acentos), `maior_que`, `menor_que`, `entre` (`valor: [min, max]`). Suporta
> campo aninhado via dot-path (ex: `cliente.razaoSocial`). Todos os critérios precisam bater
> (AND). Complementa, não substitui, os filtros nativos de cada endpoint (família, etapa, data
> etc.), que continuam preferíveis quando existem — rodam no servidor da Omie, sem precisar
> paginar tudo antes de filtrar.

### Ordem de Produção (`src/modules/ordemProducao/`)
- `omie_op_incluir` / `omie_op_alterar` / `omie_op_excluir` / `omie_op_consultar` — **use-case**
  (as 3 primeiras destrutivas), CRUD sobre `IOrdemProducaoGateway`, testável via `OpFakeGateway`
  sem tocar na Omie real. **Atenção:** validado ao vivo (round-trip completo com produto/insumo/
  estrutura descartáveis) que o produto só aceita OP se já tiver estrutura (BOM) preenchida, e
  que `codigo_local_estoque` é obrigatório mesmo na inclusão simples (0 = local padrão), apesar
  da doc pública da Omie marcar como opcional
- `omie_op_listar` — passthrough, lista OPs cruas (produto só como código, etapa como código cru)
- `omie_op_listar_com_produto` — **use-case**: lista OPs já com a descrição/SKU do produto
  resolvidos (reaproveita o `ProdutosOmieGateway` do módulo `produtos`) e o campo `concluida`
  (true/false, confiável) além do `etapaCodigo` cru
> A etapa (`cEtapa`) de uma OP é um código de kanban **configurável por conta** (3 a 6 fases,
> nomes definidos pelo próprio usuário na Omie) e a API não tem endpoint pra traduzir o código
> pro nome da fase — por isso as ferramentas não tentam interpretá-lo, só expõem o campo
> `concluida` (derivado de `cConcluida`, esse sim confiável) e o código cru pra quem já souber o
> significado das etapas da própria conta.

### Produtos (`src/modules/produtos/`)
- `omie_produtos_consultar` — passthrough, cadastro de um produto específico
- `omie_produtos_listar` — passthrough, lista produtos (campo `quantidade_estoque` NÃO confiável,
  vem sempre 0). Aceita `filtrar_apenas_familia` (código da família, achado testando o WSDL — não
  documentado na página de ajuda) pra restringir a uma família de produtos. Também aceita
  `filtrar_apenas_descricao` (`"%texto%"` = contém, `"texto%"` = começa com, etc.) pra buscar por
  nome sem paginar tudo
- `omie_produtos_incluir` / `omie_produtos_alterar` / `omie_produtos_excluir` — **use-case**
  (destrutivas), seguindo o mesmo padrão gateway+interface+fake+teste dos demais métodos do
  módulo (`IProdutosGateway.incluirProduto/alterarProduto/excluirProduto`) — testável via
  `ProdutosFakeGateway` sem tocar na Omie real. **Atenção:** validado ao vivo (round-trip
  criar→alterar→excluir) que `codigo` (SKU) é obrigatório em `IncluirProduto`, mesmo a doc
  pública da Omie marcando como opcional
- `omie_familias_listar` — passthrough, famílias de produtos
- `omie_produtos_listar_com_estoque` — **use-case**: lista produtos já com quantidade e valor em
  estoque calculados (venda e custo médio), cruzando o cadastro de produtos com a posição de
  estoque em todos os locais (reaproveita o `EstoqueOmieGateway` do módulo `estoque`). Também
  aceita `filtrar_apenas_familia` — filtra por família e já vem com o estoque calculado numa
  chamada só

### Estrutura de Produtos (`src/modules/estrutura/`)
- `omie_estrutura_listar` — **use-case**: lista os produtos que têm estrutura (BOM/ficha técnica)
  cadastrada, já com nome do produto e de cada insumo (a Omie devolve isso pronto em
  `ListarEstruturas`, recurso `geral/malha` — não precisa cruzar com o cadastro de produtos)
- `omie_estrutura_buscar_por_produto` — **use-case**: acha a estrutura de um produto pelo nome/
  descrição (ou trecho dela) ou código, sem precisar saber o código interno da Omie de antemão —
  ex: "qual a estrutura do produto 100kg". Pagina `ListarEstruturas` inteiro e filtra client-side
  (a Omie não tem busca por texto nesse endpoint)
- `omie_estrutura_incluir` / `omie_estrutura_alterar` / `omie_estrutura_excluir` — **use-case**
  (destrutivas), CRUD de itens da estrutura (`IEstruturaGateway.incluirItensEstrutura/
  alterarItensEstrutura/excluirItemEstrutura`), testável via `EstruturaFakeGateway` sem tocar na
  Omie real. **Atenção:** validado ao vivo (round-trip incluir→alterar→excluir num produto de
  teste descartável) que o produto pai precisa ser tipo '03 - Produto em Processo' ou '04 -
  Produto Acabado`, que `intMalha` é obrigatório em `IncluirEstrutura` (a doc pública marca como
  opcional) e que `AlterarEstrutura`/`ExcluirEstrutura` exigem `idProdMalha` junto do `idMalha`

### Estoque (`src/modules/estoque/`)
- `omie_estoque_ajuste_incluir` / `omie_estoque_ajuste_excluir` — **use-case** (destrutivas),
  CRUD de ajuste sobre `IEstoqueGateway.incluirAjuste/excluirAjuste`, testável via
  `EstoqueFakeGateway` sem tocar na Omie real. **Atenção, achado ao vivo importante:** o campo
  `motivo` só aceita `'INI'`/`'INV'`/`'OPE'`/`'PDV'` (não documentado na doc pública, só aparece
  no erro de validação da Omie); e depois de QUALQUER ajuste de estoque num produto, esse
  produto **nunca mais pode ser excluído** — a Omie mantém um "Movimento de Estoque
  (calculado)" permanente vinculado a ele, mesmo se o ajuste em si for excluído depois.
- `omie_estoque_movimentos_listar` — passthrough, lista movimentos por período
- `omie_estoque_total_produto` — **use-case**: soma o estoque físico de um produto em
  todos os locais de estoque, já que a Omie só expõe posição por local

> `omie_estoque_consultar` (`ConsultarEstoque`) foi removida: testamos e o método não
> existe na API Omie atual (retorna `Method "ConsultarEstoque" not exists`).

### Pedido de Venda (`src/modules/pedidoVenda/`)
- `omie_pedido_venda_consultar` / `omie_pedido_venda_incluir` / `omie_pedido_venda_alterar` /
  `omie_pedido_venda_excluir` — **use-case** (as 3 últimas destrutivas), CRUD sobre
  `IPedidoVendaGateway`, testável via `PedidoVendaFakeGateway` sem tocar na Omie real.
  **Atenção:** validado ao vivo (round-trip completo com cliente/produto descartáveis) que o
  cliente precisa ter UF preenchida no cadastro (senão a Omie recusa o pedido) e que
  `codigo_categoria`/`codigo_conta_corrente` são obrigatórios mesmo num pedido simples
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
- `omie_clientes_incluir` / `omie_clientes_alterar` / `omie_clientes_excluir` — **use-case**
  (destrutivas), CRUD sobre `IClientesGateway.incluirCliente/alterarCliente/excluirCliente`,
  testável via `ClientesFakeGateway` sem tocar na Omie real. **Atenção:** validado ao vivo
  (round-trip criar→alterar→excluir) que `codigo_cliente_integracao` é obrigatório em
  `IncluirCliente`, mesmo a doc pública da Omie marcando como opcional

> **Escopo atual: só leitura (consulta/listagem).** A pedido do usuário, o CRUD completo (incluir,
> alterar, excluir) de clientes/fornecedores fica pra depois — só depois que o MCP tiver segurança
> mínima implantada (ver seção de rate limit/segurança e `src/httpServer.ts`).

### Contas Correntes (`src/modules/contasCorrentes/`)
- `omie_contas_correntes_listar` — passthrough, lista contas correntes (bancos, caixas, cartões,
  maquininhas) com código, descrição, banco, tipo e saldo inicial registrado
- `omie_extrato_conta_corrente_consultar` — **use-case**: extrato de uma conta corrente num
  período (movimentos com data/descrição/valor/categoria/situação de conciliação, e saldos
  anterior/atual/conciliado/disponível). Método Omie: `ListarExtrato` (recurso `financas/extrato`),
  testável via `ContasCorrentesFakeGateway` sem tocar na Omie real. Suporta o parâmetro genérico
  `filtros` sobre os movimentos (ex: natureza, categoria). Validado ao vivo contra a conta real.

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

### Contas a Pagar (`src/modules/contasPagar/`)
- `omie_contas_pagar_listar` — **use-case**: lista lançamentos de `financas/contapagar`
  (`ListarContasPagar`) já com o **nome do fornecedor resolvido** (reaproveita o
  `ClientesOmieGateway` do módulo `clientesFornecedores` — a Omie só devolve o código), valor,
  data de vencimento, status (PAGO/ABERTO/VENCIDO), documento fiscal, categoria e observação.
  Paginado, com filtro opcional `data_alteracao_de`/`data_alteracao_ate`.

### Contas a Receber (`src/modules/contasReceber/`)
- `omie_contas_receber_listar` — **use-case**: lista lançamentos de `financas/contareceber`
  (`ListarContasReceber`) já com o **nome do cliente resolvido** (reaproveita o
  `ClientesOmieGateway` do módulo `clientesFornecedores`), valor, data de vencimento, status
  (PAGO/ABERTO/VENCIDO), documento fiscal, número do pedido e categoria. Paginado, com filtro
  opcional `data_alteracao_de`/`data_alteracao_ate`.
- `omie_contas_receber_boleto_gerar` / `omie_contas_receber_boleto_obter` /
  `omie_contas_receber_boleto_prorrogar` / `omie_contas_receber_boleto_cancelar` — **use-case**
  (gerar/prorrogar/cancelar destrutivas), CRUD de boleto sobre um título de contas a receber
  (`financas/contareceberboleto`: `GerarBoleto`/`ObterBoleto`/`ProrrogarBoleto`/`CancelarBoleto`),
  testável via `ContasReceberFakeGateway` sem tocar na Omie real. **Atenção:** testado ao vivo que
  esta conta Omie não tem convênio bancário/boleto configurado — `ProrrogarBoleto` retorna
  "Não temos suporte para geração da remessa de pagamento para o banco -sem instituição-";
  `GerarBoleto` provavelmente falha pelo mesmo motivo (não testado ao vivo pra não gerar um boleto
  real de um título de cliente de produção). `ObterBoleto`/`CancelarBoleto` foram validados ao
  vivo (devolvem "nenhum boleto gerado" com segurança, sem side-effect).

> **Achado importante testando**: o parâmetro de filtro de data da Omie nesses dois endpoints
> (`filtrar_por_data_de`/`filtrar_por_data_ate`) filtra pela **data de última alteração do
> lançamento** (`info.dAlt`), não pela data de vencimento — confirmado pedindo uma faixa de 1
> dia e comparando com `data_vencimento` dos registros retornados (vencimentos diferentes,
> `dAlt` sempre dentro da faixa pedida). Por isso as ferramentas do MCP expõem o parâmetro como
> `data_alteracao_de`/`data_alteracao_ate` (não `data_vencimento_de/ate`), pra não sugerir um
> comportamento que a API não tem. Não existe (testado) filtro nativo por data de vencimento
> nesses dois endpoints — pra isso, use `omie_fluxo_caixa_gerar`, que usa `financas/mf` e filtra
> corretamente por vencimento/pagamento.

> Diferença pro `omie_fluxo_caixa_gerar`: essas duas ferramentas expõem o lançamento cru
> (fornecedor/cliente por lançamento, sem agregação), úteis pra conferir título por título;
> o fluxo de caixa agrega tudo por período/conta corrente.

### Orçamento de Caixa (`src/modules/orcamentoCaixa/`)
- `omie_orcamento_caixa_consultar` — **use-case**: orçamento de caixa NATIVO da Omie (previsto x
  realizado) por categoria financeira, num mês/ano. Método Omie: `ListarOrcamentos` (recurso
  `financas/caixa`), testável via `OrcamentoCaixaFakeGateway` sem tocar na Omie real. Diferente de
  `omie_fluxo_caixa_gerar` (calculado manualmente a partir de contas a pagar/receber, agrupado por
  conta corrente/dia), este é o relatório pronto da própria Omie, agrupado por categoria (ex:
  "1.01.01 Vendas"). Suporta o parâmetro genérico `filtros`. Validado ao vivo contra a conta real.

### PIX (`src/modules/pix/`)
- `omie_pix_listar` / `omie_pix_obter` / `omie_pix_obter_status` / `omie_pix_gerar` /
  `omie_pix_cancelar` — **use-case** (gerar/cancelar destrutivas), CRUD de PIX sobre títulos de
  contas a receber (`financas/pix`: `ListarPix`/`ObterPix`/`ObterStatusPix`/`GerarPix`/
  `CancelarPix`), testável via `PixFakeGateway` sem tocar na Omie real. Diferente de Boleto, esta
  conta Omie **TEM PIX configurado e ativo** (379 registros reais na base testada) — `Listar`/
  `Obter`/`ObterStatus` validados ao vivo contra a conta real. `Gerar`/`Cancelar` não foram
  testados ao vivo contra título de produção por prudência (gerariam/cancelariam uma cobrança PIX
  de fato, sem round-trip seguro garantido — mesmo cuidado do Boleto).

### Notas Fiscais / NF-e (`src/modules/nfe/`)
- `omie_nfe_listar` / `omie_nfe_consultar` — **use-case**: consulta notas fiscais (NF-e) já
  emitidas/registradas na Omie via `produtos/nfconsultar` (`ListarNF`/`ConsultarNF`), testável via
  `NfeFakeGateway` sem tocar na Omie real. Listagem devolve resumo (número, série, chave, cliente,
  valor, cancelada ou não); consulta traz o detalhe (itens, títulos financeiros gerados pela nota).
  **Módulo deliberadamente SOMENTE LEITURA**: não emite nem cancela NF-e. Pesquisa contra a doc
  oficial não encontrou um endpoint de "emitir NF-e do zero" (tipo `IncluirNFe(itens, cliente)`)
  equivalente ao `IncluirPedidoVenda` — a API trata NF-e majoritariamente como consulta/importação
  de documento já processado pelo motor fiscal do ERP, e nota fiscal emitida é documento com
  efeito legal (sem "excluir e não deixar rastro" como nos demais módulos). Validado ao vivo contra
  a conta real (4765 notas na base de teste).

### Cadastros Auxiliares (`src/modules/cadastrosAuxiliares/`)
- `omie_bancos_listar` / `omie_cidades_listar` / `omie_paises_listar` / `omie_ncm_listar` /
  `omie_unidade_consultar` — **use-case**, tabelas de referência estáticas mantidas pela própria
  Omie (Bacen, IBGE, Receita Federal): bancos (`geral/bancos`), cidades (`geral/cidades`), países
  (`geral/paises`), NCM (`produtos/ncm`) e unidades de medida (`geral/unidade`). Todos só leitura,
  testável via `CadastrosAuxiliaresFakeGateway`. Suportam filtro nativo (nome, UF, código, etc.) e
  o parâmetro genérico `filtros`. **Atenção, achado ao vivo**: `omie_unidade_consultar` exige o
  código exato (não pagina/lista tudo, diferente dos demais) — é consulta pontual, não listagem.
  Validado ao vivo contra a conta real.

### CRM (`src/modules/crm/`)
- `omie_crm_conta_incluir` / `omie_crm_conta_alterar` / `omie_crm_conta_excluir` /
  `omie_crm_conta_consultar` / `omie_crm_conta_listar` — **use-case** (as 3 primeiras destrutivas),
  CRUD de Conta do CRM (`crm/contas` — funil de vendas B2B, diferente do cadastro de Cliente/
  Fornecedor), testável via `ContaFakeGateway` sem tocar na Omie real. **Atenção, achado ao vivo**:
  `IncluirConta`/`AlterarConta` exigem os blocos `endereco` e `telefone_email` inteiros presentes
  (mesmo com poucos campos preenchidos) — a Omie recusa com "Tag [endereco]/[telefone_email] não
  informada!" se o bloco faltar por completo.
- `omie_crm_contato_incluir` / `omie_crm_contato_alterar` / `omie_crm_contato_excluir` /
  `omie_crm_contato_consultar` / `omie_crm_contato_listar` — **use-case** (as 3 primeiras
  destrutivas), CRUD de Contato do CRM (`crm/contatos`), sempre vinculado a uma Conta.
- `omie_crm_oportunidade_incluir` / `omie_crm_oportunidade_alterar` /
  `omie_crm_oportunidade_excluir` / `omie_crm_oportunidade_consultar` /
  `omie_crm_oportunidade_listar` — **use-case** (as 3 primeiras destrutivas), CRUD de Oportunidade
  do funil (`crm/oportunidades`). **Atenção, achado ao vivo**: além de conta e contato, exige
  `codigo_solucao` e `codigo_origem` — cadastros auxiliares que precisam existir antes (a Omie já
  vem com "Solução 01"/"Solução 02" e origens padrão como "Ativo").
- `omie_crm_fases_listar` / `omie_crm_solucoes_listar` / `omie_crm_origens_listar` — **use-case**
  (leitura), cadastros auxiliares do CRM (`crm/fases`, `crm/solucoes`, `crm/origens`) — as duas
  últimas são pré-requisito pra conseguir criar uma Oportunidade.
- Validado ao vivo com round-trip completo e seguro (conta, contato e oportunidade de teste,
  criados e excluídos sem deixar rastro).

> Fora do escopo deste ciclo (não pedido, baixa prioridade): Tarefas (`crm/tarefas`) e
> Características de Conta (`crm/contascaract`) — implementar só quando o usuário precisar.

### Serviços / Ordem de Serviço / NFS-e (`src/modules/servicos/`)
- `omie_servico_incluir` / `omie_servico_alterar` / `omie_servico_excluir` / `omie_servico_consultar` /
  `omie_servico_listar` — **use-case** (as 3 primeiras destrutivas), CRUD do cadastro de serviços
  prestados (`servicos/servico`), testável via `ServicoFakeGateway` sem tocar na Omie real.
  **Atenção, achado ao vivo**: `AlterarCadastroServico` exige o identificador aninhado em
  `intEditar` (não em `cabecalho` como pareceria natural) — a doc pública não deixa isso claro.
- `omie_os_incluir` / `omie_os_alterar` / `omie_os_excluir` / `omie_os_consultar` / `omie_os_listar`
  — **use-case** (as 3 primeiras destrutivas), CRUD de Ordem de Serviço (`servicos/os`), testável
  via `OrdemServicoFakeGateway` sem tocar na Omie real. **Atenção, achados ao vivo importantes:**
  (1) cada item exige `codigo_servico_municipal`/`codigo_servico_lc116` como um código JÁ
  CADASTRADO na tabela LC116 (ver `omie_servicos_lc116_listar`), não texto livre — a Omie recusa
  com "Código da LC116 não cadastrada" senão; (2) `cRetemISS` é obrigatório em cada item mesmo não
  estando marcado como tal na doc pública; (3) cliente do cabeçalho precisa ter UF preenchida
  (mesmo requisito já visto em Pedido de Venda). Validado ao vivo com round-trip completo e seguro
  (cliente de teste descartável, criado e excluído sem deixar rastro).
- `omie_nfse_listar` — **use-case**: lista NFS-e já emitidas (`servicos/nfse`, `ListarNFSEs`),
  testável via `NfseFakeGateway`. **SOMENTE LEITURA** — mesma cautela do módulo NF-e de produto
  (documento fiscal com efeito legal, sem round-trip seguro de emissão).
- `omie_servicos_lc116_listar` — **use-case**: lista os 255 códigos válidos da Lei Complementar 116
  (classificação de serviços), usado pra descobrir o código certo antes de criar uma OS. Método
  Omie: ListarLC116 (recurso `servicos/lc116`).

> Fora do escopo deste ciclo (não pedido, baixa prioridade): Contrato de Serviço recorrente
> (`servicos/contrato`) e faturamento em lote de OS/contrato (`servicos/osp`, `servicos/oslote`,
> `servicos/contratofat`, `servicos/contratolote`) — implementar só quando o usuário precisar.

### Compras (`src/modules/compras/`)
- `omie_pedido_compra_incluir` / `omie_pedido_compra_alterar` / `omie_pedido_compra_excluir` /
  `omie_pedido_compra_consultar` / `omie_pedido_compra_listar` — **use-case** (as 3 primeiras
  destrutivas), CRUD completo sobre `IPedidoCompraGateway` (`produtos/pedidocompra`), testável via
  `PedidoCompraFakeGateway` sem tocar na Omie real. **Atenção, achados ao vivo importantes:**
  (1) `nCodCC` (passado como `codigo_conta_corrente`) exige um código de **conta corrente**
  (`geral/contacorrente`), não de departamento/centro de custo, apesar do nome — a Omie recusa
  com "Conta Corrente não cadastrada" se usar código de departamento; (2) `PesquisarPedCompra`
  (listagem) esconde TODOS os pedidos por padrão — é preciso pedir explicitamente cada situação
  (`lExibirPedidosPendentes`/`Faturados`/`Recebidos`/`Cancelados`/`Encerrados`/`RecParciais`/
  `FatParciais`, tudo `'S'`), o que o gateway já faz sempre; (3) quando a página não tem
  registros a Omie devolve erro (`SOAP-ENV:Client-5113`) em vez de lista vazia — normalizado no
  gateway pra devolver lista vazia.
- `omie_requisicao_compra_incluir` / `omie_requisicao_compra_alterar` /
  `omie_requisicao_compra_excluir` / `omie_requisicao_compra_consultar` /
  `omie_requisicao_compra_listar` — **use-case** (as 3 primeiras destrutivas), CRUD completo sobre
  `IRequisicaoCompraGateway` (`produtos/requisicaocompra`), testável via
  `RequisicaoCompraFakeGateway` sem tocar na Omie real. **Atenção, achado ao vivo importante:**
  diferente de outros endpoints da Omie, os campos de `IncluirReq`/`AlterarReq` vão direto na
  raiz do `param` — não existe o wrapper `requisicaoCadastro: {...}` que a doc pública sugere (a
  Omie recusa com "Tag [REQUISICAOCADASTRO] não faz parte da estrutura").

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
