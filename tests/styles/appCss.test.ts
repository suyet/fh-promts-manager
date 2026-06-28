import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("app prompt card grid css", () => {
  const css = readFileSync("src/shared/styles/app.css", "utf8");

  it("fills the workbench with fixed equal prompt card columns", () => {
    expect(css).toContain("container-type: inline-size");
    expect(css).toContain("grid-template-columns: repeat(3, minmax(0, 1fr));");
    expect(css).toContain("@container (max-width: 1235px)");
    expect(css).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
    expect(css).toContain("@container (max-width: 817px)");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr);");
    expect(css).not.toContain("max-width: 1356px");
  });

  it("styles the prompt detail workspace hierarchy and version rows", () => {
    expect(css).toContain(".detail-grid {\n  display: grid;");
    expect(css).toContain("background: #eef2f7;");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr) 432px;");
    expect(css).toContain("border-left: 1px solid #dbe3ef;");
    expect(css).toContain("min-height: 630px;");
    expect(css).toContain("min-height: calc(100vh - 76px);");
    expect(css).toContain("max-height: 520px;");
    expect(css).toContain("overflow-y: auto;");
    expect(css).toContain(".side-section-heading");
    expect(css).toContain(".editor-title-row strong");
    expect(css).toContain(".editor-toolbar");
    expect(css).toContain(".editor-toolbar .bare-icon-btn .icon");
    expect(css).toContain(".version-card-footer");
    expect(css).toContain(".version-tags");
  });

  it("uses visible green tag chips and compact picker grids", () => {
    expect(css).toContain(".tag {");
    expect(css).toContain("background: #dcfce7;");
    expect(css).toContain(".picker-popover");
    expect(css).toContain("grid-template-columns: repeat(auto-fill, 44px);");
    expect(css).toContain("width: fit-content;");
  });

  it("sizes the popup without right-side dead space", () => {
    expect(css).toContain(".popup {");
    expect(css).toContain("width: 560px;");
    expect(css).toContain(".popup-shell");
    expect(css).toContain(".popup-brand-name");
  });
});
