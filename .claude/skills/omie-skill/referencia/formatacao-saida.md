# Como formatar a saída de uma ferramenta `omie_*` pro usuário

Este arquivo é sobre o **resultado** de uma chamada (o JSON que a Omie
devolve), não sobre os parâmetros de entrada — pra isso ver `cache/<modulo>.md`.
Escrito à mão, não gerado por `npm run skill-cache` (por isso mora em
`referencia/`, não em `cache/` — aquele diretório é apagado e reescrito do
zero a cada regeneração).

Regra geral: **o JSON cru nunca é a resposta final** pro usuário. Ele é um
passo intermediário — sempre traduza pra texto/tabela legível antes de
responder. Exceção: se o usuário pedir explicitamente o JSON puro ("manda o
json", "quero o payload cru"), aí mostre cru, sem formatar.

## 1. Prefira a tool já enriquecida quando existir

Várias ferramentas `omie_*` (tipo "use-case" no `cache/<modulo>.md`, muitas
vezes com nome `*_com_produto`, `*_com_cliente`, `*_com_estoque`,
`*_para_separar`) já devolvem campos com nome legível em português
(`descricaoProduto`, `quantidadeEmEstoque`, `cliente.razaoSocial`,
`valorTotalPedido`) em vez do bruto da Omie — a tradução já foi feita no
código do servidor. Nesses casos não tem o que decodificar: só formatar
(seção 3) e apresentar.

Sempre que o módulo tiver as duas versões (uma enriquecida e uma
passthrough crua do mesmo dado), prefira a enriquecida — ela já existe
exatamente pra evitar esse trabalho.

## 2. Campo cru (só quando a tool for passthrough ou faltar tradução)

Quando a tool chamada for `passthrough` (repassa `param` direto pra Omie,
sem lógica própria) ou o resultado ainda trouxer algum campo não traduzido,
use estas pistas, nessa ordem:

1. **Descrição do parâmetro de mesmo nome**: se `cache/<modulo>.md` já
   documenta um parâmetro de entrada com esse nome (ex: `nCodProduto` em
   `omie_op_incluir`), a descrição ali normalmente explica o campo — use-a.
2. **Prefixo húngaro da Omie** (heurística, não regra absoluta — nem todo
   módulo segue; alguns usam snake_case sem prefixo):
   - `n` = número (código Omie ou quantidade) — ex: `nCodProduto`, `nQtde`.
   - `c` = texto/código — ex: `cCodIntOP`, `cEtapa`.
   - `d` = data, já no formato `dd/mm/aaaa` da Omie — não precisa converter.
   - array/lista = subitens (ex: itens de pedido, insumos de estrutura) —
     vira sublista ou sub-tabela na resposta, não uma coluna só com "[...]".
3. **Wrapper de paginação**: campos tipo `pagina`/`total_de_paginas`/
   `registros`/`total_de_registros` (nomes variam por módulo — checar o que
   veio) não são dado de negócio — vira UMA linha de rodapé ("página 1 de 3,
   42 registros"), nunca uma coluna da tabela.

## 3. Exceção: não invente tradução pra código de conta

Alguns códigos são configuráveis por conta Omie e a API não expõe como
traduzi-los (ex: `cEtapa` de Ordem de Produção — kanban de 3 a 6 fases,
nomes definidos por cada empresa, sem endpoint pra consultar). Quando o
`cache/<modulo>.md` mencionar isso na descrição da tool (procure "sem
tradução", "configurável por conta"), mostre o código cru com uma nota,
nunca chute um nome pra ele. Ex: "Etapa: 40 (código configurável da conta,
sem tradução disponível via API)".

## 4. Formato de apresentação

- **Lista com 2+ registros**: tabela Markdown, cabeçalho em português,
  colunas com as 4-6 informações mais relevantes pro pedido do usuário (não
  precisa expor toda coluna que veio — mencione que há mais campos
  disponíveis se for informação claramente descartada).
- **Registro único (`*_consultar`) ou registro com itens aninhados** (ex:
  itens de um pedido, insumos de uma estrutura): bloco de campo/valor
  (`**Campo:** valor`), com os itens aninhados como sublista logo abaixo.
- **Moeda**: `R$ 1.234,56` (separador de milhar `.`, decimal `,`).
- **Booleano / S-N**: `Sim`/`Não`, nunca `true`/`false`/`S`/`N` cru.
- **Vazio**: se a consulta não retornar nada, diga isso claramente ("nenhum
  pedido encontrado nessa etapa") — não é erro, é resultado válido.

## 5. Nunca invente dado

Se a chamada da ferramenta falhar (erro de autenticação, rede, servidor MCP
não conectado) ou vier com erro da Omie, reporte o erro pro usuário tal como
veio — não simule um resultado plausível pra "não deixar a resposta vazia".
Isso vale mesmo sob pressão de tempo/token: um erro reportado é sempre
melhor que um dado inventado num sistema financeiro/de estoque real.
