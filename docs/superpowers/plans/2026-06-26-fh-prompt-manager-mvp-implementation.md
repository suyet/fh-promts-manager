# FH Prompt Manager MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建 FH Prompt Manager 的本地优先 Chrome/Edge Manifest V3 插件 MVP，包含 Fast Use 弹窗、Manager 管理页、IndexedDB 数据层、版本管理、Diff、导入导出和高保真视觉落地。

**Architecture:** 使用 React + TypeScript + Vite 构建两个入口：`manager.html` 和 `popup.html`。IndexedDB 通过 Dexie 封装为仓储层，业务规则集中在 service 层，UI 只调用 service 暴露的方法。所有数据保存在本地，不使用后端、content script、host permissions 或云同步。

**Tech Stack:** React, TypeScript, Vite, Dexie, Vitest, Testing Library, fake-indexeddb, lucide-react, diff, Playwright CLI。

---

## 范围检查

本计划覆盖一个可独立运行和测试的 MVP。它包含多个模块，但它们共同服务同一个浏览器插件产品，不拆成多个独立项目。

不进入本计划：

- 网页输入框自动插入。
- 云同步。
- 用户账号。
- 多级分类。
- Prompt 变量表单。
- 历史版本之间互相 Diff。
- 恢复旧版本。

## 文件结构

实现完成后，项目主要文件如下：

```text
.
├─ docs/
│  └─ superpowers/
│     ├─ specs/2026-06-26-fh-prompt-manager-mvp-design.md
│     └─ plans/2026-06-26-fh-prompt-manager-mvp-implementation.md
├─ prototypes/fh-prompt-manager/index.html
├─ public/
│  ├─ manifest.json
│  └─ icons/
│     ├─ icon-16.png
│     ├─ icon-32.png
│     ├─ icon-48.png
│     └─ icon-128.png
├─ src/
│  ├─ manager/
│  │  ├─ main.tsx
│  │  ├─ ManagerApp.tsx
│  │  ├─ routes.ts
│  │  └─ pages/
│  │     ├─ LibraryPage.tsx
│  │     ├─ PromptDetailPage.tsx
│  │     ├─ DiffPage.tsx
│  │     └─ ImportPage.tsx
│  ├─ popup/
│  │  ├─ main.tsx
│  │  └─ PopupApp.tsx
│  ├─ shared/
│  │  ├─ components/
│  │  │  ├─ Button.tsx
│  │  │  ├─ IconButton.tsx
│  │  │  ├─ PromptCard.tsx
│  │  │  ├─ SceneList.tsx
│  │  │  ├─ PromptEditor.tsx
│  │  │  ├─ VersionHistory.tsx
│  │  │  └─ TopBar.tsx
│  │  ├─ data/
│  │  │  ├─ db.ts
│  │  │  ├─ repositories.ts
│  │  │  └─ seed.ts
│  │  ├─ services/
│  │  │  ├─ promptService.ts
│  │  │  ├─ importExportService.ts
│  │  │  ├─ diffService.ts
│  │  │  └─ clipboardService.ts
│  │  ├─ styles/
│  │  │  ├─ tokens.css
│  │  │  └─ app.css
│  │  ├─ types.ts
│  │  └─ constants.ts
│  ├─ test/
│  │  ├─ setup.ts
│  │  └─ factories.ts
│  └─ vite-env.d.ts
├─ tests/
│  ├─ data/
│  │  └─ repositories.test.ts
│  ├─ services/
│  │  ├─ promptService.test.ts
│  │  ├─ importExportService.test.ts
│  │  └─ diffService.test.ts
│  └─ ui/
│     ├─ LibraryPage.test.tsx
│     ├─ PromptDetailPage.test.tsx
│     └─ PopupApp.test.tsx
├─ manager.html
├─ popup.html
├─ package.json
├─ tsconfig.json
├─ tsconfig.node.json
├─ vite.config.ts
└─ vitest.config.ts
```

## 数据约定

核心实体字段保持与设计文档一致。时间字段使用 ISO 字符串。ID 使用 `crypto.randomUUID()`。版本号从 `1` 开始递增。Prompt 正文只存储在 `PromptVersion.content`。

---

### Task 1: 初始化 Vite + Manifest V3 项目壳

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `manager.html`
- Create: `popup.html`
- Create: `public/manifest.json`
- Create: `public/icons/icon-16.png`
- Create: `public/icons/icon-32.png`
- Create: `public/icons/icon-48.png`
- Create: `public/icons/icon-128.png`
- Create: `src/manager/main.tsx`
- Create: `src/popup/main.tsx`
- Create: `.gitignore`

- [ ] **Step 1: 初始化 git 仓库**

Run:

```powershell
git init
```

Expected: 输出包含 `Initialized empty Git repository`。

- [ ] **Step 2: 创建 `package.json`**

写入：

```json
{
  "name": "fh-prompt-manager",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint:types": "tsc -b --pretty false"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "dexie": "latest",
    "diff": "latest",
    "lucide-react": "latest",
    "react": "latest",
    "react-dom": "latest",
    "vite": "latest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest",
    "@types/diff": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "fake-indexeddb": "latest",
    "jsdom": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 3: 安装依赖**

Run:

```powershell
npm install
```

Expected: 命令退出码为 `0`，生成 `package-lock.json` 和 `node_modules/`。

- [ ] **Step 4: 创建 TypeScript 配置**

`tsconfig.json` 写入：

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src", "tests", "vite.config.ts", "vitest.config.ts"]
}
```

`tsconfig.node.json` 写入：

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 5: 创建 Vite 多入口配置**

`vite.config.ts` 写入：

```ts
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        manager: resolve(__dirname, "manager.html"),
        popup: resolve(__dirname, "popup.html")
      }
    }
  }
});
```

`vitest.config.ts` 写入：

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    globals: true
  }
});
```

- [ ] **Step 6: 创建 HTML 入口**

`manager.html` 写入：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FH Prompt Manager</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/manager/main.tsx"></script>
  </body>
</html>
```

`popup.html` 写入：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FH Prompt Manager Fast Use</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/popup/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: 创建 Manifest V3**

`public/manifest.json` 写入：

```json
{
  "manifest_version": 3,
  "name": "FH Prompt Manager",
  "version": "0.1.0",
  "description": "Local-first prompt manager for Chrome and Edge.",
  "action": {
    "default_title": "FH Prompt Manager",
    "default_popup": "popup.html"
  },
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "permissions": []
}
```

图标文件使用简单 FH 方形图标。用 PowerShell 生成临时 PNG：

```powershell
Add-Type -AssemblyName System.Drawing
foreach ($size in 16,32,48,128) {
  $bitmap = New-Object System.Drawing.Bitmap $size, $size
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::FromArgb(15,23,42))
  $font = New-Object System.Drawing.Font "Arial", ([Math]::Max(7, [int]($size / 3))), ([System.Drawing.FontStyle]::Bold)
  $brush = [System.Drawing.Brushes]::White
  $text = "FH"
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $graphics.DrawString($text, $font, $brush, (New-Object System.Drawing.RectangleF 0,0,$size,$size), $format)
  New-Item -ItemType Directory -Force -Path public/icons | Out-Null
  $bitmap.Save("public/icons/icon-$size.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}
```

- [ ] **Step 8: 创建临时入口组件**

`src/manager/main.tsx` 写入：

```tsx
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
```

`src/popup/main.tsx` 写入：

```tsx
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
```

- [ ] **Step 9: 创建 `.gitignore`**

写入：

```gitignore
node_modules/
dist/
.superpowers/
output/
*.log
```

- [ ] **Step 10: 验证构建**

Run:

```powershell
npm run build
```

Expected: 输出包含 `built in`，`dist/manifest.json` 存在。

- [ ] **Step 11: Commit**

```powershell
git add package.json package-lock.json tsconfig.json tsconfig.node.json vite.config.ts vitest.config.ts manager.html popup.html public src .gitignore
git commit -m "chore: scaffold extension project"
```

Expected: commit 成功。

---

### Task 2: 定义领域类型、常量和测试环境

**Files:**
- Create: `src/shared/types.ts`
- Create: `src/shared/constants.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/factories.ts`
- Modify: `src/manager/main.tsx`
- Modify: `src/popup/main.tsx`
- Test: `npm run lint:types`

- [ ] **Step 1: 创建领域类型**

`src/shared/types.ts` 写入：

```ts
export type Id = string;
export type IsoDateString = string;

export type SceneColor =
  | "blue"
  | "teal"
  | "violet"
  | "pink"
  | "amber";

export type SceneIcon =
  | "code"
  | "pen"
  | "chart"
  | "image"
  | "briefcase";

export interface Scene {
  id: Id;
  name: string;
  description: string;
  icon: SceneIcon;
  color: SceneColor;
  sortOrder: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface Prompt {
  id: Id;
  sceneId: Id;
  title: string;
  description: string;
  tags: string[];
  favorite: boolean;
  latestVersionId: Id;
  latestVersionNumber: number;
  lastUsedAt: IsoDateString | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface PromptVersion {
  id: Id;
  promptId: Id;
  versionNumber: number;
  content: string;
  note: string;
  createdAt: IsoDateString;
}

export type UsageSource = "manager" | "popup" | "version-history" | "diff";

export interface UsageRecord {
  id: Id;
  promptId: Id;
  versionId: Id;
  usedAt: IsoDateString;
  source: UsageSource;
}

export interface PromptWithLatest {
  prompt: Prompt;
  latestVersion: PromptVersion;
  scene: Scene;
}

export interface PromptSearchQuery {
  text: string;
  sceneId?: Id;
  recentOnly?: boolean;
}

export interface ExportPayload {
  schemaVersion: 1;
  exportedAt: IsoDateString;
  scenes: Scene[];
  prompts: Prompt[];
  versions: PromptVersion[];
  usageRecords: UsageRecord[];
}

export interface ImportPreview {
  scenesToAdd: number;
  scenesToMerge: number;
  promptsToAdd: number;
  promptsToMerge: number;
  versionsToAdd: number;
  warnings: string[];
}
```

- [ ] **Step 2: 创建常量**

`src/shared/constants.ts` 写入：

```ts
import type { SceneColor, SceneIcon } from "./types";

export const APP_NAME = "FH Prompt Manager";
export const DB_NAME = "fh-prompt-manager";
export const DB_VERSION = 1;
export const EXPORT_SCHEMA_VERSION = 1;

export const SCENE_COLORS: Record<SceneColor, string> = {
  blue: "#2563eb",
  teal: "#0f766e",
  violet: "#7c3aed",
  pink: "#db2777",
  amber: "#d97706"
};

export const SCENE_ICONS: SceneIcon[] = ["code", "pen", "chart", "image", "briefcase"];
```

- [ ] **Step 3: 创建测试环境**

`src/test/setup.ts` 写入：

```ts
import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
```

`src/test/factories.ts` 写入：

```ts
import type { Prompt, PromptVersion, Scene } from "../shared/types";

export function iso(value = "2026-06-26T00:00:00.000Z") {
  return value;
}

export function sceneFactory(overrides: Partial<Scene> = {}): Scene {
  return {
    id: "scene-code",
    name: "代码重构",
    description: "工程质量与 review",
    icon: "code",
    color: "blue",
    sortOrder: 1,
    createdAt: iso(),
    updatedAt: iso(),
    ...overrides
  };
}

export function promptFactory(overrides: Partial<Prompt> = {}): Prompt {
  return {
    id: "prompt-refactor",
    sceneId: "scene-code",
    title: "Code Refactor Helper",
    description: "不改变行为的前提下重构代码。",
    tags: ["review", "cleanup"],
    favorite: true,
    latestVersionId: "version-1",
    latestVersionNumber: 1,
    lastUsedAt: null,
    createdAt: iso(),
    updatedAt: iso(),
    ...overrides
  };
}

export function versionFactory(overrides: Partial<PromptVersion> = {}): PromptVersion {
  return {
    id: "version-1",
    promptId: "prompt-refactor",
    versionNumber: 1,
    content: "请重构下面的代码。",
    note: "初始版本",
    createdAt: iso(),
    ...overrides
  };
}
```

- [ ] **Step 4: 运行类型检查**

Run:

```powershell
npm run lint:types
```

Expected: 退出码为 `0`。

- [ ] **Step 5: Commit**

```powershell
git add src/shared src/test package.json package-lock.json vitest.config.ts
git commit -m "chore: add domain types and test setup"
```

---

### Task 3: 实现 IndexedDB 仓储层

**Files:**
- Create: `src/shared/data/db.ts`
- Create: `src/shared/data/repositories.ts`
- Test: `tests/data/repositories.test.ts`

- [ ] **Step 1: 写仓储层失败测试**

`tests/data/repositories.test.ts` 写入：

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "../../src/shared/data/db";
import { repositories } from "../../src/shared/data/repositories";
import { promptFactory, sceneFactory, versionFactory } from "../../src/test/factories";

describe("repositories", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("stores and reads scenes, prompts, and versions", async () => {
    const scene = sceneFactory();
    const prompt = promptFactory();
    const version = versionFactory();

    await repositories.scenes.put(scene);
    await repositories.prompts.put(prompt);
    await repositories.versions.put(version);

    await expect(repositories.scenes.get(scene.id)).resolves.toEqual(scene);
    await expect(repositories.prompts.get(prompt.id)).resolves.toEqual(prompt);
    await expect(repositories.versions.listByPrompt(prompt.id)).resolves.toEqual([version]);
  });

  it("deletes prompt versions when a prompt is deleted", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory());

    await repositories.prompts.deleteWithVersions("prompt-refactor");

    await expect(repositories.prompts.get("prompt-refactor")).resolves.toBeUndefined();
    await expect(repositories.versions.listByPrompt("prompt-refactor")).resolves.toEqual([]);
  });
});
```

- [ ] **Step 2: 确认测试失败**

Run:

```powershell
npm test -- tests/data/repositories.test.ts
```

Expected: FAIL，错误包含找不到 `../../src/shared/data/db`。

- [ ] **Step 3: 实现数据库定义**

`src/shared/data/db.ts` 写入：

```ts
import Dexie, { type Table } from "dexie";
import { DB_NAME, DB_VERSION } from "../constants";
import type { Prompt, PromptVersion, Scene, UsageRecord } from "../types";

export class FhPromptDatabase extends Dexie {
  scenes!: Table<Scene, string>;
  prompts!: Table<Prompt, string>;
  versions!: Table<PromptVersion, string>;
  usageRecords!: Table<UsageRecord, string>;

  constructor(name = DB_NAME) {
    super(name);
    this.version(DB_VERSION).stores({
      scenes: "id, name, sortOrder, updatedAt",
      prompts: "id, sceneId, title, latestVersionId, latestVersionNumber, lastUsedAt, updatedAt",
      versions: "id, promptId, versionNumber, createdAt",
      usageRecords: "id, promptId, versionId, usedAt, source"
    });
  }
}

export const db = new FhPromptDatabase();

export async function resetDatabase() {
  await db.delete();
  await db.open();
}
```

- [ ] **Step 4: 实现仓储方法**

`src/shared/data/repositories.ts` 写入：

```ts
import { db } from "./db";
import type { Prompt, PromptVersion, Scene, UsageRecord } from "../types";

export const repositories = {
  scenes: {
    list: () => db.scenes.orderBy("sortOrder").toArray(),
    get: (id: string) => db.scenes.get(id),
    put: (scene: Scene) => db.scenes.put(scene),
    bulkPut: (scenes: Scene[]) => db.scenes.bulkPut(scenes),
    delete: (id: string) => db.scenes.delete(id)
  },
  prompts: {
    list: () => db.prompts.toArray(),
    listByScene: (sceneId: string) => db.prompts.where("sceneId").equals(sceneId).toArray(),
    get: (id: string) => db.prompts.get(id),
    put: (prompt: Prompt) => db.prompts.put(prompt),
    bulkPut: (prompts: Prompt[]) => db.prompts.bulkPut(prompts),
    async deleteWithVersions(promptId: string) {
      await db.transaction("rw", db.prompts, db.versions, db.usageRecords, async () => {
        await db.prompts.delete(promptId);
        await db.versions.where("promptId").equals(promptId).delete();
        await db.usageRecords.where("promptId").equals(promptId).delete();
      });
    }
  },
  versions: {
    get: (id: string) => db.versions.get(id),
    put: (version: PromptVersion) => db.versions.put(version),
    bulkPut: (versions: PromptVersion[]) => db.versions.bulkPut(versions),
    listByPrompt: (promptId: string) =>
      db.versions.where("promptId").equals(promptId).sortBy("versionNumber")
  },
  usageRecords: {
    put: (record: UsageRecord) => db.usageRecords.put(record),
    bulkPut: (records: UsageRecord[]) => db.usageRecords.bulkPut(records),
    listRecent: (limit: number) =>
      db.usageRecords.orderBy("usedAt").reverse().limit(limit).toArray()
  }
};
```

- [ ] **Step 5: 验证仓储测试通过**

Run:

```powershell
npm test -- tests/data/repositories.test.ts
```

Expected: PASS，2 个测试通过。

- [ ] **Step 6: Commit**

```powershell
git add src/shared/data tests/data
git commit -m "feat: add indexeddb repositories"
```

---

### Task 4: 实现 Prompt 业务服务：保存即版本、搜索、复制记录

**Files:**
- Create: `src/shared/services/promptService.ts`
- Create: `src/shared/services/clipboardService.ts`
- Test: `tests/services/promptService.test.ts`

- [ ] **Step 1: 写业务服务失败测试**

`tests/services/promptService.test.ts` 写入：

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDatabase } from "../../src/shared/data/db";
import { repositories } from "../../src/shared/data/repositories";
import { promptService } from "../../src/shared/services/promptService";
import { promptFactory, sceneFactory, versionFactory } from "../../src/test/factories";

describe("promptService", () => {
  beforeEach(async () => {
    await resetDatabase();
    vi.setSystemTime(new Date("2026-06-26T08:00:00.000Z"));
  });

  it("creates first version when creating a prompt", async () => {
    await repositories.scenes.put(sceneFactory());

    const created = await promptService.createPrompt({
      sceneId: "scene-code",
      title: "New Prompt",
      description: "desc",
      tags: ["tag-a"],
      favorite: false,
      content: "content v1",
      note: "初始版本"
    });

    const versions = await repositories.versions.listByPrompt(created.id);
    expect(created.latestVersionNumber).toBe(1);
    expect(versions).toHaveLength(1);
    expect(versions[0].content).toBe("content v1");
  });

  it("saving content creates a new immutable version", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory());

    const updated = await promptService.saveNewVersion("prompt-refactor", {
      content: "content v2",
      note: "增强约束"
    });

    const versions = await repositories.versions.listByPrompt("prompt-refactor");
    expect(updated.latestVersionNumber).toBe(2);
    expect(versions.map((version) => version.content)).toEqual(["请重构下面的代码。", "content v2"]);
  });

  it("searches title, tags, and latest content", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory({ tags: ["review"] }));
    await repositories.versions.put(versionFactory({ content: "包含边界行为说明" }));

    await expect(promptService.searchPrompts({ text: "review" })).resolves.toHaveLength(1);
    await expect(promptService.searchPrompts({ text: "边界行为" })).resolves.toHaveLength(1);
    await expect(promptService.searchPrompts({ text: "不存在" })).resolves.toHaveLength(0);
  });
});
```

- [ ] **Step 2: 确认测试失败**

Run:

```powershell
npm test -- tests/services/promptService.test.ts
```

Expected: FAIL，错误包含找不到 `promptService`。

- [ ] **Step 3: 实现剪贴板服务**

`src/shared/services/clipboardService.ts` 写入：

```ts
export async function copyText(text: string) {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard API is unavailable.");
  }
  await navigator.clipboard.writeText(text);
}
```

- [ ] **Step 4: 实现 Prompt 服务**

`src/shared/services/promptService.ts` 写入：

```ts
import { db } from "../data/db";
import { repositories } from "../data/repositories";
import type { Prompt, PromptSearchQuery, PromptWithLatest, PromptVersion, UsageSource } from "../types";

function now() {
  return new Date().toISOString();
}

function id() {
  return crypto.randomUUID();
}

function includesText(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export const promptService = {
  async createPrompt(input: {
    sceneId: string;
    title: string;
    description: string;
    tags: string[];
    favorite: boolean;
    content: string;
    note: string;
  }): Promise<Prompt> {
    const timestamp = now();
    const promptId = id();
    const versionId = id();
    const prompt: Prompt = {
      id: promptId,
      sceneId: input.sceneId,
      title: input.title,
      description: input.description,
      tags: input.tags,
      favorite: input.favorite,
      latestVersionId: versionId,
      latestVersionNumber: 1,
      lastUsedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    const version: PromptVersion = {
      id: versionId,
      promptId,
      versionNumber: 1,
      content: input.content,
      note: input.note,
      createdAt: timestamp
    };
    await db.transaction("rw", db.prompts, db.versions, async () => {
      await db.prompts.put(prompt);
      await db.versions.put(version);
    });
    return prompt;
  },

  async saveNewVersion(promptId: string, input: { content: string; note: string }): Promise<Prompt> {
    const prompt = await repositories.prompts.get(promptId);
    if (!prompt) throw new Error("Prompt not found.");
    const timestamp = now();
    const version: PromptVersion = {
      id: id(),
      promptId,
      versionNumber: prompt.latestVersionNumber + 1,
      content: input.content,
      note: input.note,
      createdAt: timestamp
    };
    const updated: Prompt = {
      ...prompt,
      latestVersionId: version.id,
      latestVersionNumber: version.versionNumber,
      updatedAt: timestamp
    };
    await db.transaction("rw", db.prompts, db.versions, async () => {
      await db.versions.put(version);
      await db.prompts.put(updated);
    });
    return updated;
  },

  async searchPrompts(query: PromptSearchQuery): Promise<PromptWithLatest[]> {
    const text = query.text.trim().toLowerCase();
    const [prompts, scenes] = await Promise.all([repositories.prompts.list(), repositories.scenes.list()]);
    const sceneById = new Map(scenes.map((scene) => [scene.id, scene]));
    const results: PromptWithLatest[] = [];
    for (const prompt of prompts) {
      if (query.sceneId && prompt.sceneId !== query.sceneId) continue;
      const latestVersion = await repositories.versions.get(prompt.latestVersionId);
      const scene = sceneById.get(prompt.sceneId);
      if (!latestVersion || !scene) continue;
      const searchable = [prompt.title, prompt.description, prompt.tags.join(" "), latestVersion.content].join(" ");
      if (!text || includesText(searchable, text)) {
        results.push({ prompt, latestVersion, scene });
      }
    }
    return results.sort((a, b) => (b.prompt.lastUsedAt || "").localeCompare(a.prompt.lastUsedAt || ""));
  },

  async recordUsage(promptId: string, versionId: string, source: UsageSource) {
    const timestamp = now();
    const prompt = await repositories.prompts.get(promptId);
    if (!prompt) throw new Error("Prompt not found.");
    await db.transaction("rw", db.prompts, db.usageRecords, async () => {
      await db.usageRecords.put({ id: id(), promptId, versionId, usedAt: timestamp, source });
      await db.prompts.put({ ...prompt, lastUsedAt: timestamp, updatedAt: timestamp });
    });
  }
};
```

- [ ] **Step 5: 验证测试通过**

Run:

```powershell
npm test -- tests/services/promptService.test.ts
```

Expected: PASS，3 个测试通过。

- [ ] **Step 6: Commit**

```powershell
git add src/shared/services tests/services/promptService.test.ts
git commit -m "feat: add prompt service"
```

---

### Task 5: 实现导入导出合并规则

**Files:**
- Create: `src/shared/services/importExportService.ts`
- Test: `tests/services/importExportService.test.ts`

- [ ] **Step 1: 写导入导出失败测试**

`tests/services/importExportService.test.ts` 写入：

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "../../src/shared/data/db";
import { repositories } from "../../src/shared/data/repositories";
import { importExportService } from "../../src/shared/services/importExportService";
import { promptFactory, sceneFactory, versionFactory } from "../../src/test/factories";
import type { ExportPayload } from "../../src/shared/types";

describe("importExportService", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("exports all tables as schema version 1", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory());

    const payload = await importExportService.exportAll();

    expect(payload.schemaVersion).toBe(1);
    expect(payload.scenes).toHaveLength(1);
    expect(payload.prompts).toHaveLength(1);
    expect(payload.versions).toHaveLength(1);
  });

  it("previews scene merge and prompt version merge", async () => {
    await repositories.scenes.put(sceneFactory());
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory());

    const payload: ExportPayload = {
      schemaVersion: 1,
      exportedAt: "2026-06-26T08:00:00.000Z",
      scenes: [sceneFactory({ icon: "pen", color: "teal" })],
      prompts: [promptFactory()],
      versions: [versionFactory({ id: "imported-version", content: "导入内容" })],
      usageRecords: []
    };

    const preview = await importExportService.previewImport(payload);

    expect(preview.scenesToMerge).toBe(1);
    expect(preview.promptsToMerge).toBe(1);
    expect(preview.versionsToAdd).toBe(1);
  });

  it("imports without overwriting local scene icon and color", async () => {
    await repositories.scenes.put(sceneFactory({ icon: "code", color: "blue" }));

    await importExportService.importAll({
      schemaVersion: 1,
      exportedAt: "2026-06-26T08:00:00.000Z",
      scenes: [sceneFactory({ icon: "pen", color: "teal" })],
      prompts: [],
      versions: [],
      usageRecords: []
    });

    const scene = await repositories.scenes.get("scene-code");
    expect(scene?.icon).toBe("code");
    expect(scene?.color).toBe("blue");
  });
});
```

- [ ] **Step 2: 确认测试失败**

Run:

```powershell
npm test -- tests/services/importExportService.test.ts
```

Expected: FAIL，错误包含找不到 `importExportService`。

- [ ] **Step 3: 实现导入导出服务**

`src/shared/services/importExportService.ts` 写入：

```ts
import { EXPORT_SCHEMA_VERSION } from "../constants";
import { db } from "../data/db";
import { repositories } from "../data/repositories";
import type { ExportPayload, ImportPreview, Prompt, Scene } from "../types";

function samePromptKey(prompt: Prompt, sceneNameById: Map<string, string>) {
  return `${sceneNameById.get(prompt.sceneId) || ""}::${prompt.title}`;
}

export const importExportService = {
  async exportAll(): Promise<ExportPayload> {
    const [scenes, prompts, versions, usageRecords] = await Promise.all([
      repositories.scenes.list(),
      repositories.prompts.list(),
      db.versions.toArray(),
      db.usageRecords.toArray()
    ]);
    return {
      schemaVersion: EXPORT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      scenes,
      prompts,
      versions,
      usageRecords
    };
  },

  async previewImport(payload: ExportPayload): Promise<ImportPreview> {
    if (payload.schemaVersion !== EXPORT_SCHEMA_VERSION) {
      throw new Error("Unsupported schema version.");
    }
    const localScenes = await repositories.scenes.list();
    const localSceneNames = new Set(localScenes.map((scene) => scene.name));
    const importedSceneNames = new Set(payload.scenes.map((scene) => scene.name));
    const localSceneNameById = new Map(localScenes.map((scene) => [scene.id, scene.name]));
    const importedSceneNameById = new Map(payload.scenes.map((scene) => [scene.id, scene.name]));
    const localPrompts = await repositories.prompts.list();
    const localPromptKeys = new Set(localPrompts.map((prompt) => samePromptKey(prompt, localSceneNameById)));
    const importedPromptKeys = payload.prompts.map((prompt) => samePromptKey(prompt, importedSceneNameById));
    const localVersions = await db.versions.toArray();
    const localVersionContents = new Set(localVersions.map((version) => `${version.promptId}::${version.content}`));

    return {
      scenesToAdd: payload.scenes.filter((scene) => !localSceneNames.has(scene.name)).length,
      scenesToMerge: payload.scenes.filter((scene) => localSceneNames.has(scene.name)).length,
      promptsToAdd: importedPromptKeys.filter((key) => !localPromptKeys.has(key)).length,
      promptsToMerge: importedPromptKeys.filter((key) => localPromptKeys.has(key)).length,
      versionsToAdd: payload.versions.filter((version) => !localVersionContents.has(`${version.promptId}::${version.content}`)).length,
      warnings: [...importedSceneNames].length !== payload.scenes.length ? ["导入文件中存在同名 Scene。"] : []
    };
  },

  async importAll(payload: ExportPayload): Promise<ImportPreview> {
    const preview = await this.previewImport(payload);
    const localScenes = await repositories.scenes.list();
    const localSceneByName = new Map(localScenes.map((scene) => [scene.name, scene]));
    const sceneIdMap = new Map<string, string>();
    const scenesToAdd: Scene[] = [];

    for (const importedScene of payload.scenes) {
      const localScene = localSceneByName.get(importedScene.name);
      if (localScene) {
        sceneIdMap.set(importedScene.id, localScene.id);
      } else {
        sceneIdMap.set(importedScene.id, importedScene.id);
        scenesToAdd.push(importedScene);
      }
    }

    await db.transaction("rw", db.scenes, db.prompts, db.versions, db.usageRecords, async () => {
      await db.scenes.bulkPut(scenesToAdd);
      const currentPrompts = await db.prompts.toArray();
      const currentScenes = await db.scenes.toArray();
      const sceneNameById = new Map(currentScenes.map((scene) => [scene.id, scene.name]));
      const promptByKey = new Map(currentPrompts.map((prompt) => [samePromptKey(prompt, sceneNameById), prompt]));

      for (const importedPrompt of payload.prompts) {
        const mappedSceneId = sceneIdMap.get(importedPrompt.sceneId) || importedPrompt.sceneId;
        const importedWithMappedScene = { ...importedPrompt, sceneId: mappedSceneId };
        const key = samePromptKey(importedWithMappedScene, sceneNameById);
        const localPrompt = promptByKey.get(key);
        await db.prompts.put(localPrompt ? { ...localPrompt, updatedAt: new Date().toISOString() } : importedWithMappedScene);
      }

      const promptsAfterMerge = await db.prompts.toArray();
      const promptIdByKey = new Map(promptsAfterMerge.map((prompt) => [samePromptKey(prompt, sceneNameById), prompt.id]));
      const existingVersions = await db.versions.toArray();
      const existingContents = new Set(existingVersions.map((version) => `${version.promptId}::${version.content}`));

      for (const importedVersion of payload.versions) {
        const importedPrompt = payload.prompts.find((prompt) => prompt.id === importedVersion.promptId);
        if (!importedPrompt) continue;
        const mappedSceneId = sceneIdMap.get(importedPrompt.sceneId) || importedPrompt.sceneId;
        const key = samePromptKey({ ...importedPrompt, sceneId: mappedSceneId }, sceneNameById);
        const promptId = promptIdByKey.get(key);
        if (!promptId) continue;
        const versionKey = `${promptId}::${importedVersion.content}`;
        if (!existingContents.has(versionKey)) {
          await db.versions.put({ ...importedVersion, id: crypto.randomUUID(), promptId });
        }
      }
    });
    return preview;
  }
};
```

- [ ] **Step 4: 验证导入导出测试通过**

Run:

```powershell
npm test -- tests/services/importExportService.test.ts
```

Expected: PASS，3 个测试通过。

- [ ] **Step 5: Commit**

```powershell
git add src/shared/services/importExportService.ts tests/services/importExportService.test.ts
git commit -m "feat: add import export merge service"
```

---

### Task 6: 实现 latest vs history Diff 工具

**Files:**
- Create: `src/shared/services/diffService.ts`
- Test: `tests/services/diffService.test.ts`

- [ ] **Step 1: 写 Diff 失败测试**

`tests/services/diffService.test.ts` 写入：

```ts
import { describe, expect, it } from "vitest";
import { diffService } from "../../src/shared/services/diffService";

describe("diffService", () => {
  it("returns removed, added, and unchanged line groups", () => {
    const rows = diffService.compareHistoryToLatest({
      historyLabel: "v2",
      latestLabel: "v3 Latest",
      historyContent: "A\nB\nC",
      latestContent: "A\nB changed\nC"
    });

    expect(rows.historyLabel).toBe("v2");
    expect(rows.latestLabel).toBe("v3 Latest");
    expect(rows.parts.some((part) => part.type === "removed" && part.text.includes("B"))).toBe(true);
    expect(rows.parts.some((part) => part.type === "added" && part.text.includes("B changed"))).toBe(true);
    expect(rows.parts.some((part) => part.type === "same" && part.text.includes("A"))).toBe(true);
  });
});
```

- [ ] **Step 2: 确认测试失败**

Run:

```powershell
npm test -- tests/services/diffService.test.ts
```

Expected: FAIL，错误包含找不到 `diffService`。

- [ ] **Step 3: 实现 Diff 服务**

`src/shared/services/diffService.ts` 写入：

```ts
import { diffLines } from "diff";

export type DiffPartType = "same" | "added" | "removed";

export interface DiffPart {
  type: DiffPartType;
  text: string;
}

export interface VersionDiff {
  historyLabel: string;
  latestLabel: string;
  parts: DiffPart[];
}

export const diffService = {
  compareHistoryToLatest(input: {
    historyLabel: string;
    latestLabel: string;
    historyContent: string;
    latestContent: string;
  }): VersionDiff {
    const parts = diffLines(input.historyContent, input.latestContent)
      .filter((part) => part.value.length > 0)
      .map<DiffPart>((part) => ({
        type: part.added ? "added" : part.removed ? "removed" : "same",
        text: part.value
      }));
    return {
      historyLabel: input.historyLabel,
      latestLabel: input.latestLabel,
      parts
    };
  }
};
```

- [ ] **Step 4: 验证 Diff 测试通过**

Run:

```powershell
npm test -- tests/services/diffService.test.ts
```

Expected: PASS，1 个测试通过。

- [ ] **Step 5: Commit**

```powershell
git add src/shared/services/diffService.ts tests/services/diffService.test.ts
git commit -m "feat: add latest version diff service"
```

---

### Task 7: 建立视觉系统和共享 UI 组件

**Files:**
- Create: `src/shared/styles/tokens.css`
- Create: `src/shared/styles/app.css`
- Create: `src/shared/components/Button.tsx`
- Create: `src/shared/components/IconButton.tsx`
- Create: `src/shared/components/TopBar.tsx`
- Create: `src/shared/components/SceneList.tsx`
- Create: `src/shared/components/PromptCard.tsx`
- Create: `src/shared/components/PromptEditor.tsx`
- Create: `src/shared/components/VersionHistory.tsx`

- [ ] **Step 1: 创建设计 token**

`src/shared/styles/tokens.css` 写入：

```css
:root {
  --bg: #f8fafc;
  --panel: #ffffff;
  --panel-soft: #fbfdff;
  --line: #e3e9f2;
  --line-strong: #d7e0ef;
  --text: #182232;
  --muted: #64748b;
  --blue: #2563eb;
  --blue-50: #eff6ff;
  --blue-100: #dbeafe;
  --red: #dc2626;
  --red-bg: #fef2f2;
  --green: #16a34a;
  --green-bg: #ecfdf3;
  --radius: 8px;
  --topbar: 68px;
  font-family: "Microsoft YaHei UI", "PingFang SC", "Noto Sans SC", ui-sans-serif, system-ui, sans-serif;
}
```

- [ ] **Step 2: 创建全局样式**

`src/shared/styles/app.css` 写入：

```css
@import "./tokens.css";

* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  color: var(--text);
  background: var(--bg);
  font-size: 15px;
}
button, input, textarea, select { font: inherit; }
button { border: 0; cursor: pointer; }
.icon { width: 18px; height: 18px; stroke-width: 2; }
```

- [ ] **Step 3: 创建按钮组件**

`src/shared/components/Button.tsx` 写入：

```tsx
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

export function Button({
  variant = "secondary",
  children,
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }>) {
  return (
    <button className={`btn btn-${variant}`} {...props}>
      {children}
    </button>
  );
}
```

`src/shared/components/IconButton.tsx` 写入：

```tsx
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function IconButton({
  label,
  icon,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; icon: ReactNode }) {
  return (
    <button className="icon-btn" aria-label={label} title={label} {...props}>
      {icon}
    </button>
  );
}
```

- [ ] **Step 4: 创建 TopBar**

`src/shared/components/TopBar.tsx` 写入：

```tsx
import { Download, Mail, Moon, Search, Upload } from "lucide-react";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

export function TopBar({
  activeView,
  search,
  onSearch,
  onNavigate,
  onImport,
  onExport
}: {
  activeView: "library" | "popup" | "import" | "detail" | "diff";
  search: string;
  onSearch: (value: string) => void;
  onNavigate: (view: "library" | "popup") => void;
  onImport: () => void;
  onExport: () => void;
}) {
  return (
    <header className="topbar">
      <div className="brand"><span className="brand-mark">FH</span><span>FH Prompt Manager</span></div>
      <nav className="top-tabs">
        <button className={activeView === "library" ? "tab active" : "tab"} onClick={() => onNavigate("library")}>资产库</button>
        <button className={activeView === "popup" ? "tab active" : "tab"} onClick={() => onNavigate("popup")}>Fast Use</button>
      </nav>
      <label className="top-search">
        <Search className="icon" />
        <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="搜索标题、标签、正文" />
      </label>
      <div className="top-actions">
        <Button onClick={onImport}><Upload className="icon" />导入</Button>
        <Button onClick={onExport}><Download className="icon" />导出</Button>
        <Button onClick={() => window.location.href = "mailto:author@example.com"}><Mail className="icon" />联系作者</Button>
        <IconButton label="切换明暗模式" icon={<Moon className="icon" />} />
      </div>
    </header>
  );
}
```

- [ ] **Step 5: 创建业务 UI 组件**

实现组件职责：

- `SceneList.tsx`：渲染场景列表、图标、颜色、数量。
- `PromptCard.tsx`：渲染 Prompt 卡片，右上角显示收藏和复制图标，不显示底部详情/复制按钮。
- `PromptEditor.tsx`：只渲染提示词正文编辑器和编辑器标题栏按钮。
- `VersionHistory.tsx`：最新版本只显示 Copy，历史版本显示 Compare to Latest 和 Copy。

`PromptCard.tsx` 关键结构必须是：

```tsx
import { Copy, Star } from "lucide-react";
import type { PromptWithLatest } from "../types";
import { IconButton } from "./IconButton";

export function PromptCard({
  item,
  onOpen,
  onCopy,
  onToggleFavorite
}: {
  item: PromptWithLatest;
  onOpen: () => void;
  onCopy: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <article className="prompt-card">
      <div className="card-top">
        <button className="card-main" onClick={onOpen}>
          <h2>{item.prompt.title}</h2>
          <p>{item.prompt.description}</p>
        </button>
        <div className="card-icon-actions">
          <IconButton label="收藏" icon={<Star className="icon" />} onClick={onToggleFavorite} />
          <IconButton label="复制最新版本" icon={<Copy className="icon" />} onClick={onCopy} />
        </div>
      </div>
      <div className="tags">
        {item.prompt.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
      </div>
      <div className="card-meta">
        <span>v{item.prompt.latestVersionNumber}</span>
        <span>{item.scene.name}</span>
      </div>
    </article>
  );
}
```

- [ ] **Step 6: 类型检查**

Run:

```powershell
npm run lint:types
```

Expected: 退出码为 `0`。

- [ ] **Step 7: Commit**

```powershell
git add src/shared/components src/shared/styles
git commit -m "feat: add shared ui system"
```

---

### Task 8: 实现 Manager 资产库页

**Files:**
- Create: `src/manager/ManagerApp.tsx`
- Create: `src/manager/routes.ts`
- Create: `src/manager/pages/LibraryPage.tsx`
- Test: `tests/ui/LibraryPage.test.tsx`
- Modify: `src/manager/main.tsx`

- [ ] **Step 1: 写资产库 UI 测试**

`tests/ui/LibraryPage.test.tsx` 写入：

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LibraryPage } from "../../src/manager/pages/LibraryPage";
import { promptFactory, sceneFactory, versionFactory } from "../../src/test/factories";

describe("LibraryPage", () => {
  it("renders scenes and prompt cards with icon actions", async () => {
    const user = userEvent.setup();
    const onOpenPrompt = vi.fn();
    const onCopyPrompt = vi.fn();
    render(
      <LibraryPage
        scenes={[sceneFactory()]}
        selectedSceneId="scene-code"
        prompts={[{ prompt: promptFactory(), latestVersion: versionFactory(), scene: sceneFactory() }]}
        onSelectScene={vi.fn()}
        onOpenPrompt={onOpenPrompt}
        onCopyPrompt={onCopyPrompt}
        onCreatePrompt={vi.fn()}
      />
    );

    expect(screen.getByText("代码重构")).toBeInTheDocument();
    expect(screen.getByText("Code Refactor Helper")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "详情" })).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("复制最新版本"));
    expect(onCopyPrompt).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: 确认测试失败**

Run:

```powershell
npm test -- tests/ui/LibraryPage.test.tsx
```

Expected: FAIL，错误包含找不到 `LibraryPage`。

- [ ] **Step 3: 实现 LibraryPage**

`src/manager/pages/LibraryPage.tsx` 写入：

```tsx
import { Plus, ArrowUpDown } from "lucide-react";
import { Button } from "../../shared/components/Button";
import { PromptCard } from "../../shared/components/PromptCard";
import { SceneList } from "../../shared/components/SceneList";
import type { PromptWithLatest, Scene } from "../../shared/types";

export function LibraryPage({
  scenes,
  selectedSceneId,
  prompts,
  onSelectScene,
  onOpenPrompt,
  onCopyPrompt,
  onCreatePrompt
}: {
  scenes: Scene[];
  selectedSceneId: string | null;
  prompts: PromptWithLatest[];
  onSelectScene: (sceneId: string) => void;
  onOpenPrompt: (promptId: string) => void;
  onCopyPrompt: (promptId: string) => void;
  onCreatePrompt: () => void;
}) {
  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId) || scenes[0];
  return (
    <main className="main">
      <SceneList scenes={scenes} selectedSceneId={selectedScene?.id || null} onSelectScene={onSelectScene} />
      <section className="workbench">
        <div className="page-head">
          <div>
            <h1>{selectedScene?.name || "资产库"}</h1>
            <p>{prompts.length} 个 Prompt</p>
          </div>
          <div className="page-actions">
            <Button><ArrowUpDown className="icon" />排序</Button>
            <Button variant="primary" onClick={onCreatePrompt}><Plus className="icon" />新建</Button>
          </div>
        </div>
        <div className="cards">
          {prompts.map((item) => (
            <PromptCard
              key={item.prompt.id}
              item={item}
              onOpen={() => onOpenPrompt(item.prompt.id)}
              onCopy={() => onCopyPrompt(item.prompt.id)}
              onToggleFavorite={() => undefined}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: 实现 ManagerApp 最小状态**

`src/manager/routes.ts` 写入：

```ts
export type ManagerView = "library" | "detail" | "diff" | "import" | "popup";
```

`src/manager/ManagerApp.tsx` 写入：

```tsx
import { useEffect, useMemo, useState } from "react";
import { TopBar } from "../shared/components/TopBar";
import { repositories } from "../shared/data/repositories";
import { promptService } from "../shared/services/promptService";
import "../shared/styles/app.css";
import { LibraryPage } from "./pages/LibraryPage";
import type { ManagerView } from "./routes";
import type { PromptWithLatest, Scene } from "../shared/types";

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
```

`src/manager/main.tsx` 修改为：

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { ManagerApp } from "./ManagerApp";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ManagerApp />
  </React.StrictMode>
);
```

- [ ] **Step 5: 验证资产库测试通过**

Run:

```powershell
npm test -- tests/ui/LibraryPage.test.tsx
```

Expected: PASS，1 个测试通过。

- [ ] **Step 6: Commit**

```powershell
git add src/manager tests/ui/LibraryPage.test.tsx
git commit -m "feat: add manager library page"
```

---

### Task 9: 实现 Prompt 详情页和无草稿保存行为

**Files:**
- Create: `src/manager/pages/PromptDetailPage.tsx`
- Test: `tests/ui/PromptDetailPage.test.tsx`
- Modify: `src/manager/ManagerApp.tsx`

- [ ] **Step 1: 写详情页 UI 测试**

`tests/ui/PromptDetailPage.test.tsx` 写入：

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PromptDetailPage } from "../../src/manager/pages/PromptDetailPage";
import { promptFactory, sceneFactory, versionFactory } from "../../src/test/factories";

describe("PromptDetailPage", () => {
  it("places prompt actions in secondary title row and editor actions in editor bar", async () => {
    const user = userEvent.setup();
    const onSaveVersion = vi.fn();

    render(
      <PromptDetailPage
        item={{ prompt: promptFactory(), latestVersion: versionFactory(), scene: sceneFactory() }}
        versions={[versionFactory()]}
        onBack={vi.fn()}
        onCopyLatest={vi.fn()}
        onDelete={vi.fn()}
        onSaveVersion={onSaveVersion}
        onCompareToLatest={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "删除" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
    await user.clear(screen.getByLabelText("提示词正文"));
    await user.type(screen.getByLabelText("提示词正文"), "新的提示词正文");
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(onSaveVersion).toHaveBeenCalledWith("新的提示词正文");
  });
});
```

- [ ] **Step 2: 确认测试失败**

Run:

```powershell
npm test -- tests/ui/PromptDetailPage.test.tsx
```

Expected: FAIL，错误包含找不到 `PromptDetailPage`。

- [ ] **Step 3: 实现详情页**

`src/manager/pages/PromptDetailPage.tsx` 写入：

```tsx
import { ArrowLeft, Copy, Download, Save, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../../shared/components/Button";
import { IconButton } from "../../shared/components/IconButton";
import { PromptEditor } from "../../shared/components/PromptEditor";
import { VersionHistory } from "../../shared/components/VersionHistory";
import type { PromptVersion, PromptWithLatest } from "../../shared/types";

export function PromptDetailPage({
  item,
  versions,
  onBack,
  onCopyLatest,
  onDelete,
  onSaveVersion,
  onCompareToLatest
}: {
  item: PromptWithLatest;
  versions: PromptVersion[];
  onBack: () => void;
  onCopyLatest: () => void;
  onDelete: () => void;
  onSaveVersion: (content: string) => void;
  onCompareToLatest: (versionId: string) => void;
}) {
  const [content, setContent] = useState(item.latestVersion.content);
  return (
    <main className="main detail-main">
      <section className="workbench full">
        <div className="sub-header">
          <div className="sub-left">
            <IconButton label="返回" icon={<ArrowLeft className="icon" />} onClick={onBack} />
            <h1>{item.prompt.title}</h1>
            <span className="version-pill">v{item.prompt.latestVersionNumber} Latest</span>
          </div>
          <div className="sub-right">
            <IconButton label="收藏" icon={<Star className="icon" />} />
            <Button variant="danger" onClick={onDelete}><Trash2 className="icon" />删除</Button>
            <Button variant="primary" onClick={onCopyLatest}><Copy className="icon" />复制</Button>
          </div>
        </div>
        <div className="detail-grid">
          <PromptEditor
            content={content}
            onChange={setContent}
            onSave={() => onSaveVersion(content)}
            onDownload={() => undefined}
            onCopy={() => undefined}
          />
          <aside className="right-panel">
            <section>
              <h2>详细信息</h2>
              <p>场景：{item.scene.name}</p>
              <p>标签：{item.prompt.tags.join(", ")}</p>
              <p>描述：{item.prompt.description}</p>
            </section>
            <VersionHistory
              latestVersionId={item.prompt.latestVersionId}
              versions={versions}
              onCopy={() => undefined}
              onCompareToLatest={onCompareToLatest}
            />
          </aside>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: 确保离开未保存提示**

在 `PromptDetailPage.tsx` 中添加：

```tsx
const hasUnsavedChanges = content !== item.latestVersion.content;
function handleBack() {
  if (hasUnsavedChanges && !window.confirm("未保存的编辑内容将被丢弃，确认离开？")) return;
  onBack();
}
```

并将返回按钮 `onClick={onBack}` 改为 `onClick={handleBack}`。

- [ ] **Step 5: 验证详情页测试通过**

Run:

```powershell
npm test -- tests/ui/PromptDetailPage.test.tsx
```

Expected: PASS，1 个测试通过。

- [ ] **Step 6: Commit**

```powershell
git add src/manager/pages/PromptDetailPage.tsx tests/ui/PromptDetailPage.test.tsx
git commit -m "feat: add prompt detail page"
```

---

### Task 10: 实现 Diff 页面和导入预览页面

**Files:**
- Create: `src/manager/pages/DiffPage.tsx`
- Create: `src/manager/pages/ImportPage.tsx`
- Modify: `src/manager/ManagerApp.tsx`

- [ ] **Step 1: 实现 DiffPage**

`src/manager/pages/DiffPage.tsx` 写入：

```tsx
import { ArrowLeft, Copy } from "lucide-react";
import { Button } from "../../shared/components/Button";
import { IconButton } from "../../shared/components/IconButton";
import type { VersionDiff } from "../../shared/services/diffService";

export function DiffPage({
  diff,
  onBack,
  onCopyHistory,
  onCopyLatest
}: {
  diff: VersionDiff;
  onBack: () => void;
  onCopyHistory: () => void;
  onCopyLatest: () => void;
}) {
  return (
    <main className="main detail-main">
      <section className="workbench full">
        <div className="sub-header">
          <div className="sub-left">
            <IconButton label="返回" icon={<ArrowLeft className="icon" />} onClick={onBack} />
            <h1>Comparing {diff.historyLabel} → {diff.latestLabel}</h1>
          </div>
          <div className="sub-right">
            <Button onClick={onCopyHistory}><Copy className="icon" />复制 {diff.historyLabel}</Button>
            <Button variant="primary" onClick={onCopyLatest}><Copy className="icon" />复制 Latest</Button>
          </div>
        </div>
        <div className="diff-grid">
          <section className="diff-pane">
            <h2>{diff.historyLabel}</h2>
            {diff.parts.filter((part) => part.type !== "added").map((part, index) => (
              <pre className={`diff-line ${part.type}`} key={`history-${index}`}>{part.text}</pre>
            ))}
          </section>
          <section className="diff-pane">
            <h2>{diff.latestLabel}</h2>
            {diff.parts.filter((part) => part.type !== "removed").map((part, index) => (
              <pre className={`diff-line ${part.type}`} key={`latest-${index}`}>{part.text}</pre>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: 实现 ImportPage**

`src/manager/pages/ImportPage.tsx` 写入：

```tsx
import { Check, X } from "lucide-react";
import { Button } from "../../shared/components/Button";
import type { ImportPreview } from "../../shared/types";

export function ImportPage({
  preview,
  onCancel,
  onConfirm
}: {
  preview: ImportPreview | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <main className="main detail-main">
      <section className="import-card">
        <h1>导入预览</h1>
        <p>合并导入，不静默覆盖或删除本地数据。</p>
        <div className="import-grid">
          <div><strong>{preview?.scenesToAdd ?? 0}</strong><span>新增 Scene</span></div>
          <div><strong>{preview?.promptsToAdd ?? 0}</strong><span>新增 Prompt</span></div>
          <div><strong>{preview?.versionsToAdd ?? 0}</strong><span>新增版本</span></div>
        </div>
        <div className="page-actions">
          <Button onClick={onCancel}><X className="icon" />取消</Button>
          <Button variant="primary" onClick={onConfirm}><Check className="icon" />执行导入</Button>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: 接入 ManagerApp 路由**

在 `ManagerApp.tsx` 中根据 `view` 渲染 `LibraryPage`、`PromptDetailPage`、`DiffPage`、`ImportPage`。每个分支必须返回一个完整页面，不使用空白占位。

- [ ] **Step 4: 类型检查和构建**

Run:

```powershell
npm run lint:types
npm run build
```

Expected: 两个命令退出码为 `0`。

- [ ] **Step 5: Commit**

```powershell
git add src/manager/pages src/manager/ManagerApp.tsx
git commit -m "feat: add diff and import pages"
```

---

### Task 11: 实现 Fast Use 弹窗

**Files:**
- Create: `src/popup/PopupApp.tsx`
- Test: `tests/ui/PopupApp.test.tsx`
- Modify: `src/popup/main.tsx`

- [ ] **Step 1: 写 Popup UI 测试**

`tests/ui/PopupApp.test.tsx` 写入：

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PopupApp } from "../../src/popup/PopupApp";
import { promptFactory, sceneFactory, versionFactory } from "../../src/test/factories";

describe("PopupApp", () => {
  it("shows scene filters, recent prompts, matching prompts, and copy actions", async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    render(
      <PopupApp
        scenes={[sceneFactory()]}
        recent={[{ prompt: promptFactory(), latestVersion: versionFactory(), scene: sceneFactory() }]}
        matches={[{ prompt: promptFactory({ id: "prompt-2", title: "Review Checklist" }), latestVersion: versionFactory({ id: "version-2", promptId: "prompt-2" }), scene: sceneFactory() }]}
        onSearch={vi.fn()}
        onCopy={onCopy}
        onOpenManager={vi.fn()}
      />
    );

    expect(screen.getByText("最近使用")).toBeInTheDocument();
    expect(screen.getByText("匹配结果")).toBeInTheDocument();
    await user.click(screen.getAllByLabelText("复制最新版本")[0]);
    expect(onCopy).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: 确认测试失败**

Run:

```powershell
npm test -- tests/ui/PopupApp.test.tsx
```

Expected: FAIL，错误包含找不到 `PopupApp`。

- [ ] **Step 3: 实现 PopupApp**

`src/popup/PopupApp.tsx` 写入：

```tsx
import { Copy, ExternalLink, Search } from "lucide-react";
import { IconButton } from "../shared/components/IconButton";
import "../shared/styles/app.css";
import type { PromptWithLatest, Scene } from "../shared/types";

export function PopupApp({
  scenes,
  recent,
  matches,
  onSearch,
  onCopy,
  onOpenManager
}: {
  scenes: Scene[];
  recent: PromptWithLatest[];
  matches: PromptWithLatest[];
  onSearch: (value: string) => void;
  onCopy: (promptId: string) => void;
  onOpenManager: () => void;
}) {
  return (
    <main className="popup">
      <header className="popup-head">
        <strong>FH Prompt Manager</strong>
        <IconButton label="打开管理页" icon={<ExternalLink className="icon" />} onClick={onOpenManager} />
      </header>
      <label className="popup-search">
        <Search className="icon" />
        <input onChange={(event) => onSearch(event.target.value)} placeholder="搜索 Prompt" />
      </label>
      <div className="scene-filters">
        <button>全部</button>
        {scenes.map((scene) => <button key={scene.id}>{scene.name}</button>)}
      </div>
      <PromptList title="最近使用" items={recent} onCopy={onCopy} />
      <PromptList title="匹配结果" items={matches} onCopy={onCopy} />
    </main>
  );
}

function PromptList({
  title,
  items,
  onCopy
}: {
  title: string;
  items: PromptWithLatest[];
  onCopy: (promptId: string) => void;
}) {
  return (
    <section>
      <h2>{title}</h2>
      {items.map((item) => (
        <article className="popup-result" key={item.prompt.id}>
          <div>
            <strong>{item.prompt.title}</strong>
            <p>v{item.prompt.latestVersionNumber} · {item.scene.name}</p>
          </div>
          <IconButton label="复制最新版本" icon={<Copy className="icon" />} onClick={() => onCopy(item.prompt.id)} />
        </article>
      ))}
    </section>
  );
}
```

- [ ] **Step 4: 接入 popup main**

`src/popup/main.tsx` 修改为：

```tsx
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
```

- [ ] **Step 5: 验证 Popup 测试通过**

Run:

```powershell
npm test -- tests/ui/PopupApp.test.tsx
```

Expected: PASS，1 个测试通过。

- [ ] **Step 6: Commit**

```powershell
git add src/popup tests/ui/PopupApp.test.tsx
git commit -m "feat: add fast use popup"
```

---

### Task 12: 种子数据、空状态和真实复制流程

**Files:**
- Create: `src/shared/data/seed.ts`
- Modify: `src/manager/ManagerApp.tsx`
- Modify: `src/popup/main.tsx`
- Modify: `src/shared/services/clipboardService.ts`

- [ ] **Step 1: 创建首次运行种子数据**

`src/shared/data/seed.ts` 写入：

```ts
import { repositories } from "./repositories";
import { promptService } from "../services/promptService";

export async function seedIfEmpty() {
  const scenes = await repositories.scenes.list();
  if (scenes.length > 0) return;
  const timestamp = new Date().toISOString();
  const scene = {
    id: "scene-code",
    name: "代码重构",
    description: "工程质量与 review",
    icon: "code" as const,
    color: "blue" as const,
    sortOrder: 1,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  await repositories.scenes.put(scene);
  await promptService.createPrompt({
    sceneId: scene.id,
    title: "Code Refactor Helper",
    description: "不改变行为的前提下重构代码，并提示风险。",
    tags: ["review", "cleanup"],
    favorite: true,
    content: "请重构下面的代码，目标是提升可读性和可维护性。",
    note: "初始版本"
  });
}
```

- [ ] **Step 2: Manager 和 Popup 启动时调用 seed**

在 `ManagerApp.tsx` 和 `popup/main.tsx` 初始化数据前调用：

```ts
await seedIfEmpty();
```

如果入口函数不是 `async`，包一层：

```ts
void seedIfEmpty().then(() => {
  createRoot(document.getElementById("root") as HTMLElement).render(...);
});
```

- [ ] **Step 3: 接入真实复制**

在 Manager 和 Popup 的复制动作中：

```ts
await copyText(item.latestVersion.content);
await promptService.recordUsage(item.prompt.id, item.latestVersion.id, "manager");
```

Popup 使用 source `"popup"`。

- [ ] **Step 4: 构建验证**

Run:

```powershell
npm run build
```

Expected: PASS。

- [ ] **Step 5: Commit**

```powershell
git add src/shared/data/seed.ts src/manager src/popup src/shared/services
git commit -m "feat: wire seed data and copy usage"
```

---

### Task 13: 视觉落地到原型方向

**Files:**
- Modify: `src/shared/styles/app.css`
- Modify: `src/shared/components/Button.tsx`
- Modify: `src/shared/components/IconButton.tsx`
- Modify: `src/shared/components/PromptCard.tsx`
- Modify: `src/shared/components/SceneList.tsx`
- Modify: `src/shared/components/PromptEditor.tsx`
- Modify: `src/shared/components/VersionHistory.tsx`
- Modify: `src/shared/components/TopBar.tsx`
- Reference: `prototypes/fh-prompt-manager/index.html`

- [ ] **Step 1: 将原型视觉迁移到 CSS**

从原型迁移这些具体规则：

- 顶栏高度 `68px`，白底，底部分隔线，轻阴影。
- 一级导航搜索位于顶栏中部，placeholder 为 `搜索标题、标签、正文`。
- 一级导航右侧为导入、导出、联系作者、明暗模式。
- Manager 资产库没有内容区搜索和筛选条。
- 左侧场景区域宽度约 `318px`。
- 场景项高度约 `64px`，图标约 `42px`，场景名称约 `16px`。
- Prompt 卡片右上角仅显示收藏和复制图标。
- 详情页编辑器使用深色代码编辑器质感。

- [ ] **Step 2: 运行构建**

Run:

```powershell
npm run build
```

Expected: PASS。

- [ ] **Step 3: Playwright 截图验证**

Run:

```powershell
npm run dev
```

在另一个终端运行：

```powershell
New-Item -ItemType Directory -Force -Path output/playwright | Out-Null
npx playwright screenshot --wait-for-timeout=1000 --viewport-size=1440,1000 http://127.0.0.1:5173/manager.html output/playwright/manager-implementation.png
npx playwright screenshot --wait-for-timeout=1000 --viewport-size=420,720 http://127.0.0.1:5173/popup.html output/playwright/popup-implementation.png
```

Expected: 两张截图生成，页面非空，顶栏、场景、卡片、弹窗布局与原型一致。

- [ ] **Step 4: Commit**

```powershell
git add src/shared/styles src/shared/components output/playwright
git commit -m "style: align ui with approved prototype"
```

---

### Task 14: 扩展构建和手动安装验证

**Files:**
- Modify: `README.md`
- Modify: `public/manifest.json`

- [ ] **Step 1: 创建 README**

`README.md` 写入：

```md
# FH Prompt Manager

本地优先的 Chrome/Edge Prompt 管理插件。

## 开发

```powershell
npm install
npm run dev
```

## 构建

```powershell
npm run build
```

构建产物位于 `dist/`。

## 开发者模式安装

1. 打开 Chrome 或 Edge 扩展管理页。
2. 开启开发者模式。
3. 点击“加载已解压的扩展程序”。
4. 选择本项目的 `dist/` 目录。

## 数据说明

数据存储在浏览器 IndexedDB 中。导入导出使用 JSON 文件。插件不使用后端服务，不申请 host permissions。
```

- [ ] **Step 2: 构建扩展**

Run:

```powershell
npm run build
```

Expected: `dist/manifest.json`、`dist/manager.html`、`dist/popup.html` 存在。

- [ ] **Step 3: 检查 manifest 权限**

Run:

```powershell
Get-Content -Raw dist/manifest.json
```

Expected: `"permissions": []`，没有 `host_permissions`，没有 `content_scripts`。

- [ ] **Step 4: 手动安装验证**

在 Chrome 或 Edge 中加载 `dist/`，验证：

- 扩展图标可点击。
- Popup 打开后显示 Fast Use。
- Popup 中点击打开管理页能打开 `manager.html`。
- 资产库能看到种子数据。
- 复制按钮能写入剪贴板。
- 刷新管理页后数据仍存在。

- [ ] **Step 5: Commit**

```powershell
git add README.md public/manifest.json
git commit -m "docs: add extension install instructions"
```

---

## 最终验证清单

- [ ] `npm test` 通过。
- [ ] `npm run lint:types` 通过。
- [ ] `npm run build` 通过。
- [ ] Playwright 截图覆盖 Manager 资产库和 Popup。
- [ ] `dist/manifest.json` 不含 host permissions。
- [ ] 复制最新版本会新增 UsageRecord。
- [ ] 保存 Prompt 正文会创建新版本。
- [ ] Prompt 正文不存储在 `Prompt` 表。
- [ ] Diff 只支持历史版本和 latest。
- [ ] 导入预览不会直接写入数据。
- [ ] 导入合并不会覆盖本地 Scene 图标和颜色。
- [ ] 离开未保存详情页会提示丢弃编辑。

## 自查结果

- 设计文档中的核心要求均映射到任务：本地 IndexedDB、Fast Use、Manager 首页、Prompt 详情、保存即版本、latest-vs-history Diff、合并导入、JSON 导出、最小权限、原型视觉方向。
- 计划未包含草稿、content script、云同步、账号、多级分类、变量表单、恢复旧版本或历史版本互比。
- 类型命名统一使用 `Scene`、`Prompt`、`PromptVersion`、`UsageRecord`、`PromptWithLatest`、`ExportPayload`、`ImportPreview`。
- 执行时若发现某个测试因浏览器 API 缺失失败，应在测试中显式 mock 对应 API，不改变产品行为。
