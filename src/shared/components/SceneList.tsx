import {
  ArrowUpDown,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  Check,
  Code2,
  Database,
  FileText,
  FlaskConical,
  Globe2,
  GripVertical,
  Image,
  Lightbulb,
  MessageSquare,
  MoreVertical,
  PenLine,
  Plus,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target
} from "lucide-react";
import { useState } from "react";
import { SCENE_COLORS } from "../constants";
import type { Scene, SceneIcon } from "../types";
import { IconButton } from "./IconButton";

const iconByName: Record<SceneIcon, typeof Code2> = {
  bot: Bot,
  brain: Brain,
  book: BookOpen,
  briefcase: Briefcase,
  chart: BarChart3,
  code: Code2,
  database: Database,
  file: FileText,
  flask: FlaskConical,
  globe: Globe2,
  image: Image,
  lightbulb: Lightbulb,
  message: MessageSquare,
  pen: PenLine,
  rocket: Rocket,
  search: Search,
  settings: Settings,
  shield: ShieldCheck,
  sparkles: Sparkles,
  target: Target
};

export function SceneList({
  scenes,
  activeSceneId,
  counts,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
  isSorting,
  onToggleSort,
  onReorder
}: {
  scenes: Scene[];
  activeSceneId: string | null;
  counts: Record<string, number>;
  onSelect: (sceneId: string) => void;
  onCreate: () => void;
  onEdit: (sceneId: string) => void;
  onDelete: (sceneId: string) => void;
  isSorting?: boolean;
  onToggleSort: () => void;
  onReorder: (draggedSceneId: string, targetSceneId: string) => void;
}) {
  const [openMenuSceneId, setOpenMenuSceneId] = useState<string | null>(null);
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null);

  return (
    <>
      <div className="side-head">
        <div className="section-title scene-section-title">场景</div>
        <div className="side-actions">
          <IconButton
            className="bare-icon-btn"
            label={isSorting ? "保存场景排序" : "调整场景排序"}
            icon={isSorting ? <Check className="icon" /> : <ArrowUpDown className="icon" />}
            onClick={onToggleSort}
          />
          <IconButton className="bare-icon-btn" label="新建场景" icon={<Plus className="icon" />} onClick={onCreate} />
        </div>
      </div>
      {isSorting && <div className="sort-hint">拖动场景卡片调整顺序</div>}
      {scenes.length === 0 ? (
        <div className="empty-state side-empty">
          <strong className="empty-title">暂无场景</strong>
          <p className="empty-copy">先新建一个场景，再沉淀 Prompt 资产。</p>
        </div>
      ) : (
        <div className={isSorting ? "scene-list sorting-list" : "scene-list"}>
          {scenes.map((scene) => {
            const SceneIcon = iconByName[scene.icon];
            const promptCount = counts[scene.id] ?? 0;
            const promptTypeLabel = scene.promptType === "image" ? "生图" : "文本";
            return (
              <div
                className={[
                  activeSceneId === scene.id ? "scene-item active" : "scene-item",
                  isSorting ? "sorting" : ""
                ].filter(Boolean).join(" ")}
                data-testid={`scene-card-${scene.id}`}
                draggable={isSorting}
                key={scene.id}
                onDragStart={() => setDraggedSceneId(scene.id)}
                onDragOver={(event) => {
                  if (isSorting) event.preventDefault();
                }}
                onDrop={() => {
                  if (draggedSceneId && draggedSceneId !== scene.id) onReorder(draggedSceneId, scene.id);
                  setDraggedSceneId(null);
                }}
              >
                <button className={isSorting ? "scene-select sorting" : "scene-select"} onClick={() => {
                  if (!isSorting) onSelect(scene.id);
                }}>
                  {isSorting && <span className="sorting-grip"><GripVertical className="icon" /></span>}
                  <span className="scene-icon" style={{ backgroundColor: SCENE_COLORS[scene.color] }}>
                    <SceneIcon className="icon" />
                  </span>
                  <span className="scene-meta">
                    <span className="scene-title">{scene.name}</span>
                    <span className="scene-count-line">
                      <span className="scene-type-pill">{promptTypeLabel}</span>
                      <span>{promptCount} 个提示词</span>
                    </span>
                  </span>
                </button>
                <button className="scene-desc-button" onClick={() => {
                  if (!isSorting) onSelect(scene.id);
                }}>
                  <span className="scene-desc">{scene.description}</span>
                </button>
                {!isSorting && (
                  <div className="scene-actions hover-only">
                    <IconButton
                      className="bare-icon-btn"
                      label={`更多操作：${scene.name}`}
                      icon={<MoreVertical className="icon" />}
                      onClick={() => setOpenMenuSceneId(openMenuSceneId === scene.id ? null : scene.id)}
                    />
                    {openMenuSceneId === scene.id && (
                      <div className="scene-menu" role="menu">
                        <button role="menuitem" onClick={() => { setOpenMenuSceneId(null); onEdit(scene.id); }}>编辑</button>
                        <button role="menuitem" onClick={() => { setOpenMenuSceneId(null); onDelete(scene.id); }}>删除</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
