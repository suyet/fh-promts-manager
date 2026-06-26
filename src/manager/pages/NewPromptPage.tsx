import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { IconButton } from "../../shared/components/IconButton";
import { PromptEditor } from "../../shared/components/PromptEditor";

export function NewPromptPage({
  onBack,
  onSave
}: {
  onBack: () => void;
  onSave: (input: { title: string; description: string; tags: string[]; content: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
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
            <input aria-label="Prompt 标题" value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="field">
            <span>Prompt 描述</span>
            <textarea aria-label="Prompt 描述" value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
          <label className="field">
            <span>标签</span>
            <input aria-label="标签" value={tags} onChange={(event) => setTags(event.target.value)} />
          </label>
          <PromptEditor
            content={content}
            onChange={setContent}
            onSave={() => onSave({
              title,
              description,
              tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
              content
            })}
            onDownload={() => undefined}
            onCopy={() => undefined}
          />
        </div>
      </section>
    </main>
  );
}
