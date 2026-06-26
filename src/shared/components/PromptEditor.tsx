import { Copy, Download, Save } from "lucide-react";
import { Button } from "./Button";

export function PromptEditor({
  content,
  onChange,
  onSave,
  onDownload,
  onCopy
}: {
  content: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onDownload: () => void;
  onCopy: () => void;
}) {
  return (
    <section className="editor">
      <div className="editor-bar">
        <strong>Prompt</strong>
        <div className="editor-actions">
          <Button onClick={onDownload}><Download className="icon" />下载</Button>
          <Button onClick={onCopy}><Copy className="icon" />复制</Button>
          <Button variant="primary" onClick={onSave}><Save className="icon" />保存</Button>
        </div>
      </div>
      <textarea
        aria-label="提示词正文"
        value={content}
        onChange={(event) => onChange(event.target.value)}
      />
    </section>
  );
}
