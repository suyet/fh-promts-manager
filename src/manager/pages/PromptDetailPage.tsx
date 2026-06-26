import { ArrowLeft, Copy, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../../shared/components/Button";
import { IconButton } from "../../shared/components/IconButton";
import { PromptEditor } from "../../shared/components/PromptEditor";
import { VersionHistory } from "../../shared/components/VersionHistory";
import type { PromptVersion, PromptWithLatest } from "../../shared/types";

export function PromptDetailPage({
  item,
  versions,
  onBack,
  onCopyLatest,
  onDelete,
  onSaveVersion,
  onSaveMetadata,
  onToggleFavorite,
  onCopyVersion,
  onCopyEditor,
  onDownloadEditor,
  onCompareToLatest
}: {
  item: PromptWithLatest;
  versions: PromptVersion[];
  onBack: () => void;
  onCopyLatest: () => void;
  onDelete: () => void;
  onSaveVersion: (content: string) => void;
  onSaveMetadata: (input: { title: string; description: string; tags: string[] }) => void;
  onToggleFavorite: () => void;
  onCopyVersion: (versionId: string) => void;
  onCopyEditor: (content: string) => void;
  onDownloadEditor: (content: string) => void;
  onCompareToLatest: (versionId: string) => void;
}) {
  const [content, setContent] = useState(item.latestVersion.content);
  const [title, setTitle] = useState(item.prompt.title);
  const [description, setDescription] = useState(item.prompt.description);
  const [tags, setTags] = useState(item.prompt.tags.join(", "));
  const hasUnsavedChanges = content !== item.latestVersion.content;

  function handleBack() {
    if (hasUnsavedChanges && !window.confirm("未保存的编辑内容将被丢弃，确认离开？")) return;
    onBack();
  }

  return (
    <main className="main detail-main">
      <section className="workbench full">
        <div className="sub-header">
          <div className="sub-left">
            <IconButton label="返回" icon={<ArrowLeft className="icon" />} onClick={handleBack} />
            <h1>{item.prompt.title}</h1>
            <span className="version-pill">v{item.prompt.latestVersionNumber} Latest</span>
          </div>
          <div className="sub-right">
            <IconButton
              label={item.prompt.favorite ? "取消收藏" : "收藏"}
              icon={<Star className="icon" fill={item.prompt.favorite ? "currentColor" : "none"} />}
              onClick={onToggleFavorite}
            />
            <Button variant="danger" onClick={onDelete}><Trash2 className="icon" />删除</Button>
            <Button variant="primary" onClick={onCopyLatest}><Copy className="icon" />复制最新版本</Button>
          </div>
        </div>
        <div className="detail-grid">
          <PromptEditor
            content={content}
            onChange={setContent}
            onSave={() => onSaveVersion(content)}
            onDownload={() => onDownloadEditor(content)}
            onCopy={() => onCopyEditor(content)}
          />
          <aside className="right-panel">
            <section>
              <h2>详细信息</h2>
              <div className="metadata-form">
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
                <p>场景：{item.scene.name}</p>
                <Button
                  variant="primary"
                  onClick={() => onSaveMetadata({
                    title: title.trim(),
                    description: description.trim(),
                    tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean)
                  })}
                >
                  保存信息
                </Button>
              </div>
            </section>
            <VersionHistory
              latestVersionId={item.prompt.latestVersionId}
              versions={versions}
              onCopy={onCopyVersion}
              onCompareToLatest={onCompareToLatest}
            />
          </aside>
        </div>
      </section>
    </main>
  );
}
