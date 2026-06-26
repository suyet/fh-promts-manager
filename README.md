# FH Prompt Manager

本地优先的 Chrome/Edge Prompt 管理插件。

## 开发

```powershell
npm install
npm run dev
```

## 构建

```powershell
npm run build
```

构建产物位于 `dist/`。

## 开发者模式安装

1. 打开 Chrome 或 Edge 扩展管理页。
2. 开启开发者模式。
3. 点击“加载已解压的扩展程序”。
4. 选择本项目的 `dist/` 目录。

## 数据说明

数据存储在浏览器 IndexedDB 中。导入导出使用 JSON 文件。插件不使用后端服务，不申请 host permissions。
