import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiffPage } from "../../src/manager/pages/DiffPage";
import { resetDatabase } from "../../src/shared/data/db";
import { repositories } from "../../src/shared/data/repositories";
import type { VersionDiff } from "../../src/shared/services/diffService";
import { imageAssetFactory } from "../../src/test/factories";

describe("DiffPage", () => {
  beforeEach(async () => {
    await resetDatabase();
    vi.restoreAllMocks();
  });

  it("previews history and latest images above text diff panes", async () => {
    vi.spyOn(URL, "createObjectURL")
      .mockReturnValueOnce("blob:history")
      .mockReturnValueOnce("blob:latest");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    await repositories.imageAssets.bulkPut([
      imageAssetFactory({ id: "asset-history" }),
      imageAssetFactory({ id: "asset-latest" })
    ]);
    const diff: VersionDiff = {
      historyLabel: "v1",
      latestLabel: "v2 Latest",
      historyImageAssetId: "asset-history",
      latestImageAssetId: "asset-latest",
      parts: [
        { type: "removed", text: "old prompt" },
        { type: "added", text: "new prompt" }
      ]
    };

    render(
      <DiffPage
        diff={diff}
        onBack={vi.fn()}
        onCopyHistory={vi.fn()}
        onCopyLatest={vi.fn()}
      />
    );

    const historyImage = await screen.findByAltText("v1 图片");
    const latestImage = await screen.findByAltText("v2 Latest 图片");
    expect(historyImage).toHaveAttribute("src", "blob:history");
    expect(latestImage).toHaveAttribute("src", "blob:latest");
    expect(historyImage.closest(".diff-preview-media")).toBeTruthy();
    expect(latestImage.closest(".diff-preview-media")).toBeTruthy();
    expect(screen.getByText("old prompt")).toHaveClass("removed");
    expect(screen.getByText("new prompt")).toHaveClass("added");
  });

  it("keeps copy actions inside each diff pane header", () => {
    const diff: VersionDiff = {
      historyLabel: "v1",
      latestLabel: "v2 Latest",
      parts: [
        { type: "same", text: "same prompt" }
      ]
    };

    render(
      <DiffPage
        diff={diff}
        onBack={vi.fn()}
        onCopyHistory={vi.fn()}
        onCopyLatest={vi.fn()}
      />
    );

    expect(screen.getByLabelText("复制 v1").closest(".diff-pane-heading")).toBeTruthy();
    expect(screen.getByLabelText("复制 v2 Latest").closest(".diff-pane-heading")).toBeTruthy();
    expect(screen.getByText("Comparing v1 to v2 Latest").closest(".sub-header")?.querySelector(".sub-right")).toBeNull();
    expect(screen.queryByRole("button", { name: "复制 Latest" })).not.toBeInTheDocument();
  });
});
