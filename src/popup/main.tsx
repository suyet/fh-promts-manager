import React from "react";
import { createRoot } from "react-dom/client";

function PopupBootstrap() {
  return <div>Fast Use</div>;
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PopupBootstrap />
  </React.StrictMode>
);
