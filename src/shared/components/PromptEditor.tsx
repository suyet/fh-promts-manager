import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import {
  bracketMatching,
  defaultHighlightStyle,
  indentOnInput,
  LanguageDescription,
  syntaxHighlighting
} from "@codemirror/language";
import { EditorSelection, EditorState } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  drawSelection,
  EditorView,
  highlightActiveLine,
  keymap,
  lineNumbers,
  MatchDecorator,
  placeholder,
  ViewPlugin,
  type ViewUpdate
} from "@codemirror/view";
import { Bold, Braces, Code2, Copy, Download, Heading1, Heading2, Moon, Pilcrow, Sun } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { applyMarkdownEdit, type MarkdownEditAction } from "../editor/markdownEditing";
import { IconButton } from "./IconButton";
import { RequiredMarker } from "./RequiredMarker";

const jsonLanguage = LanguageDescription.of({
  name: "JSON",
  alias: ["json"],
  extensions: ["json"],
  support: json()
});

const promptPlaceholderMatcher = new MatchDecorator({
  regexp: /\{\{\s*[^{}\n]+?\s*\}\}/g,
  decoration: Decoration.mark({ class: "cm-prompt-placeholder" })
});

const promptPlaceholderHighlighter = ViewPlugin.fromClass(
  class {
    placeholders: DecorationSet;

    constructor(view: EditorView) {
      this.placeholders = promptPlaceholderMatcher.createDeco(view);
    }

    update(update: ViewUpdate) {
      this.placeholders = promptPlaceholderMatcher.updateDeco(update, this.placeholders);
    }
  },
  {
    decorations: (plugin) => plugin.placeholders
  }
);

const editorExtensions = [
  lineNumbers(),
  history(),
  drawSelection(),
  indentOnInput(),
  bracketMatching(),
  highlightActiveLine(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  markdown({ codeLanguages: [jsonLanguage] }),
  promptPlaceholderHighlighter,
  placeholder("输入 Prompt，支持 Markdown、代码块、JSON 和 {{变量}} 占位符"),
  keymap.of([...defaultKeymap, ...historyKeymap]),
  EditorView.lineWrapping,
  EditorView.theme({
    "&": {
      height: "100%"
    },
    ".cm-scroller": {
      minHeight: "420px",
      fontFamily: '"Cascadia Code", Consolas, monospace'
    },
    ".cm-content": {
      padding: "16px",
      lineHeight: "1.6"
    },
    ".cm-gutters": {
      borderRight: "1px solid var(--line)"
    }
  })
];

const toolbarActions: Array<{
  action: MarkdownEditAction;
  label: string;
  icon: ReactNode;
}> = [
  { action: "heading1", label: "一级标题", icon: <Heading1 className="icon" /> },
  { action: "heading2", label: "二级标题", icon: <Heading2 className="icon" /> },
  { action: "bold", label: "加粗", icon: <Bold className="icon" /> },
  { action: "inlineCode", label: "行内代码", icon: <Code2 className="icon" /> },
  { action: "codeBlock", label: "代码块", icon: <Pilcrow className="icon" /> },
  { action: "jsonBlock", label: "JSON 块", icon: <Braces className="icon" /> },
  { action: "placeholder", label: "占位符", icon: <Braces className="icon" /> }
];

export function PromptEditor({
  content,
  onChange,
  onDownload,
  onCopy,
  required = false
}: {
  content: string;
  onChange: (value: string) => void;
  onDownload: () => void;
  onCopy: () => void;
  required?: boolean;
}) {
  const [dark, setDark] = useState(false);
  const editorParentRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorParentRef.current) return;
    const view = new EditorView({
      parent: editorParentRef.current,
      state: EditorState.create({
        doc: content,
        extensions: [
          ...editorExtensions,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChange(update.state.doc.toString());
          })
        ]
      })
    });
    view.contentDOM.setAttribute("aria-label", "提示词正文");
    view.contentDOM.setAttribute("aria-multiline", "true");
    view.contentDOM.setAttribute("role", "textbox");
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.state.doc.toString() === content) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: content }
    });
  }, [content]);

  function applyToolbarAction(action: MarkdownEditAction) {
    const view = viewRef.current;
    if (!view) return;
    const selection = view.state.selection.main;
    const result = applyMarkdownEdit(view.state.doc.toString(), { from: selection.from, to: selection.to }, action);
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: result.content },
      selection: EditorSelection.range(result.selection.from, result.selection.to),
      scrollIntoView: true
    });
    view.focus();
  }

  return (
    <section className={dark ? "editor editor-dark" : "editor editor-light"}>
      <div className="editor-bar">
        <div className="editor-title-row">
          <strong>提示词编辑器{required && <RequiredMarker />}</strong>
          <span>{content.length} 字符</span>
        </div>
        <div className="editor-actions">
          <IconButton className="bare-icon-btn" label="复制" icon={<Copy className="icon" />} onClick={onCopy} />
          <IconButton className="bare-icon-btn" label="下载" icon={<Download className="icon" />} onClick={onDownload} />
          <IconButton
            className="bare-icon-btn"
            label={dark ? "切换为白底编辑器" : "切换为黑底编辑器"}
            icon={dark ? <Sun className="icon" /> : <Moon className="icon" />}
            onClick={() => setDark(!dark)}
          />
        </div>
      </div>
      <div className="editor-toolbar">
        {toolbarActions.map((item) => (
          <IconButton
            key={item.action}
            className="bare-icon-btn"
            label={item.label}
            icon={item.icon}
            onClick={() => applyToolbarAction(item.action)}
          />
        ))}
      </div>
      <div className="prompt-code-editor" ref={editorParentRef} />
    </section>
  );
}
