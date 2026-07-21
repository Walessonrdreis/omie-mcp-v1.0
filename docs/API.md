# API — Documentação Viva

> Registro de novos endpoints, mudanças de contrato e integrações com serviços externos do projeto.
>
> Não editar entradas passadas — apenas adicionar novas ao final ou atualizar com o campo `**Atualizado em:**` quando indicado.

---

<!-- Novas entradas entram abaixo desta linha, em ordem cronológica -->

- [x] Autenticação por API key na API HTTP local (httpServer.ts): toda rota exige header `Authorization: Bearer <HTTP_API_KEY>`, comparação com timing-safe equal; servidor recusa subir sem `HTTP_API_KEY` definida no `.env`
  - **Data:** 2026-07-20 | **Autor:** Walesson
  - **Arquivos afetados:** `src/httpServer.ts`, `scripts/gerar-api-key.mjs`, `.env.example`, `README.md`, `COMO_USAR.md`, `package.json`
  - **Motivo/contexto:** o `httpServer.ts` não tinha nenhuma camada de auth, o que bloqueava destravar CRUD de clientes/fornecedores e inclusão de contas a pagar/receber; API key estática é o mínimo necessário pro estágio atual (uso local, single-user), servindo de base pra evoluir depois se o servidor for exposto como Connector remoto

- [x] Rate limit e confirmação obrigatória em operações destrutivas na API HTTP local: middleware de janela fixa (120 req/min, `429` acima disso) e checagem que exige `"confirmar": true` no payload de qualquer ferramenta que inclui/altera/exclui dado na Omie, senão responde `400`
  - **Data:** 2026-07-20 | **Autor:** Walesson
  - **Arquivos afetados:** `src/httpServer.ts`, `src/tools/types.ts` (novo campo `destructive` em `ToolDef`), `src/tools/compras.ts`, `src/modules/estoque/presentation/mcp/estoque-tools.ts`, `src/modules/ordemProducao/presentation/mcp/ordemProducao-tools.ts`, `README.md`, `COMO_USAR.md`
  - **Motivo/contexto:** camadas adicionais pedidas pelo usuário depois da API key — rate limit protege contra brute-force da chave e loops travados martelando a Omie; confirmação evita chamada destrutiva acidental (script com bug, teste sem querer) nas ferramentas que já existem de incluir/alterar/excluir (OP, ajuste de estoque, requisição/pedido de compra) e no `omie_chamar_api` genérico (detectado por prefixo do nome do método: Incluir/Alterar/Excluir/Cancelar/Deletar)

- [x] Módulo NF-e somente-leitura (`produtos/nfconsultar`): `omie_nfe_listar` (`ListarNF`, paginação, filtro por data/status/tipo + filtro genérico) e `omie_nfe_consultar` (`ConsultarNF` por chave ou código, com itens e títulos financeiros)
  - **Data:** 2026-07-20 | **Autor:** Walesson
  - **Arquivos afetados:** `src/modules/nfe/` (módulo completo, padrão gateway+interface+fake+teste), `src/tools/registry.ts`, `README.md`, `FUNCIONALIDADES.md`
  - **Motivo/contexto:** primeiro item do gap-analysis de NF-e/fiscal (prioridade 1 levantada na sessão anterior). Pesquisa contra a doc oficial da Omie não encontrou endpoint de emissão de NF-e do zero (tipo `IncluirNFe`) — a API trata NF-e majoritariamente como consulta/importação de documento já processado pelo motor fiscal do ERP. Como nota fiscal emitida é documento com efeito legal (sem round-trip seguro de criar→testar→excluir, diferente dos demais módulos), decisão explícita do usuário foi implementar só consulta por enquanto; emissão/cancelamento fica pendente de investigação futura (endpoint real, certificado digital, módulo fiscal do plano Omie). Validado ao vivo contra a conta real (4765 notas, incluindo caso de nota cancelada).

- [x] CRUD completo de Compras (Pedido de Compra + Requisição de Compra), substituindo o antigo passthrough só-de-incluir: `omie_pedido_compra_incluir/alterar/excluir/consultar/listar` (`produtos/pedidocompra`) e `omie_requisicao_compra_incluir/alterar/excluir/consultar/listar` (`produtos/requisicaocompra`)
  - **Data:** 2026-07-20 | **Autor:** Walesson
  - **Arquivos afetados:** `src/modules/compras/` (módulo novo, substitui `src/tools/compras.ts` removido), `src/tools/registry.ts`, `README.md`, `FUNCIONALIDADES.md`
  - **Motivo/contexto:** o módulo Compras só tinha `IncluirRequisicaoCompra`/`IncluirPedidoCompra` como passthrough, sem Consultar/Alterar/Excluir/Listar — usuário pediu CRUD completo seguindo o padrão gateway+interface+fake+teste já consolidado. Achados reais validados ao vivo (round-trip completo com fornecedor/produto de teste descartáveis, sem deixar rastro): (1) em Pedido de Compra, `nCodCC` exige um código de **conta corrente** (`geral/contacorrente`), não de departamento/centro de custo como o nome sugere — usar código de departamento é recusado com "Conta Corrente não cadastrada"; (2) a listagem de pedidos (`PesquisarPedCompra`) esconde TODOS os pedidos por padrão, exigindo pedir explicitamente cada situação (pendente/faturado/recebido/cancelado/encerrado/parciais) — o gateway já pede tudo sempre; quando não há registros na página, a Omie devolve erro (`SOAP-ENV:Client-5113`) em vez de lista vazia, normalizado no gateway; (3) em Requisição de Compra, os campos de `IncluirReq`/`AlterarReq` vão direto na raiz do `param`, sem o wrapper `requisicaoCadastro: {...}` que a doc pública oficial sugere (recusado com erro de estrutura se usar o wrapper).

- [x] Extrato de conta corrente: `omie_extrato_conta_corrente_consultar` (`ListarExtrato`, recurso `financas/extrato`) — movimentos e saldos (anterior/atual/conciliado/disponível) de uma conta corrente num período
  - **Data:** 2026-07-20 | **Autor:** Walesson
  - **Arquivos afetados:** `src/modules/contasCorrentes/domain/interfaces/contas-correntes-gateway.ts`, `.../infrastructure/gateways/contas-correntes-omie-gateway.ts`, `.../contas-correntes-fake-gateway.ts`, `.../application/dto/extrato.dto.ts` (novo), `.../application/use-cases/consultar-extrato.ts` (novo) + teste, `.../presentation/mcp/contas-correntes-tools.ts`, `README.md`, `FUNCIONALIDADES.md`
  - **Motivo/contexto:** primeiro item do "Financeiro avançado" do gap-analysis — usuário pediu pra escolher e seguir sozinho enquanto ele dormia. Adicionado como nova capability do gateway já existente de `contasCorrentes` (em vez de módulo novo) por ser o mesmo domínio/recurso relacionado; reaproveita o padrão gateway+interface+fake já consolidado no módulo. Validado ao vivo contra a conta real (conta "CAIXA LOJA", período de 20 dias, movimentos com categoria/documento fiscal/conciliação reais).

- [x] Boleto de contas a receber: `omie_contas_receber_boleto_gerar/obter/prorrogar/cancelar` (`financas/contareceberboleto`: `GerarBoleto`/`ObterBoleto`/`ProrrogarBoleto`/`CancelarBoleto`)
  - **Data:** 2026-07-20 | **Autor:** Walesson
  - **Arquivos afetados:** `src/modules/contasReceber/domain/interfaces/contas-receber-gateway.ts`, `.../infrastructure/gateways/contas-receber-omie-gateway.ts`, `.../contas-receber-fake-gateway.ts`, `.../application/dto/boleto.dto.ts` (novo), `.../application/use-cases/boleto-crud.ts` (novo) + teste, `.../presentation/mcp/contas-receber-tools.ts`, `README.md`, `FUNCIONALIDADES.md`
  - **Motivo/contexto:** segundo item do "Financeiro avançado". Adicionado como nova capability do gateway já existente de `contasReceber` (mesmo padrão usado no extrato de conta corrente). **Achado importante ao vivo**: esta conta Omie não tem convênio bancário/boleto configurado — testado `ProrrogarBoleto` num título real (sem gerar boleto de fato) e a Omie recusou com "Não temos suporte para geração da remessa de pagamento para o banco -sem instituição-". Por prudência (documento financeiro real, sem certeza de reversibilidade segura), `GerarBoleto` NÃO foi testado ao vivo contra um título de cliente de produção — só `ObterBoleto`/`CancelarBoleto`/`ProrrogarBoleto` foram validados (todos com resposta seguros de "nenhum boleto gerado", sem side-effect real). Documentado no README que a funcionalidade de fato depende de configuração bancária que esta conta não tem.

- [x] Módulo PIX de contas a receber: `omie_pix_listar/obter/obter_status/gerar/cancelar` (`financas/pix`)
  - **Data:** 2026-07-20 | **Autor:** Walesson
  - **Arquivos afetados:** `src/modules/pix/` (módulo novo, padrão gateway+interface+fake+teste), `src/tools/registry.ts`, `README.md`, `FUNCIONALIDADES.md`
  - **Motivo/contexto:** terceiro item do "Financeiro avançado". Diferente de Boleto, esta conta Omie TEM PIX ativo e configurado — `ListarPix` retornou 379 registros reais, todos os métodos de leitura (`ListarPix`/`ObterPix`/`ObterStatusPix`) validados ao vivo contra a conta real. `GerarPix`/`CancelarPix` não foram testados ao vivo contra título de produção pelo mesmo motivo de prudência do Boleto (cobrança PIX real, sem round-trip seguro garantido).

- [x] Módulo Orçamento de Caixa nativo: `omie_orcamento_caixa_consultar` (`ListarOrcamentos`, recurso `financas/caixa`) — previsto x realizado por categoria financeira, num mês/ano
  - **Data:** 2026-07-20 | **Autor:** Walesson
  - **Arquivos afetados:** `src/modules/orcamentoCaixa/` (módulo novo, padrão gateway+interface+fake+teste), `src/tools/registry.ts`, `README.md`, `FUNCIONALIDADES.md`
  - **Motivo/contexto:** último item do "Financeiro avançado" do gap-analysis. Endpoint simples, só leitura, único método (`ListarOrcamentos`). Validado ao vivo contra a conta real (julho/2026, dezenas de categorias com valores reais de receita/despesa). Complementa (não substitui) `omie_fluxo_caixa_gerar`: este é o relatório pronto da Omie por categoria, aquele é calculado pelo MCP por conta corrente/dia a partir de contas a pagar/receber. Com este item concluído, o "Financeiro avançado" do gap-analysis está completo (extrato, boleto, PIX, orçamento de caixa).