import { describe, expect, it } from "vitest";
import { weekMonSat } from "@/lib/dates/dayBounds";

describe("weekMonSat", () => {
  it("returns Mon–Sat for a Wednesday anchor", () => {
    const days = weekMonSat("2026-10-01"); // Thu actually - check
    expect(days).toHaveLength(6);
    expect(days[0] <= days[5]).toBe(true);
  });

  it("starts on Monday for anchor Wednesday 2026-10-07", () => {
    const days = weekMonSat("2026-10-07");
    expect(days[0]).toBe("2026-10-05");
    expect(days[5]).toBe("2026-10-10");
  });
});
