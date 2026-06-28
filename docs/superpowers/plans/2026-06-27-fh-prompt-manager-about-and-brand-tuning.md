# FH Prompt Manager About And Brand Tuning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tune the shared FH Prompt Manager title style and rename the author entry point to About without changing unrelated behavior.

**Architecture:** Keep the existing header structure and dialog structure. Apply the title change through shared CSS and update the top bar button, dialog title, and related copy in place.

**Tech Stack:** React, TypeScript, shared CSS, Vitest, Testing Library

---

### Task 1: Update focused UI tests

**Files:**
- Modify: `tests/ui/TopBar.test.tsx`
- Modify: `tests/ui/PopupApp.test.tsx`

- [ ] **Step 1: Change button and dialog expectations to About**

```tsx
expect(screen.getByRole("button", { name: "关于应用" })).toHaveClass("top-action-button");
await user.click(screen.getByRole("button", { name: "关于应用" }));
expect(screen.getByRole("dialog", { name: "关于应用" })).toBeInTheDocument();
```

- [ ] **Step 2: Assert updated copy lines**

```tsx
expect(screen.getByText("👤 作者：烽火技服-姜萌")).toBeInTheDocument();
expect(screen.getByText("📧 邮箱：mjiang@fiberhome.com")).toBeInTheDocument();
```

### Task 2: Implement brand and About UI updates

**Files:**
- Modify: `src/shared/components/TopBar.tsx`
- Modify: `src/shared/styles/app.css`

- [ ] **Step 1: Rename the action and dialog title**

```tsx
<Button className="top-action-button" onClick={() => setShowContact(true)}><Info className="icon" />关于应用</Button>
<h2 id="contact-title">关于应用</h2>
```

- [ ] **Step 2: Tune the title typography and intro copy hierarchy**

```css
.brand-name { color: var(--blue); font-weight: 650; letter-spacing: -0.02em; }
.popup-brand-name { color: var(--blue); font-weight: 650; letter-spacing: -0.02em; }
.contact-intro,
.contact-subtitle { font-size: 18px; }
```

### Task 3: Verify

**Files:**
- Test: `tests/ui/TopBar.test.tsx`
- Test: `tests/ui/PopupApp.test.tsx`

- [ ] **Step 1: Run targeted tests**

```bash
npm test -- tests/ui/TopBar.test.tsx tests/ui/PopupApp.test.tsx
```

- [ ] **Step 2: Run the production build**

```bash
npm run build
```
