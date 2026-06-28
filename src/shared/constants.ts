import type { SceneColor, SceneIcon } from "./types";

export const APP_NAME = "FH Prompt Manager";
export const DB_NAME = "fh-prompt-manager";
export const DB_VERSION = 2;
export const EXPORT_SCHEMA_VERSION = 1;

export const FIELD_LIMITS = {
  sceneName: 10,
  sceneDescription: 30,
  promptTitle: 15,
  tag: 10,
  highlight: 100,
  customVersionLabel: 10
};

export const SCENE_COLORS: Record<SceneColor, string> = {
  gray: "#64748b",
  blue: "#2563eb",
  sky: "#0284c7",
  teal: "#0f766e",
  green: "#16a34a",
  violet: "#7c3aed",
  pink: "#db2777",
  rose: "#e11d48",
  orange: "#ea580c",
  amber: "#d97706"
};

export const SCENE_ICONS: SceneIcon[] = [
  "briefcase",
  "code",
  "pen",
  "chart",
  "image",
  "bot",
  "brain",
  "book",
  "database",
  "file",
  "flask",
  "globe",
  "lightbulb",
  "message",
  "rocket",
  "search",
  "settings",
  "shield",
  "sparkles",
  "target"
];
