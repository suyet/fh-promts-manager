import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SceneFormDialog } from "../../src/manager/components/SceneFormDialog";

describe("SceneFormDialog", () => {
  it("requires name and summary before saving and uses dropdown icon and color libraries", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<SceneFormDialog scene={null} onCancel={vi.fn()} onSave={onSave} />);

    expect(screen.getByLabelText("场景预览")).toBeInTheDocument();
    expect(screen.getByLabelText("场景摘要").tagName).toBe("TEXTAREA");
    expect(screen.queryByLabelText("选择图标：代码")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("选择颜色：粉色")).not.toBeInTheDocument();
    expect(screen.getByLabelText("打开图标库")).toHaveTextContent("基础");
    expect(screen.getByLabelText("打开颜色库")).toHaveTextContent("灰色");
    expect(screen.getByRole("radio", { name: "文本" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "生图" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "保存场景" })).toBeDisabled();

    await user.type(screen.getByLabelText("场景名称"), "写作");
    expect(screen.getByRole("button", { name: "保存场景" })).toBeDisabled();

    await user.type(screen.getByLabelText("场景摘要"), "写作助手");
    await user.clear(screen.getByLabelText("场景名称"));
    await user.type(screen.getByLabelText("场景名称"), "一二三四五六七八九十超出");
    expect(screen.getByLabelText("场景名称")).toHaveValue("一二三四五六七八九十");
    await user.clear(screen.getByLabelText("场景摘要"));
    await user.type(screen.getByLabelText("场景摘要"), "一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十超出");
    expect(screen.getByLabelText("场景摘要")).toHaveValue("一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十");
    await user.clear(screen.getByLabelText("场景名称"));
    await user.type(screen.getByLabelText("场景名称"), "写作");
    await user.clear(screen.getByLabelText("场景摘要"));
    await user.type(screen.getByLabelText("场景摘要"), "写作助手");
    await user.click(screen.getByLabelText("打开图标库"));
    expect(screen.getAllByRole("menuitemradio", { name: /选择图标：/ })).toHaveLength(20);
    await user.click(screen.getByLabelText("选择图标：代码"));
    await user.click(screen.getByLabelText("打开颜色库"));
    expect(screen.getAllByRole("menuitemradio", { name: /选择颜色：/ })).toHaveLength(10);
    await user.click(screen.getByLabelText("选择颜色：粉色"));
    await user.click(screen.getByRole("radio", { name: "生图" }));
    await user.click(screen.getByRole("button", { name: "保存场景" }));

    expect(onSave).toHaveBeenCalledWith({
      name: "写作",
      description: "写作助手",
      icon: "code",
      color: "pink",
      promptType: "image"
    });
  });

  it("shows but locks prompt type when editing a scene", () => {
    render(
      <SceneFormDialog
        scene={{
          id: "scene-image",
          name: "生图",
          description: "图片提示词",
          icon: "image",
          color: "sky",
          promptType: "image",
          sortOrder: 1,
          createdAt: "2026-06-26T08:00:00.000Z",
          updatedAt: "2026-06-26T08:00:00.000Z"
        }}
        onCancel={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByRole("radio", { name: "生图" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "文本" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "生图" })).toBeDisabled();
  });
});
