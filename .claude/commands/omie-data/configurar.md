---
description: Configura a credencial da Omie (App Key/App Secret) usada pela skill omie-data — valida contra a API antes de salvar.
argument-hint: opcional — "app-key SUA_KEY app-secret SEU_SECRET"; se omitido, pergunta os dois valores
---

Objetivo: configurar (ou trocar) a credencial que a skill `omie-data` usa
pra buscar dados reais da Omie.

1. Se `$ARGUMENTS` já trouxer App Key e App Secret, use-os. Senão, pergunte
   ao usuário um de cada vez, nesta ordem — nunca peça os dois na mesma
   pergunta:
   - "App Key: ..."
   - "App Secret: ..."
2. Garanta que o pacote está compilado antes de rodar o CLI:
   `npm --prefix packages/omie-data run build`
3. Rode o CLI com os valores coletados:
   `node packages/omie-data/dist/cli.js configurar --app-key "<APP_KEY>" --app-secret "<APP_SECRET>"`
4. O CLI imprime uma linha JSON:
   - `{"status":"ok","hash":"..."}` → avise o usuário que a credencial foi
     validada e salva com sucesso.
   - `{"status":"invalido","erro":"..."}` → mostre o erro reportado pela
     Omie e pergunte se o usuário quer tentar de novo com outros valores.
5. Nunca imprima o App Secret de volta pro usuário depois de configurado
   (evite ecoar segredo na conversa desnecessariamente).
