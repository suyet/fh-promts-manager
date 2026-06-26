import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PopupApp } from "../../src/popup/PopupApp";
import { promptFactory, sceneFactory, versionFactory } from "../../src/test/factories";

describe("PopupApp", () => {
  it("shows scene filters, recent prompts, matching prompts, and copy actions", async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    render(
      <PopupApp
        scenes={[sceneFactory()]}
        recent={[{ prompt: promptFactory(), latestVersion: versionFactory(), scene: sceneFactory() }]}
        matches={[{ prompt: promptFactory({ id: "prompt-2", title: "Review Checklist" }), latestVersion: versionFactory({ id: "version-2", promptId: "prompt-2" }), scene: sceneFactory() }]}
        onSearch={vi.fn()}
        onSelectScene={vi.fn()}
        onCopy={onCopy}
        onOpenManager={vi.fn()}
      />
    );

    expect(screen.getByText("最近使用")).toBeInTheDocument();
    expect(screen.getByText("匹配结果")).toBeInTheDocument();
    await user.click(screen.getAllByLabelText("复制最新版本")[0]);
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it("filters by scene from the popup", async () => {
    const user = userEvent.setup();
    const onSelectScene = vi.fn();
    render(
      <PopupApp
        scenes={[sceneFactory()]}
        recent={[]}
        matches={[]}
        onSearch={vi.fn()}
        onSelectScene={onSelectScene}
        onCopy={vi.fn()}
        onOpenManager={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "代码重构" }));
    expect(onSelectScene).toHaveBeenCalledWith("scene-code");
  });
});
