import { INfeGateway } from "../../domain/interfaces/nfe-gateway.js";
import { ConsultarNfeParam, NotaFiscalDetalhe } from "../dto/nfe.dto.js";
import { mapearNotaFiscalDetalhe } from "./mapear-nota-fiscal.js";

export class ConsultarNfeUseCase {
  constructor(private readonly nfeGateway: INfeGateway) {}

  async execute(param: ConsultarNfeParam): Promise<NotaFiscalDetalhe> {
    const nota = param.chave
      ? await this.nfeGateway.consultarNotaPorChave(param.chave)
      : await this.nfeGateway.consultarNotaPorCodigo(param.codigo!);

    return mapearNotaFiscalDetalhe(nota);
  }
}
