import { describe, expect, it } from "vitest";
import { applyMarkdownEdit, findPromptPlaceholders } from "../../src/shared/editor/markdownEditing";

describe("markdownEditing", () => {
  it("adds a markdown heading to the current line", () => {
    expect(applyMarkdownEdit("Intro\nBody", { from: 7, to: 7 }, "heading1")).toEqual({
      content: "Intro\n# Body",
      selection: { from: 9, to: 9 }
    });
  });

  it("wraps selected text with strong markdown", () => {
    expect(applyMarkdownEdit("Use this word", { from: 9, to: 13 }, "bold")).toEqual({
      content: "Use this **word**",
      selection: { from: 11, to: 15 }
    });
  });

  it("inserts a fenced json block", () => {
    expect(applyMarkdownEdit("", { from: 0, to: 0 }, "jsonBlock").content).toBe(
      '```json\n{\n  "key": "value"\n}\n```'
    );
  });

  it("inserts and finds prompt placeholders", () => {
    expect(applyMarkdownEdit("Topic: ", { from: 7, to: 7 }, "placeholder")).toEqual({
      content: "Topic: {{variable}}",
      selection: { from: 9, to: 17 }
    });

    expect(findPromptPlaceholders("Use {{topic}} and {{ output_format }}.")).toEqual([
      { from: 4, to: 13, name: "topic" },
      { from: 18, to: 37, name: "output_format" }
    ]);
  });
});
