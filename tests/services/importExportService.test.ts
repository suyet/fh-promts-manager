import { beforeEach, describe, expect, it } from "vitest";
import JSZip from "jszip";
import { resetDatabase } from "../../src/shared/data/db";
import { repositories } from "../../src/shared/data/repositories";
import { importExportService } from "../../src/shared/services/importExportService";
import { promptService } from "../../src/shared/services/promptService";
import { imageAssetFactory, promptFactory, sceneFactory, versionFactory } from "../../src/test/factories";
import type { ExportPayload, ZipBackupManifest } from "../../src/shared/types";

describe("importExportService", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("exports all tables as schema version 2", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory());

    const payload = await importExportService.exportAll();

    expect(payload.schemaVersion).toBe(2);
    expect(payload.scenes).toHaveLength(1);
    expect(payload.prompts).toHaveLength(1);
    expect(payload.versions).toHaveLength(1);
  });

  it("previews scene merge and prompt version merge", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory());

    const payload: ExportPayload = {
      schemaVersion: 2,
      exportedAt: "2026-06-26T08:00:00.000Z",
      scenes: [sceneFactory({ icon: "pen", color: "teal" })],
      prompts: [promptFactory()],
      versions: [versionFactory({ id: "imported-version", content: "导入内容" })],
      usageRecords: []
    };

    const preview = await importExportService.previewImport(payload);

    expect(preview.scenes).toBe(1);
    expect(preview.prompts).toBe(1);
    expect(preview.versions).toBe(1);
  });

  it("imports without overwriting local scene icon and color", async () => {
    await repositories.scenes.put(sceneFactory({ icon: "code", color: "blue" }));

    await importExportService.importAll({
      schemaVersion: 2,
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

  it("imports a new prompt with versions and keeps it searchable through the latest version pointer", async () => {
    await repositories.scenes.put(sceneFactory());

    await importExportService.importAll({
      schemaVersion: 2,
      exportedAt: "2026-06-26T08:00:00.000Z",
      scenes: [sceneFactory()],
      prompts: [promptFactory({
        id: "imported-prompt",
        title: "Imported Prompt",
        latestVersionId: "imported-version-2",
        latestVersionNumber: 2
      })],
      versions: [
        versionFactory({
          id: "imported-version-1",
          promptId: "imported-prompt",
          versionNumber: 1,
          content: "旧导入内容"
        }),
        versionFactory({
          id: "imported-version-2",
          promptId: "imported-prompt",
          versionNumber: 2,
          content: "最新导入内容"
        })
      ],
      usageRecords: []
    });

    const prompts = await repositories.prompts.list();
    const imported = prompts.find((prompt) => prompt.title === "Imported Prompt");
    expect(imported).toBeTruthy();
    expect(imported?.latestVersionNumber).toBe(2);

    await expect(promptService.searchPrompts({ text: "最新导入内容" })).resolves.toMatchObject([
      {
        prompt: { title: "Imported Prompt" },
        latestVersion: { content: "最新导入内容" }
      }
    ]);
  });

  it("merges imported versions into an existing prompt and promotes the imported latest version", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory({
      id: "local-prompt",
      latestVersionId: "local-version-1",
      latestVersionNumber: 1
    }));
    await repositories.versions.put(versionFactory({
      id: "local-version-1",
      promptId: "local-prompt",
      versionNumber: 1,
      content: "本地版本"
    }));

    await importExportService.importAll({
      schemaVersion: 2,
      exportedAt: "2026-06-26T08:00:00.000Z",
      scenes: [sceneFactory()],
      prompts: [promptFactory({
        id: "imported-prompt",
        latestVersionId: "imported-version-2",
        latestVersionNumber: 2
      })],
      versions: [versionFactory({
        id: "imported-version-2",
        promptId: "imported-prompt",
        versionNumber: 2,
        content: "导入后的最新版本"
      })],
      usageRecords: []
    });

    const merged = await repositories.prompts.get("local-prompt");
    expect(merged?.latestVersionNumber).toBe(2);
    const latestVersion = merged ? await repositories.versions.get(merged.latestVersionId) : null;
    expect(latestVersion?.content).toBe("导入后的最新版本");
  });

  it("uses merged scene and prompt mappings when previewing versions to add", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory({
      id: "local-prompt",
      latestVersionId: "local-version-1"
    }));
    await repositories.versions.put(versionFactory({
      id: "local-version-1",
      promptId: "local-prompt",
      content: "重复版本内容"
    }));

    const preview = await importExportService.previewImport({
      schemaVersion: 2,
      exportedAt: "2026-06-26T08:00:00.000Z",
      scenes: [sceneFactory()],
      prompts: [promptFactory({
        id: "imported-prompt",
        latestVersionId: "imported-version-1"
      })],
      versions: [versionFactory({
        id: "imported-version-1",
        promptId: "imported-prompt",
        content: "重复版本内容"
      })],
      usageRecords: []
    });

    expect(preview.prompts).toBe(1);
    expect(preview.versions).toBe(0);
  });

  it("exports a zip backup with manifest, data and image files", async () => {
    const asset = imageAssetFactory({
      sha256: "2c8648d103e3dd7ad87660da0f126a1443b6d21ac1bd3ec000c5e24e2373a90c"
    });
    await repositories.scenes.put(sceneFactory({ promptType: "image" }));
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory({ imageAssetId: asset.id }));
    await repositories.imageAssets.put(asset);

    const backup = await importExportService.exportZip();
    const zip = await JSZip.loadAsync(backup);
    const manifest = JSON.parse(await zip.file("manifest.json")!.async("string")) as ZipBackupManifest;
    const data = JSON.parse(await zip.file("data.json")!.async("string")) as ExportPayload;

    expect(manifest.counts.imageAssets).toBe(1);
    expect(manifest.assets[0]).toMatchObject({
      id: asset.id,
      path: `assets/${asset.id}.png`,
      mimeType: "image/png",
      size: asset.size,
      sha256: asset.sha256
    });
    await expect(zip.file(manifest.assets[0].path)!.async("string")).resolves.toBe("image-bytes");
    expect(data.versions[0].imageAssetId).toBe(asset.id);
  });

  it("rejects zip backups with missing image files", async () => {
    const asset = imageAssetFactory();
    const zip = new JSZip();
    zip.file("manifest.json", JSON.stringify({
      app: "fh-prompt-manager",
      schemaVersion: 2,
      exportedAt: "2026-06-26T08:00:00.000Z",
      counts: { scenes: 1, prompts: 1, versions: 1, usageRecords: 0, imageAssets: 1 },
      assets: [{
        id: asset.id,
        path: `assets/${asset.id}.png`,
        mimeType: asset.mimeType,
        size: asset.size,
        sha256: asset.sha256
      }]
    } satisfies ZipBackupManifest));
    zip.file("data.json", JSON.stringify({
      schemaVersion: 2,
      exportedAt: "2026-06-26T08:00:00.000Z",
      scenes: [sceneFactory({ promptType: "image" })],
      prompts: [promptFactory()],
      versions: [versionFactory({ imageAssetId: asset.id })],
      usageRecords: []
    } satisfies ExportPayload));

    await expect(importExportService.previewZipImport(await zip.generateAsync({ type: "blob" }))).rejects.toThrow("图片资源缺失");
  });

  it("imports image assets from a zip backup", async () => {
    const asset = imageAssetFactory({
      sha256: "2c8648d103e3dd7ad87660da0f126a1443b6d21ac1bd3ec000c5e24e2373a90c"
    });
    await repositories.scenes.put(sceneFactory({ promptType: "image" }));
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory({ imageAssetId: asset.id }));
    await repositories.imageAssets.put(asset);
    const backup = await importExportService.exportZip();

    await resetDatabase();
    const preview = await importExportService.importZip(backup);
    const importedAsset = await repositories.imageAssets.get(asset.id);
    const importedVersions = await repositories.versions.listByPrompt("prompt-refactor");

    expect(preview.imageAssets).toBe(1);
    expect(importedAsset?.data.byteLength).toBe(asset.size);
    expect(importedVersions[0].imageAssetId).toBe(asset.id);
  });
});
