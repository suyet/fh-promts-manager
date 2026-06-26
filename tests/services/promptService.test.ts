import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDatabase } from "../../src/shared/data/db";
import { repositories } from "../../src/shared/data/repositories";
import { promptService } from "../../src/shared/services/promptService";
import { promptFactory, sceneFactory, versionFactory } from "../../src/test/factories";

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
  });

  it("saving content creates a new immutable version", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory());

    const updated = await promptService.saveNewVersion("prompt-refactor", {
      content: "content v2",
      note: "增强约束"
    });

    const versions = await repositories.versions.listByPrompt("prompt-refactor");
    expect(updated.latestVersionNumber).toBe(2);
    expect(versions.map((version) => version.content)).toEqual(["请重构下面的代码。", "content v2"]);
  });

  it("searches title, tags, and latest content", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory({ tags: ["review"] }));
    await repositories.versions.put(versionFactory({ content: "包含边界行为说明" }));

    await expect(promptService.searchPrompts({ text: "review" })).resolves.toHaveLength(1);
    await expect(promptService.searchPrompts({ text: "边界行为" })).resolves.toHaveLength(1);
    await expect(promptService.searchPrompts({ text: "不存在" })).resolves.toHaveLength(0);
  });

  it("updates prompt metadata without storing prompt content", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory());

    const updated = await promptService.updatePrompt("prompt-refactor", {
      title: "Updated title",
      description: "Updated desc",
      tags: ["updated"],
      favorite: false
    });

    expect(updated.title).toBe("Updated title");
    expect(updated.tags).toEqual(["updated"]);
    expect("content" in updated).toBe(false);
    await expect(repositories.versions.listByPrompt("prompt-refactor")).resolves.toHaveLength(1);
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
});
