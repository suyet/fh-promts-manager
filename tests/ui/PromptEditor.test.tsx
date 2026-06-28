import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { PromptEditor } from "../../src/shared/components/PromptEditor";

function PromptEditorHarness() {
  const [content, setContent] = useState("");
  return (
    <PromptEditor
      content={content}
      onChange={setContent}
      onCopy={vi.fn()}
      onDownload={vi.fn()}
    />
  );
}

describe("PromptEditor", () => {
  it("renders markdown tools in a toolbar row below the title bar", () => {
    render(<PromptEditorHarness />);

    expect(screen.getByText("提示词编辑器").closest(".editor-bar")).toBeTruthy();
    expect(screen.getByRole("button", { name: "JSON 块" }).closest(".editor-toolbar")).toBeTruthy();
    expect(screen.getByRole("button", { name: "JSON 块" }).closest(".editor-bar")).toBeNull();
    expect(screen.getByRole("button", { name: "复制" }).closest(".editor-bar")).toBeTruthy();
    expect(screen.getByRole("button", { name: "下载" }).closest(".editor-bar")).toBeTruthy();
    expect(screen.getByRole("button", { name: "切换为黑底编辑器" }).closest(".editor-bar")).toBeTruthy();
    expect(screen.getByRole("button", { name: "复制" }).closest(".editor-toolbar")).toBeNull();
  });

  it("inserts markdown helpers into the controlled prompt content", async () => {
    const user = userEvent.setup();
    render(<PromptEditorHarness />);

    await user.click(screen.getByRole("button", { name: "JSON 块" }));
    expect(screen.getByLabelText("提示词正文")).toHaveTextContent('"key": "value"');

    await user.click(screen.getByRole("button", { name: "占位符" }));
    expect(screen.getByLabelText("提示词正文")).toHaveTextContent("{{variable}}");
  });
});
