import { ArrowLeft, Copy } from "lucide-react";
import { IconButton } from "../../shared/components/IconButton";
import { ImageAssetPreview } from "../../shared/components/ImageAssetPreview";
import type { VersionDiff } from "../../shared/services/diffService";

export function DiffPage({
  diff,
  onBack,
  onCopyHistory,
  onCopyLatest
}: {
  diff: VersionDiff;
  onBack: () => void;
  onCopyHistory: () => void;
  onCopyLatest: () => void;
}) {
  return (
    <main className="main detail-main">
      <section className="workbench full">
        <div className="sub-header">
          <div className="sub-left">
            <IconButton label="返回" icon={<ArrowLeft className="icon" />} onClick={onBack} />
            <h1>Comparing {diff.historyLabel} to {diff.latestLabel}</h1>
          </div>
        </div>
        <div className="diff-grid">
          <section className="diff-pane">
            <div className="diff-pane-heading">
              <h2>{diff.historyLabel}</h2>
              <IconButton label={`复制 ${diff.historyLabel}`} icon={<Copy className="icon" />} onClick={onCopyHistory} />
            </div>
            {diff.historyImageAssetId && (
              <div className="diff-preview-media">
                <ImageAssetPreview assetId={diff.historyImageAssetId} alt={`${diff.historyLabel} 图片`} className="diff-preview-image" />
              </div>
            )}
            {diff.parts.filter((part) => part.type !== "added").map((part, index) => (
              <pre className={`diff-line ${part.type}`} key={`history-${index}`}>{part.text}</pre>
            ))}
          </section>
          <section className="diff-pane">
            <div className="diff-pane-heading">
              <h2>{diff.latestLabel}</h2>
              <IconButton label={`复制 ${diff.latestLabel}`} icon={<Copy className="icon" />} onClick={onCopyLatest} />
            </div>
            {diff.latestImageAssetId && (
              <div className="diff-preview-media">
                <ImageAssetPreview assetId={diff.latestImageAssetId} alt={`${diff.latestLabel} 图片`} className="diff-preview-image" />
              </div>
            )}
            {diff.parts.filter((part) => part.type !== "removed").map((part, index) => (
              <pre className={`diff-line ${part.type}`} key={`latest-${index}`}>{part.text}</pre>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}
