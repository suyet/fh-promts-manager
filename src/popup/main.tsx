import React from "react";
import { createRoot } from "react-dom/client";
import { PopupApp } from "./PopupApp";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PopupApp
      scenes={[]}
      recent={[]}
      matches={[]}
      onSearch={() => undefined}
      onCopy={() => undefined}
      onOpenManager={() => chrome.tabs.create({ url: chrome.runtime.getURL("manager.html") })}
    />
  </React.StrictMode>
);
