import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ManagerApp } from "../../src/manager/ManagerApp";
import { resetDatabase } from "../../src/shared/data/db";
import { repositories } from "../../src/shared/data/repositories";
import { promptFactory, sceneFactory, versionFactory } from "../../src/test/factories";
import type { ExportPayload } from "../../src/shared/types";

describe("ManagerApp", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a prompt from the New action", async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.8);
    await repositories.scenes.put(sceneFactory());

    render(<ManagerApp />);

    await screen.findByRole("heading", { name: "代码重构" });
    await user.click(screen.getByRole("button", { name: "新建" }));

    expect(await screen.findByText("提示词编辑器")).toBeInTheDocument();
    expect(screen.getByText("亮点").closest(".side-section-heading")).toBeTruthy();
    expect(screen.getByText("标签").closest(".side-section-heading")).toBeTruthy();
    expect(screen.getByLabelText("提示词正文").closest(".detail-grid")).toBeTruthy();
    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();

    await user.type(await screen.findByLabelText("Prompt 标题"), "新建测试 Prompt");
    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
    await user.type(screen.getByLabelText("亮点"), "新建描述");
    await user.type(screen.getByLabelText("添加标签"), "alpha{Enter}");
    await user.type(screen.getByLabelText("添加标签"), "beta{Enter}");
    await user.click(screen.getByRole("button", { name: "JSON 块" }));
    expect(screen.getByRole("button", { name: "保存" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(async () => {
      const prompts = await repositories.prompts.list();
      expect(prompts).toHaveLength(1);
      expect(prompts[0].title).toBe("新建测试 Prompt");
    });

    const versions = await repositories.versions.listByPrompt((await repositories.prompts.list())[0].id);
    const savedTags = versions[0].tags as Array<{ label: string; color: string }>;
    expect(versions).toHaveLength(1);
    expect(versions[0].content).toBe('```json\n{\n  "key": "value"\n}\n```');
    expect(versions[0].description).toBe("新建描述");
    expect(versions[0].tags).toEqual([
      expect.objectContaining({ label: "alpha", color: expect.any(String) }),
      expect.objectContaining({ label: "beta", color: expect.any(String) })
    ]);
    expect(savedTags[0]).not.toMatchObject({ color: savedTags[1].color });
  });

  it("toggles favorite and copies the latest version from prompt cards", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText }
    });
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory({ favorite: false }));
    await repositories.versions.put(versionFactory({ content: "最新版本正文" }));

    render(<ManagerApp />);

    await user.click(await screen.findByLabelText("收藏"));
    await waitFor(async () => {
      expect((await repositories.prompts.get("prompt-refactor"))?.favorite).toBe(true);
    });

    await user.click(screen.getByLabelText("复制最新版本"));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("最新版本正文"));
    expect(await screen.findByText("复制成功")).toBeInTheDocument();
  });

  it("keeps scene prompt counts based on all prompts while filtering the active scene", async () => {
    await repositories.scenes.bulkPut([
      sceneFactory(),
      sceneFactory({ id: "scene-writing", name: "写作", description: "写作助手", icon: "pen", color: "green", sortOrder: 2 })
    ]);
    await repositories.prompts.bulkPut([
      promptFactory({ id: "prompt-code", sceneId: "scene-code", latestVersionId: "version-code" }),
      promptFactory({ id: "prompt-writing", sceneId: "scene-writing", title: "写作 Prompt", latestVersionId: "version-writing" })
    ]);
    await repositories.versions.bulkPut([
      versionFactory({ id: "version-code", promptId: "prompt-code" }),
      versionFactory({ id: "version-writing", promptId: "prompt-writing" })
    ]);

    render(<ManagerApp />);

    expect(await screen.findByTestId("scene-card-scene-code")).toHaveTextContent("1 个提示词");
    expect(screen.getByTestId("scene-card-scene-writing")).toHaveTextContent("1 个提示词");
    await waitFor(() => expect(screen.queryByText("写作 Prompt")).not.toBeInTheDocument());
  });

  it("saves user-defined prompt card order", async () => {
    const user = userEvent.setup();
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.bulkPut([
      promptFactory({
        id: "prompt-a",
        title: "A Prompt",
        latestVersionId: "version-a",
        sortOrder: 1
      }),
      promptFactory({
        id: "prompt-b",
        title: "B Prompt",
        latestVersionId: "version-b",
        sortOrder: 2
      })
    ]);
    await repositories.versions.bulkPut([
      versionFactory({ id: "version-a", promptId: "prompt-a" }),
      versionFactory({ id: "version-b", promptId: "prompt-b" })
    ]);

    render(<ManagerApp />);

    await screen.findByText("A Prompt");
    await user.click(screen.getByRole("button", { name: "排序" }));
    fireEvent.dragStart(screen.getByTestId("prompt-card-prompt-b"));
    fireEvent.drop(screen.getByTestId("prompt-card-prompt-a"));
    await user.click(screen.getByRole("button", { name: "保存排序" }));

    await waitFor(async () => {
      await expect(repositories.prompts.get("prompt-b")).resolves.toMatchObject({ sortOrder: 1 });
      await expect(repositories.prompts.get("prompt-a")).resolves.toMatchObject({ sortOrder: 2 });
    });
  });

  it("creates scenes with an internal icon and preset color", async () => {
    const user = userEvent.setup();
    const prompt = vi.spyOn(window, "prompt");

    render(<ManagerApp />);

    await user.click(await screen.findByLabelText("新建场景"));
    expect(screen.getByRole("dialog", { name: "新建场景" })).toBeInTheDocument();
    expect(prompt).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "保存场景" })).toBeDisabled();

    await user.type(screen.getByLabelText("场景名称"), "写作");
    await user.type(screen.getByLabelText("场景摘要"), "写作助手");
    await user.click(screen.getByLabelText("打开图标库"));
    await user.click(screen.getByLabelText("选择图标：写作"));
    await user.click(screen.getByLabelText("打开颜色库"));
    await user.click(screen.getByLabelText("选择颜色：粉色"));
    await user.click(screen.getByRole("button", { name: "保存场景" }));

    await waitFor(async () => {
      const scenes = await repositories.scenes.list();
      expect(scenes).toHaveLength(1);
      expect(scenes[0]).toMatchObject({
        name: "写作",
        description: "写作助手",
        icon: "pen",
        color: "pink"
      });
    });
  });

  it("exports a json backup from the top bar", async () => {
    const user = userEvent.setup();
    await repositories.scenes.put(sceneFactory());
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:backup");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    render(<ManagerApp />);

    await user.click(await screen.findByRole("button", { name: "导出" }));

    await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:backup");
    expect(await screen.findByRole("status")).toHaveTextContent("导出完成");
  });

  it("previews and imports a json backup", async () => {
    const user = userEvent.setup();
    const payload: ExportPayload = {
      schemaVersion: 1,
      exportedAt: "2026-06-26T08:00:00.000Z",
      scenes: [sceneFactory({ id: "scene-writing", name: "写作", icon: "pen", color: "pink" })],
      prompts: [],
      versions: [],
      usageRecords: []
    };

    render(<ManagerApp />);

    await user.click(screen.getByRole("button", { name: "导入" }));
    await user.upload(
      await screen.findByLabelText("选择备份文件"),
      new File([JSON.stringify(payload)], "backup.json", { type: "application/json" })
    );
    expect(await screen.findByText("1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "执行导入" }));

    await waitFor(async () => {
      const scenes = await repositories.scenes.list();
      expect(scenes).toHaveLength(1);
      expect(scenes[0].name).toBe("写作");
    });
    expect(await screen.findByRole("status")).toHaveTextContent("导入完成");
  });

  it("updates, unfavorites, and deletes a prompt from detail", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory());

    render(<ManagerApp />);

    await user.click(await screen.findByText("Code Refactor Helper"));
    await user.click(await screen.findByLabelText("取消收藏"));

    await waitFor(async () => {
      expect((await repositories.prompts.get("prompt-refactor"))?.favorite).toBe(false);
    });

    await user.click(screen.getByRole("button", { name: "编辑标题 Code Refactor Helper" }));
    await user.clear(screen.getByLabelText("编辑提示词标题"));
    await user.type(screen.getByLabelText("编辑提示词标题"), "Updated Prompt");
    await user.tab();

    await waitFor(async () => {
      expect((await repositories.prompts.get("prompt-refactor"))?.title).toBe("Updated Prompt");
    });

    await user.click(screen.getByRole("button", { name: "删除" }));

    await waitFor(async () => {
      expect(await repositories.prompts.get("prompt-refactor")).toBeUndefined();
      expect(await repositories.versions.listByPrompt("prompt-refactor")).toEqual([]);
    });
  });

  it("auto-saves latest version highlight and tags after leaving and reopening detail", async () => {
    const user = userEvent.setup();
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory({ description: "旧亮点", tags: ["old"] }));

    render(<ManagerApp />);

    await user.click(await screen.findByText("Code Refactor Helper"));
    await user.clear(screen.getByLabelText("亮点"));
    await user.type(screen.getByLabelText("亮点"), "新的自动保存亮点");
    await user.tab();
    await user.type(screen.getByLabelText("添加标签"), "beta{Enter}");
    await user.click(screen.getByLabelText("返回"));
    await user.click(await screen.findByText("Code Refactor Helper"));

    await waitFor(() => {
      expect(screen.getByLabelText("亮点")).toHaveValue("新的自动保存亮点");
    });
    expect(screen.getAllByText("beta")).toHaveLength(2);

    const latestVersion = await repositories.versions.get("version-1");
    expect(latestVersion).toMatchObject({
      description: "新的自动保存亮点",
      tags: [
        expect.objectContaining({ label: "old", color: expect.any(String) }),
        expect.objectContaining({ label: "beta", color: expect.any(String) })
      ]
    });
  });

  it("disables prompt sorting while a search filter is active", async () => {
    const user = userEvent.setup();
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory());

    render(<ManagerApp />);

    await screen.findByText("Code Refactor Helper");
    await user.type(screen.getByPlaceholderText("搜索标题、标签、正文"), "Code");
    await user.click(screen.getByRole("button", { name: "搜索" }));

    expect(screen.getByRole("button", { name: "排序" })).toBeDisabled();
  });
});
