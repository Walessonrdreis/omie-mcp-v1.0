# Movimentos de estoque — armadilhas

O que `estoque/movestoque` faz diferente do que você espera. Formato fixo: o que
você espera → o que acontece → como contornar → evidência.

← [Movimentos de estoque](README.md) · [Índice](../README.md)

## 1. A descrição da tool promete dois filtros que não existem

**Você espera:** listar os movimentos "de um produto em um período", como diz a
tool MCP 🔧 (`estoque-tools.ts:47-55`).

**O que acontece:** dos três recortes prometidos — produto, período e local —
**só o local existe** ✅. Seis nomes de produto e seis de data foram recusados
com `Client-5001`; a lista completa está em [leitura.md](leitura.md).

O `inputSchema` da tool é `z.record(z.unknown())` 🔧, então nada valida o que
você manda: o parâmetro inventado viaja até a Omie e volta como erro.

**Como contornar:** varra o local inteiro e filtre produto e data em memória. É a
mesma inversão que o vizinho exige — ver
[../estoque/armadilhas.md](../estoque/armadilhas.md) — e aqui ela é mais barata,
porque uma varredura traz o histórico todo, não uma foto que envelhece.

**Evidência:** sondagem de 10/08/2026, 13 chamadas ✅.

## 2. A paginação conta produtos, não movimentos

**Você espera:** `total_de_registros` é o número de movimentos, e
`registros_por_pagina: 100` traz 100 movimentos.

**O que acontece:** os dois contam **produtos** ✅. Cada item de `cadastros[]`
carrega toda a história daquele produto naquele local, e o array interno não tem
teto: um insumo desta conta traz **80 linhas sozinho** ✅.

**Como contornar:** nunca dimensione a resposta pelo tamanho de página. Uma
página de 100 produtos pode devolver mil linhas de movimento. Se você processa em
streaming ou grava em banco, o laço externo é por produto e o interno é por dia.

**Evidência:** `registros_por_pagina: 1` devolve um produto com 2 movimentos;
`total_de_registros: 210` no local `9176802789`, com 3 páginas de 100 ✅.

## 3. Um movimento é o resumo do dia, não um lançamento

**Você espera:** uma linha por movimentação, com direção.

**O que acontece:** uma linha por **data**, com `nQtdeEntradas` e `nQtdeSaidas`
somados ✅. As duas quantidades aparecem juntas na mesma linha quando o dia teve
os dois sentidos — `pcscp` em 12/11/2024 tem entrada de 10 e saída de 0,55692.

**Como contornar:** trate a linha como um agregado. Contar linhas para dizer
"foram 80 movimentos" está errado — foram 80 dias com atividade. E não procure um
campo de direção: ele não existe, o sinal está em qual dos dois baldes o número
caiu. Ver [campos.md](campos.md).

**Evidência:** coleta de 10/08/2026, mais de 110 linhas observadas ✅.

## 4. Sem `codigo_local_estoque` você vê só o depósito principal

**Você espera:** omitir o local traz a movimentação da empresa.

**O que acontece:** traz a do **local padrão** ✅. Omitir e pedir `9169896468`
dão o mesmo número: 1439 produtos. `Insumos Fábrica` tem outros 210, invisíveis
no default.

É o mesmo viés de `ListarPosEstoque` ✅ — ver
[../estoque/armadilhas.md](../estoque/armadilhas.md) —, com uma diferença de
sinal trocado: lá `0` é o valor especial que significa "padrão"; aqui o padrão é
a **ausência** do parâmetro, e `0` não foi testado como valor.

**Como contornar:** itere os locais de `ListarLocaisEstoque` e some. Para o chão
de fábrica, o local que interessa raramente é o padrão: a OP tira insumo de
`Insumos Fábrica` ✅, ver
[../ordem-producao/campos-itens.md](../ordem-producao/campos-itens.md).

**Evidência:** três chamadas com locais diferentes em 10/08/2026 ✅.

## 5. O movimento não diz quem o gerou

**Você espera:** que o histórico de estoque aponte a OP, o pedido ou a nota que
moveu o saldo — o elo natural entre produção e estoque.

**O que acontece:** a linha tem três campos: data, entradas e saídas ✅. Nenhum
identificador de documento, nenhum tipo, nenhum motivo — nem o `id_movest` que
`IncluirAjusteEstoque` devolve 🔧, ver
[../estoque/escrita.md](../estoque/escrita.md).

**Como contornar:** aceite que a ligação não existe pela API e resolva por
coincidência de data e quantidade, sabendo que é heurística, não chave. "Quais
OPs consumiram este insumo?" continua respondível só pelo caminho inverso, OP a
OP, com `ConsultarOrdemProducao`.

**Evidência:** coleta de 10/08/2026, 15 produtos, nenhum campo extra ✅.

## 6. Não há gateway no repo

**Você espera:** o mesmo tratamento dos outros recursos — interface de domínio,
tipo de resposta, normalização.

**O que acontece:** `estoque/movestoque` existe só como passthrough na camada MCP
🔧 (`estoque-tools.ts:47-55`). Não há gateway, não há tipo de resposta, e o
`param` é `z.record(z.unknown())`. Quem chama recebe o JSON cru da Omie, com os
nomes húngaros e as datas `dd/mm/aaaa`.

Foi por isso que o recurso ficou de fora do levantamento original: o
levantamento partiu dos gateways, e aqui não havia um 🔧.

**Como contornar:** converta na borda, como manda
[../90-modelo-frontend.md](../90-modelo-frontend.md). Nada entre você e a Omie
vai fazer isso — este é o único recurso da doc em que a camada própria não
oferece nenhuma proteção.

**Evidência:** `estoque-tools.ts:47-55` 🔧.

## Próximo

- [campos.md](campos.md) — o inventário completo de campos
- [leitura.md](leitura.md) — os parâmetros e o custo da varredura
