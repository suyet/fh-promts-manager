import { useEffect, useState } from "react";
import { TopBar } from "../shared/components/TopBar";
import { SCENE_COLORS, SCENE_ICONS } from "../shared/constants";
import { db } from "../shared/data/db";
import { repositories } from "../shared/data/repositories";
import { diffService, type VersionDiff } from "../shared/services/diffService";
import { copyText } from "../shared/services/clipboardService";
import { downloadJsonFile, downloadTextFile } from "../shared/services/downloadService";
import { importExportService } from "../shared/services/importExportService";
import { promptService } from "../shared/services/promptService";
import "../shared/styles/app.css";
import type { ExportPayload, ImportPreview, PromptVersion, PromptWithLatest, Scene, SceneColor, SceneIcon, UsageSource } from "../shared/types";
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
  const [diffHistoryVersionId, setDiffHistoryVersionId] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importPayload, setImportPayload] = useState<ExportPayload | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    void loadScenes();
  }, []);

  useEffect(() => {
    void refreshItems();
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

  async function refreshItems() {
    await promptService.searchPrompts({ text: search, sceneId: selectedSceneId || undefined }).then(setItems);
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
    setDiffHistoryVersionId(versionId);
    setView("diff");
  }

  async function copyPrompt(promptId: string, source: UsageSource = "manager") {
    const item = items.find((candidate) => candidate.prompt.id === promptId);
    if (!item) return;
    await copyText(item.latestVersion.content);
    await promptService.recordUsage(item.prompt.id, item.latestVersion.id, source);
    await refreshItems();
  }

  async function copyVersion(versionId: string, source: UsageSource = "version-history") {
    const version = versions.find((item) => item.id === versionId);
    if (!version || !selectedItem) return;
    await copyText(version.content);
    await promptService.recordUsage(selectedItem.prompt.id, version.id, source);
    await refreshItems();
  }

  async function createScene() {
    const name = window.prompt("场景名称");
    if (!name?.trim()) return;
    const description = window.prompt("场景摘要", "") ?? "";
    const icon = parseSceneIcon(window.prompt("场景图标：code / pen / chart / image / briefcase", "briefcase"));
    const color = parseSceneColor(window.prompt("场景颜色：blue / teal / violet / pink / amber", "teal"));
    const timestamp = new Date().toISOString();
    const scene: Scene = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
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
    const icon = parseSceneIcon(window.prompt("场景图标：code / pen / chart / image / briefcase", scene.icon), scene.icon);
    const color = parseSceneColor(window.prompt("场景颜色：blue / teal / violet / pink / amber", scene.color), scene.color);
    await repositories.scenes.put({
      ...scene,
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
      updatedAt: new Date().toISOString()
    });
    await loadScenes(sceneId);
    await refreshItems();
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

  async function moveScene(sceneId: string, direction: "up" | "down") {
    const sortedScenes = [...scenes].sort((a, b) => a.sortOrder - b.sortOrder);
    const currentIndex = sortedScenes.findIndex((scene) => scene.id === sceneId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sortedScenes.length) return;
    const current = sortedScenes[currentIndex];
    const target = sortedScenes[targetIndex];
    await repositories.scenes.put({ ...current, sortOrder: target.sortOrder, updatedAt: new Date().toISOString() });
    await repositories.scenes.put({ ...target, sortOrder: current.sortOrder, updatedAt: new Date().toISOString() });
    await loadScenes(sceneId);
  }

  function parseSceneIcon(value: string | null, fallback: SceneIcon = "briefcase"): SceneIcon {
    return SCENE_ICONS.includes(value as SceneIcon) ? value as SceneIcon : fallback;
  }

  function parseSceneColor(value: string | null, fallback: SceneColor = "teal"): SceneColor {
    return Object.keys(SCENE_COLORS).includes(value || "") ? value as SceneColor : fallback;
  }

  async function createPrompt(input: { title: string; description: string; tags: string[]; content: string }) {
    const title = input.title.trim();
    const content = input.content;
    if (!title || !content.trim() || !selectedSceneId) return;
    const prompt = await promptService.createPrompt({
      sceneId: selectedSceneId,
      title,
      description: input.description.trim(),
      tags: input.tags,
      favorite: false,
      content,
      note: "初始版本"
    });
    await promptService.searchPrompts({ text: search, sceneId: selectedSceneId }).then(setItems);
    setSelectedPromptId(prompt.id);
    setVersions(await repositories.versions.listByPrompt(prompt.id));
    setView("detail");
  }

  async function exportAll() {
    const payload = await importExportService.exportAll();
    downloadJsonFile(`fh-prompt-manager-${new Date().toISOString().slice(0, 10)}.json`, payload);
  }

  function isExportPayload(value: unknown): value is ExportPayload {
    if (!value || typeof value !== "object") return false;
    const candidate = value as Partial<ExportPayload>;
    return candidate.schemaVersion === 1
      && Array.isArray(candidate.scenes)
      && Array.isArray(candidate.prompts)
      && Array.isArray(candidate.versions)
      && Array.isArray(candidate.usageRecords);
  }

  async function previewImportFile(file: File) {
    setImportError(null);
    setImportPreview(null);
    setImportPayload(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setImportError("文件格式错误");
      throw new Error("Invalid JSON.");
    }
    if (!isExportPayload(parsed)) {
      setImportError("导入文件版本不支持");
      throw new Error("Unsupported import payload.");
    }
    try {
      const preview = await importExportService.previewImport(parsed);
      setImportPreview(preview);
      setImportPayload(parsed);
      return preview;
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "导入预览失败");
      throw error;
    }
  }

  async function confirmImport() {
    if (!importPayload) return;
    await importExportService.importAll(importPayload);
    setImportPayload(null);
    setImportPreview(null);
    setImportError(null);
    await loadScenes();
    await refreshItems();
    setView("library");
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
      onMoveScene={(sceneId, direction) => {
        void moveScene(sceneId, direction);
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
        onDelete={() => {
          if (!window.confirm(`删除 Prompt“${selectedItem.prompt.title}”及其所有版本？`)) return;
          void promptService.deletePrompt(selectedItem.prompt.id).then(async () => {
            setSelectedPromptId(null);
            setVersions([]);
            await refreshItems();
            setView("library");
          });
        }}
        onSaveVersion={(content) => {
          void promptService.saveNewVersion(selectedItem.prompt.id, { content, note: "手动保存" }).then(() => {
            void refreshItems();
            void repositories.versions.listByPrompt(selectedItem.prompt.id).then(setVersions);
          });
        }}
        onSaveMetadata={(input) => {
          void promptService.updatePrompt(selectedItem.prompt.id, {
            ...input,
            favorite: selectedItem.prompt.favorite
          }).then(refreshItems);
        }}
        onToggleFavorite={() => {
          void promptService.updatePrompt(selectedItem.prompt.id, {
            title: selectedItem.prompt.title,
            description: selectedItem.prompt.description,
            tags: selectedItem.prompt.tags,
            favorite: !selectedItem.prompt.favorite
          }).then(refreshItems);
        }}
        onCopyVersion={(versionId) => {
          void copyVersion(versionId);
        }}
        onCopyEditor={(content) => {
          void copyText(content);
        }}
        onDownloadEditor={(content) => {
          downloadTextFile(`${selectedItem.prompt.title}.md`, content, "text/markdown;charset=utf-8");
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
        onCopyHistory={() => {
          if (diffHistoryVersionId) void copyVersion(diffHistoryVersionId, "diff");
        }}
        onCopyLatest={() => {
          if (selectedItem) void copyPrompt(selectedItem.prompt.id, "diff");
        }}
      />
    );
  } else if (view === "import") {
    page = (
      <ImportPage
        preview={importPreview}
        error={importError}
        onPreviewFile={previewImportFile}
        onCancel={() => setView("library")}
        onConfirm={() => {
          void confirmImport();
        }}
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
        onExport={() => {
          void exportAll();
        }}
      />
      {page}
    </>
  );
}
