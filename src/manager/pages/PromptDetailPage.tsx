import { ArrowLeft, Copy, Save, Star, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../shared/components/Button";
import { IconButton } from "../../shared/components/IconButton";
import { FIELD_LIMITS } from "../../shared/constants";
import { PromptWorkspace } from "../components/PromptWorkspace";
import type { PromptVersion, PromptWithLatest } from "../../shared/types";

function formatDate(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

export function PromptDetailPage({
  item,
  versions,
  onBack,
  onCopyLatest,
  onDelete,
  onSaveVersion,
  onSaveMetadata,
  onToggleFavorite,
  onCopyEditor,
  onDownloadEditor,
  onCompareToLatest
}: {
  item: PromptWithLatest;
  versions: PromptVersion[];
  onBack: () => void;
  onCopyLatest: () => void;
  onDelete: () => void;
  onSaveVersion: (input: { content: string; description: string; tags: string[]; customVersionLabel?: string }) => void;
  onSaveMetadata: (input: { title: string; favorite: boolean }) => void;
  onToggleFavorite: () => void;
  onCopyEditor: (content: string) => void;
  onDownloadEditor: (content: string) => void;
  onCompareToLatest: (versionId: string) => void;
}) {
  const [content, setContent] = useState(item.latestVersion.content);
  const [title, setTitle] = useState(item.prompt.title);
  const [description, setDescription] = useState(item.latestVersion.description);
  const [tags, setTags] = useState<string[]>(item.latestVersion.tags);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [versionLabel, setVersionLabel] = useState(`v${item.prompt.latestVersionNumber + 1}`);
  const hasUnsavedChanges = content !== item.latestVersion.content;
  const displayVersionLabel = item.latestVersion.customVersionLabel || `v${item.prompt.latestVersionNumber}`;

  useEffect(() => {
    setContent(item.latestVersion.content);
    setTitle(item.prompt.title);
    setDescription(item.latestVersion.description);
    setTags(item.latestVersion.tags);
    setVersionLabel(`v${item.prompt.latestVersionNumber + 1}`);
    setIsEditingTitle(false);
    setIsSaveDialogOpen(false);
  }, [item.prompt.id, item.latestVersion.id]);

  function handleBack() {
    if (hasUnsavedChanges && !window.confirm("未保存的编辑内容将被丢弃，确认离开？")) return;
    onBack();
  }

  function saveMetadata(next: { title?: string; favorite?: boolean }) {
    const nextTitle = next.title ?? title;
    const nextFavorite = next.favorite ?? item.prompt.favorite;
    onSaveMetadata({
      title: nextTitle.trim(),
      favorite: nextFavorite
    });
  }

  function finishTitleEdit() {
    setIsEditingTitle(false);
    saveMetadata({ title });
  }

  function handleTagsChange(nextTags: string[]) {
    setTags(nextTags);
  }

  function confirmSaveVersion() {
    const defaultVersionLabel = `v${item.prompt.latestVersionNumber + 1}`;
    const customVersionLabel = versionLabel.trim();
    onSaveVersion({
      content,
      description: description.trim(),
      tags,
      customVersionLabel: customVersionLabel && customVersionLabel !== defaultVersionLabel ? customVersionLabel : undefined
    });
    setIsSaveDialogOpen(false);
  }

  return (
    <main className="main detail-main">
      <section className="workbench full">
        <div className="sub-header">
          <div className="sub-left">
            <IconButton className="bare-icon-btn" label="返回" icon={<ArrowLeft className="icon" />} onClick={handleBack} />
            {isEditingTitle ? (
              <input
                aria-label="编辑提示词标题"
                className="title-inline-input"
                autoFocus
                maxLength={FIELD_LIMITS.promptTitle}
                value={title}
                onBlur={finishTitleEdit}
                onChange={(event) => setTitle(event.target.value.slice(0, FIELD_LIMITS.promptTitle))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
              />
            ) : (
              <button className="title-edit-button" aria-label={`编辑标题 ${title}`} onClick={() => setIsEditingTitle(true)}>
                <h1>{title}</h1>
              </button>
            )}
            <span className="version-pill">{displayVersionLabel}</span>
            <div className="detail-sub-meta">
              <span className="detail-sub-meta-item">场景：{item.scene.name}</span>
              <span className="detail-sub-meta-item">更新于 {formatDate(item.prompt.updatedAt)}</span>
            </div>
          </div>
          <div className="sub-right">
            <IconButton
              className="bare-icon-btn"
              label="保存新版本"
              icon={<Save className="icon" />}
              onClick={() => {
                setVersionLabel(`v${item.prompt.latestVersionNumber + 1}`);
                setIsSaveDialogOpen(true);
              }}
            />
            <IconButton
              className="bare-icon-btn"
              label={item.prompt.favorite ? "取消收藏" : "收藏"}
              icon={<Star className="icon" fill={item.prompt.favorite ? "currentColor" : "none"} />}
              onClick={onToggleFavorite}
            />
            <IconButton className="bare-icon-btn danger-icon-btn" label="删除" icon={<Trash2 className="icon" />} onClick={onDelete} />
            <span className="detail-action-divider">|</span>
            <Button className="detail-copy-button" variant="primary" onClick={onCopyLatest}><Copy className="icon" />复制最新版本</Button>
          </div>
        </div>
        <PromptWorkspace
          content={content}
          description={description}
          tags={tags}
          versions={versions}
          latestVersionId={item.prompt.latestVersionId}
          onChangeContent={setContent}
          onChangeDescription={setDescription}
          onChangeTags={handleTagsChange}
          onCopyEditor={onCopyEditor}
          onDownloadEditor={onDownloadEditor}
          onCompareToLatest={onCompareToLatest}
        />
      </section>
      {isSaveDialogOpen && (
        <div className="modal-backdrop">
          <section className="modal save-version-modal" role="dialog" aria-modal="true" aria-labelledby="save-version-title">
            <div className="modal-head">
              <h2 id="save-version-title">保存新版本</h2>
              <IconButton className="bare-icon-btn" label="关闭" icon={<X className="icon" />} onClick={() => setIsSaveDialogOpen(false)} />
            </div>
            <div className="save-version-body">
              <p>请确认亮点和标签已更新</p>
              <label className="field">
                <span>版本号</span>
                <input
                  aria-label="版本号"
                  maxLength={FIELD_LIMITS.customVersionLabel}
                  value={versionLabel}
                  onChange={(event) => setVersionLabel(event.target.value.slice(0, FIELD_LIMITS.customVersionLabel))}
                />
              </label>
            </div>
            <div className="modal-actions">
              <Button onClick={() => setIsSaveDialogOpen(false)}>取消</Button>
              <Button variant="primary" onClick={confirmSaveVersion}>确认保存</Button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
