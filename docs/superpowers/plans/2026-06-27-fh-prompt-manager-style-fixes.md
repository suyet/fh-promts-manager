# FH Prompt Manager Style Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update branding assets and targeted UI presentation issues across the manager and popup without changing unrelated behavior.

**Architecture:** Keep existing data model and page structure intact. Generate the popup/card display changes from existing prompt version content at render time, and limit styling changes to the affected shared CSS and top-level components.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, Chrome extension manifest assets

---

### Task 1: Update tests for popup, top bar, card summary, and contact dialog

**Files:**
- Modify: `tests/ui/PopupApp.test.tsx`
- Modify: `tests/ui/TopBar.test.tsx`
- Modify: `tests/ui/LibraryPage.test.tsx`
- Modify: `tests/ui/PromptDetailPage.test.tsx`

- [ ] **Step 1: Write failing expectations for the new UI**

```tsx
expect(screen.getByText("FH Prompt Manager")).not.toHaveStyle({ fontWeight: "800" });
expect(screen.getByRole("button", { name: "前往管理" })).toHaveTextContent("前往管理");
expect(screen.getByText("提醒：删除插件数据不会保留，请提前导出备份")).toBeInTheDocument();
expect(screen.getByText("请重构下面的代码。")).toHaveClass("prompt-card-description");
```

- [ ] **Step 2: Run targeted tests to confirm failures**

```bash
npm test -- tests/ui/PopupApp.test.tsx tests/ui/TopBar.test.tsx tests/ui/LibraryPage.test.tsx tests/ui/PromptDetailPage.test.tsx
```

- [ ] **Step 3: Keep test coverage focused on request scope**

```tsx
expect(screen.getByRole("button", { name: "前往管理" }).querySelector("svg")).toBeTruthy();
expect(screen.getByRole("dialog", { name: "联系作者" })).toBeInTheDocument();
expect(screen.getByText("亮点").closest(".side-section-heading")).toBeTruthy();
```

- [ ] **Step 4: Re-run the targeted tests after implementation**

```bash
npm test -- tests/ui/PopupApp.test.tsx tests/ui/TopBar.test.tsx tests/ui/LibraryPage.test.tsx tests/ui/PromptDetailPage.test.tsx
```

### Task 2: Replace logo assets and wire extension icons to the new brand art

**Files:**
- Modify: `public/icons/fh-pm-logo.png`
- Modify: `public/icons/icon-16.png`
- Modify: `public/icons/icon-32.png`
- Modify: `public/icons/icon-48.png`
- Modify: `public/icons/icon-128.png`
- Modify: `public/manifest.json`

- [ ] **Step 1: Generate the scaled icon assets from the attached master logo**

```powershell
$sizes = 16,32,48,128
foreach ($size in $sizes) {
  # Resize the source image into public/icons/icon-$size.png
}
```

- [ ] **Step 2: Verify manifest still points at the generated icon files**

```json
"icons": {
  "16": "icons/icon-16.png",
  "32": "icons/icon-32.png",
  "48": "icons/icon-48.png",
  "128": "icons/icon-128.png"
}
```

### Task 3: Implement the requested popup, manager, modal, and detail-panel styling fixes

**Files:**
- Modify: `src/popup/PopupApp.tsx`
- Modify: `src/shared/components/TopBar.tsx`
- Modify: `src/shared/components/PromptCard.tsx`
- Modify: `src/shared/styles/app.css`

- [ ] **Step 1: Change popup header action and card summary source**

```tsx
<Button className="popup-manager-button" onClick={onOpenManager}>
  <LayoutPanelLeft className="icon" />
  前往管理
</Button>
<p className="prompt-card-description">{summarizePromptContent(item.latestVersion.content)}</p>
```

- [ ] **Step 2: Expand the contact dialog content and typography**

```tsx
<p className="contact-warning">提醒：删除插件数据不会保留，请提前导出备份</p>
<p>作者：烽火技服-姜萌</p>
```

- [ ] **Step 3: Apply minimal CSS changes for typography, popup width, modal size, and heading alignment**

```css
.brand-name,
.popup-brand-name { font-weight: 400; }
.popup { width: 500px; }
.contact-modal { width: min(640px, 100%); }
.side-section-heading { line-height: 1.2; }
```

### Task 4: Run full verification for the touched behavior

**Files:**
- Test: `tests/ui/PopupApp.test.tsx`
- Test: `tests/ui/TopBar.test.tsx`
- Test: `tests/ui/LibraryPage.test.tsx`
- Test: `tests/ui/PromptDetailPage.test.tsx`

- [ ] **Step 1: Run the targeted UI suite**

```bash
npm test -- tests/ui/PopupApp.test.tsx tests/ui/TopBar.test.tsx tests/ui/LibraryPage.test.tsx tests/ui/PromptDetailPage.test.tsx
```

- [ ] **Step 2: Run the broader project verification used by this repo**

```bash
npm run build
```
