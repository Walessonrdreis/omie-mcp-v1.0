# Clientes e Fornecedores

Cadastro de clientes e fornecedores.

### `omie_clientes_consultar`

Consulta o cadastro de um cliente ou fornecedor específico (razão social, nome fantasia, CNPJ/CPF, contato, endereço) — na Omie, cliente e fornecedor usam o MESMO cadastro ('geral/clientes'), diferenciados pela tag ('Cliente'/'Fornecedor'/'Colaborador'/'Sócios', campo 'tags'). Método Omie: ConsultarCliente.

**Parâmetros:**

  - `param` (objeto livre, **obrigatório**) — campos conforme documentação oficial da Omie para este método (não tipado no MCP; a ferramenta repassa o objeto direto).

**Tipo:** passthrough (`geral/clientes` → `ConsultarCliente`)

### `omie_clientes_listar`

Lista clientes/fornecedores cadastrados, com paginação e filtros. Método Omie: ListarClientes (recurso 'geral/clientes'). Aceita filtro avançado via 'clientesFiltro' (ex: {"tags": [{"tag": "Fornecedor"}]} pra listar só fornecedores — ver também omie_fornecedores_listar, que já vem pronto com esse filtro).

**Parâmetros:**

  - `param` (objeto livre, **obrigatório**) — campos conforme documentação oficial da Omie para este método (não tipado no MCP; a ferramenta repassa o objeto direto).

**Tipo:** passthrough (`geral/clientes` → `ListarClientes`)

### `omie_fornecedores_listar`

Lista fornecedores cadastrados — atalho pra omie_clientes_listar já filtrado pela tag 'Fornecedor' (a Omie não separa cliente de fornecedor em cadastros diferentes, só por tag). Suporta paginação e busca por razão social/nome fantasia/CNPJ-CPF, além de apenas_ativos (remove inativos).

**Parâmetros:**

  - `pagina` (number, opcional) — Página da listagem (padrão 1).
  - `registros_por_pagina` (number, opcional) — Registros por página (padrão 20).
  - `razao_social` (string, opcional) — Filtra por razão social (busca parcial).
  - `nome_fantasia` (string, opcional) — Filtra por nome fantasia (busca parcial).
  - `cnpj_cpf` (string, opcional) — Filtra por CNPJ/CPF exato.
  - `apenas_ativos` (boolean, opcional) — Se true, remove da lista os fornecedores marcados como inativos.

**Tipo:** use-case (lógica própria)

### `omie_clientes_incluir` (⚠️ destrutiva)

Cria um novo cliente/fornecedor no cadastro (lembre: é o MESMO cadastro na Omie, diferenciado só pela tag — use tags: [{ tag: 'Cliente' }] ou [{ tag: 'Fornecedor' }]). Método Omie: IncluirCliente. Campos obrigatórios (testado ao vivo — a doc pública da Omie erra ao marcar 'codigo_cliente_integracao' como opcional): codigo_cliente_integracao, razao_social, cnpj_cpf. Opcionais comuns: nome_fantasia, email, tags, telefone, endereço.

**Parâmetros:**

  - `codigo_cliente_integracao` (string, **obrigatório**) — Código de integração (obrigatório na Omie, apesar da doc pública dizer o contrário).
  - `razao_social` (string, **obrigatório**) — Razão social (ou nome, se pessoa física).
  - `cnpj_cpf` (string, **obrigatório**) — CNPJ ou CPF.
  - `nome_fantasia` (string, opcional)
  - `email` (string, opcional)
  - `tags` (array, opcional) — Ex: [{ tag: 'Cliente' }] ou [{ tag: 'Fornecedor' }].
  - `telefone1_ddd` (string, opcional)
  - `telefone1_numero` (string, opcional)
  - `endereco` (string, opcional)
  - `endereco_numero` (string, opcional)
  - `bairro` (string, opcional)
  - `complemento` (string, opcional)
  - `estado` (string, opcional)
  - `cidade` (string, opcional)
  - `cep` (string, opcional)
  - `observacao` (string, opcional)

**Tipo:** use-case (lógica própria)

### `omie_clientes_alterar` (⚠️ destrutiva)

Altera um cliente/fornecedor já cadastrado. Método Omie: AlterarCliente. Identifique por codigo_cliente_omie ou codigo_cliente_integracao, e envie os campos que devem mudar (mesmos aceitos em omie_clientes_incluir).

**Parâmetros:**

  - `codigo_cliente_omie` (number, opcional) — Código Omie do cliente a alterar.
  - `codigo_cliente_integracao` (string, opcional) — Código de integração do cliente a alterar (alternativa).
  - `razao_social` (string, opcional)
  - `cnpj_cpf` (string, opcional)
  - `nome_fantasia` (string, opcional)
  - `email` (string, opcional)
  - `tags` (array, opcional)
  - `telefone1_ddd` (string, opcional)
  - `telefone1_numero` (string, opcional)
  - `endereco` (string, opcional)
  - `endereco_numero` (string, opcional)
  - `bairro` (string, opcional)
  - `complemento` (string, opcional)
  - `estado` (string, opcional)
  - `cidade` (string, opcional)
  - `cep` (string, opcional)
  - `observacao` (string, opcional)

**Tipo:** use-case (lógica própria)

### `omie_clientes_excluir` (⚠️ destrutiva)

Exclui um cliente/fornecedor do cadastro. Método Omie: ExcluirCliente. Identifique por codigo_cliente_omie ou codigo_cliente_integracao. A Omie recusa se já houver movimentação (pedido, conta a pagar/receber, etc.).

**Parâmetros:**

  - `codigo_cliente_omie` (number, opcional)
  - `codigo_cliente_integracao` (string, opcional)

**Tipo:** use-case (lógica própria)
