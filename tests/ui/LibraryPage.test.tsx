import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LibraryPage } from "../../src/manager/pages/LibraryPage";
import { promptFactory, sceneFactory, versionFactory } from "../../src/test/factories";

describe("LibraryPage", () => {
  it("renders scenes and prompt cards with icon actions", async () => {
    const user = userEvent.setup();
    const onOpenPrompt = vi.fn();
    const onCopyPrompt = vi.fn();
    render(
      <LibraryPage
        scenes={[sceneFactory()]}
        selectedSceneId="scene-code"
        prompts={[{ prompt: promptFactory(), latestVersion: versionFactory(), scene: sceneFactory() }]}
        onSelectScene={vi.fn()}
        onOpenPrompt={onOpenPrompt}
        onCopyPrompt={onCopyPrompt}
        onCreatePrompt={vi.fn()}
      />
    );

    expect(screen.getByText("代码重构")).toBeInTheDocument();
    expect(screen.getByText("Code Refactor Helper")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "详情" })).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("复制最新版本"));
    expect(onCopyPrompt).toHaveBeenCalledTimes(1);
  });
});
