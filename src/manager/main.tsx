import React from "react";
import { createRoot } from "react-dom/client";
import { seedIfEmpty } from "../shared/data/seed";
import { ManagerApp } from "./ManagerApp";

void seedIfEmpty().then(() => {
  createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <ManagerApp />
    </React.StrictMode>
  );
});
