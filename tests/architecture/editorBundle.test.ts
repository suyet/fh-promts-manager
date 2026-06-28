import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("editor bundle boundaries", () => {
  it("lazy-loads the CodeMirror prompt editor from the manager workspace", () => {
    const source = readFileSync("src/manager/components/PromptWorkspace.tsx", "utf8");

    expect(source).toContain("lazy(");
    expect(source).toContain('import("../../shared/components/PromptEditor")');
    expect(source).not.toContain('import { PromptEditor } from "../../shared/components/PromptEditor"');
  });

  it("splits CodeMirror dependencies into their own build chunk", () => {
    const source = readFileSync("vite.config.ts", "utf8");

    expect(source).toContain("manualChunks");
    expect(source).toContain("codemirror");
    expect(source).toContain("@codemirror");
  });
});
