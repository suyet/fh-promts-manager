import { BarChart3, Briefcase, Code2, Image, PenLine, Pencil, Plus, Trash2 } from "lucide-react";
import { SCENE_COLORS } from "../constants";
import type { Scene, SceneIcon } from "../types";
import { IconButton } from "./IconButton";

const iconByName: Record<SceneIcon, typeof Code2> = {
  code: Code2,
  pen: PenLine,
  chart: BarChart3,
  image: Image,
  briefcase: Briefcase
};

export function SceneList({
  scenes,
  activeSceneId,
  counts,
  onSelect,
  onCreate,
  onEdit,
  onDelete
}: {
  scenes: Scene[];
  activeSceneId: string | null;
  counts: Record<string, number>;
  onSelect: (sceneId: string) => void;
  onCreate: () => void;
  onEdit: (sceneId: string) => void;
  onDelete: (sceneId: string) => void;
}) {
  return (
    <>
      <div className="side-head">
        <div className="section-title">场景</div>
        <IconButton label="新建场景" icon={<Plus className="icon" />} onClick={onCreate} />
      </div>
      <div className="scene-list">
        {scenes.map((scene) => {
          const SceneIcon = iconByName[scene.icon];
          return (
            <div className={activeSceneId === scene.id ? "scene-item active" : "scene-item"} key={scene.id}>
              <button className="scene-select" onClick={() => onSelect(scene.id)}>
                <span className="scene-icon" style={{ backgroundColor: SCENE_COLORS[scene.color] }}>
                  <SceneIcon className="icon" />
                </span>
                <span className="scene-meta">
                  <span className="scene-title">{scene.name}</span>
                  <span className="scene-desc">{scene.description}</span>
                </span>
                <strong className="count-badge">{counts[scene.id] ?? 0}</strong>
              </button>
              <div className="scene-actions">
                <IconButton label={`编辑场景：${scene.name}`} icon={<Pencil className="icon" />} onClick={() => onEdit(scene.id)} />
                <IconButton label={`删除场景：${scene.name}`} icon={<Trash2 className="icon" />} onClick={() => onDelete(scene.id)} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
