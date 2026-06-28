import { Copy, GitCompare, X } from "lucide-react";
import { useState } from "react";
import { getPromptTagStyle, normalizePromptTags } from "../tagUtils";
import type { PromptVersion } from "../types";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { ImageAssetPreview } from "./ImageAssetPreview";

function formatDate(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

export function VersionHistory({
  versions,
  latestVersionId,
  onCompareToLatest,
  onCopyVersion
}: {
  versions: PromptVersion[];
  latestVersionId: string;
  onCompareToLatest: (versionId: string) => void;
  onCopyVersion?: (versionId: string) => void;
}) {
  const [previewVersion, setPreviewVersion] = useState<PromptVersion | null>(null);
  const orderedVersions = [...versions].sort((left, right) => {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
  const previewLabel = previewVersion ? (previewVersion.customVersionLabel || `v${previewVersion.versionNumber}`) : "";

  return (
    <>
      <section className="version-section">
        <div className="version-list">
          {orderedVersions.map((version) => {
            const isLatest = version.id === latestVersionId;
            const label = version.customVersionLabel || `v${version.versionNumber}`;
            return (
              <div
                className={isLatest ? "version-row current" : "version-row"}
                data-testid="version-card"
                key={version.id}
                onClick={() => setPreviewVersion(version)}
              >
                <div className="version-info">
                  <div className="version-head-line">
                    <strong>{label}</strong>
                    {isLatest && <span className="version-latest-badge">最新</span>}
                    {!isLatest && (
                      <IconButton
                        className="bare-icon-btn"
                        label="与最新版本对比"
                        icon={<GitCompare className="icon" />}
                        onClick={(event) => {
                          event.stopPropagation();
                          onCompareToLatest(version.id);
                        }}
                      />
                    )}
                  </div>
                  <p className="version-highlight">{version.description}</p>
                  <div className="version-card-footer">
                    <span className="version-date">{formatDate(version.createdAt)}</span>
                    <span className="version-tags">
                      {normalizePromptTags(version.tags).map((tag) => (
                        <span className="tag" key={`${version.id}-${tag.label}-${tag.color}`} style={getPromptTagStyle(tag.color)}>
                          {tag.label}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {previewVersion && (
        <div className="modal-backdrop">
          <section className="modal version-preview-modal" role="dialog" aria-modal="true" aria-labelledby="version-preview-title">
            <div className="modal-head">
              <h2 id="version-preview-title">{previewLabel} 版本预览</h2>
              <IconButton className="bare-icon-btn" label="关闭" icon={<X className="icon" />} onClick={() => setPreviewVersion(null)} />
            </div>
            <div className="version-preview-body">
              <div className="version-preview-media">
                {previewVersion.imageAssetId && (
                  <ImageAssetPreview assetId={previewVersion.imageAssetId} alt={`${previewLabel} 图片`} className="version-preview-image" />
                )}
              </div>
              <div className="version-preview-copy">
                <pre className="version-preview-text">{previewVersion.content}</pre>
              </div>
            </div>
            <div className="modal-actions">
              <Button
                variant="primary"
                onClick={() => onCopyVersion?.(previewVersion.id)}
              >
                <Copy className="icon" />复制提示词
              </Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
