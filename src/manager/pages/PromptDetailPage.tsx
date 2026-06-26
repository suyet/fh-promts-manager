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
  onCompareToLatest
}: {
  item: PromptWithLatest;
  versions: PromptVersion[];
  onBack: () => void;
  onCopyLatest: () => void;
  onDelete: () => void;
  onSaveVersion: (content: string) => void;
  onCompareToLatest: (versionId: string) => void;
}) {
  const [content, setContent] = useState(item.latestVersion.content);
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
            <IconButton label="收藏" icon={<Star className="icon" />} />
            <Button variant="danger" onClick={onDelete}><Trash2 className="icon" />删除</Button>
            <Button variant="primary" onClick={onCopyLatest}><Copy className="icon" />复制</Button>
          </div>
        </div>
        <div className="detail-grid">
          <PromptEditor
            content={content}
            onChange={setContent}
            onSave={() => onSaveVersion(content)}
            onDownload={() => undefined}
            onCopy={() => undefined}
          />
          <aside className="right-panel">
            <section>
              <h2>详细信息</h2>
              <p>场景：{item.scene.name}</p>
              <p>标签：{item.prompt.tags.join(", ")}</p>
              <p>描述：{item.prompt.description}</p>
            </section>
            <VersionHistory
              latestVersionId={item.prompt.latestVersionId}
              versions={versions}
              onCopy={() => undefined}
              onCompareToLatest={onCompareToLatest}
            />
          </aside>
        </div>
      </section>
    </main>
  );
}
