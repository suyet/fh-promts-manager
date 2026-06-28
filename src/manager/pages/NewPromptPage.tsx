import { ArrowLeft, Save } from "lucide-react";
import { useState } from "react";
import { Button } from "../../shared/components/Button";
import { FileUploadBox } from "../../shared/components/FileUploadBox";
import { IconButton } from "../../shared/components/IconButton";
import { FIELD_LIMITS } from "../../shared/constants";
import { PromptWorkspace } from "../components/PromptWorkspace";
import type { PromptTag, Scene } from "../../shared/types";

export function NewPromptPage({
  scene,
  onBack,
  onSave
}: {
  scene: Scene | null;
  onBack: () => void;
  onSave: (input: { title: string; description: string; tags: PromptTag[]; content: string; imageFile?: File }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<PromptTag[]>([]);
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const isImagePrompt = scene?.promptType === "image";
  const canSave = Boolean(title.trim() && content.trim() && (!isImagePrompt || imageFile));

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
                content,
                imageFile
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
        {isImagePrompt ? (
          <div className="image-create-shell">
            <FileUploadBox
              label="上传封面图片"
              actionLabel="选择图片"
              ariaLabel="上传封面图片"
              accept="image/png,image/jpeg,image/webp"
              file={imageFile}
              preview
              className="image-create-upload"
              onChange={setImageFile}
            />
            <div className="image-create-editor">
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
            </div>
          </div>
        ) : (
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
        )}
      </section>
    </main>
  );
}
