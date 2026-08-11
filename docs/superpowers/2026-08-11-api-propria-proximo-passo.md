# Próximo passo: API própria de integração com a Omie

Prompt pronto para abrir uma sessão nova. Copie o bloco abaixo inteiro.

---

## O prompt

```
Quero montar uma API própria para integrar com o ERP Omie, que vai servir um app
frontend de chão de fábrica.

Use a skill brainstorming: primeiro entenda o escopo, depois proponha abordagens,
e só então escreva a spec. NÃO comece a implementar antes de eu aprovar o design.

LEIA PRIMEIRO, nesta ordem:
- docs/omie-api/README.md (índice da doc da API Omie, concluída em 11/08/2026)
- docs/omie-api/90-modelo-frontend.md (as regras de shape — é o contrato que a
  API deve expor)
- docs/omie-api/91-gaps-camada-propria.md (o que já existe no repo e o que falta)
- docs/omie-api/convencoes/ (os 4 arquivos: request/auth, paginação, erros, tipos)
- src/httpServer.ts (a API REST que já existe)
- src/integrations/omie/omieClient.ts (fila, retry, tratamento de erro)
- packages/omie-data/CONTEXT.md (o padrão de cache)

NÃO ABRA por inteiro: docs/FERRAMENTAS.md (90k), README.md da raiz (46k),
docs/CONTEXTO-SESSOES.md (59k). Use Grep se precisar de algo deles.

CONTEXTO: acabei de concluir docs/omie-api/, uma referência da API Omie
verificada ao vivo contra a conta real, cobrindo seis recursos de chão de
fábrica. Ela existe justamente para este projeto. Não repita o levantamento —
consulte.

A PRIMEIRA PERGUNTA que você deve me fazer é sobre ESCOPO: quais telas a API
precisa servir no lançamento. Isso decide o que entra em cache e o que vai ao
vivo, que é a decisão estruturante do projeto.

RESTRIÇÕES QUE A DOC JÁ ESTABELECEU (não são opinião, são como a Omie funciona):

1. Credencial da Omie viaja no CORPO de toda requisição — o front nunca pode
   chamar a Omie direto. A API é obrigatória, não uma conveniência.
2. Cache não é otimização, é requisito: estoque não filtra por produto e
   produtos não tem consulta em lote. Sem índice local, uma tela com 10 produtos
   faz 140 requisições e leva 40s.
3. Filtre ANTES de paginar. Pedido cancelado não é filtrável na origem e 58% da
   fila de separação é lixo. Paginar na origem e filtrar depois entrega página
   com buraco e total inflado.
4. Uma fila de saída, não um cliente por requisição: o espaçamento mínimo de
   300ms é por instância do OmieClient.
5. Erro chega em HTTP 200 (faultstring/faultcode). Traduza para status HTTP
   honesto na borda.
6. Paginação tem dois dialetos incompatíveis, nome de array diferente por
   recurso, e teto silencioso de 100. Helper genérico precisa dos três como
   parâmetro.
7. Estoque tem 15 locais e a leitura padrão só enxerga o padrão.

O QUE JÁ EXISTE E NÃO DEVE SER REESCRITO:
- OmieClient: fila de 300ms, retry que entende "Aguarde N segundos", detecção de
  erro em HTTP 200
- httpServer: API key timing-safe, rate limit 120/min, confirmação obrigatória em
  operação destrutiva, escuta só em 127.0.0.1
- Gateways dos seis recursos, com fake para OMIE_MOCK=true
- packages/omie-data: cache SQLite (Dado Bruto → Tradução → View), com produtos e
  OP prontos

O QUE CORRIGIR ANTES DE CONSTRUIR EM CIMA (gaps já mapeados em 91-gaps):
- gateway de estoque pede 500 por página, teto real é 100 → estimativa de custo
  erra por 5x
- omie_estoque_total_produto não é total: soma 1 dos 15 locais
- filtro de cancelados roda depois da paginação (totalRegistros: 60 para fila de 25)
- omie-data tem coleta de estoque sem View, então não responde nada
- falta ConsultarEstrutura: 14 páginas onde cabe 1 chamada
- cache de OP não guarda etapaNome

DECISÕES JÁ TOMADAS QUE VALEM AQUI:
- Português do Brasil em tudo.
- pnpm na raiz, nunca npm install.
- Plano longo se divide em blocos de UMA SESSÃO cada, executados na main, com
  prompt de abertura copiável e commit no fim. Ver a seção "Divisão por sessão"
  de docs/superpowers/plans/2026-08-10-doc-api-omie-chao-de-fabrica.md como
  modelo — funcionou bem em 9 sessões.
- Nenhuma escrita ao vivo contra a conta real sem eu autorizar explicitamente.
```

---

## Contexto de apoio

Material para consulta se a sessão nova precisar de mais background — **não é
para colar no prompt.**

### De onde isso vem

Entre 10 e 11/08/2026 foi construída `docs/omie-api/`, uma referência da API
Omie verificada ao vivo, em 9 sessões. O objetivo declarado desde o início era
exatamente este projeto: um app frontend que integra com o ERP, preferindo uma
camada própria e caindo direto na Omie quando ela não atender.

A doc responde "como obter os dados". Esta API é "como servi-los".

### Por que a primeira pergunta é o escopo

A decisão estruturante é o que fica em cache e o que vai ao vivo, e ela não tem
resposta genérica — depende de quais telas existem no lançamento.

O critério que a doc já estabeleceu (`91-gaps`, seção "Onde a fronteira fica"):
dado de **catálogo** (produto, estrutura, local, etapa) muda em semanas e vai
para cache; dado de **fila** (etapa de uma OP, pedido a separar) muda o dia
inteiro e vai ao vivo.

### Os cinco erros que já custaram caro

Registrados porque o mecanismo tende a se repetir:

1. Afirmação escrita com confiança, sem marca de confiança, nunca testada —
   sobreviveu do design até a sétima sessão porque cada camada citava a anterior.
   Cinco lugares no código precisaram de correção (`d16d305`, `2b1cf41`).
2. Tabela esquecida: quando uma descoberta invalida conhecimento anterior, os
   parágrafos são corrigidos e as células ficam. Três revisões acharam
   contradição em tabela.
3. Arquivo no limite de tamanho vira arquivo congelado.
4. Confundir `pnpm run skill-cache` (4s, zero chamadas à Omie) com
   `omie_op_atualizar_cache` (dezenas de chamadas reais).
5. No PowerShell 5.1, `Get-Content` sem `-Encoding UTF8` lê UTF-8 como ANSI e
   destrói os acentos na volta. Prefira a ferramenta de edição a scripts que
   reescrevem arquivo inteiro.

### Estado do repo em 11/08/2026

- Branch: `omie-skill-clean`, commit `2fa3c63`
- `pnpm test`: 148 testes, 42 arquivos, verdes
- `pnpm run verificar-doc-omie`: passa
- `pnpm run skill-cache:check`: passa
- Plano da doc: 12 tasks, 77 steps, todos concluídos
