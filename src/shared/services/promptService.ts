import { db } from "../data/db";
import { repositories } from "../data/repositories";
import type { Prompt, PromptSearchQuery, PromptWithLatest, PromptVersion, UsageSource } from "../types";

function now() {
  return new Date().toISOString();
}

function id() {
  return crypto.randomUUID();
}

function includesText(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export const promptService = {
  async createPrompt(input: {
    sceneId: string;
    title: string;
    description: string;
    tags: string[];
    favorite: boolean;
    content: string;
    note: string;
  }): Promise<Prompt> {
    const timestamp = now();
    const promptId = id();
    const versionId = id();
    const existingPrompts = await repositories.prompts.listByScene(input.sceneId);
    const prompt: Prompt = {
      id: promptId,
      sceneId: input.sceneId,
      title: input.title,
      favorite: input.favorite,
      latestVersionId: versionId,
      latestVersionNumber: 1,
      sortOrder: existingPrompts.reduce((maximum, item) => Math.max(maximum, item.sortOrder), 0) + 1,
      lastUsedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    const version: PromptVersion = {
      id: versionId,
      promptId,
      versionNumber: 1,
      content: input.content,
      description: input.description,
      tags: input.tags,
      note: input.note,
      createdAt: timestamp
    };
    await db.transaction("rw", db.prompts, db.versions, async () => {
      await db.prompts.put(prompt);
      await db.versions.put(version);
    });
    return prompt;
  },

  async saveNewVersion(
    promptId: string,
    input: { content: string; description: string; tags: string[]; note: string; customVersionLabel?: string }
  ): Promise<Prompt> {
    const prompt = await repositories.prompts.get(promptId);
    if (!prompt) throw new Error("Prompt not found.");
    const timestamp = now();
    const version: PromptVersion = {
      id: id(),
      promptId,
      versionNumber: prompt.latestVersionNumber + 1,
      customVersionLabel: input.customVersionLabel?.trim() || undefined,
      content: input.content,
      description: input.description,
      tags: input.tags,
      note: input.note,
      createdAt: timestamp
    };
    const updated: Prompt = {
      ...prompt,
      latestVersionId: version.id,
      latestVersionNumber: version.versionNumber,
      updatedAt: timestamp
    };
    await db.transaction("rw", db.prompts, db.versions, async () => {
      await db.versions.put(version);
      await db.prompts.put(updated);
    });
    return updated;
  },

  async updatePrompt(
    promptId: string,
    input: { title: string; favorite: boolean }
  ): Promise<Prompt> {
    const prompt = await repositories.prompts.get(promptId);
    if (!prompt) throw new Error("Prompt not found.");
    const updated: Prompt = {
      ...prompt,
      title: input.title,
      favorite: input.favorite,
      updatedAt: now()
    };
    await repositories.prompts.put(updated);
    return updated;
  },

  async searchPrompts(query: PromptSearchQuery): Promise<PromptWithLatest[]> {
    const text = query.text.trim().toLowerCase();
    const [prompts, scenes] = await Promise.all([repositories.prompts.list(), repositories.scenes.list()]);
    const sceneById = new Map(scenes.map((scene) => [scene.id, scene]));
    const results: PromptWithLatest[] = [];
    for (const prompt of prompts) {
      if (query.sceneId && prompt.sceneId !== query.sceneId) continue;
      const latestVersion = await repositories.versions.get(prompt.latestVersionId);
      const scene = sceneById.get(prompt.sceneId);
      if (!latestVersion || !scene) continue;
      const searchable = [prompt.title, latestVersion.description, latestVersion.tags.join(" "), latestVersion.content].join(" ");
      if (!text || includesText(searchable, text)) {
        results.push({ prompt, latestVersion, scene });
      }
    }
    return results.sort((a, b) => a.prompt.sortOrder - b.prompt.sortOrder);
  },

  async listRecentPrompts(limit: number, sceneId?: string): Promise<PromptWithLatest[]> {
    const [prompts, scenes] = await Promise.all([repositories.prompts.list(), repositories.scenes.list()]);
    const sceneById = new Map(scenes.map((scene) => [scene.id, scene]));
    const recentPrompts = prompts
      .filter((prompt) => prompt.lastUsedAt && (!sceneId || prompt.sceneId === sceneId))
      .sort((a, b) => (b.lastUsedAt || "").localeCompare(a.lastUsedAt || "") || a.sortOrder - b.sortOrder);
    const results: PromptWithLatest[] = [];

    for (const prompt of recentPrompts.slice(0, limit)) {
      const latestVersion = await repositories.versions.get(prompt.latestVersionId);
      const scene = sceneById.get(prompt.sceneId);
      if (!latestVersion || !scene) continue;
      results.push({ prompt, latestVersion, scene });
    }

    return results;
  },

  async reorderPrompts(promptIds: string[]) {
    const prompts = await Promise.all(promptIds.map((promptId) => repositories.prompts.get(promptId)));
    const timestamp = now();
    await repositories.prompts.bulkPut(prompts.flatMap((prompt, index) => (
      prompt ? [{ ...prompt, sortOrder: index + 1, updatedAt: timestamp }] : []
    )));
  },

  async recordUsage(promptId: string, versionId: string, source: UsageSource) {
    const timestamp = now();
    const prompt = await repositories.prompts.get(promptId);
    if (!prompt) throw new Error("Prompt not found.");
    await db.transaction("rw", db.prompts, db.usageRecords, async () => {
      await db.usageRecords.put({ id: id(), promptId, versionId, usedAt: timestamp, source });
      await db.prompts.put({ ...prompt, lastUsedAt: timestamp, updatedAt: timestamp });
    });
  },

  async deletePrompt(promptId: string) {
    await repositories.prompts.deleteWithVersions(promptId);
  }
};
