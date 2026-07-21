# Documentação Viva — Índice Geral

> Toda implementação ou alteração relevante do projeto aparece aqui como uma linha, com link para o detalhe no(s) arquivo(s) de domínio correspondente(s) (`UX-UI.md`, `LOGICA.md`, `NEGOCIO.md`, `PADRAO-PROJETO.md`, `BANCO-DE-DADOS.md`, `FERRAMENTAS.md`, `API.md`).
>
> Não editar entradas passadas — apenas adicionar novas ao final. Para atualizações de algo já documentado, veja a regra "item novo x atualização" na skill `documentacao-viva`.

---

<!-- Novas entradas entram abaixo desta linha, em ordem cronológica -->

- [x] Autenticação por API key na API HTTP local — 2026-07-20 — [API](./API.md#autenticação-por-api-key-na-api-http-local-httpserverts)
- [x] Rate limit e confirmação obrigatória em operações destrutivas na API HTTP local — 2026-07-20 — [API](./API.md#rate-limit-e-confirmação-obrigatória-em-operações-destrutivas-na-api-http-local)
- [x] Gateway abstraído por interface + fake gateway + OMIE_MOCK — 2026-07-20 — [Padrão de Projeto](./PADRAO-PROJETO.md#gateway-abstraído-por-interface--fake-gateway--omie_mock)- [x] Filtro genérico client-side (shared/filtro.ts) — 2026-07-20 — [Padrão de Projeto](./PADRAO-PROJETO.md#filtro-genérico-client-side-sharedfiltrots) · [Lógica](./LOGICA.md#utilitário-aplicarfiltros-com-operadores-igualdiferentecontemmaior_quemenor_queentre-e-acesso-a-campo-aninhado-via-dot-path)
- [x] Módulo NF-e somente-leitura (produtos/nfconsultar) — 2026-07-20 — [API](./API.md#módulo-nf-e-somente-leitura-produtosnfconsultar-omie_nfe_listar-listarnf-paginação-filtro-por-datastatustipo--filtro-genérico-e-omie_nfe_consultar-consultarnf-por-chave-ou-código-com-itens-e-títulos-financeiros)
- [x] CRUD completo de Compras (Pedido de Compra + Requisição de Compra) — 2026-07-20 — [API](./API.md#crud-completo-de-compras-pedido-de-compra--requisição-de-compra-substituindo-o-antigo-passthrough-só-de-incluir-omie_pedido_compra_incluiralterarexcluirconsultarlistar-produtospedidocompra-e-omie_requisicao_compra_incluiralterarexcluirconsultarlistar-produtosrequisicaocompra)
- [x] Extrato de conta corrente — 2026-07-20 — [API](./API.md#extrato-de-conta-corrente-omie_extrato_conta_corrente_consultar-listarextrato-recurso-financasextrato--movimentos-e-saldos-anterioratualconciliadodisponível-de-uma-conta-corrente-num-período)
- [x] Boleto de contas a receber — 2026-07-20 — [API](./API.md#boleto-de-contas-a-receber-omie_contas_receber_boleto_gerarobterprorrogarcancelar-financascontareceberboleto-gerarboletoobterboletoprorrogarboletocancelarboleto)
- [x] Módulo PIX de contas a receber — 2026-07-20 — [API](./API.md#módulo-pix-de-contas-a-receber-omie_pix_listarobterobter_statusgerarcancelar-financaspix)
- [x] Módulo Orçamento de Caixa nativo — 2026-07-20 — [API](./API.md#módulo-orçamento-de-caixa-nativo-omie_orcamento_caixa_consultar-listarorcamentos-recurso-financascaixa--previsto-x-realizado-por-categoria-financeira-num-mêsano)
