import {
  IOrcamentoCaixaGateway,
  OrcamentoCaixaOmie,
} from "../../domain/interfaces/orcamento-caixa-gateway.js";

export class OrcamentoCaixaFakeGateway implements IOrcamentoCaixaGateway {
  async consultarOrcamento(ano: number, mes: number): Promise<OrcamentoCaixaOmie> {
    return {
      nAno: ano,
      nMes: mes,
      ListaOrcamentos: [
        { cCodCateg: "1", cDesCateg: "RECEITAS", nValorPrevisto: 10000, nValorRealizado: 9500 },
        { cCodCateg: "1.01.01", cDesCateg: "Vendas (fake)", nValorPrevisto: 10000, nValorRealizado: 9500 },
        { cCodCateg: "2", cDesCateg: "DESPESAS", nValorPrevisto: 8000, nValorRealizado: 7200 },
        { cCodCateg: "2.01.01", cDesCateg: "Compras (fake)", nValorPrevisto: 8000, nValorRealizado: 7200 },
      ],
    };
  }
}
