# Produtos — Uso da API Omie

Cadastro de produtos/serviços, famílias e consulta com estoque.

## Ferramentas Disponíveis

| Ferramenta | Descrição | ⚠️ |
|---|---|---|
| `omie_produtos_listar` | Lista produtos cadastrados (cru, paginado) | — |
| `omie_produtos_listar_com_estoque` | Lista produtos com quantidade e valor em estoque por local | — |
| `omie_produtos_consultar` | Consulta um produto específico por código | — |
| `omie_familias_listar` | Lista famílias de produtos (cacheável) | — |
| `omie_produtos_incluir` | Cria um novo produto/serviço | ✅ |
| `omie_produtos_alterar` | Altera um produto existente | ✅ |
| `omie_produtos_excluir` | Exclui um produto (recusado se tiver movimentação) | ✅ |

## Casos de Uso

### Listar todos os produtos

**Ferramenta:** `omie_produtos_listar`

```json
{
  "param": {
    "pagina": 1,
    "registros_por_pagina": 50
  }
}
```

**Retorno:** Lista de produtos com código, descrição, unidade, NCM, valor_unitario.
**Atenção:** O campo `quantidade_estoque` retornado aqui **não é confiável** (vem sempre 0). Para estoque real, use `omie_produtos_listar_com_estoque` ou `omie_estoque_total_produto`.

---

### Listar produtos com estoque (recomendado)

**Ferramenta:** `omie_produtos_listar_com_estoque`

```json
{
  "pagina": 1,
  "registros_por_pagina": 50,
  "apenas_com_estoque": true
}
```

**Retorno:** Cada produto vem com `quantidadeEmEstoque`, `valorEmEstoqueVenda` (preço de venda × quantidade) e `valorEmEstoqueCusto` (custo médio × quantidade). Aceita `filtrar_apenas_familia` (código da família) e `filtros` genéricos.

**Filtros disponíveis no resultado enriquecido:**
```json
{
  "filtros": [
    { "campo": "descricaoProduto", "operador": "contem", "valor": "kg" },
    { "campo": "valorEmEstoqueVenda", "operador": "maior_que", "valor": 1000 }
  ]
}
```

---

### Consultar um produto específico

**Ferramenta:** `omie_produtos_consultar`

```json
{
  "param": {
    "codigo": "PROD-001"
  }
}
```

**Retorno:** Dados completos do produto: código, descrição, unidade, NCM, valor_unitario, EAN, família, peso líquido/bruto, etc.

---

### Listar famílias de produtos

**Ferramenta:** `omie_familias_listar`

```json
{
  "param": {
    "pagina": 1,
    "registros_por_pagina": 50
  }
}
```

**Retorno:** Lista de famílias com `codigo` e `descricao`. Use o `codigo` retornado aqui no parâmetro `filtrar_apenas_familia` das outras ferramentas. Esta chamada é cacheada no servidor MCP (TTL próprio).

---

### Criar um produto ⚠️

**Ferramenta:** `omie_produtos_incluir`

```json
{
  "codigo": "MEU-SKU-001",
  "descricao": "Produto Exemplo 100kg",
  "unidade": "UN",
  "ncm": "0101.21.00",
  "valor_unitario": 150.00,
  "codigo_produto_integracao": "INT-001",
  "codigo_familia": 123
}
```

**Campos obrigatórios:** `codigo` (SKU), `descricao`, `unidade`.
**Campos opcionais comuns:** `codigo_produto_integracao`, `ncm`, `valor_unitario`, `ean`, `codigo_familia`, `tipoItem`, `peso_liq`, `peso_bruto`, `marca`, `modelo`.
**Retorno:** `codigo_produto` — código Omie gerado. Guarde este valor para usar em alterações, exclusões e cruzamentos com outros módulos.

> ⚠️ Operação destrutiva: requer `"confirmar": true`.

---

### Alterar um produto ⚠️

**Ferramenta:** `omie_produtos_alterar`

Identifique o produto por **um** destes: `codigo_produto` (Omie), `codigo` (SKU) ou `codigo_produto_integracao`. Envie apenas os campos que vão mudar.

```json
{
  "codigo": "MEU-SKU-001",
  "valor_unitario": 175.00,
  "descricao": "Produto Exemplo 100kg - Revisado"
}
```

> ⚠️ Operação destrutiva: requer `"confirmar": true`.

---

### Excluir um produto ⚠️

**Ferramenta:** `omie_produtos_excluir`

```json
{
  "codigo": "MEU-SKU-001"
}
```

**Atenção:** A Omie recusa a exclusão se o produto já tiver movimentação (pedido, estoque, OP, etc.). Use `codigo_produto`, `codigo` ou `codigo_produto_integracao` para identificar.

> ⚠️ Operação destrutiva: requer `"confirmar": true`.

---

### Fluxo completo: criar → consultar → alterar

1. **Criar** produto com `omie_produtos_incluir` → guarde o `codigo_produto` retornado
2. **Consultar** com `omie_produtos_consultar` → confira os dados
3. **Alterar** preço com `omie_produtos_alterar` → envie só `valor_unitario` novo
4. **Listar com estoque** com `omie_produtos_listar_com_estoque` → veja o valor total em estoque

## Operações Destrutivas

Toda ferramenta marcada com ⚠️ exige o parâmetro `"confirmar": true` na chamada. Sem ele, a operação é recusada com erro HTTP 400. Isso evita alterações acidentais no ERP.

## Módulos Relacionados

- [Estoque](omie-Estoque-uso-api.md) — consultar saldo e movimentações de um produto
- [Estrutura de Produtos](omie-Estrutura-Produtos-uso-api.md) — montar ficha técnica/BOM do produto
- [Ordem de Produção](omie-Ordem-Producao-uso-api.md) — produzir o produto
