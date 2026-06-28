export type Id = string;
export type IsoDateString = string;

export type SceneColor =
  | "gray"
  | "blue"
  | "sky"
  | "teal"
  | "green"
  | "violet"
  | "pink"
  | "rose"
  | "orange"
  | "amber";

export type SceneIcon =
  | "bot"
  | "brain"
  | "book"
  | "briefcase"
  | "chart"
  | "code"
  | "database"
  | "file"
  | "flask"
  | "globe"
  | "image"
  | "lightbulb"
  | "message"
  | "pen"
  | "rocket"
  | "search"
  | "settings"
  | "shield"
  | "sparkles"
  | "target";

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
  favorite: boolean;
  latestVersionId: Id;
  latestVersionNumber: number;
  sortOrder: number;
  lastUsedAt: IsoDateString | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface PromptVersion {
  id: Id;
  promptId: Id;
  versionNumber: number;
  customVersionLabel?: string;
  content: string;
  description: string;
  tags: string[];
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
