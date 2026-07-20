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