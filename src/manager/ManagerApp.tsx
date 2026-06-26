import { useEffect, useMemo, useState } from "react";
import { TopBar } from "../shared/components/TopBar";
import { repositories } from "../shared/data/repositories";
import { diffService, type VersionDiff } from "../shared/services/diffService";
import { copyText } from "../shared/services/clipboardService";
import { promptService } from "../shared/services/promptService";
import "../shared/styles/app.css";
import type { ImportPreview, PromptVersion, PromptWithLatest, Scene } from "../shared/types";
import { DiffPage } from "./pages/DiffPage";
import { ImportPage } from "./pages/ImportPage";
import { LibraryPage } from "./pages/LibraryPage";
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
    void repositories.scenes.list().then((loadedScenes) => {
      setScenes(loadedScenes);
      setSelectedSceneId(loadedScenes[0]?.id || null);
    });
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

  const activeView = useMemo(() => view, [view]);
  const selectedItem = items.find((item) => item.prompt.id === selectedPromptId) ?? null;

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
      onCreatePrompt={() => setView("detail")}
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
        activeView={activeView}
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setView("library");
        }}
        onNavigate={setView}
        onImport={() => setView("import")}
        onExport={() => undefined}
      />
      {page}
    </>
  );
}
