import { PROMPT_TAG_COLOR_ORDER, PROMPT_TAG_COLORS } from "./constants";
import type { PromptTag, PromptTagColor, PromptVersion, StoredPromptTag } from "./types";

function isPromptTag(tag: StoredPromptTag): tag is PromptTag {
  return typeof tag === "object" && tag !== null && "label" in tag && "color" in tag;
}

function isPromptTagColor(color: unknown): color is PromptTagColor {
  return typeof color === "string" && color in PROMPT_TAG_COLORS;
}

function fallbackColorForLabel(label: string): PromptTagColor {
  const hash = Array.from(label).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return PROMPT_TAG_COLOR_ORDER[hash % PROMPT_TAG_COLOR_ORDER.length];
}

export function getPromptTagLabel(tag: StoredPromptTag) {
  return typeof tag === "string" ? tag : tag.label;
}

export function pickRandomPromptTagColor() {
  return PROMPT_TAG_COLOR_ORDER[Math.floor(Math.random() * PROMPT_TAG_COLOR_ORDER.length)];
}

export function createPromptTag(label: string): PromptTag {
  return {
    label: label.trim(),
    color: pickRandomPromptTagColor()
  };
}

export function normalizePromptTag(tag: StoredPromptTag): PromptTag {
  const label = getPromptTagLabel(tag).trim();
  if (isPromptTag(tag) && isPromptTagColor(tag.color)) {
    return {
      label,
      color: tag.color
    };
  }
  return {
    label,
    color: fallbackColorForLabel(label)
  };
}

export function normalizePromptTags(tags: StoredPromptTag[]) {
  return tags
    .map(normalizePromptTag)
    .filter((tag) => tag.label.length > 0);
}

export function normalizePromptVersion(version: PromptVersion): PromptVersion {
  return {
    ...version,
    tags: normalizePromptTags(version.tags)
  };
}

export function getPromptTagStyle(color: PromptTagColor) {
  return PROMPT_TAG_COLORS[color];
}
