import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("app prompt card grid css", () => {
  const css = readFileSync("src/shared/styles/app.css", "utf8");
  const rule = (selector: string) => {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return css.match(new RegExp(`${escapedSelector} \\{[\\s\\S]*?\\n\\}`, "m"))?.[0] ?? "";
  };

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
    const imageDetailShellRule = rule(".image-detail-shell");
    const promptCodeEditorRule = rule(".prompt-code-editor");
    const promptCodeEditorScrollerRule = rule(".prompt-code-editor .cm-scroller");

    expect(css).toContain(".detail-grid {\n  display: grid;");
    expect(css).toContain("background: #eef2f7;");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr) 432px;");
    expect(imageDetailShellRule).toContain("display: grid;");
    expect(imageDetailShellRule).toContain("grid-template-columns: minmax(300px, 0.9fr) minmax(0, 1.6fr);");
    expect(css).toContain("border-left: 1px solid #dbe3ef;");
    expect(promptCodeEditorRule).toContain("min-height: 630px;");
    expect(promptCodeEditorRule).toContain("--prompt-editor-max-height: calc(14px * 1.6 * 50 + 32px);");
    expect(promptCodeEditorRule).toContain("max-height: var(--prompt-editor-max-height);");
    expect(promptCodeEditorRule).toContain("overflow: hidden;");
    expect(promptCodeEditorScrollerRule).toContain("overflow-y: auto;");
    expect(promptCodeEditorScrollerRule).toContain("max-height: var(--prompt-editor-max-height);");
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

  it("keeps version preview images width-fixed but height-adaptive without black bars", () => {
    const versionPreviewImageRule = rule(".version-preview-image");

    expect(versionPreviewImageRule).toContain("height: auto;");
    expect(versionPreviewImageRule).not.toContain("height: 100%;");
    expect(versionPreviewImageRule).not.toContain("min-height: 320px;");
    expect(versionPreviewImageRule).not.toContain("background: #0f172a;");
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
