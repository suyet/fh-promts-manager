import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDatabase } from "../../src/shared/data/db";
import { repositories } from "../../src/shared/data/repositories";
import { promptService } from "../../src/shared/services/promptService";
import { imageAssetFactory, promptFactory, sceneFactory, versionFactory } from "../../src/test/factories";

describe("promptService", () => {
  beforeEach(async () => {
    await resetDatabase();
    vi.setSystemTime(new Date("2026-06-26T08:00:00.000Z"));
  });

  it("creates first version when creating a prompt", async () => {
    await repositories.scenes.put(sceneFactory());

    const created = await promptService.createPrompt({
      sceneId: "scene-code",
      title: "New Prompt",
      description: "desc",
      tags: ["tag-a"],
      favorite: false,
      content: "content v1",
      note: "初始版本"
    });

    const versions = await repositories.versions.listByPrompt(created.id);
    expect(created.latestVersionNumber).toBe(1);
    expect(versions).toHaveLength(1);
    expect(versions[0].content).toBe("content v1");
    expect(versions[0].description).toBe("desc");
    expect(versions[0].tags).toEqual([
      expect.objectContaining({ label: "tag-a", color: expect.any(String) })
    ]);
  });

  it("requires and stores an image asset for image scene prompts", async () => {
    await repositories.scenes.put(sceneFactory({ promptType: "image" }));
    await repositories.imageAssets.put(imageAssetFactory());

    await expect(promptService.createPrompt({
      sceneId: "scene-code",
      title: "Image Prompt",
      description: "desc",
      tags: ["tag-a"],
      favorite: false,
      content: "content v1",
      note: "初始版本"
    })).rejects.toThrow("生图场景必须提供图片。");

    const created = await promptService.createPrompt({
      sceneId: "scene-code",
      title: "Image Prompt",
      description: "desc",
      tags: ["tag-a"],
      favorite: false,
      content: "content v1",
      imageAssetId: "asset-cover",
      note: "初始版本"
    });

    const versions = await repositories.versions.listByPrompt(created.id);
    expect(versions[0].imageAssetId).toBe("asset-cover");
  });

  it("reuses the latest image asset when saving a new image prompt version without replacing the image", async () => {
    await repositories.scenes.put(sceneFactory({ promptType: "image" }));
    await repositories.imageAssets.put(imageAssetFactory());
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory({ imageAssetId: "asset-cover" }));

    await promptService.saveNewVersion("prompt-refactor", {
      content: "content v2",
      note: "增强约束",
      description: "v2 亮点",
      tags: ["v2"]
    });

    const versions = await repositories.versions.listByPrompt("prompt-refactor");
    expect(versions[1].imageAssetId).toBe("asset-cover");
  });

  it("saving content creates a new immutable version", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory());

    const updated = await promptService.saveNewVersion("prompt-refactor", {
      content: "content v2",
      note: "增强约束",
      description: "v2 亮点",
      tags: ["v2"],
      customVersionLabel: "V5大概答复"
    });

    const versions = await repositories.versions.listByPrompt("prompt-refactor");
    expect(updated.latestVersionNumber).toBe(2);
    expect(versions.map((version) => version.content)).toEqual(["请重构下面的代码。", "content v2"]);
    expect(versions[1]).toMatchObject({
      versionNumber: 2,
      customVersionLabel: "V5大概答复",
      description: "v2 亮点",
      tags: [expect.objectContaining({ label: "v2", color: expect.any(String) })]
    });
  });

  it("searches title, latest version tags, latest highlight, and latest content", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory({
      content: "包含边界行为说明",
      description: "最新亮点",
      tags: ["review"]
    }));

    await expect(promptService.searchPrompts({ text: "review" })).resolves.toHaveLength(1);
    await expect(promptService.searchPrompts({ text: "最新亮点" })).resolves.toHaveLength(1);
    await expect(promptService.searchPrompts({ text: "old-tag" })).resolves.toHaveLength(0);
    await expect(promptService.searchPrompts({ text: "边界行为" })).resolves.toHaveLength(1);
    await expect(promptService.searchPrompts({ text: "不存在" })).resolves.toHaveLength(0);
  });

  it("normalizes legacy string tags when returning search results", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory({
      tags: ["legacy-tag"]
    }));

    const [result] = await promptService.searchPrompts({ text: "legacy-tag" });
    expect(result.latestVersion.tags).toEqual([
      expect.objectContaining({ label: "legacy-tag", color: expect.any(String) })
    ]);
  });

  it("returns prompts by user-defined order", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory({
      id: "prompt-second",
      title: "Second Prompt",
      latestVersionId: "version-second",
      sortOrder: 2
    }));
    await repositories.prompts.put(promptFactory({
      id: "prompt-first",
      title: "First Prompt",
      latestVersionId: "version-first",
      sortOrder: 1
    }));
    await repositories.versions.bulkPut([
      versionFactory({ id: "version-second", promptId: "prompt-second" }),
      versionFactory({ id: "version-first", promptId: "prompt-first" })
    ]);

    await expect(promptService.searchPrompts({ text: "" })).resolves.toMatchObject([
      { prompt: { id: "prompt-first" } },
      { prompt: { id: "prompt-second" } }
    ]);
  });

  it("updates prompt title and favorite without touching versions", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory());

    const updated = await promptService.updatePrompt("prompt-refactor", {
      title: "Updated title",
      favorite: false
    });

    expect(updated.title).toBe("Updated title");
    expect("content" in updated).toBe(false);
    await expect(repositories.versions.listByPrompt("prompt-refactor")).resolves.toHaveLength(1);
  });

  it("updates the latest version highlight and tags for auto-save", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory());

    const updated = await promptService.updateLatestVersionMetadata("prompt-refactor", {
      description: "自动保存后的亮点",
      tags: ["autosave-tag"]
    });

    const latestVersion = await repositories.versions.get(updated.latestVersionId);
    expect(latestVersion).toMatchObject({
      description: "自动保存后的亮点",
      tags: [expect.objectContaining({ label: "autosave-tag", color: expect.any(String) })]
    });
    expect(updated.updatedAt).toBe("2026-06-26T08:00:00.000Z");
  });

  it("records usage and deletes prompt versions and usage together", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory());

    await promptService.recordUsage("prompt-refactor", "version-1", "manager");
    await expect(repositories.usageRecords.listRecent(10)).resolves.toHaveLength(1);

    await promptService.deletePrompt("prompt-refactor");

    await expect(repositories.prompts.get("prompt-refactor")).resolves.toBeUndefined();
    await expect(repositories.versions.listByPrompt("prompt-refactor")).resolves.toEqual([]);
    await expect(repositories.usageRecords.listRecent(10)).resolves.toEqual([]);
  });

  it("returns recent prompts ordered by last usage time instead of prompt sort order", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.bulkPut([
      promptFactory({
        id: "prompt-first",
        title: "First Prompt",
        latestVersionId: "version-first",
        sortOrder: 1
      }),
      promptFactory({
        id: "prompt-second",
        title: "Second Prompt",
        latestVersionId: "version-second",
        sortOrder: 2
      })
    ]);
    await repositories.versions.bulkPut([
      versionFactory({ id: "version-first", promptId: "prompt-first", content: "first content" }),
      versionFactory({ id: "version-second", promptId: "prompt-second", content: "second content" })
    ]);

    await promptService.recordUsage("prompt-first", "version-first", "manager");
    vi.setSystemTime(new Date("2026-06-26T08:01:00.000Z"));
    await promptService.recordUsage("prompt-second", "version-second", "manager");

    await expect(promptService.listRecentPrompts(5)).resolves.toMatchObject([
      { prompt: { id: "prompt-second" } },
      { prompt: { id: "prompt-first" } }
    ]);
  });
});
