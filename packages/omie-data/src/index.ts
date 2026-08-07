export { abrirBanco } from "./infrastructure/database.js";
export { diretorioDados } from "./infrastructure/caminhos.js";
export { hashCredencial } from "./infrastructure/credenciais.js";
export { OmieHttpClientReal } from "./infrastructure/http-client-real.js";
/**
 * Exportado pra que o servidor MCP consiga montar um cache offline quando
 * `OMIE_MOCK=true`, sem nenhuma chamada de rede.
 */
export { FakeHttpClient } from "./infrastructure/fake-http-client.js";
export { collectProdutos } from "./modules/produtos/application/collect-produtos.js";
export type { ProdutoOmieBruto } from "./modules/produtos/domain/produto.js";
export type { OrdemProducaoOmieBruta } from "./modules/ordemProducao/domain/ordem-producao.js";
export { collectOrdemProducao } from "./modules/ordemProducao/application/collect-op.js";
export {
  translateOrdemProducao,
  type ResultadoTraducaoOrdemProducao,
} from "./modules/ordemProducao/application/translate-op.js";
export {
  consultarOrdensProducao,
  type FiltrosOrdensProducao,
  type OrdemProducaoView,
  type ResultadoConsultaOrdensProducao,
} from "./modules/ordemProducao/application/consultar-op.js";
export type { IOrdemProducaoHttpClient } from "./domain/ordem-producao-http-client.js";
