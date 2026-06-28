import { FileText, History, Tags } from "lucide-react";
import { lazy, Suspense } from "react";
import { TagInput } from "../../shared/components/TagInput";
import { VersionHistory } from "../../shared/components/VersionHistory";
import { FIELD_LIMITS } from "../../shared/constants";
import type { PromptTag, PromptVersion } from "../../shared/types";

const PromptEditor = lazy(() =>
  import("../../shared/components/PromptEditor").then((module) => ({ default: module.PromptEditor }))
);

export function PromptWorkspace({
  content,
  description,
  tags,
  versions,
  latestVersionId,
  onChangeContent,
  onChangeDescription,
  onBlurDescription,
  onChangeTags,
  onCopyEditor,
  onDownloadEditor,
  onCompareToLatest
}: {
  content: string;
  description: string;
  tags: PromptTag[];
  versions?: PromptVersion[];
  latestVersionId?: string;
  onChangeContent: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onBlurDescription?: () => void;
  onChangeTags: (tags: PromptTag[]) => void;
  onCopyEditor: (content: string) => void;
  onDownloadEditor: (content: string) => void;
  onCompareToLatest?: (versionId: string) => void;
}) {
  return (
    <div className="detail-grid">
      <Suspense fallback={<section className="editor editor-light editor-loading">加载编辑器...</section>}>
        <PromptEditor
          content={content}
          onChange={onChangeContent}
          onDownload={() => onDownloadEditor(content)}
          onCopy={() => onCopyEditor(content)}
        />
      </Suspense>
      <aside className="right-panel">
        <section className="detail-info-section">
          <div className="metadata-form">
            <label className="field">
              <span className="side-section-heading"><FileText className="icon" /><span>亮点</span></span>
              <textarea
                aria-label="亮点"
                maxLength={FIELD_LIMITS.highlight}
                value={description}
                onChange={(event) => onChangeDescription(event.target.value.slice(0, FIELD_LIMITS.highlight))}
                onBlur={onBlurDescription}
              />
            </label>
            <div className="field">
              <span className="side-section-heading"><Tags className="icon" /><span>标签</span></span>
              <TagInput tags={tags} maxTagLength={FIELD_LIMITS.tag} showAddButton={false} onChange={onChangeTags} />
            </div>
          </div>
        </section>
        {versions && latestVersionId && onCompareToLatest && (
          <>
            <div className="side-section-heading version-heading"><History className="icon" /><span>版本历史</span></div>
            <VersionHistory
              latestVersionId={latestVersionId}
              versions={versions}
              onCompareToLatest={onCompareToLatest}
            />
          </>
        )}
      </aside>
    </div>
  );
}
