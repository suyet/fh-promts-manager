import { EXPORT_SCHEMA_VERSION } from "../constants";
import { db } from "../data/db";
import { repositories } from "../data/repositories";
import type { ExportPayload, ImportPreview, Prompt, Scene } from "../types";

function samePromptKey(prompt: Prompt, sceneNameById: Map<string, string>) {
  return `${sceneNameById.get(prompt.sceneId) || ""}::${prompt.title}`;
}

export const importExportService = {
  async exportAll(): Promise<ExportPayload> {
    const [scenes, prompts, versions, usageRecords] = await Promise.all([
      repositories.scenes.list(),
      repositories.prompts.list(),
      db.versions.toArray(),
      db.usageRecords.toArray()
    ]);
    return {
      schemaVersion: EXPORT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      scenes,
      prompts,
      versions,
      usageRecords
    };
  },

  async previewImport(payload: ExportPayload): Promise<ImportPreview> {
    if (payload.schemaVersion !== EXPORT_SCHEMA_VERSION) {
      throw new Error("Unsupported schema version.");
    }
    const localScenes = await repositories.scenes.list();
    const localSceneNames = new Set(localScenes.map((scene) => scene.name));
    const importedSceneNames = new Set(payload.scenes.map((scene) => scene.name));
    const localSceneNameById = new Map(localScenes.map((scene) => [scene.id, scene.name]));
    const importedSceneNameById = new Map(payload.scenes.map((scene) => [scene.id, scene.name]));
    const localPrompts = await repositories.prompts.list();
    const localPromptKeys = new Set(localPrompts.map((prompt) => samePromptKey(prompt, localSceneNameById)));
    const importedPromptKeys = payload.prompts.map((prompt) => samePromptKey(prompt, importedSceneNameById));
    const localVersions = await db.versions.toArray();
    const localVersionContents = new Set(localVersions.map((version) => `${version.promptId}::${version.content}`));

    return {
      scenesToAdd: payload.scenes.filter((scene) => !localSceneNames.has(scene.name)).length,
      scenesToMerge: payload.scenes.filter((scene) => localSceneNames.has(scene.name)).length,
      promptsToAdd: importedPromptKeys.filter((key) => !localPromptKeys.has(key)).length,
      promptsToMerge: importedPromptKeys.filter((key) => localPromptKeys.has(key)).length,
      versionsToAdd: payload.versions.filter((version) => !localVersionContents.has(`${version.promptId}::${version.content}`)).length,
      warnings: [...importedSceneNames].length !== payload.scenes.length ? ["导入文件中存在同名 Scene。"] : []
    };
  },

  async importAll(payload: ExportPayload): Promise<ImportPreview> {
    const preview = await this.previewImport(payload);
    const localScenes = await repositories.scenes.list();
    const localSceneByName = new Map(localScenes.map((scene) => [scene.name, scene]));
    const sceneIdMap = new Map<string, string>();
    const scenesToAdd: Scene[] = [];

    for (const importedScene of payload.scenes) {
      const localScene = localSceneByName.get(importedScene.name);
      if (localScene) {
        sceneIdMap.set(importedScene.id, localScene.id);
      } else {
        sceneIdMap.set(importedScene.id, importedScene.id);
        scenesToAdd.push(importedScene);
      }
    }

    await db.transaction("rw", db.scenes, db.prompts, db.versions, db.usageRecords, async () => {
      await db.scenes.bulkPut(scenesToAdd);
      const currentPrompts = await db.prompts.toArray();
      const currentScenes = await db.scenes.toArray();
      const sceneNameById = new Map(currentScenes.map((scene) => [scene.id, scene.name]));
      const promptByKey = new Map(currentPrompts.map((prompt) => [samePromptKey(prompt, sceneNameById), prompt]));

      for (const importedPrompt of payload.prompts) {
        const mappedSceneId = sceneIdMap.get(importedPrompt.sceneId) || importedPrompt.sceneId;
        const importedWithMappedScene = { ...importedPrompt, sceneId: mappedSceneId };
        const key = samePromptKey(importedWithMappedScene, sceneNameById);
        const localPrompt = promptByKey.get(key);
        await db.prompts.put(localPrompt ? { ...localPrompt, updatedAt: new Date().toISOString() } : importedWithMappedScene);
      }

      const promptsAfterMerge = await db.prompts.toArray();
      const promptIdByKey = new Map(promptsAfterMerge.map((prompt) => [samePromptKey(prompt, sceneNameById), prompt.id]));
      const existingVersions = await db.versions.toArray();
      const existingContents = new Set(existingVersions.map((version) => `${version.promptId}::${version.content}`));

      for (const importedVersion of payload.versions) {
        const importedPrompt = payload.prompts.find((prompt) => prompt.id === importedVersion.promptId);
        if (!importedPrompt) continue;
        const mappedSceneId = sceneIdMap.get(importedPrompt.sceneId) || importedPrompt.sceneId;
        const key = samePromptKey({ ...importedPrompt, sceneId: mappedSceneId }, sceneNameById);
        const promptId = promptIdByKey.get(key);
        if (!promptId) continue;
        const versionKey = `${promptId}::${importedVersion.content}`;
        if (!existingContents.has(versionKey)) {
          await db.versions.put({ ...importedVersion, id: crypto.randomUUID(), promptId });
        }
      }
    });
    return preview;
  }
};
