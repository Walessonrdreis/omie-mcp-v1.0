# Graph Report - .  (2026-08-03)

## Corpus Check
- Large corpus: 1026 files � ~285,814 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 4563 nodes · 10369 edges · 324 communities (247 shown, 77 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 136 edges (avg confidence: 0.76)
- Token cost: 0 input · 821,015 output

## Community Hubs (Navigation)
- Product Catalog Production-Ready
- Product Structure CRUD DTOs
- Product Stock Fake Stores
- Product Characteristics CRUD
- Boleto & Accounts Receivable
- PIX Payment Operations
- Production Order Commands
- Intelligent Job Polling Service
- Cliente CRUD Operations
- Production Order Sales Aggregation
- Stock Adjustment Operations
- Repo Metrics Reference Renderer
- Omie Code Backfill & Adapter
- NF-e Query Operations
- Command Callback Schemas
- Production Order Sync Pipeline
- Nota de Entrada Queries
- Customer Sync (All Customers)
- Pedido de Compra CRUD
- Categoria & Departamento DTOs
- Integration Modules Curl Reference
- Module Template & Routes Docs
- Production Order Read Model Builder
- Cadastros Auxiliares Gateway
- Ordem de Serviço CRUD
- omie-mcp Package Manifest
- Serviço CRUD Operations
- Product Structure Apply/Delete Flow
- Requisição de Compra CRUD
- Pedido de Venda Gateway
- NFS-e / LC116 Operations
- apps/api Package Scripts
- Production Manager API Contract
- Product Stock Domain Mapping
- omie-mcp HTTP Server & Auth
- Conta Corrente CRUD
- Metrics Markdown Renderer
- Sync-All Use Cases (Cross-Module)
- CRM Oportunidade CRUD
- Pedido CRUD DTOs
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141
- Community 142
- Community 143
- Community 144
- Community 145
- Community 146
- Community 147
- Community 148
- Community 149
- Community 150
- Community 151
- Community 152
- Community 153
- Community 154
- Community 155
- Community 156
- Community 157
- Community 158
- Community 159
- Community 160
- Community 161
- Community 162
- Community 163
- Community 164
- Community 165
- Community 166
- Community 167
- Community 168
- Community 169
- Community 170
- Community 171
- Community 172
- Community 173
- Community 174
- Community 175
- Community 176
- Community 177
- Community 178
- Community 179
- Community 180
- Community 181
- Community 182
- Community 183
- Community 184
- Community 185
- Community 186
- Community 187
- Community 188
- Community 189
- Community 190
- Community 191
- Community 192
- Community 193
- Community 194
- Community 195
- Community 196
- Community 197
- Community 198
- Community 199
- Community 200
- Community 201
- Community 202
- Community 203
- Community 204
- Community 206
- Community 207
- Community 209
- Community 210
- Community 211
- Community 212
- Community 213
- Community 214
- Community 215
- Community 216
- Community 217
- Community 218
- Community 219
- Community 220
- Community 221
- Community 222
- Community 223
- Community 224
- Community 225
- Community 226
- Community 227
- Community 228
- Community 229
- Community 230
- Community 231
- Community 232
- Community 233
- Community 235
- Community 236
- Community 237
- Community 238
- Community 239
- Community 241
- Community 242
- Community 243
- Community 244
- Community 245
- Community 246
- Community 247
- Community 248
- Community 250
- Community 251
- Community 252
- Community 257
- Community 258
- Community 289
- Community 290
- Community 291
- Community 292
- Community 293
- Community 294
- Community 295
- Community 296
- Community 297
- Community 298
- Community 299
- Community 300
- Community 301
- Community 302
- Community 303
- Community 304
- Community 305
- Community 306
- Community 307
- Community 308
- Community 309
- Community 310
- Community 311
- Community 312
- Community 313
- Community 314
- Community 315
- Community 316
- Community 317
- Community 318
- Community 319
- Community 320
- Community 321
- Community 322
- Community 323

## God Nodes (most connected - your core abstractions)
1. `OmieClient` - 84 edges
2. `getLogger()` - 82 edges
3. `OmieHttpClientPort` - 70 edges
4. `prisma` - 67 edges
5. `env` - 61 edges
6. `aplicarFiltros()` - 55 edges
7. `ToolDef` - 42 edges
8. `scripts` - 39 edges
9. `enqueueJob()` - 39 edges
10. `ProductionOrderCommandStore` - 37 edges

## Surprising Connections (you probably didn't know these)
- `production-orders module` --semantically_similar_to--> `omie_op_incluir`  [INFERRED] [semantically similar]
  apps/api/ALL_ROUTES.md → .claude/skills/omie-skill/cache/ordem-de-producao.md
- `product-stock-fetch module` --semantically_similar_to--> `omie_produtos_listar_com_estoque`  [INFERRED] [semantically similar]
  apps/api/ALL_ROUTES.md → .claude/skills/omie-skill/cache/produtos.md
- `pnpm workspace: apps/*` --conceptually_related_to--> `src/httpServer.ts`  [AMBIGUOUS]
  pnpm-workspace.yaml → docs/API.md
- `sales-order-sync module` --semantically_similar_to--> `omie_pedido_venda_listar`  [INFERRED] [semantically similar]
  apps/api/ALL_ROUTES.md → .claude/skills/omie-skill/cache/pedido-de-venda.md
- `product-manager module` --semantically_similar_to--> `omie_produtos_incluir`  [INFERRED] [semantically similar]
  apps/api/ALL_ROUTES.md → .claude/skills/omie-skill/cache/produtos.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Read-only formatted-query commands using formatacao-saida.md** — claude_commands_omie_skill_estoque, claude_commands_omie_skill_produtos, claude_commands_omie_skill_op, claude_commands_omie_skill_estrutura, claude_commands_omie_skill_pedidos, omie_mcp_referencia_formatacao_saida [EXTRACTED 0.95]
- **Skill cache generation/verification flow (registry.ts -> generator -> cache -> manifest)** — omie_mcp_src_tools_registry, omie_mcp_scripts_gerar_skill_cache, claude_skills_omie_skill_cache_index, omie_mcp_manifest_json, claude_commands_omie_skill_atualizar_cache, claude_commands_omie_skill_verificar_cache [EXTRACTED 0.95]
- **CRM opportunity creation flow (conta -> contato -> oportunidade with solucao/origem)** — claude_skills_omie_skill_cache_crm_omie_crm_conta_incluir, claude_skills_omie_skill_cache_crm_omie_crm_contato_incluir, claude_skills_omie_skill_cache_crm_omie_crm_oportunidade_incluir, claude_skills_omie_skill_cache_crm_omie_crm_solucoes_listar, claude_skills_omie_skill_cache_crm_omie_crm_origens_listar [EXTRACTED 0.90]
- **omie-mcp documentado em três camadas: código-fonte (README), skill cacheada (cache/*.md) e guia operacional (COMO_USAR.md)** — readme_omie_mcp, readme_omie_mcp_omie_skill_dir, claude_skills_omie_skill_referencia_formatacao_saida, como_usar, funcionalidades [INFERRED 0.85]
- **Fluxo de sincronização do catálogo de produtos: comando de integração -> read-model técnico -> endpoint de contrato de produção** — apps_api_all_routes_product_catalog, apps_api_readme_product_catalog_module, apps_api_routes_product_catalog_module, apps_api_routes_production_ready_endpoint [INFERRED 0.85]
- **Bug de refresh de estoque Omie: sintoma no endpoint, causa raiz no Prisma, correção no modelo ProductStock** — apps_api_update_summary_2026_04_14_stock_refresh_bug, apps_api_update_summary_2026_04_14_product_stock_model, apps_api_development_workflow_prisma [INFERRED 0.75]
- **Legacy-to-Modular Migration Pattern (job/service/lock triad)** — apps_api_docs_legado_vs_atual_legacy_jobs_stockrefresh_job, apps_api_docs_legado_vs_atual_modules_products_infrastructure_jobs_stock_refresh_job, apps_api_docs_legado_vs_atual_sync_in_progress_lock_pattern [INFERRED 0.85]
- **production-ready Read-Model Dependency Cascade** — apps_api_docs_resumo_projeto_modulos_integracao_product_catalog, apps_api_docs_resumo_projeto_modulos_integracao_product_stock_fetch, apps_api_docs_resumo_projeto_modulos_integracao_product_structure, apps_api_docs_resumo_projeto_modulos_integracao_sales_order_sync [EXTRACTED 1.00]
- **Search UX Pipeline (normalize/tokenize/detect/score)** — apps_api_docs_search_ux_normalize, apps_api_docs_search_ux_tokenize, apps_api_docs_search_ux_detectquerytype, apps_api_docs_search_ux_score [EXTRACTED 1.00]
- **Omie product/stock sync pipeline** — apps_api_docs_typedoc_core_syncomieproductsservice_classes_syncomieproductsservice_syncomieproductsservice, apps_api_docs_typedoc_integrations_omie_omieadapter_classes_omieadapter_omieadapter, apps_api_docs_typedoc_integrations_omie_omieclient_classes_omieclient_omieclient, apps_api_docs_typedoc_db_variables_prisma_prisma [INFERRED 0.75]
- **Omie stock cache refresh flow feeding public product contract** — apps_api_docs_typedoc_integrations_omie_omiestockcache_classes_omiestockcache_omiestockcache, apps_api_docs_typedoc_integrations_omie_omieclient_variables_omieclient_omieclient, apps_api_docs_templates_readme_template_productstock_cache, apps_api_docs_templates_readme_template_public_products_endpoint [INFERRED 0.70]
- **env config consumed across app bootstrap and Omie integration** — apps_api_docs_typedoc_env_variables_env_env, apps_api_docs_typedoc_app_functions_buildapp_buildapp, apps_api_docs_typedoc_integrations_omie_omieclient_classes_omieclient_omieclient [INFERRED 0.65]
- **Fastify Background Job Startup Pattern** — apps_api_docs_typedoc_jobs_omieproductsync_job_functions_startomieproductsyncjob_startomieproductsyncjob, apps_api_docs_typedoc_jobs_stockrefresh_job_functions_startstockrefreshjob_startstockrefreshjob, apps_api_docs_typedoc_lib_logger_readme [INFERRED 0.75]
- **HTTP Response Formatting Helpers** — apps_api_docs_typedoc_lib_http_functions_ok_ok, apps_api_docs_typedoc_lib_http_functions_paginated_paginated, apps_api_docs_typedoc_lib_http_functions_sendok_sendok, apps_api_docs_typedoc_lib_http_functions_sendpaginated_sendpaginated [EXTRACTED 0.95]
- **Manufacturing Domain Repositories** — apps_api_docs_typedoc_repositories_planrepository_classes_planrepository_planrepository, apps_api_docs_typedoc_repositories_productrepository_classes_productrepository_productrepository, apps_api_docs_typedoc_repositories_sectorrepository_classes_sectorrepository_sectorrepository [INFERRED 0.75]
- **Plan Creation Flow (route -> service -> repositories)** — apps_api_src_routes_plans_plansroutes, apps_api_src_services_createplanitemservice_createplanitemservice, apps_api_src_repositories_planrepository_planrepository, apps_api_src_repositories_productrepository_productrepository, apps_api_src_repositories_sectorrepository_sectorrepository [INFERRED 0.75]
- **App Route Registration (appRoutes registers all module routes)** — apps_api_src_routes_index_approutes, apps_api_src_routes_omie_omieroutes, apps_api_src_routes_plans_plansroutes, apps_api_src_routes_product_sector_productsectorroutes, apps_api_src_routes_products_productsroutes, apps_api_src_routes_sectors_sectorroutes [INFERRED 0.85]
- **Product Default Sector Assignment Flow** — apps_api_src_routes_product_sector_productsectorroutes, apps_api_src_services_setproductdefaultsectorservice_setproductdefaultsectorservice, apps_api_src_repositories_productrepository_productrepository, apps_api_src_repositories_sectorrepository_sectorrepository [INFERRED 0.75]
- **Domain Error Class Hierarchy** — apps_api_src_utils_domainerrors_apperror, apps_api_src_utils_domainerrors_notfounderror, apps_api_src_utils_domainerrors_conflicterror, apps_api_src_utils_domainerrors_validationerror, apps_api_src_utils_domainerrors_missingdefaultsectorerror [EXTRACTED 1.00]
- **Omie Product/Stock Sync and Read Pipeline** — apps_api_src_services_omieproductsync_service_runomieproductsync, apps_api_src_services_omieproductread_service_listomieproductswithcurrentstock, apps_api_src_services_omiestock_service_getstockbyrawpayload, apps_api_src_services_stockrefresh_service_runstockrefresh [INFERRED 0.75]
- **Public Products Read API** — apps_api_src_services_publicproductsread_service_listpublicproducts, apps_api_src_services_publicproductsread_service_getpublicproductbycode, apps_api_src_services_publicproductsread_service_publicproduct, apps_api_src_services_publicproductsread_service_listpublicproductsparams [EXTRACTED 1.00]
- **Integration modules following Real/Fake gateway hexagonal (ports-and-adapters) pattern** — module_customer_sync, module_product_catalog, module_product_stock_fetch, module_product_structure, module_production_orders, module_sales_order_sync [INFERRED 0.85]
- **Modules sharing Command Store + externalRequestId idempotency pattern** — module_customer_sync, module_product_catalog, module_product_structure, module_production_orders, module_sales_order_sync [INFERRED 0.80]
- **Modules aligned with the Omie→Sistema canonical field-mapping convention** — module_product_structure, module_production_orders, module_product_stock_fetch, module_product_catalog [INFERRED 0.75]
- **Camadas de segurança da API HTTP local (auth + bind + rate limit + confirmação)** — security_api_key_auth, security_bind_localhost, security_rate_limit, security_confirmacao_destrutiva [EXTRACTED 1.00]
- **Módulos-piloto do padrão gateway+interface+fake+OMIE_MOCK** — module_estoque, module_produtos, module_ordem_producao, pattern_gateway_interface_fake [EXTRACTED 1.00]
- **Pré-requisitos de cadastro para criar Oportunidade de CRM** — tool_omie_crm_oportunidade_incluir, tool_omie_crm_solucoes_listar, tool_omie_crm_origens_listar [EXTRACTED 1.00]

## Communities (324 total, 77 thin omitted)

### Community 0 - "Product Catalog Production-Ready"
Cohesion: 0.05
Nodes (47): asRecord(), extractCost(), extractSalePrice(), extractUnit(), getNumber(), getString(), RefreshProductCatalogProductionReadyUseCase, ProductCatalogProductionReadyReadModelStore (+39 more)

### Community 1 - "Product Structure CRUD DTOs"
Cohesion: 0.06
Nodes (38): AlterarEstruturaParam, alterarEstruturaParamSchema, ExcluirEstruturaParam, excluirEstruturaParamSchema, IncluirEstruturaParam, incluirEstruturaParamSchema, itemParaAlterarSchema, itemParaIncluirSchema (+30 more)

### Community 2 - "Product Stock Fake Stores"
Cohesion: 0.05
Nodes (26): CommandRecord, FakeProductStockCommandStore, FakeProductStockIntegrationStore, StockRecord, CreateAcceptedCommandInput, ProductStockCommandStore, ProductStockIntegrationStore, buildUseCase() (+18 more)

### Community 3 - "Product Characteristics CRUD"
Cohesion: 0.07
Nodes (31): AlterarCaracteristicaParam, alterarCaracteristicaParamSchema, CaracteristicaResult, ConsultarCaracteristicaParam, consultarCaracteristicaParamSchema, ExcluirCaracteristicaParam, excluirCaracteristicaParamSchema, IncluirCaracteristicaParam (+23 more)

### Community 4 - "Boleto & Accounts Receivable"
Cohesion: 0.07
Nodes (27): BoletoResult, CancelamentoBoletoResult, CodigoTituloParam, codigoTituloParamSchema, ProrrogarBoletoParam, prorrogarBoletoParamSchema, ContaReceber, ListarContasReceberParam (+19 more)

### Community 5 - "PIX Payment Operations"
Cohesion: 0.07
Nodes (31): CancelarPixParam, cancelarPixParamSchema, CodigoTituloPixParam, codigoTituloPixParamSchema, GerarPixParam, gerarPixParamSchema, ListarPixParam, listarPixParamSchema (+23 more)

### Community 6 - "Production Order Commands"
Cohesion: 0.06
Nodes (29): ProcessCancelProductionOrderData, ProcessChangeStageProductionOrderData, ProcessCreateProductionOrderData, InvalidateRequestDTO, InvalidateResponseDTO, ReconcileRequestDTO, ReconcileResponseDTO, RetryFailedRequestDTO (+21 more)

### Community 7 - "Intelligent Job Polling Service"
Cohesion: 0.06
Nodes (27): Logger, IntelligentPollingService, PollingJobConfig, PollingJobHandler, PollingJobResult, PollingJobStatus, mockLogger, DEFAULT_POLLING_CONFIGS (+19 more)

### Community 8 - "Cliente CRUD Operations"
Cohesion: 0.09
Nodes (22): AlterarClienteParam, alterarClienteParamSchema, ExcluirClienteParam, excluirClienteParamSchema, IncluirClienteParam, incluirClienteParamSchema, tagSchema, AlterarClienteUseCase (+14 more)

### Community 9 - "Production Order Sales Aggregation"
Cohesion: 0.07
Nodes (17): logger, env, ProductCatalogSalesOrderAggregationStore, ProductionOrderQueryGateway, ProductionOrderDetailResult, ProductionOrderListFilters, ProductionOrderListResult, ProductionOrderQueryStore (+9 more)

### Community 10 - "Stock Adjustment Operations"
Cohesion: 0.08
Nodes (21): ExcluirAjusteEstoqueParam, excluirAjusteEstoqueParamSchema, IncluirAjusteEstoqueParam, incluirAjusteEstoqueParamSchema, EstoqueTotalProdutoParam, estoqueTotalProdutoParamSchema, EstoqueTotalProdutoResult, ConsultarEstoqueTotalProdutoUseCase (+13 more)

### Community 11 - "Repo Metrics Reference Renderer"
Cohesion: 0.09
Nodes (46): ensureDir(), extractEndpoints(), extractExports(), extractImports(), FILES_DIR, groupByTopFolder(), guessRole(), IGNORE_DIRS (+38 more)

### Community 12 - "Omie Code Backfill & Adapter"
Cohesion: 0.06
Nodes (36): main(), findNestedValue(), hasValue(), isPlainObject(), OmieAdapter, OmieProductDTO, PlainObject, stringifyScalar() (+28 more)

### Community 13 - "NF-e Query Operations"
Cohesion: 0.10
Nodes (25): ConsultarNfeParam, consultarNfeParamSchema, ItemNotaFiscal, ListarNfeParam, listarNfeParamSchema, ListarNfeResult, NotaFiscalDetalhe, NotaFiscalResumo (+17 more)

### Community 14 - "Command Callback Schemas"
Cohesion: 0.04
Nodes (48): CallbackResponseSchema, CommandAcceptedResponse, CommandAcceptedResponseSchema, ConfirmCallbackParamsSchema, FailCallbackBodySchema, FailureItemSchema, FailuresResponseSchema, InternalErrorResponse (+40 more)

### Community 15 - "Production Order Sync Pipeline"
Cohesion: 0.08
Nodes (23): main(), SyncAllProductionOrdersRequestDTO, SyncAllProductionOrdersResponseDTO, SyncIncrementalRequestDTO, SyncIncrementalResponseDTO, ProductionOrderConsultGateway, ProductionOrderConsultResult, ProductionOrderSyncPageGateway (+15 more)

### Community 16 - "Nota de Entrada Queries"
Cohesion: 0.10
Nodes (26): ConsultarNotaEntradaParam, consultarNotaEntradaParamSchema, ItemNotaEntrada, ListarNotaEntradaParam, listarNotaEntradaParamSchema, ListarNotaEntradaResult, NotaEntradaDetalhe, NotaEntradaResumo (+18 more)

### Community 17 - "Customer Sync (All Customers)"
Cohesion: 0.10
Nodes (23): SyncAllCustomersRequestDTO, SyncAllCustomersResponseDTO, CustomerFetchPageGateway, CustomerFetchPageInput, CustomerFetchPageResult, CommandStoreContract, IntegrationStoreContract, SyncAllCustomersCommand (+15 more)

### Community 18 - "Pedido de Compra CRUD"
Cohesion: 0.09
Nodes (25): AlterarPedidoCompraParam, alterarPedidoCompraParamSchema, ConsultarPedidoCompraParam, consultarPedidoCompraParamSchema, ExcluirPedidoCompraParam, excluirPedidoCompraParamSchema, IncluirPedidoCompraParam, incluirPedidoCompraParamSchema (+17 more)

### Community 19 - "Categoria & Departamento DTOs"
Cohesion: 0.09
Nodes (25): alterarCategoriaParamSchema, consultarCategoriaParamSchema, incluirCategoriaParamSchema, listarCategoriasParamSchema, AlterarDepartamentoParam, alterarDepartamentoParamSchema, ConsultarDepartamentoParam, consultarDepartamentoParamSchema (+17 more)

### Community 20 - "Integration Modules Curl Reference"
Cohesion: 0.06
Nodes (43): Curl Commands — Módulos de Integração, customer-sync module (curl reference), product-catalog module (curl reference), product-stock-fetch module (curl reference), product-structure module (curl reference), production-orders module (curl reference), sales-order-sync module (curl reference), ESTRUTURA_PROJETO (Complete Directory Tree) (+35 more)

### Community 21 - "Module Template & Routes Docs"
Cohesion: 0.07
Nodes (40): Comandos de terminal — scripts em apps/api/scripts, Template Oficial de Módulo de Integração, CustomerCommandStore (customer_command), OmieCustomerStore (omie_customer), customer-sync Routes.md, customer-sync module README, product-catalog Routes.md, product_catalog_production_ready_read_model (+32 more)

### Community 22 - "Production Order Read Model Builder"
Cohesion: 0.06
Nodes (30): buildAlerts(), buildCatalogBridge(), buildProductionOrderReadModel(), calculateFlags(), calculateMaterialStatus(), calculatePriority(), calculateReadiness(), CatalogBridge (+22 more)

### Community 23 - "Cadastros Auxiliares Gateway"
Cohesion: 0.12
Nodes (21): BancoOmie, CidadeOmie, ListarBancosParams, ListarBancosResponse, ListarCidadesParams, ListarCidadesResponse, ListarNCMParams, ListarNCMResponse (+13 more)

### Community 24 - "Ordem de Serviço CRUD"
Cohesion: 0.08
Nodes (23): AlterarOSParam, alterarOSParamSchema, ConsultarOSParam, consultarOSParamSchema, ExcluirOSParam, excluirOSParamSchema, IncluirOSParam, incluirOSParamSchema (+15 more)

### Community 25 - "omie-mcp Package Manifest"
Cohesion: 0.05
Nodes (40): express, @modelcontextprotocol/sdk, bin, omie-mcp, dependencies, dotenv, express, @modelcontextprotocol/sdk (+32 more)

### Community 26 - "Serviço CRUD Operations"
Cohesion: 0.10
Nodes (22): AlterarServicoParam, alterarServicoParamSchema, ConsultarServicoParam, consultarServicoParamSchema, ExcluirServicoParam, excluirServicoParamSchema, IncluirServicoParam, incluirServicoParamSchema (+14 more)

### Community 27 - "Product Structure Apply/Delete Flow"
Cohesion: 0.12
Nodes (21): ProductStructureFetchGateway, ProductStructureFetchResult, ProductStructureItem, ProcessApplyProductStructureData, ProcessApplyProductStructureUseCase, ProcessDeleteProductStructureData, ProcessDeleteProductStructureUseCase, ProcessSyncProductStructureData (+13 more)

### Community 28 - "Requisição de Compra CRUD"
Cohesion: 0.08
Nodes (21): AlterarRequisicaoCompraParam, alterarRequisicaoCompraParamSchema, ConsultarRequisicaoCompraParam, consultarRequisicaoCompraParamSchema, ExcluirRequisicaoCompraParam, excluirRequisicaoCompraParamSchema, IncluirRequisicaoCompraParam, incluirRequisicaoCompraParamSchema (+13 more)

### Community 29 - "Pedido de Venda Gateway"
Cohesion: 0.12
Nodes (15): ChavePedido, COD_OPERACAO_VENDA_PRODUTO, DadosPedidoParaGravar, EtapaFaturamento, ItemPedidoParaGravar, ItemPedidoVenda, ListarPedidosResponse, OperacaoEtapas (+7 more)

### Community 30 - "NFS-e / LC116 Operations"
Cohesion: 0.11
Nodes (20): CodigoLC116, ListarLC116Param, listarLC116ParamSchema, ListarLC116Result, ListarNFSeParam, listarNFSeParamSchema, ListarNFSeResult, NFSeResumo (+12 more)

### Community 31 - "apps/api Package Scripts"
Cohesion: 0.05
Nodes (39): scripts, backfill:omie-code, build, create:file, db:fix:failed, db:migrate:dev, db:migrate:local, db:migrate:prod (+31 more)

### Community 32 - "Production Manager API Contract"
Cohesion: 0.07
Nodes (30): Production Manager API (project), ProductStock (cache), GET /v1/products (public contract), buildApp(), app module, contracts/publicProducts.contract module, AppError (class), Error (built-in) (+22 more)

### Community 33 - "Product Stock Domain Mapping"
Cohesion: 0.12
Nodes (20): extractProductCode(), extractQuantity(), extractStockLocationCode(), mapOmieItemToStockItem(), ProductStockExternalItem, ProductStockFetchGateway, ProductStockFetchResult, ProductStockFetchPageGateway (+12 more)

### Community 34 - "omie-mcp HTTP Server & Auth"
Cohesion: 0.08
Nodes (19): app, client, ConfirmacaoNecessaria, ehChamadaDestrutiva(), executarFerramenta(), inicioJanela, NaoEncontrada, PORT (+11 more)

### Community 35 - "Conta Corrente CRUD"
Cohesion: 0.11
Nodes (19): AlterarContaParam, alterarContaParamSchema, ConsultarContaParam, consultarContaParamSchema, ContaResult, ExcluirContaParam, excluirContaParamSchema, IncluirContaParam (+11 more)

### Community 36 - "Metrics Markdown Renderer"
Cohesion: 0.08
Nodes (33): args, buildDriftSection(), buildEndpointsSection(), buildEnvSection(), buildExportsSection(), buildLocSection(), buildMigrationsSection(), buildPrismaSection() (+25 more)

### Community 37 - "Sync-All Use Cases (Cross-Module)"
Cohesion: 0.14
Nodes (20): SyncAllProductCatalogCommand, CommandStoreContract, IntegrationStoreContract, SyncAllProductStockCommand, SyncAllProductStockUseCase, executeSyncAllProductStructures(), SyncAllProductStructuresCommand, executeSyncAllProductionOrders() (+12 more)

### Community 38 - "CRM Oportunidade CRUD"
Cohesion: 0.10
Nodes (19): AlterarOportunidadeParam, alterarOportunidadeParamSchema, ConsultarOportunidadeParam, consultarOportunidadeParamSchema, ExcluirOportunidadeParam, excluirOportunidadeParamSchema, IncluirOportunidadeParam, incluirOportunidadeParamSchema (+11 more)

### Community 39 - "Pedido CRUD DTOs"
Cohesion: 0.12
Nodes (15): AlterarPedidoParam, alterarPedidoParamSchema, ChavePedidoParam, chavePedidoParamSchema, IncluirPedidoParam, incluirPedidoParamSchema, itemSchema, AlterarPedidoUseCase (+7 more)

### Community 40 - "Community 40"
Cohesion: 0.11
Nodes (17): ConsultarUnidadeParam, consultarUnidadeParamSchema, ListarBancosParam, listarBancosParamSchema, ListarCidadesParam, listarCidadesParamSchema, ListarNCMParam, listarNCMParamSchema (+9 more)

### Community 41 - "Community 41"
Cohesion: 0.09
Nodes (18): AlterarContatoParam, alterarContatoParamSchema, ConsultarContatoParam, consultarContatoParamSchema, ContatoResult, ExcluirContatoParam, excluirContatoParamSchema, IncluirContatoParam (+10 more)

### Community 42 - "Community 42"
Cohesion: 0.08
Nodes (13): CreateAcceptedCommandInput, EnqueueCommandInput, ProductStructureCommandSourceEnum, ProductStructureCommandStatusEnum, ProductStructureCommandStore, ProductStructureCommandTypeEnum, StatusCounts, FakeProductStructureLifecycleGateway (+5 more)

### Community 43 - "Community 43"
Cohesion: 0.18
Nodes (16): extractFaultString(), normalizeText(), ProductionOrderSyncPageInput, ProductionOrderSyncPageResult, isProductionOrderComplete(), parseOmieDateTime(), buildOmieFaultError(), buildOmieRedundantError() (+8 more)

### Community 44 - "Community 44"
Cohesion: 0.12
Nodes (13): criarEstoqueGateway(), AlterarProdutoParam, alterarProdutoParamSchema, ExcluirProdutoParam, excluirProdutoParamSchema, IncluirProdutoParam, incluirProdutoParamSchema, AlterarProdutoUseCase (+5 more)

### Community 45 - "Community 45"
Cohesion: 0.15
Nodes (15): criarClientesGateway(), ContaPagar, ListarContasPagarParam, listarContasPagarParamSchema, ListarContasPagarResult, ListarContasPagarUseCase, contasPagarModuleTools, ContaPagarOmie (+7 more)

### Community 46 - "Community 46"
Cohesion: 0.16
Nodes (14): comprasModuleTools, IRequisicaoCompraGateway, ItemRequisicaoCompra, ItemRequisicaoCompraOmie, ListarRequisicoesCompraPageParams, ListarRequisicoesCompraResponse, RequisicaoCompraOmie, RequisicaoCompraParaAlterar (+6 more)

### Community 47 - "Community 47"
Cohesion: 0.15
Nodes (12): AlterarOPParam, alterarOPParamSchema, ChaveOPParam, chaveOPParamSchema, IncluirOPParam, incluirOPParamSchema, AlterarOPUseCase, ConsultarOPUseCase (+4 more)

### Community 48 - "Community 48"
Cohesion: 0.15
Nodes (12): ChaveOP, DadosOPParaGravar, ListarOrdemProducaoResponse, OrdemProducao, OrdemProducaoDetalhada, OpFakeGateway, ORDENS_FAKE, criarOpGateway() (+4 more)

### Community 49 - "Community 49"
Cohesion: 0.13
Nodes (16): SyncAllProductCatalogRequestDTO, SyncAllProductCatalogResponseDTO, ProductCatalogExternalProduct, ProductCatalogFetchPageGateway, ProductCatalogFetchPageInput, ProductCatalogFetchPageResult, FakeProductCatalogFetchPageGateway, logger (+8 more)

### Community 50 - "Community 50"
Cohesion: 0.12
Nodes (20): registerRefreshProductionOrderReadModelRoute(), registerGetProductionOrderStatusRoute(), registerInvalidateRoute(), logger, registerRebuildRoute(), registerReconcileRoute(), registerSyncAllProductionOrdersRoute(), registerSyncIncrementalRoute() (+12 more)

### Community 51 - "Community 51"
Cohesion: 0.11
Nodes (13): FaseResult, ListarCrmAuxiliarParam, listarCrmAuxiliarParamSchema, OrigemResult, SolucaoResult, ListarFasesUseCase, ListarOrigensUseCase, ListarSolucoesUseCase (+5 more)

### Community 52 - "Community 52"
Cohesion: 0.14
Nodes (11): CreateProductionOrderCommand, ProductionOrderCreationGateway, ProductionOrderUpdateGateway, UpdateProductionOrderCommand, IntegrationStatus, ProductionOrderIntegrationRecord, productionOrderIntegrationStore, FakeProductionOrderCreationGateway (+3 more)

### Community 53 - "Community 53"
Cohesion: 0.07
Nodes (28): compilerOptions, baseUrl, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, outDir (+20 more)

### Community 54 - "Community 54"
Cohesion: 0.18
Nodes (13): CabecalhoPedidoCompraOmie, IPedidoCompraGateway, ItemPedidoCompra, ItemPedidoCompraOmie, ListarPedidosCompraPageParams, ListarPedidosCompraResponse, PedidoCompraOmie, PedidoCompraParaAlterar (+5 more)

### Community 55 - "Community 55"
Cohesion: 0.19
Nodes (9): ChaveProduto, DadosProdutoParaGravar, ListarProdutosResponse, ProdutoOmie, StatusProdutoOmie, PRODUTOS_FAKE, ProdutosFakeGateway, ProdutosOmieGateway (+1 more)

### Community 56 - "Community 56"
Cohesion: 0.16
Nodes (14): CabecalhoOSOmie, InfoCadastroOSOmie, IOrdemServicoGateway, ItemOrdemServico, ItemOSOmie, ListarOSPageParams, ListarOSResponse, OrdemServicoOmie (+6 more)

### Community 57 - "Community 57"
Cohesion: 0.19
Nodes (11): crmModuleTools, ContatoOmie, ContatoParaAlterar, ContatoParaIncluir, IContatoGateway, ListarContatosPageParams, ListarContatosResponse, StatusContato (+3 more)

### Community 58 - "Community 58"
Cohesion: 0.18
Nodes (13): ContaOmie, ContaParaAlterar, ContaParaIncluir, ListarContasPageParams, ListarContasResponse, StatusConta, ContaFakeGateway, ContaOmieGateway (+5 more)

### Community 59 - "Community 59"
Cohesion: 0.13
Nodes (19): mapProductStructureToSummary(), ProductStructureSummaryItem, DataRow, GetProductsProductionReadModelParams, GetProductsProductionReadModelUseCase, SummaryRow, registerConfirmProductStructureCallbackRoute(), registerFailProductStructureCallbackRoute() (+11 more)

### Community 60 - "Community 60"
Cohesion: 0.15
Nodes (12): AlterarCategoriaParam, CategoriaResult, ConsultarCategoriaParam, IncluirCategoriaParam, ListarCategoriasParam, ListarCategoriasResult, AlterarCategoriaUseCase, ConsultarCategoriaUseCase (+4 more)

### Community 61 - "Community 61"
Cohesion: 0.08
Nodes (25): ApplyProductStructureItemSchema, ApplyProductStructureRequest, ApplyProductStructureRequestSchema, ApplyProductStructureResponse, ApplyProductStructureResponseSchema, CommandAcceptedResponse, CommandAcceptedResponseSchema, DeleteProductStructureRequest (+17 more)

### Community 62 - "Community 62"
Cohesion: 0.14
Nodes (15): CODIGOS_CONTAS_FAVORITAS, CONTAS_FAVORITAS, GerarFluxoCaixaParam, gerarFluxoCaixaParamSchema, GerarFluxoCaixaResult, LinhaFluxoCaixa, Acumulador, addDays() (+7 more)

### Community 63 - "Community 63"
Cohesion: 0.18
Nodes (11): ConsultarOrcamentoCaixaParam, OrcamentoCaixaResult, ConsultarOrcamentoCaixaUseCase, CategoriaOrcamentoOmie, IOrcamentoCaixaGateway, OrcamentoCaixaOmie, OrcamentoCaixaFakeGateway, criarOrcamentoCaixaGateway() (+3 more)

### Community 64 - "Community 64"
Cohesion: 0.11
Nodes (20): AddPlanItemInputSchema, CreatePlanInputSchema, PlanStatus, PlanStatusEnum, ProductionPlan, ProductionPlanItem, ProductionPlanItemSchema, ProductionPlanSchema (+12 more)

### Community 65 - "Community 65"
Cohesion: 0.20
Nodes (9): CabecalhoServicoOmie, ListarServicosPageParams, ListarServicosResponse, ServicoOmie, ServicoParaAlterar, ServicoParaIncluir, StatusServico, ServicoFakeGateway (+1 more)

### Community 66 - "Community 66"
Cohesion: 0.09
Nodes (23): devDependencies, cross-env, prisma, tsconfig-paths, tsup, tsx, typedoc, typedoc-plugin-markdown (+15 more)

### Community 67 - "Community 67"
Cohesion: 0.15
Nodes (10): registerRoutes(), createCustomerSyncIntegration(), buildJobExternalRequestId(), registerCustomerJobs(), registerProductCatalogJobs(), RefreshProductCatalogProductionReadyJob, createProductCatalogIntegration(), createProductStructureIntegration() (+2 more)

### Community 68 - "Community 68"
Cohesion: 0.23
Nodes (9): DepartamentoOmie, DepartamentoParaAlterar, DepartamentoParaIncluir, ListarDepartamentosPageParams, ListarDepartamentosResponse, StatusDepartamento, DepartamentoFakeGateway, DepartamentoOmieGateway (+1 more)

### Community 69 - "Community 69"
Cohesion: 0.21
Nodes (8): ListarOportunidadesPageParams, ListarOportunidadesResponse, OportunidadeOmie, OportunidadeParaAlterar, OportunidadeParaIncluir, StatusOportunidade, OportunidadeFakeGateway, OportunidadeOmieGateway

### Community 70 - "Community 70"
Cohesion: 0.14
Nodes (13): buildApp(), fastify, FastifyInstance, FastifyRequest, ADR-0009, registerOpenAPIDocumentation(), startServer(), bootstrap() (+5 more)

### Community 71 - "Community 71"
Cohesion: 0.25
Nodes (8): CategoriaOmie, CategoriaParaAlterar, CategoriaParaIncluir, ListarCategoriasPageParams, ListarCategoriasResponse, StatusCategoria, CategoriaFakeGateway, CategoriaOmieGateway

### Community 72 - "Community 72"
Cohesion: 0.10
Nodes (21): dependencies, dotenv, fastify, @fastify/cors, @fastify/swagger, @fastify/swagger-ui, node-cron, @prisma/client (+13 more)

### Community 73 - "Community 73"
Cohesion: 0.19
Nodes (10): SyncCustomerRequestDTO, SyncCustomerResponseDTO, CustomerExternalCustomer, CustomerFetchGateway, CommandStoreContract, IntegrationStoreContract, SyncCustomerCommand, SyncCustomerUseCase (+2 more)

### Community 74 - "Community 74"
Cohesion: 0.17
Nodes (12): InactivateProductRequest, InactivateProductRequestSchema, ProcessInactivateProductData, InactivateProductCommand, ProductInactivateGateway, logger, ProcessInactivateProductUseCase, FakeProductInactivateGateway (+4 more)

### Community 75 - "Community 75"
Cohesion: 0.10
Nodes (18): ProductionOrderIntegrationGateway, CancelProductionOrderRequest, ChangeProductionOrderStageRequest, CommandAcceptedResponse, CommandAcceptedResponseSchema, CreateProductionOrderRequest, CreateProductionOrderResponse, CreateProductionOrderResponseSchema (+10 more)

### Community 76 - "Community 76"
Cohesion: 0.24
Nodes (9): ConsultarExtratoParams, ContaCorrenteOmie, ExtratoContaCorrenteOmie, IContasCorrentesGateway, MovimentoExtratoOmie, CONTAS_FAKE, ContasCorrentesFakeGateway, ContasCorrentesOmieGateway (+1 more)

### Community 77 - "Community 77"
Cohesion: 0.15
Nodes (7): GetCustomerQuery, GetCustomerReadModelUseCase, GetCustomerStatsUseCase, parseBoolean(), fakeOmieCustomerStore, OmieCustomerStore, registerGetCustomerReadModelRoute()

### Community 78 - "Community 78"
Cohesion: 0.17
Nodes (6): parseNumber(), CreateAcceptedCustomerCommandInput, CommandRecord, FakeCustomerCommandStore, fakeCustomerCommandStore, OmieCustomerRecord

### Community 79 - "Community 79"
Cohesion: 0.14
Nodes (6): RefreshProductStockRequestDTO, RefreshProductStockResponseDTO, CommandStoreContract, IntegrationStoreContract, RefreshProductStockUseCase, RefreshProductStockJob

### Community 80 - "Community 80"
Cohesion: 0.13
Nodes (7): ProductionOrderReadModelStore, registerGetConsumptionSummaryByIdRoute(), registerGetConsumptionSummaryRoute(), registerGetProductionOrderByNumberRoute(), registerGetProductionOrderSummaryByIdRoute(), registerGetProductionOrderSummaryRoute(), registerListOpenProductionOrdersRoute()

### Community 81 - "Community 81"
Cohesion: 0.16
Nodes (5): ProcessCreateProductUseCase, ProcessUpdateProductUseCase, ProductManagerCommandStore, createGateways(), registerProductManagerJobHandlers()

### Community 82 - "Community 82"
Cohesion: 0.18
Nodes (3): createGateways(), registerProductStructureJobHandlers(), enqueueJob()

### Community 83 - "Community 83"
Cohesion: 0.23
Nodes (12): ListOpenOrdersParams, registerSearchSuggestionsRoute(), detectQueryType(), QueryType, normalize(), ScorableFields, score(), ScoredResult (+4 more)

### Community 84 - "Community 84"
Cohesion: 0.12
Nodes (4): calcularEsperaRetry(), OmieClient, sleep(), UseCaseToolDef

### Community 85 - "Community 85"
Cohesion: 0.12
Nodes (18): Bug/limitação: IncluirContaCorrente 'sucesso' fantasma (não aparece em Consultar/Listar), Módulo Clientes/Fornecedores (CRUD), Módulo Contas Correntes (extrato), Módulo Contas a Pagar, Módulo Contas a Receber, Módulo Fluxo de Caixa (calculado), Módulo Orçamento de Caixa nativo, Módulo Produtos (CRUD) (+10 more)

### Community 86 - "Community 86"
Cohesion: 0.21
Nodes (8): ItemPedidoComCliente, ListarPedidosComClienteParam, listarPedidosComClienteParamSchema, ListarPedidosComClienteResult, PedidoComCliente, ListarPedidosSepararEstoqueParam, ListarPedidosComClienteUseCase, ListarPedidosSepararEstoqueUseCase

### Community 87 - "Community 87"
Cohesion: 0.20
Nodes (14): pg-boss, getRegisteredTypes(), HandlerEntry, handlers, isWorkerStarted(), logger, startWorker(), EnqueueOptions (+6 more)

### Community 88 - "Community 88"
Cohesion: 0.24
Nodes (8): SyncProductCatalogRequestDTO, SyncProductCatalogResponseDTO, ProductCatalogExternalProduct, ProductCatalogFetchGateway, SyncProductCatalogCommand, SyncProductCatalogUseCase, FakeProductCatalogFetchGateway, RealProductCatalogFetchGateway

### Community 89 - "Community 89"
Cohesion: 0.22
Nodes (7): GetProductCatalogQuery, GetProductCatalogReadModelUseCase, parseBoolean(), parseNumber(), registerGetProductCatalogProductionReadyRoute(), registerGetProductCatalogReadModelRoute(), registerGetProductCatalogSyncHistoryRoute()

### Community 90 - "Community 90"
Cohesion: 0.24
Nodes (9): registerProductManagerJobs(), registerCreateProductRoute(), registerInactivateProductRoute(), registerUpdateProductRoute(), productManagerIntegrationRoutes(), CreateProductRequestSchema, InactivateProductRequestSchema, UpdateProductRequestSchema (+1 more)

### Community 91 - "Community 91"
Cohesion: 0.27
Nodes (8): ApplyProductStructureItem, ApplyProductStructureResult, ProductStructureApplyGateway, ApplyProductStructureCommand, ApplyProductStructureUseCase, FakeProductStructureApplyGateway, RealProductStructureApplyGateway, validateApplyItems()

### Community 92 - "Community 92"
Cohesion: 0.18
Nodes (5): ChangeProductionOrderStageCommand, ProductionOrderChangeStageGateway, FakeProductionOrderChangeStageGateway, RealProductionOrderChangeStageGateway, OmieClientWithCircuitBreaker

### Community 93 - "Community 93"
Cohesion: 0.15
Nodes (11): PlanRepository, ProductRepository, SectorRepository, appRoutes(), plansRoutes(), productSectorRoutes(), sectorRoutes(), CreatePlanItemService (+3 more)

### Community 94 - "Community 94"
Cohesion: 0.14
Nodes (10): AppError, OmieFaultError, OmieRedundantError, CircuitBreakerConfig, CircuitBreakerMetrics, mockHistoryRepository, mockOrderRepository, mockProductRepository (+2 more)

### Community 95 - "Community 95"
Cohesion: 0.33
Nodes (8): FiltroMovimentos, IFinancasGateway, MovimentoFinanceiro, FinancasFakeGateway, MOVIMENTOS_FAKE, parseDataBr(), FinancasOmieGateway, ListarMovimentosResponse

### Community 96 - "Community 96"
Cohesion: 0.15
Nodes (16): services/omieProductRead.service README, services/omieProductSync.service README, services/omieStock.service README, services/publicProductsRead.service README, services/stockRefresh.service README, utils/backoff README, listOmieProductsWithCurrentStock(), runOmieProductSync() (+8 more)

### Community 98 - "Community 98"
Cohesion: 0.19
Nodes (10): buildCreateProductPayload(), buildInactivateProductPayload(), buildUpdateProductPayload(), OmieProductPayload, ProductUpdateGateway, UpdateProductCommand, FakeProductUpdateGateway, logger (+2 more)

### Community 99 - "Community 99"
Cohesion: 0.23
Nodes (9): ProductStructureConsultGateway, ProductStructureConsultItem, ProductStructureConsultResult, FakeProductStructureConsultGateway, getNumber(), getString(), RealProductStructureConsultGateway, logger (+1 more)

### Community 100 - "Community 100"
Cohesion: 0.19
Nodes (8): AppError, ConflictError, MissingDefaultSectorError, NotFoundError, ValidationError, ApiErrorPayload, ErrorCode, ErrorCodes

### Community 101 - "Community 101"
Cohesion: 0.22
Nodes (10): clamp(), isLikelyTransientNetworkError(), isRetryableAppError(), OmieClient, OmieClientConfig, OmieLogger, sleep(), OmieClientWithCircuitBreakerConfig (+2 more)

### Community 102 - "Community 102"
Cohesion: 0.15
Nodes (5): DuplicateDetectionConfig, IdempotencyStrategies, Idempotent(), IdempotentOperation, InMemoryDuplicateDetector

### Community 103 - "Community 103"
Cohesion: 0.12
Nodes (15): compilerOptions, declaration, esModuleInterop, module, moduleResolution, outDir, resolveJsonModule, rootDir (+7 more)

### Community 104 - "Community 104"
Cohesion: 0.28
Nodes (6): DeleteProductStructureResult, ProductStructureDeleteGateway, DeleteProductStructureCommand, DeleteProductStructureUseCase, FakeProductStructureDeleteGateway, RealProductStructureDeleteGateway

### Community 105 - "Community 105"
Cohesion: 0.21
Nodes (7): FakeProductionOrderLifecycleGateway, ProductionOrderLifecycleGateway, logger, RealProductionOrderLifecycleGateway, registerConfirmProductionOrderCallbackRoute(), FailBodySchema, registerFailProductionOrderCallbackRoute()

### Community 106 - "Community 106"
Cohesion: 0.20
Nodes (9): ConsultarExtratoParam, consultarExtratoParamSchema, ExtratoContaCorrenteResult, MovimentoExtrato, ConsultarExtratoUseCase, natureza(), aplicarFiltros(), ItemTeste (+1 more)

### Community 107 - "Community 107"
Cohesion: 0.31
Nodes (8): ProductStructureFetchPageGateway, ProductStructureFetchPageInput, ProductStructureFetchPageResult, ProductStructurePageItem, FakeProductStructureFetchPageGateway, getNumber(), getString(), RealProductStructureFetchPageGateway

### Community 108 - "Community 108"
Cohesion: 0.15
Nodes (14): Módulo Estrutura de Produtos (BOM/ficha técnica), Módulo Ordem de Produção (OP), Módulo Pedido de Venda (CRUD), Padrão: filtro genérico client-side (campo/operador/valor), src/shared/filtro.test.ts, src/shared/filtro.ts (aplicarFiltros), omie_estrutura_buscar_por_produto, omie_estrutura_listar (+6 more)

### Community 109 - "Community 109"
Cohesion: 0.14
Nodes (13): dependencies, zod, devDependencies, typescript, typescript, zod, main, name (+5 more)

### Community 110 - "Community 110"
Cohesion: 0.14
Nodes (13): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, rootDir (+5 more)

### Community 111 - "Community 111"
Cohesion: 0.24
Nodes (13): blocoFerramenta(), CACHE_DIR, construirFerramentasPorModulo(), __dirname, grupos, hashRegistro(), linhaCampo(), main() (+5 more)

### Community 112 - "Community 112"
Cohesion: 0.15
Nodes (13): API Contract Document, Stable Public Contract Design (no live Omie calls), GET /v1/products Public Endpoint, data/meta Response Envelope Convention, API_CONTRACT.md (referenced), Frozen Data Diagnosis (job flags/wiring gaps), LEGADO_VS_ATUAL Comparative Document, src/legacy (preserved legacy backend) (+5 more)

### Community 113 - "Community 113"
Cohesion: 0.26
Nodes (11): formatTimestamp(), generateResumo(), generateTree(), getEndpointsSummary(), getModulesInfo(), getPollingConfigs(), getProjectStats(), IGNORE_DIRS (+3 more)

### Community 114 - "Community 114"
Cohesion: 0.28
Nodes (8): registerRefreshProductCatalogProductionReadyRoute(), registerSyncAllProductCatalogRoute(), registerSyncProductCatalogRoute(), productCatalogIntegrationRoutes(), registerGetProductCatalogLastSyncRoute(), registerGetProductCatalogSummaryRoute(), registerGetProductCatalogSyncFailuresRoute(), registerGetProductCatalogSyncStatusRoute()

### Community 115 - "Community 115"
Cohesion: 0.19
Nodes (8): CreateProductRequest, CreateProductRequestSchema, EnqueueCreateProductData, ProcessCreateProductData, EnqueueCreateProductResult, EnqueueCreateProductUseCase, logger, logger

### Community 116 - "Community 116"
Cohesion: 0.19
Nodes (8): EnqueueUpdateProductData, ProcessUpdateProductData, UpdateProductRequest, UpdateProductRequestSchema, EnqueueUpdateProductResult, EnqueueUpdateProductUseCase, logger, logger

### Community 117 - "Community 117"
Cohesion: 0.15
Nodes (13): .claude/settings.json (hook PostToolUse Edit|Write), API.md — Documentação Viva, CONTEXTO-SESSOES.md — Log de Sessões, FERRAMENTAS.md — Referência técnica de ferramentas, GERAL.md — Índice Geral da Documentação Viva, LOGICA.md — Documentação Viva de Lógica, PADRAO-PROJETO.md — Padrões de Projeto, SEGURANCA.md — Segurança da API HTTP local (+5 more)

### Community 118 - "Community 118"
Cohesion: 0.24
Nodes (9): contasCorrentesModuleTools, criarContasCorrentesGateway(), contasCorrentesTools, fluxoCaixaModuleTools, fluxoCaixaTools, defineTool(), paramSchema, PassthroughToolDef (+1 more)

### Community 119 - "Community 119"
Cohesion: 0.23
Nodes (12): POST /v1/integration/product-structure/:productCode/apply, omie_op_consultar, omie_op_incluir, omie_op_listar, omie_op_listar_com_produto, omie_pedido_venda_listar_com_cliente, omie_pedido_venda_separar_estoque_listar, omie_produtos_consultar (+4 more)

### Community 120 - "Community 120"
Cohesion: 0.26
Nodes (11): ALLOWED_FILE_EXTS, extractTextBlock(), filesComment(), filterFilesForComment(), formatTimestamp(), IGNORE_DIRS, IGNORE_FILES_PREFIX, listDir() (+3 more)

### Community 121 - "Community 121"
Cohesion: 0.17
Nodes (5): FAKE_DATA, FakeOmieCustomerStore, ListParams, OmieCustomerRecord, UpsertInput

### Community 122 - "Community 122"
Cohesion: 0.30
Nodes (9): buildExternalRequestId(), registerSyncAllCustomersRoute(), registerSyncCustomerRoute(), customerSyncIntegrationRoutes(), registerGetCustomerLastSyncRoute(), registerGetCustomerStatsRoute(), registerGetCustomerSyncFailuresRoute(), registerGetCustomerSyncHistoryRoute() (+1 more)

### Community 123 - "Community 123"
Cohesion: 0.27
Nodes (6): CreateProductCommand, ProductCreationGateway, FakeProductCreationGateway, logger, logger, RealProductCreationGateway

### Community 124 - "Community 124"
Cohesion: 0.26
Nodes (6): ListarProdutosComEstoqueParam, listarProdutosComEstoqueParamSchema, ListarProdutosComEstoqueResult, ProdutoComEstoque, ListarProdutosComEstoqueUseCase, round2()

### Community 125 - "Community 125"
Cohesion: 0.23
Nodes (9): CategoriaOrcamento, consultarOrcamentoCaixaParamSchema, listarPedidosSepararEstoqueParamSchema, bateCriterio(), CriterioFiltro, criterioFiltroSchema, filtrosParamSchema, normalizarTexto() (+1 more)

### Community 126 - "Community 126"
Cohesion: 0.27
Nodes (6): ItemParaSeparar, ListarProdutosParaSepararParam, listarProdutosParaSepararParamSchema, ListarProdutosParaSepararResult, ResumoProdutoParaSeparar, ListarProdutosParaSepararUseCase

### Community 127 - "Community 127"
Cohesion: 0.18
Nodes (11): API 1 — Contrato Técnico de Rotas (ROUTES.md), docs/ARCHITECTURE_GUIDE.md, docs/DOMAIN_NAMING_GUIDE.md, docs/MODULE_TEMPLATE.md, Product Catalog — Catálogo de Produtos (espelho Omie), Product Structure — Production Readiness read-model, GET /v1/products/catalog/production-ready, docs/PROJECT_MANUAL.md (+3 more)

### Community 128 - "Community 128"
Cohesion: 0.18
Nodes (8): detected, detSet, docSet, indexFile, onlyInCode, onlyInDocs, ROOT, scanFile

### Community 129 - "Community 129"
Cohesion: 0.25
Nodes (7): HttpLinks, ok(), paginated(), PaginationMeta, sendOk(), sendPaginated(), wantsPrettyResponse()

### Community 130 - "Community 130"
Cohesion: 0.27
Nodes (7): GetProductCatalogProductionReadyQueryDTO, GetProductCatalogProductionReadyResponseDTO, ProductCatalogProductionReadyItemDTO, ProductCatalogProductionReadyStatus, GetProductCatalogProductionReadyUseCase, resolveProductStatus(), ListProductionReadyParams

### Community 131 - "Community 131"
Cohesion: 0.20
Nodes (11): Compras module cache, omie_pedido_compra_alterar tool (destrutiva), omie_pedido_compra_consultar tool, omie_pedido_compra_excluir tool (destrutiva), omie_pedido_compra_incluir tool (destrutiva), omie_pedido_compra_listar tool, omie_requisicao_compra_alterar tool (destrutiva), omie_requisicao_compra_consultar tool (+3 more)

### Community 132 - "Community 132"
Cohesion: 0.18
Nodes (11): Gap-analysis completo do catálogo Omie, Módulo de Características de Produto, Boleto de Contas a Receber, Módulo NF-e (somente leitura), Módulo Nota de Entrada (só leitura), Módulo PIX de Contas a Receber, omie_contas_receber_boleto_gerar, omie_nfe_consultar (+3 more)

### Community 133 - "Community 133"
Cohesion: 0.24
Nodes (10): Production Manager API — Lista Completa de Rotas, product-catalog module, product-manager module, product-structure module, production-orders module, product-catalog (Production Manager), omie_familias_listar, omie_produtos_incluir (+2 more)

### Community 134 - "Community 134"
Cohesion: 0.24
Nodes (10): startOmieProductSyncJob(), jobs/omieProductSync.job (module), startStockRefreshJob(), jobs/stockRefresh.job (module), PlanRepository (class), repositories/PlanRepository (module), ProductRepository (class), repositories/ProductRepository (module) (+2 more)

### Community 135 - "Community 135"
Cohesion: 0.44
Nodes (10): markDeprecated(), ok(), paginated(), sendOk(), sendPaginated(), wantsLegacyResponse(), wantsPrettyResponse(), lib/http (module) (+2 more)

### Community 136 - "Community 136"
Cohesion: 0.38
Nodes (6): CustomerSummary, extractString(), mapOmieCustomerToSummary(), RawPayload, GetCustomerSummaryUseCase, registerGetCustomerSummaryRoute()

### Community 137 - "Community 137"
Cohesion: 0.36
Nodes (4): CancelProductionOrderCommand, ProductionOrderCancelGateway, FakeProductionOrderCancelGateway, RealProductionOrderCancelGateway

### Community 138 - "Community 138"
Cohesion: 0.31
Nodes (10): /omie-skill:estoque command, /omie-skill:op command, /omie-skill:pedidos command, /omie-skill:produtos command, Estoque module cache, omie_estoque_ajuste_excluir tool (destrutiva), omie_estoque_ajuste_incluir tool (destrutiva), omie_estoque_movimentos_listar tool (+2 more)

### Community 139 - "Community 139"
Cohesion: 0.22
Nodes (10): Categorias e Departamentos module cache, omie_categoria_alterar tool (destrutiva), omie_categoria_consultar tool, omie_categoria_incluir tool (destrutiva), omie_categoria_listar tool, omie_departamento_alterar tool (destrutiva), omie_departamento_consultar tool, omie_departamento_excluir tool (destrutiva) (+2 more)

### Community 140 - "Community 140"
Cohesion: 0.24
Nodes (10): Contas a Pagar module cache, omie_contas_pagar_listar tool, omie_contas_receber_listar tool, Contas Correntes module cache, omie_contas_correntes_listar tool, omie_extrato_conta_corrente_consultar tool, Fluxo de Caixa module cache, omie_fluxo_caixa_gerar tool (+2 more)

### Community 141 - "Community 141"
Cohesion: 0.33
Nodes (5): ListarOpsComProdutoParam, listarOpsComProdutoParamSchema, ListarOpsComProdutoResult, OrdemProducaoComProduto, ListarOpsComProdutoUseCase

### Community 142 - "Community 142"
Cohesion: 0.22
Nodes (9): product-stock-fetch module, Fluxo de Trabalho para Desenvolvimento Local (Production Manager API), Prisma migrate (local/prod), Render (deploy), Supabase (DATABASE_URL produção), Resumo de Atualizações 2026-04-14 (API Fastify/Prisma, fix estoque Omie), ProductStock Prisma model / product_stock table, Envelope de resposta padronizado (data/meta, X-Response-Format legacy) (+1 more)

### Community 143 - "Community 143"
Cohesion: 0.22
Nodes (9): sales-order-sync module, Production Manager API README, docs/API_CONTRACT.md, docs/REPO_STATUS.md, apps/api/ROUTES.md (contrato técnico), sales-order-sync (Production Manager), server.ts (bootstrap Fastify), omie_pedido_venda_listar (+1 more)

### Community 144 - "Community 144"
Cohesion: 0.22
Nodes (5): DATA, OUT, ROOT, TEMPLATE, tpl

### Community 145 - "Community 145"
Cohesion: 0.22
Nodes (6): byFile, byFolder, files, IGNORE, ROOT, STARTS

### Community 146 - "Community 146"
Cohesion: 0.36
Nodes (8): extractTextBlock(), formatTimestamp(), IGNORE_DIRS, listDir(), main(), renderFullTree(), shouldIgnoreFile(), splitBlockLines()

### Community 147 - "Community 147"
Cohesion: 0.33
Nodes (5): extractUnit(), mapOmieProductToSummary(), ProductCatalogSummary, RawPayload, GetProductCatalogSummaryUseCase

### Community 148 - "Community 148"
Cohesion: 0.31
Nodes (5): EnqueueCancelProductionOrderCommand, EnqueueCancelProductionOrderResult, EnqueueCancelProductionOrderUseCase, registerCancelProductionOrderRoute(), CancelProductionOrderRequestSchema

### Community 149 - "Community 149"
Cohesion: 0.31
Nodes (5): EnqueueChangeStageProductionOrderCommand, EnqueueChangeStageProductionOrderResult, EnqueueChangeStageProductionOrderUseCase, registerChangeProductionOrderStageRoute(), ChangeProductionOrderStageRequestSchema

### Community 150 - "Community 150"
Cohesion: 0.31
Nodes (5): EnqueueCreateProductionOrderCommand, EnqueueCreateProductionOrderResult, EnqueueCreateProductionOrderUseCase, registerCreateProductionOrderRoute(), CreateProductionOrderRequestSchema

### Community 151 - "Community 151"
Cohesion: 0.31
Nodes (5): EnqueueUpdateProductionOrderCommand, EnqueueUpdateProductionOrderResult, EnqueueUpdateProductionOrderUseCase, registerUpdateProductionOrderRoute(), UpdateProductionOrderRequestSchema

### Community 152 - "Community 152"
Cohesion: 0.22
Nodes (8): exclude, extends, dist, node_modules, **/*.spec.ts, **/*.test.ts, src/legacy/**, ./tsconfig.json

### Community 153 - "Community 153"
Cohesion: 0.25
Nodes (9): Limitação: Categoria financeira não tem exclusão real na API Omie, Módulo de Cadastros Auxiliares (só leitura), Módulo de Categorias e Departamentos, Padrão: cache com TTL para cadastros de apoio, src/shared/cache.ts (cache TTL cadastros de apoio), omie_categoria_incluir, omie_departamento_excluir, omie_departamento_incluir (+1 more)

### Community 154 - "Community 154"
Cohesion: 0.50
Nodes (9): /omie-skill:atualizar-cache command, /omie-skill:guia command, /omie-skill:verificar-cache command, omie-skill cache index (_index.md), omie-skill SKILL.md, docs/FERRAMENTAS.md (full tool docs, 1500+ lines), cache/manifest.json (cache hash manifest), scripts/gerar-skill-cache.mjs (cache generator) (+1 more)

### Community 155 - "Community 155"
Cohesion: 0.25
Nodes (9): omie_orcamento_caixa_consultar, omie_pix_gerar, omie_nfse_listar, omie_os_incluir, omie_servico_alterar, omie_servico_incluir, omie_servicos_lc116_listar, FUNCIONALIDADES.md — Lista de funcionalidades do MCP Omie (+1 more)

### Community 156 - "Community 156"
Cohesion: 0.25
Nodes (8): customer-sync module, customer-sync (Production Manager), src/modules/clientesFornecedores/, src/modules/contasPagar/, src/modules/contasReceber/, src/modules/crm/, src/modules/pedidoVenda/ (módulo em camadas), src/modules/pix/

### Community 157 - "Community 157"
Cohesion: 0.25
Nodes (6): counts, endpoints, files, IGNORE, ROOT, START

### Community 158 - "Community 158"
Cohesion: 0.25
Nodes (5): files, IGNORE, report, ROOT, START

### Community 159 - "Community 159"
Cohesion: 0.29
Nodes (6): ensureDir(), md, OUT, PUBLIC_PRODUCTS_CONTRACT, ROOT, write()

### Community 160 - "Community 160"
Cohesion: 0.36
Nodes (8): Limitação: ajuste de estoque trava exclusão permanente do produto, Módulo Compras (Pedido de Compra + Requisição de Compra), Módulo Estoque (ajuste/movimento), omie_estoque_ajuste_excluir, omie_estoque_ajuste_incluir, omie_pedido_compra_incluir, omie_requisicao_compra_incluir, src/tools/types.ts (ToolDef, campo destructive)

### Community 161 - "Community 161"
Cohesion: 0.25
Nodes (8): omie_chamar_api, omie-mcp README, docs/FERRAMENTAS.md, src/tools/generic.ts (omie_chamar_api), src/httpServer.ts, src/index.ts, src/tools/registry.ts, src/tools/types.ts (ToolDef)

### Community 162 - "Community 162"
Cohesion: 0.32
Nodes (8): scripts/gerar-api-key.mjs, src/httpServer.ts, Segurança: autenticação por API key estática (Bearer, timing-safe), Segurança: bind fixo em 127.0.0.1, Segurança: confirmação obrigatória em operações destrutivas, Plano de ação: preparação para servidor central multiusuário (fases 0-6), Segurança: rate limit de janela fixa (120 req/min), omie_chamar_api (genérica)

### Community 163 - "Community 163"
Cohesion: 0.32
Nodes (6): grupos, gruposCompletos, linhaCampo(), linhas, paramsResumo(), resolveRef()

### Community 164 - "Community 164"
Cohesion: 0.29
Nodes (7): legacy/core/SyncOmieProductsService.ts, legacy/core/SyncOmieStage20OrdersService.ts, legacy/jobs/omieOrdersStage20.job.ts, legacy/jobs/omieProductSync.job.ts, modules/omie-orders/infrastructure/jobs/omie-orders-stage20.job.ts, modules/products/infrastructure/jobs/omie-product-sync.job.ts, SYNC_IN_PROGRESS DB Lock Pattern

### Community 165 - "Community 165"
Cohesion: 0.57
Nodes (7): utils/domainErrors README, ErrorCode, AppError, ConflictError, MissingDefaultSectorError, NotFoundError, ValidationError

### Community 166 - "Community 166"
Cohesion: 0.29
Nodes (5): envFile, example, extra, missing, ROOT

### Community 167 - "Community 167"
Cohesion: 0.29
Nodes (5): files, IGNORE, perFile, ROOT, START

### Community 169 - "Community 169"
Cohesion: 0.33
Nodes (4): EnqueueInactivateProductData, EnqueueInactivateProductResult, EnqueueInactivateProductUseCase, logger

### Community 170 - "Community 170"
Cohesion: 0.29
Nodes (5): ListOpenItemsParams, ListOpenItemsResult, OpenItemRecord, OpenItemsMeta, SalesOrderOpenItemsStore

### Community 172 - "Community 172"
Cohesion: 0.33
Nodes (6): expectedCode, extractedCode, extractOmieClientCode(), fromRawPayload, orderJson, tryBigInt()

### Community 173 - "Community 173"
Cohesion: 0.33
Nodes (6): clientMap, extractOmieClientCode(), mockClient, mockOrder, processOrder(), result

### Community 174 - "Community 174"
Cohesion: 0.52
Nodes (7): /omie-skill:estrutura command, Estrutura de Produtos module cache, omie_estrutura_alterar tool (destrutiva), omie_estrutura_buscar_por_produto tool, omie_estrutura_excluir tool (destrutiva), omie_estrutura_incluir tool (destrutiva), omie_estrutura_listar tool

### Community 175 - "Community 175"
Cohesion: 0.38
Nodes (7): Clientes e Fornecedores module cache, omie_clientes_alterar tool (destrutiva), omie_clientes_consultar tool, omie_clientes_excluir tool (destrutiva), omie_clientes_incluir tool (destrutiva), omie_clientes_listar tool, omie_fornecedores_listar tool

### Community 176 - "Community 176"
Cohesion: 0.52
Nodes (7): CRM module cache, omie_crm_conta_incluir tool (destrutiva), omie_crm_contato_incluir tool (destrutiva), omie_crm_fases_listar tool, omie_crm_oportunidade_incluir tool (destrutiva), omie_crm_origens_listar tool, omie_crm_solucoes_listar tool

### Community 177 - "Community 177"
Cohesion: 0.67
Nodes (6): sendError() function, ApiErrorPayload interface, utils/errors TypeDoc README, ErrorCode type alias, ErrorCodes constant, apps/api/src/utils/errors.ts

### Community 178 - "Community 178"
Cohesion: 0.33
Nodes (5): engines, node, name, private, version

### Community 179 - "Community 179"
Cohesion: 0.53
Nodes (5): ask(), main(), resolveSafePath(), rl, stripMarkdownFences()

### Community 180 - "Community 180"
Cohesion: 0.33
Nodes (4): OUT, report, ROOT, scripts

### Community 181 - "Community 181"
Cohesion: 0.33
Nodes (5): CustomerItemDTO, CustomerSummaryDTO, CustomerView, GetCustomerQueryDTO, GetCustomerResponseDTO

### Community 182 - "Community 182"
Cohesion: 0.33
Nodes (5): GetProductCatalogQueryDTO, GetProductCatalogResponseDTO, ProductCatalogItemDTO, ProductCatalogSummaryDTO, ProductCatalogView

### Community 183 - "Community 183"
Cohesion: 0.60
Nodes (3): SalesOrderFetchPageInput, SalesOrderFetchPageItem, SalesOrderFetchPageResult

### Community 184 - "Community 184"
Cohesion: 0.40
Nodes (5): ApiErrorResponse, frontendGetJson(), frontendGetStock(), StockData, StockResponse

### Community 185 - "Community 185"
Cohesion: 0.33
Nodes (6): Cadastros Auxiliares module cache, omie_bancos_listar tool, omie_cidades_listar tool, omie_ncm_listar tool, omie_paises_listar tool, omie_unidade_consultar tool

### Community 186 - "Community 186"
Cohesion: 0.40
Nodes (6): Características de Produto module cache, omie_caracteristica_alterar tool (destrutiva), omie_caracteristica_consultar tool, omie_caracteristica_excluir tool (destrutiva), omie_caracteristica_incluir tool (destrutiva), omie_caracteristica_listar tool

### Community 187 - "Community 187"
Cohesion: 0.47
Nodes (6): Nota de Entrada module cache, omie_nota_entrada_consultar tool, omie_nota_entrada_listar tool, Notas Fiscais (NF-e) module cache, omie_nfe_consultar tool, omie_nfe_listar tool

### Community 188 - "Community 188"
Cohesion: 0.33
Nodes (6): src/shared/concurrency.ts (mapWithConcurrency), src/modules/contasCorrentes/, src/modules/fluxoCaixa/, src/modules/orcamentoCaixa/, src/omieClient.ts, Rate limit / throttle design da Omie

### Community 189 - "Community 189"
Cohesion: 0.40
Nodes (5): Categories as Dedicated Endpoint (route design), IMPROVEMENT_PLAN Document, OmieStockCache.ts, Product Stock as Explicit Resource (route design), schema.prisma

### Community 190 - "Community 190"
Cohesion: 0.40
Nodes (4): basePath, cwd, files, folders

### Community 191 - "Community 191"
Cohesion: 0.40
Nodes (4): dirs, items, migDir, ROOT

### Community 192 - "Community 192"
Cohesion: 0.40
Nodes (4): models, prisma, ROOT, text

### Community 193 - "Community 193"
Cohesion: 0.50
Nodes (4): { execSync }, fs, run(), sql()

### Community 194 - "Community 194"
Cohesion: 0.60
Nodes (4): createWebhook(), getExistingWebhooks(), main(), TrelloWebhook

### Community 195 - "Community 195"
Cohesion: 0.40
Nodes (4): envBoolean, envSchema, parsed, ADR-0009

### Community 197 - "Community 197"
Cohesion: 0.40
Nodes (4): CommandSource, CommandStatus, CommandType, EnqueueCommandInput

### Community 198 - "Community 198"
Cohesion: 0.50
Nodes (4): mapProductionOrderToDetail(), mapProductionOrderToSummary(), ProductionOrderDetailSummary, ProductionOrderSummaryItem

### Community 199 - "Community 199"
Cohesion: 0.50
Nodes (4): codigoExtraido, extractOmieClientCode(), pedidoExemplo, tryBigInt()

### Community 200 - "Community 200"
Cohesion: 0.60
Nodes (5): Bug/limitação: CRM Tarefas — IncluirTarefa 'sucesso' fantasma, Módulo CRM completo, omie_crm_oportunidade_incluir, omie_crm_origens_listar, omie_crm_solucoes_listar

### Community 201 - "Community 201"
Cohesion: 0.70
Nodes (5): Contas a Receber module cache, omie_contas_receber_boleto_cancelar tool (destrutiva), omie_contas_receber_boleto_gerar tool (destrutiva), omie_contas_receber_boleto_obter tool, omie_contas_receber_boleto_prorrogar tool (destrutiva)

### Community 202 - "Community 202"
Cohesion: 0.40
Nodes (4): geradoEm, hash, totalFerramentas, totalModulos

### Community 203 - "Community 203"
Cohesion: 0.40
Nodes (4): src/integrations/omie/omieClient.ts (OmieClient), Padrão: camada de integração Omie isolada (src/integrations/omie), pnpm workspace: apps/*, pnpm workspace: packages/* (ex: futuro packages/omie-core)

### Community 206 - "Community 206"
Cohesion: 0.50
Nodes (3): { execSync }, readline, rl

### Community 209 - "Community 209"
Cohesion: 0.50
Nodes (3): ApplyProductStructureItemDTO, ApplyProductStructureRequestDTO, ApplyProductStructureResponseDTO

### Community 211 - "Community 211"
Cohesion: 0.50
Nodes (3): http, options, req

### Community 212 - "Community 212"
Cohesion: 0.50
Nodes (3): http, options, req

### Community 213 - "Community 213"
Cohesion: 0.67
Nodes (4): Módulo Serviços/Ordem de Serviço/NFS-e, omie_nfse_listar, omie_os_incluir, omie_servicos_lc116_listar

### Community 214 - "Community 214"
Cohesion: 0.67
Nodes (3): bootstrap/app.ts, bootstrap/buildApp(), bootstrap/routes.ts

### Community 215 - "Community 215"
Cohesion: 0.67
Nodes (3): legacy/jobs/stockRefresh.job.ts, legacy/services/stockRefresh.service.ts, modules/products/infrastructure/jobs/stock-refresh.job.ts

### Community 216 - "Community 216"
Cohesion: 0.67
Nodes (3): Comandos de terminal (API) — testar rotas e tarefas comuns, Comandos de terminal — scripts em apps/api/scripts, Comandos Importantes do Projeto Document

## Ambiguous Edges - Review These
- `test-nome-cliente.js` → `Module: sales-order-sync`  [AMBIGUOUS]
  apps/api/tests/test-nome-cliente.html · relation: conceptually_related_to
- `/omie-skill:op command` → `Estrutura de Produtos module cache`  [AMBIGUOUS]
  .claude/commands/omie-skill/op.md · relation: references
- `/omie-skill:produtos command` → `omie_estoque_total_produto tool`  [AMBIGUOUS]
  .claude/commands/omie-skill/produtos.md · relation: references
- `omie_op_incluir` → `omie_produtos_consultar`  [AMBIGUOUS]
  .claude/skills/omie-skill/cache/ordem-de-producao.md · relation: references
- `Comandos de terminal — scripts em apps/api/scripts` → `product-structure module README (canonical)`  [AMBIGUOUS]
  apps/api/scripts/Comandos-scripts-api.md · relation: conceptually_related_to
- `src/httpServer.ts` → `pnpm workspace: apps/*`  [AMBIGUOUS]
  pnpm-workspace.yaml · relation: conceptually_related_to
- `Padrão: cache com TTL para cadastros de apoio` → `omie_produtos_listar_com_estoque`  [AMBIGUOUS]
  docs/PADRAO-PROJETO.md · relation: conceptually_related_to

## Knowledge Gaps
- **905 isolated node(s):** `geradoEm`, `hash`, `totalFerramentas`, `totalModulos`, `{ PrismaClient }` (+900 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **77 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `test-nome-cliente.js` and `Module: sales-order-sync`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `/omie-skill:op command` and `Estrutura de Produtos module cache`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `/omie-skill:produtos command` and `omie_estoque_total_produto tool`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `omie_op_incluir` and `omie_produtos_consultar`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Comandos de terminal — scripts em apps/api/scripts` and `product-structure module README (canonical)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `src/httpServer.ts` and `pnpm workspace: apps/*`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Padrão: cache com TTL para cadastros de apoio` and `omie_produtos_listar_com_estoque`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._