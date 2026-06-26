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
        onCreateScene={vi.fn()}
        onEditScene={vi.fn()}
        onDeleteScene={vi.fn()}
        onMoveScene={vi.fn()}
      />
    );

    expect(screen.getAllByText("代码重构").some((element) => element.classList.contains("scene-title"))).toBe(true);
    expect(screen.getByText("Code Refactor Helper")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "详情" })).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("复制最新版本"));
    expect(onCopyPrompt).toHaveBeenCalledTimes(1);
  });

  it("renders scene management controls and keeps scene metadata separated", async () => {
    const user = userEvent.setup();
    const onCreateScene = vi.fn();
    const onEditScene = vi.fn();
    const onDeleteScene = vi.fn();

    render(
      <LibraryPage
        scenes={[sceneFactory()]}
        selectedSceneId="scene-code"
        prompts={[{ prompt: promptFactory(), latestVersion: versionFactory(), scene: sceneFactory() }]}
        onSelectScene={vi.fn()}
        onOpenPrompt={vi.fn()}
        onCopyPrompt={vi.fn()}
        onCreatePrompt={vi.fn()}
        onCreateScene={onCreateScene}
        onEditScene={onEditScene}
        onDeleteScene={onDeleteScene}
        onMoveScene={vi.fn()}
      />
    );

    expect(screen.getByText("场景")).toBeInTheDocument();
    expect(screen.getAllByText("代码重构").find((element) => element.classList.contains("scene-title"))).toBeTruthy();
    expect(screen.getByText("工程质量与 review")).toHaveClass("scene-desc");

    await user.click(screen.getByLabelText("新建场景"));
    await user.click(screen.getByLabelText("编辑场景：代码重构"));
    await user.click(screen.getByLabelText("删除场景：代码重构"));

    expect(onCreateScene).toHaveBeenCalledTimes(1);
    expect(onEditScene).toHaveBeenCalledWith("scene-code");
    expect(onDeleteScene).toHaveBeenCalledWith("scene-code");
  });

  it("renders scene sorting controls", async () => {
    const user = userEvent.setup();
    const onMoveScene = vi.fn();

    render(
      <LibraryPage
        scenes={[sceneFactory()]}
        selectedSceneId="scene-code"
        prompts={[]}
        onSelectScene={vi.fn()}
        onOpenPrompt={vi.fn()}
        onCopyPrompt={vi.fn()}
        onCreatePrompt={vi.fn()}
        onCreateScene={vi.fn()}
        onEditScene={vi.fn()}
        onDeleteScene={vi.fn()}
        onMoveScene={onMoveScene}
      />
    );

    await user.click(screen.getByLabelText("上移场景：代码重构"));
    await user.click(screen.getByLabelText("下移场景：代码重构"));

    expect(onMoveScene).toHaveBeenCalledWith("scene-code", "up");
    expect(onMoveScene).toHaveBeenCalledWith("scene-code", "down");
  });
});
