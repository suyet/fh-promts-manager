import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LibraryPage } from "../../src/manager/pages/LibraryPage";
import { resetDatabase } from "../../src/shared/data/db";
import { repositories } from "../../src/shared/data/repositories";
import { imageAssetFactory, promptFactory, sceneFactory, versionFactory } from "../../src/test/factories";

describe("LibraryPage", () => {
  beforeEach(async () => {
    await resetDatabase();
    vi.restoreAllMocks();
  });

  it("renders scenes and prompt cards with icon actions", async () => {
    const user = userEvent.setup();
    const onOpenPrompt = vi.fn();
    const onCopyPrompt = vi.fn();
    const onTogglePromptFavorite = vi.fn();
    render(
      <LibraryPage
        scenes={[sceneFactory()]}
        selectedSceneId="scene-code"
        prompts={[{
          prompt: promptFactory({ updatedAt: "2026-01-22T00:00:00.000Z" }),
          latestVersion: versionFactory({
            content: "  最新  版本\n亮 点  内容  ",
            description: "最新版本亮点",
            tags: ["latest-tag"]
          }),
          scene: sceneFactory()
        }]}
        onSelectScene={vi.fn()}
        onOpenPrompt={onOpenPrompt}
        onCopyPrompt={onCopyPrompt}
        onTogglePromptFavorite={onTogglePromptFavorite}
        onCreatePrompt={vi.fn()}
        onCreateScene={vi.fn()}
        onEditScene={vi.fn()}
        onDeleteScene={vi.fn()}
        onToggleSceneSort={vi.fn()}
        onReorderScene={vi.fn()}
      />
    );

    expect(screen.getAllByText("代码重构").some((element) => element.classList.contains("scene-title"))).toBe(true);
    expect(screen.getAllByText("文本").some((element) => element.classList.contains("scene-type-pill"))).toBe(true);
    expect(screen.getAllByText("文本").some((element) => element.closest(".page-title-line"))).toBe(true);
    expect(screen.getByText("Code Refactor Helper")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "详情" })).not.toBeInTheDocument();
    expect(screen.getByText("latest-tag")).toHaveClass("tag");
    expect(screen.queryByText("old")).not.toBeInTheDocument();
    expect(screen.getByText("2026/1/22")).toHaveClass("prompt-updated-date");
    expect(screen.getByText("v1")).toBeInTheDocument();
    expect(screen.queryByText("# v1")).not.toBeInTheDocument();
    expect(screen.getByLabelText("取消收藏")).toHaveClass("favorite-active");
    expect(screen.queryByText("场景：代码重构")).not.toBeInTheDocument();
    expect(screen.getByText("最新版本亮点内容")).toHaveClass("prompt-card-description");
    expect(screen.getByText("最新版本亮点内容").closest(".card-top")).toBeNull();
    expect(screen.getByText("最新版本亮点内容").closest(".card-description-button")).toBeTruthy();

    await user.click(screen.getByText("latest-tag"));
    expect(onOpenPrompt).toHaveBeenCalledWith("prompt-refactor");
    onOpenPrompt.mockClear();

    await user.click(screen.getByText("2026/1/22"));
    expect(onOpenPrompt).toHaveBeenCalledWith("prompt-refactor");
    onOpenPrompt.mockClear();

    await user.click(screen.getByLabelText("取消收藏"));
    expect(onTogglePromptFavorite).toHaveBeenCalledTimes(1);
    expect(onOpenPrompt).not.toHaveBeenCalled();

    await user.click(screen.getByLabelText("复制最新版本"));
    expect(onCopyPrompt).toHaveBeenCalledTimes(1);
    expect(onOpenPrompt).not.toHaveBeenCalled();
  });

  it("enters prompt sorting mode and reorders existing cards by dragging", async () => {
    const user = userEvent.setup();
    const onTogglePromptSort = vi.fn();
    const onReorderPrompt = vi.fn();
    const oldPrompt = promptFactory({
      id: "prompt-old",
      title: "旧 Prompt",
      latestVersionId: "version-old",
      updatedAt: "2026-01-01T00:00:00.000Z"
    });
    const newPrompt = promptFactory({
      id: "prompt-new",
      title: "新 Prompt",
      latestVersionId: "version-new",
      updatedAt: "2026-01-22T00:00:00.000Z"
    });

    render(
      <LibraryPage
        scenes={[sceneFactory()]}
        selectedSceneId="scene-code"
        prompts={[
          { prompt: oldPrompt, latestVersion: versionFactory({ id: "version-old", promptId: "prompt-old" }), scene: sceneFactory() },
          { prompt: newPrompt, latestVersion: versionFactory({ id: "version-new", promptId: "prompt-new" }), scene: sceneFactory() }
        ]}
        onSelectScene={vi.fn()}
        onOpenPrompt={vi.fn()}
        onCopyPrompt={vi.fn()}
        onTogglePromptFavorite={vi.fn()}
        onCreatePrompt={vi.fn()}
        onCreateScene={vi.fn()}
        onEditScene={vi.fn()}
        onDeleteScene={vi.fn()}
        onToggleSceneSort={vi.fn()}
        onReorderScene={vi.fn()}
        isSortingPrompts
        onTogglePromptSort={onTogglePromptSort}
        onReorderPrompt={onReorderPrompt}
      />
    );

    expect(screen.getByText("拖动 Prompt 卡片调整顺序")).toHaveClass("sort-hint");
    expect(screen.getAllByRole("article")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "保存排序" }));
    expect(onTogglePromptSort).toHaveBeenCalledTimes(1);

    fireEvent.dragStart(screen.getByTestId("prompt-card-prompt-old"));
    fireEvent.drop(screen.getByTestId("prompt-card-prompt-new"));

    expect(onReorderPrompt).toHaveBeenCalledWith("prompt-old", "prompt-new");
  });

  it("renders image prompt cards around the cover image with compact metadata", async () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:image-card");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    await repositories.imageAssets.put(imageAssetFactory());
    const imageScene = sceneFactory({ promptType: "image", icon: "image", name: "生图场景" });
    const onCopyPrompt = vi.fn();
    const onTogglePromptFavorite = vi.fn();

    render(
      <LibraryPage
        scenes={[imageScene]}
        selectedSceneId="scene-code"
        prompts={[{
          prompt: promptFactory(),
          latestVersion: versionFactory({
            imageAssetId: "asset-cover",
            content: "图片提示词正文",
            description: "图片亮点",
            tags: ["image-tag"]
          }),
          scene: imageScene
        }]}
        onSelectScene={vi.fn()}
        onOpenPrompt={vi.fn()}
        onCopyPrompt={onCopyPrompt}
        onTogglePromptFavorite={onTogglePromptFavorite}
        onCreatePrompt={vi.fn()}
        onCreateScene={vi.fn()}
        onEditScene={vi.fn()}
        onDeleteScene={vi.fn()}
        onToggleSceneSort={vi.fn()}
        onReorderScene={vi.fn()}
      />
    );

    const card = screen.getByTestId("prompt-card-prompt-refactor");
    expect(card).toHaveClass("image-prompt-card");
    expect(await screen.findByAltText("Code Refactor Helper 封面")).toHaveAttribute("src", "blob:image-card");
    expect(within(card).getByText("Code Refactor Helper")).toBeInTheDocument();
    expect(within(card).getByText("v1")).toBeInTheDocument();
    expect(within(card).queryByText("图片提示词正文")).not.toBeInTheDocument();
    expect(within(card).queryByText("image-tag")).not.toBeInTheDocument();
    await userEvent.setup().click(within(card).getByLabelText("复制最新版本"));
    expect(onCopyPrompt).toHaveBeenCalledTimes(1);
    await userEvent.setup().click(within(card).getByLabelText("取消收藏"));
    expect(onTogglePromptFavorite).toHaveBeenCalledTimes(1);
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
        onTogglePromptFavorite={vi.fn()}
        onCreatePrompt={vi.fn()}
        onCreateScene={onCreateScene}
        onEditScene={onEditScene}
        onDeleteScene={onDeleteScene}
        onToggleSceneSort={vi.fn()}
        onReorderScene={vi.fn()}
      />
    );

    expect(screen.getByText("场景")).toHaveClass("scene-section-title");
    expect(screen.getAllByText("代码重构").find((element) => element.classList.contains("scene-title"))).toBeTruthy();
    expect(screen.getByText("1 个提示词").closest(".scene-count-line")).toBeTruthy();
    expect(screen.getAllByText("文本").some((element) => element.classList.contains("scene-type-pill"))).toBe(true);
    expect(screen.getByText("工程质量与 review")).toHaveClass("scene-desc");
    expect(screen.getByText("工程质量与 review").closest(".scene-select")).toBeNull();
    expect(screen.getByText("工程质量与 review").closest(".scene-desc-button")).toBeTruthy();
    expect(screen.getByLabelText("更多操作：代码重构").closest(".scene-actions")).toHaveClass("hover-only");
    expect(screen.getByLabelText("新建场景")).toHaveClass("bare-icon-btn");
    expect(screen.getByLabelText("调整场景排序")).toHaveClass("bare-icon-btn");
    expect(screen.getByLabelText("更多操作：代码重构")).toHaveClass("bare-icon-btn");

    await user.click(screen.getByLabelText("新建场景"));
    await user.click(screen.getByLabelText("更多操作：代码重构"));
    await user.click(screen.getByRole("menuitem", { name: "编辑" }));
    await user.click(screen.getByLabelText("更多操作：代码重构"));
    await user.click(screen.getByRole("menuitem", { name: "删除" }));

    expect(onCreateScene).toHaveBeenCalledTimes(1);
    expect(onEditScene).toHaveBeenCalledWith("scene-code");
    expect(onDeleteScene).toHaveBeenCalledWith("scene-code");
  });

  it("shows product empty states when there are no scenes or prompts", () => {
    render(
      <LibraryPage
        scenes={[]}
        selectedSceneId={null}
        prompts={[]}
        onSelectScene={vi.fn()}
        onOpenPrompt={vi.fn()}
        onCopyPrompt={vi.fn()}
        onTogglePromptFavorite={vi.fn()}
        onCreatePrompt={vi.fn()}
        onCreateScene={vi.fn()}
        onEditScene={vi.fn()}
        onDeleteScene={vi.fn()}
        onToggleSceneSort={vi.fn()}
        onReorderScene={vi.fn()}
      />
    );

    expect(screen.getByText("暂无场景")).toHaveClass("empty-title");
    expect(screen.getByText("先新建一个场景，再沉淀 Prompt 资产。")).toHaveClass("empty-copy");
    expect(screen.getByText("暂无 Prompt")).toHaveClass("empty-title");
    expect(screen.getByText("新建 Prompt 后会显示在这里。")).toHaveClass("empty-copy");
    expect(screen.getByRole("button", { name: "新建" })).toBeDisabled();
  });

  it("shows an empty prompt state inside an existing scene", () => {
    render(
      <LibraryPage
        scenes={[sceneFactory()]}
        selectedSceneId="scene-code"
        prompts={[]}
        onSelectScene={vi.fn()}
        onOpenPrompt={vi.fn()}
        onCopyPrompt={vi.fn()}
        onTogglePromptFavorite={vi.fn()}
        onCreatePrompt={vi.fn()}
        onCreateScene={vi.fn()}
        onEditScene={vi.fn()}
        onDeleteScene={vi.fn()}
        onToggleSceneSort={vi.fn()}
        onReorderScene={vi.fn()}
      />
    );

    expect(screen.getByText("当前场景还没有 Prompt")).toHaveClass("empty-title");
    expect(screen.getByRole("button", { name: "排序" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "新建" })).toBeEnabled();
  });

  it("keeps scene sorting in the header and reorders cards in sort mode", async () => {
    const user = userEvent.setup();
    const onToggleSceneSort = vi.fn();
    const onReorderScene = vi.fn();
    const firstScene = sceneFactory();
    const secondScene = sceneFactory({
      id: "scene-copy",
      name: "文案润色",
      description: "语气与标题",
      icon: "pen",
      color: "teal",
      sortOrder: 2
    });

    render(
      <LibraryPage
        scenes={[firstScene, secondScene]}
        selectedSceneId="scene-code"
        isSortingScenes
        prompts={[]}
        onSelectScene={vi.fn()}
        onOpenPrompt={vi.fn()}
        onCopyPrompt={vi.fn()}
        onTogglePromptFavorite={vi.fn()}
        onCreatePrompt={vi.fn()}
        onCreateScene={vi.fn()}
        onEditScene={vi.fn()}
        onDeleteScene={vi.fn()}
        onToggleSceneSort={onToggleSceneSort}
        onReorderScene={onReorderScene}
      />
    );

    expect(screen.getByText("拖动场景卡片调整顺序")).toHaveClass("sort-hint");
    expect(screen.getByTestId("scene-card-scene-code")).toHaveClass("sorting");
    expect(screen.queryByLabelText("上移场景：代码重构")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("下移场景：代码重构")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("保存场景排序"));
    expect(onToggleSceneSort).toHaveBeenCalledTimes(1);

    fireEvent.dragStart(screen.getByTestId("scene-card-scene-code"));
    fireEvent.drop(screen.getByTestId("scene-card-scene-copy"));

    expect(onReorderScene).toHaveBeenCalledWith("scene-code", "scene-copy");
  });
});
