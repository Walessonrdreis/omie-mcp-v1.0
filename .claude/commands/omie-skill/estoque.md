---
description: Consulta estoque real na Omie (saldo total de um produto, ou movimentos) e mostra formatado — chama a API de verdade, diferente de /omie-skill:guia.
argument-hint: pedido em texto livre — ex: "estoque do produto 100kg", "movimentos do produto X em julho"
---

Objetivo: responder pergunta de estoque com dado real da Omie, formatado —
não documentação.

1. Se `$ARGUMENTS` estiver vazio, pergunte ao usuário qual produto (nome,
   SKU ou código) ele quer consultar — não adivinhe.
2. Ferramentas preferidas neste módulo (ver `cache/estoque.md` pro schema
   completo):
   - **"quanto tenho no total desse produto"** (sem mencionar local
     específico): use `omie_estoque_total_produto` — já soma todos os
     locais, não precisa cruzar nada.
   - **movimentação/histórico** (entradas/saídas num período): use
     `omie_estoque_movimentos_listar` (passthrough cru — aplique a seção 2
     de `referencia/formatacao-saida.md` pros nomes de campo).
3. Chame a ferramenta de verdade com os parâmetros extraídos do pedido do
   usuário (ex: código/nome do produto — se só tiver o nome, resolva o
   código via `omie_produtos_consultar` ou `omie_produtos_listar` primeiro).
4. Formate o resultado seguindo `referencia/formatacao-saida.md` antes de
   responder — nunca devolva o JSON cru.

Só leitura: não chame `omie_estoque_ajuste_incluir`/`excluir` a partir deste
comando, mesmo que o pedido pareça pedir um ajuste — nesse caso, diga que
isso precisa ser feito numa conversa normal (fora deste comando), já que
altera dado real.
