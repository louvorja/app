// @vitest-environment node
import { describe, it, expect } from "vitest";
import Strings from "../Strings.js";

describe("Strings.clean", () => {
  it("converte para minúsculas", () => {
    expect(Strings.clean("ALELUIA")).toBe("aleluia");
  });

  it("remove acentos", () => {
    expect(Strings.clean("ação")).toBe("acao");
    expect(Strings.clean("coração")).toBe("coracao");
    expect(Strings.clean("príncipe")).toBe("principe");
    expect(Strings.clean("glória")).toBe("gloria");
  });

  it("remove caracteres não-alfanuméricos", () => {
    expect(Strings.clean("olá, mundo!")).toBe("olamundo");
    expect(Strings.clean("a-b_c")).toBe("abc");
  });

  it("retorna string vazia para entrada vazia ou nula", () => {
    expect(Strings.clean("")).toBe("");
    expect(Strings.clean(null)).toBe("");
    expect(Strings.clean(undefined)).toBe("");
  });

  it("combina todas as transformações", () => {
    expect(Strings.clean("Ó Santo Espírito!")).toBe("osantoespirito");
  });
});

describe("Strings.sort", () => {
  it("ordena strings ignorando acentos", () => {
    const arr = ["Zéfiro", "aurora", "Água", "brisa"];
    const sorted = [...arr].sort(Strings.sort);
    expect(sorted).toEqual(["Água", "aurora", "brisa", "Zéfiro"]);
  });

  it("ordena números quando ambos são number", () => {
    expect(Strings.sort(1, 2)).toBeLessThan(0);
    expect(Strings.sort(10, 5)).toBeGreaterThan(0);
    expect(Strings.sort(3, 3)).toBe(0);
  });

  it("strings iguais retornam 0", () => {
    expect(Strings.sort("abc", "abc")).toBe(0);
  });

  it("trata entradas nulas/undefined como string vazia", () => {
    expect(Strings.sort(null, "abc")).toBeLessThanOrEqual(0);
    expect(Strings.sort(undefined, undefined)).toBe(0);
  });
});
