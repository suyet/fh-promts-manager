import type { Prompt, PromptVersion, Scene } from "../shared/types";

export function iso(value = "2026-06-26T00:00:00.000Z") {
  return value;
}

export function sceneFactory(overrides: Partial<Scene> = {}): Scene {
  return {
    id: "scene-code",
    name: "代码重构",
    description: "工程质量与 review",
    icon: "code",
    color: "blue",
    sortOrder: 1,
    createdAt: iso(),
    updatedAt: iso(),
    ...overrides
  };
}

export function promptFactory(overrides: Partial<Prompt> = {}): Prompt {
  return {
    id: "prompt-refactor",
    sceneId: "scene-code",
    title: "Code Refactor Helper",
    description: "不改变行为的前提下重构代码。",
    tags: ["review", "cleanup"],
    favorite: true,
    latestVersionId: "version-1",
    latestVersionNumber: 1,
    lastUsedAt: null,
    createdAt: iso(),
    updatedAt: iso(),
    ...overrides
  };
}

export function versionFactory(overrides: Partial<PromptVersion> = {}): PromptVersion {
  return {
    id: "version-1",
    promptId: "prompt-refactor",
    versionNumber: 1,
    content: "请重构下面的代码。",
    note: "初始版本",
    createdAt: iso(),
    ...overrides
  };
}
