# Documentação própria da API Omie — chão de fábrica

Status: aprovado

## Contexto

O repo acumulou muito conhecimento empírico sobre a API da Omie, mas nenhum
lugar documenta a **API em si**. O que existe hoje documenta outra coisa:

- `docs/FERRAMENTAS.md` (90k) e `README.md` (46k) — documentam as **ferramentas
  MCP**: nome da tool, argumentos, o que devolve.
- `docs/API.md` — diário cronológico de achados ("em 21/07 descobrimos que
  `nCodCC` quer conta corrente, não centro de custo").
- `docs/CONTEXTO-SESSOES.md` (59k) — histórico de sessões.
- Os gateways em `src/modules/*/infrastructure/gateways/` — onde as
  inconsistências da Omie estão contornadas em código, sem explicação de por quê
  em lugar nenhum além de comentários esparsos.

Quem for construir um frontend ou uma integração nova precisa de outra coisa:
**como obter os dados de cada endpoint, quais campos vêm de verdade, e onde a
Omie se comporta diferente do que documenta.** Hoje isso exige ler código de
gateway e garimpar o diário de achados.

Esta spec cobre a criação dessa referência, limitada ao chão de fábrica.

## Objetivo

Uma referência da API Omie que sirva a dois consumidores ao mesmo tempo — você,
implementando/depurando, e um agente montando payload — organizada de modo que
responder uma pergunta exija abrir **um arquivo só**.

O caso de uso que guia as decisões: alguém construindo um app frontend que
integra com o ERP. A preferência é que esse app consuma a camada própria
(`src/httpServer.ts` / `packages/omie-data`); quando ela não atender ao
requisito, o app cai direto na API da Omie. A doc precisa deixar claro qual dos
dois caminhos serve cada necessidade.

## Escopo

### Entra

Cinco recursos, nesta ordem (cada um depende dos conceitos do anterior):

1. `geral/produtos` — cadastro de produtos
2. `geral/malha` — estrutura / BOM
3. `estoque/consulta` + `estoque/ajuste` — posição e movimentos
4. `produtos/op` — ordem de produção
5. `produtos/pedido` — pedido de venda (**leitura/listagem apenas**)

### Não entra

- Emissão fiscal (NF-e, NFS-e), financeiro, compras, CRM, serviços.
- CRUD de pedido de venda (só leitura, conforme decidido).
- **Validação ao vivo de escrita.** Nenhum `Incluir`/`Alterar`/`Excluir` será
  executado contra a conta real. O conteúdo de escrita vem da doc oficial e do
  código que já roda em produção, marcado como tal.
- Geração automática de markdown a partir de schema, e testes de contrato contra
  a Omie. São o passo seguinte, quando o conteúdo estabilizar.

## Arquitetura da doc

```
docs/omie-api/
  README.md                índice mestre — tabela com link pra cada arquivo
  convencoes/
    request-auth.md        POST, param:[{}], app_key/secret, base URL
    paginacao.md           pagina/registros_por_pagina, total_de_paginas, limites
    erros.md               faultstring em HTTP 200, códigos SOAP-ENV, rate limit
    tipos-formatos.md      datas dd/mm/aaaa, decimais, flags "S"/"N"
  glossario/
    campos.md              dicionário canônico de nomenclatura
    conceitos.md           OP, malha, etapa, saldo físico x disponível
  produtos/                (mesmos 5 arquivos, ver abaixo)
  estrutura/               (idem)
  estoque/                 (idem)
  ordem-producao/          (idem)
  pedido-venda/            (idem)
  90-modelo-frontend.md    receitas de cruzamento + shape agregado sugerido
  91-gaps-camada-propria.md  o que httpServer/omie-data entrega vs. Omie direto
```

Cada um dos cinco diretórios de recurso tem exatamente os mesmos cinco arquivos:

```
<recurso>/
  README.md              o que é, métodos disponíveis, links
  leitura.md             Listar/Consultar: params reais, filtros que funcionam
  escrita.md             Incluir/Alterar/Excluir (da doc oficial, não testado)
  campos.md              campo a campo: tipo, sempre presente?, sinônimos
  armadilhas.md          inconsistências e comportamentos não documentados
```

**Regra de tamanho:** nenhum arquivo passa de 200 linhas. Se passar, quebra por
método (`leitura-listar.md`, `leitura-consultar.md`) e o `README.md` do recurso
absorve os links novos.

**Por que fatiado assim:** `FERRAMENTAS.md` com 90k já demonstrou o problema —
ninguém, humano ou agente, carrega isso pra responder uma pergunta sobre um
recurso só. O `README.md` de cada recurso existe pra que uma pergunta custe a
leitura de um arquivo.

## Nomenclatura divergente

Requisito explícito: campos com nomes diferentes que representam a mesma coisa
precisam estar comentados. Tratado em dois lugares, redundância deliberada:

1. **`glossario/campos.md`** — tabela canônica, um conceito por linha, uma
   coluna por recurso:

   | Conceito | produtos | ordem-producao | pedido-venda | estoque |
   |---|---|---|---|---|
   | ID interno do produto | `codigo_produto` | `nCodProduto` | `codigo_produto` | `nCodProd` |
   | Código do usuário | `codigo` | `cCodProduto` | `codigo` | — |
   | Quantidade | `quantidade` | `nQtde` | `quantidade` | `nQtde` |

   Os valores acima são ilustrativos — os reais saem da coleta.

2. **Nota inline em cada `campos.md` de recurso**, na própria linha do campo:
   `nCodProduto` → *mesmo conceito que `codigo_produto` em produtos; ver
   glossário*. Redundante de propósito: quem abre um arquivo só não pode perder
   a informação.

## Gabarito de conteúdo

### `<recurso>/leitura.md`

Por método (`ListarX`, `ConsultarX`):

1. Endpoint e `call` exatos
2. Tabela de parâmetros: nome, tipo, obrigatório?, o que faz **de verdade**
3. Exemplo de request mínimo e um completo, em JSON copiável
4. Como paginar até o fim, com o critério de parada real
5. Filtros: quais existem, quais funcionam, quais são silenciosamente ignorados
6. Link pro `campos.md` da resposta

### `<recurso>/campos.md`

Uma tabela, uma linha por campo:

| Campo | Tipo | Sempre vem? | Significado | Sinônimo |
|---|---|---|---|---|
| `nCodProduto` | number | sim | ID interno gerado pela Omie | `codigo_produto` (produtos) |

A coluna **"Sempre vem?"** distingue campo ausente de campo nulo de campo zero —
origem clássica de bug de integração com a Omie, e o dado que o frontend mais
precisa.

### `<recurso>/armadilhas.md`

Uma seção por inconsistência, sempre no mesmo formato: *o que você espera* → *o
que acontece* → *como contornar* → *evidência*. Evidência é `arquivo:linha` do
código que já contorna, entrada do `docs/API.md`, ou resposta real capturada.
Sem evidência, o item vai marcado `⚠️ não verificado`.

Exemplos que já existem no repo e migram pra cá: página vazia devolvida como
erro `SOAP-ENV:Client-5113` em vez de lista vazia; `nCodCC` que exige conta
corrente e não centro de custo; listagem que esconde registros por padrão até
que cada situação seja pedida explicitamente.

### `<recurso>/escrita.md`

Mesma estrutura da leitura, com aviso no topo: conteúdo derivado da doc oficial
e do código, **não validado ao vivo**. Cada campo obrigatório marcado `📖 doc` ou
`✅ confirmado` (quando o gateway do repo já o envia em produção com sucesso).

### `90-modelo-frontend.md`

Receitas de cruzamento: "listar OPs abertas com nome do produto" (incluindo por
que exige N+1 chamadas e o que a camada própria já resolve), "saldo de insumo
pra uma OP", "pedidos pendentes de separação". Cada receita: sequência de
chamadas + shape agregado sugerido pro front.

### `91-gaps-camada-propria.md`

Por necessidade do frontend, qual caminho serve: `httpServer`/`omie-data` já
entrega, ou precisa chamar a Omie direto. É o que operacionaliza a preferência
declarada (camada própria primeiro, Omie direto como fallback).

## Coleta do conteúdo

Três fontes, com precedência definida.

**Fonte 1 — código do repo** (mais confiável: é o que roda em produção). Por
recurso: o gateway (`*-omie-gateway.ts`), a interface de domínio, os DTOs e os
use-cases. Toda normalização/workaround ali é uma inconsistência da Omie
documentada implicitamente — vira item em `armadilhas.md` com a linha do código
como evidência. `src/integrations/omie/omieClient.ts` alimenta
`convencoes/erros.md` inteiro (retry, "consumo redundante", faultstring em HTTP
200, espaçamento mínimo entre requisições).

**Fonte 2 — achados já registrados**: `docs/API.md`,
`docs/CONTEXTO-SESSOES.md`, ADRs e `CONTEXT.md` do `omie-data`. Extrair o que é
sobre os cinco recursos do escopo.

**Fonte 3 — leitura ao vivo, só pra confirmar shape.** Apenas `Listar`/
`Consultar`, uma chamada por método, página pequena, via as tools MCP
existentes. Serve pra preencher a coluna "Sempre vem?" e pegar campos que a doc
oficial não menciona. Nenhuma escrita.

**Precedência quando divergem:** resposta real > código do repo > doc oficial. A
divergência não é resolvida em silêncio — vira entrada em `armadilhas.md`, já
que divergência entre doc pública e comportamento real é justamente o alvo.

**Marcação de confiança em cada afirmação:**

- `✅` observado ao vivo nesta coleta
- `🔧` derivado do código que roda em produção
- `📖` só da doc oficial, não verificado

**Limitação registrada, não resolvida:** campos que só aparecem em cenários que
a conta não tem (OP com etapas configuradas, pedido com nota faturada) ficam
`📖`, e o `armadilhas.md` do recurso diz isso explicitamente em vez de fingir
cobertura.

**Custo estimado:** 15 a 30 chamadas de leitura no total das três fases. A fase
1 sai quase toda das fontes 1 e 2.

## Fases de entrega

Cada fase é utilizável sozinha.

- **v1** — `convencoes/`, `glossario/`, `produtos/`, `estrutura/`
- **v2** — `estoque/`, `ordem-producao/`
- **v3** — `pedido-venda/`, `90-modelo-frontend.md`, `91-gaps-camada-propria.md`

O `README.md` mestre nasce na v1 e ganha linhas a cada fase; os arquivos ainda
não escritos aparecem nele marcados como pendentes, nunca como links quebrados.

O `glossario/campos.md` também nasce na v1 e é **acrescido** a cada fase: a
coluna de um recurso só é adicionada à tabela na fase em que aquele recurso é
documentado. Não existe coluna vazia esperando ser preenchida — isso mantém o
critério de "nenhuma célula vazia" válido em toda fase.

## Fronteira com a doc existente

Risco real: uma quarta fonte de verdade divergindo das três que já existem.
Mitigação:

- **Fronteira declarada** nas primeiras linhas do `README.md` mestre:
  `docs/omie-api/` documenta a **API da Omie** (protocolo, campos,
  comportamento); `FERRAMENTAS.md` documenta as **tools MCP** (assinatura,
  argumentos). A tool aponta pra doc da API; a doc da API não repete a
  assinatura da tool.
- **Sem duplicar o achado.** `docs/API.md` continua sendo o diário cronológico;
  `armadilhas.md` é o estado atual organizado por recurso, **linkando** a
  entrada do diário como evidência. Um é histórico, o outro é referência.
- **Gatilho de atualização**, escrito no `README.md` mestre: mexeu num gateway
  dos cinco recursos, ou descobriu comportamento novo da Omie → atualiza o
  arquivo correspondente no mesmo commit.

## Verificação

`scripts/verificar-doc-omie.mjs` — Node puro, sem dependência nova. Checa:

1. Links relativos que não resolvem
2. Arquivos acima de 200 linhas
3. Células de tabela vazias (devem usar `—`, `📖` ou similar)

Sai com código 1 se achar problema. É a única automação desta spec: sem ele, os
critérios de tamanho, preenchimento e navegabilidade apodrecem em semanas.

## Critério de pronto (por fase)

1. Todo método público do gateway daquele recurso aparece na doc
2. Nenhum `TBD`, nenhuma célula de tabela vazia
3. Todo item de `armadilhas.md` tem evidência ou marca `⚠️ não verificado`
4. Nenhum arquivo acima de 200 linhas
5. `scripts/verificar-doc-omie.mjs` passa
6. Toda afirmação tem marca de confiança (`✅`/`🔧`/`📖`)
