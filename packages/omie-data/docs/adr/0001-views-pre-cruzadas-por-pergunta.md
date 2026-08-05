---
status: accepted
---

# Views pré-cruzadas por pergunta do usuário, não por recurso da Omie

O `omie-data` espelha recursos da Omie em Dados Brutos (`raw_*`, um por recurso) e os expõe via Views (`view_*`). Decidimos que uma View representa **uma pergunta que o usuário faz** e é montada com todos os dados que essa resposta precisa — mesmo que venham de mais de um Dado Bruto — em vez de existir uma View por recurso da Omie (o que exigiria o CLI ou o usuário cruzar múltiplas Views manualmente, ex.: buscar produto por nome e depois estoque por código).

Concretamente: quando o módulo de estoque existir, `view_produtos` vai incluir a quantidade via join com `raw_estoque` na Tradução — não vai existir uma `view_estoque` separada para esse caso de uso. Alternativa considerada e rejeitada: uma View por Dado Bruto (mais perto do modelo de recursos da Omie), descartada porque o objetivo do `omie-data` é responder perguntas offline de forma direta, e empurrar o cruzamento pro momento da Consulta (ou pro usuário) contradiz isso.
