# Receita 1 — OPs abertas com o nome do produto

**A pergunta:** o que está em produção agora, de qual produto, e em que etapa?

← [Modelo para o frontend](90-modelo-frontend.md) · [Índice](README.md)

É a tela de chão de fábrica mais pedida, e a que mais se degrada quando montada
ingenuamente: a listagem de OPs traz `nCodProduto` cru e `cEtapa` cru ✅, e
nenhum dos dois é legível.

## A sequência

| # | Chamada | Recurso | Param | Devolve |
|---|---|---|---|---|
| 1 | `ListarOrdemProducao` | `produtos/op` | `pagina: 1`, `registros_por_pagina: 100`, `cConcluida: "N"` | 63 OPs abertas ✅ |
| 2 | `ListarEtapasFaturamento` | `produtos/etapafat` | `pagina: 1`, `registros_por_pagina: 50` | catálogo inteiro; use a operação `"28"` ✅ |
| 3 | `ListarProdutos` × 41 | `geral/produtos` | `registros_por_pagina: 50`, os dois flags `"N"` | catálogo indexado por `codigo_produto` ✅ |

Os passos 2 e 3 são **catálogo**: baixe uma vez por sessão e reaproveite. O
passo 1 é o único que precisa estar quente.

### Duas correções em relação ao desenho original

O desenho desta receita mandava varrer todas as OPs e consultar produto a
produto. As duas coisas estão erradas:

1. **`cConcluida: "N"` particiona a base** ✅ — 63 abertas contra 1659
   concluídas. A pergunta cabe em **uma** requisição, não em 18. Ver
   [ordem-producao/leitura-filtros.md](ordem-producao/leitura-filtros.md).
2. **A etapa é traduzível** ✅ — o catálogo está em `produtos/etapafat`,
   operação `"28"`. Esta conta renomeou quatro das seis etapas ("FABRICA",
   "LOJA", "PEDIDOS GRANDES", "Embalado"), e é `cDescricao` que entrega esses
   nomes. Ver [pedido-venda/etapas.md](pedido-venda/etapas.md).

## O custo

| Caminho | Requisições | Espera mínima |
|---|---|---|
| Ingênuo: varrer tudo + `ConsultarProduto` por OP | 18 + até 63 = **81** | ~24 s |
| Esta receita, catálogos frios | 1 + 1 + 41 = **43** | ~13 s |
| Esta receita, catálogos quentes | **2** | ~0,6 s |

O salto de 43 para 2 é todo do índice de produtos. Ele vale a partir de ~40
produtos distintos ✅ e serve estoque e estrutura ao mesmo tempo — ver
[produtos/leitura.md](produtos/leitura.md).

Não existe `ConsultarProdutos` em lote ✅: consultar produto a produto é sempre
o caminho caro, e é ele que a inversão evita.

## O shape agregado

Estrutura sugerida; os valores são ilustrativos, exceto os códigos de etapa e de
local, que são os desta conta ✅.

```json
{
  "geradoEm": "2026-08-10T21:00:00Z",
  "total": 63,
  "ops": [
    {
      "opId": 9576999081,
      "opNumero": "2026/01863",
      "produtoId": 9116172204,
      "produtoSku": "<codigo do produto>",
      "produtoDescricao": "<descricao do produto>",
      "quantidade": 82,
      "unidade": "UN",
      "dataPrevisao": "2026-08-14",
      "etapaCodigo": "10",
      "etapaNome": "FABRICA",
      "concluida": false,
      "localId": 9169896468
    }
  ]
}
```

### Por que cada campo está assim

| Decisão | Motivo |
|---|---|
| `etapaCodigo` **e** `etapaNome` | O nome muda por conta; o código é o que o ERP ecoa. Etapa criada depois do seu cache aparece como código sem nome ✅ |
| `concluida` de `cConcluida` | `dConclusao` preenchida **não** significa OP concluída ✅ — ver [ordem-producao/armadilhas.md](ordem-producao/armadilhas.md) |
| `dataPrevisao` em ISO | A Omie devolve `dd/mm/aaaa` ✅ |
| `total` fora da lista | Vem de `total_de_registros` da própria listagem, já filtrada por `cConcluida` |
| `geradoEm` no topo | O consumidor decide se o dado é fresco o bastante |

### Quando `etapaNome` não vem

Deixe o campo `null` e exiba o código cru. Não invente um mapa hard-coded: a
lista de etapas é editável no ERP, e o código desconhecido é informação —
significa que seu catálogo envelheceu.

## Variações

**Kanban por etapa.** Agrupe `ops` por `etapaCodigo` no cliente. Não há filtro
por etapa em `ListarOrdemProducao` ✅ — as nove tags plausíveis são recusadas.

**Incluir as concluídas.** Troque o passo 1 por `cConcluida: "S"` (17 páginas) ou
omita o filtro (18 páginas). É a diferença entre uma requisição e dezoito;
ofereça como escolha explícita do usuário, nunca como default.

**Insumos de cada OP.** Não vêm na listagem: exigem `ConsultarOrdemProducao`,
uma chamada por OP ✅. É outra tela — ver
[90-receita-saldo-insumo.md](90-receita-saldo-insumo.md).

## Próximo

- [90-receita-saldo-insumo.md](90-receita-saldo-insumo.md) — a receita 2
- [ordem-producao/README.md](ordem-producao/README.md) — o recurso por trás
- [91-gaps-camada-propria.md](91-gaps-camada-propria.md) — o que a camada
  própria já resolve desta receita
