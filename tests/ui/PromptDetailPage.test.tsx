import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PromptDetailPage } from "../../src/manager/pages/PromptDetailPage";
import { promptFactory, sceneFactory, versionFactory } from "../../src/test/factories";

describe("PromptDetailPage", () => {
  it("places prompt actions in secondary title row and editor actions in editor bar", async () => {
    const user = userEvent.setup();
    const onSaveVersion = vi.fn();

    render(
      <PromptDetailPage
        item={{ prompt: promptFactory(), latestVersion: versionFactory(), scene: sceneFactory() }}
        versions={[versionFactory()]}
        onBack={vi.fn()}
        onCopyLatest={vi.fn()}
        onDelete={vi.fn()}
        onSaveVersion={onSaveVersion}
        onCompareToLatest={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "删除" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
    await user.clear(screen.getByLabelText("提示词正文"));
    await user.type(screen.getByLabelText("提示词正文"), "新的提示词正文");
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(onSaveVersion).toHaveBeenCalledWith("新的提示词正文");
  });
});
