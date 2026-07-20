# Contexto das Sessões

Log cronológico de cada sessão de trabalho relevante neste projeto: o que foi feito, decisões tomadas e o que ficou pendente. Mantido pela skill `memoria-sessao` (`.claude/skills/memoria-sessao/SKILL.md`).

Objetivo: qualquer nova conversa (ou pessoa) consegue ler as entradas mais recentes abaixo e entender rapidamente onde o trabalho parou, sem precisar reconstruir o contexto a partir do histórico de chat ou do git log.

Para o que foi implementado tecnicamente (não o que aconteceu em cada sessão), veja `docs/GERAL.md`.

---

## 2026-07-20 — Cobertura financeira, hardening de rate limit e infraestrutura de acesso

- **Autor/Interlocutor:** Walesson
- **O que foi feito:**
  - Estabelecida a arquitetura híbrida do MCP: módulos passthrough (`src/tools/*.ts`) para endpoints que a Omie já devolve prontos, e módulos em camadas (`src/modules/<nome>/`, clean architecture) quando há lógica de negócio (agregação, cruzamento, paginação).
  - Construídos módulos em camadas: `produtos` (estoque calculado por produto), `estoque` (total por produto somando locais), `ordemProducao` (OPs com produto resolvido), `pedidoVenda` (pedidos com cliente/itens, produtos para separar, atalho "Separar Estoque"), `clientesFornecedores` (cliente e fornecedor são o mesmo cadastro Omie, diferenciados por tag — renomeado de `clientes` a pedido do usuário), `contasCorrentes`, `fluxoCaixa` (relatório de fluxo de caixa que a Omie não tem pronto, com contas favoritas e opção de saldo real).
  - Hardening do `OmieClient`: throttle de 300ms entre chamadas, retry com espera baseada na mensagem de erro da Omie, `mapWithConcurrency` para limitar fan-out — corrigiu bugs reais de rate limit ("consumo indevido"/"consumo redundante") e a descoberta de que a Omie rejeita duas chamadas concorrentes do mesmo método.
  - Criado `src/httpServer.ts`: API REST local (só `127.0.0.1`, sem autenticação) reaproveitando a mesma lógica do MCP, com rotas de descoberta de schema (`/tools`, `/tools/:name/schema`) — passo intermediário rumo a um futuro frontend/backend próprio, sem expor o MCP remotamente ainda.
  - Adicionados os módulos `contasPagar` e `contasReceber` (listagem com nome do fornecedor/cliente resolvido), documentados em README.md e FUNCIONALIDADES.md, e implementado filtro de data (`data_alteracao_de`/`ate`) em ambos.
  - Criado `COMO_USAR.md` na raiz — guia de referência com todos os comandos `curl` e payloads de cada ferramenta, para consulta quando os tokens do Claude acabarem.
  - Promovidas as skills `documentacao-viva` e `memoria-sessao` de locais (`omie-mcp/.claude/skills/`) para globais (`~/.claude/skills/`), disponíveis em qualquer projeto novo.
- **Decisões tomadas:**
  - Escopo de clientes/fornecedores fica **só leitura** até o MCP ter segurança mínima implantada — CRUD completo fica para depois.
  - MCP não será exposto remotamente (Connector) até ter segurança mínima — a API HTTP local não muda essa decisão, só facilita consumo local.
  - O filtro nativo da Omie (`filtrar_por_data_de/ate`) em `financas/contapagar`/`financas/contareceber` filtra pela **data de última alteração do lançamento**, não pelo vencimento — confirmado testando a API. Por isso o MCP expõe o parâmetro como `data_alteracao_de/ate`, para não sugerir um comportamento que a API não tem.
- **Pendências / próximos passos:**
  - Gap-analysis pendente: mapear o que ainda falta cobrir da Omie (CRM, NF-e, Serviços/NFS-e, Painel do Contador nunca foram explorados; várias tools de finanças como extrato, boleto, pix, orçamentos ainda só via `omie_chamar_api` genérico).
  - Confirmar se as duas contas "iFood" cadastradas em `CONTAS_FAVORITAS` do fluxo de caixa são duplicidade real ou contas distintas legítimas.
  - Avaliar se remove as cópias locais das skills em `omie-mcp/.claude/skills/` agora que existem globais.
- **Docs relacionadas:** README.md (arquitetura, todos os módulos, rate limit), FUNCIONALIDADES.md, `COMO_USAR.md` (novo).

## 2026-07-20 — Segurança mínima na API HTTP local (autenticação por API key)

- **Autor/Interlocutor:** Walesson
- **O que foi feito:** implementada autenticação por API key estática no `httpServer.ts` — toda rota agora exige header `Authorization: Bearer <HTTP_API_KEY>`, validado com comparação timing-safe; o servidor recusa subir (`process.exit(1)`) se `HTTP_API_KEY` não estiver definida no `.env`. Criado `scripts/gerar-api-key.mjs` (`npm run gerar-api-key`) pra gerar a chave. Atualizados `.env.example`, `README.md` e `COMO_USAR.md` (todos os exemplos de `curl` agora incluem o header). Testado manualmente: 401 sem header/com chave errada, 200 com chave certa; servidor recusa iniciar sem `HTTP_API_KEY`.
  - **Atualizado em:** 2026-07-20 — adicionadas mais duas camadas: rate limit (janela fixa, 120 req/min, `429` acima disso) e confirmação obrigatória (`"confirmar": true` no payload) em ferramentas que incluem/alteram/excluem dado na Omie. Novo campo `destructive?: boolean` em `ToolDef` (`src/tools/types.ts`), marcado em `omie_op_incluir/alterar/excluir`, `omie_estoque_ajuste_incluir`, `omie_requisicao_compra_incluir`, `omie_pedido_compra_incluir`; `omie_chamar_api` detecta pelo prefixo do `call` (Incluir/Alterar/Excluir/Cancelar/Deletar). Testado manualmente: 400 sem confirmar, passa da checagem com confirmar, 429 a partir da 121ª requisição no minuto.
- **Decisões tomadas:** API key estática (não Basic Auth, não mTLS) é o mínimo suficiente pro estágio atual — uso local, single-user. Decisão tomada com o usuário via pergunta direta antes de implementar. Fica como base pra evoluir (ex: OAuth) se o servidor for exposto como Connector remoto no futuro — isso continua bloqueado por ora. Rate limit e confirmação foram escolhidos (entre as opções levantadas) como as camadas de maior retorno pro estágio atual — auditoria e chave por escopo (leitura/escrita) ficaram pra quando a escrita estiver em uso real.
- **Pendências / próximos passos:** com a autenticação mínima implantada, destravar os itens que dependiam dela: CRUD completo de clientes/fornecedores (hoje só leitura) e inclusão/consulta de contas a pagar/receber. MCP (stdio) em si não foi alterado — a lacuna de segurança era só na API HTTP.
- **Docs relacionadas:** [API](./API.md#autenticação-por-api-key-na-api-http-local-httpserverts), [API — rate limit e confirmação](./API.md#rate-limit-e-confirmação-obrigatória-em-operações-destrutivas-na-api-http-local), [Índice Geral](./GERAL.md)
