import { useState } from "react";
import { Button } from "../../shared/components/Button";
import { IconButton } from "../../shared/components/IconButton";
import { FIELD_LIMITS, SCENE_COLORS } from "../../shared/constants";
import type { PromptType, Scene, SceneColor, SceneIcon } from "../../shared/types";
import {
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  ChevronDown,
  Code2,
  Database,
  FileText,
  FlaskConical,
  Globe2,
  Image,
  Lightbulb,
  MessageSquare,
  PenLine,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  X
} from "lucide-react";

export interface SceneFormInput {
  name: string;
  description: string;
  icon: SceneIcon;
  color: SceneColor;
  promptType: PromptType;
}

const iconOptions: Array<{ value: SceneIcon; label: string; Icon: typeof Briefcase }> = [
  { value: "briefcase", label: "基础", Icon: Briefcase },
  { value: "code", label: "代码", Icon: Code2 },
  { value: "pen", label: "写作", Icon: PenLine },
  { value: "chart", label: "分析", Icon: BarChart3 },
  { value: "image", label: "图像", Icon: Image },
  { value: "bot", label: "机器人", Icon: Bot },
  { value: "brain", label: "思考", Icon: Brain },
  { value: "book", label: "知识", Icon: BookOpen },
  { value: "database", label: "数据", Icon: Database },
  { value: "file", label: "文档", Icon: FileText },
  { value: "flask", label: "实验", Icon: FlaskConical },
  { value: "globe", label: "全球", Icon: Globe2 },
  { value: "lightbulb", label: "灵感", Icon: Lightbulb },
  { value: "message", label: "对话", Icon: MessageSquare },
  { value: "rocket", label: "启动", Icon: Rocket },
  { value: "search", label: "搜索", Icon: Search },
  { value: "settings", label: "设置", Icon: Settings },
  { value: "shield", label: "安全", Icon: ShieldCheck },
  { value: "sparkles", label: "生成", Icon: Sparkles },
  { value: "target", label: "目标", Icon: Target }
];

const colorOptions: Array<{ value: SceneColor; label: string }> = [
  { value: "gray", label: "灰色" },
  { value: "blue", label: "蓝色" },
  { value: "sky", label: "天蓝色" },
  { value: "teal", label: "青色" },
  { value: "green", label: "绿色" },
  { value: "violet", label: "紫色" },
  { value: "pink", label: "粉色" },
  { value: "rose", label: "玫红色" },
  { value: "orange", label: "橙色" },
  { value: "amber", label: "琥珀色" }
];

export function SceneFormDialog({
  scene,
  onCancel,
  onSave
}: {
  scene: Scene | null;
  onCancel: () => void;
  onSave: (input: SceneFormInput) => void;
}) {
  const [name, setName] = useState(scene?.name ?? "");
  const [description, setDescription] = useState(scene?.description ?? "");
  const [icon, setIcon] = useState<SceneIcon>(scene?.icon ?? "briefcase");
  const [color, setColor] = useState<SceneColor>(scene?.color ?? "gray");
  const [promptType, setPromptType] = useState<PromptType>(scene?.promptType ?? "text");
  const [openPicker, setOpenPicker] = useState<"icon" | "color" | null>(null);
  const title = scene ? "编辑场景" : "新建场景";
  const selectedIcon = iconOptions.find((item) => item.value === icon) ?? iconOptions[0];
  const selectedColor = colorOptions.find((item) => item.value === color) ?? colorOptions[0];
  const PreviewIcon = selectedIcon.Icon;
  const SelectedIcon = selectedIcon.Icon;
  const canSave = Boolean(name.trim() && description.trim());

  function submit() {
    if (!canSave) return;
    onSave({ name: name.trim(), description: description.trim(), icon, color, promptType });
  }

  return (
    <div className="modal-backdrop">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="scene-form-title">
        <div className="modal-head">
          <h2 id="scene-form-title">{title}</h2>
          <IconButton label="关闭" icon={<X className="icon" />} onClick={onCancel} />
        </div>
        <div className="form-grid">
          <div className="scene-form-preview" aria-label="场景预览">
            <span className="scene-icon scene-form-preview-icon" style={{ backgroundColor: SCENE_COLORS[color] }}>
              <PreviewIcon className="icon" />
            </span>
            <div>
              <strong>{name.trim() || "新场景"}</strong>
              <p>{promptType === "image" ? "生图" : "文本"} · {description.trim() || "填写摘要后将在这里预览"}</p>
            </div>
          </div>
          <label className="field">
            <span>场景名称</span>
            <input
              aria-label="场景名称"
              maxLength={FIELD_LIMITS.sceneName}
              value={name}
              onChange={(event) => setName(event.target.value.slice(0, FIELD_LIMITS.sceneName))}
            />
          </label>
          <label className="field">
            <span>场景摘要</span>
            <textarea
              aria-label="场景摘要"
              maxLength={FIELD_LIMITS.sceneDescription}
              value={description}
              onChange={(event) => setDescription(event.target.value.slice(0, FIELD_LIMITS.sceneDescription))}
            />
          </label>
          <div className="field">
            <span>类型</span>
            <div className="segmented-control" role="radiogroup" aria-label="场景类型">
              <label className={promptType === "text" ? "segment active" : "segment"}>
                <input
                  type="radio"
                  name="scene-prompt-type"
                  checked={promptType === "text"}
                  disabled={Boolean(scene)}
                  onChange={() => setPromptType("text")}
                />
                文本
              </label>
              <label className={promptType === "image" ? "segment active" : "segment"}>
                <input
                  type="radio"
                  name="scene-prompt-type"
                  checked={promptType === "image"}
                  disabled={Boolean(scene)}
                  onChange={() => setPromptType("image")}
                />
                生图
              </label>
            </div>
          </div>
          <div className="field">
            <span>图标</span>
            <div className="picker-field">
              <button
                aria-expanded={openPicker === "icon"}
                aria-label="打开图标库"
                className="picker-trigger"
                onClick={() => setOpenPicker(openPicker === "icon" ? null : "icon")}
                type="button"
              >
                <SelectedIcon className="icon" />
                <span>{selectedIcon.label}</span>
                <ChevronDown className="icon" />
              </button>
              {openPicker === "icon" && (
                <div className="picker-popover icon-library" role="menu">
                  {iconOptions.map(({ value, label, Icon }) => (
                    <button
                      aria-label={`选择图标：${label}`}
                      aria-checked={icon === value}
                      className="library-option icon-option"
                      key={value}
                      onClick={() => {
                        setIcon(value);
                        setOpenPicker(null);
                      }}
                      role="menuitemradio"
                      type="button"
                    >
                      <Icon className="icon" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="field">
            <span>颜色</span>
            <div className="picker-field">
              <button
                aria-expanded={openPicker === "color"}
                aria-label="打开颜色库"
                className="picker-trigger"
                onClick={() => setOpenPicker(openPicker === "color" ? null : "color")}
                type="button"
              >
                <span className="swatch-dot" style={{ backgroundColor: SCENE_COLORS[color] }} />
                <span>{selectedColor.label}</span>
                <ChevronDown className="icon" />
              </button>
              {openPicker === "color" && (
                <div className="picker-popover color-library" role="menu">
                  {colorOptions.map(({ value, label }) => (
                    <button
                      aria-label={`选择颜色：${label}`}
                      aria-checked={color === value}
                      className="library-option color-option"
                      key={value}
                      onClick={() => {
                        setColor(value);
                        setOpenPicker(null);
                      }}
                      role="menuitemradio"
                      type="button"
                    >
                      <span className="color-dot" style={{ backgroundColor: SCENE_COLORS[value] }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <Button onClick={onCancel}>取消</Button>
          <Button variant="primary" onClick={submit} disabled={!canSave}>保存场景</Button>
        </div>
      </section>
    </div>
  );
}
