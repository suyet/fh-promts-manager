export type MarkdownEditAction =
  | "heading1"
  | "heading2"
  | "bold"
  | "inlineCode"
  | "codeBlock"
  | "jsonBlock"
  | "placeholder";

export type TextSelection = {
  from: number;
  to: number;
};

export type PromptPlaceholder = {
  from: number;
  to: number;
  name: string;
};

type MarkdownEditResult = {
  content: string;
  selection: TextSelection;
};

const fallbackTextByAction: Partial<Record<MarkdownEditAction, string>> = {
  bold: "加粗文本",
  inlineCode: "code",
  codeBlock: "code",
  placeholder: "variable"
};

export function applyMarkdownEdit(
  content: string,
  selection: TextSelection,
  action: MarkdownEditAction
): MarkdownEditResult {
  if (action === "heading1") return applyHeading(content, selection, "# ");
  if (action === "heading2") return applyHeading(content, selection, "## ");
  if (action === "bold") return wrapSelection(content, selection, "**", "**", fallbackTextByAction.bold);
  if (action === "inlineCode") return wrapSelection(content, selection, "`", "`", fallbackTextByAction.inlineCode);
  if (action === "codeBlock") return wrapSelection(content, selection, "```\n", "\n```", fallbackTextByAction.codeBlock);
  if (action === "jsonBlock") return replaceSelection(content, selection, '```json\n{\n  "key": "value"\n}\n```');
  return replaceSelection(content, selection, `{{${fallbackTextByAction.placeholder}}}`, 2, 10);
}

export function findPromptPlaceholders(content: string): PromptPlaceholder[] {
  const placeholders: PromptPlaceholder[] = [];
  const pattern = /\{\{\s*([^{}\n]+?)\s*\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content))) {
    placeholders.push({
      from: match.index,
      to: match.index + match[0].length,
      name: match[1].trim()
    });
  }
  return placeholders;
}

function applyHeading(content: string, selection: TextSelection, marker: "# " | "## "): MarkdownEditResult {
  const lineStart = content.lastIndexOf("\n", Math.max(0, selection.from - 1)) + 1;
  const lineEndIndex = content.indexOf("\n", selection.from);
  const lineEnd = lineEndIndex === -1 ? content.length : lineEndIndex;
  const line = content.slice(lineStart, lineEnd);
  const existingMarker = line.match(/^#{1,6}\s+/)?.[0] ?? "";

  if (existingMarker) {
    const markerEnd = lineStart + existingMarker.length;
    const nextContent = content.slice(0, lineStart) + marker + content.slice(markerEnd);
    const delta = marker.length - existingMarker.length;
    return {
      content: nextContent,
      selection: shiftSelection(selection, markerEnd, delta)
    };
  }

  return {
    content: content.slice(0, lineStart) + marker + content.slice(lineStart),
    selection: shiftSelection(selection, lineStart, marker.length)
  };
}

function wrapSelection(
  content: string,
  selection: TextSelection,
  prefix: string,
  suffix: string,
  fallbackText = ""
): MarkdownEditResult {
  const selected = content.slice(selection.from, selection.to) || fallbackText;
  return replaceSelection(content, selection, `${prefix}${selected}${suffix}`, prefix.length, prefix.length + selected.length);
}

function replaceSelection(
  content: string,
  selection: TextSelection,
  insertText: string,
  selectionOffset = insertText.length,
  selectionEndOffset = selectionOffset
): MarkdownEditResult {
  return {
    content: content.slice(0, selection.from) + insertText + content.slice(selection.to),
    selection: {
      from: selection.from + selectionOffset,
      to: selection.from + selectionEndOffset
    }
  };
}

function shiftSelection(selection: TextSelection, position: number, delta: number): TextSelection {
  return {
    from: selection.from >= position ? selection.from + delta : selection.from,
    to: selection.to >= position ? selection.to + delta : selection.to
  };
}
