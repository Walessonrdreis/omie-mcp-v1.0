---
description: Consulta produtos reais na Omie via skill omie-data (cache traduzido) — pergunta antes de atualizar dado antigo.
argument-hint: pedido em texto livre, ex: "lista de produtos" ou "produtos de bebida" (opcional)
---

Objetivo: responder sobre produtos usando o cache traduzido da skill
`omie-data`, perguntando ao usuário antes de buscar dado novo na Omie.

1. Garanta que o pacote está compilado: `npm --prefix packages/omie-data run build`
2. Se o pedido do usuário já expressa um filtro em linguagem natural,
   traduza direto pra flag e pule pro passo 4:
   - nome ou código do produto → `--busca <termo>`
   - categoria/família (ex.: "produtos de bebida") → `--categoria <termo>`
   - "ativos"/"inativos"/"descontinuados" → `--ativo sim` ou `--ativo nao`
   - Combine flags se o pedido tiver mais de um filtro.
3. Se não houver filtro claro no pedido, rode
   `node packages/omie-data/dist/cli.js produtos --ajuda` — sem TTY, o CLI
   imprime uma lista estática de filtros (não tenta abrir prompt). Leia
   essa lista e ofereça os filtros como opções pro usuário escolher (ex.:
   via pergunta com botões), sem reformular ou gerar a lista você mesmo —
   reaproveite o texto que o CLI devolveu.
4. Rode: `node packages/omie-data/dist/cli.js produtos [flags escolhidas]`
5. O CLI imprime uma linha JSON. Trate cada caso:
   - `{"status":"sem_credencial"}` → avise que não há credencial
     configurada e sugira rodar `/omie-data:configurar` primeiro. Pare
     aqui.
   - `{"status":"sem_dado", ...}` → se não havia filtro aplicado, avise
     que ainda não há produtos coletados pra essa credencial e pergunte
     se quer buscar agora. Se havia filtro aplicado, diga que nenhum
     produto bateu com esse filtro (não é a mesma coisa que "sem dado
     nenhum coletado" — confira se `--atualizar` já foi usado antes de
     sugerir buscar de novo).
   - `{"status":"dado_disponivel","produtos":[...],"geradoEm":"...","idadeMs":N}`
     → informe a idade do dado (converta `idadeMs` pra algo legível, ex:
     "coletado há 2 horas") e pergunte se o usuário quer usar esse dado
     como está ou atualizar antes de responder.
6. Se o usuário confirmar que quer buscar/atualizar, rode de novo com
   `--atualizar` mais as mesmas flags de filtro, e use o resultado dessa
   segunda chamada daqui pra frente.
7. Formate a lista final de produtos pro usuário (nome, código, categoria,
   valor formatado, ativo/inativo) — nunca devolva o JSON cru do CLI.
   Se `produtos` vier vazio mesmo com `status: dado_disponivel`, diga
   isso claramente ("nenhum produto encontrado"), não é erro.
