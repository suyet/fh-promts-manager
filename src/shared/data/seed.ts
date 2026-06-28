import { repositories } from "./repositories";
import { promptService } from "../services/promptService";

export async function seedIfEmpty() {
  const scenes = await repositories.scenes.list();
  if (scenes.length > 0) return;
  const timestamp = new Date().toISOString();
  const scene = {
    id: "scene-code",
    name: "代码重构",
    description: "工程质量与 review",
    icon: "code" as const,
    color: "blue" as const,
    promptType: "text" as const,
    sortOrder: 1,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  await repositories.scenes.put(scene);
  await promptService.createPrompt({
    sceneId: scene.id,
    title: "Code Refactor Helper",
    description: "不改变行为的前提下重构代码，并提示风险。",
    tags: ["review", "cleanup"],
    favorite: true,
    content: "请重构下面的代码，目标是提升可读性和可维护性。",
    note: "初始版本"
  });
}
