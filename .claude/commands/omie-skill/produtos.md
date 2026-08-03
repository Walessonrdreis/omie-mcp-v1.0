---
description: Consulta produtos reais na Omie (cadastro, com estoque) e mostra formatado — chama a API de verdade, diferente de /omie-skill:guia.
argument-hint: pedido em texto livre — ex: "dados do produto 100kg", "produtos da família X com estoque"
---

Objetivo: responder pergunta sobre produtos com dado real da Omie,
formatado — não documentação.

1. Se `$ARGUMENTS` estiver vazio, pergunte ao usuário o que ele quer ver
   (um produto específico, ou uma lista/família) — não adivinhe.
2. Ferramentas preferidas neste módulo (ver `cache/produtos.md` pro schema
   completo):
   - **lista de produtos** (com ou sem filtro de família): use
     `omie_produtos_listar_com_estoque` — já vem com quantidade e valor em
     estoque calculados; prefira sempre a `omie_produtos_listar` cru (que
     além de não ter estoque, o campo `quantidade_estoque` dela é
     conhecidamente não confiável — sempre vem 0).
   - **um produto específico**: use `omie_produtos_consultar` (passthrough
     cru — aplique a seção 2 de `referencia/formatacao-saida.md`).
3. Chame a ferramenta de verdade com os parâmetros extraídos do pedido
   (código/SKU/nome do produto, ou código de família via
   `omie_familias_listar` se o pedido mencionar uma família pelo nome).
4. Formate o resultado seguindo `referencia/formatacao-saida.md` antes de
   responder — nunca devolva o JSON cru.

Só leitura: não chame `omie_produtos_incluir`/`alterar`/`excluir` a partir
deste comando — se o pedido parecer pedir uma alteração de cadastro, diga
que isso precisa ser feito numa conversa normal.
