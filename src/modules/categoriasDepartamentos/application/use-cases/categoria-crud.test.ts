import { describe, expect, it } from "vitest";
import { CategoriaFakeGateway } from "../../infrastructure/gateways/categoria-fake-gateway.js";
import {
  AlterarCategoriaUseCase,
  ConsultarCategoriaUseCase,
  IncluirCategoriaUseCase,
  ListarCategoriasUseCase,
} from "./categoria-crud.js";

describe("Categoria CRUD", () => {
  it("inclui, consulta, altera e lista uma categoria", async () => {
    const gateway = new CategoriaFakeGateway();

    const incluir = await new IncluirCategoriaUseCase(gateway).execute({
      categoria_superior: "2.09",
      descricao: "Categoria Teste",
    });
    expect(incluir.codigoStatus).toBe("0");
    const codigo = incluir.codigo;
    expect(codigo.startsWith("2.09.")).toBe(true);

    const consulta = await new ConsultarCategoriaUseCase(gateway).execute({ codigo });
    expect(consulta.descricao).toBe("Categoria Teste");

    const listagem = await new ListarCategoriasUseCase(gateway).execute({});
    expect(listagem.totalRegistros).toBe(1);

    const alterar = await new AlterarCategoriaUseCase(gateway).execute({ codigo, descricao: "Categoria Alterada" });
    expect(alterar.codigoStatus).toBe("0");

    const consultaAlterada = await new ConsultarCategoriaUseCase(gateway).execute({ codigo });
    expect(consultaAlterada.descricao).toBe("Categoria Alterada");
  });
});
