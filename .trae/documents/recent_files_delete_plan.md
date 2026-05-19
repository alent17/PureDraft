# 最近文件删除功能实现计划

## 需求概述
1. 在侧边栏"最近文件"列表中，每个文件条目后添加删除按钮
2. 在"最近打开"标题旁添加"全部删除"按钮
3. 删除最近文件时，同时清理该文件对应的存档槽位

---

## 实现步骤

### 步骤 1：添加 `clearRecentFiles` 函数
**文件：** `src/lib/utils/recentFiles.ts`

- 新增 `clearRecentFiles()` 函数，清空 `localStorage` 中 `puredraft_recent` 键的所有最近文件记录
- 复用现有的 `removeRecentFile` 不变

### 步骤 2：添加 `clearAllSaveSlots` 函数
**文件：** `src/lib/utils/saveSlots.ts`

- 新增 `clearAllSaveSlots(filePath: string)` 函数
- 该函数需要：
  - 读取该文件的所有存档槽位元数据（通过 `loadStore`）
  - **清理 localStorage 中的存档元数据**：删除 `puredraft_save_slots:<filePath>` 键
  - **清理磁盘上的存档文件**：遍历每个槽位的 `savedPath`，使用 Tauri 的 `removeFile` API 删除磁盘文件（如果 Tauri API 支持），或至少删除 `localStorage` 中的记录
- 检查 `src/lib/api/file.ts` 是否有 `removeFile` 或 `deleteFile` 函数，如果没有，从 `file.ts` 导入或直接清除 `localStorage` 即可（磁盘文件会在下次创建存档时被覆盖或手动清理）
- **注意：** 核心是确保 `localStorage` 中的存档元数据被彻底清除

### 步骤 3：修改 `FileTree.svelte` — 添加单个删除按钮
**文件：** `src/components/FileTree.svelte`

- 在每个 `.file-item` 条目末尾添加一个删除按钮（`×` 图标）
- 删除按钮样式：
  - 默认隐藏，hover 时显示（`opacity: 0` → `opacity: 1`）
  - 圆形或小方块按钮，悬停时变红色
  - 尺寸约 18px，避免误触
- 点击删除按钮时：
  1. 调用 `removeRecentFile(entry.path)` 移除最近文件记录
  2. 调用 `clearAllSaveSlots(entry.path)` 清理该文件的存档
  3. 刷新 `recentFiles` 状态：`recentFiles = getRecentFiles()`
- 阻止删除按钮的点击事件冒泡（避免触发父级 `handleRecentClick`）

### 步骤 4：修改 `FileTree.svelte` — 添加"全部删除"按钮
**文件：** `src/components/FileTree.svelte`

- 在 `.section-header` 中，标题右侧添加"全部清空"按钮
- 按钮样式：
  - 小号文字，如 10px，颜色为 `var(--color-slate)`
  - hover 时变红色
- 点击"全部清空"时：
  1. 获取当前所有最近文件的路径列表
  2. 遍历每个路径，调用 `clearAllSaveSlots(path)` 清理存档
  3. 调用 `clearRecentFiles()` 清空最近文件
  4. 刷新 `recentFiles` 状态

### 步骤 5：添加删除确认（可选，建议）
- 全部删除时弹出简单确认（使用 `window.confirm` 或内联确认）
- 单个删除不需要确认（有恢复难度低）

### 步骤 6：验证
- 编译检查：`npm run build` 或 `cargo tauri build`（根据项目构建方式）
- 类型检查：确保 TypeScript 无报错
- 手动测试：
  1. 打开几个文件，确认出现在"最近"列表中
  2. 悬停文件条目，确认删除按钮出现
  3. 点击单个删除，确认该条目消失
  4. 检查 `localStorage` 中该文件的存档槽位是否已清除
  5. 点击"全部清空"，确认所有条目消失
  6. 检查 `localStorage` 中所有存档槽位是否已清除

---

## 涉及的文件

| 文件 | 操作 | 修改内容 |
|------|------|----------|
| `src/lib/utils/recentFiles.ts` | 修改 | 新增 `clearRecentFiles` 函数 |
| `src/lib/utils/saveSlots.ts` | 修改 | 新增 `clearAllSaveSlots` 函数 |
| `src/components/FileTree.svelte` | 修改 | 添加删除按钮 + 全部清空按钮 |

---

## 关键实现细节

### 删除按钮 SVG 图标
```svg
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <line x1="18" y1="6" x2="6" y2="18"/>
  <line x1="6" y1="6" x2="18" y2="18"/>
</svg>
```

### clearAllSaveSlots 实现思路
```typescript
export function clearAllSaveSlots(filePath: string): void {
  const key = getStorageKey(filePath);
  localStorage.removeItem(key);
}
```

### clearRecentFiles 实现思路
```typescript
export function clearRecentFiles(): void {
  localStorage.removeItem(RECENT_KEY);
}
```
