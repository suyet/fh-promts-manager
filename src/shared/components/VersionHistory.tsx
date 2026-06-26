import { Copy, GitCompare } from "lucide-react";
import type { PromptVersion } from "../types";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

export function VersionHistory({
  versions,
  latestVersionId,
  onCopy,
  onCompareToLatest
}: {
  versions: PromptVersion[];
  latestVersionId: string;
  onCopy: (versionId: string) => void;
  onCompareToLatest: (versionId: string) => void;
}) {
  return (
    <section>
      <h2>版本历史</h2>
      <div className="version-list">
        {versions.map((version) => {
          const isLatest = version.id === latestVersionId;
          return (
            <div className="version-row" key={version.id}>
              <div>
                <strong>v{version.versionNumber}{isLatest ? " Latest" : ""}</strong>
                <p>{version.note}</p>
              </div>
              <div className="card-icon-actions">
                {!isLatest && (
                  <Button onClick={() => onCompareToLatest(version.id)}>
                    <GitCompare className="icon" />Compare to Latest
                  </Button>
                )}
                <IconButton label="复制版本" icon={<Copy className="icon" />} onClick={() => onCopy(version.id)} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
