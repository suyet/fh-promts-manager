import { ArrowUpDown, Check, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../shared/components/Button";
import { PromptCard } from "../../shared/components/PromptCard";
import { SceneList } from "../../shared/components/SceneList";
import type { PromptWithLatest, Scene } from "../../shared/types";

export function LibraryPage({
  scenes,
  selectedSceneId,
  sceneCounts,
  prompts,
  onSelectScene,
  onOpenPrompt,
  onCopyPrompt,
  onTogglePromptFavorite,
  onCreatePrompt,
  onCreateScene,
  onEditScene,
  onDeleteScene,
  isSortingScenes = false,
  onToggleSceneSort,
  onReorderScene,
  isSortingPrompts = false,
  isPromptSortDisabled = false,
  onTogglePromptSort = () => undefined,
  onReorderPrompt = () => undefined
}: {
  scenes: Scene[];
  selectedSceneId: string | null;
  isSortingScenes?: boolean;
  sceneCounts?: Record<string, number>;
  prompts: PromptWithLatest[];
  onSelectScene: (sceneId: string) => void;
  onOpenPrompt: (promptId: string) => void;
  onCopyPrompt: (promptId: string) => void;
  onTogglePromptFavorite: (promptId: string) => void;
  onCreatePrompt: () => void;
  onCreateScene: () => void;
  onEditScene: (sceneId: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onToggleSceneSort: () => void;
  onReorderScene: (draggedSceneId: string, targetSceneId: string) => void;
  isSortingPrompts?: boolean;
  isPromptSortDisabled?: boolean;
  onTogglePromptSort?: () => void;
  onReorderPrompt?: (draggedPromptId: string, targetPromptId: string) => void;
}) {
  const [draggedPromptId, setDraggedPromptId] = useState<string | null>(null);
  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId) || scenes[0];
  const selectedSceneTypeLabel = selectedScene?.promptType === "image" ? "生图" : "文本";
  const canSortPrompts = prompts.length > 1;
  const counts = useMemo(() => {
    if (sceneCounts) return sceneCounts;
    return prompts.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.prompt.sceneId] = (accumulator[item.prompt.sceneId] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [prompts, sceneCounts]);

  return (
    <main className="main">
      <div className="layout">
        <aside className="side-panel">
          <SceneList
            scenes={scenes}
            activeSceneId={selectedScene?.id || null}
            counts={counts}
            onSelect={onSelectScene}
            onCreate={onCreateScene}
            onEdit={onEditScene}
            onDelete={onDeleteScene}
            isSorting={isSortingScenes}
            onToggleSort={onToggleSceneSort}
            onReorder={onReorderScene}
          />
        </aside>
        <section className="workbench">
          <div className="page-head">
            <div>
              <div className="page-title-line">
                <h1>{selectedScene ? selectedScene.name : "资产库"}</h1>
                {selectedScene && <span className="scene-type-pill">{selectedSceneTypeLabel}</span>}
              </div>
              <p>{prompts.length} 个 Prompt</p>
            </div>
            <div className="page-actions">
              <Button disabled={!canSortPrompts || (isPromptSortDisabled && !isSortingPrompts)} onClick={onTogglePromptSort}>
                {isSortingPrompts ? <Check className="icon" /> : <ArrowUpDown className="icon" />}
                {isSortingPrompts ? "保存排序" : "排序"}
              </Button>
              <Button variant="primary" disabled={!selectedScene} onClick={onCreatePrompt}><Plus className="icon" />新建</Button>
            </div>
          </div>
          {isSortingPrompts && <div className="sort-hint prompt-sort-hint">拖动 Prompt 卡片调整顺序</div>}
          {prompts.length === 0 ? (
            <div className="empty-state prompt-empty">
              <strong className="empty-title">{selectedScene ? "当前场景还没有 Prompt" : "暂无 Prompt"}</strong>
              <p className="empty-copy">新建 Prompt 后会显示在这里。</p>
            </div>
          ) : (
            <div className="prompt-grid">
              {prompts.map((item) => (
                <PromptCard
                  key={item.prompt.id}
                  item={item}
                  onOpen={() => onOpenPrompt(item.prompt.id)}
                  onCopy={() => onCopyPrompt(item.prompt.id)}
                  onToggleFavorite={() => onTogglePromptFavorite(item.prompt.id)}
                  isSorting={isSortingPrompts}
                  onDragStart={() => setDraggedPromptId(item.prompt.id)}
                  onDrop={() => {
                    if (draggedPromptId && draggedPromptId !== item.prompt.id) onReorderPrompt(draggedPromptId, item.prompt.id);
                    setDraggedPromptId(null);
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
