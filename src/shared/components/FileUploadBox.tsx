import { ImagePlus, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { RequiredMarker } from "./RequiredMarker";

export function FileUploadBox({
  label,
  actionLabel,
  ariaLabel,
  accept,
  file,
  preview = false,
  required = false,
  className,
  onChange
}: {
  label: string;
  actionLabel: string;
  ariaLabel: string;
  accept: string;
  file?: File;
  preview?: boolean;
  required?: boolean;
  className?: string;
  onChange: (file: File | undefined) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!preview || !file || !file.type.startsWith("image/") || typeof URL.createObjectURL !== "function") {
      setPreviewUrl(null);
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, preview]);

  const rootClassName = ["file-upload-box", preview ? "image-file-upload-box" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");
  const Icon = preview ? ImagePlus : Upload;

  return (
    <label className={rootClassName}>
      <span className="file-upload-label">{label}{required && <RequiredMarker />}</span>
      <span className="file-upload-surface">
        {previewUrl ? (
          <img className="file-upload-preview" src={previewUrl} alt={`${file?.name ?? "图片"} 预览`} />
        ) : (
          <span className="file-upload-empty">
            <Icon className="icon" />
            <span>{actionLabel}</span>
          </span>
        )}
      </span>
      <span className="file-upload-name">{file?.name ?? "未选择文件"}</span>
      <input
        className="file-upload-input"
        aria-label={ariaLabel}
        type="file"
        accept={accept}
        onChange={(event) => onChange(event.target.files?.[0])}
      />
    </label>
  );
}
