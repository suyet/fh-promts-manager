import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ManagerApp } from "../../src/manager/ManagerApp";
import { resetDatabase } from "../../src/shared/data/db";
import { repositories } from "../../src/shared/data/repositories";
import { sceneFactory } from "../../src/test/factories";

describe("ManagerApp", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates a prompt from the New action", async () => {
    const user = userEvent.setup();
    await repositories.scenes.put(sceneFactory());

    render(<ManagerApp />);

    await screen.findByRole("heading", { name: "代码重构" });
    await user.click(screen.getByRole("button", { name: "新建" }));

    await user.type(await screen.findByLabelText("Prompt 标题"), "新建测试 Prompt");
    await user.type(screen.getByLabelText("提示词正文"), "这是新建 Prompt 的正文。");
    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(async () => {
      const prompts = await repositories.prompts.list();
      expect(prompts).toHaveLength(1);
      expect(prompts[0].title).toBe("新建测试 Prompt");
    });

    const versions = await repositories.versions.listByPrompt((await repositories.prompts.list())[0].id);
    expect(versions).toHaveLength(1);
    expect(versions[0].content).toBe("这是新建 Prompt 的正文。");
  });
});
