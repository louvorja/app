// @vitest-environment node
import { describe, it, expect } from "vitest";
import { BROADCAST_TYPE } from "../BroadcastTypes.js";

describe("BROADCAST_TYPE", () => {
  it("é um objeto congelado (imutável)", () => {
    expect(Object.isFrozen(BROADCAST_TYPE)).toBe(true);
  });

  it("todos os valores são strings não-vazias", () => {
    Object.entries(BROADCAST_TYPE).forEach(([key, value]) => {
      expect(typeof value, `${key} deve ser string`).toBe("string");
      expect(value.length, `${key} não deve ser vazio`).toBeGreaterThan(0);
    });
  });

  it("não há valores duplicados", () => {
    const values = Object.values(BROADCAST_TYPE);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it("contém os tipos esperados", () => {
    expect(BROADCAST_TYPE.SLIDE_CHANGE).toBe("slide_change");
    expect(BROADCAST_TYPE.SLIDES_DATA).toBe("slides_data");
    expect(BROADCAST_TYPE.GO_TO_SLIDE).toBe("go_to_slide");
    expect(BROADCAST_TYPE.BIBLE_VERSE).toBe("bible_verse");
    expect(BROADCAST_TYPE.MESSAGE_BOARD).toBe("message_board");
    expect(BROADCAST_TYPE.MEDIA_CLOSE).toBe("media_close");
  });

  it("contém os tipos in-app esperados", () => {
    expect(BROADCAST_TYPE.MODULE_REFRESH).toBe("module:refresh");
    expect(BROADCAST_TYPE.MODULE_FOCUS_SEARCH).toBe("module:focus_search");
    expect(BROADCAST_TYPE.MEDIA_PREV_MUSIC).toBe("media:prev_music");
    expect(BROADCAST_TYPE.MEDIA_NEXT_MUSIC).toBe("media:next_music");
    expect(BROADCAST_TYPE.LITURGY_NEW_ITEM).toBe("liturgy:new_item");
    expect(BROADCAST_TYPE.LITURGY_NEW_ANNOTATION).toBe("liturgy:new_annotation");
    expect(BROADCAST_TYPE.DRAWING_NUMBER).toBe("drawing_number");
    expect(BROADCAST_TYPE.DRAWING_NAME).toBe("drawing_name");
  });
});
