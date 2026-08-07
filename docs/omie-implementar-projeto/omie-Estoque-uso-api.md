# Estoque — Uso da API Omie

Saldo, movimentações e ajustes de estoque por local.

## Ferramentas Disponíveis

| Ferramenta | Descrição | ⚠️ |
|---|---|---|
| `omie_estoque_total_produto` | Estoque total de um produto (soma todos os locais) | — |
| `omie_estoque_movimentos_listar` | Lista movimentos de estoque (entradas/saídas) | — |
| `omie_estoque_ajuste_incluir` | Registra um ajuste manual de estoque | ✅ |
| `omie_estoque_ajuste_excluir` | Exclui um ajuste de estoque | ✅ |

## Casos de Uso

### Consultar estoque total de um produto

**Ferramenta:** `omie_estoque_total_produto`

```json
{
  "codigo_produto": 123
}
```

**Retorno:** Quantidade total, saldo físico e reservado somados de **todos** os locais de estoque. A Omie não entrega esse total pronto — a ferramenta pagina por todos os locais e consolida.

> O `codigo_produto` é o código Omie (`nCodProd`/`codigo_produto`), obtido via `omie_produtos_consultar` ou `omie_produtos_listar`.

---

### Listar movimentações de estoque

**Ferramenta:** `omie_estoque_movimentos_listar`

```json
{
  "param": {
    "pagina": 1,
    "registros_por_pagina": 50,
    "id_prod": 123,
    "data_de": "01/08/2026",
    "data_ate": "06/08/2026"
  }
}
```

**Retorno:** Lista de movimentos com data, tipo (entrada/saída), quantidade, valor, local de estoque e observação. Use os filtros nativos da Omie dentro do objeto `param`.

---

### Criar ajuste de estoque ⚠️

**Ferramenta:** `omie_estoque_ajuste_incluir`

```json
{
  "id_prod": 123,
  "data": "06/08/2026",
  "tipo": "ENT",
  "quan": 50,
  "valor": 150.00,
  "obs": "Entrada de produção — OP #456",
  "motivo": "OPE",
  "codigo_local_estoque": 0
}
```

**Tipos de movimento (`tipo`):**
| Valor | Significado |
|---|---|
| `ENT` | Entrada no estoque |
| `SAI` | Saída do estoque |
| `SLD` | Ajuste de saldo (define valor absoluto) |
| `TRF` | Transferência entre locais |

**Motivos aceitos (`motivo`):**
| Valor | Significado |
|---|---|
| `INI` | Estoque inicial |
| `INV` | Inventário / divergência |
| `OPE` | Operacional |
| `PDV` | Ponto de venda |

**Para transferência (`tipo: "TRF"`):** adicione `codigo_local_estoque_destino`.

**⚠️ Atenção:** Depois de qualquer ajuste de estoque num produto, **esse produto nunca mais pode ser excluído** na Omie — fica um "Movimento de Estoque (calculado)" permanente, mesmo se o ajuste for excluído depois. Avise o usuário antes de ajustar estoque de produto de teste/temporário.

> ⚠️ Operação destrutiva: requer `"confirmar": true`.

---

### Excluir ajuste de estoque ⚠️

**Ferramenta:** `omie_estoque_ajuste_excluir`

```json
{
  "id_ajuste": 789
}
```

O `id_ajuste` é devolvido na resposta do `omie_estoque_ajuste_incluir`.

**⚠️ Atenção:** Excluir o ajuste **reverte** a movimentação, mas **não desfaz** a dependência criada no produto — ele continua sem poder ser excluído.

> ⚠️ Operação destrutiva: requer `"confirmar": true`.

---

### Fluxo completo: dar entrada de produto acabado da produção

1. **Criar OP** com `omie_op_incluir` → produziu 50 unidades do produto 123
2. **Dar entrada** com `omie_estoque_ajuste_incluir` → `tipo: "ENT"`, `quan: 50`, `motivo: "OPE"`
3. **Conferir estoque** com `omie_estoque_total_produto` → confirmar que a quantidade subiu
4. **Ver movimentações** com `omie_estoque_movimentos_listar` → rastrear o histórico

## Operações Destrutivas

Toda ferramenta marcada com ⚠️ exige o parâmetro `"confirmar": true`. Sem ele, a operação é recusada.

**Cuidados específicos de estoque:**
- Ajustar estoque de um produto cria vínculo permanente (produto nunca mais pode ser excluído)
- Excluir um ajuste reverte a quantidade mas não desfaz o vínculo
- Para transferências (`TRF`), o `codigo_local_estoque_destino` é obrigatório

## Módulos Relacionados

- [Produtos](omie-Produtos-uso-api.md) — cadastro do produto e listagem com estoque
- [Ordem de Produção](omie-Ordem-Producao-uso-api.md) — produzir e dar entrada no estoque
- [Estrutura de Produtos](omie-Estrutura-Produtos-uso-api.md) — BOM dos insumos consumidos
