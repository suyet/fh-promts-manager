import { IMAGE_LIMITS } from "../constants";
import { repositories } from "../data/repositories";
import type { ImageAsset, ImageMimeType } from "../types";

function now() {
  return new Date().toISOString();
}

function generateId() {
  return crypto.randomUUID();
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function isAllowedMimeType(type: string): type is ImageMimeType {
  return (IMAGE_LIMITS.allowedMimeTypes as readonly string[]).includes(type);
}

export const imageAssetService = {
  async sha256(blob: Blob) {
    return toHex(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()));
  },

  validateFile(file: File | Blob) {
    if (!isAllowedMimeType(file.type)) {
      throw new Error("仅支持 PNG、JPG、WebP 图片。");
    }
    if (file.size > IMAGE_LIMITS.maxImageBytes) {
      throw new Error("图片不能超过 10MB。");
    }
  },

  async createFromFile(file: File): Promise<ImageAsset> {
    this.validateFile(file);
    const mimeType = file.type as ImageMimeType;
    const data = await file.arrayBuffer();
    const asset: ImageAsset = {
      id: generateId(),
      mimeType,
      size: file.size,
      sha256: await this.sha256(new Blob([data], { type: mimeType })),
      data,
      createdAt: now()
    };
    await repositories.imageAssets.put(asset);
    return asset;
  },

  async createObjectUrl(assetId: string) {
    const asset = await repositories.imageAssets.get(assetId);
    if (!asset) {
      throw new Error("Image asset not found.");
    }
    return URL.createObjectURL(new Blob([asset.data], { type: asset.mimeType }));
  }
};
