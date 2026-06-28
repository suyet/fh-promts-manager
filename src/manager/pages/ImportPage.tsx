import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../shared/components/Button";
import { FileUploadBox } from "../../shared/components/FileUploadBox";
import type { ImportPreview } from "../../shared/types";

export function ImportPage({
  preview,
  error,
  onPreviewFile,
  onCancel,
  onConfirm
}: {
  preview: ImportPreview | null;
  error: string | null;
  onPreviewFile: (file: File) => Promise<ImportPreview>;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [currentPreview, setCurrentPreview] = useState(preview);
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);

  useEffect(() => {
    setCurrentPreview(preview);
  }, [preview]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setSelectedFile(file);
    try {
      setCurrentPreview(await onPreviewFile(file));
    } catch {
      setCurrentPreview(null);
    }
  }

  return (
    <main className="main detail-main">
      <section className="import-card">
        <h1>导入预览</h1>
        <p>合并导入，不静默覆盖或删除本地数据。</p>
        <FileUploadBox
          label="选择备份文件"
          actionLabel="选择 ZIP 文件"
          ariaLabel="选择备份文件"
          accept="application/zip,.zip"
          file={selectedFile}
          onChange={(file) => {
            void handleFile(file);
          }}
        />
        {error ? <p className="error-text">{error}</p> : null}
        <div className="import-grid">
          <div><strong>{currentPreview?.scenes ?? 0}</strong><span>Scene</span></div>
          <div><strong>{currentPreview?.prompts ?? 0}</strong><span>Prompt</span></div>
          <div><strong>{currentPreview?.versions ?? 0}</strong><span>版本</span></div>
          <div><strong>{currentPreview?.imageAssets ?? 0}</strong><span>图片</span></div>
        </div>
        <div className="page-actions">
          <Button onClick={onCancel}><X className="icon" />取消</Button>
          <Button variant="primary" disabled={!currentPreview} onClick={onConfirm}><Check className="icon" />执行导入</Button>
        </div>
      </section>
    </main>
  );
}
