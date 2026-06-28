import type { ImageAsset, Prompt, PromptVersion, Scene } from "../shared/types";

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
    promptType: "text",
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
    favorite: true,
    latestVersionId: "version-1",
    latestVersionNumber: 1,
    sortOrder: 1,
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
    description: "不改变行为的前提下重构代码。",
    tags: ["review", "cleanup"],
    note: "初始版本",
    createdAt: iso(),
    ...overrides
  };
}

export function imageAssetFactory(overrides: Partial<ImageAsset> = {}): ImageAsset {
  const blob = new Blob(["image-bytes"], { type: "image/png" });
  return {
    id: "asset-cover",
    mimeType: "image/png",
    size: blob.size,
    sha256: "hash-cover",
    blob,
    createdAt: iso(),
    ...overrides
  };
}
