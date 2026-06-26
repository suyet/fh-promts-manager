import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "../../src/shared/data/db";
import { repositories } from "../../src/shared/data/repositories";
import { importExportService } from "../../src/shared/services/importExportService";
import { promptFactory, sceneFactory, versionFactory } from "../../src/test/factories";
import type { ExportPayload } from "../../src/shared/types";

describe("importExportService", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("exports all tables as schema version 1", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory());

    const payload = await importExportService.exportAll();

    expect(payload.schemaVersion).toBe(1);
    expect(payload.scenes).toHaveLength(1);
    expect(payload.prompts).toHaveLength(1);
    expect(payload.versions).toHaveLength(1);
  });

  it("previews scene merge and prompt version merge", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory());

    const payload: ExportPayload = {
      schemaVersion: 1,
      exportedAt: "2026-06-26T08:00:00.000Z",
      scenes: [sceneFactory({ icon: "pen", color: "teal" })],
      prompts: [promptFactory()],
      versions: [versionFactory({ id: "imported-version", content: "导入内容" })],
      usageRecords: []
    };

    const preview = await importExportService.previewImport(payload);

    expect(preview.scenesToMerge).toBe(1);
    expect(preview.promptsToMerge).toBe(1);
    expect(preview.versionsToAdd).toBe(1);
  });

  it("imports without overwriting local scene icon and color", async () => {
    await repositories.scenes.put(sceneFactory({ icon: "code", color: "blue" }));

    await importExportService.importAll({
      schemaVersion: 1,
      exportedAt: "2026-06-26T08:00:00.000Z",
      scenes: [sceneFactory({ icon: "pen", color: "teal" })],
      prompts: [],
      versions: [],
      usageRecords: []
    });

    const scene = await repositories.scenes.get("scene-code");
    expect(scene?.icon).toBe("code");
    expect(scene?.color).toBe("blue");
  });
});
