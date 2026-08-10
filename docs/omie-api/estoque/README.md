# Estoque — `estoque/consulta` e `estoque/ajuste`

Quanto existe de cada produto, em cada local, e como corrigir esse número. É a
**fonte real de saldo**: o `quantidade_estoque` do cadastro de produto sempre vem
`0` ✅ — ver [../produtos/armadilhas.md](../produtos/armadilhas.md).

← [Índice](../README.md)

Dois sub-recursos que dividem o nome e quase nada mais: a consulta fala
**húngaro**, o ajuste fala **snake**, e não há um campo em comum entre os dois
payloads 🔧.

## Métodos

| Método | Recurso | O que faz | Doc |
|---|---|---|---|
| `ListarPosEstoque` | `estoque/consulta` | Posições paginadas, sem filtro por produto | [leitura.md](leitura.md) |
| `IncluirAjusteEstoque` | `estoque/ajuste` | Lança ajuste — irreversível na prática | [escrita.md](escrita.md) |
| `ExcluirAjusteEstoque` | `estoque/ajuste` | Desfaz o número, não o fato | [escrita.md](escrita.md) |

Não existe `ConsultarPosEstoque`, nem qualquer método de leitura por produto —
é a característica que define o recurso.

Nenhum método de escrita foi executado contra a conta real — ver o aviso em
[escrita.md](escrita.md).

## Arquivos

| Arquivo | Assunto |
|---|---|
| [leitura.md](leitura.md) | Parâmetros, o custo da varredura, posição retroativa |
| [campos.md](campos.md) | Os campos da posição e o que os quatro saldos significam |
| [escrita.md](escrita.md) | Ajuste de estoque, os três enums, o que é irreversível |
| [armadilhas.md](armadilhas.md) | As oito armadilhas do recurso |

## O essencial em seis linhas

1. **Não existe filtro por produto** ✅. Saber o saldo de um item exige varrer
   tudo e filtrar em memória — 14 requisições para 1353 posições.
2. `nRegPorPagina` tem **teto silencioso de 100**: pedir 500 devolve 100 ✅.
3. A listagem padrão traz 1353 posições; só com `cExibeTodos: "S"` chega aos
   2021 produtos do catálogo — e aí a página vira 50, fixa ✅.
4. `dDataPosicao` dá **posição retroativa** em qualquer data ✅ — o recurso mais
   subestimado do endpoint.
5. Para "posso vender?" use `nSaldo`; para inventário, `fisico`. Nesta conta os
   dois são **sempre iguais**, então o teste não pega a troca ✅.
6. `fisico` negativo e fracionário é o normal, não a exceção ✅.

## Relacionados

- [../convencoes/paginacao.md](../convencoes/paginacao.md) — o dialeto húngaro
- [../glossario/conceitos.md](../glossario/conceitos.md) — local de estoque,
  saldo físico × disponível
- [../produtos/README.md](../produtos/README.md) — o cadastro cujo
  `quantidade_estoque` este recurso substitui
- `ordem-producao/README.md` (fase v2) — quem consome e produz saldo
