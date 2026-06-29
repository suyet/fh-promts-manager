import { useEffect, useRef, useState } from "react";
import { TopBar } from "../shared/components/TopBar";
import { Toast } from "../shared/components/Toast";
import { repositories } from "../shared/data/repositories";
import { diffService, type VersionDiff } from "../shared/services/diffService";
import { copyText } from "../shared/services/clipboardService";
import { downloadBlobFile, downloadTextFile } from "../shared/services/downloadService";
import { imageAssetService } from "../shared/services/imageAssetService";
import { importExportService } from "../shared/services/importExportService";
import { promptService } from "../shared/services/promptService";
import "../shared/styles/app.css";
import type { ImportPreview, PromptTag, PromptVersion, PromptWithLatest, Scene, UsageSource } from "../shared/types";
import { SceneFormDialog, type SceneFormInput } from "./components/SceneFormDialog";
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
  const [hasLoadedScenes, setHasLoadedScenes] = useState(false);
  const [items, setItems] = useState<PromptWithLatest[]>([]);
  const [sceneCounts, setSceneCounts] = useState<Record<string, number>>({});
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [diff, setDiff] = useState<VersionDiff | null>(null);
  const [diffHistoryVersionId, setDiffHistoryVersionId] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [sceneFormScene, setSceneFormScene] = useState<Scene | null | undefined>(undefined);
  const [isSortingScenes, setIsSortingScenes] = useState(false);
  const [draftScenes, setDraftScenes] = useState<Scene[]>([]);
  const [isSortingPrompts, setIsSortingPrompts] = useState(false);
  const [draftItems, setDraftItems] = useState<PromptWithLatest[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    void loadScenes().catch(() => undefined);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedScenes) return;
    if (scenes.length === 0) {
      setItems([]);
      return;
    }
    if (scenes.length > 0 && !selectedSceneId) return;
    void refreshItems().catch(() => undefined);
  }, [search, selectedSceneId, scenes.length, hasLoadedScenes]);

  useEffect(() => {
    if (!selectedPromptId) {
      setVersions([]);
      return;
    }
    void repositories.versions.listByPrompt(selectedPromptId).then(setVersions);
  }, [selectedPromptId]);

  const selectedItem = items.find((item) => item.prompt.id === selectedPromptId) ?? null;

  function showToast(message: string) {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 1200);
  }

  function showCopyToast() {
    showToast("复制成功");
  }

  async function loadScenes(preferredSceneId?: string | null) {
    const [loadedScenes, allPrompts] = await Promise.all([
      repositories.scenes.list(),
      repositories.prompts.list()
    ]);
    setSceneCounts(allPrompts.reduce<Record<string, number>>((accumulator, prompt) => {
      accumulator[prompt.sceneId] = (accumulator[prompt.sceneId] ?? 0) + 1;
      return accumulator;
    }, {}));
    setScenes(loadedScenes);
    setSelectedSceneId((current) => {
      if (preferredSceneId !== undefined) return preferredSceneId;
      if (current && loadedScenes.some((scene) => scene.id === current)) return current;
      return loadedScenes[0]?.id || null;
    });
    setHasLoadedScenes(true);
  }

  async function refreshItems(sceneId = selectedSceneId) {
    const [filteredItems, allPrompts] = await Promise.all([
      promptService.searchPrompts({ text: search, sceneId: sceneId || undefined }),
      repositories.prompts.list()
    ]);
    setItems(filteredItems);
    setSceneCounts(allPrompts.reduce<Record<string, number>>((accumulator, prompt) => {
      accumulator[prompt.sceneId] = (accumulator[prompt.sceneId] ?? 0) + 1;
      return accumulator;
    }, {}));
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
      latestContent: latestVersion.content,
      historyImageAssetId: historyVersion.imageAssetId,
      latestImageAssetId: latestVersion.imageAssetId
    }));
    setDiffHistoryVersionId(versionId);
    setView("diff");
  }

  async function copyPrompt(promptId: string, source: UsageSource = "manager") {
    const item = items.find((candidate) => candidate.prompt.id === promptId);
    if (!item) return;
    try {
      await copyText(item.latestVersion.content);
      await promptService.recordUsage(item.prompt.id, item.latestVersion.id, source);
      showCopyToast();
      await refreshItems();
    } catch {
      showToast("复制失败，请重试");
    }
  }

  async function copyVersion(versionId: string, source: UsageSource = "version-history") {
    const version = versions.find((item) => item.id === versionId);
    if (!version || !selectedItem) return;
    try {
      await copyText(version.content);
      await promptService.recordUsage(selectedItem.prompt.id, version.id, source);
      showCopyToast();
      await refreshItems();
    } catch {
      showToast("复制失败，请重试");
    }
  }

  async function togglePromptFavorite(promptId: string) {
    const item = items.find((candidate) => candidate.prompt.id === promptId);
    if (!item) return;
    await promptService.updatePrompt(promptId, {
      title: item.prompt.title,
      favorite: !item.prompt.favorite
    });
    await refreshItems();
  }

  async function createScene(input: SceneFormInput) {
    const timestamp = new Date().toISOString();
    const scene: Scene = {
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description,
      icon: input.icon,
      color: input.color,
      promptType: input.promptType,
      sortOrder: scenes.reduce((maximum, item) => Math.max(maximum, item.sortOrder), 0) + 1,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    await repositories.scenes.put(scene);
    setSceneFormScene(undefined);
    await loadScenes(scene.id);
  }

  async function editScene(sceneId: string, input: SceneFormInput) {
    const scene = scenes.find((item) => item.id === sceneId);
    if (!scene) return;
    await repositories.scenes.put({
      ...scene,
      name: input.name,
      description: input.description,
      icon: input.icon,
      color: input.color,
      promptType: scene.promptType,
      updatedAt: new Date().toISOString()
    });
    setSceneFormScene(undefined);
    await loadScenes(sceneId);
    await refreshItems();
  }

  async function deleteScene(sceneId: string) {
    const scene = scenes.find((item) => item.id === sceneId);
    if (!scene || !window.confirm(`删除场景“${scene.name}”及其 Prompt？`)) return;
    const promptIds = (await repositories.prompts.listByScene(sceneId)).map((prompt) => prompt.id);
    for (const promptId of promptIds) {
      await repositories.prompts.deleteWithVersions(promptId);
    }
    await repositories.scenes.delete(sceneId);
    const nextSceneId = scenes.find((item) => item.id !== sceneId)?.id || null;
    await loadScenes(nextSceneId);
  }

  async function toggleSceneSort() {
    if (!isSortingScenes) {
      setDraftScenes(scenes);
      setIsSortingScenes(true);
      return;
    }
    const timestamp = new Date().toISOString();
    await repositories.scenes.bulkPut(draftScenes.map((scene, index) => ({
      ...scene,
      sortOrder: index + 1,
      updatedAt: timestamp
    })));
    setIsSortingScenes(false);
    setDraftScenes([]);
    await loadScenes(selectedSceneId);
  }

  function reorderDraftScenes(draggedSceneId: string, targetSceneId: string) {
    setDraftScenes((current) => {
      const next = [...current];
      const draggedIndex = next.findIndex((scene) => scene.id === draggedSceneId);
      const targetIndex = next.findIndex((scene) => scene.id === targetSceneId);
      if (draggedIndex < 0 || targetIndex < 0) return current;
      const [dragged] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, dragged);
      return next;
    });
  }

  async function togglePromptSort() {
    if (!isSortingPrompts) {
      setDraftItems(items);
      setIsSortingPrompts(true);
      return;
    }
    await promptService.reorderPrompts(draftItems.map((item) => item.prompt.id));
    setIsSortingPrompts(false);
    setDraftItems([]);
    await refreshItems();
  }

  function reorderDraftPrompts(draggedPromptId: string, targetPromptId: string) {
    setDraftItems((current) => {
      const next = [...current];
      const draggedIndex = next.findIndex((item) => item.prompt.id === draggedPromptId);
      const targetIndex = next.findIndex((item) => item.prompt.id === targetPromptId);
      if (draggedIndex < 0 || targetIndex < 0) return current;
      const [dragged] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, dragged);
      return next;
    });
  }

  async function createPrompt(input: { title: string; description: string; tags: PromptTag[]; content: string; imageFile?: File }) {
    const title = input.title.trim();
    const content = input.content;
    if (!title || !content.trim() || !selectedSceneId) return;
    const selectedScene = scenes.find((scene) => scene.id === selectedSceneId);
    if (selectedScene?.promptType === "image" && !input.imageFile) return;
    try {
      const imageAsset = input.imageFile ? await imageAssetService.createFromFile(input.imageFile) : undefined;
      const prompt = await promptService.createPrompt({
        sceneId: selectedSceneId,
        title,
        description: input.description.trim(),
        tags: input.tags,
        favorite: false,
        content,
        imageAssetId: imageAsset?.id,
        note: "初始版本"
      });
      await refreshItems();
      setSelectedPromptId(prompt.id);
      setVersions(await repositories.versions.listByPrompt(prompt.id));
      setView("detail");
      showToast("已创建 Prompt");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "创建失败，请重试");
    }
  }

  async function exportAll() {
    try {
      const payload = await importExportService.exportZip();
      downloadBlobFile(`fh-prompt-manager-${new Date().toISOString().slice(0, 10)}.zip`, payload);
      showToast("导出完成");
    } catch {
      showToast("导出失败，请重试");
    }
  }

  async function previewImportFile(file: File) {
    setImportError(null);
    setImportPreview(null);
    setImportFile(null);
    try {
      const preview = await importExportService.previewZipImport(file);
      setImportPreview(preview);
      setImportFile(file);
      return preview;
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "导入预览失败");
      throw error;
    }
  }

  async function confirmImport() {
    if (!importFile) return;
    await importExportService.importZip(importFile);
    setImportFile(null);
    setImportPreview(null);
    setImportError(null);
    await loadScenes();
    await refreshItems();
    setView("library");
    showToast("导入完成");
  }

  let page = (
    <LibraryPage
      scenes={isSortingScenes ? draftScenes : scenes}
      selectedSceneId={selectedSceneId}
      isSortingScenes={isSortingScenes}
      sceneCounts={sceneCounts}
      prompts={isSortingPrompts ? draftItems : items}
      isSortingPrompts={isSortingPrompts}
      isPromptSortDisabled={search.trim().length > 0}
      onSelectScene={setSelectedSceneId}
      onOpenPrompt={openPrompt}
      onCopyPrompt={(promptId) => {
        void copyPrompt(promptId);
      }}
      onTogglePromptFavorite={(promptId) => {
        void togglePromptFavorite(promptId);
      }}
      onCreatePrompt={() => {
        setSelectedPromptId(null);
        setView("create");
      }}
      onCreateScene={() => {
        setSceneFormScene(null);
      }}
      onEditScene={(sceneId) => {
        setSceneFormScene(scenes.find((scene) => scene.id === sceneId) ?? undefined);
      }}
      onDeleteScene={(sceneId) => {
        void deleteScene(sceneId);
      }}
      onToggleSceneSort={() => {
        void toggleSceneSort();
      }}
      onReorderScene={reorderDraftScenes}
      onTogglePromptSort={() => {
        void togglePromptSort();
      }}
      onReorderPrompt={reorderDraftPrompts}
    />
  );

  if (view === "detail" && selectedItem) {
    page = (
      <PromptDetailPage
        item={selectedItem}
        availableScenes={scenes}
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
          void (async () => {
            try {
              const imageAsset = content.imageFile ? await imageAssetService.createFromFile(content.imageFile) : undefined;
              await promptService.saveNewVersion(selectedItem.prompt.id, {
                ...content,
                imageAssetId: imageAsset?.id,
                note: "手动保存"
              });
              void refreshItems();
              void repositories.versions.listByPrompt(selectedItem.prompt.id).then(setVersions);
              showToast("已保存新版本");
            } catch (error) {
              showToast(error instanceof Error ? error.message : "保存失败，请重试");
            }
          })();
        }}
        onSaveMetadata={(input) => {
          void promptService.updatePrompt(selectedItem.prompt.id, input).then(async (updated) => {
            if (updated.sceneId !== selectedItem.prompt.sceneId) {
              setSelectedSceneId(updated.sceneId);
            }
            await refreshItems(updated.sceneId);
          });
        }}
        onSaveLatestVersionMetadata={(input) => {
          void promptService.updateLatestVersionMetadata(selectedItem.prompt.id, input).then(async () => {
            await refreshItems();
            setVersions(await repositories.versions.listByPrompt(selectedItem.prompt.id));
          });
        }}
        onToggleFavorite={() => {
          void promptService.updatePrompt(selectedItem.prompt.id, {
            title: selectedItem.prompt.title,
            favorite: !selectedItem.prompt.favorite
          }).then(() => refreshItems());
        }}
        onCopyEditor={(content) => {
          void copyText(content).then(showCopyToast).catch(() => showToast("复制失败，请重试"));
        }}
        onDownloadEditor={(content) => {
          downloadTextFile(`${selectedItem.prompt.title}.md`, content, "text/markdown;charset=utf-8");
        }}
        onCompareToLatest={compareToLatest}
        onCopyVersion={(versionId) => {
          void copyVersion(versionId);
        }}
      />
    );
  } else if (view === "create") {
    page = (
      <NewPromptPage
        scene={scenes.find((scene) => scene.id === selectedSceneId) ?? null}
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
          if (value.trim() && isSortingPrompts) {
            setIsSortingPrompts(false);
            setDraftItems([]);
          }
          setSearch(value);
          setView("library");
        }}
        onImport={() => setView("import")}
        onExport={() => {
          void exportAll();
        }}
      />
      {sceneFormScene !== undefined && (
        <SceneFormDialog
          key={sceneFormScene?.id ?? "new-scene"}
          scene={sceneFormScene}
          onCancel={() => setSceneFormScene(undefined)}
          onSave={(input) => {
            if (sceneFormScene) {
              void editScene(sceneFormScene.id, input);
            } else {
              void createScene(input);
            }
          }}
        />
      )}
      {page}
      <Toast message={toast} />
    </>
  );
}
