import { IEstruturaGateway } from "../../domain/interfaces/estrutura-gateway.js";
import { BuscarEstruturaPorProdutoParam, BuscarEstruturaPorProdutoResult } from "../dto/estrutura.dto.js";
import { mapearProdutoComEstrutura } from "./mapear-produto-com-estrutura.js";

const REGISTROS_POR_PAGINA = 50;
const LIMITE_MAXIMO_PAGINAS = 50;

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * A Omie não tem busca por texto em `ListarEstruturas` (só filtros de data) —
 * então pra achar "a estrutura do produto X" por nome/código, este use-case
 * pagina a listagem inteira e filtra client-side pela descrição/código do
 * produto (`ident.descrProduto`/`ident.codProduto`), já vindo com nome de
 * cada insumo (a Omie devolve isso pronto no `ListarEstruturas`).
 */
export class BuscarEstruturaPorProdutoUseCase {
  constructor(private readonly estruturaGateway: IEstruturaGateway) {}

  async execute(param: BuscarEstruturaPorProdutoParam): Promise<BuscarEstruturaPorProdutoResult> {
    const termo = normalizar(param.termo);
    const encontrados: BuscarEstruturaPorProdutoResult["produtos"] = [];

    let pagina = 1;
    let totalPaginas = 1;

    do {
      const resposta = await this.estruturaGateway.listarEstruturasPagina(
        pagina,
        REGISTROS_POR_PAGINA
      );
      totalPaginas = resposta.nTotPaginas;

      for (const produto of resposta.produtosEncontrados) {
        const bate =
          normalizar(produto.ident.descrProduto).includes(termo) ||
          normalizar(produto.ident.codProduto).includes(termo);
        if (bate) {
          encontrados.push(mapearProdutoComEstrutura(produto));
        }
      }

      pagina++;
    } while (pagina <= totalPaginas && pagina <= LIMITE_MAXIMO_PAGINAS);

    return {
      encontrados: encontrados.length,
      produtos: encontrados,
    };
  }
}
