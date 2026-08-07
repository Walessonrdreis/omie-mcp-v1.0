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
