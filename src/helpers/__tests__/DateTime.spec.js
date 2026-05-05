// @vitest-environment node
import { describe, it, expect } from "vitest";
import DateTime from "../DateTime";

describe("DateTime.shortTime", () => {
  it("formata 0 segundos como 0:00", () => {
    expect(DateTime.shortTime(0)).toBe("0:00");
  });

  it("formata 59 segundos como 0:59", () => {
    expect(DateTime.shortTime(59)).toBe("0:59");
  });

  it("formata 60 segundos como 1:00", () => {
    expect(DateTime.shortTime(60)).toBe("1:00");
  });

  it("formata 3600 segundos (1h) como 60:00", () => {
    expect(DateTime.shortTime(3600)).toBe("60:00");
  });

  it("formata 3661 segundos (1h 1m 1s) como 61:01", () => {
    expect(DateTime.shortTime(3661)).toBe("61:01");
  });

  it("formata 90 segundos como 1:30", () => {
    expect(DateTime.shortTime(90)).toBe("1:30");
  });

  it("aceita string HH:MM:SS e converte corretamente", () => {
    expect(DateTime.shortTime("00:05:30")).toBe("5:30");
    expect(DateTime.shortTime("01:00:00")).toBe("60:00");
    expect(DateTime.shortTime("00:00:10")).toBe("0:10");
  });
});

describe("DateTime.toNumber", () => {
  it("converte 00:00:00 para 0", () => {
    expect(DateTime.toNumber("00:00:00")).toBe(0);
  });

  it("converte 00:01:00 para 60", () => {
    expect(DateTime.toNumber("00:01:00")).toBe(60);
  });

  it("converte 01:00:00 para 3600", () => {
    expect(DateTime.toNumber("01:00:00")).toBe(3600);
  });

  it("converte 00:05:30 para 330", () => {
    expect(DateTime.toNumber("00:05:30")).toBe(330);
  });

  it("converte 01:01:01 para 3661", () => {
    expect(DateTime.toNumber("01:01:01")).toBe(3661);
  });
});
