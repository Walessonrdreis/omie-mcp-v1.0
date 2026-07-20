import { OmieClient } from "../../../../omieClient.js";

export interface ClienteOmie {
  codigo_cliente_omie: number;
  razao_social: string;
  nome_fantasia: string;
  cnpj_cpf: string;
  email: string;
  inativo: "S" | "N";
}

/**
 * Encapsula o acesso ao cadastro de Clientes da Omie. Reaproveitado por
 * outros módulos que recebem só o código do cliente e precisam do nome (ex:
 * `pedidoVenda`), evitando duplicar a lógica de consulta/dedup.
 */
export class ClientesOmieGateway {
  constructor(private readonly client: OmieClient) {}

  async consultarCliente(codigoClienteOmie: number): Promise<ClienteOmie> {
    return this.client.call<ClienteOmie>({
      resource: "geral/clientes",
      call: "ConsultarCliente",
      param: { codigo_cliente_omie: codigoClienteOmie },
    });
  }

  /**
   * Busca vários clientes por código em paralelo, deduplicando. Clientes não
   * encontrados são simplesmente omitidos do mapa (quem consome decide o
   * fallback).
   */
  async consultarClientesPorCodigo(
    codigosCliente: number[]
  ): Promise<Map<number, ClienteOmie>> {
    const codigosUnicos = [...new Set(codigosCliente)];
    const resultados = await Promise.allSettled(
      codigosUnicos.map((codigo) => this.consultarCliente(codigo))
    );
    const mapa = new Map<number, ClienteOmie>();
    for (const resultado of resultados) {
      if (resultado.status === "fulfilled") {
        mapa.set(resultado.value.codigo_cliente_omie, resultado.value);
      }
    }
    return mapa;
  }
}
