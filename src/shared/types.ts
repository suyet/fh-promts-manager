export type Id = string;
export type IsoDateString = string;

export type SceneColor =
  | "blue"
  | "teal"
  | "violet"
  | "pink"
  | "amber";

export type SceneIcon =
  | "code"
  | "pen"
  | "chart"
  | "image"
  | "briefcase";

export interface Scene {
  id: Id;
  name: string;
  description: string;
  icon: SceneIcon;
  color: SceneColor;
  sortOrder: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface Prompt {
  id: Id;
  sceneId: Id;
  title: string;
  description: string;
  tags: string[];
  favorite: boolean;
  latestVersionId: Id;
  latestVersionNumber: number;
  lastUsedAt: IsoDateString | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface PromptVersion {
  id: Id;
  promptId: Id;
  versionNumber: number;
  content: string;
  note: string;
  createdAt: IsoDateString;
}

export type UsageSource = "manager" | "popup" | "version-history" | "diff";

export interface UsageRecord {
  id: Id;
  promptId: Id;
  versionId: Id;
  usedAt: IsoDateString;
  source: UsageSource;
}

export interface PromptWithLatest {
  prompt: Prompt;
  latestVersion: PromptVersion;
  scene: Scene;
}

export interface PromptSearchQuery {
  text: string;
  sceneId?: Id;
  recentOnly?: boolean;
}

export interface ExportPayload {
  schemaVersion: 1;
  exportedAt: IsoDateString;
  scenes: Scene[];
  prompts: Prompt[];
  versions: PromptVersion[];
  usageRecords: UsageRecord[];
}

export interface ImportPreview {
  scenesToAdd: number;
  scenesToMerge: number;
  promptsToAdd: number;
  promptsToMerge: number;
  versionsToAdd: number;
  warnings: string[];
}
