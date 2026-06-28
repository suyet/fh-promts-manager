import { beforeEach, describe, expect, it, vi } from "vitest";
import { IMAGE_LIMITS } from "../../src/shared/constants";
import { resetDatabase } from "../../src/shared/data/db";
import { repositories } from "../../src/shared/data/repositories";
import { imageAssetService } from "../../src/shared/services/imageAssetService";
import { imageAssetFactory } from "../../src/test/factories";

describe("imageAssetService", () => {
  beforeEach(async () => {
    await resetDatabase();
    vi.unstubAllGlobals();
  });

  it("stores valid image files with sha256 metadata", async () => {
    const file = new File(["image-bytes"], "cover.png", { type: "image/png" });

    const asset = await imageAssetService.createFromFile(file);
    const stored = await repositories.imageAssets.get(asset.id);

    expect(asset).toMatchObject({
      mimeType: "image/png",
      size: file.size,
      sha256: "2c8648d103e3dd7ad87660da0f126a1443b6d21ac1bd3ec000c5e24e2373a90c"
    });
    expect(stored?.data.byteLength).toBe(file.size);
  });

  it("rejects unsupported and oversized images", async () => {
    const textFile = new File(["plain"], "plain.txt", { type: "text/plain" });
    const oversized = new File([new Uint8Array(IMAGE_LIMITS.maxImageBytes + 1)], "large.png", {
      type: "image/png"
    });

    await expect(imageAssetService.createFromFile(textFile)).rejects.toThrow("仅支持 PNG、JPG、WebP 图片");
    await expect(imageAssetService.createFromFile(oversized)).rejects.toThrow("图片不能超过 10MB");
  });

  it("creates object urls for stored assets", async () => {
    const createObjectUrl = vi.fn((_: Blob) => "blob:test-url");
    vi.stubGlobal("URL", { ...URL, createObjectURL: createObjectUrl });
    const asset = imageAssetFactory();
    await repositories.imageAssets.put(asset);

    await expect(imageAssetService.createObjectUrl(asset.id)).resolves.toBe("blob:test-url");
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    const blob = createObjectUrl.mock.calls[0]![0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("image/png");
    await expect(blob.text()).resolves.toBe("image-bytes");
  });
});
