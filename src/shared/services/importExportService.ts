import JSZip from "jszip";
import { EXPORT_SCHEMA_VERSION, IMAGE_LIMITS } from "../constants";
import { db } from "../data/db";
import { repositories } from "../data/repositories";
import { normalizePromptVersion } from "../tagUtils";
import { imageAssetService } from "./imageAssetService";
import type {
  ExportPayload,
  ImageAsset,
  ImageMimeType,
  ImportPreview,
  Prompt,
  PromptVersion,
  Scene,
  ZipBackupManifest
} from "../types";

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

function imageExtension(mimeType: ImageMimeType) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
}

function isAllowedMimeType(type: string): type is ImageMimeType {
  return (IMAGE_LIMITS.allowedMimeTypes as readonly string[]).includes(type);
}

function isExportPayload(value: unknown): value is ExportPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ExportPayload>;
  return candidate.schemaVersion === EXPORT_SCHEMA_VERSION
    && Array.isArray(candidate.scenes)
    && Array.isArray(candidate.prompts)
    && Array.isArray(candidate.versions)
    && Array.isArray(candidate.usageRecords);
}

function isZipBackupManifest(value: unknown): value is ZipBackupManifest {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ZipBackupManifest>;
  return candidate.app === "fh-prompt-manager"
    && candidate.schemaVersion === EXPORT_SCHEMA_VERSION
    && typeof candidate.exportedAt === "string"
    && Boolean(candidate.counts)
    && Array.isArray(candidate.assets);
}

async function parseZipBackup(file: Blob) {
  if (file.size > IMAGE_LIMITS.maxZipBytes) {
    throw new Error("备份文件不能超过 200MB。");
  }
  const zip = await JSZip.loadAsync(file);
  const manifestFile = zip.file("manifest.json");
  const dataFile = zip.file("data.json");
  if (!manifestFile || !dataFile) {
    throw new Error("备份文件结构不完整。");
  }

  const manifest = JSON.parse(await manifestFile.async("string")) as unknown;
  const payload = JSON.parse(await dataFile.async("string")) as unknown;
  if (!isZipBackupManifest(manifest) || !isExportPayload(payload)) {
    throw new Error("导入文件版本不支持。");
  }

  const imageAssets: ImageAsset[] = [];
  for (const assetManifest of manifest.assets) {
    if (!isAllowedMimeType(assetManifest.mimeType)) {
      throw new Error("图片格式不支持。");
    }
    if (assetManifest.size > IMAGE_LIMITS.maxImageBytes) {
      throw new Error("图片不能超过 10MB。");
    }
    const assetFile = zip.file(assetManifest.path);
    if (!assetFile) {
      throw new Error(`图片资源缺失：${assetManifest.path}`);
    }
    const data = await assetFile.async("arraybuffer");
    if (data.byteLength !== assetManifest.size) {
      throw new Error("图片资源大小不匹配。");
    }
    const sha256 = await imageAssetService.sha256(new Blob([data], { type: assetManifest.mimeType }));
    if (sha256 !== assetManifest.sha256) {
      throw new Error("图片资源校验失败。");
    }
    imageAssets.push({
      id: assetManifest.id,
      mimeType: assetManifest.mimeType,
      size: assetManifest.size,
      sha256,
      data,
      createdAt: payload.exportedAt
    });
  }

  const imageAssetIds = new Set(imageAssets.map((asset) => asset.id));
  for (const version of payload.versions) {
    if (version.imageAssetId && !imageAssetIds.has(version.imageAssetId)) {
      throw new Error(`图片资源缺失：${version.imageAssetId}`);
    }
  }

  return { payload, imageAssets };
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

  async exportZip(): Promise<Blob> {
    const [payload, imageAssets] = await Promise.all([
      this.exportAll(),
      db.imageAssets.toArray()
    ]);
    const zip = new JSZip();
    const assets = imageAssets.map((asset) => ({
      id: asset.id,
      path: `assets/${asset.id}.${imageExtension(asset.mimeType)}`,
      mimeType: asset.mimeType,
      size: asset.size,
      sha256: asset.sha256
    }));
    const manifest: ZipBackupManifest = {
      app: "fh-prompt-manager",
      schemaVersion: EXPORT_SCHEMA_VERSION,
      exportedAt: payload.exportedAt,
      counts: {
        scenes: payload.scenes.length,
        prompts: payload.prompts.length,
        versions: payload.versions.length,
        usageRecords: payload.usageRecords.length,
        imageAssets: imageAssets.length
      },
      assets
    };

    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    zip.file("data.json", JSON.stringify(payload, null, 2));
    for (let index = 0; index < imageAssets.length; index += 1) {
      zip.file(assets[index].path, new Uint8Array(imageAssets[index].data));
    }
    return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  },

  async previewImport(payload: ExportPayload, imageAssetCount = 0): Promise<ImportPreview> {
    if (payload.schemaVersion !== EXPORT_SCHEMA_VERSION) {
      throw new Error("Unsupported schema version.");
    }
    const localScenes = await repositories.scenes.list();
    const localPrompts = await repositories.prompts.list();
    const { importedSceneNameById, localSceneByName, promptIdMap } = buildImportMappings(payload, localScenes, localPrompts);
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
      scenes: payload.scenes.length,
      prompts: importedPromptKeys.length,
      versions: versionsToAdd,
      usageRecords: payload.usageRecords.length,
      imageAssets: imageAssetCount,
      warnings: [...importedSceneNames].length !== payload.scenes.length ? ["导入文件中存在同名 Scene。"] : []
    };
  },

  async previewZipImport(file: Blob): Promise<ImportPreview> {
    const { payload, imageAssets } = await parseZipBackup(file);
    return this.previewImport(payload, imageAssets.length);
  },

  async importAll(payload: ExportPayload, imageAssets: ImageAsset[] = []): Promise<ImportPreview> {
    const preview = await this.previewImport(payload, imageAssets.length);
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

    await db.transaction("rw", db.scenes, db.prompts, db.versions, db.usageRecords, db.imageAssets, async () => {
      await db.scenes.bulkPut(scenesToAdd);
      await db.imageAssets.bulkPut(imageAssets);
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
  },

  async importZip(file: Blob): Promise<ImportPreview> {
    const { payload, imageAssets } = await parseZipBackup(file);
    return this.importAll(payload, imageAssets);
  }
};
