# Favorite And Tag Colors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every favorite control use the same yellow active style and persist a random color per tag instance while remaining compatible with existing string-based tag data.

**Architecture:** Keep prompt metadata unchanged and only adjust presentation for favorites. Expand version tags from raw strings to a backward-compatible shape that normalizes legacy data at runtime, then thread that normalized shape through create/edit/render/search/import flows.

**Tech Stack:** React, TypeScript, Vitest, Dexie

---

### Task 1: Lock Down The New Tag Contract In Tests

**Files:**
- Modify: `tests/ui/PromptDetailPage.test.tsx`
- Modify: `tests/services/promptService.test.ts`
- Modify: `tests/ui/ManagerApp.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
expect(screen.getByLabelText("取消收藏")).toHaveClass("favorite-active");
expect(onSaveVersion).toHaveBeenCalledWith(expect.objectContaining({
  tags: [
    expect.objectContaining({ label: "review" }),
    expect.objectContaining({ label: "cleanup" }),
    expect.objectContaining({ label: "Deepseek V" })
  ]
}));
```

```ts
expect(versions[0].tags[0]).toMatchObject({ label: "tag-a" });
expect(results[0].latestVersion.tags[0]).toMatchObject({ label: "review" });
```

- [ ] **Step 2: Run targeted tests and verify they fail**

Run: `npm test -- tests/ui/PromptDetailPage.test.tsx tests/services/promptService.test.ts tests/ui/ManagerApp.test.tsx`
Expected: FAIL because detail page favorite button lacks `favorite-active` and tag arrays still use strings.

- [ ] **Step 3: Write minimal implementation**

```ts
type PromptTag = { label: string; color: string };
type StoredPromptTag = string | PromptTag;
```

```tsx
className={item.prompt.favorite ? "bare-icon-btn favorite-active" : "bare-icon-btn"}
```

- [ ] **Step 4: Re-run targeted tests**

Run: `npm test -- tests/ui/PromptDetailPage.test.tsx tests/services/promptService.test.ts tests/ui/ManagerApp.test.tsx`
Expected: PASS

### Task 2: Normalize Legacy Tags Across Render And Search Paths

**Files:**
- Modify: `src/shared/types.ts`
- Modify: `src/shared/constants.ts`
- Modify: `src/shared/services/promptService.ts`
- Modify: `src/shared/components/TagInput.tsx`
- Modify: `src/shared/components/PromptCard.tsx`
- Modify: `src/shared/components/VersionHistory.tsx`
- Modify: `src/manager/components/PromptWorkspace.tsx`
- Modify: `src/manager/pages/PromptDetailPage.tsx`
- Modify: `src/test/factories.ts`

- [ ] **Step 1: Add helpers for normalizing and creating tags**

```ts
export function normalizePromptTag(tag: StoredPromptTag): PromptTag {
  return typeof tag === "string" ? { label: tag, color: pickTagColor(tag) } : tag;
}
```

- [ ] **Step 2: Reuse normalized labels in UI and search**

```ts
const searchable = [
  prompt.title,
  latestVersion.description,
  latestVersion.tags.map((tag) => normalizePromptTag(tag).label).join(" "),
  latestVersion.content
].join(" ");
```

- [ ] **Step 3: Render persisted colors in tag chips**

```tsx
<span className="tag" style={getTagStyle(tag.color)}>
  {tag.label}
</span>
```

- [ ] **Step 4: Run focused UI and service tests**

Run: `npm test -- tests/ui/PromptDetailPage.test.tsx tests/ui/LibraryPage.test.tsx tests/services/promptService.test.ts`
Expected: PASS

### Task 3: Keep Import And Existing Data Compatible

**Files:**
- Modify: `src/shared/services/importExportService.ts`
- Modify: `tests/services/importExportService.test.ts`

- [ ] **Step 1: Write the failing compatibility tests**

```ts
expect(await promptService.searchPrompts({ text: "legacy-tag" })).toHaveLength(1);
expect(imported.latestVersion.tags[0]).toMatchObject({ label: "legacy-tag" });
```

- [ ] **Step 2: Normalize imported and existing version tags before comparing or storing**

```ts
const versionsToAdd = payload.versions.map((version) => ({
  ...version,
  tags: normalizePromptTags(version.tags)
}));
```

- [ ] **Step 3: Re-run import tests**

Run: `npm test -- tests/services/importExportService.test.ts`
Expected: PASS

### Task 4: Final Verification

**Files:**
- Modify: `src/shared/styles/app.css`

- [ ] **Step 1: Ensure active favorite color applies everywhere and tag chips remain readable**

```css
.favorite-active {
  color: #eab308;
}
```

- [ ] **Step 2: Run the relevant full suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: build completes successfully
