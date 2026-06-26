import React from "react";
import { createRoot } from "react-dom/client";
import { ManagerApp } from "./ManagerApp";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ManagerApp />
  </React.StrictMode>
);
