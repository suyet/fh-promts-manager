# FH Prompt Manager V2 设计文档

日期：2026-06-28
状态：待用户审阅

## 目标

V2 在 MVP 的文本 Prompt 管理基础上，新增“生图”类型 Prompt 管理能力。核心目标是让用户不仅能保存生图提示词文本，还能保存每个版本对应的单张效果图，从而把“提示词 + 生成效果 + 版本说明”作为一个完整资产管理。

V2 仍然保持本地优先、离线可用、无后端服务的产品方向。

## 范围

V2 包含：

- Scene 类型：文本、生图。
- Scene 类型显式展示。
- 生图 Prompt 创建、编辑、卡片展示和详情页。
- 生图 Prompt 每个版本绑定一张图片。
- 版本历史只读预览弹窗。
- Diff 页面继续对比 Prompt 文本，并为生图版本提供左右图片预览。
- ZIP 格式导入和导出。
- 导入包结构、数据关系和图片资源校验。

V2 不包含：

- 旧数据迁移或 schema 兼容。
- 单版本多图。
- 历史版本恢复。
- 图片编辑、裁剪、标注。
- 图片视觉差异对比。
- 合并式导入。
- 云同步、账号、团队协作。

## 关键约束

项目当前处于开发阶段，没有需要兼容的历史数据。因此 V2 可以直接调整数据结构和导入导出格式，不需要为 MVP 数据提供迁移路径。

Scene 是 Prompt 类型的唯一来源。Prompt 本身不提供类型选择，也不能脱离 Scene 单独变更类型。

Scene 创建后默认为“文本”，用户可以在保存前或空场景状态下改为“生图”。一旦该 Scene 下存在任何 Prompt，Scene 类型锁定不可修改。

## 类型模型

### Scene

Scene 新增字段：

- `promptType`: `"text" | "image"`

含义：

- `text`：该场景下只能创建文本 Prompt。
- `image`：该场景下只能创建生图 Prompt。

类型展示：

- 首页选择某个 Scene 后，在右侧场景标题附近展示类型徽标，例如“文本”或“生图”。
- Prompt 详情页二级标题中展示类型徽标。
- 弹窗、导入预览、版本预览中如出现 Scene 信息，也应展示类型。

### Prompt

Prompt 继续表示一个提示词资产，包含标题、收藏状态、排序、最新版本指针等 Prompt 级元信息。

Prompt 不保存类型字段。读取 Prompt 类型时，通过 `prompt.sceneId` 找到 Scene，再读取 `scene.promptType`。

### PromptVersion

PromptVersion 继续承载版本级内容：

- Prompt 正文。
- 亮点说明。
- 标签。
- 版本号。
- 自定义版本标签。
- 创建时间。

PromptVersion 新增字段：

- `imageAssetId?: string`

规则：

- 文本 Scene 下的 PromptVersion 不允许存在 `imageAssetId`。
- 生图 Scene 下的 PromptVersion 必须存在 `imageAssetId`。
- 每个 PromptVersion 最多绑定一张图片。
- 历史版本创建后不可变，版本图片也不可变。

## 生图 Prompt 创建

用户在生图 Scene 下点击“新建 Prompt”后，进入生图创建流程。

必填项：

- 标题。
- Prompt 正文。
- 图片。

可选项：

- 亮点说明。
- 标签。

保存规则：

- 未上传图片时不能保存。
- 图片仅能上传一张。
- 保存成功后创建 Prompt 和 v1 PromptVersion。
- v1 的图片作为该 Prompt 卡片封面。

图片格式建议：

- 支持 PNG、JPEG、WebP。
- 不支持 SVG、GIF、HEIC、PSD。
- 单张图片最大 10MB。

## 生图 Prompt 编辑和版本

进入生图 Prompt 详情页时，默认加载最新版本的 Prompt 正文、亮点、标签和图片。

保存新版本规则：

- 保存新版本会创建新的 PromptVersion。
- 新版本默认沿用当前最新版本图片。
- 用户可以在保存前重新上传一张图片，新版本使用新图片。
- 如果用户没有重新上传图片，则新版本继续引用上一版本图片。
- 最新版本图片自动成为 Prompt 卡片封面。

未保存编辑：

- Prompt 正文修改后离开页面，需要沿用 MVP 的未保存确认机制。
- 图片替换如果尚未保存，也应视为未保存变更。
- 亮点、标签如随版本保存，也应纳入未保存变更判断。

## 首页和卡片

文本 Prompt 卡片沿用 MVP 的文本摘要样式。

生图 Prompt 卡片采用图片优先样式：

- 图片封面为视觉主体。
- 封面使用最新版本图片。
- 图片区域固定比例，建议 4:3 或 1:1，避免卡片高度跳动。
- 卡片展示标题、标签、版本号、更新时间。
- 收藏和复制操作仍保留。
- 复制操作复制最新版本 Prompt 正文，不复制图片。

生图 Scene 的卡片网格可以比文本 Scene 更偏向图库浏览，但不引入独立视图模式作为 V2 必需功能。

## 详情页

文本 Prompt 详情页沿用 MVP 的编辑器和右侧信息版本栏布局。

生图 Prompt 详情页采用“大图 + 编辑器 + 信息版本栏”布局。

桌面端布局：

- 左侧：当前版本图片大预览。
- 中间：Prompt 编辑器。
- 右侧：亮点、标签、版本历史。

窄屏布局：

- 图片预览。
- Prompt 编辑器。
- 信息和版本历史。

二级标题行展示：

- 返回按钮。
- Prompt 标题。
- 当前版本标识。
- Scene 名称。
- 类型徽标。
- 更新时间。
- 收藏、删除、保存新版本、复制最新版本等操作。

## 版本历史预览

点击版本历史中的任意版本，打开只读预览弹窗。

文本版本弹窗展示：

- 版本号或自定义版本标签。
- 创建时间。
- Prompt 正文只读预览。
- 亮点。
- 标签。
- 复制提示词按钮。

生图版本弹窗展示：

- 版本号或自定义版本标签。
- 创建时间。
- 图片大预览。
- Prompt 正文只读预览。
- 亮点。
- 标签。
- 复制提示词按钮。

弹窗限制：

- 不支持编辑。
- 不支持恢复版本。
- 不支持替换图片。
- 不支持删除单个历史版本。

## Diff

Diff 功能继续支持“某个历史版本 vs 最新版本”。

文本 Prompt：

- 沿用 MVP 的文本 Diff 逻辑。

生图 Prompt：

- 左侧为历史版本。
- 右侧为最新版本。
- 每侧顶部展示该版本图片预览。
- 每侧下方展示 Prompt 文本。
- 文本内容继续使用 Diff 高亮。
- 图片只做并排预览，不做任何视觉差异分析。

Diff 操作：

- 复制历史版本 Prompt。
- 复制最新版本 Prompt。
- 返回详情页。

## 图片资产存储

图片资产应作为独立本地资源存储，而不是内嵌在 PromptVersion JSON 字段中。

推荐新增 ImageAsset 实体：

- `id`
- `mimeType`
- `size`
- `sha256`
- `blob`
- `createdAt`

PromptVersion 通过 `imageAssetId` 引用图片资产。

同一张图片是否去重不是 V2 必需能力。即使两个版本引用同一张图片，也可以先复用同一个 `imageAssetId`；如果实现成本更低，也可以在保存新版本沿用旧图时直接引用旧资产。

删除 Prompt 时，应删除该 Prompt 所有版本引用且不再被其他版本使用的图片资产。

## 导出格式

V2 导出产物不再是单个 JSON 文件，而是 ZIP 压缩包。

文件名建议：

```text
fh-prompt-manager-export-YYYY-MM-DD-HHmm.zip
```

ZIP 结构：

```text
fh-prompt-manager-export.zip
├─ manifest.json
├─ data/
│  ├─ scenes.json
│  ├─ prompts.json
│  ├─ versions.json
│  └─ usage-records.json
└─ assets/
   └─ images/
      ├─ <imageAssetId>.png
      ├─ <imageAssetId>.jpg
      └─ <imageAssetId>.webp
```

`manifest.json` 包含包级元信息和图片资产清单：

```json
{
  "app": "fh-prompt-manager",
  "schemaVersion": 2,
  "exportedAt": "2026-06-28T10:00:00.000Z",
  "counts": {
    "scenes": 4,
    "prompts": 31,
    "versions": 86,
    "usageRecords": 120,
    "imageAssets": 18
  },
  "assets": [
    {
      "id": "asset-001",
      "path": "assets/images/asset-001.png",
      "mimeType": "image/png",
      "size": 348192,
      "sha256": "..."
    }
  ]
}
```

JSON 数据文件只保存结构化数据。图片文件保存在 `assets/images/` 下，版本通过 `imageAssetId` 引用 manifest 中的资产。

## 导入方式

V2 采用完整替换式导入，不做合并导入。

导入流程：

1. 用户选择 ZIP 文件。
2. 系统在内存中解压。
3. 校验包结构。
4. 校验 manifest。
5. 校验 JSON 数据结构。
6. 校验实体关系。
7. 校验图片资源。
8. 展示导入预览。
9. 用户确认“替换当前本地数据”。
10. 清空当前本地数据。
11. 写入导入包中的数据和图片资产。

导入预览展示：

- Scene 数量。
- Prompt 数量。
- Version 数量。
- 图片数量。
- 使用记录数量。
- 当前导入会替换本地数据的明确提示。

只要存在严重错误，整个导入包不可导入，不做部分导入。

## 导入校验

### 包结构校验

必须满足：

- 文件是 ZIP。
- 存在 `manifest.json`。
- 存在 `data/scenes.json`。
- 存在 `data/prompts.json`。
- 存在 `data/versions.json`。
- 存在 `data/usage-records.json`。
- 所有图片资产路径都位于 `assets/images/` 下。
- 不允许路径穿越，例如 `../` 或绝对路径。

### Manifest 校验

必须满足：

- `app` 等于 `fh-prompt-manager`。
- `schemaVersion` 等于当前 V2 schema 版本。
- `exportedAt` 是有效 ISO 时间。
- `counts` 与实际 JSON 和资产数量一致。
- `assets` 中的 `id` 唯一。
- `assets` 中的 `path` 唯一。

### 数据结构校验

必须满足：

- Scene、Prompt、PromptVersion、UsageRecord 字段完整。
- ID 唯一且非空。
- Scene `promptType` 只能是 `text` 或 `image`。
- Prompt `sceneId` 指向存在的 Scene。
- Prompt `latestVersionId` 指向存在的 PromptVersion。
- Prompt `latestVersionNumber` 等于该 Prompt 的最大版本号。
- PromptVersion `promptId` 指向存在的 Prompt。
- UsageRecord `promptId` 和 `versionId` 指向存在的数据。

### 类型一致性校验

必须满足：

- 文本 Scene 下的所有 PromptVersion 不得存在 `imageAssetId`。
- 生图 Scene 下的所有 PromptVersion 必须存在 `imageAssetId`。
- 每个 PromptVersion 最多引用一个图片资产。
- 每个 `imageAssetId` 必须在 manifest assets 中存在。

### 图片资源校验

必须满足：

- manifest 中声明的图片文件必须存在。
- 文件实际大小必须等于 manifest `size`。
- 文件 SHA-256 必须等于 manifest `sha256`。
- MIME 类型必须在允许列表内：`image/png`、`image/jpeg`、`image/webp`。
- 文件扩展名应与 MIME 类型匹配。
- 单张图片不得超过 10MB。
- 导入 ZIP 总大小建议不得超过 200MB。

## 错误处理

创建生图 Prompt 时：

- 未上传图片：保存按钮不可用，并提示必须上传一张图片。
- 图片格式不支持：拒绝上传并提示支持格式。
- 图片过大：拒绝上传并提示大小限制。

保存新版本时：

- 图片写入失败：不创建新版本，保留当前表单状态。
- PromptVersion 写入失败：不更新 latestVersion 指针。

导入时：

- ZIP 无法解析：提示文件不是有效备份包。
- 缺少必需文件：提示备份包结构不完整。
- schema 不匹配：提示备份包版本不支持。
- 图片校验失败：提示具体资源错误，阻止导入。
- 用户取消确认：不写入任何数据。

## 验收标准

V2 完成时应满足：

- 新建 Scene 默认类型为文本，可改为生图。
- Scene 下存在 Prompt 后，类型锁定不可修改。
- 首页选中 Scene 后，右侧标题区域显示类型徽标。
- Prompt 详情页二级标题显示类型徽标。
- 文本 Prompt 的原有创建、编辑、复制、版本、Diff 行为保持可用。
- 生图 Prompt 创建时必须上传一张图片。
- 生图 Prompt 每个版本有且仅有一张图片。
- 生图 Prompt 卡片使用最新版本图片作为封面。
- 生图 Prompt 保存新版本时默认沿用旧图，也允许上传新图。
- 点击版本历史打开只读预览弹窗。
- 版本预览弹窗只能复制提示词，不提供恢复版本。
- 生图 Diff 页面左右展示版本图片，并继续对 Prompt 文本做 Diff。
- 导出生成包含 JSON 数据和图片资源的 ZIP。
- 导入 ZIP 前进行结构、数据关系和图片校验。
- 导入采用完整替换式策略，确认前不写入任何数据。
- 有严重校验错误时，整个导入包不可导入。
