import { describe, expect, it } from "vitest";
import { chatPath, extFor, mmss, when } from "./chat";

describe("chat helpers", () => {
  it("builds scoped storage paths", () => {
    const p = chatPath("conv-1", "user-1", "webm");
    expect(p).toMatch(/^conv-1\/user-1\/[0-9a-f-]{36}\.webm$/);
    expect(chatPath("c", "u", "../x")).toMatch(/\.x$/);
  });
  it("maps audio types to extensions", () => {
    expect(extFor("audio/webm;codecs=opus")).toBe("webm");
    expect(extFor("audio/mp4")).toBe("m4a");
    expect(extFor("image/png")).toBe("png");
  });
  it("formats durations and times", () => {
    expect(mmss(75)).toBe("01:15");
    const now = new Date("2026-11-18T12:00:00");
    expect(when("2026-11-18T09:05:00", now)).toBe("09:05");
    expect(when("2026-11-17T09:05:00", now)).toBe("Yesterday 09:05");
  });
});
