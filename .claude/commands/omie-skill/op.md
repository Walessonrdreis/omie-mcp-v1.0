---
description: Consulta Ordens de Produção reais na Omie e mostra formatado — chama a API de verdade, diferente de /omie-skill:guia.
argument-hint: pedido em texto livre — ex: "OPs em aberto", "OP 12345", "OPs do produto 100kg não concluídas"
---

Objetivo: responder pergunta sobre Ordens de Produção com dado real da
Omie, formatado — não documentação.

1. Se `$ARGUMENTS` estiver vazio, pergunte ao usuário se quer uma lista de
   OPs ou uma OP específica (código) — não adivinhe.
2. Ferramentas preferidas neste módulo (ver `cache/ordem-de-producao.md`
   pro schema completo):
   - **lista de OPs**: use `omie_op_listar_com_produto` — já vem com
     descrição/SKU do produto e o campo confiável `concluida`
     (true/false); prefira sempre a `omie_op_listar` cru (só devolve
     código de produto, sem descrição). Aceita `apenas_nao_concluidas` e
     `filtros` (ex: por nome de produto).
   - **uma OP específica**: use `omie_op_consultar` — mas essa vem
     parcialmente crua (`nCodProduto` sem descrição, `cEtapa` sem
     tradução). Resolva `nCodProduto` com `omie_produtos_consultar` se o
     usuário precisar do nome do produto, e trate `cEtapa` conforme a
     seção 3 de `referencia/formatacao-saida.md` (não invente o nome da
     etapa).
3. Chame a ferramenta de verdade com os parâmetros extraídos do pedido.
4. Formate o resultado seguindo `referencia/formatacao-saida.md` antes de
   responder — nunca devolva o JSON cru.

Só leitura: não chame `omie_op_incluir`/`alterar`/`excluir` a partir deste
comando — se o pedido parecer pedir criar/mudar uma OP, diga que isso
precisa ser feito numa conversa normal.
