# FH Prompt Manager

> 一个纯前端、本地优先的 Chrome / Edge Prompt 管理扩展。

[English README](README_EN.md)

FH Prompt Manager 是一个轻量级**浏览器扩展插件**，用来收集、整理、版本管理和快速复用 Prompt。它适合每天使用 AI 工具的人，把常用 Prompt 作为可搜索、可沉淀、可迁移的个人资产保存在本地。数据**完全离线存储在用户浏览器中，没有任何后台服务与远程服务**。

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Manifest](https://img.shields.io/badge/Chrome%20Extension-MV3-green)
![Local First](https://img.shields.io/badge/local--first-yes-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

## 预览

> ![管理页预览](docs/assets/screenshots/manager-library.png)

> ![Prompt 详情页预览](docs/assets/screenshots/prompt-detail.png)
>
> ![Prompt 详情页预览](docs/assets/screenshots/prompt-diff.png)

> ![Fast Use 弹窗预览](docs/assets/screenshots/popup.png)

## 为什么做

Prompt 正在变成可复用的工作资产，但它们常常散落在聊天记录、笔记、文档和截图里。FH Prompt Manager 给这些资产一个专门的位置：

- 按场景整理常用 Prompt。
- 通过小弹窗快速搜索和复制，不必打开完整工作台。
- 为持续迭代的 Prompt 保留版本历史。
- 同时管理文本 Prompt 和带效果图的生图 Prompt。
- 通过本地备份导入导出自己的 Prompt 库。

无需账号、无需服务器、无需远程存储。

## 功能

- 按场景管理不同工作流中的 Prompt。
- 支持文本 Prompt 和生图 Prompt。
- Fast Use 弹窗快速搜索、一键复制。
- 收藏、标签、亮点和最近使用记录。
- 每个 Prompt 都有版本历史。
- 支持版本差异对比。
- 生图 Prompt 可在本地保存图片资产。
- 使用 ZIP 导入导出完整本地备份。
- 基于浏览器 IndexedDB 的离线优先存储。
- 保持最小化扩展权限。

## 安装

FH Prompt Manager 面向普通用户提供打包后的 `dist` 压缩包。

[点击下载最新发布包](../../releases/latest)，在 Release Assets 中下载 `fh-prompt-manager-*.zip`。

下载后：

1. 解压 `fh-prompt-manager-*.zip`。
2. 打开 Chrome 或 Edge 扩展管理页。
3. 开启开发者模式。
4. 点击“加载已解压的扩展程序”。
5. 选择解压后的 `dist/` 目录。

开发者如果想从源码构建，可以参考下面的“开发”部分。

## 开发

如果你想从源码运行或参与开发，需要先安装 Node.js，然后执行：

```powershell
npm install
npm run dev
npm test
npm run lint:types
npm run build
```

扩展包含两个浏览器入口：

- `manager.html`：完整 Prompt 管理页。
- `popup.html`：快速搜索与复制弹窗。

发布新版本时，先运行 `npm run build`，再将生成的 `dist/` 目录压缩为 `fh-prompt-manager-vX.Y.Z.zip`，上传到 GitHub Release 的 Assets 中。

## 数据与隐私

FH Prompt Manager 使用浏览器 IndexedDB 在本地保存数据。Prompt 内容、标签、版本、使用记录和图片资产都会保留在你的设备中，除非你手动导出。

扩展不需要账号，不使用后端服务，当前也不申请任何浏览器权限。

## 路线图

- 发布打包版本。
- 补充更完整的截图和演示素材。
- 完善导入导出说明。
- 为历史版本补充可选的恢复或复制流程。
- 持续改进 Prompt 组织和发现体验。

## 参与贡献

欢迎提交 issue、想法和 pull request。较大的改动建议先描述要解决的问题，方便保持范围清晰。

本项目坚持本地优先。任何引入远程存储、宽泛浏览器权限或服务器依赖的改动，都需要说明明确理由和隐私影响。

## 许可证

本项目基于 [MIT License](LICENSE) 开源。
