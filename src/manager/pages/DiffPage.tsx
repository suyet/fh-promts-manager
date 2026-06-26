import { ArrowLeft, Copy } from "lucide-react";
import { Button } from "../../shared/components/Button";
import { IconButton } from "../../shared/components/IconButton";
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
          <div className="sub-right">
            <Button onClick={onCopyHistory}><Copy className="icon" />复制 {diff.historyLabel}</Button>
            <Button variant="primary" onClick={onCopyLatest}><Copy className="icon" />复制 Latest</Button>
          </div>
        </div>
        <div className="diff-grid">
          <section className="diff-pane">
            <h2>{diff.historyLabel}</h2>
            {diff.parts.filter((part) => part.type !== "added").map((part, index) => (
              <pre className={`diff-line ${part.type}`} key={`history-${index}`}>{part.text}</pre>
            ))}
          </section>
          <section className="diff-pane">
            <h2>{diff.latestLabel}</h2>
            {diff.parts.filter((part) => part.type !== "removed").map((part, index) => (
              <pre className={`diff-line ${part.type}`} key={`latest-${index}`}>{part.text}</pre>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}
