---
description: Consulta produtos reais na Omie via skill omie-data (cache traduzido) — pergunta antes de atualizar dado antigo.
argument-hint: pedido em texto livre, ex: "lista de produtos" (opcional)
---

Objetivo: responder sobre produtos usando o cache traduzido da skill
`omie-data`, perguntando ao usuário antes de buscar dado novo na Omie.

1. Garanta que o pacote está compilado: `npm --prefix packages/omie-data run build`
2. Rode: `node packages/omie-data/dist/cli.js produtos`
3. O CLI imprime uma linha JSON. Trate cada caso:
   - `{"status":"sem_credencial"}` → avise que não há credencial
     configurada e sugira rodar `/omie-data:configurar` primeiro. Pare
     aqui.
   - `{"status":"sem_dado", ...}` → avise que ainda não há produtos
     coletados pra essa credencial e pergunte se quer buscar agora.
   - `{"status":"dado_disponivel","produtos":[...],"geradoEm":"...","idadeMs":N}`
     → informe a idade do dado (converta `idadeMs` pra algo legível, ex:
     "coletado há 2 horas") e pergunte se o usuário quer usar esse dado
     como está ou atualizar antes de responder.
4. Se o usuário confirmar que quer buscar/atualizar, rode:
   `node packages/omie-data/dist/cli.js produtos --atualizar`
   e use o resultado dessa segunda chamada daqui pra frente.
5. Formate a lista final de produtos pro usuário (nome, código, categoria,
   valor formatado, ativo/inativo) — nunca devolva o JSON cru do CLI.
   Se `produtos` vier vazio mesmo com `status: dado_disponivel`, diga
   isso claramente ("nenhum produto encontrado"), não é erro.
