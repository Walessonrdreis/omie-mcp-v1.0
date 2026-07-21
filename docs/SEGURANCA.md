# Segurança da API HTTP local (`src/httpServer.ts`)

Este documento explica os mecanismos de segurança que já existem no `omie-mcp`
hoje, como configurá-los e — principalmente — **o que eles cobrem e o que NÃO
cobrem**, já que este projeto vai passar a ser usado como ponte
frontend↔backend de um app desktop distribuído para usuários da empresa.

> Leitura rápida: os mecanismos atuais foram desenhados pro cenário
> **"1 processo local, 1 usuário, mesma máquina"**. Servem como base, mas
> **não são suficientes sozinhos** pro cenário de "vários usuários da empresa,
> cada um com o app desktop instalado". O que muda entre os dois cenários está
> detalhado na seção [Cenário desktop multiusuário](#cenário-desktop-multiusuário---o-que-avaliar-antes-de-distribuir).

## O que existe hoje

Todos os mecanismos vivem em `src/httpServer.ts`, aplicados como middleware do
Express, nesta ordem: autenticação → rate limit → confirmação de operação
destrutiva → execução da ferramenta.

### 1. Autenticação por API key estática

- Toda rota exige o header `Authorization: Bearer <HTTP_API_KEY>`.
- A chave é comparada com `crypto.timingSafeEqual` (evita timing attack —
  comparação não vaza quanto da chave já "acertou" pelo tempo de resposta).
- O servidor **recusa subir** se `HTTP_API_KEY` não estiver definida no `.env`.
- Gerar uma chave: `npm run gerar-api-key` (32 bytes aleatórios em hex, via
  `node:crypto`). Cole o resultado em `HTTP_API_KEY` no `.env`.
- Requisição sem o header, ou com chave errada → `401`.

```
GET /tools
Authorization: Bearer 9f3a...   ← obrigatório em toda chamada
```

**Cobre:** qualquer cliente que não conheça a chave é bloqueado.
**Não cobre:** se a chave vazar (log, print, arquivo `.env` versionado por
engano, chave hardcoded no frontend desktop), qualquer um com a chave tem
acesso total — não há revogação individual nem expiração.

### 2. Bind só em `127.0.0.1`

- `HOST = "127.0.0.1"` está fixo no código (`src/httpServer.ts:27`) — o
  servidor não aceita conexão vinda de outra máquina na rede, só do próprio
  computador onde o processo roda.

**Cobre:** ninguém na rede local ou internet alcança a porta, mesmo sem
firewall.
**Não cobre:** qualquer processo/usuário *na mesma máquina* alcança
livremente (é a mesma superfície de qualquer app desktop local).

### 3. Rate limit (janela fixa)

- 120 requisições por minuto; acima disso, `429`.
- Contador é global ao processo (faz sentido porque, com bind em
  `127.0.0.1`, todo tráfego "parece" vir de um único IP mesmo).

**Cobre:** brute-force da API key e loop/script travado martelando o
servidor (e, por tabela, a Omie).
**Não cobre:** um usuário legítimo compartilha o limite com todos os outros
se este processo passar a atender mais de um usuário ao mesmo tempo (ver
seção seguinte) — hoje isso não é problema porque é 1 processo por máquina/
usuário.

### 4. Confirmação obrigatória em operações destrutivas

- Ferramentas que incluem/alteram/excluem dado na Omie (`destructive: true`
  em `ToolDef`, ou prefixo `Incluir/Alterar/Excluir/Cancelar/Deletar` quando
  a chamada é via `omie_chamar_api` genérico) exigem `"confirmar": true` no
  payload, senão respondem `400`.

**Cobre:** chamada destrutiva disparada por engano (bug de script, teste sem
querer, duplo clique).
**Não cobre:** não é uma trava de autorização por usuário/papel — qualquer
requisição autenticada pode confirmar e executar. É proteção contra acidente,
não contra abuso intencional.

## Como configurar (`.env`)

```env
OMIE_APP_KEY=...
OMIE_APP_SECRET=...
HTTP_API_KEY=<gerado com npm run gerar-api-key>
HTTP_PORT=3939        # opcional, default 3939
```

- **Nunca** commitar o `.env` real (só `.env.example` fica no git).
- Cada instalação (cada máquina/usuário) deve ter sua **própria**
  `HTTP_API_KEY` — não reaproveite a mesma chave entre máquinas diferentes
  (ver seção abaixo, é o ponto mais importante pro cenário desktop).

## Cenário desktop multiusuário — o que avaliar antes de distribuir

O uso pretendido agora é diferente do "single-user local" original: o
`omie-mcp` vai rodar como a ponte entre o frontend e o backend de um app
desktop, distribuído para vários usuários da empresa. Antes de liberar,
vale confirmar o modelo de deploy, porque muda o que é ou não suficiente:

- **Se cada usuário roda sua própria instância do processo, na própria
  máquina** (o app desktop sobe o `omie-mcp` como processo filho local, cada
  instalação com seu `.env`/`HTTP_API_KEY` gerada na hora da instalação): os
  mecanismos atuais **continuam adequados** — é exatamente o cenário pra que
  foram desenhados. Só reforçar: chave gerada por instalação (não uma chave
  fixa embutida no instalador), e `.env` fora de controle de versão/backup
  compartilhado.

- **Se existe uma instância central do `omie-mcp` compartilhada por vários
  usuários** (um servidor único que todos os apps desktop acessam pela
  rede): os mecanismos atuais **não são suficientes**, porque:
  - Bind em `127.0.0.1` bloquearia justamente o acesso remoto que esse
    modelo precisa — mudar isso é abrir a superfície de ataque pra rede
    inteira, e exige TLS (hoje é HTTP puro) antes de cogitar.
  - Uma única `HTTP_API_KEY` estática vira "senha compartilhada de todo
    mundo": não dá pra saber quem fez o quê, nem revogar o acesso de uma
    pessoa sem trocar a chave de todos.
  - Rate limit e confirmação continuam válidos, mas passam a limitar todos
    os usuários juntos, não cada um.
  - Isso já está sinalizado como pendência arquitetural: não expor como
    Connector/serviço remoto até ter autenticação por usuário (não por
    chave única) e HTTPS.

Hoje o modelo escolhido é o primeiro (processo local por usuário) — os
mecanismos atuais bastam. Mas como o plano da empresa é crescer pra esse
uso multiusuário, o plano de ação abaixo já fica registrado pra quando
chegar a hora de migrar, sem precisar redescobrir o que falta.

## Plano de ação — preparação para servidor central multiusuário

Ordem sugerida (cada fase depende da anterior; não pular pra fase seguinte
sem fechar a de trás). Nenhuma dessas fases deve começar antes da decisão
explícita de migrar pro modelo de servidor central — é plano, não trabalho
em andamento.

### Fase 0 — Decisões que travam o resto do plano

Antes de codar qualquer coisa, definir:

- **Fonte de identidade dos usuários**: a empresa já tem AD/Azure AD/Google
  Workspace/algum SSO? Se sim, a fase 1 vira "integrar com esse provedor"
  (OIDC/SAML) em vez de inventar um sistema de login próprio — sempre
  preferível, menos superfície de ataque pra manter.
- **Onde o servidor central vai rodar**: máquina/VM da própria empresa
  (rede interna, VPN) ou algum provedor cloud? Isso decide se dá pra manter
  acesso só via rede interna/VPN (mais simples e mais seguro) ou se precisa
  expor pra internet de fato.
- **Um único Omie App Key/Secret pra empresa toda, ou por
  filial/departamento?** Hoje é 1:1 (uma instalação = uma credencial Omie).
  Servidor central compartilhado por vários usuários provavelmente continua
  1 credencial Omie só, mas multiplexada por vários usuários autenticados —
  confirmar que não existe caso de múltiplas contas Omie distintas a
  atender, porque muda o desenho de autorização.

### Fase 1 — Autenticação por usuário (substitui a API key estática)

- Trocar `HTTP_API_KEY` única por um mecanismo que identifique **quem** está
  chamando: se houver SSO corporativo (fase 0), validar token OIDC/JWT
  emitido por ele; senão, implementar emissão de token próprio (login com
  usuário/senha ou API key individual por pessoa, com hash + salt se senha).
- Cada token carrega identidade do usuário — passa a existir um "usuário
  autenticado" no request, não só "requisição autenticada".
- Tokens com expiração e revogação (lista de revogados ou expiração curta +
  refresh) — hoje a `HTTP_API_KEY` não expira nem pode ser revogada
  individualmente.

### Fase 2 — Transporte seguro (TLS)

- Servidor precisa falar HTTPS antes de aceitar conexão fora de
  `127.0.0.1` — hoje é HTTP puro, aceitável só porque o tráfego nunca sai
  da própria máquina.
- Certificado: se ficar em rede interna/VPN, CA interna da empresa resolve;
  se expor além disso, certificado público (Let's Encrypt ou equivalente).

### Fase 3 — Controle de exposição de rede

- Trocar o bind fixo de `127.0.0.1` (hoje hardcoded, `src/httpServer.ts:27`)
  por configurável, mas **restrito** — nunca `0.0.0.0` sem mais nada em
  volta. Preferir: acessível só dentro da VPN/rede interna da empresa,
  atrás de firewall que só libera a porta pra IPs internos.
- Reavaliar o rate limit: hoje é uma janela global porque bind é
  `127.0.0.1` (todo tráfego "é" o mesmo IP); com múltiplos usuários reais,
  o limite precisa ser **por usuário autenticado** (fase 1), senão um
  usuário derruba a cota de todo mundo.

### Fase 4 — Autorização por papel (não só autenticação)

- Hoje "confirmar: true" bloqueia acidente, mas qualquer requisição
  autenticada pode fazer qualquer operação (inclusive destrutiva). Com
  vários usuários reais, avaliar se todo mundo deve poder
  incluir/alterar/excluir na Omie, ou se existe papel "só leitura" vs.
  "operador" — a resposta depende de quem vai usar o app (times
  financeiro/operacional podem ter necessidades diferentes).
- Se sim, adicionar checagem de papel/permissão antes de
  `ehChamadaDestrutiva` em `src/httpServer.ts`, usando a identidade que sai
  da fase 1.

### Fase 5 — Auditoria (log de quem fez o quê)

- Hoje não existe log de auditoria — só o console do processo. Com múltiplos
  usuários e dado sensível (financeiro/fiscal), registrar pra cada chamada:
  usuário, ferramenta, timestamp, resultado (sucesso/erro), e — nas
  destrutivas — o payload (sem dado de credencial). Não precisa ser
  sofisticado no início: um arquivo de log estruturado (JSON lines) já
  cobre rastreabilidade básica.

### Fase 6 — Operação (deploy, monitoramento, segredo)

- Processo rodando como serviço gerenciado (não terminal aberto) — systemd/
  serviço do Windows/PM2, com restart automático e log persistente.
- Segredo (Omie App Key/Secret, chave de assinatura de token) fora do
  `.env` em texto puro se o servidor for compartilhado — usar um
  cofre de segredos (Vault, variável de ambiente do orquestrador, etc.)
  em vez de arquivo solto na máquina do servidor.
- Monitoramento básico: alertar se o processo cair, se a taxa de erro (502/
  429) subir muito.

### O que **não** muda

Rate limit (mecanismo em si) e confirmação obrigatória em operação
destrutiva continuam válidos e não precisam ser reescritos — só ajustados
pra operar por usuário (fase 3) e por papel (fase 4) em vez de globalmente.

### Critério pra saber que está pronto pra migrar

Só considerar o servidor central pronto pra uso real quando as fases 0–3
estiverem fechadas (identidade real por usuário + TLS + rede restrita).
Fases 4–6 (papéis, auditoria, operação) são fortemente recomendadas antes
de qualquer dado financeiro real trafegar por ele, mas fases 0–3 são o
mínimo inegociável — sem elas, é a mesma chave estática de hoje só que
exposta pra rede, o que é pior, não melhor.

## Referência rápida

| Mecanismo | Arquivo | Protege contra | Não protege contra |
|---|---|---|---|
| API key estática | `src/httpServer.ts:42-58` | cliente sem a chave | vazamento da chave, sem revogação individual |
| Bind `127.0.0.1` | `src/httpServer.ts:27` | acesso pela rede | outro processo/usuário na mesma máquina |
| Rate limit | `src/httpServer.ts:68-85` | brute-force, loop travado | abuso distribuído entre vários usuários legítimos |
| Confirmação destrutiva | `src/httpServer.ts:97-113` | acidente (bug, duplo clique) | abuso intencional autenticado |
