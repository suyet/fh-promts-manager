import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { seedIfEmpty } from "../../src/shared/data/seed";
import { resetDatabase } from "../../src/shared/data/db";
import { repositories } from "../../src/shared/data/repositories";
import { normalizePromptVersion } from "../../src/shared/tagUtils";
import { imageAssetFactory, promptFactory, sceneFactory, versionFactory } from "../../src/test/factories";

describe("repositories", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stores and reads scenes, prompts, and versions", async () => {
    const scene = sceneFactory();
    const prompt = promptFactory();
    const version = versionFactory();

    await repositories.scenes.put(scene);
    await repositories.prompts.put(prompt);
    await repositories.versions.put(version);

    await expect(repositories.scenes.get(scene.id)).resolves.toEqual(scene);
    await expect(repositories.prompts.get(prompt.id)).resolves.toEqual(prompt);
    await expect(repositories.versions.listByPrompt(prompt.id)).resolves.toEqual([normalizePromptVersion(version)]);
  });

  it("deletes prompt versions when a prompt is deleted", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory());

    await repositories.prompts.deleteWithVersions("prompt-refactor");

    await expect(repositories.prompts.get("prompt-refactor")).resolves.toBeUndefined();
    await expect(repositories.versions.listByPrompt("prompt-refactor")).resolves.toEqual([]);
  });

  it("stores scene prompt type and image assets", async () => {
    const scene = sceneFactory({ promptType: "image" });
    const asset = imageAssetFactory({ id: "asset-1", mimeType: "image/png" });

    await repositories.scenes.put(scene);
    await repositories.imageAssets.put(asset);

    await expect(repositories.scenes.get(scene.id)).resolves.toMatchObject({ promptType: "image" });
    await expect(repositories.imageAssets.get("asset-1")).resolves.toMatchObject({
      id: "asset-1",
      mimeType: "image/png",
      size: asset.size,
      sha256: asset.sha256
    });
  });

  it("seeds two default examples with a bundled image asset when the database is empty", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), {
      headers: { "Content-Type": "image/png" }
    }));
    await seedIfEmpty();

    const scenes = await repositories.scenes.list();
    const prompts = await repositories.prompts.list();
    const textScene = scenes.find((scene) => scene.name === "文本场景1");
    const imageScene = scenes.find((scene) => scene.name === "生图场景1");
    const textPrompt = prompts.find((prompt) => prompt.title === "移动端原型提示词");
    const imagePrompt = prompts.find((prompt) => prompt.title === "商业报告执行摘要页");
    const textVersion = textPrompt ? await repositories.versions.get(textPrompt.latestVersionId) : undefined;
    const imageVersion = imagePrompt ? await repositories.versions.get(imagePrompt.latestVersionId) : undefined;
    const imageAsset = imageVersion?.imageAssetId
      ? await repositories.imageAssets.get(imageVersion.imageAssetId)
      : undefined;

    expect(scenes).toHaveLength(2);
    expect(prompts).toHaveLength(2);
    expect(textScene).toMatchObject({
      name: "文本场景1",
      promptType: "text",
      icon: "pen",
      color: "blue"
    });
    expect(imageScene).toMatchObject({
      name: "生图场景1",
      promptType: "image",
      icon: "image",
      color: "orange"
    });
    expect(textVersion?.content).toContain("{{description}}");
    expect(imageVersion).toMatchObject({
      description: "消费硬件与软服并重的典型单页：四格 KPI、营收趋势小图、一句核心判断，商业蓝主色，适合投研社群传播或内部战报头图。"
    });
    expect(imageVersion?.imageAssetId).toBeTruthy();
    expect(imageAsset).toMatchObject({
      mimeType: "image/png"
    });
  });

  it("does not duplicate seeded examples after the first initialization", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), {
      headers: { "Content-Type": "image/png" }
    }));
    await seedIfEmpty();
    await seedIfEmpty();

    await expect(repositories.scenes.list()).resolves.toHaveLength(2);
    await expect(repositories.prompts.list()).resolves.toHaveLength(2);
  });
});
