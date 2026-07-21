# Padrão de Projeto — Documentação Viva

> Registro de decisões de arquitetura, padrões de design adotados, convenções de código e estrutura de pastas do projeto.
>
> Não editar entradas passadas — apenas adicionar novas ao final ou atualizar com o campo `**Atualizado em:**` quando indicado.

---

<!-- Novas entradas entram abaixo desta linha, em ordem cronológica -->

- [x] Gateway abstraído por interface + fake gateway + OMIE_MOCK: todo módulo em camadas (`src/modules/<nome>/`) que fala com a Omie tem um contrato (`domain/interfaces/<nome>-gateway.ts`), um gateway real que o implementa (`infrastructure/gateways/<nome>-omie-gateway.ts`) e um gateway fake em memória (`infrastructure/gateways/<nome>-fake-gateway.ts`); use cases dependem só da interface; tools em `presentation/mcp/*-tools.ts` escolhem qual implementação injetar via `process.env.OMIE_MOCK === "true"` (padrão: real)
  - **Data:** 2026-07-20 | **Autor:** Walesson
  - **Arquivos afetados:** todos os 9 módulos em `src/modules/` (`estoque`, `produtos`, `ordemProducao`, `pedidoVenda`, `clientesFornecedores`, `contasCorrentes`, `fluxoCaixa`, `contasPagar`, `contasReceber`)
  - **Motivo/contexto:** permitir testes automatizados (`vitest`, `npm run test`) e desenvolvimento/demonstração offline sem bater na API real da Omie (sem credencial, sem consumir rate limit), sem duplicar a lógica de negócio dos use cases — a interface é o único ponto de acoplamento entre lógica e integração externa
- [x] Filtro genérico client-side (`shared/filtro.ts`): utilitário reutilizável pra filtrar qualquer resultado enriquecido por critérios arbitrários (campo/operador/valor), complementando os filtros nativos da Omie
  - **Data:** 2026-07-20 | **Autor:** Walesson
  - **Arquivos afetados:** `src/shared/filtro.ts`, `src/modules/ordemProducao/application/dto/listar-ops-com-produto.dto.ts`, `src/modules/ordemProducao/application/use-cases/listar-ops-com-produto.ts`
  - **Motivo/contexto:** usuário pediu um sistema de filtro robusto nos módulos, cobrindo o máximo de busca possível. Decisão: combinar filtro nativo da Omie (server-side, rápido, mas limitado aos campos que a API expõe) com filtro genérico client-side (cobre qualquer campo do resultado já enriquecido — nome de cliente resolvido, descrição de produto, etc. — mas exige ter os dados em mãos primeiro). Piloto implementado em `omie_op_listar_com_produto` (dataset pequeno) antes de replicar pros demais módulos.
- [x] Camada de integração Omie isolada: move `omieClient.ts` de `src/` para `src/integrations/omie/`
  - **Data:** 2026-07-21 | **Autor:** Walesson
  - **Arquivos afetados:** `src/integrations/omie/omieClient.ts` (movido), ~52 arquivos de gateways/presentation/tools que importam `OmieClient` (paths atualizados)
  - **Motivo/contexto:** primeiro passo de uma reorganização maior — isolar tudo que é integração externa (API da Omie) numa camada própria, preparando o projeto para eventualmente virar uma lib reutilizável (`packages/omie-core`) por trás de múltiplas interfaces (MCP, HTTP). Refatoração pura de caminho, sem mudança de comportamento — `tsc --noEmit` limpo e 119 testes passando após a mudança.
