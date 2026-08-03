---
description: Consulta Pedidos de Venda reais na Omie e mostra formatado, com foco no que precisa ser separado/expedido — chama a API de verdade, diferente de /omie-skill:guia.
argument-hint: pedido em texto livre, opcional — ex: "o que precisa ser separado hoje", "pedido 12345", "pedidos do cliente X"
---

Objetivo: responder pergunta sobre Pedidos de Venda com dado real da Omie,
formatado — com foco especial no fluxo de separação/expedição (esse é o uso
mais comum deste comando).

1. **Se `$ARGUMENTS` estiver vazio, ou pedir algo como "o que precisa ser
   separado", "pendente de expedição", "pra despachar hoje"**: use
   `omie_pedido_venda_produtos_para_separar` (ver `cache/pedido-de-venda.md`)
   — é o caso de uso padrão deste comando. Ela já devolve os pedidos na
   etapa "Separar Estoque", cancelados removidos, com um resumo agregado
   por produto (quantidade total a separar, em quantos pedidos). Apresente
   os DOIS níveis: o resumo por produto primeiro (o que realmente importa
   pra quem vai separar), e a lista de pedidos/itens em seguida.

2. **Se o pedido mencionar uma etapa diferente** (ex: "pedidos pra faturar",
   "pedidos em aberto de qualquer etapa"): use
   `omie_pedido_venda_separar_estoque_listar` com outro `etapa_codigo`, ou
   `omie_pedido_venda_listar_com_cliente` (sem filtro de etapa) — ambas já
   vêm com cliente, itens e etapa por extenso resolvidos. Evite
   `omie_pedido_venda_listar` cru.

3. **Se o pedido mencionar um pedido específico** (número/código): use
   `omie_pedido_venda_consultar`.

4. Chame a ferramenta de verdade com os parâmetros extraídos do pedido.
5. Formate seguindo `referencia/formatacao-saida.md`: itens de cada pedido
   são "itens aninhados" (seção 4) — sublista sob o pedido/cliente, não uma
   coluna de array. Lembre que pedidos cancelados já vêm removidos por
   padrão nessas ferramentas (a Omie não reseta a etapa de um pedido
   cancelado) — não precisa avisar sobre isso a cada resposta, só se o
   usuário pedir explicitamente pra incluir cancelados
   (`incluir_cancelados=true`).

Só leitura: não chame `omie_pedido_venda_incluir`/`alterar`/`excluir` a
partir deste comando — se o pedido parecer pedir criar/mudar um pedido de
venda, diga que isso precisa ser feito numa conversa normal.
