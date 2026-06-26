import { BarChart3, Briefcase, Code2, Image, PenLine } from "lucide-react";
import { SCENE_COLORS } from "../constants";
import type { Scene, SceneIcon } from "../types";

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
  onSelect
}: {
  scenes: Scene[];
  activeSceneId: string | null;
  counts: Record<string, number>;
  onSelect: (sceneId: string) => void;
}) {
  return (
    <div className="scene-list">
      {scenes.map((scene) => {
        const SceneIcon = iconByName[scene.icon];
        return (
          <button
            className={activeSceneId === scene.id ? "scene-item active" : "scene-item"}
            key={scene.id}
            onClick={() => onSelect(scene.id)}
          >
            <span className="scene-icon" style={{ backgroundColor: SCENE_COLORS[scene.color] }}>
              <SceneIcon className="icon" />
            </span>
            <span>
              <span className="scene-title">{scene.name}</span>
              <span className="scene-desc">{scene.description}</span>
            </span>
            <strong>{counts[scene.id] ?? 0}</strong>
          </button>
        );
      })}
    </div>
  );
}
