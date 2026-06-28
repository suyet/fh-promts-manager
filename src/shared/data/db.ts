import Dexie, { type Table } from "dexie";
import { DB_NAME, DB_VERSION } from "../constants";
import type { ImageAsset, Prompt, PromptVersion, Scene, UsageRecord } from "../types";

export class FhPromptDatabase extends Dexie {
  scenes!: Table<Scene, string>;
  prompts!: Table<Prompt, string>;
  versions!: Table<PromptVersion, string>;
  imageAssets!: Table<ImageAsset, string>;
  usageRecords!: Table<UsageRecord, string>;

  constructor(name = DB_NAME) {
    super(name);
    this.version(DB_VERSION).stores({
      scenes: "id, name, promptType, sortOrder, updatedAt",
      prompts: "id, sceneId, title, latestVersionId, latestVersionNumber, sortOrder, lastUsedAt, updatedAt",
      versions: "id, promptId, versionNumber, imageAssetId, createdAt",
      imageAssets: "id, mimeType, sha256, createdAt",
      usageRecords: "id, promptId, versionId, usedAt, source"
    });
  }
}

export const db = new FhPromptDatabase();

export async function resetDatabase() {
  await db.delete();
  await db.open();
}
