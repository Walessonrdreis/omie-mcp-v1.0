---
description: Consulta a estrutura/BOM real de produtos na Omie e mostra formatado — chama a API de verdade, diferente de /omie-skill:guia.
argument-hint: pedido em texto livre — ex: "estrutura do produto 100kg", "quais produtos têm estrutura cadastrada"
---

Objetivo: responder pergunta sobre estrutura (BOM/ficha técnica) de produto
com dado real da Omie, formatado — não documentação.

1. Se `$ARGUMENTS` estiver vazio, pergunte ao usuário qual produto (nome ou
   código) ele quer ver a estrutura — não adivinhe.
2. Ferramentas preferidas neste módulo (ver `cache/estrutura-de-produtos.md`
   pro schema completo — as duas de leitura já vêm enriquecidas, com nome
   de produto e de cada insumo resolvido, nada cru pra decodificar aqui):
   - **produto específico, buscando por nome/descrição ou código**: use
     `omie_estrutura_buscar_por_produto` (parâmetro `termo`) — é a mais
     direta, não exige saber o código Omie de antemão.
   - **listar todos os produtos que têm estrutura cadastrada**: use
     `omie_estrutura_listar` (aceita `filtros`, ex: por nome de produto).
3. Chame a ferramenta de verdade com o termo/código extraído do pedido.
4. Formate o resultado seguindo `referencia/formatacao-saida.md` — a lista
   de insumos de cada produto é um caso claro de "itens aninhados" (seção
   4): apresente como sublista sob o produto, com nome do insumo e
   quantidade, não como uma coluna só de array.

Se `omie_estrutura_buscar_por_produto` retornar mais de um produto (termo
ambíguo), mostre a lista de candidatos e peça pro usuário refinar — não
escolha um sozinho.

Só leitura: não chame `omie_estrutura_incluir`/`alterar`/`excluir` a partir
deste comando — se o pedido parecer pedir mudar a estrutura, diga que isso
precisa ser feito numa conversa normal.
