export interface ClienteOmie {
  codigo_cliente_omie: number;
  razao_social: string;
  nome_fantasia: string;
  cnpj_cpf: string;
  email: string;
  inativo: "S" | "N";
}

export interface TagCliente {
  tag: string;
}

/**
 * Dados pra gravar cliente/fornecedor (Incluir/Alterar). Testado ao vivo:
 * `codigo_cliente_integracao` é obrigatório mesmo no Incluir, apesar da doc
 * pública da Omie marcar como opcional.
 */
export interface DadosClienteParaGravar {
  codigo_cliente_omie?: number;
  codigo_cliente_integracao: string;
  razao_social: string;
  cnpj_cpf: string;
  nome_fantasia?: string;
  email?: string;
  tags?: TagCliente[];
  telefone1_ddd?: string;
  telefone1_numero?: string;
  endereco?: string;
  endereco_numero?: string;
  bairro?: string;
  complemento?: string;
  estado?: string;
  cidade?: string;
  cep?: string;
  observacao?: string;
}

export interface ChaveCliente {
  codigo_cliente_omie?: number;
  codigo_cliente_integracao?: string;
}

export interface StatusClienteOmie {
  codigo_cliente_omie: number;
  codigo_cliente_integracao: string;
  codigo_status: string;
  descricao_status: string;
}

/**
 * Contrato de acesso ao cadastro de Clientes/Fornecedores, independente de
 * vir da Omie real ou de um fake em memória (`OMIE_MOCK=true`). Reaproveitado
 * por outros módulos que recebem só o código do cliente/fornecedor e
 * precisam do nome (ex: `pedidoVenda`, `contasPagar`, `contasReceber`).
 */
export interface IClientesGateway {
  consultarCliente(codigoClienteOmie: number): Promise<ClienteOmie>;

  /**
   * Busca vários clientes por código, deduplicando. Clientes não encontrados
   * (erro de negócio real) são omitidos do mapa; outros erros (rate limit,
   * rede) são relançados — não é seguro tratar "a chamada falhou" como
   * "cliente não existe".
   */
  consultarClientesPorCodigo(codigosCliente: number[]): Promise<Map<number, ClienteOmie>>;

  incluirCliente(dados: DadosClienteParaGravar): Promise<StatusClienteOmie>;

  alterarCliente(
    chave: ChaveCliente,
    dados: Partial<DadosClienteParaGravar>
  ): Promise<StatusClienteOmie>;

  excluirCliente(chave: ChaveCliente): Promise<StatusClienteOmie>;
}
