import { useEffect, useState } from "react";
import { imageAssetService } from "../services/imageAssetService";

export function ImageAssetPreview({
  assetId,
  alt,
  className
}: {
  assetId?: string;
  alt: string;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    setSrc(null);
    if (!assetId || typeof URL.createObjectURL !== "function") return undefined;
    void imageAssetService.createObjectUrl(assetId).then((url) => {
      if (!active) {
        URL.revokeObjectURL(url);
        return;
      }
      objectUrl = url;
      setSrc(url);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [assetId]);

  if (!src) {
    return <div className={className ? `${className} image-preview-placeholder` : "image-preview-placeholder"} />;
  }

  return <img className={className} src={src} alt={alt} />;
}
