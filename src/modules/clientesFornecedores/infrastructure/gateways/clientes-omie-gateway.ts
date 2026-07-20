import { OmieClient } from "../../../../omieClient.js";
import { mapWithConcurrency } from "../../../../shared/concurrency.js";
import { ClienteOmie, IClientesGateway } from "../../domain/interfaces/clientes-gateway.js";

export { ClienteOmie } from "../../domain/interfaces/clientes-gateway.js";

const CONCORRENCIA_MAXIMA = 5;

/**
 * Encapsula o acesso ao cadastro de Clientes da Omie. Reaproveitado por
 * outros módulos que recebem só o código do cliente e precisam do nome (ex:
 * `pedidoVenda`), evitando duplicar a lógica de consulta/dedup.
 */
export class ClientesOmieGateway implements IClientesGateway {
  constructor(private readonly client: OmieClient) {}

  async consultarCliente(codigoClienteOmie: number): Promise<ClienteOmie> {
    return this.client.call<ClienteOmie>({
      resource: "geral/clientes",
      call: "ConsultarCliente",
      param: { codigo_cliente_omie: codigoClienteOmie },
    });
  }

  async consultarClientesPorCodigo(
    codigosCliente: number[]
  ): Promise<Map<number, ClienteOmie>> {
    const codigosUnicos = [...new Set(codigosCliente)];
    const resultados = await mapWithConcurrency(codigosUnicos, CONCORRENCIA_MAXIMA, (codigo) =>
      this.consultarCliente(codigo)
    );
    const mapa = new Map<number, ClienteOmie>();
    for (const resultado of resultados) {
      if (resultado.status === "fulfilled") {
        mapa.set(resultado.value.codigo_cliente_omie, resultado.value);
        continue;
      }
      const mensagem = (resultado.reason as Error)?.message ?? "";
      const naoEncontrado = /não cadastrado/i.test(mensagem);
      if (!naoEncontrado) {
        throw resultado.reason;
      }
    }
    return mapa;
  }
}
