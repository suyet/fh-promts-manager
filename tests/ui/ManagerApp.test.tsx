import { render, screen, waitFor } from "@testing-library/react";
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
    await repositories.scenes.put(sceneFactory());

    render(<ManagerApp />);

    await screen.findByRole("heading", { name: "代码重构" });
    await user.click(screen.getByRole("button", { name: "新建" }));

    await user.type(await screen.findByLabelText("Prompt 标题"), "新建测试 Prompt");
    await user.type(screen.getByLabelText("Prompt 描述"), "新建描述");
    await user.type(screen.getByLabelText("标签"), "alpha, beta");
    await user.type(screen.getByLabelText("提示词正文"), "这是新建 Prompt 的正文。");
    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(async () => {
      const prompts = await repositories.prompts.list();
      expect(prompts).toHaveLength(1);
      expect(prompts[0].title).toBe("新建测试 Prompt");
      expect(prompts[0].description).toBe("新建描述");
      expect(prompts[0].tags).toEqual(["alpha", "beta"]);
    });

    const versions = await repositories.versions.listByPrompt((await repositories.prompts.list())[0].id);
    expect(versions).toHaveLength(1);
    expect(versions[0].content).toBe("这是新建 Prompt 的正文。");
  });

  it("creates scenes with an internal icon and preset color", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "prompt")
      .mockReturnValueOnce("写作")
      .mockReturnValueOnce("写作助手")
      .mockReturnValueOnce("pen")
      .mockReturnValueOnce("pink");

    render(<ManagerApp />);

    await user.click(await screen.findByLabelText("新建场景"));

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

    await user.clear(screen.getByLabelText("Prompt 标题"));
    await user.type(screen.getByLabelText("Prompt 标题"), "Updated Prompt");
    await user.click(screen.getByRole("button", { name: "保存信息" }));

    await waitFor(async () => {
      expect((await repositories.prompts.get("prompt-refactor"))?.title).toBe("Updated Prompt");
    });

    await user.click(screen.getByRole("button", { name: "删除" }));

    await waitFor(async () => {
      expect(await repositories.prompts.get("prompt-refactor")).toBeUndefined();
      expect(await repositories.versions.listByPrompt("prompt-refactor")).toEqual([]);
    });
  });
});
