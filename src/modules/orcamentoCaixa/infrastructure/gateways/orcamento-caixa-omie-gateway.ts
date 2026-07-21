import { OmieClient } from "../../../../omieClient.js";
import {
  IOrcamentoCaixaGateway,
  OrcamentoCaixaOmie,
} from "../../domain/interfaces/orcamento-caixa-gateway.js";

export class OrcamentoCaixaOmieGateway implements IOrcamentoCaixaGateway {
  constructor(private readonly client: OmieClient) {}

  async consultarOrcamento(ano: number, mes: number): Promise<OrcamentoCaixaOmie> {
    return this.client.call<OrcamentoCaixaOmie>({
      resource: "financas/caixa",
      call: "ListarOrcamentos",
      param: { nAno: ano, nMes: mes },
    });
  }
}
