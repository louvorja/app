import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock de Platform antes de importar Storage
vi.mock("@/helpers/Platform", () => ({
  default: { isDesktop: false },
}));

import Storage from "../Storage.js";
import Platform from "@/helpers/Platform";

// ---------------------------------------------------------------------------
// Helpers de mock de storage
// ---------------------------------------------------------------------------

function createStorageMock() {
  const store = {};
  return {
    getItem: vi.fn((k) => store[k] ?? null),
    setItem: vi.fn((k, v) => {
      store[k] = String(v);
    }),
    removeItem: vi.fn((k) => {
      delete store[k];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((k) => delete store[k]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((i) => Object.keys(store)[i] ?? null),
    _store: store,
  };
}

let localMock;
let sessionMock;

beforeEach(() => {
  Platform.isDesktop = false;
  localMock = createStorageMock();
  sessionMock = createStorageMock();
  vi.stubGlobal("localStorage", localMock);
  vi.stubGlobal("sessionStorage", sessionMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Modo web — localStorage
// ---------------------------------------------------------------------------

describe("Storage.set / Storage.get — web/localStorage", () => {
  it("armazena e recupera string", () => {
    Storage.set("nome", "LouvorJA");
    expect(Storage.get("nome", "")).toBe("LouvorJA");
  });

  it("armazena e recupera objeto (serializa JSON)", () => {
    const obj = { tema: "dark", idioma: "pt" };
    Storage.set("config", obj);
    expect(Storage.get("config", {})).toEqual(obj);
  });

  it("retorna ifnull quando chave não existe", () => {
    expect(Storage.get("inexistente", "fallback")).toBe("fallback");
    expect(Storage.get("inexistente")).toBeNull();
  });

  it("retorna null para chave não existente com ifnull=null", () => {
    expect(Storage.get("naoexiste", null)).toBeNull();
  });

  it("auto-parse JSON quando ifnull=null e valor é JSON válido", () => {
    Storage.set("arr", [1, 2, 3]);
    expect(Storage.get("arr", null)).toEqual([1, 2, 3]);
  });

  it("retorna string raw quando JSON é inválido e ifnull=null", () => {
    localMock._store["raw"] = "texto-simples";
    expect(Storage.get("raw", null)).toBe("texto-simples");
  });

  it("retorna string raw quando ifnull não é objeto", () => {
    localMock._store["k"] = "abc";
    expect(Storage.get("k", "default")).toBe("abc");
  });

  it("faz parse de JSON quando ifnull é objeto", () => {
    localMock._store["k"] = JSON.stringify({ a: 1 });
    expect(Storage.get("k", {})).toEqual({ a: 1 });
  });
});

describe("Storage.remove — web/localStorage", () => {
  it("remove chave existente", () => {
    Storage.set("tmp", "valor");
    Storage.remove("tmp");
    expect(Storage.get("tmp")).toBeNull();
    expect(localMock.removeItem).toHaveBeenCalledWith("tmp");
  });
});

describe("Storage.removeAll — web/localStorage", () => {
  it("remove todas as chaves com o prefixo dado", () => {
    Storage.set("db:pt_musics", "v1");
    Storage.set("db:bible_pt", "v2");
    Storage.set("user:theme", "dark");

    Storage.removeAll("db");

    expect(localMock._store["db:pt_musics"]).toBeUndefined();
    expect(localMock._store["db:bible_pt"]).toBeUndefined();
    expect(localMock._store["user:theme"]).toBeDefined();
  });

  it("não remove nada quando nenhuma chave tem o prefixo", () => {
    Storage.set("user:theme", "dark");
    Storage.removeAll("db");
    expect(localMock._store["user:theme"]).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Modo web — sessionStorage
// ---------------------------------------------------------------------------

describe("Storage.set / Storage.get — web/sessionStorage", () => {
  it("armazena e recupera string não-JSON em sessão", () => {
    Storage.set("modulo", "LouvorJA", "session");
    expect(Storage.get("modulo", null, "session")).toBe("LouvorJA");
  });

  it("armazena string numérica e retorna número (JSON.parse comportamento)", () => {
    // "5" é JSON válido → JSON.parse("5") = 5 (número)
    Storage.set("slide", "5", "session");
    expect(Storage.get("slide", null, "session")).toBe(5);
  });

  it("armazena objeto em sessão como JSON", () => {
    const data = { slides: [1, 2, 3] };
    Storage.set("cache", data, "session");
    expect(Storage.get("cache", {}, "session")).toEqual(data);
  });

  it("retorna ifnull quando chave de sessão não existe", () => {
    expect(Storage.get("naoexiste", "fb", "session")).toBe("fb");
  });
});

describe("Storage.remove — sessionStorage", () => {
  it("remove chave de sessão", () => {
    Storage.set("k", "v", "session");
    Storage.remove("k", "session");
    expect(sessionMock.removeItem).toHaveBeenCalledWith("k");
  });
});

describe("Storage.removeAll — sessionStorage", () => {
  it("remove chaves com prefixo na sessão", () => {
    Storage.set("db:musics", "v", "session");
    Storage.set("db:bible", "v", "session");
    Storage.set("ui:theme", "dark", "session");

    Storage.removeAll("db", "session");

    expect(sessionMock.getItem("db:musics")).toBeNull();
    expect(sessionMock.getItem("db:bible")).toBeNull();
    expect(sessionMock.getItem("ui:theme")).toBe("dark");
  });
});

// ---------------------------------------------------------------------------
// storage() accessor
// ---------------------------------------------------------------------------

describe("Storage.storage()", () => {
  it("retorna localStorage para type=local", () => {
    expect(Storage.storage("local")).toBe(localStorage);
  });

  it("retorna sessionStorage para type=session", () => {
    expect(Storage.storage("session")).toBe(sessionStorage);
  });

  it("padrão é localStorage", () => {
    expect(Storage.storage()).toBe(localStorage);
  });
});

// ---------------------------------------------------------------------------
// Modo Electron (mock de Platform.isDesktop + _desktopCache interno)
// ---------------------------------------------------------------------------

describe("Storage — modo desktop (Electron)", () => {
  let mockUserStore;

  beforeEach(async () => {
    mockUserStore = {
      write: vi.fn().mockResolvedValue(undefined),
      read: vi.fn().mockResolvedValue(null),
      remove: vi.fn().mockResolvedValue(undefined),
      keys: vi.fn().mockResolvedValue([]),
      dir: vi.fn().mockResolvedValue("/mock/dir"),
    };
    Platform.isDesktop = true;
    Platform.userStore = mockUserStore;

    await Storage.hydrate();
  });

  afterEach(() => {
    Platform.isDesktop = false;
    Platform.userStore = null;
  });

  it("set armazena no cache interno e chama userStore.write", () => {
    Storage.set("chave_d1", "valor");
    expect(mockUserStore.write).toHaveBeenCalledWith("chave_d1", "valor");
  });

  it("get lê do cache interno (sem IPC)", () => {
    Storage.set("chave_d2", { x: 1 });
    expect(Storage.get("chave_d2", null)).toEqual({ x: 1 });
  });

  it("get retorna ifnull quando chave não existe no cache", () => {
    expect(Storage.get("naoexiste_desktop_xz", "fallback")).toBe("fallback");
  });

  it("remove deleta do cache interno e chama userStore.remove", () => {
    Storage.set("tmp_d", "v");
    Storage.remove("tmp_d");
    expect(Storage.get("tmp_d")).toBeNull();
    expect(mockUserStore.remove).toHaveBeenCalledWith("tmp_d");
  });

  it("removeAll remove chaves com prefixo do cache desktop", () => {
    Storage.set("db:musics_d", "v1");
    Storage.set("db:bible_d", "v2");
    Storage.set("user:theme_d", "dark");

    Storage.removeAll("db");

    expect(Storage.get("db:musics_d")).toBeNull();
    expect(Storage.get("db:bible_d")).toBeNull();
    expect(Storage.get("user:theme_d")).toBe("dark");
    expect(mockUserStore.remove).toHaveBeenCalledWith("db:musics_d");
    expect(mockUserStore.remove).toHaveBeenCalledWith("db:bible_d");
  });
});

// ---------------------------------------------------------------------------
// Hidratação com chaves existentes no userStore (módulo isolado)
// ---------------------------------------------------------------------------

describe("Storage — hydrate com dados existentes no userStore", () => {
  it("carrega chaves do userStore no cache durante hydrate()", async () => {
    vi.resetModules();

    const mockPlatformData = {
      isDesktop: true,
      userStore: {
        keys: vi.fn().mockResolvedValue(["idioma", "tema"]),
        read: vi.fn().mockImplementation((k) => Promise.resolve(k === "idioma" ? "pt" : "dark")),
        write: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
        dir: vi.fn().mockResolvedValue("/mock/isolated"),
      },
    };

    vi.doMock("@/helpers/Platform", () => ({ default: mockPlatformData }));

    const { default: FreshStorage } = await import("../Storage.js");
    await FreshStorage.hydrate();

    expect(FreshStorage.get("idioma")).toBe("pt");
    expect(FreshStorage.get("tema")).toBe("dark");

    vi.resetModules();
  });

  it("assertHydrated lança erro quando chamado antes de hydrate() no Electron", async () => {
    vi.resetModules();

    vi.doMock("@/helpers/Platform", () => ({
      default: {
        isDesktop: true,
        userStore: {
          keys: vi.fn().mockResolvedValue([]),
          read: vi.fn(),
          write: vi.fn(),
          remove: vi.fn(),
          dir: vi.fn().mockResolvedValue("/mock"),
        },
      },
    }));

    const { default: FreshStorage } = await import("../Storage.js");

    // _desktopHydrated ainda false — deve lançar
    expect(() => FreshStorage.set("key", "val")).toThrow(/antes de Storage\.hydrate/);
    expect(() => FreshStorage.get("key")).toThrow(/antes de Storage\.hydrate/);

    vi.resetModules();
  });

  it("migrateFromLocalStorage copia dados do localStorage para userStore na primeira abertura", async () => {
    vi.resetModules();

    const writeSpy = vi.fn().mockResolvedValue(undefined);

    vi.doMock("@/helpers/Platform", () => ({
      default: {
        isDesktop: true,
        userStore: {
          keys: vi.fn().mockResolvedValue([]), // userStore vazio → trigger migração
          read: vi.fn().mockResolvedValue(null),
          write: writeSpy,
          remove: vi.fn().mockResolvedValue(undefined),
          dir: vi.fn().mockResolvedValue("/mock"),
        },
      },
    }));

    // Popula localStorage com dados existentes para migração
    const mockLS = createStorageMock();
    mockLS._store["user:theme"] = "dark";
    mockLS._store["user:lang"] = "pt";
    vi.stubGlobal("localStorage", mockLS);

    const { default: FreshStorage } = await import("../Storage.js");
    await FreshStorage.hydrate();

    // writeSpy deve ter sido chamado com os dados migrados
    expect(writeSpy).toHaveBeenCalledWith("user:theme", "dark");
    expect(writeSpy).toHaveBeenCalledWith("user:lang", "pt");

    vi.unstubAllGlobals();
    vi.resetModules();
  });
});
