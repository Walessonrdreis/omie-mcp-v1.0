# Estrutura (BOM) — `geral/malha`

A ficha técnica dos produtos fabricados: quais insumos, em que quantidade, para
produzir uma unidade. A Omie chama de **malha** — ver
[../glossario/conceitos.md](../glossario/conceitos.md).

← [Índice](../README.md)

É o elo do meio da cadeia de chão de fábrica: [produtos](../produtos/README.md)
→ estrutura → ordem de produção. Uma OP só pode ser criada para produto que já
tem malha cadastrada 🔧.

## Métodos

| Método | O que faz | Doc |
|---|---|---|
| `ListarEstruturas` | Página das estruturas, dialeto húngaro | [leitura.md](leitura.md) |
| `ConsultarEstrutura` | Uma ficha por chave, sem envelope | [leitura.md](leitura.md) |
| `IncluirEstrutura` | Adiciona itens — `intMalha` obrigatório na prática | [escrita.md](escrita.md) |
| `AlterarEstrutura` | Altera itens — exige `idMalha` **e** `idProdMalha` | [escrita.md](escrita.md) |
| `ExcluirEstrutura` | Remove uma linha por chamada | [escrita.md](escrita.md) |

Nenhum método de escrita foi executado contra a conta real — ver o aviso em
[escrita.md](escrita.md).

## Arquivos

| Arquivo | Assunto |
|---|---|
| [leitura.md](leitura.md) | Parâmetros, requests, paginação húngara, chave alternativa |
| [campos.md](campos.md) | Os quatro blocos da resposta e o que cada campo significa |
| [escrita.md](escrita.md) | `Incluir`/`Alterar`/`Excluir`, derivados do código |
| [armadilhas.md](armadilhas.md) | As oito armadilhas do recurso |

## O essencial em cinco linhas

1. `idMalha` é a **linha** da ficha; `idProdMalha` é o **produto** daquela
   linha — confundir os dois é o erro mais provável do recurso ✅.
2. Pagina em **húngaro** (`nPagina`/`nRegPorPagina`), não em snake como
   produtos ✅.
3. A resposta já traz descrição, unidade e família de cada componente — não
   precisa cruzar com `geral/produtos` ✅.
4. A listagem só devolve quem **tem** estrutura: 653 dos 2021 produtos ✅.
5. `intProduto`, `intMalha`, `intProdMalha` e `obsProdMalha` são declarados
   obrigatórios no repo e **nunca vêm** na resposta ✅.

## Relacionados

- [../convencoes/paginacao.md](../convencoes/paginacao.md) — o dialeto húngaro
- [../glossario/conceitos.md](../glossario/conceitos.md) — malha, item da malha
  × produto componente
- [../produtos/README.md](../produtos/README.md) — o cadastro que alimenta pai e
  componentes
- `ordem-producao/README.md` (fase v2) — quem consome a estrutura para produzir
