import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NewPromptPage } from "../../src/manager/pages/NewPromptPage";
import { sceneFactory } from "../../src/test/factories";

describe("NewPromptPage", () => {
  it("marks required title and editor fields", async () => {
    render(
      <NewPromptPage
        scene={sceneFactory()}
        onBack={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText("Prompt 标题").parentElement?.querySelector(".required-marker")).toHaveTextContent("*");
    expect(await screen.findByText("提示词编辑器")).toBeInTheDocument();
    expect(screen.getByText("提示词编辑器").closest(".editor-title-row")?.querySelector(".required-marker")).toHaveTextContent("*");
    expect(screen.getByText("亮点").closest(".field")?.querySelector(".required-marker")).toBeNull();
    expect(screen.getByText("标签").closest(".field")?.querySelector(".required-marker")).toBeNull();
  });

  it("marks cover image as required for image prompts", async () => {
    render(
      <NewPromptPage
        scene={sceneFactory({ promptType: "image" })}
        onBack={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText("上传封面图片").closest(".file-upload-box")?.querySelector(".required-marker")).toHaveTextContent("*");
    expect(await screen.findByText("提示词编辑器")).toBeInTheDocument();
    expect(screen.getByText("提示词编辑器").closest(".editor-title-row")?.querySelector(".required-marker")).toHaveTextContent("*");
  });
});
