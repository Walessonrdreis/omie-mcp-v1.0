# Como rodar e usar o omie-mcp

Guia de referência rápida — como subir o projeto e chamar cada ferramenta via
`curl`, sem precisar do Claude. Útil quando os tokens do Claude acabarem e
você (ou outro processo) ainda precisar consultar a Omie.

> Para entender a arquitetura do projeto (por que cada módulo existe, o que
> é passthrough vs. camadas), veja o `README.md`. Este arquivo é só "como
> rodar e quais comandos digitar".

---

## 1. Configuração inicial

```bash
npm install
```

Crie o `.env` (copie de `.env.example`) com suas credenciais da Omie:

```
OMIE_APP_KEY=sua_app_key
OMIE_APP_SECRET=seu_app_secret
```

## 2. Rodar como servidor MCP (pro Claude Desktop/Code)

```bash
npm run build       # compila src/ -> dist/
npm run start        # roda dist/index.js (stdio, protocolo MCP)
# ou, sem build, direto do TypeScript:
npm run dev
```

Isso é o que o Claude Desktop/Code chama via `stdio` — não dá pra testar com
`curl` diretamente (é o protocolo MCP, não HTTP). Para testar por `curl`, use
o servidor HTTP local abaixo.

## 3. Rodar o servidor HTTP local (pra usar com curl/Postman/frontend)

```bash
npm run build
npm run start:http     # roda dist/httpServer.js
# ou, sem build:
npm run dev:http
```

Sobe em `http://127.0.0.1:3939` (porta configurável via `HTTP_PORT` no
`.env`). Só aceita conexão da própria máquina, e agora **exige API key**:
gere uma com `npm run gerar-api-key`, cole em `HTTP_API_KEY` no `.env` — o
servidor recusa subir sem ela. Toda rota exige o header
`Authorization: Bearer <HTTP_API_KEY>` (401 sem isso). Pra não repetir em
todo curl, exporte antes: `export HTTP_API_KEY=<sua chave>` (os exemplos
abaixo já usam `$HTTP_API_KEY`).

### Rotas genéricas do servidor HTTP

```bash
# Lista todas as ferramentas disponíveis (nome + descrição)
curl -H "Authorization: Bearer $HTTP_API_KEY" http://127.0.0.1:3939/tools

# Lista todas as ferramentas JÁ com o schema de cada payload
curl -H "Authorization: Bearer $HTTP_API_KEY" "http://127.0.0.1:3939/tools?schema"

# Schema (payload de entrada) de uma ferramenta específica
curl -H "Authorization: Bearer $HTTP_API_KEY" http://127.0.0.1:3939/tools/omie_produtos_listar/schema
```

### Como chamar uma ferramenta

Duas formas — GET (payload na query string, ótimo pra testar no navegador) ou
POST (payload no corpo JSON, melhor pra payloads grandes/aninhados):

```bash
# GET — cada campo do payload vira ?campo=valor (valores JSON: números, bool, arrays)
curl -H "Authorization: Bearer $HTTP_API_KEY" "http://127.0.0.1:3939/tools/omie_produtos_listar?pagina=1&registros_por_pagina=5"

# POST — payload inteiro no corpo, dentro de "param" pra tools normais
curl -H "Authorization: Bearer $HTTP_API_KEY" -X POST http://127.0.0.1:3939/tools/omie_produtos_listar \
  -H "Content-Type: application/json" \
  -d '{"pagina": 1, "registros_por_pagina": 5}'
```

> No POST, o corpo enviado é o próprio `param` da ferramenta (não precisa
> envelopar em `{"param": {...}}` — o servidor já faz isso por você).

---

## 4. Ferramenta genérica — qualquer endpoint da Omie

Cobre qualquer módulo da Omie que ainda não tenha ferramenta dedicada
(CRM, NF-e, serviços/NFS-e, painel do contador, extrato bancário, etc.).
Consulte https://developer.omie.com.br/service-list/ pra descobrir o
`resource` (caminho do módulo) e `call` (nome do método).

```bash
curl -H "Authorization: Bearer $HTTP_API_KEY" -X POST http://127.0.0.1:3939/tools/omie_chamar_api \
  -H "Content-Type: application/json" \
  -d '{
    "resource": "geral/clientes",
    "call": "ListarClientes",
    "param": { "pagina": 1, "registros_por_pagina": 5 }
  }'
```

Campos: `resource` (string, obrigatório), `call` (string, obrigatório),
`param` (objeto, opcional — depende do método da Omie).

---

## 5. Todas as ferramentas dedicadas, por módulo

Todas aceitam POST com body JSON `{"param":...}` no formato acima. Exemplos
abaixo mostram o `param` — para GET, vire cada campo em `?campo=valor`.

### Ordem de Produção (`src/modules/ordemProducao/`)

| Ferramenta | Principais campos de `param` |
|---|---|
| `omie_op_incluir` | `cCodIntOP`, `dDtPrevisao`, `nCodProduto`, `nQtde`, `identificacao`, `itens` (insumos) |
| `omie_op_alterar` | mesmos campos de incluir + identificação da OP a alterar |
| `omie_op_excluir` | `nCodOP` ou `cCodIntOP` |
| `omie_op_consultar` | `nCodOP` ou `cCodIntOP` |
| `omie_op_listar` | `pagina`, `registros_por_pagina`, filtros da Omie |
| `omie_op_listar_com_produto` | `pagina`, `registros_por_pagina`, `apenas_nao_concluidas` (bool) |
| `omie_estrutura_consultar` | `nCodProduto` ou `cCodigo` |

```bash
curl -H "Authorization: Bearer $HTTP_API_KEY" -X POST http://127.0.0.1:3939/tools/omie_op_listar_com_produto \
  -H "Content-Type: application/json" \
  -d '{"pagina": 1, "registros_por_pagina": 10, "apenas_nao_concluidas": true}'
```

### Produtos (`src/modules/produtos/`)

| Ferramenta | Principais campos de `param` |
|---|---|
| `omie_produtos_consultar` | `codigo_produto` ou `codigo` |
| `omie_produtos_listar` | `pagina`, `registros_por_pagina`, `filtrar_apenas_familia` (código da família) |
| `omie_familias_listar` | `pagina`, `registros_por_pagina` |
| `omie_produtos_listar_com_estoque` | `pagina`, `registros_por_pagina`, `apenas_com_estoque` (bool), `filtrar_apenas_familia` |

```bash
curl -H "Authorization: Bearer $HTTP_API_KEY" -X POST http://127.0.0.1:3939/tools/omie_produtos_listar_com_estoque \
  -H "Content-Type: application/json" \
  -d '{"pagina": 1, "registros_por_pagina": 20, "apenas_com_estoque": true}'
```

### Estoque (`src/modules/estoque/`)

| Ferramenta | Principais campos de `param` |
|---|---|
| `omie_estoque_ajuste_incluir` | campos do `IncluirAjusteEstoque` da Omie (código do produto, quantidade, tipo) |
| `omie_estoque_movimentos_listar` | filtros de período/produto da Omie (`ListarMovimentos`, recurso `estoque/movestoque`) |
| `omie_estoque_total_produto` | `codigo_produto` (obrigatório) |

```bash
curl -H "Authorization: Bearer $HTTP_API_KEY" -X POST http://127.0.0.1:3939/tools/omie_estoque_total_produto \
  -H "Content-Type: application/json" \
  -d '{"codigo_produto": 123456789}'
```

### Pedido de Venda (`src/modules/pedidoVenda/`)

| Ferramenta | Principais campos de `param` |
|---|---|
| `omie_pedido_venda_consultar` | `codigo_pedido` ou `numero_pedido` |
| `omie_pedido_venda_listar` | `pagina`, `registros_por_pagina`, `etapa` (código, ex: `"20"`) |
| `omie_pedido_venda_etapas_listar` | (sem filtros obrigatórios) |
| `omie_pedido_venda_produtos_para_separar` | `pagina`, `registros_por_pagina`, `etapa_codigo` (padrão `"20"`) |
| `omie_pedido_venda_listar_com_cliente` | `pagina`, `registros_por_pagina`, `etapa_codigo` (opcional) |
| `omie_pedido_venda_separar_estoque_listar` | `pagina`, `registros_por_pagina`, `incluir_cancelados` (bool) |

```bash
curl -H "Authorization: Bearer $HTTP_API_KEY" -X POST http://127.0.0.1:3939/tools/omie_pedido_venda_separar_estoque_listar \
  -H "Content-Type: application/json" \
  -d '{"pagina": 1, "registros_por_pagina": 20}'
```

### Clientes e Fornecedores (`src/modules/clientesFornecedores/`)

> Cliente e fornecedor são o MESMO cadastro na Omie (`geral/clientes`),
> diferenciados pela tag.

| Ferramenta | Principais campos de `param` |
|---|---|
| `omie_clientes_consultar` | `codigo_cliente_omie` ou `cnpj_cpf` |
| `omie_clientes_listar` | `pagina`, `registros_por_pagina`, `clientesFiltro` (objeto avançado, ex: `{"tags":[{"tag":"Fornecedor"}]}`) |
| `omie_fornecedores_listar` | `pagina`, `registros_por_pagina`, `razao_social`, `nome_fantasia`, `cnpj_cpf`, `apenas_ativos` (bool) |

```bash
curl -H "Authorization: Bearer $HTTP_API_KEY" -X POST http://127.0.0.1:3939/tools/omie_fornecedores_listar \
  -H "Content-Type: application/json" \
  -d '{"pagina": 1, "registros_por_pagina": 20, "apenas_ativos": true}'
```

*(Só consulta/listagem por enquanto — incluir/alterar/excluir cliente ou
fornecedor fica pra depois de reforçar a segurança do MCP.)*

### Contas Correntes (`src/modules/contasCorrentes/`)

| Ferramenta | Principais campos de `param` |
|---|---|
| `omie_contas_correntes_listar` | `pagina`, `registros_por_pagina` |

```bash
curl -H "Authorization: Bearer $HTTP_API_KEY" -X POST http://127.0.0.1:3939/tools/omie_contas_correntes_listar \
  -H "Content-Type: application/json" \
  -d '{"pagina": 1, "registros_por_pagina": 50}'
```

### Fluxo de Caixa (`src/modules/fluxoCaixa/`)

| Campo de `param` | Obrigatório | Descrição |
|---|---|---|
| `data_inicio` | sim | `dd/mm/aaaa` |
| `data_fim` | sim | `dd/mm/aaaa` |
| `agrupamento` | não | `"dia"` (padrão) ou `"mes"` |
| `incluir_previsto` | não | bool, padrão `true` |
| `apenas_favoritas` | não | bool, padrão `true` (restringe às ~10 contas favoritas) |
| `codigos_conta_corrente` | não | array de números (`nCodCC`), sobrepõe `apenas_favoritas` |
| `usar_saldo_real` | não | bool, padrão `false` — aproxima do saldo bancário real |

```bash
curl -H "Authorization: Bearer $HTTP_API_KEY" -X POST http://127.0.0.1:3939/tools/omie_fluxo_caixa_gerar \
  -H "Content-Type: application/json" \
  -d '{
    "data_inicio": "01/07/2026",
    "data_fim": "31/07/2026",
    "agrupamento": "dia",
    "apenas_favoritas": true,
    "usar_saldo_real": true
  }'
```

### Contas a Pagar (`src/modules/contasPagar/`)

| Ferramenta | Principais campos de `param` |
|---|---|
| `omie_contas_pagar_listar` | `pagina`, `registros_por_pagina`, `data_alteracao_de`, `data_alteracao_ate` (`dd/mm/aaaa`) |

> `data_alteracao_de`/`ate` filtra pela **data de última alteração do
> lançamento** (não é a data de vencimento — achado testando a API).

```bash
curl -H "Authorization: Bearer $HTTP_API_KEY" -X POST http://127.0.0.1:3939/tools/omie_contas_pagar_listar \
  -H "Content-Type: application/json" \
  -d '{"pagina": 1, "registros_por_pagina": 20, "data_alteracao_de": "01/07/2026", "data_alteracao_ate": "20/07/2026"}'
```

### Contas a Receber (`src/modules/contasReceber/`)

| Ferramenta | Principais campos de `param` |
|---|---|
| `omie_contas_receber_listar` | `pagina`, `registros_por_pagina`, `data_alteracao_de`, `data_alteracao_ate` (`dd/mm/aaaa`) |

Mesma observação: filtro de data é por última alteração, não vencimento.

```bash
curl -H "Authorization: Bearer $HTTP_API_KEY" -X POST http://127.0.0.1:3939/tools/omie_contas_receber_listar \
  -H "Content-Type: application/json" \
  -d '{"pagina": 1, "registros_por_pagina": 20}'
```

### Compras (`src/tools/compras.ts`)

| Ferramenta | Principais campos de `param` |
|---|---|
| `omie_requisicao_compra_incluir` | campos do `IncluirRequisicaoCompra` da Omie |
| `omie_pedido_compra_incluir` | campos do `IncluirPedidoCompra` da Omie |

---

## 6. Dicas rápidas

- **Descobrir o payload exato de qualquer ferramenta sem abrir o código**:
  `curl -H "Authorization: Bearer $HTTP_API_KEY" http://127.0.0.1:3939/tools/<nome>/schema` — devolve o JSON Schema
  completo (campos, tipos, obrigatórios, descrição).
- **Paginação**: quase toda listagem aceita `pagina` (padrão 1) e
  `registros_por_pagina` (padrão 20, teto real da Omie é ~100/página
  independente do que se peça).
- **Datas**: sempre no formato `dd/mm/aaaa`, como string.
- **Erros**: a resposta HTTP vem com status `502` e `{"erro": "..."}` pra
  erros vindos da Omie (rate limit, parâmetro inválido, etc.), ou `404` pra
  ferramenta inexistente.
- Se não achar uma ferramenta dedicada pra algo, use `omie_chamar_api` (seção
  4) com o `resource`/`call` do https://developer.omie.com.br/service-list/.
