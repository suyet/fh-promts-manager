# AGENTS

Use this file as the root router for the monorepo.

# Repository Map

本项目是一个本地优先的 Chrome / Edge Manifest V3 提示词管理扩展。

- `src/manager/`：管理页。`ManagerApp.tsx` 是状态和视图编排中心；详情页与新建页共享 `components/PromptWorkspace.tsx`。
- `src/popup/`：Fast Use 弹窗。只负责轻量搜索、场景筛选、复制和跳转管理页，不承载复杂管理能力。
- `src/shared/`：跨入口共享能力。重点关注 `types.ts`、`constants.ts`、`data/`、`services/`、`components/`、`styles/`。
- `public/`：扩展静态资源和 `manifest.json`。新增权限、图标、入口页面时必须检查这里。
- `tests/`：Vitest 测试。UI 行为、服务逻辑、IndexedDB、样式约束和打包边界都已有覆盖。
- `dist/`：构建产物，只用于安装和分发，不作为源码修改位置。

# Routing

本项目没有 URL 路由库，管理页内部使用 `ManagerView` 状态切换视图。

- `src/manager/routes.ts` 定义管理页视图枚举。
- `ManagerApp.tsx` 根据 `view` 渲染：
  - `library`：资产库主页。
  - `create`：新建 Prompt。
  - `detail`：Prompt 详情。
  - `diff`：版本对比。
  - `import`：导入页。
- Fast Use popup 是独立入口，不走 `ManagerView`。
- `manager.html` 和 `popup.html` 是 Vite 多页面入口。修改入口文件或 HTML 文件时，要确认构建产物仍被 `manifest.json` 正确引用。
- 扩展安装测试使用 `dist/` 作为未打包扩展目录；正式或内部分发时应压缩 `dist` 内容，而不是压缩源码目录。

# Working Principles

- 修改 Prompt 数据流时，先区分：
  - `Prompt`：标题、收藏、所属场景、最新版本指针、排序、使用时间。
  - `PromptVersion`：正文、亮点、标签、自定义版本号、图片资产。
  - 卡片展示跟随最新版本，历史版本只在版本历史中查看或对比。
- 场景筛选和场景计数是两个概念：卡片列表按当前场景过滤，场景栏数量来自全量 Prompt。不要用当前卡片列表反推所有场景数量。
- 新建页和详情页的编辑主体必须优先复用 `PromptWorkspace`。不要复制一套编辑器、亮点、标签布局。
- 文本 Prompt 和生图 Prompt 有不同交互：生图必须有图片；文本版本预览不应保留图片区域。
- 标签是结构化数据，不是逗号字符串。新增标签、导入导出、卡片展示都要走统一 normalize 逻辑。
- 复制入口分布在卡片、详情页、编辑器、版本预览和 diff 页；改一个入口时要检查其它入口是否仍有反馈和使用记录。
- 初始化和刷新容易出现异步竞态。涉及 `loadScenes`、`refreshItems`、`selectedSceneId` 时，必须确认不会发起无场景过滤的全量查询覆盖当前场景结果。

# Guardrails

## Always:

- 使用 `npm test`、`npm run lint:types`、`npm run build` 验证重要改动。
- 字段长度限制使用 `FIELD_LIMITS`，不要在组件里散落魔法数字。
- 标签使用结构化数据和 `normalizePromptTags` / `normalizePromptVersion` 相关工具处理，不要重新退回逗号字符串。
- 新增或修改数据持久化行为时，同时检查 `promptService`、`repositories`、导入导出服务和测试工厂。
- 对扩展入口、manifest、图标、构建输出的改动，要实际跑 `npm run build`。
- 对涉及异步加载的 UI bug，先定位竞态来源，再修复。管理页初始场景筛选已经出现过“无 sceneId 全量查询覆盖场景查询”的问题。
- 维护离线优先原则：功能默认应在本地 IndexedDB 内完成，不引入服务器依赖。

## Ask first:

- 需要改变现有数据模型并影响导入导出格式时。
- 需要清空、迁移或重建用户本地数据时。
- 需要引入新的大型依赖、编辑器、状态管理库或 UI 框架时。
- 需要调整产品定位、上架渠道、权限说明、隐私说明或团队分发方式时。
- 需求在文本 Prompt 和生图 Prompt 上表现不同，但用户没有说明期望时。

## Never:

- 不要把 `dist/` 当源码修改。产物由构建生成。
- 不要在组件里直接访问 Dexie 表，除非组件本身就是入口编排层。业务数据操作应走 service 或 repository。
- 不要让场景筛选为空时默认展示所有场景 Prompt，除非产品明确进入“全部”视图。
- 不要新增不可见或无反馈的操作。复制、导入、导出、保存失败等动作都应有用户可见反馈。
- 不要引入远程存储、远程图片或外部 API 作为核心路径。

# Review Focus

代码评审时优先看这些点：

- 初始加载、刷新、切换场景后，卡片列表是否只显示当前场景；是否存在旧请求返回覆盖新状态。
- Prompt 与 PromptVersion 的职责是否被混用，尤其是亮点、标签、图片和自定义版本号。
- 最新版本是否只在详情页浏览；版本历史是否只对非最新版本打开预览或对比。
- 文本/生图两类场景的必填项、预览布局、导入导出是否一致处理。
- 复制、保存、导入、导出失败时是否有用户可见反馈。
- Manifest 权限是否保持最小化。当前 `permissions` 为空，新增权限必须有明确理由。
- 测试是否覆盖真实风险：竞态、持久化、导入导出、字段限制、版本历史，而不是只测静态 DOM。
