# Ordem de Produção — Uso da API Omie

Criar, alterar, excluir e consultar Ordens de Produção (OP).

## Ferramentas Disponíveis

| Ferramenta | Descrição | ⚠️ |
|---|---|---|
| `omie_op_listar` | Lista OPs cruas (paginação e filtros nativos) | — |
| `omie_op_listar_com_produto` | Lista OPs com descrição/SKU do produto | — |
| `omie_op_consultar` | Consulta uma OP específica com insumos | — |
| `omie_op_incluir` | Cria uma nova Ordem de Produção | ✅ |
| `omie_op_alterar` | Altera uma OP existente | ✅ |
| `omie_op_excluir` | Exclui uma OP | ✅ |

## Casos de Uso

### Listar OPs com nome do produto (recomendado)

**Ferramenta:** `omie_op_listar_com_produto`

```json
{
  "pagina": 1,
  "registros_por_pagina": 20,
  "apenas_nao_concluidas": true
}
```

**Retorno:** Cada OP vem com `descricaoProduto`, `codigoSku`, `quantidade`, `etapaCodigo`, `concluida` (true/false). Prefira esta à listagem crua — ela já cruza o cadastro de produtos.

**Filtros no resultado enriquecido:**
```json
{
  "filtros": [
    { "campo": "descricaoProduto", "operador": "contem", "valor": "100kg" },
    { "campo": "quantidade", "operador": "maior_que", "valor": 10 }
  ]
}
```

> A etapa da OP (`etapaCodigo`) é configurável por conta Omie (3 a 6 fases com nomes próprios). A API não expõe endpoint para traduzir o código para o nome — se souber o significado das etapas da conta, interprete o código diretamente.

---

### Listar OPs cruas

**Ferramenta:** `omie_op_listar`

```json
{
  "param": {
    "pagina": 1,
    "registros_por_pagina": 20
  }
}
```

**Retorno:** OPs com apenas `nCodProduto` (código, sem descrição) e `cEtapa` (código cru da etapa). Use `omie_op_listar_com_produto` para já vir com nome do produto.

---

### Consultar uma OP específica

**Ferramenta:** `omie_op_consultar`

```json
{
  "nCodOP": 456
}
```

Ou pelo código de integração:
```json
{
  "cCodIntOP": "MINHA-OP-001"
}
```

**Retorno:** Dados completos da OP: produto, quantidade, data prevista, etapa, **insumos utilizados** (componentes da estrutura). O produto vem só como código (`nCodProduto`) — para descrição/SKU, use `omie_produtos_consultar` ou `omie_op_listar_com_produto`.

---

### Criar uma OP ⚠️

**Ferramenta:** `omie_op_incluir`

```json
{
  "cCodIntOP": "MINHA-OP-001",
  "nCodProduto": 123,
  "dDtPrevisao": "15/08/2026",
  "nQtde": 100,
  "codigo_local_estoque": 0
}
```

**Pré-requisito:** O produto (`nCodProduto`) **já precisa ter estrutura/BOM preenchida** — senão a Omie recusa. Use `omie_estrutura_incluir` antes se necessário.

**Campos:**
| Campo | Obrigatório | Descrição |
|---|---|---|
| `nCodProduto` | ✅ | Código Omie do produto a produzir |
| `dDtPrevisao` | ✅ | Data prevista de conclusão (dd/mm/aaaa) |
| `nQtde` | ✅ | Quantidade a produzir |
| `cCodIntOP` | — | Seu código de integração (opcional) |
| `codigo_local_estoque` | — | Local de estoque (0 = padrão) |

> ⚠️ Operação destrutiva: requer `"confirmar": true`.

---

### Alterar uma OP ⚠️

**Ferramenta:** `omie_op_alterar`

Identifique a OP por `nCodOP` ou `cCodIntOP` e reenvie os dados completos.

```json
{
  "nCodOP": 456,
  "nCodProduto": 123,
  "dDtPrevisao": "20/08/2026",
  "nQtde": 150
}
```

> ⚠️ Operação destrutiva: requer `"confirmar": true`.

---

### Excluir uma OP ⚠️

**Ferramenta:** `omie_op_excluir`

```json
{
  "nCodOP": 456
}
```

Ou por código de integração:
```json
{
  "cCodIntOP": "MINHA-OP-001"
}
```

> ⚠️ Operação destrutiva: requer `"confirmar": true`.

---

### Fluxo completo: criar OP → acompanhar → dar entrada no estoque

1. **Criar OP** com `omie_op_incluir` → `nQtde: 100`, guarde o `nCodOP` retornado
2. **Listar pendentes** com `omie_op_listar_com_produto` → `apenas_nao_concluidas: true`
3. **Consultar** com `omie_op_consultar` → veja insumos e etapa atual
4. **Após conclusão**, dar entrada no estoque com `omie_estoque_ajuste_incluir` → `tipo: "ENT"`, `motivo: "OPE"`
5. **Conferir estoque** com `omie_estoque_total_produto` → confirmar que o saldo subiu

## Operações Destrutivas

Toda ferramenta marcada com ⚠️ exige o parâmetro `"confirmar": true`.

**Cuidados específicos de OP:**
- O produto precisa ter estrutura/BOM antes de criar a OP
- Ao alterar, é necessário reenviar `nCodProduto`, `dDtPrevisao` e `nQtde` (não basta enviar só o campo alterado)
- A exclusão pode ser recusada se a OP estiver vinculada a outros registros

## Módulos Relacionados

- [Produtos](omie-Produtos-uso-api.md) — cadastro do produto a produzir
- [Estrutura de Produtos](omie-Estrutura-Produtos-uso-api.md) — BOM/ficha técnica (pré-requisito para OP)
- [Estoque](omie-Estoque-uso-api.md) — dar entrada do produto acabado
