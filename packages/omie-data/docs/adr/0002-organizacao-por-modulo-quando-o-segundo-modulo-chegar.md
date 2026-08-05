---
status: accepted
---

# Organização por módulo (não por camada técnica) quando o segundo módulo chegar; testes colocados, não em diretório separado

Hoje `packages/omie-data/src/` organiza os arquivos por camada técnica (`application/`, `domain/`, `infrastructure/`), o que funciona bem porque só existe um módulo de domínio (Produtos). Decidimos que, quando o segundo módulo chegar (ex.: Estoque), a estrutura muda para uma pasta por módulo — `src/modules/<modulo>/{application,domain}/` — em vez de continuar acumulando tudo dentro das mesmas pastas `application/`/`domain/` compartilhadas entre módulos. `infrastructure/` (banco, credenciais, cliente HTTP da Omie) continua compartilhado na raiz de `src/`, pois é transversal a todos os módulos, não pertence a nenhum um deles.

Essa reorganização é **adiada até o segundo módulo existir de fato** — reestruturar agora, com um módulo só, seria over-engineering sem benefício imediato (custo de mover arquivos e quebrar imports sem nenhum problema real sendo resolvido ainda).

**Testes continuam colocados junto do arquivo que testam** (`consultar-produtos.ts` + `consultar-produtos.test.ts` na mesma pasta), inclusive depois da reorganização por módulo — não passam a viver num diretório `tests/` separado. Alternativa considerada e rejeitada: `tests/` espelhando a árvore de `src/`, descartada porque duplica a navegação de pastas sem ganho real neste tamanho de projeto, e colocation garante que teste e código se movem juntos quando um arquivo é movido ou renomeado (menor risco de teste órfão ou desatualizado).
