import { describe, expect, it } from "vitest";
import { diffService } from "../../src/shared/services/diffService";

describe("diffService", () => {
  it("returns removed, added, and unchanged line groups", () => {
    const rows = diffService.compareHistoryToLatest({
      historyLabel: "v2",
      latestLabel: "v3 Latest",
      historyContent: "A\nB\nC",
      latestContent: "A\nB changed\nC"
    });

    expect(rows.historyLabel).toBe("v2");
    expect(rows.latestLabel).toBe("v3 Latest");
    expect(rows.parts.some((part) => part.type === "removed" && part.text.includes("B"))).toBe(true);
    expect(rows.parts.some((part) => part.type === "added" && part.text.includes("B changed"))).toBe(true);
    expect(rows.parts.some((part) => part.type === "same" && part.text.includes("A"))).toBe(true);
  });
});
