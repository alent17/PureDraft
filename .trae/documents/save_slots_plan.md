# 文件存档槽系统 - 实现计划

## 需求分析

实现类似游戏存档的文件版本快照系统：
- 手动存档：5 个槽位，用户显式创建 / 覆盖 / 删除
- 自动存档：5 个槽位，系统定时自动创建更新
- 存档满时自动覆盖最旧的（FIFO）
- 每个存档包含时间戳、类型、版本号等元数据

## 代码库分析结论

### 现有基础设施
- **Tauri 后端**：`save_file` / `save_file_as` 命令已就绪，写入磁盘
- **自动保存**：`handleAutoSave()` 已有定时保存逻辑，保存间隔可选（10s/30s/60s/120s）
- **localStorage 持久化**：已有 `puredraft_*` 系列键值存储机制
- **Svelte Store**：已有 `autoSaveInterval`、`settingsOpen` 等 UI 状态管理
- **Toolbar**：已有保存、另存为按钮

### 架构决策

**存档存储方式**：
- **元数据**：localStorage (`puredraft_save_slots:{filePath}`) — 轻量、即时
- **内容快照**：在源文件同级创建 `.puredraft/saves/{filePathHash}/slot_N_{type}.{ext}` — 使用 Tauri 后端直接写入

**简化方案（避免目录管理复杂性）**：
- 元数据存储在 localStorage
- 存档内容也存储在 localStorage（Base64 编码），因为这是编辑器，单个文件通常不会超过几百 KB
- 如果文件过大（>1MB），只保存元数据不保存内容

**风险更小的方案**：在系统临时目录存储存档文件，路径存于元数据。

**最终采用方案**：存档内容以独立文件存储在源文件所在目录下的 `.puredraft_saves/` 子目录中，由前端调用 Tauri `write_file` 命令写入。

## 实现步骤

### 步骤1：创建存档槽管理工具 (`src/lib/utils/saveSlots.ts`)

核心数据结构：

```typescript
export interface SaveSlotMeta {
  slotId: number;          // 0-4
  type: 'manual' | 'auto';
  timestamp: number;       // Date.now()
  description: string;     // 简短描述
  cursor: { line: number; col: number };
  contentLength: number;
  savedPath: string;       // 磁盘上存档文件的路径
}

export interface SaveSlotStore {
  slots: SaveSlotMeta[];
  version: number;
}
```

核心函数：
- `createSaveSlot(type, filePath, content, fileExt)` — 创建新存档槽，FIFO 覆盖
- `deleteSaveSlot(type, filePath, slotId)` — 删除指定存档
- `getSaveSlots(filePath)` — 获取文件的所有存档
- `loadSaveSlot(filePath, slotId)` — 读取存档内容
- `saveSlotToDisk(slotPath, content)` — 通过 Tauri 写入存档文件

**FIFO 覆盖策略**：
- 当某类型槽位数 >= 5 时，删除最旧的（最小 timestamp），腾出空间
- 新存档插入数组尾部（按时间排序）

### 步骤2：在 Tauri 后端添加存档目录管理

在 `src-tauri/src/commands/file_ops.rs` 中添加命令：
- 无需新命令 — 复用现有的 `write_file` 命令

在 `src-tauri/tauri.conf.json` 的 CSP 或权限中确认文件系统权限已开放写入 `.puredraft_saves/` 目录。

实际上已经不需要修改 Rust 端 — 现有的 `write_file` 已经可以写入任意路径，只需前端构建存档路径即可。

### 步骤3：在 UI Store 中添加存档面板状态

**文件**：`src/lib/stores/ui.ts`

添加 `saveSlotsOpen` store：
```typescript
const saveSlotsOpen = writable<boolean>(false);
```

### 步骤4：创建存档槽 UI 组件 (`src/components/SaveSlotPanel.svelte`)

组件设计：
- 模态面板，点击 Toolbar 中存档按钮或按快捷键打开
- 分区显示：手动存档 (5 slots) | 自动存档 (5 slots)
- 每个槽位显示：序号、时间戳、描述、内容长度
- 操作按钮：恢复 / 删除
- "创建存档"按钮（手动区）
- 每个槽位 hover 时高亮

模板结构：
```
┌─────────────────────────────────┐
│  📦 存档管理                    │
├─────────────────────────────────┤
│  💾 手动存档                    │
│  ┌─────────────────────────┐   │
│  │ Slot 1 · 2024-01-01 12:00│   │
│  │ 1024 chars ·  [恢复][删除]│   │
│  ├─────────────────────────┤   │
│  │ Slot 2 · (空)           │   │
│  │ ...                     │   │
│  └─────────────────────────┘   │
│  [+ 创建存档]                   │
├─────────────────────────────────┤
│  ⏱ 自动存档                    │
│  ┌─────────────────────────┐   │
│  │ Slot 1 · 2024-01-01 11:55│   │
│  │ ...                      │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### 步骤5：集成到 Toolbar

在 Toolbar 中"另存为"按钮旁边添加存档按钮（保存图标）。

### 步骤6：集成到自动保存流程

修改 `handleAutoSave()`：
```typescript
async function handleAutoSave() {
  // ... 现有逻辑（保存到原始路径）
  
  // 新增：自动存档
  if (file.path) {
    await createSaveSlot('auto', file.path, contentToSave, getFileExt(file.name));
  }
}
```

### 步骤7：添加 IPC API

**文件**：`src/lib/api/file.ts`

复用现有 `writeFile` 命令。

### 步骤8：添加 CSS 变量和样式

在 `app.css` 中添加存档面板相关变量。

## 修改文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/lib/utils/saveSlots.ts` | **新建** | 存档槽核心逻辑 |
| `src/lib/stores/ui.ts` | 修改 | 添加 `saveSlotsOpen` 状态 |
| `src/components/SaveSlotPanel.svelte` | **新建** | 存档管理 UI 组件 |
| `src/components/Toolbar.svelte` | 修改 | 添加存档按钮入口 |
| `src/App.svelte` | 修改 | 集成自动存档 + 导入新组件 |
| `src/app.css` | 修改 | 存档面板 CSS 变量 |
