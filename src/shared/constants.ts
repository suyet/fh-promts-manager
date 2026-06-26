import type { SceneColor, SceneIcon } from "./types";

export const APP_NAME = "FH Prompt Manager";
export const DB_NAME = "fh-prompt-manager";
export const DB_VERSION = 1;
export const EXPORT_SCHEMA_VERSION = 1;

export const SCENE_COLORS: Record<SceneColor, string> = {
  blue: "#2563eb",
  teal: "#0f766e",
  violet: "#7c3aed",
  pink: "#db2777",
  amber: "#d97706"
};

export const SCENE_ICONS: SceneIcon[] = ["code", "pen", "chart", "image", "briefcase"];
