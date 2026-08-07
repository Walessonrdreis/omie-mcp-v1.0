# Estrutura de Produtos — Uso da API Omie

Ficha técnica / BOM (Bill of Materials): quais insumos compõem cada produto.

## Ferramentas Disponíveis

| Ferramenta | Descrição | ⚠️ |
|---|---|---|
| `omie_estrutura_listar` | Lista produtos que têm estrutura cadastrada | — |
| `omie_estrutura_buscar_por_produto` | Busca estrutura por nome ou código do produto | — |
| `omie_estrutura_incluir` | Adiciona insumos/componentes à estrutura | ✅ |
| `omie_estrutura_alterar` | Altera itens da estrutura (ex: quantidade) | ✅ |
| `omie_estrutura_excluir` | Remove um item da estrutura | ✅ |

## Casos de Uso

### Buscar estrutura de um produto (recomendado)

**Ferramenta:** `omie_estrutura_buscar_por_produto`

```json
{
  "termo": "100kg"
}
```

**Retorno:** Produtos cujo nome ou código contém "100kg", cada um com sua lista de insumos (nome do componente, quantidade, `idMalha`). Se vier mais de um resultado, refine o termo.

> Use esta ferramenta quando não souber o código interno do produto — basta saber parte do nome.

---

### Listar todos os produtos com estrutura

**Ferramenta:** `omie_estrutura_listar`

```json
{
  "pagina": 1,
  "registros_por_pagina": 50
}
```

**Retorno:** Lista paginada de produtos que têm BOM, já com nome do produto e nome de cada insumo/componente (a Omie devolve isso pronto). Aceita `filtros` genéricos no resultado:

```json
{
  "filtros": [
    { "campo": "descricaoProduto", "operador": "contem", "valor": "acabado" }
  ]
}
```

---

### Adicionar insumos à estrutura ⚠️

**Ferramenta:** `omie_estrutura_incluir`

```json
{
  "idProduto": 123,
  "itens": [
    {
      "intMalha": "ITEM-001",
      "idProdMalha": 50,
      "quantProdMalha": 2.5
    },
    {
      "intMalha": "ITEM-002",
      "idProdMalha": 75,
      "quantProdMalha": 1.0
    }
  ]
}
```

**Pré-requisitos:**
- O produto pai (`idProduto`) precisa ser do tipo **"03 - Produto em Processo"** ou **"04 - Produto Acabado"** — a Omie recusa outros tipos.
- Os insumos (`idProdMalha`) precisam já estar cadastrados como produtos.

**Cada item do array `itens` exige:**
| Campo | Descrição |
|---|---|
| `intMalha` | Identificador único que **você inventa** para o item (ex: "ITEM-001"). Obrigatório apesar da doc pública dizer o contrário. |
| `idProdMalha` | Código Omie do produto/insumo componente. |
| `quantProdMalha` | Quantidade do insumo por unidade do produto pai. |

> ⚠️ Operação destrutiva: requer `"confirmar": true`.

---

### Alterar itens da estrutura ⚠️

**Ferramenta:** `omie_estrutura_alterar`

```json
{
  "idProduto": 123,
  "itens": [
    {
      "idMalha": 10,
      "idProdMalha": 50,
      "quantProdMalha": 3.0
    }
  ]
}
```

**Atenção:** Cada item precisa de `idMalha` (identifica qual item alterar — veja em `omie_estrutura_buscar_por_produto` ou `omie_estrutura_listar`) e `idProdMalha` (obrigatório mesmo que só vá mudar a quantidade).

> ⚠️ Operação destrutiva: requer `"confirmar": true`.

---

### Remover um item da estrutura ⚠️

**Ferramenta:** `omie_estrutura_excluir`

```json
{
  "idProduto": 123,
  "idMalha": 10
}
```

**Parâmetros:**
| Campo | Descrição |
|---|---|
| `idProduto` | Código Omie do produto pai |
| `idMalha` | Identificador do item a remover (obtido em `omie_estrutura_buscar_por_produto` ou `omie_estrutura_listar`) |

> ⚠️ Operação destrutiva: requer `"confirmar": true`.

---

### Fluxo completo: montar estrutura para um produto novo

1. **Criar o produto acabado** com `omie_produtos_incluir` → tipo "04 - Produto Acabado", guarde o `codigo_produto`
2. **Criar os insumos** com `omie_produtos_incluir` → tipo "01 - Matéria-Prima", guarde os códigos
3. **Adicionar insumos** com `omie_estrutura_incluir` → monte o array `itens` com `intMalha`, `idProdMalha`, `quantProdMalha`
4. **Conferir** com `omie_estrutura_buscar_por_produto` → veja se a estrutura está correta
5. **Criar OP** com `omie_op_incluir` → agora o produto tem BOM e já pode ser produzido

## Operações Destrutivas

Toda ferramenta marcada com ⚠️ exige o parâmetro `"confirmar": true`.

**Cuidados específicos de estrutura:**
- O produto pai precisa ser tipo 03 (Processo) ou 04 (Acabado)
- `intMalha` é obrigatório na inclusão — invente um identificador único por item
- `idProdMalha` é obrigatório na alteração, mesmo que só vá mudar quantidade
- Itens excluídos somem da BOM; não há "desfazer" — só re-adicionar com `omie_estrutura_incluir`

## Módulos Relacionados

- [Produtos](omie-Produtos-uso-api.md) — cadastrar produto pai e insumos
- [Ordem de Produção](omie-Ordem-Producao-uso-api.md) — produzir após ter estrutura pronta
- [Estoque](omie-Estoque-uso-api.md) — acompanhar consumo de insumos e entrada do acabado
