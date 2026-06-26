import { Check, X } from "lucide-react";
import { Button } from "../../shared/components/Button";
import type { ImportPreview } from "../../shared/types";

export function ImportPage({
  preview,
  onCancel,
  onConfirm
}: {
  preview: ImportPreview | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <main className="main detail-main">
      <section className="import-card">
        <h1>导入预览</h1>
        <p>合并导入，不静默覆盖或删除本地数据。</p>
        <div className="import-grid">
          <div><strong>{preview?.scenesToAdd ?? 0}</strong><span>新增 Scene</span></div>
          <div><strong>{preview?.promptsToAdd ?? 0}</strong><span>新增 Prompt</span></div>
          <div><strong>{preview?.versionsToAdd ?? 0}</strong><span>新增版本</span></div>
        </div>
        <div className="page-actions">
          <Button onClick={onCancel}><X className="icon" />取消</Button>
          <Button variant="primary" onClick={onConfirm}><Check className="icon" />执行导入</Button>
        </div>
      </section>
    </main>
  );
}
