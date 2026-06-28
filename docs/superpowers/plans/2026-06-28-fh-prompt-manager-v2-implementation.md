# FH Prompt Manager V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Scene-bound Prompt types, image-version Prompt assets, version image previews, image-aware Diff, and ZIP backup import/export.

**Architecture:** Scene owns the Prompt type (`text` or `image`), while PromptVersion owns version content and optional image asset references. Image binary data lives in an IndexedDB `imageAssets` table and is exported as files inside a ZIP package. UI branches by `item.scene.promptType`, preserving the current text Prompt workflow while adding image-first creation, cards, detail layout, version preview, and Diff affordances for image Prompts.

**Tech Stack:** React, TypeScript, Vite, Dexie/IndexedDB, Vitest, Testing Library, JSZip, Web Crypto SHA-256.

---

## File Structure

Modify:

- `package.json`, `package-lock.json`: add `jszip` dependency for browser ZIP import/export.
- `src/shared/constants.ts`: bump DB/export schema versions and add image limits.
- `src/shared/types.ts`: add `PromptType`, `ImageAsset`, ZIP manifest types, image fields on versions, and updated import preview.
- `src/shared/data/db.ts`: add `imageAssets` table and DB version.
- `src/shared/data/repositories.ts`: add image asset repository and delete cleanup helpers.
- `src/test/factories.ts`: add prompt type and image asset factories.
- `src/shared/services/promptService.ts`: enforce Scene type rules and image requirements.
- `src/shared/services/importExportService.ts`: replace JSON merge import/export with ZIP full replacement import/export.
- `src/shared/services/downloadService.ts`: add binary download helper for ZIP blobs.
- `src/manager/ManagerApp.tsx`: pass Scene type and image operations through flows.
- `src/manager/components/SceneFormDialog.tsx`: add Prompt type selector and lock behavior.
- `src/shared/components/SceneList.tsx`: show type chip before Prompt count.
- `src/shared/components/PromptCard.tsx`: render text card or image-first card.
- `src/manager/pages/NewPromptPage.tsx`: add image upload path for image Scenes.
- `src/manager/pages/PromptDetailPage.tsx`: add image detail layout, image replacement state, version preview modal.
- `src/manager/components/PromptWorkspace.tsx`: keep text workspace reusable; accept layout branch where needed.
- `src/shared/components/VersionHistory.tsx`: add version click preview and optional thumbnails.
- `src/manager/pages/DiffPage.tsx`: add image previews above text Diff panes.
- `src/manager/pages/ImportPage.tsx`: accept ZIP, display full replacement preview and validation errors.
- `src/shared/styles/app.css`: add scene chips, image cards, image detail, upload, version preview, and ZIP import styles.

Create:

- `src/shared/services/imageAssetService.ts`: validate images, compute SHA-256, store/retrieve object URLs.
- `src/shared/services/zipBackupService.ts`: ZIP package read/write, manifest validation, path safety.
- `tests/services/imageAssetService.test.ts`: image validation/hash/storage tests.
- `tests/services/zipBackupService.test.ts`: ZIP structure and validation tests.

---

## Task 1: Add ZIP Dependency

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install JSZip**

Run:

```powershell
npm install jszip
```

Expected: `package.json` gains `"jszip"` in dependencies and `package-lock.json` updates.

- [ ] **Step 2: Verify TypeScript still compiles before code changes**

Run:

```powershell
npm run lint:types
```

Expected: existing project type errors, if any, are unrelated to `jszip`. If this fails before V2 changes, record the current failure in the task notes and continue only if the failure is from existing dirty worktree state.

- [ ] **Step 3: Commit dependency**

```powershell
git add package.json package-lock.json
git commit -m "chore: add zip backup dependency"
```

---

## Task 2: Extend Core Types and Constants

**Files:**
- Modify: `src/shared/types.ts`
- Modify: `src/shared/constants.ts`
- Modify: `src/test/factories.ts`
- Test: `tests/data/repositories.test.ts`

- [ ] **Step 1: Add failing type/data tests**

In `tests/data/repositories.test.ts`, add:

```ts
it("stores scene prompt type and image assets", async () => {
  const scene = sceneFactory({ promptType: "image" });
  const asset = imageAssetFactory({ id: "asset-1", mimeType: "image/png" });

  await repositories.scenes.put(scene);
  await repositories.imageAssets.put(asset);

  await expect(repositories.scenes.get(scene.id)).resolves.toMatchObject({ promptType: "image" });
  await expect(repositories.imageAssets.get("asset-1")).resolves.toMatchObject({
    id: "asset-1",
    mimeType: "image/png",
    size: asset.size,
    sha256: asset.sha256
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- tests/data/repositories.test.ts
```

Expected: FAIL because `imageAssetFactory`, `repositories.imageAssets`, and `Scene.promptType` do not exist.

- [ ] **Step 3: Update constants**

In `src/shared/constants.ts`, set:

```ts
export const DB_VERSION = 3;
export const EXPORT_SCHEMA_VERSION = 2;

export const IMAGE_LIMITS = {
  maxImageBytes: 10 * 1024 * 1024,
  maxZipBytes: 200 * 1024 * 1024,
  allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"] as const
};
```

- [ ] **Step 4: Update shared types**

In `src/shared/types.ts`, add:

```ts
export type PromptType = "text" | "image";

export interface Scene {
  id: Id;
  name: string;
  description: string;
  icon: SceneIcon;
  color: SceneColor;
  promptType: PromptType;
  sortOrder: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface PromptVersion {
  id: Id;
  promptId: Id;
  versionNumber: number;
  customVersionLabel?: string;
  content: string;
  description: string;
  tags: StoredPromptTag[];
  note: string;
  imageAssetId?: Id;
  createdAt: IsoDateString;
}

export interface ImageAsset {
  id: Id;
  mimeType: (typeof import("./constants").IMAGE_LIMITS.allowedMimeTypes)[number];
  size: number;
  sha256: string;
  blob: Blob;
  createdAt: IsoDateString;
}

export interface ExportPayload {
  schemaVersion: 2;
  exportedAt: IsoDateString;
  scenes: Scene[];
  prompts: Prompt[];
  versions: PromptVersion[];
  usageRecords: UsageRecord[];
}

export interface ZipBackupAssetManifest {
  id: Id;
  path: string;
  mimeType: ImageAsset["mimeType"];
  size: number;
  sha256: string;
}

export interface ZipBackupManifest {
  app: "fh-prompt-manager";
  schemaVersion: 2;
  exportedAt: IsoDateString;
  counts: {
    scenes: number;
    prompts: number;
    versions: number;
    usageRecords: number;
    imageAssets: number;
  };
  assets: ZipBackupAssetManifest[];
}

export interface ImportPreview {
  scenes: number;
  prompts: number;
  versions: number;
  usageRecords: number;
  imageAssets: number;
  warnings: string[];
}
```

If TypeScript rejects the inline `import("./constants")` type expression, use:

```ts
export type ImageMimeType = "image/png" | "image/jpeg" | "image/webp";
```

and set `ImageAsset.mimeType: ImageMimeType`.

- [ ] **Step 5: Update factories**

In `src/test/factories.ts`, make `sceneFactory` default to text and add an image asset factory:

```ts
export function sceneFactory(overrides: Partial<Scene> = {}): Scene {
  return Object.assign({
    id: "scene-code",
    name: "代码重构",
    description: "审查、迁移、重构",
    icon: "code",
    color: "blue",
    promptType: "text",
    sortOrder: 1,
    createdAt: "2026-06-26T00:00:00.000Z",
    updatedAt: "2026-06-26T00:00:00.000Z"
  }, overrides);
}

export function imageAssetFactory(overrides: Partial<ImageAsset> = {}): ImageAsset {
  const blob = new Blob(["image-bytes"], { type: "image/png" });
  return Object.assign({
    id: "asset-cover",
    mimeType: "image/png",
    size: blob.size,
    sha256: "hash-cover",
    blob,
    createdAt: "2026-06-26T00:00:00.000Z"
  }, overrides);
}
```

- [ ] **Step 6: Run tests**

Run:

```powershell
npm test -- tests/data/repositories.test.ts
```

Expected: still fails until DB and repository table are added in Task 3.

- [ ] **Step 7: Do not commit yet**

Task 2 and Task 3 commit together because type additions need DB/repository support to compile.

---

## Task 3: Add ImageAsset IndexedDB Table and Repository Helpers

**Files:**
- Modify: `src/shared/data/db.ts`
- Modify: `src/shared/data/repositories.ts`
- Test: `tests/data/repositories.test.ts`

- [ ] **Step 1: Add Dexie image asset table**

In `src/shared/data/db.ts`, update imports and class:

```ts
import type { ImageAsset, Prompt, PromptVersion, Scene, UsageRecord } from "../types";

export class FhPromptDatabase extends Dexie {
  scenes!: Table<Scene, string>;
  prompts!: Table<Prompt, string>;
  versions!: Table<PromptVersion, string>;
  imageAssets!: Table<ImageAsset, string>;
  usageRecords!: Table<UsageRecord, string>;

  constructor(name = DB_NAME) {
    super(name);
    this.version(DB_VERSION).stores({
      scenes: "id, name, promptType, sortOrder, updatedAt",
      prompts: "id, sceneId, title, latestVersionId, latestVersionNumber, sortOrder, lastUsedAt, updatedAt",
      versions: "id, promptId, versionNumber, imageAssetId, createdAt",
      imageAssets: "id, mimeType, sha256, createdAt",
      usageRecords: "id, promptId, versionId, usedAt, source"
    });
  }
}
```

Because there is no historical data compatibility requirement, remove the old `version(1)` and `version(2)` upgrade blocks instead of carrying migration code forward.

- [ ] **Step 2: Add repository helpers**

In `src/shared/data/repositories.ts`, import `ImageAsset` and add:

```ts
imageAssets: {
  list: () => db.imageAssets.toArray(),
  get: (id: string) => db.imageAssets.get(id),
  put: (asset: ImageAsset) => db.imageAssets.put(asset),
  bulkPut: (assets: ImageAsset[]) => db.imageAssets.bulkPut(assets),
  bulkDelete: (ids: string[]) => db.imageAssets.bulkDelete(ids),
  clear: () => db.imageAssets.clear()
}
```

Update `prompts.deleteWithVersions` to clean image assets referenced only by the deleted Prompt:

```ts
async deleteWithVersions(promptId: string) {
  await db.transaction("rw", db.prompts, db.versions, db.imageAssets, db.usageRecords, async () => {
    const versions = await db.versions.where("promptId").equals(promptId).toArray();
    const candidateAssetIds = Array.from(new Set(versions.flatMap((version) => version.imageAssetId ? [version.imageAssetId] : [])));
    await db.prompts.delete(promptId);
    await db.versions.where("promptId").equals(promptId).delete();
    await db.usageRecords.where("promptId").equals(promptId).delete();
    for (const assetId of candidateAssetIds) {
      const stillUsed = await db.versions.where("imageAssetId").equals(assetId).count();
      if (!stillUsed) await db.imageAssets.delete(assetId);
    }
  });
}
```

- [ ] **Step 3: Run repository tests**

Run:

```powershell
npm test -- tests/data/repositories.test.ts
```

Expected: PASS for repository tests.

- [ ] **Step 4: Run type check**

Run:

```powershell
npm run lint:types
```

Expected: FAIL only in callers that still construct Scene without `promptType`; fix compile errors by adding `promptType: "text"` in local test fixtures or seed data, then rerun until PASS.

- [ ] **Step 5: Commit data model**

```powershell
git add src/shared/types.ts src/shared/constants.ts src/shared/data/db.ts src/shared/data/repositories.ts src/test/factories.ts tests/data/repositories.test.ts
git commit -m "feat: add prompt types and image asset storage"
```

---

## Task 4: Implement Image Asset Service

**Files:**
- Create: `src/shared/services/imageAssetService.ts`
- Test: `tests/services/imageAssetService.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/services/imageAssetService.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "../../src/shared/data/db";
import { repositories } from "../../src/shared/data/repositories";
import { imageAssetService } from "../../src/shared/services/imageAssetService";

describe("imageAssetService", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("stores valid image files with sha256 metadata", async () => {
    const file = new File(["valid-image"], "cover.png", { type: "image/png" });

    const asset = await imageAssetService.createFromFile(file);

    expect(asset.id).toMatch(/[0-9a-f-]{20,}/i);
    expect(asset.mimeType).toBe("image/png");
    expect(asset.size).toBe(file.size);
    expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
    await expect(repositories.imageAssets.get(asset.id)).resolves.toMatchObject({
      id: asset.id,
      mimeType: "image/png",
      size: file.size,
      sha256: asset.sha256
    });
  });

  it("rejects unsupported and oversized images", async () => {
    await expect(imageAssetService.createFromFile(new File(["x"], "bad.svg", { type: "image/svg+xml" })))
      .rejects.toThrow("仅支持 PNG、JPG、WebP 图片。");

    const large = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png", { type: "image/png" });
    await expect(imageAssetService.createFromFile(large)).rejects.toThrow("图片不能超过 10MB。");
  });

  it("creates object urls for stored assets", async () => {
    const asset = await imageAssetService.createFromFile(new File(["valid-image"], "cover.webp", { type: "image/webp" }));

    const url = await imageAssetService.createObjectUrl(asset.id);

    expect(url.startsWith("blob:")).toBe(true);
    URL.revokeObjectURL(url);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npm test -- tests/services/imageAssetService.test.ts
```

Expected: FAIL because `imageAssetService` does not exist.

- [ ] **Step 3: Implement service**

Create `src/shared/services/imageAssetService.ts`:

```ts
import { IMAGE_LIMITS } from "../constants";
import { repositories } from "../data/repositories";
import type { ImageAsset, ImageMimeType } from "../types";

function now() {
  return new Date().toISOString();
}

function id() {
  return crypto.randomUUID();
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function isAllowedMimeType(type: string): type is ImageMimeType {
  return (IMAGE_LIMITS.allowedMimeTypes as readonly string[]).includes(type);
}

export const imageAssetService = {
  async sha256(blob: Blob) {
    return toHex(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()));
  },

  validateFile(file: File | Blob) {
    if (!isAllowedMimeType(file.type)) throw new Error("仅支持 PNG、JPG、WebP 图片。");
    if (file.size > IMAGE_LIMITS.maxImageBytes) throw new Error("图片不能超过 10MB。");
  },

  async createFromFile(file: File): Promise<ImageAsset> {
    this.validateFile(file);
    const asset: ImageAsset = {
      id: id(),
      mimeType: file.type,
      size: file.size,
      sha256: await this.sha256(file),
      blob: file,
      createdAt: now()
    };
    await repositories.imageAssets.put(asset);
    return asset;
  },

  async createObjectUrl(assetId: string) {
    const asset = await repositories.imageAssets.get(assetId);
    if (!asset) throw new Error("Image asset not found.");
    return URL.createObjectURL(asset.blob);
  }
};
```

- [ ] **Step 4: Run image asset tests**

Run:

```powershell
npm test -- tests/services/imageAssetService.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit image asset service**

```powershell
git add src/shared/services/imageAssetService.ts tests/services/imageAssetService.test.ts
git commit -m "feat: add image asset service"
```

---

## Task 5: Enforce Scene Prompt Type Rules in Prompt Service

**Files:**
- Modify: `src/shared/services/promptService.ts`
- Test: `tests/services/promptService.test.ts`

- [ ] **Step 1: Add failing service tests**

In `tests/services/promptService.test.ts`, add:

```ts
it("requires image assets when creating prompts in image scenes", async () => {
  await repositories.scenes.put(sceneFactory({ id: "scene-image", promptType: "image" }));

  await expect(promptService.createPrompt({
    sceneId: "scene-image",
    title: "Image Prompt",
    description: "亮点",
    tags: [],
    favorite: false,
    content: "生成图片",
    note: "初始版本"
  })).rejects.toThrow("生图 Prompt 必须上传一张图片。");
});

it("stores image asset references on image prompt versions and carries the image forward", async () => {
  await repositories.scenes.put(sceneFactory({ id: "scene-image", promptType: "image" }));
  await repositories.imageAssets.put(imageAssetFactory({ id: "asset-v1" }));

  const prompt = await promptService.createPrompt({
    sceneId: "scene-image",
    title: "Image Prompt",
    description: "亮点",
    tags: [],
    favorite: false,
    content: "生成图片",
    note: "初始版本",
    imageAssetId: "asset-v1"
  });

  const v1 = await repositories.versions.get(prompt.latestVersionId);
  expect(v1?.imageAssetId).toBe("asset-v1");

  const updated = await promptService.saveNewVersion(prompt.id, {
    content: "生成图片 v2",
    description: "亮点 v2",
    tags: [],
    note: "手动保存"
  });

  const v2 = await repositories.versions.get(updated.latestVersionId);
  expect(v2?.imageAssetId).toBe("asset-v1");
});

it("rejects image assets on text prompt versions", async () => {
  await repositories.scenes.put(sceneFactory({ promptType: "text" }));

  await expect(promptService.createPrompt({
    sceneId: "scene-code",
    title: "Text Prompt",
    description: "亮点",
    tags: [],
    favorite: false,
    content: "文本",
    note: "初始版本",
    imageAssetId: "asset-v1"
  })).rejects.toThrow("文本 Prompt 不能绑定图片。");
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npm test -- tests/services/promptService.test.ts
```

Expected: FAIL because `createPrompt` and `saveNewVersion` do not accept or enforce `imageAssetId`.

- [ ] **Step 3: Update prompt service signatures**

In `src/shared/services/promptService.ts`, update input types:

```ts
async createPrompt(input: {
  sceneId: string;
  title: string;
  description: string;
  tags: PromptTag[];
  favorite: boolean;
  content: string;
  note: string;
  imageAssetId?: string;
}): Promise<Prompt>
```

and:

```ts
async saveNewVersion(
  promptId: string,
  input: {
    content: string;
    description: string;
    tags: PromptTag[];
    note: string;
    customVersionLabel?: string;
    imageAssetId?: string;
  }
): Promise<Prompt>
```

- [ ] **Step 4: Add type validation helpers**

Add near the top of `promptService.ts`:

```ts
async function getSceneOrThrow(sceneId: string) {
  const scene = await repositories.scenes.get(sceneId);
  if (!scene) throw new Error("Scene not found.");
  return scene;
}

function resolveVersionImageAssetId(scenePromptType: PromptType, inputImageAssetId: string | undefined, previousImageAssetId?: string) {
  if (scenePromptType === "text") {
    if (inputImageAssetId) throw new Error("文本 Prompt 不能绑定图片。");
    return undefined;
  }
  const nextImageAssetId = inputImageAssetId || previousImageAssetId;
  if (!nextImageAssetId) throw new Error("生图 Prompt 必须上传一张图片。");
  return nextImageAssetId;
}
```

- [ ] **Step 5: Use validation in create/save**

In `createPrompt`, before building `version`:

```ts
const scene = await getSceneOrThrow(input.sceneId);
const imageAssetId = resolveVersionImageAssetId(scene.promptType, input.imageAssetId);
```

Set the version field:

```ts
const version: PromptVersion = {
  id: versionId,
  promptId,
  versionNumber: 1,
  content: input.content,
  description: input.description,
  tags: input.tags,
  note: input.note,
  imageAssetId,
  createdAt: timestamp
};
```

In `saveNewVersion`, load latest version and scene:

```ts
const latestVersion = await repositories.versions.get(prompt.latestVersionId);
const scene = await getSceneOrThrow(prompt.sceneId);
const imageAssetId = resolveVersionImageAssetId(scene.promptType, input.imageAssetId, latestVersion?.imageAssetId);
```

Set `imageAssetId` on the new version.

- [ ] **Step 6: Run prompt service tests**

Run:

```powershell
npm test -- tests/services/promptService.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit service rules**

```powershell
git add src/shared/services/promptService.ts tests/services/promptService.test.ts
git commit -m "feat: enforce prompt type image rules"
```

---

## Task 6: Scene Type Selector and Type Display

**Files:**
- Modify: `src/manager/components/SceneFormDialog.tsx`
- Modify: `src/shared/components/SceneList.tsx`
- Modify: `src/manager/pages/LibraryPage.tsx`
- Modify: `src/shared/styles/app.css`
- Test: `tests/ui/SceneFormDialog.test.tsx`
- Test: `tests/ui/LibraryPage.test.tsx`

- [ ] **Step 1: Add failing UI tests**

In `tests/ui/SceneFormDialog.test.tsx`, add:

```ts
it("defaults new scenes to text and allows selecting image type", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();

  render(<SceneFormDialog scene={null} promptCount={0} onCancel={vi.fn()} onSave={onSave} />);

  expect(screen.getByRole("radio", { name: /文本/ })).toBeChecked();
  await user.click(screen.getByRole("radio", { name: /生图/ }));
  await user.type(screen.getByLabelText("场景名称"), "视觉海报");
  await user.type(screen.getByLabelText("场景摘要"), "封面与海报");
  await user.click(screen.getByRole("button", { name: "保存场景" }));

  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
    name: "视觉海报",
    description: "封面与海报",
    promptType: "image"
  }));
});

it("locks scene type when prompt count is greater than zero", () => {
  render(<SceneFormDialog scene={sceneFactory({ promptType: "image" })} promptCount={3} onCancel={vi.fn()} onSave={vi.fn()} />);

  expect(screen.getByRole("radio", { name: /文本/ })).toBeDisabled();
  expect(screen.getByRole("radio", { name: /生图/ })).toBeDisabled();
  expect(screen.getByText("已有 Prompt，类型不可修改")).toBeInTheDocument();
});
```

In `tests/ui/LibraryPage.test.tsx`, add:

```ts
expect(screen.getByText("生图")).toHaveClass("scene-type-chip");
expect(screen.getByText("8个提示词")).toBeInTheDocument();
expect(screen.getByText("视觉海报").closest(".page-head")).toHaveTextContent("生图");
```

Use `sceneFactory({ name: "视觉海报", promptType: "image" })` in the test setup.

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npm test -- tests/ui/SceneFormDialog.test.tsx tests/ui/LibraryPage.test.tsx
```

Expected: FAIL because `promptCount`, `promptType`, and chips are not implemented.

- [ ] **Step 3: Update SceneForm input**

In `SceneFormDialog.tsx`, update:

```ts
export interface SceneFormInput {
  name: string;
  description: string;
  icon: SceneIcon;
  color: SceneColor;
  promptType: PromptType;
}
```

Add prop:

```ts
promptCount?: number;
```

Initialize:

```ts
const [promptType, setPromptType] = useState<PromptType>(scene?.promptType ?? "text");
const isPromptTypeLocked = Boolean(scene && (promptCount ?? 0) > 0);
```

Submit:

```ts
onSave({ name: name.trim(), description: description.trim(), icon, color, promptType });
```

- [ ] **Step 4: Add type controls**

Place after summary field:

```tsx
<fieldset className="field scene-type-field">
  <legend>Prompt 类型</legend>
  <label className={promptType === "text" ? "type-option active" : "type-option"}>
    <input
      type="radio"
      checked={promptType === "text"}
      disabled={isPromptTypeLocked}
      onChange={() => setPromptType("text")}
    />
    <span>文本</span>
    <small>传统文本 Prompt</small>
  </label>
  <label className={promptType === "image" ? "type-option active" : "type-option"}>
    <input
      type="radio"
      checked={promptType === "image"}
      disabled={isPromptTypeLocked}
      onChange={() => setPromptType("image")}
    />
    <span>生图</span>
    <small>每个版本绑定一张图片</small>
  </label>
  {isPromptTypeLocked && <p className="field-hint">已有 Prompt，类型不可修改</p>}
</fieldset>
```

- [ ] **Step 5: Pass prompt count from ManagerApp**

In `ManagerApp.tsx`, render `SceneFormDialog` with:

```tsx
promptCount={sceneFormScene ? (sceneCounts[sceneFormScene.id] ?? 0) : 0}
```

Update `createScene` to set `promptType: input.promptType`; update `editScene` to preserve locked type:

```ts
promptType: (sceneCounts[sceneId] ?? 0) > 0 ? scene.promptType : input.promptType,
```

- [ ] **Step 6: Update SceneList and Library heading**

In `SceneList.tsx`, add type chip before count:

```tsx
<span className="scene-count-line">
  <span className={scene.promptType === "image" ? "scene-type-chip image" : "scene-type-chip text"}>
    {scene.promptType === "image" ? "生图" : "文本"}
  </span>
  <span>{promptCount}个提示词</span>
</span>
```

In `LibraryPage.tsx`, add a type badge near `<h1>`:

```tsx
<div className="page-title-row">
  <h1>{selectedScene ? selectedScene.name : "资产库"}</h1>
  {selectedScene && (
    <span className={selectedScene.promptType === "image" ? "type-badge image" : "type-badge text"}>
      {selectedScene.promptType === "image" ? "生图" : "文本"}
    </span>
  )}
</div>
```

- [ ] **Step 7: Add CSS**

Add to `src/shared/styles/app.css`:

```css
.scene-count-line {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.scene-type-chip,
.type-badge {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 1;
  font-weight: 800;
}

.scene-type-chip.image,
.type-badge.image {
  background: var(--orange-bg);
  color: var(--orange);
}

.scene-type-chip.text,
.type-badge.text {
  background: var(--blue-50);
  color: var(--blue);
}

.page-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
```

- [ ] **Step 8: Run UI tests**

Run:

```powershell
npm test -- tests/ui/SceneFormDialog.test.tsx tests/ui/LibraryPage.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit scene type UI**

```powershell
git add src/manager/components/SceneFormDialog.tsx src/shared/components/SceneList.tsx src/manager/pages/LibraryPage.tsx src/manager/ManagerApp.tsx src/shared/styles/app.css tests/ui/SceneFormDialog.test.tsx tests/ui/LibraryPage.test.tsx
git commit -m "feat: add scene prompt type controls"
```

---

## Task 7: Image Prompt Creation Flow

**Files:**
- Modify: `src/manager/pages/NewPromptPage.tsx`
- Modify: `src/manager/ManagerApp.tsx`
- Modify: `src/shared/styles/app.css`
- Test: `tests/ui/ManagerApp.test.tsx`
- Test: `tests/ui/PromptEditor.test.tsx`

- [ ] **Step 1: Add failing creation tests**

In `tests/ui/ManagerApp.test.tsx`, add:

```ts
it("requires an image when creating a prompt in an image scene", async () => {
  const user = userEvent.setup();
  await seedScene(sceneFactory({ id: "scene-image", name: "视觉海报", promptType: "image" }));

  render(<ManagerApp />);
  await user.click(await screen.findByText("视觉海报"));
  await user.click(screen.getByRole("button", { name: /新建/ }));

  expect(screen.getByText("生图")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /保存/ })).toBeDisabled();

  await user.type(screen.getByLabelText("Prompt 标题"), "柔光人像");
  await user.type(screen.getByLabelText("提示词正文"), "生成一张人像");
  expect(screen.getByRole("button", { name: /保存/ })).toBeDisabled();
});
```

Add a second test that uploads a file:

```ts
const file = new File(["image"], "cover.png", { type: "image/png" });
await user.upload(screen.getByLabelText("上传版本图片"), file);
expect(screen.getByRole("button", { name: /保存/ })).toBeEnabled();
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npm test -- tests/ui/ManagerApp.test.tsx
```

Expected: FAIL because new image creation UI does not exist.

- [ ] **Step 3: Update NewPromptPage props and state**

Add props:

```ts
scene: Scene;
onSave: (input: { title: string; description: string; tags: PromptTag[]; content: string; imageFile?: File }) => void;
```

Add state:

```ts
const [imageFile, setImageFile] = useState<File | null>(null);
const isImagePrompt = scene.promptType === "image";
const canSave = Boolean(title.trim() && content.trim() && (!isImagePrompt || imageFile));
```

- [ ] **Step 4: Add upload panel**

Render before `PromptWorkspace` when `isImagePrompt`:

```tsx
<section className="image-upload-panel">
  <label className="image-upload-drop">
    <Image className="icon" />
    <strong>{imageFile ? imageFile.name : "上传一张生成效果图"}</strong>
    <span>PNG、JPG、WebP，最大 10MB</span>
    <input
      aria-label="上传版本图片"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
    />
  </label>
</section>
```

Call save with:

```ts
onSave({ title, description, tags, content, imageFile: imageFile ?? undefined });
```

- [ ] **Step 5: Wire ManagerApp image asset creation**

In `ManagerApp.createPrompt`, before calling `promptService.createPrompt`:

```ts
const selectedScene = scenes.find((scene) => scene.id === selectedSceneId);
if (!selectedScene) return;
const imageAsset = input.imageFile ? await imageAssetService.createFromFile(input.imageFile) : undefined;
```

Pass `imageAssetId: imageAsset?.id`.

When rendering `NewPromptPage`, pass `scene={scenes.find((scene) => scene.id === selectedSceneId)!}` and render the page only when selected scene exists.

- [ ] **Step 6: Add CSS**

Add:

```css
.image-upload-panel {
  padding: 20px;
  background: #eef2f7;
}

.image-upload-drop {
  display: grid;
  place-items: center;
  min-height: 180px;
  gap: 8px;
  padding: 20px;
  border: 1px dashed #93c5fd;
  border-radius: var(--radius);
  background: #f8fbff;
  color: var(--muted);
  text-align: center;
}

.image-upload-drop strong {
  color: var(--text);
}

.image-upload-drop input {
  max-width: 280px;
}
```

- [ ] **Step 7: Run tests**

Run:

```powershell
npm test -- tests/ui/ManagerApp.test.tsx
```

Expected: PASS for new creation behavior.

- [ ] **Step 8: Commit image creation flow**

```powershell
git add src/manager/pages/NewPromptPage.tsx src/manager/ManagerApp.tsx src/shared/styles/app.css tests/ui/ManagerApp.test.tsx
git commit -m "feat: add image prompt creation flow"
```

---

## Task 8: Image Prompt Cards

**Files:**
- Modify: `src/shared/components/PromptCard.tsx`
- Modify: `src/manager/pages/LibraryPage.tsx`
- Modify: `src/shared/styles/app.css`
- Test: `tests/ui/LibraryPage.test.tsx`

- [ ] **Step 1: Add failing card tests**

In `tests/ui/LibraryPage.test.tsx`, add:

```ts
it("renders image prompts as image-first cards", () => {
  render(<LibraryPage
    scenes={[sceneFactory({ id: "scene-image", promptType: "image" })]}
    selectedSceneId="scene-image"
    sceneCounts={{ "scene-image": 1 }}
    prompts={[promptWithLatestFactory({
      scene: sceneFactory({ id: "scene-image", promptType: "image" }),
      latestVersion: versionFactory({ imageAssetId: "asset-cover" })
    })]}
    imageUrls={{ "asset-cover": "blob:cover" }}
    isSortingScenes={false}
    isSortingPrompts={false}
    onSelectScene={vi.fn()}
    onOpenPrompt={vi.fn()}
    onCopyPrompt={vi.fn()}
    onTogglePromptFavorite={vi.fn()}
    onCreatePrompt={vi.fn()}
    onCreateScene={vi.fn()}
    onEditScene={vi.fn()}
    onDeleteScene={vi.fn()}
    onToggleSceneSort={vi.fn()}
    onReorderScene={vi.fn()}
    onTogglePromptSort={vi.fn()}
    onReorderPrompt={vi.fn()}
  />);

  expect(screen.getByAltText("Code Refactor Helper 封面")).toHaveAttribute("src", "blob:cover");
  expect(screen.getByTestId("image-prompt-card")).toHaveTextContent("Code Refactor Helper");
  expect(screen.getByTestId("image-prompt-card")).toHaveTextContent("v1");
  expect(screen.getByTestId("image-prompt-card")).not.toHaveTextContent("review");
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npm test -- tests/ui/LibraryPage.test.tsx
```

Expected: FAIL because card has no image branch.

- [ ] **Step 3: Add image URL prop**

In `LibraryPage`, accept:

```ts
imageUrls?: Record<string, string>;
```

Pass to `PromptCard`.

In `ManagerApp`, keep an `imageUrls` state map:

```ts
const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
```

After `items` refresh, create object URLs for latest image versions and revoke old URLs in cleanup.

- [ ] **Step 4: Branch PromptCard by Scene type**

In `PromptCard.tsx`, add:

```tsx
const isImagePrompt = item.scene.promptType === "image";
const imageUrl = item.latestVersion.imageAssetId ? imageUrls?.[item.latestVersion.imageAssetId] : undefined;

if (isImagePrompt) {
  return (
    <article className="image-prompt-card" data-testid="image-prompt-card" onClick={openCard}>
      <div className="image-card-media">
        {imageUrl ? <img src={imageUrl} alt={`${item.prompt.title} 封面`} /> : <div className="image-card-missing">图片缺失</div>}
        {!isSorting && (
          <div className="image-card-actions">
            <IconButton
              className={item.prompt.favorite ? "favorite-active" : undefined}
              label={favoriteLabel}
              icon={<Star className="icon" fill={item.prompt.favorite ? "currentColor" : "none"} />}
              onClick={(event) => {
                event.stopPropagation();
                onToggleFavorite();
              }}
            />
            <IconButton
              label="复制最新版本"
              icon={<Copy className="icon" />}
              onClick={(event) => {
                event.stopPropagation();
                onCopy();
              }}
            />
          </div>
        )}
      </div>
      <div className="image-card-body">
        <h2>{item.prompt.title}</h2>
        <span className="image-card-version">v{item.prompt.latestVersionNumber}</span>
      </div>
    </article>
  );
}
```

Use the existing favorite/copy buttons in `image-card-actions`. Do not render card tags, updated date, or "生图" inside the image card.

- [ ] **Step 5: Add CSS**

Use the reviewed prototype values:

```css
.image-prompt-card {
  display: grid;
  grid-template-rows: minmax(0, 1fr) 48px;
  min-height: 320px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--panel);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
  cursor: pointer;
}

.image-card-media {
  position: relative;
  overflow: hidden;
  background: #e2e8f0;
}

.image-card-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-card-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
}

.image-card-actions .icon-btn {
  width: 34px;
  height: 34px;
  border-color: rgba(255, 255, 255, 0.58);
  background: rgba(255, 255, 255, 0.9);
}

.image-card-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 48px;
  padding: 8px 12px;
  border-top: 1px solid var(--line-soft);
}

.image-card-body h2 {
  overflow: hidden;
  min-width: 0;
  margin: 0;
  color: #0f172a;
  font-size: 15px;
  line-height: 1.2;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-card-version {
  flex: none;
  color: #475569;
  font-size: 13px;
  font-weight: 800;
}
```

- [ ] **Step 6: Run card tests**

Run:

```powershell
npm test -- tests/ui/LibraryPage.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit image cards**

```powershell
git add src/shared/components/PromptCard.tsx src/manager/pages/LibraryPage.tsx src/manager/ManagerApp.tsx src/shared/styles/app.css tests/ui/LibraryPage.test.tsx
git commit -m "feat: render image prompt cards"
```

---

## Task 9: Image Detail Layout and Save-New-Version Image Replacement

**Files:**
- Modify: `src/manager/pages/PromptDetailPage.tsx`
- Modify: `src/manager/ManagerApp.tsx`
- Modify: `src/shared/styles/app.css`
- Test: `tests/ui/PromptDetailPage.test.tsx`

- [ ] **Step 1: Add failing detail tests**

In `tests/ui/PromptDetailPage.test.tsx`, add:

```ts
it("renders image prompt detail with image preview and type badge", async () => {
  render(<PromptDetailPage
    item={{
      prompt: promptFactory({ latestVersionId: "version-image" }),
      latestVersion: versionFactory({ id: "version-image", imageAssetId: "asset-cover" }),
      scene: sceneFactory({ promptType: "image", name: "视觉海报" })
    }}
    versions={[versionFactory({ id: "version-image", imageAssetId: "asset-cover" })]}
    imageUrls={{ "asset-cover": "blob:cover" }}
    onBack={vi.fn()}
    onCopyLatest={vi.fn()}
    onDelete={vi.fn()}
    onSaveVersion={vi.fn()}
    onSaveMetadata={vi.fn()}
    onSaveLatestVersionMetadata={vi.fn()}
    onToggleFavorite={vi.fn()}
    onCopyEditor={vi.fn()}
    onDownloadEditor={vi.fn()}
    onCompareToLatest={vi.fn()}
    onCopyVersion={vi.fn()}
  />);

  expect(screen.getByText("生图")).toBeInTheDocument();
  expect(screen.getByAltText("Code Refactor Helper 当前版本图片")).toHaveAttribute("src", "blob:cover");
  expect(screen.getByLabelText("替换版本图片")).toBeInTheDocument();
});

it("passes uploaded image file when saving a new image prompt version", async () => {
  const user = userEvent.setup();
  const onSaveVersion = vi.fn();
  render(<PromptDetailPage
    item={{
      prompt: promptFactory({ latestVersionId: "version-image" }),
      latestVersion: versionFactory({ id: "version-image", imageAssetId: "asset-cover" }),
      scene: sceneFactory({ promptType: "image" })
    }}
    versions={[versionFactory({ id: "version-image", imageAssetId: "asset-cover" })]}
    imageUrls={{ "asset-cover": "blob:cover" }}
    onSaveVersion={onSaveVersion}
    onBack={vi.fn()}
    onCopyLatest={vi.fn()}
    onDelete={vi.fn()}
    onSaveMetadata={vi.fn()}
    onSaveLatestVersionMetadata={vi.fn()}
    onToggleFavorite={vi.fn()}
    onCopyEditor={vi.fn()}
    onDownloadEditor={vi.fn()}
    onCompareToLatest={vi.fn()}
    onCopyVersion={vi.fn()}
  />);

  const file = new File(["new-image"], "new.png", { type: "image/png" });
  await user.upload(screen.getByLabelText("替换版本图片"), file);
  await user.click(screen.getByRole("button", { name: "保存新版本" }));
  await user.click(screen.getByRole("button", { name: "确认保存" }));

  expect(onSaveVersion).toHaveBeenCalledWith(expect.objectContaining({ imageFile: file }));
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npm test -- tests/ui/PromptDetailPage.test.tsx
```

Expected: FAIL because image detail branch does not exist.

- [ ] **Step 3: Update detail props**

In `PromptDetailPage`, add:

```ts
imageUrls?: Record<string, string>;
onSaveVersion: (input: {
  content: string;
  description: string;
  tags: PromptTag[];
  customVersionLabel?: string;
  imageFile?: File;
}) => void;
```

Add state:

```ts
const [replacementImageFile, setReplacementImageFile] = useState<File | null>(null);
const isImagePrompt = item.scene.promptType === "image";
const currentImageUrl = item.latestVersion.imageAssetId ? imageUrls?.[item.latestVersion.imageAssetId] : undefined;
```

- [ ] **Step 4: Render image detail grid**

When `isImagePrompt`, render:

```tsx
<div className="image-detail-grid">
  <section className="preview-panel">
    <div className="preview-toolbar">
      <strong>版本图片</strong>
      <label className="btn">
        替换为新版本图片
        <input
          aria-label="替换版本图片"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => setReplacementImageFile(event.target.files?.[0] ?? null)}
        />
      </label>
    </div>
    <div className="preview-image-wrap">
      {currentImageUrl && <img src={currentImageUrl} alt={`${item.prompt.title} 当前版本图片`} />}
    </div>
    {replacementImageFile && <p className="image-replacement-note">保存新版本后将使用 {replacementImageFile.name}</p>}
  </section>
  <PromptWorkspace
    content={content}
    description={description}
    tags={tags}
    versions={versions}
    latestVersionId={item.prompt.latestVersionId}
    onChangeContent={setContent}
    onChangeDescription={setDescription}
    onChangeTags={handleTagsChange}
    onCopyEditor={onCopyEditor}
    onDownloadEditor={onDownloadEditor}
    onCompareToLatest={onCompareToLatest}
    imageUrls={imageUrls}
    onPreviewVersion={setPreviewVersionId}
  />
</div>
```

If `PromptWorkspace` cannot be placed as the middle column without wrapping the right panel, split its internals into reusable `PromptEditorPanel` and `PromptMetadataPanel` in the same task. Keep the split limited to moving existing JSX, not changing behavior.

- [ ] **Step 5: Include image file in save**

In `confirmSaveVersion`, include:

```ts
imageFile: replacementImageFile ?? undefined
```

Reset `replacementImageFile` in the existing `useEffect` that responds to latest version changes.

- [ ] **Step 6: ManagerApp creates replacement asset**

In `ManagerApp` `onSaveVersion`, before `promptService.saveNewVersion`:

```ts
const imageAsset = content.imageFile ? await imageAssetService.createFromFile(content.imageFile) : undefined;
await promptService.saveNewVersion(selectedItem.prompt.id, {
  content: content.content,
  description: content.description,
  tags: content.tags,
  customVersionLabel: content.customVersionLabel,
  imageAssetId: imageAsset?.id,
  note: "手动保存"
});
```

- [ ] **Step 7: Add CSS**

Use the prototype classes:

```css
.image-detail-grid {
  display: grid;
  grid-template-columns: minmax(300px, 0.95fr) minmax(390px, 1.15fr) 390px;
  gap: 20px;
  align-items: start;
  min-height: calc(100vh - 156px);
  padding: 20px;
  background: #eef2f7;
}

.preview-panel {
  overflow: hidden;
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 50px;
  padding: 0 14px;
  border-bottom: 1px solid var(--line-soft);
}

.preview-image-wrap {
  aspect-ratio: 4 / 3;
  background: #e2e8f0;
}

.preview-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

- [ ] **Step 8: Run detail tests**

Run:

```powershell
npm test -- tests/ui/PromptDetailPage.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit detail image flow**

```powershell
git add src/manager/pages/PromptDetailPage.tsx src/manager/ManagerApp.tsx src/shared/styles/app.css tests/ui/PromptDetailPage.test.tsx
git commit -m "feat: add image prompt detail layout"
```

---

## Task 10: Version History Read-Only Preview Modal

**Files:**
- Modify: `src/shared/components/VersionHistory.tsx`
- Modify: `src/manager/pages/PromptDetailPage.tsx`
- Modify: `src/shared/styles/app.css`
- Test: `tests/ui/PromptDetailPage.test.tsx`

- [ ] **Step 1: Add failing preview tests**

In `tests/ui/PromptDetailPage.test.tsx`, add:

```ts
it("opens a read-only version preview and only exposes copy action", async () => {
  const user = userEvent.setup();
  const onCopyVersion = vi.fn();
  const version = versionFactory({ id: "version-image", imageAssetId: "asset-cover", content: "历史提示词" });

  render(<PromptDetailPage
    item={{ prompt: promptFactory({ latestVersionId: "version-image" }), latestVersion: version, scene: sceneFactory({ promptType: "image" }) }}
    versions={[version]}
    imageUrls={{ "asset-cover": "blob:cover" }}
    onCopyVersion={onCopyVersion}
    onBack={vi.fn()}
    onCopyLatest={vi.fn()}
    onDelete={vi.fn()}
    onSaveVersion={vi.fn()}
    onSaveMetadata={vi.fn()}
    onSaveLatestVersionMetadata={vi.fn()}
    onToggleFavorite={vi.fn()}
    onCopyEditor={vi.fn()}
    onDownloadEditor={vi.fn()}
    onCompareToLatest={vi.fn()}
  />);

  await user.click(screen.getByRole("button", { name: "预览版本 v1" }));

  const dialog = screen.getByRole("dialog", { name: /v1/ });
  expect(dialog).toHaveTextContent("历史提示词");
  expect(screen.getByAltText("v1 版本图片")).toHaveAttribute("src", "blob:cover");
  expect(screen.getByRole("button", { name: "复制提示词" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /恢复/ })).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "复制提示词" }));
  expect(onCopyVersion).toHaveBeenCalledWith("version-image");
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npm test -- tests/ui/PromptDetailPage.test.tsx
```

Expected: FAIL because version preview modal does not exist.

- [ ] **Step 3: Add preview action to VersionHistory**

Update props:

```ts
onPreviewVersion: (versionId: string) => void;
imageUrls?: Record<string, string>;
```

Render each row with a preview button:

```tsx
<IconButton
  className="bare-icon-btn"
  label={`预览版本 ${label}`}
  icon={<Eye className="icon" />}
  onClick={() => onPreviewVersion(version.id)}
/>
```

For image versions, include thumbnail:

```tsx
{version.imageAssetId && imageUrls?.[version.imageAssetId] && (
  <span className="version-thumb">
    <img src={imageUrls[version.imageAssetId]} alt={`${label} 缩略图`} />
  </span>
)}
```

- [ ] **Step 4: Add modal state and markup in PromptDetailPage**

Add:

```ts
const [previewVersionId, setPreviewVersionId] = useState<string | null>(null);
const previewVersion = versions.find((version) => version.id === previewVersionId) ?? null;
```

Render modal:

```tsx
{previewVersion && (
  <div className="modal-backdrop">
    <section className="modal version-preview-modal" role="dialog" aria-modal="true" aria-labelledby="version-preview-title">
      <div className="modal-head">
        <h2 id="version-preview-title">{previewVersion.customVersionLabel || `v${previewVersion.versionNumber}`} 只读版本预览</h2>
        <IconButton label="关闭" icon={<X className="icon" />} onClick={() => setPreviewVersionId(null)} />
      </div>
      <div className="version-preview-body">
        {previewVersion.imageAssetId && imageUrls?.[previewVersion.imageAssetId] && (
          <img className="version-preview-image" src={imageUrls[previewVersion.imageAssetId]} alt={`v${previewVersion.versionNumber} 版本图片`} />
        )}
        <pre className="version-preview-content">{previewVersion.content}</pre>
      </div>
      <div className="modal-actions">
        <Button onClick={() => setPreviewVersionId(null)}>关闭</Button>
        <Button variant="primary" onClick={() => onCopyVersion(previewVersion.id)}><Copy className="icon" />复制提示词</Button>
      </div>
    </section>
  </div>
)}
```

- [ ] **Step 5: Wire copy callback**

Add `onCopyVersion` prop to `PromptDetailPage`. In `ManagerApp`, pass:

```tsx
onCopyVersion={(versionId) => {
  void copyVersion(versionId, "version-history");
}}
```

- [ ] **Step 6: Run tests**

Run:

```powershell
npm test -- tests/ui/PromptDetailPage.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit version preview**

```powershell
git add src/shared/components/VersionHistory.tsx src/manager/pages/PromptDetailPage.tsx src/manager/ManagerApp.tsx src/shared/styles/app.css tests/ui/PromptDetailPage.test.tsx
git commit -m "feat: add read-only version preview"
```

---

## Task 11: Image-Aware Diff Page

**Files:**
- Modify: `src/manager/pages/DiffPage.tsx`
- Modify: `src/manager/ManagerApp.tsx`
- Modify: `src/shared/styles/app.css`
- Test: `tests/ui/PromptDetailPage.test.tsx`
- Test: `tests/ui/ManagerApp.test.tsx`

- [ ] **Step 1: Add failing Diff test**

In `tests/ui/ManagerApp.test.tsx`, add an image Prompt with two versions and assert:

```ts
await user.click(screen.getByLabelText("与最新版本对比"));

expect(await screen.findByAltText("v1 图片预览")).toHaveAttribute("src", expect.stringMatching(/^blob:/));
expect(screen.getByAltText("v2 Latest 图片预览")).toHaveAttribute("src", expect.stringMatching(/^blob:/));
expect(screen.getByText("图片只预览，不做视觉差异分析")).toBeInTheDocument();
expect(screen.getByText(/Comparing v1 to v2 Latest/)).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify failure**

Run:

```powershell
npm test -- tests/ui/ManagerApp.test.tsx
```

Expected: FAIL because Diff does not receive image metadata.

- [ ] **Step 3: Extend Diff state**

In `ManagerApp`, add state:

```ts
const [diffImages, setDiffImages] = useState<{
  historyLabel: string;
  latestLabel: string;
  historyUrl?: string;
  latestUrl?: string;
} | null>(null);
```

In `compareToLatest`, when selected scene is image:

```ts
setDiffImages({
  historyLabel: `v${historyVersion.versionNumber}`,
  latestLabel: `v${latestVersion.versionNumber} Latest`,
  historyUrl: historyVersion.imageAssetId ? imageUrls[historyVersion.imageAssetId] : undefined,
  latestUrl: latestVersion.imageAssetId ? imageUrls[latestVersion.imageAssetId] : undefined
});
```

Set `setDiffImages(null)` for text prompts.

- [ ] **Step 4: Update DiffPage props and markup**

Add prop:

```ts
images?: {
  historyLabel: string;
  latestLabel: string;
  historyUrl?: string;
  latestUrl?: string;
};
```

Inside each pane above text lines:

```tsx
{images?.historyUrl && (
  <>
    <div className="diff-image"><img src={images.historyUrl} alt={`${images.historyLabel} 图片预览`} /></div>
    <p className="diff-image-note">图片只预览，不做视觉差异分析</p>
  </>
)}
```

Repeat for latest pane.

- [ ] **Step 5: Add CSS**

```css
.diff-image {
  aspect-ratio: 16 / 9;
  overflow: hidden;
  margin-bottom: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #e2e8f0;
}

.diff-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.diff-image-note {
  margin: 0 0 12px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}
```

- [ ] **Step 6: Run Diff tests**

Run:

```powershell
npm test -- tests/ui/ManagerApp.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit image Diff**

```powershell
git add src/manager/pages/DiffPage.tsx src/manager/ManagerApp.tsx src/shared/styles/app.css tests/ui/ManagerApp.test.tsx
git commit -m "feat: show image previews in diff"
```

---

## Task 12: ZIP Backup Service

**Files:**
- Create: `src/shared/services/zipBackupService.ts`
- Modify: `src/shared/services/importExportService.ts`
- Test: `tests/services/zipBackupService.test.ts`
- Test: `tests/services/importExportService.test.ts`

- [ ] **Step 1: Write failing ZIP tests**

Create `tests/services/zipBackupService.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "../../src/shared/data/db";
import { repositories } from "../../src/shared/data/repositories";
import { zipBackupService } from "../../src/shared/services/zipBackupService";
import { imageAssetFactory, promptFactory, sceneFactory, versionFactory } from "../../src/test/factories";

describe("zipBackupService", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("exports structured data and image files to a zip blob", async () => {
    await repositories.scenes.put(sceneFactory({ promptType: "image" }));
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory({ imageAssetId: "asset-cover" }));
    await repositories.imageAssets.put(imageAssetFactory({ id: "asset-cover" }));

    const zip = await zipBackupService.exportZip();
    const preview = await zipBackupService.previewZip(new File([zip], "backup.zip", { type: "application/zip" }));

    expect(preview.scenes).toBe(1);
    expect(preview.prompts).toBe(1);
    expect(preview.versions).toBe(1);
    expect(preview.imageAssets).toBe(1);
  });

  it("rejects packages with missing image assets", async () => {
    await repositories.scenes.put(sceneFactory({ promptType: "image" }));
    await repositories.prompts.put(promptFactory());
    await repositories.versions.put(versionFactory({ imageAssetId: "asset-missing" }));

    await expect(zipBackupService.exportZip()).rejects.toThrow("Image asset not found.");
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npm test -- tests/services/zipBackupService.test.ts
```

Expected: FAIL because `zipBackupService` does not exist.

- [ ] **Step 3: Implement ZIP service export**

Create `src/shared/services/zipBackupService.ts`:

```ts
import JSZip from "jszip";
import { EXPORT_SCHEMA_VERSION, IMAGE_LIMITS } from "../constants";
import { db } from "../data/db";
import { repositories } from "../data/repositories";
import { imageAssetService } from "./imageAssetService";
import type { ExportPayload, ImageAsset, ImportPreview, ZipBackupManifest } from "../types";

const APP_ID = "fh-prompt-manager" as const;

function extensionForMimeType(mimeType: ImageAsset["mimeType"]) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
}

function assertSafePath(path: string) {
  if (path.startsWith("/") || path.includes("..") || path.includes("\\")) throw new Error("备份包包含非法路径。");
}

export const zipBackupService = {
  async exportZip(): Promise<Blob> {
    const [scenes, prompts, versions, usageRecords, imageAssets] = await Promise.all([
      repositories.scenes.list(),
      repositories.prompts.list(),
      db.versions.toArray(),
      db.usageRecords.toArray(),
      repositories.imageAssets.list()
    ]);
    const assetById = new Map(imageAssets.map((asset) => [asset.id, asset]));
    for (const version of versions) {
      if (version.imageAssetId && !assetById.has(version.imageAssetId)) throw new Error("Image asset not found.");
    }
    const zip = new JSZip();
    const payload: ExportPayload = { schemaVersion: 2, exportedAt: new Date().toISOString(), scenes, prompts, versions, usageRecords };
    const assets = imageAssets.map((asset) => ({
      id: asset.id,
      path: `assets/images/${asset.id}.${extensionForMimeType(asset.mimeType)}`,
      mimeType: asset.mimeType,
      size: asset.size,
      sha256: asset.sha256
    }));
    const manifest: ZipBackupManifest = {
      app: APP_ID,
      schemaVersion: EXPORT_SCHEMA_VERSION,
      exportedAt: payload.exportedAt,
      counts: {
        scenes: scenes.length,
        prompts: prompts.length,
        versions: versions.length,
        usageRecords: usageRecords.length,
        imageAssets: imageAssets.length
      },
      assets
    };
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    zip.file("data/scenes.json", JSON.stringify(scenes, null, 2));
    zip.file("data/prompts.json", JSON.stringify(prompts, null, 2));
    zip.file("data/versions.json", JSON.stringify(versions, null, 2));
    zip.file("data/usage-records.json", JSON.stringify(usageRecords, null, 2));
    for (const asset of imageAssets) {
      const manifestAsset = assets.find((item) => item.id === asset.id);
      if (!manifestAsset) throw new Error("Image asset not found.");
      zip.file(manifestAsset.path, asset.blob);
    }
    return zip.generateAsync({ type: "blob" });
  }
};
```

- [ ] **Step 4: Implement ZIP preview and validation**

Add to `zipBackupService`:

```ts
async previewZip(file: File): Promise<ImportPreview & { payload: ExportPayload; assets: ImageAsset[] }> {
  if (file.size > IMAGE_LIMITS.maxZipBytes) throw new Error("备份包不能超过 200MB。");
  const zip = await JSZip.loadAsync(file);
  for (const required of ["manifest.json", "data/scenes.json", "data/prompts.json", "data/versions.json", "data/usage-records.json"]) {
    if (!zip.file(required)) throw new Error(`备份包缺少 ${required}。`);
  }
  const manifest = JSON.parse(await zip.file("manifest.json")!.async("string")) as ZipBackupManifest;
  if (manifest.app !== APP_ID) throw new Error("备份包应用标识不匹配。");
  if (manifest.schemaVersion !== EXPORT_SCHEMA_VERSION) throw new Error("备份包版本不支持。");
  const scenes = JSON.parse(await zip.file("data/scenes.json")!.async("string"));
  const prompts = JSON.parse(await zip.file("data/prompts.json")!.async("string"));
  const versions = JSON.parse(await zip.file("data/versions.json")!.async("string"));
  const usageRecords = JSON.parse(await zip.file("data/usage-records.json")!.async("string"));
  const assets: ImageAsset[] = [];
  for (const assetManifest of manifest.assets) {
    assertSafePath(assetManifest.path);
    const fileEntry = zip.file(assetManifest.path);
    if (!fileEntry) throw new Error(`备份包缺少图片 ${assetManifest.path}。`);
    const blob = await fileEntry.async("blob");
    if (blob.size !== assetManifest.size) throw new Error(`图片大小校验失败：${assetManifest.path}`);
    if (await imageAssetService.sha256(blob) !== assetManifest.sha256) throw new Error(`图片哈希校验失败：${assetManifest.path}`);
    imageAssetService.validateFile(new Blob([blob], { type: assetManifest.mimeType }));
    assets.push({
      id: assetManifest.id,
      mimeType: assetManifest.mimeType,
      size: assetManifest.size,
      sha256: assetManifest.sha256,
      blob,
      createdAt: manifest.exportedAt
    });
  }
  validatePayload({ schemaVersion: 2, exportedAt: manifest.exportedAt, scenes, prompts, versions, usageRecords }, manifest);
  return {
    scenes: scenes.length,
    prompts: prompts.length,
    versions: versions.length,
    usageRecords: usageRecords.length,
    imageAssets: assets.length,
    warnings: ["导入会替换当前本地数据。"],
    payload: { schemaVersion: 2, exportedAt: manifest.exportedAt, scenes, prompts, versions, usageRecords },
    assets
  };
}
```

Add `validatePayload` in the same file. It must:

```ts
function validatePayload(payload: ExportPayload, manifest: ZipBackupManifest) {
  if (manifest.counts.scenes !== payload.scenes.length) throw new Error("Scene 数量校验失败。");
  if (manifest.counts.prompts !== payload.prompts.length) throw new Error("Prompt 数量校验失败。");
  if (manifest.counts.versions !== payload.versions.length) throw new Error("Version 数量校验失败。");
  const scenesById = new Map(payload.scenes.map((scene) => [scene.id, scene]));
  const promptsById = new Map(payload.prompts.map((prompt) => [prompt.id, prompt]));
  const versionsById = new Map(payload.versions.map((version) => [version.id, version]));
  const assetIds = new Set(manifest.assets.map((asset) => asset.id));
  for (const scene of payload.scenes) {
    if (scene.promptType !== "text" && scene.promptType !== "image") throw new Error("Scene 类型不合法。");
  }
  for (const prompt of payload.prompts) {
    const scene = scenesById.get(prompt.sceneId);
    if (!scene) throw new Error("Prompt 引用了不存在的 Scene。");
    const latestVersion = versionsById.get(prompt.latestVersionId);
    if (!latestVersion || latestVersion.promptId !== prompt.id) throw new Error("Prompt 最新版本指针不合法。");
    const promptVersions = payload.versions.filter((version) => version.promptId === prompt.id);
    const maxVersion = promptVersions.reduce((maximum, version) => Math.max(maximum, version.versionNumber), 0);
    if (prompt.latestVersionNumber !== maxVersion) throw new Error("Prompt 最新版本号不合法。");
  }
  for (const version of payload.versions) {
    const prompt = promptsById.get(version.promptId);
    if (!prompt) throw new Error("Version 引用了不存在的 Prompt。");
    const scene = scenesById.get(prompt.sceneId);
    if (scene?.promptType === "text" && version.imageAssetId) throw new Error("文本版本不能引用图片。");
    if (scene?.promptType === "image" && !version.imageAssetId) throw new Error("生图版本必须引用图片。");
    if (version.imageAssetId && !assetIds.has(version.imageAssetId)) throw new Error("Version 引用了不存在的图片。");
  }
}
```

- [ ] **Step 5: Update importExportService to delegate**

Replace merge implementation with:

```ts
export const importExportService = {
  exportZip: () => zipBackupService.exportZip(),
  previewZip: (file: File) => zipBackupService.previewZip(file),
  async importZip(file: File): Promise<ImportPreview> {
    const preview = await zipBackupService.previewZip(file);
    await db.transaction("rw", db.scenes, db.prompts, db.versions, db.imageAssets, db.usageRecords, async () => {
      await db.scenes.clear();
      await db.prompts.clear();
      await db.versions.clear();
      await db.imageAssets.clear();
      await db.usageRecords.clear();
      await db.scenes.bulkPut(preview.payload.scenes);
      await db.prompts.bulkPut(preview.payload.prompts);
      await db.versions.bulkPut(preview.payload.versions);
      await db.imageAssets.bulkPut(preview.assets);
      await db.usageRecords.bulkPut(preview.payload.usageRecords);
    });
    return {
      scenes: preview.scenes,
      prompts: preview.prompts,
      versions: preview.versions,
      usageRecords: preview.usageRecords,
      imageAssets: preview.imageAssets,
      warnings: preview.warnings
    };
  }
};
```

- [ ] **Step 6: Rewrite import/export tests**

Replace old merge/import tests in `tests/services/importExportService.test.ts` with full replacement behavior:

```ts
it("imports zip backups with full replacement", async () => {
  await repositories.scenes.put(sceneFactory({ id: "old-scene", name: "旧场景" }));
  const zip = await buildZipFixtureWithOneTextPrompt();

  const preview = await importExportService.importZip(new File([zip], "backup.zip", { type: "application/zip" }));

  expect(preview.scenes).toBe(1);
  await expect(repositories.scenes.get("old-scene")).resolves.toBeUndefined();
  await expect(repositories.scenes.get("scene-code")).resolves.toMatchObject({ name: "代码重构" });
});
```

Implement `buildZipFixtureWithOneTextPrompt` using `zipBackupService.exportZip()` after seeding a text scene/prompt/version.

- [ ] **Step 7: Run backup tests**

Run:

```powershell
npm test -- tests/services/zipBackupService.test.ts tests/services/importExportService.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit ZIP service**

```powershell
git add src/shared/services/zipBackupService.ts src/shared/services/importExportService.ts tests/services/zipBackupService.test.ts tests/services/importExportService.test.ts
git commit -m "feat: add zip backup import export"
```

---

## Task 13: ZIP Import/Export UI

**Files:**
- Modify: `src/shared/services/downloadService.ts`
- Modify: `src/manager/pages/ImportPage.tsx`
- Modify: `src/manager/ManagerApp.tsx`
- Modify: `src/shared/styles/app.css`
- Test: `tests/ui/ImportPage.test.tsx`
- Test: `tests/ui/ManagerApp.test.tsx`

- [ ] **Step 1: Add failing ImportPage tests**

In `tests/ui/ImportPage.test.tsx`, update expectations:

```ts
expect(screen.getByText("导入 ZIP 备份")).toBeInTheDocument();
expect(screen.getByLabelText("选择 ZIP 备份文件")).toHaveAttribute("accept", "application/zip,.zip");
expect(screen.getByText("完整替换式导入。确认前不会写入任何数据。")).toBeInTheDocument();
```

Add preview count assertions:

```ts
expect(screen.getByText("图片")).toBeInTheDocument();
expect(screen.getByText("使用记录")).toBeInTheDocument();
expect(screen.getByText("执行替换导入")).toBeInTheDocument();
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npm test -- tests/ui/ImportPage.test.tsx
```

Expected: FAIL because ImportPage still accepts JSON merge import.

- [ ] **Step 3: Add ZIP download helper**

In `downloadService.ts`, add:

```ts
export function downloadBlobFile(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 4: Update ManagerApp export/import**

Replace JSON export with:

```ts
async function exportAll() {
  try {
    const blob = await importExportService.exportZip();
    downloadBlobFile(`fh-prompt-manager-export-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}.zip`, blob);
    showToast("导出完成");
  } catch {
    showToast("导出失败，请重试");
  }
}
```

Replace preview/import payload state with:

```ts
const [importFile, setImportFile] = useState<File | null>(null);
```

Use:

```ts
async function previewImportFile(file: File) {
  setImportError(null);
  setImportPreview(null);
  setImportFile(null);
  try {
    const preview = await importExportService.previewZip(file);
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
```

- [ ] **Step 5: Update ImportPage**

Change title/copy/file accept:

```tsx
<h1>导入 ZIP 备份</h1>
<p>完整替换式导入。确认前不会写入任何数据。</p>
<input
  aria-label="选择 ZIP 备份文件"
  type="file"
  accept="application/zip,.zip"
  onChange={(event) => {
    void handleFile(event.target.files?.[0]);
  }}
/>
```

Display counts:

```tsx
<div><strong>{currentPreview?.scenes ?? 0}</strong><span>Scene</span></div>
<div><strong>{currentPreview?.prompts ?? 0}</strong><span>Prompt</span></div>
<div><strong>{currentPreview?.versions ?? 0}</strong><span>Version</span></div>
<div><strong>{currentPreview?.imageAssets ?? 0}</strong><span>图片</span></div>
<div><strong>{currentPreview?.usageRecords ?? 0}</strong><span>使用记录</span></div>
```

Change confirm button text:

```tsx
<Button variant="primary" disabled={!currentPreview} onClick={onConfirm}><Check className="icon" />执行替换导入</Button>
```

- [ ] **Step 6: Run UI tests**

Run:

```powershell
npm test -- tests/ui/ImportPage.test.tsx tests/ui/ManagerApp.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit ZIP UI**

```powershell
git add src/shared/services/downloadService.ts src/manager/pages/ImportPage.tsx src/manager/ManagerApp.tsx src/shared/styles/app.css tests/ui/ImportPage.test.tsx tests/ui/ManagerApp.test.tsx
git commit -m "feat: wire zip backup UI"
```

---

## Task 14: Seed Data, Popup Compatibility, and Search Behavior

**Files:**
- Modify: `src/shared/data/seed.ts`
- Modify: `src/popup/PopupApp.tsx`
- Modify: `src/shared/services/promptService.ts`
- Test: `tests/ui/PopupApp.test.tsx`
- Test: `tests/services/promptService.test.ts`

- [ ] **Step 1: Add failing search/popup tests**

In `tests/services/promptService.test.ts`, assert image Prompt search uses title/tags/content but not image blob:

```ts
it("searches image prompts by title, content, highlight and tags", async () => {
  await repositories.scenes.put(sceneFactory({ id: "scene-image", promptType: "image" }));
  await repositories.prompts.put(promptFactory({ id: "prompt-image", sceneId: "scene-image", latestVersionId: "version-image" }));
  await repositories.versions.put(versionFactory({
    id: "version-image",
    promptId: "prompt-image",
    content: "生成柔光人像",
    description: "商业封面",
    tags: [{ label: "portrait", color: "orange" }],
    imageAssetId: "asset-cover"
  }));

  await expect(promptService.searchPrompts({ text: "portrait" })).resolves.toHaveLength(1);
  await expect(promptService.searchPrompts({ text: "商业封面" })).resolves.toHaveLength(1);
});
```

In `tests/ui/PopupApp.test.tsx`, add assertion that image Prompt results still show copy controls and type text if present in the compact list.

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npm test -- tests/services/promptService.test.ts tests/ui/PopupApp.test.tsx
```

Expected: FAIL only where test factories or popup result assumptions lack `promptType`.

- [ ] **Step 3: Update seed scenes**

In `seed.ts`, add `promptType: "text"` to existing scenes. Add one image Scene only if seed can create an image asset Blob without network:

```ts
{
  id: "scene-image",
  name: "视觉海报",
  description: "封面、产品图、活动主视觉",
  icon: "image",
  color: "orange",
  promptType: "image",
  sortOrder: 99,
  createdAt,
  updatedAt
}
```

If seed currently only handles text prompts, keep image seed out of V2 to avoid synthetic image binary complexity.

- [ ] **Step 4: Keep popup copy behavior text-only**

In `PopupApp.tsx`, ensure result metadata does not assume text-only Scene:

```tsx
<p>{item.scene.promptType === "image" ? "生图" : "文本"} · v{item.prompt.latestVersionNumber} · {item.scene.name}</p>
```

The copy button still copies `item.latestVersion.content`.

- [ ] **Step 5: Run tests**

Run:

```powershell
npm test -- tests/services/promptService.test.ts tests/ui/PopupApp.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit seed/popup compatibility**

```powershell
git add src/shared/data/seed.ts src/popup/PopupApp.tsx src/shared/services/promptService.ts tests/services/promptService.test.ts tests/ui/PopupApp.test.tsx
git commit -m "feat: support prompt types in search and popup"
```

---

## Task 15: Full Regression and Build Verification

**Files:**
- Modify only files required to fix regressions discovered by commands below.

- [ ] **Step 1: Run full test suite**

Run:

```powershell
npm test
```

Expected: PASS. If a test fails, fix the smallest related issue and rerun the specific failing test first, then rerun `npm test`.

- [ ] **Step 2: Run type check**

Run:

```powershell
npm run lint:types
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```powershell
npm run build
```

Expected: PASS and `dist/` generated.

- [ ] **Step 4: Manual browser smoke check**

Run:

```powershell
npm run dev
```

Open Manager and verify:

- A new Scene defaults to `文本`.
- Empty Scene type can switch to `生图`.
- Non-empty Scene type controls are disabled.
- Image Prompt cannot save without a file.
- Image Prompt card shows image, title, and version only.
- Image Prompt detail shows image preview, editor, metadata, and version history.
- Version preview modal is read-only and only copies Prompt text.
- Diff shows side-by-side image previews and text Diff.
- Export downloads `.zip`.
- Import preview reads `.zip`, shows counts, and warns about replacement.

- [ ] **Step 5: Stop dev server**

Use `Ctrl+C` in the dev server terminal. If it was started as a background process, stop that process before continuing.

- [ ] **Step 6: Final commit**

If any regression fixes were needed:

```powershell
git add <fixed-files>
git commit -m "fix: complete v2 regression fixes"
```

If no files changed during regression verification, do not create an empty commit.

---

## Spec Coverage Self-Review

- Scene type and lock rule: Tasks 2, 3, 6.
- Scene type display on selected Scene and detail header: Tasks 6, 9.
- Image Prompt create requires one image: Tasks 4, 5, 7.
- Image bound to PromptVersion: Tasks 2, 5.
- Latest version image as card cover: Task 8.
- Image detail layout: Task 9.
- New version defaults to old image and can replace with upload: Tasks 5, 9.
- Version read-only preview modal with copy only: Task 10.
- Diff keeps text comparison and adds image previews: Task 11.
- ZIP export with JSON plus asset files: Task 12.
- ZIP import full replacement with validation: Tasks 12, 13.
- No old schema compatibility or JSON merge import: Tasks 12, 13.
- Popup/search remains usable: Task 14.
- Full regression/build verification: Task 15.
