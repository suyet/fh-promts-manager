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
        onSaveMetadata={vi.fn()}
        onToggleFavorite={vi.fn()}
        onCopyVersion={vi.fn()}
        onCopyEditor={vi.fn()}
        onDownloadEditor={vi.fn()}
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

  it("edits metadata, toggles favorite, deletes, copies versions, and handles visible editor content", async () => {
    const user = userEvent.setup();
    const onSaveMetadata = vi.fn();
    const onToggleFavorite = vi.fn();
    const onDelete = vi.fn();
    const onCopyVersion = vi.fn();
    const onCopyEditor = vi.fn();
    const onDownloadEditor = vi.fn();

    render(
      <PromptDetailPage
        item={{ prompt: promptFactory(), latestVersion: versionFactory(), scene: sceneFactory() }}
        versions={[versionFactory(), versionFactory({ id: "version-0", versionNumber: 0, content: "历史版本" })]}
        onBack={vi.fn()}
        onCopyLatest={vi.fn()}
        onDelete={onDelete}
        onSaveVersion={vi.fn()}
        onSaveMetadata={onSaveMetadata}
        onToggleFavorite={onToggleFavorite}
        onCopyVersion={onCopyVersion}
        onCopyEditor={onCopyEditor}
        onDownloadEditor={onDownloadEditor}
        onCompareToLatest={vi.fn()}
      />
    );

    await user.clear(screen.getByLabelText("Prompt 标题"));
    await user.type(screen.getByLabelText("Prompt 标题"), "新标题");
    await user.clear(screen.getByLabelText("标签"));
    await user.type(screen.getByLabelText("标签"), "one, two");
    await user.click(screen.getByRole("button", { name: "保存信息" }));
    expect(onSaveMetadata).toHaveBeenCalledWith({
      title: "新标题",
      description: "不改变行为的前提下重构代码。",
      tags: ["one", "two"]
    });

    await user.click(screen.getByLabelText("取消收藏"));
    await user.click(screen.getByRole("button", { name: "删除" }));
    await user.click(screen.getAllByLabelText("复制版本")[0]);
    await user.clear(screen.getByLabelText("提示词正文"));
    await user.type(screen.getByLabelText("提示词正文"), "当前可见正文");
    await user.click(screen.getByRole("button", { name: "复制" }));
    await user.click(screen.getByRole("button", { name: "下载" }));

    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onCopyVersion).toHaveBeenCalledWith("version-1");
    expect(onCopyEditor).toHaveBeenCalledWith("当前可见正文");
    expect(onDownloadEditor).toHaveBeenCalledWith("当前可见正文");
  });
});
