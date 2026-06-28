import { Copy, PanelLeft, Search, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../shared/components/Button";
import { IconButton } from "../shared/components/IconButton";
import { Toast } from "../shared/components/Toast";
import "../shared/styles/app.css";
import type { PromptWithLatest, Scene } from "../shared/types";

export function PopupApp({
  scenes,
  selectedSceneId,
  recent,
  matches,
  onSearch,
  onSelectScene,
  onCopy,
  onOpenManager
}: {
  scenes: Scene[];
  selectedSceneId: string | null;
  recent: PromptWithLatest[];
  matches: PromptWithLatest[];
  onSearch: (value: string) => void;
  onSelectScene: (sceneId: string | null) => void;
  onCopy: (promptId: string) => void | Promise<void>;
  onOpenManager: () => void;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const recentItems = recent.slice(0, 2);
  const matchItems = [...matches].sort((a, b) => Number(b.prompt.favorite) - Number(a.prompt.favorite));

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  function showToast(message: string) {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 1000);
  }

  function copyPrompt(promptId: string) {
    void Promise.resolve(onCopy(promptId)).then(() => {
      showToast("复制成功");
    }).catch(() => {
      showToast("复制失败，请重试");
    });
  }

  return (
    <main className="popup">
      <div className="popup-shell">
        <header className="popup-head">
          <div className="popup-brand">
            <img className="popup-logo" src="/icons/fh-pm-logo.png" alt="FH Prompt Manager logo" />
            <span className="popup-brand-name">FH Prompt Manager</span>
          </div>
          <Button className="popup-manager-button" onClick={onOpenManager}><PanelLeft className="icon" />前往管理</Button>
        </header>
        <label className="popup-search">
          <Search className="icon" />
          <input onChange={(event) => onSearch(event.target.value)} placeholder="搜索 Prompt" />
        </label>
        <div className="scene-filters">
          <button className={selectedSceneId === null ? "active" : ""} onClick={() => onSelectScene(null)}>全部</button>
          {scenes.map((scene) => (
            <button
              className={selectedSceneId === scene.id ? "active" : ""}
              key={scene.id}
              onClick={() => onSelectScene(scene.id)}
            >
              {scene.name}
            </button>
          ))}
        </div>
        <PromptList title="最近使用" items={recentItems} onCopy={copyPrompt} />
        <PromptList title="匹配结果" items={matchItems} onCopy={copyPrompt} scroll />
      </div>
      <Toast message={toast} />
    </main>
  );
}

function PromptList({
  title,
  items,
  onCopy,
  scroll = false
}: {
  title: string;
  items: PromptWithLatest[];
  onCopy: (promptId: string) => void;
  scroll?: boolean;
}) {
  const emptyText = title === "最近使用" ? "暂无最近使用" : "暂无匹配结果";

  return (
    <section className={scroll ? "popup-section popup-match-section" : "popup-section"}>
      <h2>{title}</h2>
      <div className={scroll ? "popup-list-scroll" : "popup-list"}>
        {items.length === 0 ? (
          <p className="popup-empty">{emptyText}</p>
        ) : items.map((item) => (
          <article className="popup-result" key={item.prompt.id}>
            <div className="popup-result-content">
              <strong>{item.prompt.title}</strong>
              <p>v{item.prompt.latestVersionNumber} - {item.scene.name}</p>
            </div>
            <div className="popup-result-actions">
              {item.prompt.favorite && (
                <span className="popup-favorite favorite-active" aria-label="已收藏" title="已收藏">
                  <Star className="icon" fill="currentColor" />
                </span>
              )}
              <IconButton label="复制最新版本" icon={<Copy className="icon" />} onClick={() => onCopy(item.prompt.id)} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
