import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PromptDetailPage } from "../../src/manager/pages/PromptDetailPage";
import { promptFactory, sceneFactory, versionFactory } from "../../src/test/factories";

describe("PromptDetailPage", () => {
  it("uses a layered detail header and editor toolbar without an editor save button", async () => {
    const user = userEvent.setup();
    const onSaveVersion = vi.fn();
    const latestVersion = versionFactory({
      content: "新的提示词正文",
      description: "当前亮点",
      tags: ["review"]
    });

    render(
      <PromptDetailPage
        item={{ prompt: promptFactory(), latestVersion, scene: sceneFactory() }}
        versions={[latestVersion]}
        onBack={vi.fn()}
        onCopyLatest={vi.fn()}
        onDelete={vi.fn()}
        onSaveVersion={onSaveVersion}
        onSaveMetadata={vi.fn()}
        onToggleFavorite={vi.fn()}
        onCopyEditor={vi.fn()}
        onDownloadEditor={vi.fn()}
        onCompareToLatest={vi.fn()}
      />
    );

    expect(screen.queryByText("删除")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除" })).toHaveClass("bare-icon-btn");
    expect(screen.getByRole("button", { name: "保存新版本" })).toHaveClass("bare-icon-btn");
    expect(screen.getByRole("button", { name: "复制最新版本" }).previousElementSibling).toHaveClass("detail-action-divider");
    expect(screen.getByText("场景：代码重构")).toHaveClass("detail-sub-meta-item");
    expect(screen.getByText("更新于 2026/6/26")).toHaveClass("detail-sub-meta-item");
    expect(screen.getByText("v1")).toHaveClass("version-pill");
    expect(await screen.findByText("提示词编辑器")).toBeInTheDocument();
    expect(await screen.findByText("7 字符")).toBeInTheDocument();
    expect(screen.getByLabelText("提示词正文").closest(".editor")).toHaveClass("editor-light");
    expect(screen.getByRole("button", { name: "一级标题" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "二级标题" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "加粗" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "代码块" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "JSON 块" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "占位符" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复制" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下载" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "保存" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "切换为黑底编辑器" }));
    expect(screen.getByLabelText("提示词正文").closest(".editor")).toHaveClass("editor-dark");

    await user.click(screen.getByRole("button", { name: "保存新版本" }));
    expect(screen.getByRole("dialog", { name: "保存新版本" })).toBeInTheDocument();
    expect(screen.getByText("请确认亮点和标签已更新")).toBeInTheDocument();
    expect(screen.getByLabelText("版本号")).toHaveValue("v2");
    await user.clear(screen.getByLabelText("版本号"));
    await user.type(screen.getByLabelText("版本号"), "V5大概答复12345");
    expect(screen.getByLabelText("版本号")).toHaveValue("V5大概答复1234");
    await user.click(screen.getByRole("button", { name: "确认保存" }));
    expect(onSaveVersion).toHaveBeenCalledWith({
      content: "新的提示词正文",
      description: "当前亮点",
      tags: ["review"],
      customVersionLabel: "V5大概答复1234"
    });
  });

  it("keeps title on prompt but saves highlight and tags with the next version", async () => {
    const user = userEvent.setup();
    const onSaveMetadata = vi.fn();
    const onSaveVersion = vi.fn();
    const item = {
      prompt: promptFactory(),
      latestVersion: versionFactory({ description: "版本亮点", tags: ["review", "cleanup"] }),
      scene: sceneFactory()
    };

    render(
      <PromptDetailPage
        item={item}
        versions={[versionFactory()]}
        onBack={vi.fn()}
        onCopyLatest={vi.fn()}
        onDelete={vi.fn()}
        onSaveVersion={onSaveVersion}
        onSaveMetadata={onSaveMetadata}
        onToggleFavorite={vi.fn()}
        onCopyEditor={vi.fn()}
        onDownloadEditor={vi.fn()}
        onCompareToLatest={vi.fn()}
      />
    );

    expect(screen.queryByLabelText("Prompt 标题")).not.toBeInTheDocument();
    expect(screen.queryByText("保存信息")).not.toBeInTheDocument();
    expect(screen.getByText("亮点").closest(".side-section-heading")).toBeTruthy();
    expect(screen.getByText("标签").closest(".side-section-heading")).toBeTruthy();
    expect(screen.getByText("版本历史").closest(".side-section-heading")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "编辑标题 Code Refactor Helper" }));
    await user.clear(screen.getByLabelText("编辑提示词标题"));
    await user.type(screen.getByLabelText("编辑提示词标题"), "新标题");
    await user.tab();
    expect(onSaveMetadata).toHaveBeenCalledWith({
      title: "新标题",
      favorite: true
    });

    await user.clear(screen.getByLabelText("亮点"));
    await user.type(screen.getByLabelText("亮点"), "V5大概答复");
    expect(onSaveMetadata).toHaveBeenCalledTimes(1);

    await user.type(screen.getByLabelText("添加标签"), "Deepseek V3{Enter}");
    expect(onSaveMetadata).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "保存新版本" }));
    await user.click(screen.getByRole("button", { name: "确认保存" }));
    expect(onSaveVersion).toHaveBeenCalledWith({
      content: "请重构下面的代码。",
      description: "V5大概答复",
      tags: ["review", "cleanup", "Deepseek V"],
      customVersionLabel: undefined
    });

    const highlightUnit = "一二三四五六七八九十";
    await user.clear(screen.getByLabelText("亮点"));
    await user.type(screen.getByLabelText("亮点"), `${highlightUnit.repeat(11)}超出`);
    expect(screen.getByLabelText("亮点")).toHaveValue(highlightUnit.repeat(10));

    await user.clear(screen.getByLabelText("添加标签"));
    await user.type(screen.getByLabelText("添加标签"), "1234567890123");
    expect(screen.getByLabelText("添加标签")).toHaveValue("1234567890");
    await user.keyboard("{Enter}");
    expect(screen.getByText("1234567890")).toBeInTheDocument();
  });

  it("refreshes editor state when the latest version changes", async () => {
    const firstVersion = versionFactory({
      id: "version-1",
      content: "第一版正文",
      description: "第一版亮点",
      tags: ["old"]
    });
    const secondVersion = versionFactory({
      id: "version-2",
      versionNumber: 2,
      content: "第二版正文",
      description: "第二版亮点",
      tags: ["new"]
    });
    const props = {
      item: {
        prompt: promptFactory({ latestVersionId: "version-1", latestVersionNumber: 1 }),
        latestVersion: firstVersion,
        scene: sceneFactory()
      },
      versions: [firstVersion],
      onBack: vi.fn(),
      onCopyLatest: vi.fn(),
      onDelete: vi.fn(),
      onSaveVersion: vi.fn(),
      onSaveMetadata: vi.fn(),
      onToggleFavorite: vi.fn(),
      onCopyEditor: vi.fn(),
      onDownloadEditor: vi.fn(),
      onCompareToLatest: vi.fn()
    };

    const { rerender } = render(<PromptDetailPage {...props} />);

    expect(await screen.findByLabelText("提示词正文")).toHaveTextContent("第一版正文");

    rerender(
      <PromptDetailPage
        {...props}
        item={{
          prompt: promptFactory({ latestVersionId: "version-2", latestVersionNumber: 2, updatedAt: "2026-06-27T00:00:00.000Z" }),
          latestVersion: secondVersion,
          scene: sceneFactory()
        }}
        versions={[secondVersion, firstVersion]}
      />
    );

    expect(await screen.findByLabelText("提示词正文")).toHaveTextContent("第二版正文");
    expect(screen.getByLabelText("亮点")).toHaveValue("第二版亮点");
    expect(screen.getByLabelText("移除标签 new")).toBeInTheDocument();
    expect(screen.getByText("v2")).toHaveClass("version-pill");
  });

  it("sorts version cards by newest date and keeps compare action icon-only with Chinese tooltip", async () => {
    const user = userEvent.setup();
    const onCompareToLatest = vi.fn();
    const latest = versionFactory({
      id: "version-3",
      versionNumber: 3,
      customVersionLabel: "V5",
      note: "更新内容",
      description: "最新版本亮点内容",
      tags: ["文本", "Deepseek V3"],
      createdAt: "2026-01-23T00:00:00.000Z"
    });
    const old = versionFactory({
      id: "version-1",
      versionNumber: 1,
      note: "初始版本",
      description: "初始亮点",
      tags: ["old"],
      createdAt: "2026-01-21T00:00:00.000Z"
    });
    const middle = versionFactory({
      id: "version-2",
      versionNumber: 2,
      note: "基于 v1.0.0 修改",
      description: "中间版本亮点",
      tags: ["middle"],
      createdAt: "2026-01-22T00:00:00.000Z"
    });

    render(
      <PromptDetailPage
        item={{
          prompt: promptFactory({ latestVersionId: "version-3", latestVersionNumber: 3 }),
          latestVersion: latest,
          scene: sceneFactory()
        }}
        versions={[old, latest, middle]}
        onBack={vi.fn()}
        onCopyLatest={vi.fn()}
        onDelete={vi.fn()}
        onSaveVersion={vi.fn()}
        onSaveMetadata={vi.fn()}
        onToggleFavorite={vi.fn()}
        onCopyEditor={vi.fn()}
        onDownloadEditor={vi.fn()}
        onCompareToLatest={onCompareToLatest}
      />
    );

    const rows = screen.getAllByTestId("version-card");
    expect(rows.map((row) => row.querySelector("strong")?.textContent)).toEqual(["V5 当前", "v2", "v1"]);
    expect(rows[0]).toHaveTextContent("2026/1/23");
    expect(rows[0]).toHaveTextContent("最新版本亮点内容");
    expect(rows[0]).toHaveTextContent("文本");
    expect(rows[1]).toHaveTextContent("2026/1/22");
    expect(rows[1]).toHaveTextContent("中间版本亮点");
    expect(screen.queryByText("Compare to Latest")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("复制版本")).not.toBeInTheDocument();

    await user.click(screen.getAllByLabelText("与最新版本对比")[0]);

    expect(onCompareToLatest).toHaveBeenCalledWith("version-2");
  });
});
