# omie-data — skill de dados cacheados da Omie (design)

## Contexto e motivação

O `omie-mcp` já tem a skill `omie-skill`, que cacheia a **documentação das
tools** (schema, parâmetros) pra evitar reler `docs/FERRAMENTAS.md` inteiro a
cada pergunta. Isso resolve "qual o parâmetro de X", mas não resolve outro
problema: quando o usuário quer **dado de negócio real** (produtos, estoque,
pedidos), hoje a única forma é chamar a tool MCP na hora, o que sempre bate
na API da Omie.

`omie-data` é uma skill nova e separada que resolve isso: mantém um cache de
**dados reais**, por credencial, traduzidos pra um formato legível — parecido
com o papel que um frontend cumpre sobre uma API crua — e só volta a
consultar a Omie quando o usuário concorda que o dado está velho demais.

Ela não substitui a `omie-skill` atual (que continua sendo a referência de
tools). Usa a mesma heurística de tradução (`referencia/formatacao-saida.md`)
como ponto de partida, mas é um pacote de código independente.

## Requisito de portabilidade

O código vive em `packages/omie-data/` como **pacote isolado**, com seu
próprio `package.json`, sem importar nada de `src/` do omie-mcp (nem gateways,
nem tipos). A única relação com o omie-mcp é conceitual (mesma API Omie,
mesmas regras de tradução usadas como referência). Isso é deliberado: o
usuário quer poder extrair essa pasta pra um repositório próprio, transformar
em plugin, automação, ou até um MCP separado, sem precisar desacoplar nada
depois.

## Arquitetura

- **Pacote**: `packages/omie-data/`, TypeScript + Vitest (mesmo stack já
  usado no monorepo), com sua própria estrutura `domain/application/
  infrastructure/presentation` por módulo de dado (ex: `produtos/`).
- **Armazenamento**: SQLite, **um arquivo `.db` por credencial**
  (`data/omie-data/<hash-da-app-key>.db`), nunca compartilhado entre
  credenciais diferentes.
- **Duas tabelas por módulo** (ex. para Produtos):
  - `raw_produtos`: `codigo_produto`, `payload_json` (resposta bruta da
    Omie), `coletado_em` — upsert por `codigo_produto`.
  - `view_produtos`: colunas já traduzidas/legíveis (nome, código, categoria,
    unidade etc.), `gerado_em` — reconstruída a partir de `raw_produtos`.
- **Cliente HTTP próprio** dentro do pacote pra API Omie (autenticação via
  `app_key`/`app_secret`) — não depende do servidor MCP rodando.
- **Credenciais**: guardadas fora do `.db` de dados (arquivo de config
  próprio do pacote, nunca junto do cache), identificadas por um hash que
  nomeia o banco daquela credencial.

## Pipeline em duas etapas

**Etapa 1 — Coleta (`collect`)**
Cliente HTTP autenticado busca os dados brutos no endpoint relevante da API
Omie e grava (upsert) em `raw_produtos`, um registro por item, com
timestamp de coleta. Não traduz nada aqui — só armazena o que a Omie
devolveu.

**Etapa 2 — Tradução (`translate`)**
Lê tudo de `raw_produtos`, aplica o mapeamento campo bruto → campo legível
(reaproveitando a heurística de `referencia/formatacao-saida.md` da
`omie-skill`: o que traduzir, o que não traduzir, formato de moeda/data/
booleano, prefixo húngaro), e grava/atualiza `view_produtos`. É uma view
pré-calculada e persistida, não calculada em runtime a cada consulta — troca
espaço em disco por consulta instantânea; se a regra de tradução mudar, a
etapa 2 é reexecutada.

Coleta e tradução são funções/casos de uso independentes e testáveis
isoladamente — isso é intencional, pra permitir reaproveitar o dado bruto
com outra regra de tradução no futuro sem recoletar da Omie.

## Fluxo do usuário final

**Primeira interação (configurar credenciais)**
1. Usuário roda um comando dedicado (ex: `/omie-data:configurar`), ou a
   skill detecta ausência de credencial salva na primeira consulta e pede
   automaticamente.
2. Pergunta uma de cada vez:
   - `App Key: ...`
   - `App Secret: ...`
3. Antes de salvar, faz uma chamada leve de validação na API Omie pra
   confirmar que a credencial funciona.
   - Inválida → informa o erro e pede de novo.
   - Válida → salva a credencial (fora do `.db` de cache) e calcula o hash
     que nomeia o banco daquela credencial.
4. Consultas futuras reaproveitam a credencial ativa automaticamente. Só
   pede de novo se o usuário quiser trocar de conta, ou se a credencial
   salva parar de autenticar.

**Consulta de dado (ex: produtos)**
1. Usuário pergunta algo relacionado a produtos (linguagem natural ou
   comando tipo `/omie-data:produtos`).
2. Skill resolve a credencial ativa → resolve o `.db` correspondente.
3. Verifica `view_produtos`:
   - **Não existe** → avisa que nunca coletou esse dado pra essa credencial
     e pergunta se quer buscar agora (roda `collect` + `translate` se sim).
   - **Existe, mas antiga** → informa a data/hora da última coleta e
     pergunta se quer atualizar antes de responder, ou usar o que já existe.
   - **Existe e usuário aceitou usar como está** → responde direto da view,
     sem chamar a Omie.
4. Resposta é sempre a versão traduzida/legível — nunca o JSON cru.
5. Se o usuário pedir um campo que a view ainda não mapeia, a skill avisa
   que o campo não está traduzido e oferece consultar `raw_produtos`
   (dado bruto) como fallback, em vez de simplesmente falhar.

## Módulo piloto: Produtos

Primeiro módulo a implementar, com TDD, antes de replicar o padrão pros
demais módulos (estoque, pedidos, etc. — um de cada vez).

### Testes (TDD)

1. **Collect**: `OmieHttpClient` fake retornando payload de produto
   simulado → verifica upsert correto em `raw_produtos` (SQLite em
   memória, sem rede real).
2. **Translate**: linhas fixas (fixture) em `raw_produtos` → verifica que
   `view_produtos` recebe os campos certos, traduzidos e formatados
   conforme `formatacao-saida.md`.
3. **Consulta**: dado uma view "fresca", retorna direto; dado uma view
   "velha" ou ausente, sinaliza necessidade de atualização em vez de
   responder com dado desatualizado silenciosamente.

### Critério de aceite

Com credenciais de teste reais, rodar `collect` → `translate` → consultar
um produto conhecido e obter saída legível (não JSON cru), com todo o
pipeline coberto por testes que não dependem de rede real.

## Fora de escopo (por agora)

- Cobertura de outros módulos além de Produtos (fica pra depois do piloto
  validado).
- Qualquer escrita/alteração de dado na Omie — esta skill é só leitura e
  tradução.
- Empacotamento formal como skill/plugin/MCP standalone — o design já
  prepara o terreno (pacote isolado), mas a extração em si não é parte
  deste piloto.
