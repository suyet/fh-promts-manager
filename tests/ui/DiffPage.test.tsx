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

    expect(await screen.findByAltText("v1 图片")).toHaveAttribute("src", "blob:history");
    expect(await screen.findByAltText("v2 Latest 图片")).toHaveAttribute("src", "blob:latest");
    expect(screen.getByText("old prompt")).toHaveClass("removed");
    expect(screen.getByText("new prompt")).toHaveClass("added");
  });
});
