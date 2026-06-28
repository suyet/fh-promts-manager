import { GitCompare } from "lucide-react";
import type { PromptVersion } from "../types";
import { IconButton } from "./IconButton";

function formatDate(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

export function VersionHistory({
  versions,
  latestVersionId,
  onCompareToLatest
}: {
  versions: PromptVersion[];
  latestVersionId: string;
  onCompareToLatest: (versionId: string) => void;
}) {
  const orderedVersions = [...versions].sort((left, right) => {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });

  return (
    <section className="version-section">
      <div className="version-list">
        {orderedVersions.map((version) => {
          const isLatest = version.id === latestVersionId;
          const label = version.customVersionLabel || `v${version.versionNumber}`;
          return (
            <div className={isLatest ? "version-row current" : "version-row"} data-testid="version-card" key={version.id}>
              <div className="version-info">
                <div className="version-head-line">
                  <strong>{label}{isLatest ? " 当前" : ""}</strong>
                  {!isLatest && (
                    <IconButton
                      className="bare-icon-btn"
                      label="与最新版本对比"
                      icon={<GitCompare className="icon" />}
                      onClick={() => onCompareToLatest(version.id)}
                    />
                  )}
                </div>
                <p className="version-highlight">{version.description}</p>
                <div className="version-card-footer">
                  <span className="version-date">{formatDate(version.createdAt)}</span>
                  <span className="version-tags">
                    {version.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
