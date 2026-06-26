import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { repositories } from "../shared/data/repositories";
import { seedIfEmpty } from "../shared/data/seed";
import { copyText } from "../shared/services/clipboardService";
import { promptService } from "../shared/services/promptService";
import type { PromptWithLatest, Scene } from "../shared/types";
import { PopupApp } from "./PopupApp";

function PopupBootstrap() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [recent, setRecent] = useState<PromptWithLatest[]>([]);
  const [matches, setMatches] = useState<PromptWithLatest[]>([]);

  async function refresh(search = "") {
    const [loadedScenes, loadedMatches] = await Promise.all([
      repositories.scenes.list(),
      promptService.searchPrompts({ text: search })
    ]);
    setScenes(loadedScenes);
    setMatches(loadedMatches);
    setRecent(loadedMatches.filter((item) => item.prompt.lastUsedAt).slice(0, 5));
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleCopy(promptId: string) {
    const item = [...matches, ...recent].find((candidate) => candidate.prompt.id === promptId);
    if (!item) return;
    await copyText(item.latestVersion.content);
    await promptService.recordUsage(item.prompt.id, item.latestVersion.id, "popup");
    await refresh();
  }

  return (
    <PopupApp
      scenes={scenes}
      recent={recent}
      matches={matches}
      onSearch={(value) => {
        void refresh(value);
      }}
      onCopy={(promptId) => {
        void handleCopy(promptId);
      }}
      onOpenManager={() => chrome.tabs.create({ url: chrome.runtime.getURL("manager.html") })}
    />
  );
}

void seedIfEmpty().then(() => {
  createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <PopupBootstrap />
    </React.StrictMode>
  );
});
