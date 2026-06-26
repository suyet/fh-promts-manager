import { ArrowUpDown, Plus } from "lucide-react";
import { useMemo } from "react";
import { Button } from "../../shared/components/Button";
import { PromptCard } from "../../shared/components/PromptCard";
import { SceneList } from "../../shared/components/SceneList";
import type { PromptWithLatest, Scene } from "../../shared/types";

export function LibraryPage({
  scenes,
  selectedSceneId,
  prompts,
  onSelectScene,
  onOpenPrompt,
  onCopyPrompt,
  onCreatePrompt,
  onCreateScene,
  onEditScene,
  onDeleteScene
}: {
  scenes: Scene[];
  selectedSceneId: string | null;
  prompts: PromptWithLatest[];
  onSelectScene: (sceneId: string) => void;
  onOpenPrompt: (promptId: string) => void;
  onCopyPrompt: (promptId: string) => void;
  onCreatePrompt: () => void;
  onCreateScene: () => void;
  onEditScene: (sceneId: string) => void;
  onDeleteScene: (sceneId: string) => void;
}) {
  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId) || scenes[0];
  const counts = useMemo(() => {
    return prompts.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.prompt.sceneId] = (accumulator[item.prompt.sceneId] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [prompts]);

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
          />
        </aside>
        <section className="workbench">
          <div className="page-head">
            <div>
              <h1>{selectedScene ? selectedScene.name : "资产库"}</h1>
              <p>{prompts.length} 个 Prompt</p>
            </div>
            <div className="page-actions">
              <Button><ArrowUpDown className="icon" />排序</Button>
              <Button variant="primary" onClick={onCreatePrompt}><Plus className="icon" />新建</Button>
            </div>
          </div>
          <div className="prompt-grid">
            {prompts.map((item) => (
              <PromptCard
                key={item.prompt.id}
                item={item}
                onOpen={() => onOpenPrompt(item.prompt.id)}
                onCopy={() => onCopyPrompt(item.prompt.id)}
                onToggleFavorite={() => undefined}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
