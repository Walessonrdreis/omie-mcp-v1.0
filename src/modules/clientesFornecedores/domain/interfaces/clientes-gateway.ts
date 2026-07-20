export interface ClienteOmie {
  codigo_cliente_omie: number;
  razao_social: string;
  nome_fantasia: string;
  cnpj_cpf: string;
  email: string;
  inativo: "S" | "N";
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
}
