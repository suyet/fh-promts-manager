import { Clock, Copy, GripVertical, Star } from "lucide-react";
import { getPromptTagStyle, normalizePromptTags } from "../tagUtils";
import type { PromptWithLatest } from "../types";
import { IconButton } from "./IconButton";

function formatDate(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

function summarizePromptContent(content: string) {
  return content.replace(/\s+/g, "");
}

export function PromptCard({
  item,
  onOpen,
  onCopy,
  onToggleFavorite,
  isSorting = false,
  onDragStart,
  onDrop
}: {
  item: PromptWithLatest;
  onOpen: () => void;
  onCopy: () => void;
  onToggleFavorite: () => void;
  isSorting?: boolean;
  onDragStart?: () => void;
  onDrop?: () => void;
}) {
  const favoriteLabel = item.prompt.favorite ? "取消收藏" : "收藏";
  const openCard = () => {
    if (!isSorting) onOpen();
  };

  return (
    <article
      className={isSorting ? "prompt-card sorting" : "prompt-card"}
      data-testid={`prompt-card-${item.prompt.id}`}
      draggable={isSorting}
      onClick={openCard}
      onDragStart={onDragStart}
      onDragOver={(event) => {
        if (isSorting) event.preventDefault();
      }}
      onDrop={onDrop}
    >
      <div className="card-top">
        {isSorting && <span className="prompt-sort-grip"><GripVertical className="icon" /></span>}
        <button className="card-main" onClick={(event) => {
          event.stopPropagation();
          openCard();
        }}>
          <h2>{item.prompt.title}</h2>
        </button>
        {!isSorting && <div className="card-icon-actions">
          <IconButton
            className={item.prompt.favorite ? "favorite-active" : undefined}
            label={favoriteLabel}
            icon={<Star className="icon" fill={item.prompt.favorite ? "currentColor" : "none"} />}
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite();
            }}
          />
          <IconButton label="复制最新版本" icon={<Copy className="icon" />} onClick={(event) => {
            event.stopPropagation();
            onCopy();
          }} />
        </div>}
      </div>
      <button className="card-description-button" onClick={(event) => {
        event.stopPropagation();
        openCard();
      }}>
        <p className="prompt-card-description">{summarizePromptContent(item.latestVersion.content)}</p>
      </button>
      <div className="tags">
        {normalizePromptTags(item.latestVersion.tags).map((tag) => (
          <span className="tag" key={`${item.latestVersion.id}-${tag.label}-${tag.color}`} style={getPromptTagStyle(tag.color)}>
            {tag.label}
          </span>
        ))}
      </div>
      <div className="card-meta">
        <span className="prompt-version">v{item.prompt.latestVersionNumber}</span>
        <span className="prompt-updated">
          <Clock className="icon" />
          <span className="prompt-updated-date">{formatDate(item.prompt.updatedAt)}</span>
        </span>
      </div>
    </article>
  );
}
