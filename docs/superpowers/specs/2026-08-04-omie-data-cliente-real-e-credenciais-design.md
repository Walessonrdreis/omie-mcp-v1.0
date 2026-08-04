# omie-data — cliente HTTP real + credenciais + comandos de skill (design)

## Contexto e motivação

O piloto anterior (`docs/superpowers/specs/2026-08-03-omie-data-skill-design.md`,
plano `docs/superpowers/plans/2026-08-03-omie-data-produtos-piloto.md`)
entregou o pipeline collect → translate → consultar do módulo Produtos,
testado com um `FakeOmieHttpClient` — sem nenhuma chamada real à Omie. Isso
deixou uma lacuna deliberada: não dá pra validar o piloto como usuário de
verdade, porque falta (a) um cliente HTTP real e (b) um jeito do usuário
configurar credenciais e (c) uma forma de acionar tudo isso numa conversa
do Claude Code (comando de skill).

Este design cobre exatamente essas três peças, fechando o critério de
aceite que ficou pendente no piloto anterior.

## Arquitetura

- **`packages/omie-data/src/infrastructure/omie-http-client-real.ts`** —
  implementação real de `IOmieHttpClient`. Reimplementa do zero (sem
  importar `src/` do omie-mcp, por causa da constraint de portabilidade já
  estabelecida) o protocolo da API Omie: `POST
  https://app.omie.com.br/api/v1/geral/produtos/` com corpo `{call:
  "ListarProdutos", app_key, app_secret, param: [...]}`. Sem retry
  automático ou throttling nesta primeira versão — YAGNI; se aparecer rate
  limit na prática, entra depois.
- **`packages/omie-data/src/infrastructure/credenciais.ts`** — funções
  `hashCredencial(appKey)`, `salvarCredencial(appKey, appSecret)`,
  `carregarCredencial(hash)`. Credencial fica em
  `data/omie-data/credentials/<hash>.json` (`{app_key, app_secret}`, texto
  simples — aceito pra este piloto; segurança de storage mais forte fica
  pra depois se for preciso), fora do `.db` de dados.
- **`packages/omie-data/src/cli.ts`** — ponto de entrada único com
  subcomandos `configurar` e `produtos`, saída sempre em JSON no stdout. A
  lógica de orquestração de cada subcomando vive em funções exportadas
  (`rodarConfigurar`, `rodarProdutos`) separadas do parsing de `argv`, pra
  serem testáveis com fakes sem precisar invocar o processo.
- **`.claude/commands/omie-data/configurar.md`** e
  **`.claude/commands/omie-data/produtos.md`** — comandos de skill que
  invocam o CLI via terminal e formatam a saída pro usuário, seguindo o
  mesmo padrão dos comandos `omie-skill:*` já existentes no projeto.

## Fluxo dos comandos

### `configurar`

**CLI** (`node cli.js configurar --app-key X --app-secret Y`):
1. Cria um `OmieHttpClientReal` temporário com as credenciais recebidas e
   chama `listarProdutosPagina(1, 1)` como validação.
2. Se a chamada falhar por autenticação: imprime `{"status":"invalido",
   "erro": "<mensagem>"}` e sai com código de erro diferente de zero.
3. Se funcionar: salva a credencial via `salvarCredencial` e imprime
   `{"status":"ok","hash":"<hash>"}`.

**Comando de skill** `/omie-data:configurar`:
- Se `$ARGUMENTS` não trouxer App Key/Secret, pergunta ao usuário um de
  cada vez (App Key primeiro, depois App Secret), sem adivinhar.
- Roda o CLI com os valores coletados.
- Reporta sucesso ou o erro de validação em texto pro usuário — nunca
  salva nada localmente por conta própria; quem salva é sempre o CLI.

### `produtos`

**CLI** (`node cli.js produtos [--atualizar]`):
1. Resolve a credencial ativa — neste piloto, assume-se uma única
   credencial salva (sem seleção multi-conta ainda); se não houver
   nenhuma, imprime `{"status":"sem_credencial"}`.
2. Sem `--atualizar`: roda só `consultarProdutos(db)` e imprime o
   resultado (`{"status":"sem_dado"}` ou `{"status":"dado_disponivel",
   "produtos":[...],"geradoEm":"...","idadeMs":N}`). Não decide sozinho se
   busca de novo — essa decisão é do comando de skill, que tem o usuário
   na conversa.
3. Com `--atualizar`: roda `collectProdutos` + `translateProdutos` com o
   `OmieHttpClientReal`, depois `consultarProdutos`, e imprime o resultado
   final.

**Comando de skill** `/omie-data:produtos`:
1. Roda `produtos` (sem `--atualizar`).
2. Se `sem_credencial`: avisa o usuário e sugere rodar
   `/omie-data:configurar` primeiro.
3. Se `sem_dado` ou dado com idade relevante: mostra a idade (ou a
   ausência de dado) e pergunta se quer atualizar antes de responder.
4. Se sim (ou se o dado já estava fresco o suficiente pro usuário): roda
   `produtos --atualizar` se necessário, formata a lista final pro
   usuário — nunca devolve o JSON cru do CLI.

## Testes e critério de aceite

TDD, seguindo o padrão do plano anterior (fixtures, sem rede real nos
testes automatizados):

1. **`OmieHttpClientReal`**: teste da montagem do payload/URL com `fetch`
   mockado (sem bater na rede de verdade), e do tratamento de erro de
   autenticação (resposta simulada com `faultstring`/`faultcode` vira
   exceção com mensagem legível).
2. **`credenciais.ts`**: salvar e carregar uma credencial num diretório
   temporário; hash determinístico para o mesmo App Key (duas chamadas de
   `hashCredencial` com o mesmo valor produzem o mesmo hash).
3. **`rodarConfigurar` / `rodarProdutos`** (funções de orquestração do
   CLI): testadas com `FakeOmieHttpClient` e banco em memória/diretório
   temporário — cobrem os casos de credencial válida/inválida, dado
   ausente/presente/atualizado.

**Critério de aceite**: com credenciais reais do usuário, rodar
`/omie-data:configurar` (uma vez) e depois `/omie-data:produtos` numa
conversa real do Claude Code, e obter a lista de produtos da conta Omie
real, formatada — fechando a validação end-to-end que ficou pendente no
piloto anterior.

## Fora de escopo (por agora)

- Retry automático e throttling no `OmieHttpClientReal` (YAGNI — entra se
  vira problema real em uso).
- Seleção entre múltiplas credenciais salvas simultaneamente (o piloto
  assume uma única credencial ativa).
- Armazenamento de credencial mais seguro que arquivo texto simples
  (ex: keychain do SO) — aceito para este piloto.
- Qualquer módulo além de Produtos (Estoque entra depois, conforme já
  combinado).
