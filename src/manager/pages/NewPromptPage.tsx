import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { IconButton } from "../../shared/components/IconButton";
import { PromptEditor } from "../../shared/components/PromptEditor";

export function NewPromptPage({
  onBack,
  onSave
}: {
  onBack: () => void;
  onSave: (input: { title: string; content: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  return (
    <main className="main detail-main">
      <section className="workbench full">
        <div className="sub-header">
          <div className="sub-left">
            <IconButton label="返回" icon={<ArrowLeft className="icon" />} onClick={onBack} />
            <h1>新建 Prompt</h1>
          </div>
        </div>
        <div className="new-prompt-form">
          <label className="field">
            <span>Prompt 标题</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <PromptEditor
            content={content}
            onChange={setContent}
            onSave={() => onSave({ title, content })}
            onDownload={() => undefined}
            onCopy={() => undefined}
          />
        </div>
      </section>
    </main>
  );
}
