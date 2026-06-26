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
    expect(screen.getByPlaceholderText("搜索标题、标签、正文")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("搜索标题、标签、正文"), "review");
    await user.click(screen.getByRole("button", { name: "搜索" }));

    expect(onSearch).toHaveBeenLastCalledWith("review");
  });
});
