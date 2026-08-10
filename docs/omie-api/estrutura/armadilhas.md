# Estrutura — armadilhas

O que `geral/malha` faz diferente do que você espera. Formato fixo: o que você
espera → o que acontece → como contornar → evidência.

← [Estrutura](README.md) · [Índice](../README.md)

## 1. `idMalha` × `idProdMalha` — a confusão central do recurso

**Você espera:** um item da estrutura tem um ID, e esse ID é o do produto
componente.

**O que acontece:** são **dois IDs diferentes na mesma linha** ✅:

| Campo | Identifica | Exemplo observado |
|---|---|---|
| `idMalha` | A **linha** da ficha técnica | `9301904932` |
| `idProdMalha` | O **produto** daquela linha | `9207068440` (o refinado) |

O mesmo insumo em duas fichas técnicas tem **dois `idMalha` diferentes e o
mesmo `idProdMalha`** — é exatamente o que os dados mostram: o produto
`9207068440` aparece como `idMalha 9301904932` numa estrutura e `9207807424` em
outra ✅.

**Como contornar:** indexe pela linha (`idMalha`) quando o assunto é a ficha
técnica, e pelo produto (`idProdMalha`) quando o assunto é "onde este insumo é
usado". Usar `idProdMalha` como chave de linha faz você sobrescrever itens
silenciosamente quando o mesmo insumo aparece duas vezes.

**Evidência:** coleta de 10/08/2026 ✅ e
`src/modules/estrutura/domain/interfaces/estrutura-gateway.ts:66-77` 🔧.
Conceito em [../glossario/conceitos.md](../glossario/conceitos.md).

## 2. O dialeto de paginação é outro

**Você espera:** paginar igual a `geral/produtos` — `pagina` e
`registros_por_pagina`.

**O que acontece:** `geral/malha` fala **húngaro**: `nPagina` e `nRegPorPagina`
na entrada, `nPagina`/`nTotPaginas`/`nRegistros`/`nTotRegistros` na resposta, e
o array chama `produtosEncontrados` ✅.

Diferente do que seria conveniente, a Omie **não ignora** os nomes errados —
`ListarEstruturas` rejeita tag desconhecida ✅:

```
SOAP-ENV:Client-5001
ERROR: Tag [IDPRODUTO] não faz parte da estrutura do tipo complexo
[malhaPesquisarRequest]!
```

Isso é uma boa notícia: reusar o helper de produtos falha alto, não paginado
errado em silêncio.

**Como contornar:** não compartilhe helper de paginação entre recursos sem
parametrizar os nomes. A tabela dos dois dialetos está em
[../convencoes/paginacao.md](../convencoes/paginacao.md).

**Evidência:** `estrutura-omie-gateway.ts:27-30` e `estrutura-gateway.ts:45-51`
🔧; erro observado em 10/08/2026 ✅.

## 3. Três campos que a interface promete e a API não entrega

**Você espera:** os campos declarados como obrigatórios em
`ItemEstruturaOmie`/`EstruturaProdutoOmie` vêm em toda resposta.

**O que acontece:** `intProduto`, `intMalha`, `intProdMalha` e `obsProdMalha`
são declarados sem `?` (`estrutura-gateway.ts:6-43`) 🔧 e **não apareceram em
nenhum registro** ✅. Em TypeScript isso é pior que um campo opcional: o tipo
garante `string`, o runtime entrega `undefined`, e a quebra acontece longe da
origem.

**Como contornar:** trate os quatro como opcionais na borda. Se você precisa de
código de integração para estrutura, não conte com a leitura para recuperá-lo —
ver a armadilha 5.

**Evidência:** `ListarEstruturas` e `ConsultarEstrutura` em 10/08/2026 ✅.
Inventário completo em [campos.md](campos.md).

## 4. A listagem só traz quem **tem** estrutura

**Você espera:** `ListarEstruturas` percorre o catálogo, devolvendo ficha vazia
para produto sem malha.

**O que acontece:** `nTotRegistros` é **653** contra 2021 produtos no catálogo
✅. Produto sem estrutura simplesmente não aparece — a listagem é a lista dos
produtos fabricados, não do catálogo.

E consultar um desses diretamente devolve **erro, não vazio** ✅:

```
SOAP-ENV:Client-103
ERROR: Produto não encontrado!
```

A mensagem mente: o produto existe (o testado é componente de outra ficha
técnica), só não tem malha própria.

**Como contornar:** para "este produto é fabricado?", trate `Client-103` neste
recurso como **resposta negativa**, não como falha — mas não estenda isso a
outros recursos, onde o mesmo código provavelmente significa mesmo produto
inexistente. Para montar o inventário do que é fabricado, a listagem já é a
resposta.

**Evidência:** coleta de 10/08/2026 ✅; contagem de 2021 produtos em
[../produtos/armadilhas.md](../produtos/armadilhas.md).

## 5. `intMalha`: exigido na escrita, invisível na leitura

**Você espera:** o que a API exige que você mande, ela devolve depois.

**O que acontece:** `intMalha` é **obrigatório** no `IncluirEstrutura`, apesar
de a doc pública marcar como opcional 🔧, e **nunca volta** em
`ListarEstruturas`/`ConsultarEstrutura` ✅. Ele reaparece só no
`itemMalhaStatus[]` da própria escrita 🔧.

Pior: é o identificador do item **na malha**, não do produto componente — nome
parecido com `intProdMalha`, significado diferente.

**Como contornar:** persista o `intMalha` do seu lado no momento da inclusão,
junto com o `idMalha` que a resposta devolve. Derive-o da linha (pai +
sequência), nunca só do SKU do componente, senão duas linhas do mesmo insumo
colidem.

**Evidência:** `estrutura-gateway.ts:53-57` 🔧; ausência observada em
10/08/2026 ✅.

## 6. Alterar exige um ID redundante

**Você espera:** para mudar a quantidade de um item, basta `idMalha` — a linha
já sabe qual é o produto dela.

**O que acontece:** a Omie exige **`idProdMalha` junto**, mesmo quando ele não
muda 🔧.

**Como contornar:** guarde o par `(idMalha, idProdMalha)` sempre que ler uma
estrutura. Se você só guardou `idMalha`, vai precisar de uma leitura extra
antes de qualquer alteração.

**Evidência:** `estrutura-gateway.ts:66-70` 🔧 — comentário de contrato
registrando teste ao vivo contra a API real.

## 7. O recurso é `geral/malha`, não `produtos/malha`

**Você espera:** conceito de produto, recurso em `produtos/`.

**O que acontece:** o endpoint fica em `geral/` ✅, ao lado de clientes e
fornecedores, enquanto ordem de produção e pedido ficam em `produtos/`. Chamar
`produtos/malha` não resolve.

**Como contornar:** nenhuma lógica ajuda — é memorização. O gateway já acerta.

**Evidência:** `estrutura-omie-gateway.ts:25` 🔧, confirmado ao vivo ✅.

## 8. Escrita em lote pode suceder pela metade

**Você espera:** o lote inteiro passa ou o lote inteiro falha.

**O que acontece:** `IncluirEstrutura` e `AlterarEstrutura` devolvem
`itemMalhaStatus[]` com **uma entrada por item enviado**, cada uma com seu
próprio `codStatus` 🔧. Não há transação declarada.

**Como contornar:** percorra o array inteiro e reconcilie item a item. Olhar só
a primeira entrada — ou só a ausência de `faultstring` — dá falso sucesso.

**Evidência:** `estrutura-gateway.ts:79-90` 🔧. Não validado ao vivo; escrita
não foi executada nesta coleta.

## Próximo

- [campos.md](campos.md) — o inventário completo de campos
- [../convencoes/erros.md](../convencoes/erros.md) — por que a falha vem em
  HTTP 200
