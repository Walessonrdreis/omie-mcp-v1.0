# Estoque — armadilhas

O que `estoque/consulta` e `estoque/ajuste` fazem diferente do que você espera.
Formato fixo: o que você espera → o que acontece → como contornar → evidência.

← [Estoque](README.md) · [Índice](../README.md)

## 1. Não existe filtro por produto

**Você espera:** pedir a posição de um produto passando o código dele.

**O que acontece:** `ListarEstPosRequest` **não tem** parâmetro de produto. Os
três nomes plausíveis foram testados e recusados ✅:

```
SOAP-ENV:Client-5001
ERROR: Tag [NCODPROD] não faz parte da estrutura do tipo complexo
[ListarEstPosRequest]!
```

Mesma recusa para `idProduto` e `cCodigo` ✅. A única leitura possível é a lista
inteira, paginada.

**Como contornar:** varra **uma vez** e indexe por `nCodProd` em memória ou em
cache. O caminho ingênuo — varrer a cada pergunta — é o que o repo faz hoje 🔧
(`estoque-omie-gateway.ts:56-59`) e custa 1353 posições baixadas para devolver
uma. Dez produtos viram 140 requisições e mais de 40 segundos.

**E o vizinho não salva:** `estoque/movestoque` também não aceita filtro por
produto ✅ — mais seis nomes recusados, ver
[../movimentos-estoque/leitura.md](../movimentos-estoque/leitura.md). A
limitação é do módulo de estoque inteiro, não de `ListarPosEstoque`.

**Evidência:** coleta de 10/08/2026 ✅; custo detalhado em
[leitura.md](leitura.md).

## 2. `nRegPorPagina` tem teto silencioso de 100

**Você espera:** pedir 500 por página e receber 500, ou um erro.

**O que acontece:** a Omie devolve **100** e recalcula `nTotPaginas` como se
você tivesse pedido 100 ✅. Sem erro, sem aviso.

| Pedido | Devolvido | `nTotPaginas` |
|---|---|---|
| 2 | 2 | 677 |
| 500 | 100 | 14 |

O repo pede 500 🔧 (`estoque-omie-gateway.ts:18`). A varredura completa custa 14
requisições, não 3 — e nada no código sugere isso, porque o laço por
`nTotPaginas` continua correto.

**Como contornar:** peça 100 e assuma 100 no cálculo de custo. Estimativa de
tempo baseada no número que você pediu vai errar por 5×.

**Evidência:** três chamadas com tamanhos diferentes em 10/08/2026 ✅.

## 3. A listagem padrão esconde 668 produtos

**Você espera:** a listagem de estoque cobre o catálogo.

**O que acontece:** vêm **1353** posições, contra **2021** produtos ✅. Produto
que nunca teve movimento simplesmente não aparece. Só com `cExibeTodos: "S"` o
total sobe para 2021 — exatamente o tamanho do catálogo ✅.

E `cExibeTodos: "S"` faz uma segunda coisa, não documentada: **ignora
`nRegPorPagina` e fixa a página em 50** ✅. Pedir 2 devolve 50; pedir 101 devolve
50.

**Como contornar:** para inventário completo, `"S"` é obrigatório — ao custo de
41 páginas em vez de 14. Para "quanto tem do que gira", o padrão basta. Decida
qual dos dois você quer; o default responde a segunda pergunta, não a primeira.

**Evidência:** coleta de 10/08/2026 ✅; contagem de 2021 produtos em
[../produtos/armadilhas.md](../produtos/armadilhas.md).

## 4. `nSaldo` e `fisico` são idênticos nesta conta

**Você espera:** que a diferença entre saldo físico e disponível apareça nos
dados, e que seus testes peguem uma troca entre os dois.

**O que acontece:** em toda a amostra observada — cerca de 150 posições —
`nSaldo === fisico` e `reservado === 0`, sem exceção ✅. A conta nunca reserva
estoque, então os dois campos nunca divergem.

**Como contornar:** trocar um pelo outro é um bug **invisível aqui** e que
aparece na primeira conta que reserva. Escreva o código pela semântica
(`nSaldo` para "posso vender?", `fisico` para inventário) e não confie no teste
contra esta conta para validá-la — ele passa dos dois jeitos.

`nPendente` é o único dos quatro cuja relação dá para verificar: ele **não é
descontado** do `nSaldo` ✅ — `100bm` tem `fisico: 180`, `nPendente: 24` e
`nSaldo: 180`.

**Evidência:** [campos.md](campos.md); semântica em
[../glossario/conceitos.md](../glossario/conceitos.md) 🔧.

## 5. `fisico` negativo e fracionário é o normal

**Você espera:** quantidade em estoque é um inteiro ≥ 0.

**O que acontece:** as duas suposições quebram ✅. Na primeira página da conta a
maioria das posições é negativa, com extremo em `-5380`, e os valores são
fracionários: `-23.621`, `-230.5`, `5.5`.

Negativo acontece quando a saída é registrada sem a entrada correspondente.

**Como contornar:** nunca use `if (posicao.fisico)` para testar "tem estoque?" —
acerta por acidente com negativo e erra com zero. Compare explicitamente com
`> 0`. E não formate como inteiro.

**Evidência:** coleta de 10/08/2026 ✅.

## 6. Você manda `0` de local e recebe outro número

**Você espera:** o `codigo_local_estoque` da resposta ecoa o que você enviou.

**O que acontece:** você manda `0` e cada posição volta com o **ID real** do
local (`9169896468` nesta conta) ✅. `0` é um valor especial de entrada, não um
local — mandar um código inexistente é recusado ✅:

```
SOAP-ENV:Client-1070
ERROR: Local do Estoque não cadastrado para o Código [12345] !
- tag: [codigo_local_estoque]
```

Omitir o parâmetro dá o mesmo resultado que `0` ✅.

E `0` significa **o local padrão**, não "todos os locais" ✅: a conta tem 15
locais, e a leitura com `0` traz só as 1353 posições de `9169896468` — o único
com `padrao: "S"`. Ficam de fora 284 posições de `Estoque Fábrica` e 51 de
`Insumos Fábrica`.

**Como contornar:** agrupe as posições pelo `codigo_local_estoque` **da
resposta**. Código que assume `0` para reconciliar depois não encontra nada. E
para saber o total de um produto na empresa, varra local por local
(`ListarLocaisEstoque`, em `estoque/local`) — a leitura padrão responde "quanto
tem no depósito principal", que é outra pergunta.

**Evidência:** coleta de 10/08/2026 ✅.

## 7. O ajuste é irreversível sobre o ciclo de vida do produto

**Você espera:** excluir o ajuste desfaz o ajuste.

**O que acontece:** a Omie exclui o ajuste, mas o "Movimento de Estoque
(calculado)" fica registrado no produto **para sempre**. A partir do primeiro
ajuste, `ExcluirProduto` recusa por dependência — permanentemente, mesmo com o
ajuste já excluído 🔧.

`ExcluirAjusteEstoque` desfaz o número, não o fato.

**Como contornar:** trate `IncluirAjusteEstoque` como operação de sentido único
sobre a possibilidade de excluir aquele produto. Nunca ajuste produto de teste
em produção; prefira inativar a excluir. Se sua UI expõe ajuste, avise antes de
gravar — o usuário não tem como saber que está queimando uma porta.

**Evidência:** `estoque-gateway.ts:66-72` 🔧 — comentário registrando teste ao
vivo. Do outro lado, [../produtos/armadilhas.md](../produtos/armadilhas.md).

## 8. Os enums só são descobríveis pelo erro

**Você espera:** achar os valores de `tipo`, `origem` e `motivo` na doc.

**O que acontece:** a doc pública não documenta nenhum dos três 🔧. O enum de
`motivo` (`INI`, `INV`, `OPE`, `PDV`) foi descoberto mandando um valor inválido:
o `SOAP-ENV:Client-105` **lista as opções aceitas** na mensagem 🔧
(`estoque-gateway.ts:18-24`).

**Como contornar:** use o erro como documentação — é barato e confiável. Mas
lembre que ele confirma quais valores existem, **não o que cada um faz**: se
`SLD` define ou soma o saldo continua em aberto, ver
[escrita.md](escrita.md).

**Evidência:** `estoque-gateway.ts:18-24` 🔧; comportamento do `Client-105` em
[../convencoes/erros.md](../convencoes/erros.md).

## Próximo

- [campos.md](campos.md) — o inventário completo de campos
- [leitura.md](leitura.md) — o custo real da varredura
