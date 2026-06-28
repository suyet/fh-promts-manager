import { ArrowLeft, Save } from "lucide-react";
import { useState } from "react";
import { Button } from "../../shared/components/Button";
import { IconButton } from "../../shared/components/IconButton";
import { FIELD_LIMITS } from "../../shared/constants";
import { PromptWorkspace } from "../components/PromptWorkspace";

export function NewPromptPage({
  onBack,
  onSave
}: {
  onBack: () => void;
  onSave: (input: { title: string; description: string; tags: string[]; content: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const canSave = Boolean(title.trim() && content.trim());

  return (
    <main className="main detail-main">
      <section className="workbench full">
        <div className="sub-header">
          <div className="sub-left">
            <IconButton label="返回" icon={<ArrowLeft className="icon" />} onClick={onBack} />
            <h1>新建 Prompt</h1>
          </div>
          <div className="sub-right">
            <Button
              variant="primary"
              disabled={!canSave}
              onClick={() => onSave({
                title,
                description,
                tags,
                content
              })}
            >
              <Save className="icon" />保存
            </Button>
          </div>
        </div>
        <div className="new-prompt-title-row">
          <label className="field">
            <span>Prompt 标题</span>
            <input
              aria-label="Prompt 标题"
              maxLength={FIELD_LIMITS.promptTitle}
              value={title}
              onChange={(event) => setTitle(event.target.value.slice(0, FIELD_LIMITS.promptTitle))}
            />
          </label>
        </div>
        <PromptWorkspace
          content={content}
          description={description}
          tags={tags}
          onChangeContent={setContent}
          onChangeDescription={setDescription}
          onChangeTags={setTags}
          onCopyEditor={() => undefined}
          onDownloadEditor={() => undefined}
        />
      </section>
    </main>
  );
}
