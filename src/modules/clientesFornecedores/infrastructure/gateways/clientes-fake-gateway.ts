import { ClienteOmie, IClientesGateway } from "../../domain/interfaces/clientes-gateway.js";

const CLIENTES_FAKE: ClienteOmie[] = [
  {
    codigo_cliente_omie: 5001,
    razao_social: "Cliente Fake Ltda",
    nome_fantasia: "Cliente Fake",
    cnpj_cpf: "00.000.000/0001-00",
    email: "cliente@fake.com",
    inativo: "N",
  },
  {
    codigo_cliente_omie: 5002,
    razao_social: "Fornecedor Fake S.A.",
    nome_fantasia: "Fornecedor Fake",
    cnpj_cpf: "11.111.111/0001-11",
    email: "fornecedor@fake.com",
    inativo: "N",
  },
];

/**
 * Implementação em memória de `IClientesGateway`, sem chamar a Omie real —
 * usada quando `OMIE_MOCK=true`, pra desenvolvimento/testes offline.
 */
export class ClientesFakeGateway implements IClientesGateway {
  constructor(private readonly clientes: ClienteOmie[] = CLIENTES_FAKE) {}

  async consultarCliente(codigoClienteOmie: number): Promise<ClienteOmie> {
    const cliente = this.clientes.find((c) => c.codigo_cliente_omie === codigoClienteOmie);
    if (!cliente) {
      throw new Error(`Cliente de código ${codigoClienteOmie} não cadastrado (fake).`);
    }
    return cliente;
  }

  async consultarClientesPorCodigo(
    codigosCliente: number[]
  ): Promise<Map<number, ClienteOmie>> {
    const codigosUnicos = [...new Set(codigosCliente)];
    const mapa = new Map<number, ClienteOmie>();
    for (const codigo of codigosUnicos) {
      const cliente = this.clientes.find((c) => c.codigo_cliente_omie === codigo);
      if (cliente) {
        mapa.set(codigo, cliente);
      }
    }
    return mapa;
  }
}
