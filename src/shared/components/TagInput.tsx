import { X } from "lucide-react";
import { useState } from "react";

export function TagInput({
  tags,
  onChange,
  maxTags,
  maxTagLength,
  showAddButton = true,
  placeholder = "添加标签..."
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  maxTagLength?: number;
  showAddButton?: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const canAddMore = maxTags === undefined || tags.length < maxTags;

  function addTag() {
    const tag = draft.trim();
    if (!tag || tags.includes(tag) || !canAddMore) return;
    if (maxTagLength !== undefined && tag.length > maxTagLength) return;
    onChange([...tags, tag]);
    setDraft("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((item) => item !== tag));
  }

  return (
    <div className="tag-field">
      <div className="tag-editor" aria-label="标签栏">
        {tags.map((tag) => (
          <span className="tag tag-editable" key={tag}>
            {tag}
            <button type="button" aria-label={`移除标签 ${tag}`} onClick={() => removeTag(tag)}>
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
