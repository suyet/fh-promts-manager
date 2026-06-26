import { useEffect, useMemo, useState } from "react";
import { TopBar } from "../shared/components/TopBar";
import { repositories } from "../shared/data/repositories";
import { promptService } from "../shared/services/promptService";
import "../shared/styles/app.css";
import type { PromptWithLatest, Scene } from "../shared/types";
import { LibraryPage } from "./pages/LibraryPage";
import type { ManagerView } from "./routes";

export function ManagerApp() {
  const [view, setView] = useState<ManagerView>("library");
  const [search, setSearch] = useState("");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [items, setItems] = useState<PromptWithLatest[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  useEffect(() => {
    void repositories.scenes.list().then((loadedScenes) => {
      setScenes(loadedScenes);
      setSelectedSceneId(loadedScenes[0]?.id || null);
    });
  }, []);

  useEffect(() => {
    void promptService.searchPrompts({ text: search, sceneId: selectedSceneId || undefined }).then(setItems);
  }, [search, selectedSceneId]);

  const activeView = useMemo(() => view, [view]);

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
      <LibraryPage
        scenes={scenes}
        selectedSceneId={selectedSceneId}
        prompts={items}
        onSelectScene={setSelectedSceneId}
        onOpenPrompt={() => setView("detail")}
        onCopyPrompt={() => undefined}
        onCreatePrompt={() => setView("detail")}
      />
    </>
  );
}
