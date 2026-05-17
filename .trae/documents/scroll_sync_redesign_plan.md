# 滚动同步功能重新设计与实现计划

---

## 现状分析

当前滚动同步以**分散、临时代码**的方式嵌入在多个文件中：

| 位置 | 职责 | 问题 |
|------|------|------|
| `App.svelte:L113-L123` `handleEditorScroll` | Editor→Preview：比例映射行号 → 设 `previewScrollLine` | 无节流、比例公式只用行数线性映射 |
| `App.svelte:L125-L138` `handlePreviewScrollToEditor` | Preview→Editor：行号 → `selection + scrollIntoView` | **修改了光标位置**（副作用），滚动手感差 |
| `Preview.svelte:L172-L227` `$effect(scrollToLine)` | 接收 `scrollToLine` → 查找标题锚点 → `scrollIntoView` | 无节流、DOM 查询开销大、无错误处理 |
| `Preview.svelte:L229-L235` `handlePreviewScroll` | Preview 滚动 → 比例计算行号 → 回调 `onPreviewScroll` | 无节流、每个 scroll 事件都触发 |
| `App.svelte:L49-L50` `syncingFromPreview/Editor` | 简单的 boolean 防递归锁 | `requestAnimationFrame` 重置不可靠，快速滚动时可能丢失同步 |

**核心问题**：逻辑割裂、无节流、无错误处理、光标副作用、无测试、性能差。

---

## 新架构设计

### 设计原则

1. **集中管理**：所有同步逻辑收敛到单一模块 `scrollSync.ts`
2. **只通过 scrollTop 通信**：双方只暴露 `scrollTop` / `scrollHeight` / `clientHeight`，不操作选区
3. **比例映射引擎**：基于实际渲染高度的百分比映射（而非行号），天然处理内容长度差异
4. **30ms requestAnimationFrame 节流**：保证 <100ms 延迟，同时避免每帧多次触发
5. **来源追踪锁**：通过 `lastSource` 枚举（`'editor' | 'preview' | 'none'`）替代松散 boolean 标志
6. **可配置比率**：通过 `SyncConfig` 提供 `ratio` 参数（默认 1:1）

### 模块结构

```
src/lib/utils/scrollSync.ts          ← 核心同步引擎（纯函数，可测试）
src/lib/utils/scrollSync.test.ts     ← 单元测试
```

#### `scrollSync.ts` — 公开 API

```ts
interface ScrollState {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

interface SyncConfig {
  enabled: boolean;
  ratio: number;          // editor:preview 比率，默认 1
  throttleMs: number;     // 节流间隔，默认 30
}

class ScrollSyncEngine {
  constructor(config: SyncConfig)
  updateConfig(config: Partial<SyncConfig>): void

  // Editor 端发生滚动 → 返回预览应滚到的 scrollTop（或 null 表示不需同步）
  onEditorScroll(state: ScrollState): number | null

  // Preview 端发生滚动 → 返回编辑器应滚到的 scrollTop（或 null 表示不需同步）
  onPreviewScroll(state: ScrollState): number | null

  // 重置同步状态（切换文件时）
  reset(): void
}

// 工具函数
function clampScrollTop(target: number, state: ScrollState): number
function computeRatio(sourceTop: number, sourceState: ScrollState): number
```

#### 组件集成方式

**App.svelte** — 持有 `ScrollSyncEngine` 实例，协调双向滚动：

```
Editor scroll → (throttled) → engine.onEditorScroll(state) → previewEl.scrollTo(returnedValue)
Preview scroll → (throttled) → engine.onPreviewScroll(state) → editorView.scrollDOM.scrollTo(0, returnedValue)
```

**不再操作 `editorView.dispatch({ selection })`** — 直接 `scrollDOM.scrollTo()` 滚动，不碰光标。

**不再使用 `previewScrollLine` / `editorScrollLine` 中间变量** — 两端直接通过 engine 输出值执行滚动。

---

## 文件改动清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/lib/utils/scrollSync.ts` | **新建** | 核心同步引擎 |
| `src/lib/utils/scrollSync.test.ts` | **新建** | ≥80% 覆盖率单元测试 |
| `src/App.svelte` | **修改** | 移除 `handleEditorScroll`、`handlePreviewScrollToEditor`、`syncingFromPreview`/`syncingFromEditor`、`previewScrollLine`；引入 `ScrollSyncEngine`，暴露 `previewRef` |
| `src/components/Preview.svelte` | **修改** | 移除 `scrollToLine` prop 及其 `$effect`；`handlePreviewScroll` 只报告 scroll 事件给回调；新增 `previewRef` 暴露给 App |
| `src/components/Editor.svelte` | **修改** | `onScroll` 回调保留（已经在报告中），无需额外改动 |
| `package.json` | **修改** | 添加 `vitest` devDependency（如未安装） |

---

## 节流策略

使用 `requestAnimationFrame` + 30ms 时间阈值双重节流：

```ts
let lastSyncTime = 0;
function shouldSync(): boolean {
  const now = performance.now();
  if (now - lastSyncTime < 30) return false;
  lastSyncTime = now;
  return true;
}
```

- 最快每 33ms 执行一次（≤ 33ms ≈ 30fps 同步），确保变化 100ms 内可见
- 在 `requestAnimationFrame` 回调中执行实际 DOM 操作，确保浏览器已布局

---

## 边界情况处理

| 场景 | 处理方式 |
|------|---------|
| **内容为空** | `scrollHeight ≤ clientHeight` → 返回 `null`（无需同步） |
| **源端正在被同步** | `lastSource` 检查避免环路 |
| **快速连续滚动** | 节流丢弃中间帧，只取最新的 `scrollTop` |
| **切换文件** | `reset()` 清除 `lastSource` 和 `lastSyncTime` |
| **切换 Tab (Editor↔Preview)** | 当 `enabled=false` 时，engine 忽略所有输入 |
| **水平滚动同步** | engine 支持 `onEditorScrollH()` / `onPreviewScrollH()`，传递 `scrollLeft` |
| **非 1:1 比率** | `SyncConfig.ratio` 将 Editor 滚动比例缩放后映射到 Preview |
| **同步失败** | `try/catch` 包裹 `scrollTo` 调用，失败时 `console.warn` |

---

## 测试计划

| 测试类别 | 用例 |
|---------|------|
| **比例计算** | `computeRatio(0, {scrollHeight:2000,clientHeight:600}) === 0` |
| | `computeRatio(700, {scrollHeight:2000,clientHeight:600}) === 0.5` |
| | `computeRatio(1400, ...) === 1` |
| **目标映射** | `clampScrollTop(0.75, {scrollHeight:3000,clientHeight:600})` 计算正确 |
| **启用/禁用** | `enabled=false` 时所有方法返回 `null` |
| **防环路** | 同一来源连续两次调用，第二次返回 `null` |
| **空内容** | `scrollHeight ≤ clientHeight` 返回 `null` |
| **reset** | `reset()` 后状态清零 |
| **比率配置** | `ratio=2` 时，Editor→Preview 映射值加倍 |
| **水平同步** | `onEditorScrollH` 正确计算目标 scrollLeft |
| **节流** | 30ms 内第二次调用返回相同值（缓存命中） |
| **边界值** | `scrollTop=0`, `scrollTop=maxScroll` 时的映射正确性 |

---

## 实施步骤

1. **创建 `scrollSync.ts`** — 完整的 `ScrollSyncEngine` 类 + 工具函数
2. **创建 `scrollSync.test.ts`** — 单元测试覆盖 ≥80%
3. **安装 vitest** — `npm install -D vitest`
4. **重构 `App.svelte`** — 注入 engine，用 Engine 输出值直接控制两端滚动
5. **重构 `Preview.svelte`** — 移除 `scrollToLine` 机制，改为纯报告 scroll 事件
6. **运行 `pnpm check` + `npx vitest run`** — 验证
