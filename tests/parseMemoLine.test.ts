import { describe, expect, it } from "vitest";
import { parseMemoLine } from "@/lib/parser/parseMemoLine";

describe("parseMemoLine", () => {
  it("parses FS 5x5 135#", () => {
    const r = parseMemoLine("FS 5x5 135#");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.exerciseKey).toBe("front_squat");
      expect(r.reps).toBe(5);
    }
  });

  it("parses DL 3x5 225 lb", () => {
    const r = parseMemoLine("DL 3x5 225 lb");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.exerciseKey).toBe("deadlift");
  });

  it("fails ambiguous line", () => {
    const r = parseMemoLine("AMRAP 12: 10 wall ball");
    expect(r.ok).toBe(false);
  });
});
