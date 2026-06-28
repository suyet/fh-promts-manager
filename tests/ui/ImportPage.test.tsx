import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ImportPage } from "../../src/manager/pages/ImportPage";
import type { ExportPayload, ImportPreview } from "../../src/shared/types";

const preview: ImportPreview = {
  scenes: 1,
  prompts: 3,
  versions: 5,
  usageRecords: 0,
  imageAssets: 0,
  warnings: []
};

describe("ImportPage", () => {
  it("selects a json backup, shows preview counts, and confirms import", async () => {
    const user = userEvent.setup();
    const onPreviewFile = vi.fn(async () => preview);
    const onConfirm = vi.fn();
    const payload: ExportPayload = {
      schemaVersion: 2,
      exportedAt: "2026-06-26T08:00:00.000Z",
      scenes: [],
      prompts: [],
      versions: [],
      usageRecords: []
    };

    render(
      <ImportPage
        preview={null}
        error={null}
        onPreviewFile={onPreviewFile}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    await user.upload(
      screen.getByLabelText("选择备份文件"),
      new File([JSON.stringify(payload)], "backup.json", { type: "application/json" })
    );

    await waitFor(() => expect(onPreviewFile).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("5")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "执行导入" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows import errors without confirming", () => {
    render(
      <ImportPage
        preview={null}
        error="文件格式错误"
        onPreviewFile={vi.fn()}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText("文件格式错误")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "执行导入" })).toBeDisabled();
  });
});
