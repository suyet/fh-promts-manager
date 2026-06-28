import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "../../src/shared/data/db";
import { repositories } from "../../src/shared/data/repositories";
import { normalizePromptVersion } from "../../src/shared/tagUtils";
import { imageAssetFactory, promptFactory, sceneFactory, versionFactory } from "../../src/test/factories";

describe("repositories", () => {
  beforeEach(async () => {
    await resetDatabase();
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
});
