import React from "react";
import { createRoot } from "react-dom/client";

function ManagerBootstrap() {
  return <div>FH Prompt Manager</div>;
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ManagerBootstrap />
  </React.StrictMode>
);
