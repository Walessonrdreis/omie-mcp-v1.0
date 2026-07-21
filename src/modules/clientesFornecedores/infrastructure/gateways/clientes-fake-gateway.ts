import {
  ChaveCliente,
  ClienteOmie,
  DadosClienteParaGravar,
  IClientesGateway,
  StatusClienteOmie,
} from "../../domain/interfaces/clientes-gateway.js";

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
  private proximoCodigo = 6000;

  /**
   * Cópia própria por instância (não a constante `CLIENTES_FAKE` direto) —
   * mesmo cuidado dos demais fakes desta sessão (`produtos`, `estrutura`,
   * `ordemProducao`): agora que o fake também cria/altera/exclui,
   * compartilhar o array por referência vazaria estado de um teste pro outro.
   */
  constructor(private readonly clientes: ClienteOmie[] = CLIENTES_FAKE.map((c) => ({ ...c }))) {}

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

  async incluirCliente(dados: DadosClienteParaGravar): Promise<StatusClienteOmie> {
    const jaExiste = this.clientes.some(
      (c) => dados.cnpj_cpf && c.cnpj_cpf === dados.cnpj_cpf
    );
    if (jaExiste) {
      throw new Error(`Já existe cliente com CNPJ/CPF ${dados.cnpj_cpf} (fake).`);
    }

    const codigo = this.proximoCodigo++;
    this.clientes.push({
      codigo_cliente_omie: codigo,
      razao_social: dados.razao_social,
      nome_fantasia: dados.nome_fantasia ?? "",
      cnpj_cpf: dados.cnpj_cpf,
      email: dados.email ?? "",
      inativo: "N",
    });

    return {
      codigo_cliente_omie: codigo,
      codigo_cliente_integracao: dados.codigo_cliente_integracao,
      codigo_status: "0",
      descricao_status: "Cliente cadastrado com sucesso! (fake)",
    };
  }

  private encontrarIndice(chave: ChaveCliente): number {
    return this.clientes.findIndex(
      (c) => chave.codigo_cliente_omie !== undefined && c.codigo_cliente_omie === chave.codigo_cliente_omie
    );
  }

  async alterarCliente(
    chave: ChaveCliente,
    dados: Partial<DadosClienteParaGravar>
  ): Promise<StatusClienteOmie> {
    const indice = this.encontrarIndice(chave);
    if (indice === -1) {
      throw new Error(`Cliente não encontrado pra alterar (fake): ${JSON.stringify(chave)}`);
    }

    this.clientes[indice] = { ...this.clientes[indice], ...dados };
    const cliente = this.clientes[indice];

    return {
      codigo_cliente_omie: cliente.codigo_cliente_omie,
      codigo_cliente_integracao: dados.codigo_cliente_integracao ?? "",
      codigo_status: "0",
      descricao_status: "Cliente alterado com sucesso! (fake)",
    };
  }

  async excluirCliente(chave: ChaveCliente): Promise<StatusClienteOmie> {
    const indice = this.encontrarIndice(chave);
    if (indice === -1) {
      throw new Error(`Cliente não encontrado pra excluir (fake): ${JSON.stringify(chave)}`);
    }

    const [cliente] = this.clientes.splice(indice, 1);

    return {
      codigo_cliente_omie: cliente.codigo_cliente_omie,
      codigo_cliente_integracao: "",
      codigo_status: "0",
      descricao_status: "Cliente excluído com sucesso! (fake)",
    };
  }
}
