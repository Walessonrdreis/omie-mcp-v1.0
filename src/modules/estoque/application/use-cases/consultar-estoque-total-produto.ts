import { IEstoqueGateway } from "../../domain/interfaces/estoque-gateway.js";
import { EstoqueTotalProdutoResult } from "../dto/estoque-total-produto.dto.js";

/**
 * A Omie não entrega "estoque total do produto" — só posições por local de
 * estoque, paginadas. Esse use-case existe pra suprir essa lacuna: busca
 * todas as posições do produto em todos os locais e consolida em um único
 * resultado, que é o que o usuário realmente pergunta ("quanto eu tenho
 * desse produto no total?").
 */
export class ConsultarEstoqueTotalProdutoUseCase {
  constructor(private readonly gateway: IEstoqueGateway) {}

  async execute(codigoProduto: number): Promise<EstoqueTotalProdutoResult> {
    const posicoes = await this.gateway.listarPosicoesPorProduto(codigoProduto);

    if (posicoes.length === 0) {
      throw new Error(
        `Nenhuma posição de estoque encontrada para o produto de código ${codigoProduto}.`
      );
    }

    return {
      codigoProduto,
      quantidadeFisicaTotal: sum(posicoes.map((p) => p.fisico)),
      saldoTotal: sum(posicoes.map((p) => p.nSaldo)),
      reservadoTotal: sum(posicoes.map((p) => p.reservado)),
      locais: posicoes.map((p) => ({
        codigoLocalEstoque: p.codigo_local_estoque,
        fisico: p.fisico,
        saldo: p.nSaldo,
        reservado: p.reservado,
      })),
    };
  }
}

function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}
