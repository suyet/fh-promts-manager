import { db } from "./db";
import { normalizePromptVersion } from "../tagUtils";
import type { Prompt, PromptVersion, Scene, UsageRecord } from "../types";

export const repositories = {
  scenes: {
    list: () => db.scenes.orderBy("sortOrder").toArray(),
    get: (id: string) => db.scenes.get(id),
    put: (scene: Scene) => db.scenes.put(scene),
    bulkPut: (scenes: Scene[]) => db.scenes.bulkPut(scenes),
    delete: (id: string) => db.scenes.delete(id)
  },
  prompts: {
    list: () => db.prompts.toArray(),
    listByScene: (sceneId: string) => db.prompts.where("sceneId").equals(sceneId).toArray(),
    get: (id: string) => db.prompts.get(id),
    put: (prompt: Prompt) => db.prompts.put(prompt),
    bulkPut: (prompts: Prompt[]) => db.prompts.bulkPut(prompts),
    async deleteWithVersions(promptId: string) {
      await db.transaction("rw", db.prompts, db.versions, db.usageRecords, async () => {
        await db.prompts.delete(promptId);
        await db.versions.where("promptId").equals(promptId).delete();
        await db.usageRecords.where("promptId").equals(promptId).delete();
      });
    }
  },
  versions: {
    async get(id: string) {
      const version = await db.versions.get(id);
      return version ? normalizePromptVersion(version) : undefined;
    },
    put: (version: PromptVersion) => db.versions.put(normalizePromptVersion(version)),
    bulkPut: (versions: PromptVersion[]) => db.versions.bulkPut(versions.map(normalizePromptVersion)),
    async listByPrompt(promptId: string) {
      const versions = await db.versions.where("promptId").equals(promptId).sortBy("versionNumber");
      return versions.map(normalizePromptVersion);
    }
  },
  usageRecords: {
    put: (record: UsageRecord) => db.usageRecords.put(record),
    bulkPut: (records: UsageRecord[]) => db.usageRecords.bulkPut(records),
    listRecent: (limit: number) =>
      db.usageRecords.orderBy("usedAt").reverse().limit(limit).toArray()
  }
};
