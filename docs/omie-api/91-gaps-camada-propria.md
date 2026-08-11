# Gaps da camada própria

Quando usar o que este repo já construiu, quando chamar a Omie direto, e o que
ainda falta construir.

← [Índice](README.md)

Esta página é sobre **a camada própria**, não sobre a Omie. A distinção importa:
"a Omie não filtra estoque por produto" é uma limitação da API ✅; "o gateway
pede 500 por página quando o teto é 100" é um defeito nosso 🔧. As duas coisas
aparecem aqui, sempre separadas.

## As duas camadas

| Camada | O que é | Dado |
|---|---|---|
| MCP / `httpServer` | A mesma lista de ferramentas (`allTools`) servida por dois transportes: MCP stdio e REST em 127.0.0.1 🔧 (`src/httpServer.ts:11-15`, `src/tools/registry.ts:40-61`) | Ao vivo, uma chamada à Omie por requisição |
| `omie-data` | Cache local em SQLite: Dado Bruto (`raw_*`) → Tradução → View (`view_*`) 🔧 (`packages/omie-data/CONTEXT.md`) | Congelado na última coleta |

Uma ferramenta MCP pode ler das duas: `omie_op_listar_com_produto` lê o cache do
`omie-data`, e `omie_op_atualizar_cache` é quem o reabastece 🔧.

O cache cobre três módulos — produtos, estoque e ordem de produção — mas só dois
têm View pronta: `view_produtos` e `view_ordens_producao` 🔧. Estoque tem
**coleta sem View**, então ainda não responde pergunta nenhuma.

## Tabela de decisão

| Necessidade | MCP / `httpServer` | `omie-data` (cache) | Veredito |
|---|---|---|---|
| Listar produtos | `omie_produtos_listar` — passthrough 🔧 | `view_produtos` 🔧 | **Camada própria.** O catálogo tem 2021 produtos e 41 páginas ✅; relê-lo a cada pergunta é o desperdício mais caro do repo |
| Consultar um produto | `omie_produtos_consultar` — passthrough 🔧 | Consulta local por código 🔧 | **Camada própria** se o campo está na View; **Omie direta** para `caracteristicas`, `variacao` e `componentes_kit`, que só a consulta traz ✅ e a View não guarda |
| Ficha técnica de um produto | `omie_estrutura_buscar_por_produto` — varre a listagem e filtra por texto 🔧 | Sem módulo | **Trabalho novo** — falta usar `ConsultarEstrutura`; ver o gap 2 |
| Posição de estoque de um produto | `omie_estoque_total_produto` — varre 14 páginas por consulta 🔧 | `raw_estoque` coletado, **sem View** 🔧 | **Trabalho novo** — a View de estoque falta, e as duas camadas leem só o local padrão; ver o gap 4 |
| Produtos com quantidade e valor | `omie_produtos_listar_com_estoque` — cruza os dois endpoints 🔧 | `view_produtos` já cruza `raw_produtos` com `raw_estoque` 🔧 | **Camada própria.** A Omie não tem esse cruzamento: `quantidade_estoque` vem sempre `0` ✅ |
| Listar OPs com descrição do produto | `omie_op_listar_com_produto` — lê o cache 🔧 | `view_ordens_producao` 🔧 | **Camada própria.** Sem ela são até 64 requisições ✅ — ver [90-receita-ops-abertas.md](90-receita-ops-abertas.md) |
| Nome da etapa de uma OP | `omie_pedido_venda_etapas_listar` devolve as onze operações 🔧 | Não guarda o nome 🔧 | **Trabalho novo** — o catálogo existe (operação `"28"` ✅), mas nada o cruza com a OP; ver o gap 6 |
| Listar pedidos por etapa | `omie_pedido_venda_listar_com_cliente` — resolve cliente e etapa 🔧 | Sem módulo | **Omie direta.** É dado de fila, muda o dia inteiro |
| Pedidos pendentes de separação | `omie_pedido_venda_separar_estoque_listar` e `omie_pedido_venda_produtos_para_separar` — já descartam os cancelados 🔧 | Sem módulo | **Camada própria**, com a ressalva do gap 5 |

## Por que a camada própria ganha

Três casos em que chamar a Omie direto é ruim, e o motivo é sempre o mesmo:
**a Omie cobra por pergunta, não por dado**.

### 1. Saldo por produto

Não existe filtro por produto em `ListarPosEstoque` ✅. Cada consulta de saldo
de **um** item baixa 1353 posições e descarta 1352; dez produtos viram 140
requisições e mais de 40 segundos ✅.

Um índice local por `nCodProd` resolve em uma leitura de disco. Ver
[estoque/armadilhas.md](estoque/armadilhas.md).

### 2. OP com descrição de produto

A listagem traz `nCodProduto` cru e não há consulta de produtos em lote ✅: a
tela das 63 OPs abertas custa até 64 requisições e ~19 s só de espaçamento.

`omie_op_listar_com_produto` já devolve isso cruzado, do cache, e carimba
`geradoEm`/`idadeMs` na resposta 🔧 — o consumidor decide se o dado é fresco o
bastante. Ver [ordem-producao/armadilhas.md](ordem-producao/armadilhas.md).

### 3. Qualquer tela que releia o mesmo dado

Cada releitura é uma chamada nova, e chamadas próximas demais viram **consumo
redundante** (`SOAP-ENV:Client-6`) mesmo em volume baixo 🔧. O espaçamento
mínimo de 300ms não é opcional — ver [convencoes/erros.md](convencoes/erros.md).

Cache não é otimização aqui: é o que impede a própria API de bloquear você.

### E o caso oposto, que é real

**Quando o dado precisa estar quente, o cache atrapalha.** A etapa de uma OP
muda no chão de fábrica em minutos; um kanban servido de um cache de ontem
mostra a fábrica de ontem.

Nesses casos a Omie direta é a resposta certa, e a decisão fica com quem lê:
`omie_op_listar_com_produto` devolve `idadeMs` justamente para isso, e
`omie_op_atualizar_cache` é caro (~16 páginas, vários segundos) 🔧 — não deve
rodar a cada pergunta.

A mesma lógica vale para pedidos: fila de separação é dado do dia, e é por isso
que ela não tem cache.

## Gaps reais da camada própria

Seis defeitos nossos. Nenhum é limitação da Omie — todos são coisas que a camada
própria poderia absorver e hoje não absorve.

### 1. O gateway de estoque pede 500 por página e recebe 100

`REGISTROS_POR_PAGINA = 500` 🔧 (`estoque-omie-gateway.ts:18`), mas a Omie tem
**teto silencioso de 100** ✅: devolve 100 e recalcula `nTotPaginas` como se você
tivesse pedido 100.

Não quebra — o laço para por `nTotPaginas`. O que quebra é a **estimativa**: quem
lê o código conta 3 requisições e a varredura faz 14.

O `omie-data` já pede 100 🔧 (`collect-estoque.ts:4`). As duas metades do repo
discordam sobre o mesmo endpoint.

### 2. Não existe `ConsultarEstrutura` na camada própria

O gateway de estrutura tem `listarEstruturasPagina`, `incluir`, `alterar` e
`excluir` — e nenhuma consulta por produto 🔧
(`estrutura-omie-gateway.ts:20-62`). Para achar a ficha técnica de um produto,
`buscar_estrutura_por_produto` **pagina a listagem inteira** e filtra por texto,
até 50 páginas de 50 🔧.

A Omie **tem** o método ✅. São 653 estruturas nesta conta, 14 páginas de 50 —
contra **1 chamada** se a chave for conhecida.

O caso de busca por texto continua precisando da varredura (a Omie não tem busca
textual ✅), mas quem já tem o `idProduto` está pagando 14× sem motivo.

### 3. A camada repassa o N+1 de produtos em vez de absorvê-lo

Aqui a limitação **é** da Omie: não existe consulta de produtos em lote ✅.

O gap é não absorver: `consultarProdutosPorCodigo` faz N chamadas com
deduplicação e concorrência 5 🔧 (`produtos-gateway.ts:70-75`). O remédio —
listar e indexar, 41 requisições em vez de 2021 ✅ — já está implementado no
`omie-data` (`view_produtos`), e as ferramentas MCP de produto não o usam.

### 4. O "estoque total do produto" não é total

`listarTodasPosicoes` envia `codigo_local_estoque: 0` 🔧
(`estoque-omie-gateway.ts:36`), e `0` é **o local padrão, não todos os locais**
✅ — a conta tem 15.

Consequência: `omie_estoque_total_produto` devolve `quantidadeFisicaTotal`
somando um local só, e `omie_produtos_listar_com_estoque` calcula valor de
estoque sobre a mesma base parcial. As 284 posições de `Estoque Fábrica` e as 51
de `Insumos Fábrica` ficam de fora ✅.

O `omie-data` tem o mesmo defeito 🔧 (`http-client-real.ts:127`) — apesar de
`raw_estoque` já ser chaveada por `(codigo_produto, codigo_local_estoque)` 🔧,
pronta para receber os outros locais.

> O comentário de `consultar-estoque-total-produto.ts` diz "todos os locais".
> Não é o que o gateway faz. Comentário de código não é evidência — dois outros
> comentários deste repo afirmavam que a etapa da OP era intraduzível e foram
> corrigidos em `d16d305`.

### 5. O filtro de cancelados acontece depois da paginação

`ListarPedidosSepararEstoqueUseCase` remove os cancelados da página **já
devolvida** pela Omie 🔧, mas `totalRegistros` continua sendo o da Omie —
`total_de_registros` da etapa inteira 🔧
(`listar-pedidos-com-cliente.ts:69-74`).

Na etapa `"20"` isso significa `totalRegistros: 60` para uma fila de 25 ✅, e uma
página de 20 que exibe 8. É o defeito descrito em
[90-receita-separacao.md](90-receita-separacao.md): filtrar depois de paginar
produz página com buracos e total inflado.

O conserto é baixar a etapa inteira (cabe numa página de 100 ✅), filtrar, e
paginar em cima do resultado.

### 6. O cache de OP não guarda o nome da etapa

O catálogo existe — `produtos/etapafat`, operação `"28"` ✅, ver
[pedido-venda/etapas.md](pedido-venda/etapas.md) — mas **nada no repo o resolve
para quem consome uma OP**. `omie_op_listar_com_produto` devolve `etapaCodigo`
cru, e o cache não tem `etapaNome` 🔧: quem monta um kanban precisa buscar o
catálogo por fora e cruzar na mão.

O conserto: guardar o catálogo junto do cache de OP (ele muda em semanas, não em
minutos) e enriquecer a View com `etapaNome`, preferindo `cDescricao` e caindo
para `cDescrPadrao`.

> **Parte textual resolvida em 11/08/2026.** Cinco afirmações negavam a
> existência do catálogo — dois comentários de gateway (`d16d305`) e três
> descrições de ferramenta (`2b1cf41`). Todas corrigidas, cache da skill
> regenerado. O que sobra é código, não texto.

## Onde a fronteira fica

Uma regra que resolve a maioria dos casos:

| Pergunta | Camada |
|---|---|
| Sobre **catálogo** (produto, estrutura, local, etapa) | Cache — muda em semanas |
| Sobre **saldo** | Cache com carimbo de idade — muda em horas |
| Sobre **fila** (OP em produção, pedido a separar) | Omie direta — muda em minutos |
| **Escrita** | Sempre Omie direta, e invalide o cache depois |

Quando a camada própria serve cache, ela **sempre** devolve a idade do dado. Uma
resposta agregada sem `geradoEm` obriga quem consome a adivinhar — ver a regra 6
de [90-modelo-frontend.md](90-modelo-frontend.md).

## Próximo

- [90-modelo-frontend.md](90-modelo-frontend.md) — as receitas que esta página
  avalia
- [README.md](README.md) — o índice da doc
