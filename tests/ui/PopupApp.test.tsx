import { act, fireEvent, render, screen } from "@testing-library/react";
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
        selectedSceneId={null}
        onSearch={vi.fn()}
        onSelectScene={vi.fn()}
        onCopy={onCopy}
        onOpenManager={vi.fn()}
      />
    );

    expect(screen.getByAltText("FH Prompt Manager logo")).toBeInTheDocument();
    expect(screen.getByText("FH Prompt Manager")).toHaveClass("popup-brand-name");
    expect(screen.getByRole("button", { name: "前往管理" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "前往管理" }).querySelector("svg")).toBeTruthy();
    expect(screen.getByRole("button", { name: "全部" })).toHaveClass("active");
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
        selectedSceneId="scene-code"
        onSearch={vi.fn()}
        onSelectScene={onSelectScene}
        onCopy={vi.fn()}
        onOpenManager={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "代码重构" })).toHaveClass("active");
    await user.click(screen.getByRole("button", { name: "代码重构" }));
    expect(onSelectScene).toHaveBeenCalledWith("scene-code");
  });

  it("shows compact empty states for empty popup sections", () => {
    render(
      <PopupApp
        scenes={[sceneFactory()]}
        recent={[]}
        matches={[]}
        selectedSceneId="scene-code"
        onSearch={vi.fn()}
        onSelectScene={vi.fn()}
        onCopy={vi.fn()}
        onOpenManager={vi.fn()}
      />
    );

    expect(screen.getByText("暂无最近使用")).toHaveClass("popup-empty");
    expect(screen.getByText("暂无匹配结果")).toHaveClass("popup-empty");
  });

  it("shows failure feedback when copy fails", async () => {
    render(
      <PopupApp
        scenes={[sceneFactory()]}
        recent={[{ prompt: promptFactory(), latestVersion: versionFactory(), scene: sceneFactory() }]}
        matches={[]}
        selectedSceneId={null}
        onSearch={vi.fn()}
        onSelectScene={vi.fn()}
        onCopy={vi.fn().mockRejectedValue(new Error("copy failed"))}
        onOpenManager={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText("复制最新版本"));

    expect(await screen.findByRole("status")).toHaveTextContent("复制失败，请重试");
  });

  it("shows toast feedback and hides it after one second", async () => {
    vi.useFakeTimers();
    try {
      render(
        <PopupApp
          scenes={[sceneFactory()]}
          recent={[{ prompt: promptFactory(), latestVersion: versionFactory(), scene: sceneFactory() }]}
          matches={[]}
          selectedSceneId={null}
          onSearch={vi.fn()}
          onSelectScene={vi.fn()}
          onCopy={vi.fn().mockResolvedValue(undefined)}
          onOpenManager={vi.fn()}
        />
      );

      await act(async () => {
        fireEvent.click(screen.getByLabelText("复制最新版本"));
        await Promise.resolve();
      });
      expect(screen.getByRole("status")).toHaveTextContent("复制成功");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
