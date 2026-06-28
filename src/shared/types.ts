export type Id = string;
export type IsoDateString = string;
export type PromptType = "text" | "image";
export type ImageMimeType = "image/png" | "image/jpeg" | "image/webp";

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
  promptType: PromptType;
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

export type PromptTagColor =
  | "green"
  | "blue"
  | "sky"
  | "teal"
  | "violet"
  | "pink"
  | "rose"
  | "orange"
  | "amber";

export interface PromptTag {
  label: string;
  color: PromptTagColor;
}

export type StoredPromptTag = string | PromptTag;

export interface PromptVersion {
  id: Id;
  promptId: Id;
  versionNumber: number;
  customVersionLabel?: string;
  content: string;
  description: string;
  tags: StoredPromptTag[];
  note: string;
  imageAssetId?: Id;
  createdAt: IsoDateString;
}

export interface ImageAsset {
  id: Id;
  mimeType: ImageMimeType;
  size: number;
  sha256: string;
  data: ArrayBuffer;
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
  schemaVersion: 2;
  exportedAt: IsoDateString;
  scenes: Scene[];
  prompts: Prompt[];
  versions: PromptVersion[];
  usageRecords: UsageRecord[];
}

export interface ZipBackupAssetManifest {
  id: Id;
  path: string;
  mimeType: ImageMimeType;
  size: number;
  sha256: string;
}

export interface ZipBackupManifest {
  app: "fh-prompt-manager";
  schemaVersion: 2;
  exportedAt: IsoDateString;
  counts: {
    scenes: number;
    prompts: number;
    versions: number;
    usageRecords: number;
    imageAssets: number;
  };
  assets: ZipBackupAssetManifest[];
}

export interface ImportPreview {
  scenes: number;
  prompts: number;
  versions: number;
  usageRecords: number;
  imageAssets: number;
  warnings: string[];
}
