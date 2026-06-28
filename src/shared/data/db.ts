import Dexie, { type Table } from "dexie";
import { DB_NAME, DB_VERSION } from "../constants";
import type { Prompt, PromptVersion, Scene, UsageRecord } from "../types";

export class FhPromptDatabase extends Dexie {
  scenes!: Table<Scene, string>;
  prompts!: Table<Prompt, string>;
  versions!: Table<PromptVersion, string>;
  usageRecords!: Table<UsageRecord, string>;

  constructor(name = DB_NAME) {
    super(name);
    this.version(1).stores({
      scenes: "id, name, sortOrder, updatedAt",
      prompts: "id, sceneId, title, latestVersionId, latestVersionNumber, lastUsedAt, updatedAt",
      versions: "id, promptId, versionNumber, createdAt",
      usageRecords: "id, promptId, versionId, usedAt, source"
    });
    this.version(DB_VERSION).stores({
      scenes: "id, name, sortOrder, updatedAt",
      prompts: "id, sceneId, title, latestVersionId, latestVersionNumber, sortOrder, lastUsedAt, updatedAt",
      versions: "id, promptId, versionNumber, createdAt",
      usageRecords: "id, promptId, versionId, usedAt, source"
    }).upgrade(async (transaction) => {
      const prompts = await transaction.table<Prompt, string>("prompts").toArray();
      const byScene = new Map<string, Prompt[]>();
      for (const prompt of prompts) {
        byScene.set(prompt.sceneId, [...(byScene.get(prompt.sceneId) ?? []), prompt]);
      }
      for (const scenePrompts of byScene.values()) {
        scenePrompts.sort((first, second) => first.createdAt.localeCompare(second.createdAt));
        await transaction.table<Prompt, string>("prompts").bulkPut(scenePrompts.map((prompt, index) => ({
          ...prompt,
          sortOrder: prompt.sortOrder ?? index + 1
        })));
      }
    });
  }
}

export const db = new FhPromptDatabase();

export async function resetDatabase() {
  await db.delete();
  await db.open();
}
