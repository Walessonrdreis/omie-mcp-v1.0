import { afterEach, describe, expect, it, vi } from "vitest";
import { OmieHttpClientReal } from "./http-client-real.js";

describe("OmieHttpClientReal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("monta a URL e o payload corretos e devolve o JSON da resposta", async () => {
    const respostaFake = {
      pagina: 1,
      total_de_paginas: 1,
      produto_servico_cadastro: [{ codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 0 }],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(respostaFake),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("minha-key", "meu-secret");
    const resultado = await client.listarProdutosPagina(1, 50);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe("https://app.omie.com.br/api/v1/geral/produtos/");
    const corpo = JSON.parse(opcoes.body);
    expect(corpo.call).toBe("ListarProdutos");
    expect(corpo.app_key).toBe("minha-key");
    expect(corpo.app_secret).toBe("meu-secret");
    expect(corpo.param).toEqual([
      { pagina: 1, registros_por_pagina: 50, apenas_importado_api: "N", filtrar_apenas_omiepdv: "N" },
    ]);

    expect(resultado).toEqual(respostaFake);
  });

  it("rejeita com mensagem legível quando a Omie devolve faultstring", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ faultstring: "Erro de autenticação", faultcode: "SOAP-ENV:Client-101" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("key-invalida", "secret-invalido");

    await expect(client.listarProdutosPagina(1, 50)).rejects.toThrow("Erro de autenticação");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejeita com mensagem legível quando o corpo da resposta não é JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "<html>não é json</html>",
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("minha-key", "meu-secret");

    await expect(client.listarProdutosPagina(1, 50)).rejects.toThrow(/resposta inválida/i);
  });

  it("tenta de novo em erro 5xx e desiste depois de 3 tentativas", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "Service Unavailable",
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("minha-key", "meu-secret");

    await expect(client.listarProdutosPagina(1, 50)).rejects.toThrow(/503/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("não tenta de novo em erro 4xx", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("minha-key", "meu-secret");

    await expect(client.listarProdutosPagina(1, 50)).rejects.toThrow(/401/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("OmieHttpClientReal — listarPosicoesEstoquePagina", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("monta a URL e o payload corretos (nomes de campo reais da Omie) e devolve o JSON da resposta", async () => {
    const respostaFake = {
      nPagina: 1,
      nTotPaginas: 1,
      nTotRegistros: 1,
      produtos: [
        {
          cCodigo: "A",
          cDescricao: "Produto A",
          codigo_local_estoque: 1,
          fisico: 10,
          nCodProd: 1,
          nSaldo: 10,
          reservado: 0,
          nPendente: 0,
          nCMC: 5,
        },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(respostaFake),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("minha-key", "meu-secret");
    const resultado = await client.listarPosicoesEstoquePagina(1, 50);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe("https://app.omie.com.br/api/v1/estoque/consulta/");
    const corpo = JSON.parse(opcoes.body);
    expect(corpo.call).toBe("ListarPosEstoque");
    expect(corpo.app_key).toBe("minha-key");
    expect(corpo.app_secret).toBe("meu-secret");
    // Nomes de campo confirmados no gateway real já em produção
    // (src/modules/estoque/infrastructure/gateways/estoque-omie-gateway.ts):
    // a Omie espera nPagina/nRegPorPagina, não pagina/registros_por_pagina,
    // e exige codigo_local_estoque (0 = todos os locais).
    expect(corpo.param).toEqual([{ nPagina: 1, nRegPorPagina: 50, codigo_local_estoque: 0 }]);

    expect(resultado).toEqual(respostaFake);
  });

  it("rejeita com mensagem legível quando a Omie devolve faultstring", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ faultstring: "Erro de autenticação", faultcode: "SOAP-ENV:Client-101" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("key-invalida", "secret-invalido");

    await expect(client.listarPosicoesEstoquePagina(1, 50)).rejects.toThrow("Erro de autenticação");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("tenta de novo em erro 5xx e desiste depois de 3 tentativas", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "Service Unavailable",
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("minha-key", "meu-secret");

    await expect(client.listarPosicoesEstoquePagina(1, 50)).rejects.toThrow(/503/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("OmieHttpClientReal — listarOrdensProducaoPagina", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("monta a URL e o payload corretos e devolve o JSON da resposta", async () => {
    const respostaFake = {
      pagina: 1,
      total_de_paginas: 1,
      registros: 1,
      total_de_registros: 1,
      cadastros: [
        {
          identificacao: {
            cCodIntOP: "", cNumOP: "2024/00100", codigo_local_estoque: 1,
            dDtPrevisao: "01/01/2024", nCodOP: 100, nCodProduto: 1, nQtde: 10,
          },
          infAdicionais: { cEtapa: "80", dDtConclusao: "01/01/2024", dDtInicio: "01/01/2024", nCodProjeto: 0 },
          outrasInf: { cConcluida: "S", dConclusao: "01/01/2024", dInclusao: "01/01/2024" },
        },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(respostaFake),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("minha-key", "meu-secret");
    const resultado = await client.listarOrdensProducaoPagina(1, 50);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe("https://app.omie.com.br/api/v1/produtos/op/");
    const corpo = JSON.parse(opcoes.body);
    expect(corpo.call).toBe("ListarOrdemProducao");
    expect(corpo.app_key).toBe("minha-key");
    expect(corpo.app_secret).toBe("meu-secret");
    expect(corpo.param).toEqual([{ pagina: 1, registros_por_pagina: 50 }]);

    expect(resultado).toEqual(respostaFake);
  });

  it("rejeita com mensagem legível quando a Omie devolve faultstring", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ faultstring: "Erro de autenticação", faultcode: "SOAP-ENV:Client-101" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("key-invalida", "secret-invalido");

    await expect(client.listarOrdensProducaoPagina(1, 50)).rejects.toThrow("Erro de autenticação");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("tenta de novo em erro 5xx e desiste depois de 3 tentativas", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "Service Unavailable",
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("minha-key", "meu-secret");

    await expect(client.listarOrdensProducaoPagina(1, 50)).rejects.toThrow(/503/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("não tenta de novo em erro 4xx", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "Bad Request",
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("minha-key", "meu-secret");

    await expect(client.listarOrdensProducaoPagina(1, 50)).rejects.toThrow(/400/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("repassa a página e o tamanho de página recebidos", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        pagina: 3, total_de_paginas: 5, registros: 0, total_de_registros: 0, cadastros: [],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("minha-key", "meu-secret");
    await client.listarOrdensProducaoPagina(3, 200);

    const corpo = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(corpo.param).toEqual([{ pagina: 3, registros_por_pagina: 200 }]);
  });
});

/**
 * O rate limit da Omie NÃO chega como HTTP 429/5xx: chega como `faultstring`
 * dentro de um HTTP 200 ("consumo indevido" / "consumo redundante"). Sem
 * distinguir esse caso de um erro real, uma única ocorrência abortaria a
 * coleta inteira de OPs no meio das ~16 páginas. Semântica replicada de
 * `calcularEsperaRetry` em src/integrations/omie/omieClient.ts.
 */
describe("OmieHttpClientReal — listarOrdensProducaoPagina, rate limit via faultstring", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function respostaOk(json: unknown) {
    return { ok: true, status: 200, text: async () => JSON.stringify(json) };
  }

  const paginaVazia = {
    pagina: 1,
    total_de_paginas: 1,
    registros: 0,
    total_de_registros: 0,
    cadastros: [],
  };

  it("tenta de novo quando a faultstring é de consumo indevido e devolve o sucesso seguinte", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        respostaOk({
          faultcode: "SOAP-ENV:Client-500",
          faultstring: "ERROR: Consumo indevido detectado.",
        })
      )
      .mockResolvedValueOnce(respostaOk(paginaVazia));
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("minha-key", "meu-secret");
    const promessa = client.listarOrdensProducaoPagina(1, 50);
    await vi.runAllTimersAsync();

    await expect(promessa).resolves.toEqual(paginaVazia);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("tenta de novo quando a faultstring é de consumo redundante", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        respostaOk({
          faultcode: "SOAP-ENV:Client-6",
          faultstring: "ERROR: Consumo redundante detectado.",
        })
      )
      .mockResolvedValueOnce(respostaOk(paginaVazia));
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("minha-key", "meu-secret");
    const promessa = client.listarOrdensProducaoPagina(1, 50);
    await vi.runAllTimersAsync();

    await expect(promessa).resolves.toEqual(paginaVazia);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("honra o tempo sugerido pela própria Omie ('Aguarde N segundos')", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        respostaOk({
          faultcode: "SOAP-ENV:Client-500",
          faultstring: "ERROR: Consumo indevido detectado. Aguarde 5 segundos.",
        })
      )
      .mockResolvedValueOnce(respostaOk(paginaVazia));
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("minha-key", "meu-secret");
    const promessa = client.listarOrdensProducaoPagina(1, 50);

    // (5 + 1) * 1000 = 6000ms: em 5000ms ainda não pode ter tentado de novo.
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    await expect(promessa).resolves.toEqual(paginaVazia);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("NÃO tenta de novo quando a faultstring é de erro real (credencial inválida)", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(
      respostaOk({
        faultcode: "SOAP-ENV:Client-101",
        faultstring: "App Key inválido",
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("key-invalida", "secret-invalido");
    // A asserção é anexada antes de avançar os timers pra não gerar
    // "unhandled rejection" enquanto a promessa fica pendente.
    const assercao = expect(client.listarOrdensProducaoPagina(1, 50)).rejects.toThrow(
      "App Key inválido"
    );
    await vi.runAllTimersAsync();
    await assercao;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("respeita o limite de tentativas quando o rate limit persiste", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(
      respostaOk({
        faultcode: "SOAP-ENV:Client-500",
        faultstring: "ERROR: Consumo indevido detectado.",
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("minha-key", "meu-secret");
    const assercao = expect(client.listarOrdensProducaoPagina(1, 50)).rejects.toThrow(
      /consumo indevido/i
    );
    await vi.runAllTimersAsync();
    await assercao;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
