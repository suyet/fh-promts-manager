import { Copy, Star } from "lucide-react";
import type { PromptWithLatest } from "../types";
import { IconButton } from "./IconButton";

export function PromptCard({
  item,
  onOpen,
  onCopy,
  onToggleFavorite
}: {
  item: PromptWithLatest;
  onOpen: () => void;
  onCopy: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <article className="prompt-card">
      <div className="card-top">
        <button className="card-main" onClick={onOpen}>
          <h2>{item.prompt.title}</h2>
          <p>{item.prompt.description}</p>
        </button>
        <div className="card-icon-actions">
          <IconButton label="收藏" icon={<Star className="icon" />} onClick={onToggleFavorite} />
          <IconButton label="复制最新版本" icon={<Copy className="icon" />} onClick={onCopy} />
        </div>
      </div>
      <div className="tags">
        {item.prompt.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
      </div>
      <div className="card-meta">
        <span>v{item.prompt.latestVersionNumber}</span>
        <span>场景：{item.scene.name}</span>
      </div>
    </article>
  );
}
