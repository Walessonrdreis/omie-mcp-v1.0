# API — Documentação Viva

> Registro de novos endpoints, mudanças de contrato e integrações com serviços externos do projeto.
>
> Não editar entradas passadas — apenas adicionar novas ao final ou atualizar com o campo `**Atualizado em:**` quando indicado.

---

<!-- Novas entradas entram abaixo desta linha, em ordem cronológica -->

- [x] Autenticação por API key na API HTTP local (httpServer.ts): toda rota exige header `Authorization: Bearer <HTTP_API_KEY>`, comparação com timing-safe equal; servidor recusa subir sem `HTTP_API_KEY` definida no `.env`
  - **Data:** 2026-07-20 | **Autor:** Walesson
  - **Arquivos afetados:** `src/httpServer.ts`, `scripts/gerar-api-key.mjs`, `.env.example`, `README.md`, `COMO_USAR.md`, `package.json`
  - **Motivo/contexto:** o `httpServer.ts` não tinha nenhuma camada de auth, o que bloqueava destravar CRUD de clientes/fornecedores e inclusão de contas a pagar/receber; API key estática é o mínimo necessário pro estágio atual (uso local, single-user), servindo de base pra evoluir depois se o servidor for exposto como Connector remoto

- [x] Rate limit e confirmação obrigatória em operações destrutivas na API HTTP local: middleware de janela fixa (120 req/min, `429` acima disso) e checagem que exige `"confirmar": true` no payload de qualquer ferramenta que inclui/altera/exclui dado na Omie, senão responde `400`
  - **Data:** 2026-07-20 | **Autor:** Walesson
  - **Arquivos afetados:** `src/httpServer.ts`, `src/tools/types.ts` (novo campo `destructive` em `ToolDef`), `src/tools/compras.ts`, `src/modules/estoque/presentation/mcp/estoque-tools.ts`, `src/modules/ordemProducao/presentation/mcp/ordemProducao-tools.ts`, `README.md`, `COMO_USAR.md`
  - **Motivo/contexto:** camadas adicionais pedidas pelo usuário depois da API key — rate limit protege contra brute-force da chave e loops travados martelando a Omie; confirmação evita chamada destrutiva acidental (script com bug, teste sem querer) nas ferramentas que já existem de incluir/alterar/excluir (OP, ajuste de estoque, requisição/pedido de compra) e no `omie_chamar_api` genérico (detectado por prefixo do nome do método: Incluir/Alterar/Excluir/Cancelar/Deletar)