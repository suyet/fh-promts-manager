import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/shared/styles/app.css", "utf8");

describe("app css layout contracts", () => {
  it("keeps the image detail preview wider with a divider before the editor", () => {
    expect(css).toMatch(/\.image-detail-shell\s*{[^}]*grid-template-columns:\s*minmax\(300px,\s*630px\)\s+minmax\(0,\s*1fr\)/s);
    expect(css).toMatch(/\.image-detail-side\s*{[^}]*border-right:\s*1px solid #dbe3ef/s);
  });

  it("keeps the popup compact with an independently scrolling match list", () => {
    expect(css).toMatch(/\.popup\s*{[^}]*width:\s*460px/s);
    expect(css).toMatch(/\.popup-match-section\s*{[^}]*min-height:\s*0/s);
    expect(css).toMatch(/\.popup-list-scroll\s*{[^}]*flex:\s*1/s);
    expect(css).toMatch(/\.popup-list-scroll\s*{[^}]*overflow-y:\s*auto/s);
  });
});
