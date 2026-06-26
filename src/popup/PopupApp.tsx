import { Copy, ExternalLink, Search } from "lucide-react";
import { IconButton } from "../shared/components/IconButton";
import "../shared/styles/app.css";
import type { PromptWithLatest, Scene } from "../shared/types";

export function PopupApp({
  scenes,
  recent,
  matches,
  onSearch,
  onCopy,
  onOpenManager
}: {
  scenes: Scene[];
  recent: PromptWithLatest[];
  matches: PromptWithLatest[];
  onSearch: (value: string) => void;
  onCopy: (promptId: string) => void;
  onOpenManager: () => void;
}) {
  return (
    <main className="popup">
      <header className="popup-head">
        <strong>FH Prompt Manager</strong>
        <IconButton label="打开管理页" icon={<ExternalLink className="icon" />} onClick={onOpenManager} />
      </header>
      <label className="popup-search">
        <Search className="icon" />
        <input onChange={(event) => onSearch(event.target.value)} placeholder="搜索 Prompt" />
      </label>
      <div className="scene-filters">
        <button>全部</button>
        {scenes.map((scene) => <button key={scene.id}>{scene.name}</button>)}
      </div>
      <PromptList title="最近使用" items={recent} onCopy={onCopy} />
      <PromptList title="匹配结果" items={matches} onCopy={onCopy} />
    </main>
  );
}

function PromptList({
  title,
  items,
  onCopy
}: {
  title: string;
  items: PromptWithLatest[];
  onCopy: (promptId: string) => void;
}) {
  return (
    <section>
      <h2>{title}</h2>
      {items.map((item) => (
        <article className="popup-result" key={item.prompt.id}>
          <div>
            <strong>{item.prompt.title}</strong>
            <p>v{item.prompt.latestVersionNumber} - {item.scene.name}</p>
          </div>
          <IconButton label="复制最新版本" icon={<Copy className="icon" />} onClick={() => onCopy(item.prompt.id)} />
        </article>
      ))}
    </section>
  );
}
