import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TopBar } from "../../src/shared/components/TopBar";

describe("TopBar", () => {
  it("shows a compact search field with an explicit search action", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(
      <TopBar
        search=""
        onSearch={onSearch}
        onImport={vi.fn()}
        onExport={vi.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: "资产库" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Fast Use" })).not.toBeInTheDocument();
    expect(screen.getByAltText("FH Prompt Manager logo")).toHaveAttribute("src", "/icons/fh-pm-logo.png");
    expect(screen.getByText("FH Prompt Manager")).toHaveClass("brand-name");
    expect(screen.getByPlaceholderText("搜索标题、标签、正文")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "搜索" }).closest(".top-search")).toBeNull();
    expect(screen.getByRole("button", { name: "导入" })).toHaveClass("top-action-button");
    expect(screen.getByRole("button", { name: "导出" })).toHaveClass("top-action-button");
    expect(screen.getByRole("button", { name: "关于应用" })).toHaveClass("top-action-button");

    await user.type(screen.getByPlaceholderText("搜索标题、标签、正文"), "review");
    await user.click(screen.getByRole("button", { name: "搜索" }));

    expect(onSearch).toHaveBeenLastCalledWith("review");
  });

  it("opens about app content in an in-page dialog and removes the theme toggle", async () => {
    const user = userEvent.setup();

    render(
      <TopBar
        search=""
        onSearch={vi.fn()}
        onImport={vi.fn()}
        onExport={vi.fn()}
      />
    );

    expect(screen.queryByLabelText("切换明暗模式")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "关于应用" }));

    expect(screen.getByRole("dialog", { name: "关于应用" })).toBeInTheDocument();
    expect(screen.getByText("开源的，完全离线的本地提示词管理插件(支持chrome/edge)")).toBeInTheDocument();
    expect(screen.getByText("核心亮点：")).toBeInTheDocument();
    expect(screen.getByText("🧩 三重颗粒度的提示词资产管理")).toBeInTheDocument();
    expect(screen.getByText("🖼️ 支持问生图类型提示词、版本diff对比")).toBeInTheDocument();
    expect(screen.getByText("🔒 本地优先，完全离线")).toBeInTheDocument();
    expect(screen.getByText("📦 一键导入导出，团队共享")).toBeInTheDocument();
    expect(screen.getByText("提醒：")).toBeInTheDocument();
    expect(screen.getByText("删除全部数据")).toHaveClass("contact-warning-danger");
    expect(screen.getByText((_, element) => element?.textContent === "删除插件将删除全部数据，请提前导出备份")).toBeInTheDocument();
    expect(screen.getByText("请不要移动插件源文件的位置")).toBeInTheDocument();
    expect(screen.getByText("👤 作者：烽火技服-姜萌")).toBeInTheDocument();
    expect(screen.getByText("📧 邮箱：mjiang@fiberhome.com")).toBeInTheDocument();
  });
});
