import { EXPORT_SCHEMA_VERSION } from "../constants";
import { db } from "../data/db";
import { repositories } from "../data/repositories";
import { normalizePromptVersion } from "../tagUtils";
import type { ExportPayload, ImportPreview, Prompt, PromptVersion, Scene } from "../types";

function samePromptKey(prompt: Prompt, sceneNameById: Map<string, string>) {
  return `${sceneNameById.get(prompt.sceneId) || ""}::${prompt.title}`;
}

function buildImportMappings(payload: ExportPayload, localScenes: Scene[], localPrompts: Prompt[]) {
  const localSceneByName = new Map(localScenes.map((scene) => [scene.name, scene]));
  const localSceneNameById = new Map(localScenes.map((scene) => [scene.id, scene.name]));
  const importedSceneNameById = new Map(payload.scenes.map((scene) => [scene.id, scene.name]));
  const localPromptByKey = new Map(localPrompts.map((prompt) => [samePromptKey(prompt, localSceneNameById), prompt]));
  const sceneIdMap = new Map<string, string>();
  const promptIdMap = new Map<string, string>();

  for (const importedScene of payload.scenes) {
    sceneIdMap.set(importedScene.id, localSceneByName.get(importedScene.name)?.id ?? importedScene.id);
  }

  for (const importedPrompt of payload.prompts) {
    const key = samePromptKey(importedPrompt, importedSceneNameById);
    const localPrompt = localPromptByKey.get(key);
    promptIdMap.set(importedPrompt.id, localPrompt?.id ?? importedPrompt.id);
  }

  return {
    localSceneByName,
    importedSceneNameById,
    sceneIdMap,
    promptIdMap
  };
}

function buildVersionIdMap(
  payloadVersions: PromptVersion[],
  promptIdMap: Map<string, string>,
  existingVersions: PromptVersion[]
) {
  const versionIdMap = new Map<string, string>();
  const existingVersionIdByKey = new Map(existingVersions.map((version) => [`${version.promptId}::${version.content}`, version.id]));
  const versionsToAdd: PromptVersion[] = [];

  for (const importedVersion of payloadVersions) {
    const promptId = promptIdMap.get(importedVersion.promptId);
    if (!promptId) continue;
    const versionKey = `${promptId}::${importedVersion.content}`;
    const existingVersionId = existingVersionIdByKey.get(versionKey);
    if (existingVersionId) {
      versionIdMap.set(importedVersion.id, existingVersionId);
      continue;
    }
    const newId = crypto.randomUUID();
    versionIdMap.set(importedVersion.id, newId);
    versionsToAdd.push(normalizePromptVersion({ ...importedVersion, id: newId, promptId }));
    existingVersionIdByKey.set(versionKey, newId);
  }

  return { versionIdMap, versionsToAdd };
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
      versions: versions.map(normalizePromptVersion),
      usageRecords
    };
  },

  async previewImport(payload: ExportPayload): Promise<ImportPreview> {
    if (payload.schemaVersion !== EXPORT_SCHEMA_VERSION) {
      throw new Error("Unsupported schema version.");
    }
    const localScenes = await repositories.scenes.list();
    const localPrompts = await repositories.prompts.list();
    const { importedSceneNameById, localSceneByName, promptIdMap } = buildImportMappings(payload, localScenes, localPrompts);
    const localSceneNames = new Set(localScenes.map((scene) => scene.name));
    const importedSceneNames = new Set(payload.scenes.map((scene) => scene.name));
    const localSceneNameById = new Map(localScenes.map((scene) => [scene.id, scene.name]));
    const localPromptKeys = new Set(localPrompts.map((prompt) => samePromptKey(prompt, localSceneNameById)));
    const importedPromptKeys = payload.prompts.map((prompt) => samePromptKey(prompt, importedSceneNameById));
    const localVersions = await db.versions.toArray();
    const knownVersionKeys = new Set(localVersions.map((version) => `${version.promptId}::${version.content}`));
    let versionsToAdd = 0;

    for (const importedVersion of payload.versions) {
      const mappedPromptId = promptIdMap.get(importedVersion.promptId);
      if (!mappedPromptId) continue;
      const versionKey = `${mappedPromptId}::${importedVersion.content}`;
      if (knownVersionKeys.has(versionKey)) continue;
      knownVersionKeys.add(versionKey);
      versionsToAdd += 1;
    }

    return {
      scenesToAdd: payload.scenes.filter((scene) => !localSceneByName.has(scene.name)).length,
      scenesToMerge: payload.scenes.filter((scene) => localSceneNames.has(scene.name)).length,
      promptsToAdd: importedPromptKeys.filter((key) => !localPromptKeys.has(key)).length,
      promptsToMerge: importedPromptKeys.filter((key) => localPromptKeys.has(key)).length,
      versionsToAdd,
      warnings: [...importedSceneNames].length !== payload.scenes.length ? ["导入文件中存在同名 Scene。"] : []
    };
  },

  async importAll(payload: ExportPayload): Promise<ImportPreview> {
    const preview = await this.previewImport(payload);
    const localScenes = await repositories.scenes.list();
    const localPrompts = await repositories.prompts.list();
    const { localSceneByName, importedSceneNameById, sceneIdMap, promptIdMap } = buildImportMappings(payload, localScenes, localPrompts);
    const scenesToAdd: Scene[] = [];

    for (const importedScene of payload.scenes) {
      const localScene = localSceneByName.get(importedScene.name);
      if (localScene) {
        sceneIdMap.set(importedScene.id, localScene.id);
      } else {
        scenesToAdd.push(importedScene);
      }
    }

    await db.transaction("rw", db.scenes, db.prompts, db.versions, db.usageRecords, async () => {
      await db.scenes.bulkPut(scenesToAdd);
      const currentPrompts = await db.prompts.toArray();
      const currentScenes = await db.scenes.toArray();
      const sceneNameById = new Map(currentScenes.map((scene) => [scene.id, scene.name]));
      const promptByKey = new Map(currentPrompts.map((prompt) => [samePromptKey(prompt, sceneNameById), prompt]));
      const existingVersions = await db.versions.toArray();
      const { versionIdMap, versionsToAdd } = buildVersionIdMap(payload.versions, promptIdMap, existingVersions);
      const promptsToPut: Prompt[] = [];

      for (const importedPrompt of payload.prompts) {
        const mappedSceneId = sceneIdMap.get(importedPrompt.sceneId) || importedPrompt.sceneId;
        const key = samePromptKey(importedPrompt, importedSceneNameById);
        const localPrompt = promptByKey.get(key);
        const resolvedLatestVersionId = versionIdMap.get(importedPrompt.latestVersionId) || importedPrompt.latestVersionId;
        if (localPrompt) {
          const localLatestVersion = await repositories.versions.get(localPrompt.latestVersionId);
          const shouldPromoteImportedLatest = importedPrompt.latestVersionNumber > localPrompt.latestVersionNumber
            || (!localLatestVersion && Boolean(resolvedLatestVersionId));
          promptsToPut.push({
            ...localPrompt,
            latestVersionId: shouldPromoteImportedLatest ? resolvedLatestVersionId : localPrompt.latestVersionId,
            latestVersionNumber: shouldPromoteImportedLatest
              ? importedPrompt.latestVersionNumber
              : Math.max(localPrompt.latestVersionNumber, importedPrompt.latestVersionNumber),
            updatedAt: new Date().toISOString()
          });
          continue;
        }
        promptsToPut.push({
          ...importedPrompt,
          id: promptIdMap.get(importedPrompt.id) || importedPrompt.id,
          sceneId: mappedSceneId,
          latestVersionId: resolvedLatestVersionId
        });
      }

      await db.versions.bulkPut(versionsToAdd);
      await db.prompts.bulkPut(promptsToPut);
    });
    return preview;
  }
};
