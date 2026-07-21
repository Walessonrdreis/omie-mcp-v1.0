# Lógica — Documentação Viva

> Registro de toda implementação e alteração de algoritmos, funções, cálculos, validações técnicas e regras internas de lógica do projeto.
>
> Não editar entradas passadas — apenas adicionar novas ao final ou atualizar com o campo `**Atualizado em:**` quando indicado.

---

<!-- Novas entradas entram abaixo desta linha, em ordem cronológica -->
- [x] Utilitário `aplicarFiltros` com operadores igual/diferente/contem/maior_que/menor_que/entre e acesso a campo aninhado via dot-path
  - **Data:** 2026-07-20 | **Autor:** Walesson
  - **Arquivos afetados:** `src/shared/filtro.ts`, `src/shared/filtro.test.ts`
  - **Motivo/contexto:** base do sistema de filtro robusto — função pura, tipada com Zod (`criterioFiltroSchema`/`filtrosParamSchema`), testada isoladamente (9 casos) antes de aplicar em qualquer use-case.
