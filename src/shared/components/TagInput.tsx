import { X } from "lucide-react";
import { useState } from "react";
import { createPromptTag, getPromptTagStyle } from "../tagUtils";
import type { PromptTag } from "../types";

export function TagInput({
  tags,
  onChange,
  maxTags,
  maxTagLength,
  showAddButton = true,
  placeholder = "添加标签..."
}: {
  tags: PromptTag[];
  onChange: (tags: PromptTag[]) => void;
  maxTags?: number;
  maxTagLength?: number;
  showAddButton?: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const canAddMore = maxTags === undefined || tags.length < maxTags;

  function addTag() {
    const tag = draft.trim();
    if (!tag || tags.some((item) => item.label === tag) || !canAddMore) return;
    if (maxTagLength !== undefined && tag.length > maxTagLength) return;
    onChange([...tags, createPromptTag(tag)]);
    setDraft("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((item) => item.label !== tag));
  }

  return (
    <div className="tag-field">
      <div className="tag-editor" aria-label="标签栏">
        {tags.map((tag) => (
          <span className="tag tag-editable" key={`${tag.label}-${tag.color}`} style={getPromptTagStyle(tag.color)}>
            {tag.label}
            <button type="button" aria-label={`移除标签 ${tag.label}`} onClick={() => removeTag(tag.label)}>
              <X className="icon" />
            </button>
          </span>
        ))}
      </div>
      <div className="tag-add-row">
        <input
          aria-label="添加标签"
          disabled={!canAddMore}
          maxLength={maxTagLength}
          placeholder={placeholder}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            addTag();
          }}
        />
        {showAddButton && <button type="button" className="btn btn-secondary" disabled={!canAddMore} onClick={addTag}>添加标签</button>}
      </div>
    </div>
  );
}
