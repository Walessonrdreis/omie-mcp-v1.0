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