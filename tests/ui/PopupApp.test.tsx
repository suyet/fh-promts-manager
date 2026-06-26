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
        onCopy={onCopy}
        onOpenManager={vi.fn()}
      />
    );

    expect(screen.getByText("最近使用")).toBeInTheDocument();
    expect(screen.getByText("匹配结果")).toBeInTheDocument();
    await user.click(screen.getAllByLabelText("复制最新版本")[0]);
    expect(onCopy).toHaveBeenCalledTimes(1);
  });
});
