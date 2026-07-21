import { IOrcamentoCaixaGateway } from "../../domain/interfaces/orcamento-caixa-gateway.js";
import { aplicarFiltros } from "../../../../shared/filtro.js";
import { ConsultarOrcamentoCaixaParam, OrcamentoCaixaResult } from "../dto/orcamento-caixa.dto.js";

export class ConsultarOrcamentoCaixaUseCase {
  constructor(private readonly gateway: IOrcamentoCaixaGateway) {}

  async execute(param: ConsultarOrcamentoCaixaParam): Promise<OrcamentoCaixaResult> {
    const orcamento = await this.gateway.consultarOrcamento(param.ano, param.mes);

    const categorias = orcamento.ListaOrcamentos.map((c) => ({
      codigoCategoria: c.cCodCateg,
      descricaoCategoria: c.cDesCateg,
      valorPrevisto: c.nValorPrevisto,
      valorRealizado: c.nValorRealizado,
      diferenca: c.nValorRealizado - c.nValorPrevisto,
    }));

    return {
      ano: orcamento.nAno,
      mes: orcamento.nMes,
      categorias: aplicarFiltros(categorias, param.filtros),
    };
  }
}
