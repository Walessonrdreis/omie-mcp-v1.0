# Modelo para o frontend

Como transformar o que a Omie devolve no que uma tela precisa. Três perguntas
reais do chão de fábrica, cada uma com a sequência de chamadas, o custo em
requisições e o shape agregado sugerido.

← [Índice](README.md)

## As três receitas

| Receita | A pergunta | Custo com índice quente |
|---|---|---|
| [OPs abertas com o nome do produto](90-receita-ops-abertas.md) | O que está em produção agora, e de qual produto? | 2 requisições |
| [Saldo de insumo para uma OP](90-receita-saldo-insumo.md) | Dá para produzir esta OP com o que tem no estoque? | 1 requisição |
| [Pedidos pendentes de separação](90-receita-separacao.md) | O que separar hoje? | 2 requisições |

Cada requisição custa **no mínimo 300ms** só de espaçamento — ver
[convencoes/request-auth.md](convencoes/request-auth.md). Todo número de custo
desta página é contado em requisições, porque é a única unidade que importa: a
Omie é lenta por protocolo, não por volume de dados.

**"Índice quente"** significa que o catálogo de produtos (2021 registros, 41
requisições ✅) e o catálogo de etapas (1 requisição ✅) já estão em memória ou
em cache. Baixá-los a cada pergunta é o erro que as três receitas evitam.

## O que mudou desde o desenho original

As sessões de coleta derrubaram três premissas que estas receitas carregavam:

1. **A etapa da OP é traduzível** ✅ — `produtos/etapafat`, operação `"28"`. A
   receita 1 não precisa mais exibir código cru. Ver
   [pedido-venda/etapas.md](pedido-venda/etapas.md).
2. **A OP não se calcula pela estrutura** ✅ — `itensDetalhes[].nQtde` já vem
   multiplicada, e os insumos são um retrato do dia da criação. A receita 2
   consulta a OP, não a ficha técnica.
3. **A fila de separação é 58% lixo** ✅ — pedido cancelado mantém a etapa, e
   `cancelado` não é filtrável. O cruzamento em memória da receita 3 é
   obrigatório, não otimização.

## Regras de shape

Valem para qualquer contrato que você exponha ao front, não só para as três
receitas.

### 1. Renomeie para nomes estáveis na borda

O mesmo ID de produto é `codigo_produto`, `idProdMalha`, `nCodProd`,
`nCodProduto` e `nIdProdutoMalha` conforme o recurso ✅. Um front que conhece os
cinco nasceu com dívida.

Traduza uma vez, na borda, para `produtoId`/`produtoSku`/`produtoDescricao` — a
tabela completa está em [glossario/campos.md](glossario/campos.md). A regra
inclui os nomes que *parecem* iguais: `codigo_pedido_integracao` identifica o
pedido e `cCodIntOP` a ordem, não o produto.

### 2. Converta tipos na borda

A Omie fala `"S"`/`"N"` para booleano e `dd/mm/aaaa` para data ✅ — ver
[convencoes/tipos-formatos.md](convencoes/tipos-formatos.md). Nenhum dos dois
deve atravessar o contrato:

| Omie | Contrato |
|---|---|
| `"S"` / `"N"` | `true` / `false` |
| `"14/08/2026"` | `"2026-08-14"` |
| `""` em campo de data | `null` |
| `SOAP-ENV:Client-*` | erro HTTP traduzido — ver [convencoes/erros.md](convencoes/erros.md) |

O caso do `""` é o que mais morde: `dConclusao` vem string vazia em OP não
concluída ✅, e `new Date("")` não dá erro, dá `Invalid Date`.

### 3. Nunca pagine no front

A Omie não tem filtro suficiente para paginação remota honesta. Dois exemplos
desta doc: estoque **não filtra por produto** ✅ e pedido **não filtra por
cancelado** ✅. Quem pagina na origem e filtra depois entrega página com buracos
e total inflado — é exatamente o defeito descrito em
[91-gaps-camada-propria.md](91-gaps-camada-propria.md).

Agregue no servidor, guarde o conjunto completo já filtrado, e pagine em cima
dele. As três receitas devolvem o conjunto inteiro por isso.

### 4. Campo ausente e `0` são coisas diferentes

`quantidade_estoque` vem `0` em todo produto ✅ e significa "não sei", não "zero
unidades". Um insumo que não aparece na varredura de estoque também não é zero:
pode estar em outro local ✅.

Modele os três estados de forma explícita — valor, zero e desconhecido — em vez
de deixar o `0` fazer os três papéis. É para isso que a coluna **"Sempre vem?"**
existe em cada `campos.md`.

### 5. Devolva sempre o código junto do nome

Etapa, local de estoque e status têm nome legível que **muda por conta** ✅. O
contrato leva os dois: `etapaCodigo` + `etapaNome`, `localId` + `localNome`.

O nome é para o usuário; o código é o que o ERP ecoa, o que sobrevive a uma
renomeação e o que você exibe quando o catálogo em cache ainda não conhece uma
etapa criada ontem.

### 6. Carimbe a idade do dado

Toda resposta agregada carrega `geradoEm`. Quando o dado vem de cache, quem
consome precisa saber se pode confiar — e é o próprio critério que decide se
vale a pena reatualizar. Ver
[91-gaps-camada-propria.md](91-gaps-camada-propria.md).

## Próximo

- [90-receita-ops-abertas.md](90-receita-ops-abertas.md) — a receita mais usada
- [91-gaps-camada-propria.md](91-gaps-camada-propria.md) — quando não chamar a
  Omie direto
- [glossario/campos.md](glossario/campos.md) — a tradução de nomes
