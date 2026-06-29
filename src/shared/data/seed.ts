import businessSummaryCoverUrl from "../assets/seed/business-summary-cover.png";
import { repositories } from "./repositories";
import { imageAssetService } from "../services/imageAssetService";
import { promptService } from "../services/promptService";
import type { ImageAsset, ImageMimeType, Scene } from "../types";

const DEFAULT_SCENES: Array<Omit<Scene, "createdAt" | "updatedAt">> = [
  {
    id: "scene-text-1",
    name: "文本场景1",
    description: "文本类型的场景，请自行编辑或者删除",
    icon: "pen",
    color: "blue",
    promptType: "text",
    sortOrder: 1
  },
  {
    id: "scene-image-1",
    name: "生图场景1",
    description: "生图类型的场景，请自行编辑或者删除",
    icon: "image",
    color: "orange",
    promptType: "image",
    sortOrder: 2
  }
];

const TEXT_PROMPT_CONTENT = `## 功能描述
{{description}}

## 要求

我想开发一个手机端app，其功能描述如上，现在需要输出高保真的原型图，请通过以下方式帮我完成所有界面的原型设计，并确保这些原型界面可以直接用于开发:

1. 用户体验分析:先分析这个App的主要功能和用户需求，确定核心交互逻辑。

2. 产品界面规划:作为产品经理，定义关键界面，确保信息架构合理。

3. 高保真UI设计:作为UI设计师，设计贴近真实i0S/Android设计规范的界面，使用现代化的UI 元素，使其具有良好的视觉体验。

4. HTML原型实现:使用HTML+Tailwind CSS (或 Bootstrap)生成所有原型界面，并使用FontAwesome(或其他开源UI 组件)让界面更加精美、接近真实的App设计。

5. 拆分代码文件，保持结构清晰:

- 每个界面应作为独立的 HTML文件存放,例如 home.html、profile.html、settings.htm'等。

- index.html作为主入口，不直接写入所有界面的HTML代码，而是使用 iframe的方式嵌入这些HTML片段，并将所有页面直接平铺展示在index页面中，而不是跳转链接。

6. 真实感增强:

- 界面尺寸应模拟iPhone 15 Pro，并让界面圆角化，使其更像真实的手机界面。
- 使用真实的UI图片，而非占位符图片(可从 Unsplash, Pexels, Apple 官方UI资源中选择)。

- 添加顶部状态栏(模拟 i0S 状态栏)，并包含App 导航栏(类似i0S底部Tab Bar)

请按照以上要求生成完整的 HTML 代码，并确保其可用于实际开发。`;

const IMAGE_PROMPT_CONTENT = `{
  "type": "商业报告执行摘要页",
  "goal": "生成一张可作为上市公司季度业绩一页通、投研速览与内部高管会封面图的执行摘要单页，风格理性克制",
  "style": {
    "color_palette": "商业蓝 + 浅灰 + 白",
    "tone": "理性、可信赖、偏保守",
    "typography": "无衬线现代体 + 数字加粗，英文数字与中文标签混排时对齐基线"
  },
  "header": {
    "company_or_team": "Apple Inc.",
    "report_period": "2025 财年第 4 财季（截至 2025 年 9 月 27 日）",
    "main_title": "业务概览与执行摘要",
    "subtitle": "四项关键指标 + 单句核心判断"
  },
  "kpi_cards": {
    "count": "4",
    "items": [
      {
        "label": "总营收",
        "value": "949 亿美元",
        "change": "+6% YoY"
      },
      {
        "label": "服务收入",
        "value": "264 亿美元",
        "change": "+12% YoY"
      },
      {
        "label": "毛利率",
        "value": "46.2%",
        "change": "+0.3 pp"
      },
      {
        "label": "经营现金流",
        "value": "237 亿美元",
        "change": "TTM 对比 +4%"
      }
    ]
  },
  "trend_chart": {
    "enabled": "true",
    "type": "折线 + 浅面积",
    "metric": "近八个季度总营收",
    "x_axis": "Q4 FY23 至 Q4 FY25 连续八个季度",
    "y_axis": "亿美元"
  },
  "core_judgment": {
    "headline": "在换机周期温和拉长背景下，高毛利服务与产品组合仍支撑整体盈利能力，但需关注区域监管与汇兑对出货节奏的扰动。"
  },
  "footer": {
    "source": "数据来源：本页为设计排版示意，以公司法定披露文件与电话会口径为准",
    "confidentiality": "对外使用须经 IR 与法务审阅"
  },
  "constraints": {
    "must_keep": [
      "四枚 KPI 数字在版面中最醒目，单位与口径一致",
      "趋势图纵轴与 KPI 叙事不矛盾",
      "核心判断仅一句、语气中性不煽情",
      "色板主色 ≤ 3"
    ],
    "avoid": [
      "堆砌超过六个 KPI",
      "装饰性插画与漫画元素",
      "多种装饰字体",
      "深色底上浅色细字"
    ]
  }
}`;

async function createSeedImageAsset(timestamp: string): Promise<ImageAsset> {
  const response = await fetch(businessSummaryCoverUrl);
  if (!response.ok) {
    throw new Error("Failed to load bundled seed image.");
  }
  const sourceBlob = await response.blob();
  const mimeType = (sourceBlob.type || "image/png") as ImageMimeType;
  const data = await sourceBlob.arrayBuffer();
  const normalizedBlob = new Blob([data], { type: mimeType });
  imageAssetService.validateFile(normalizedBlob);
  return {
    id: "seed-asset-business-summary-cover",
    mimeType,
    size: data.byteLength,
    sha256: await imageAssetService.sha256(normalizedBlob),
    data,
    createdAt: timestamp
  };
}

export async function seedIfEmpty() {
  const scenes = await repositories.scenes.list();
  if (scenes.length > 0) return;
  const timestamp = new Date().toISOString();
  const [textScene, imageScene] = DEFAULT_SCENES.map((scene) => ({
    ...scene,
    createdAt: timestamp,
    updatedAt: timestamp
  }));
  const imageAsset = await createSeedImageAsset(timestamp);

  await repositories.scenes.bulkPut([textScene, imageScene]);
  await repositories.imageAssets.put(imageAsset);

  await promptService.createPrompt({
    sceneId: textScene.id,
    title: "移动端原型提示词",
    description: "适合从功能描述快速生成手机端高保真原型，覆盖分析、规划、UI 与 HTML 落地。",
    tags: ["原型", "手机端", "简约"],
    favorite: false,
    content: TEXT_PROMPT_CONTENT,
    note: "初始版本"
  });

  await promptService.createPrompt({
    sceneId: imageScene.id,
    title: "商业报告执行摘要页",
    description: "消费硬件与软服并重的典型单页：四格 KPI、营收趋势小图、一句核心判断，商业蓝主色，适合投研社群传播或内部战报头图。",
    tags: ["简报", "摘要", "简约"],
    favorite: false,
    content: IMAGE_PROMPT_CONTENT,
    imageAssetId: imageAsset.id,
    note: "初始版本"
  });
}
