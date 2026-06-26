import { useEffect, useState } from "react";
import { TopBar } from "../shared/components/TopBar";
import { db } from "../shared/data/db";
import { repositories } from "../shared/data/repositories";
import { diffService, type VersionDiff } from "../shared/services/diffService";
import { copyText } from "../shared/services/clipboardService";
import { promptService } from "../shared/services/promptService";
import "../shared/styles/app.css";
import type { ImportPreview, PromptVersion, PromptWithLatest, Scene } from "../shared/types";
import { DiffPage } from "./pages/DiffPage";
import { ImportPage } from "./pages/ImportPage";
import { LibraryPage } from "./pages/LibraryPage";
import { NewPromptPage } from "./pages/NewPromptPage";
import { PromptDetailPage } from "./pages/PromptDetailPage";
import type { ManagerView } from "./routes";

export function ManagerApp() {
  const [view, setView] = useState<ManagerView>("library");
  const [search, setSearch] = useState("");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [items, setItems] = useState<PromptWithLatest[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [diff, setDiff] = useState<VersionDiff | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);

  useEffect(() => {
    void loadScenes();
  }, []);

  useEffect(() => {
    void promptService.searchPrompts({ text: search, sceneId: selectedSceneId || undefined }).then(setItems);
  }, [search, selectedSceneId]);

  useEffect(() => {
    if (!selectedPromptId) {
      setVersions([]);
      return;
    }
    void repositories.versions.listByPrompt(selectedPromptId).then(setVersions);
  }, [selectedPromptId]);

  const selectedItem = items.find((item) => item.prompt.id === selectedPromptId) ?? null;

  async function loadScenes(preferredSceneId?: string | null) {
    const loadedScenes = await repositories.scenes.list();
    setScenes(loadedScenes);
    setSelectedSceneId((current) => {
      if (preferredSceneId !== undefined) return preferredSceneId;
      if (current && loadedScenes.some((scene) => scene.id === current)) return current;
      return loadedScenes[0]?.id || null;
    });
  }

  function openPrompt(promptId: string) {
    setSelectedPromptId(promptId);
    setView("detail");
  }

  function compareToLatest(versionId: string) {
    const historyVersion = versions.find((version) => version.id === versionId);
    const latestVersion = selectedItem?.latestVersion;
    if (!historyVersion || !latestVersion) return;
    setDiff(diffService.compareHistoryToLatest({
      historyLabel: `v${historyVersion.versionNumber}`,
      latestLabel: `v${latestVersion.versionNumber} Latest`,
      historyContent: historyVersion.content,
      latestContent: latestVersion.content
    }));
    setView("diff");
  }

  async function copyPrompt(promptId: string, source: "manager" | "diff" = "manager") {
    const item = items.find((candidate) => candidate.prompt.id === promptId);
    if (!item) return;
    await copyText(item.latestVersion.content);
    await promptService.recordUsage(item.prompt.id, item.latestVersion.id, source);
    await promptService.searchPrompts({ text: search, sceneId: selectedSceneId || undefined }).then(setItems);
  }

  async function createScene() {
    const name = window.prompt("场景名称");
    if (!name?.trim()) return;
    const description = window.prompt("场景摘要", "") ?? "";
    const timestamp = new Date().toISOString();
    const scene: Scene = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      icon: "briefcase",
      color: "teal",
      sortOrder: scenes.reduce((maximum, item) => Math.max(maximum, item.sortOrder), 0) + 1,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    await repositories.scenes.put(scene);
    await loadScenes(scene.id);
  }

  async function editScene(sceneId: string) {
    const scene = scenes.find((item) => item.id === sceneId);
    if (!scene) return;
    const name = window.prompt("场景名称", scene.name);
    if (!name?.trim()) return;
    const description = window.prompt("场景摘要", scene.description) ?? scene.description;
    await repositories.scenes.put({
      ...scene,
      name: name.trim(),
      description: description.trim(),
      updatedAt: new Date().toISOString()
    });
    await loadScenes(sceneId);
    await promptService.searchPrompts({ text: search, sceneId: selectedSceneId || undefined }).then(setItems);
  }

  async function deleteScene(sceneId: string) {
    const scene = scenes.find((item) => item.id === sceneId);
    if (!scene || !window.confirm(`删除场景“${scene.name}”及其 Prompt？`)) return;
    const promptIds = (await repositories.prompts.listByScene(sceneId)).map((prompt) => prompt.id);
    await db.transaction("rw", db.scenes, db.prompts, db.versions, db.usageRecords, async () => {
      for (const promptId of promptIds) {
        await db.prompts.delete(promptId);
        await db.versions.where("promptId").equals(promptId).delete();
        await db.usageRecords.where("promptId").equals(promptId).delete();
      }
      await db.scenes.delete(sceneId);
    });
    const nextSceneId = scenes.find((item) => item.id !== sceneId)?.id || null;
    await loadScenes(nextSceneId);
  }

  async function createPrompt(input: { title: string; content: string }) {
    const title = input.title.trim();
    const content = input.content;
    if (!title || !content.trim() || !selectedSceneId) return;
    const prompt = await promptService.createPrompt({
      sceneId: selectedSceneId,
      title,
      description: "",
      tags: [],
      favorite: false,
      content,
      note: "初始版本"
    });
    await promptService.searchPrompts({ text: search, sceneId: selectedSceneId }).then(setItems);
    setSelectedPromptId(prompt.id);
    setVersions(await repositories.versions.listByPrompt(prompt.id));
    setView("detail");
  }

  let page = (
    <LibraryPage
      scenes={scenes}
      selectedSceneId={selectedSceneId}
      prompts={items}
      onSelectScene={setSelectedSceneId}
      onOpenPrompt={openPrompt}
      onCopyPrompt={(promptId) => {
        void copyPrompt(promptId);
      }}
      onCreatePrompt={() => {
        setSelectedPromptId(null);
        setView("create");
      }}
      onCreateScene={() => {
        void createScene();
      }}
      onEditScene={(sceneId) => {
        void editScene(sceneId);
      }}
      onDeleteScene={(sceneId) => {
        void deleteScene(sceneId);
      }}
    />
  );

  if (view === "detail" && selectedItem) {
    page = (
      <PromptDetailPage
        item={selectedItem}
        versions={versions}
        onBack={() => setView("library")}
        onCopyLatest={() => {
          void copyPrompt(selectedItem.prompt.id);
        }}
        onDelete={() => undefined}
        onSaveVersion={(content) => {
          void promptService.saveNewVersion(selectedItem.prompt.id, { content, note: "手动保存" }).then(() => {
            void promptService.searchPrompts({ text: search, sceneId: selectedSceneId || undefined }).then(setItems);
            void repositories.versions.listByPrompt(selectedItem.prompt.id).then(setVersions);
          });
        }}
        onCompareToLatest={compareToLatest}
      />
    );
  } else if (view === "create") {
    page = (
      <NewPromptPage
        onBack={() => setView("library")}
        onSave={(input) => {
          void createPrompt(input);
        }}
      />
    );
  } else if (view === "diff" && diff) {
    page = (
      <DiffPage
        diff={diff}
        onBack={() => setView("detail")}
        onCopyHistory={() => undefined}
        onCopyLatest={() => {
          if (selectedItem) void copyPrompt(selectedItem.prompt.id, "diff");
        }}
      />
    );
  } else if (view === "import") {
    page = (
      <ImportPage
        preview={importPreview}
        onCancel={() => setView("library")}
        onConfirm={() => setImportPreview(null)}
      />
    );
  }

  return (
    <>
      <TopBar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setView("library");
        }}
        onImport={() => setView("import")}
        onExport={() => undefined}
      />
      {page}
    </>
  );
}
