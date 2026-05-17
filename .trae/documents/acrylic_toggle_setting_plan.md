# 亚克力材质开关设置实现计划

## 需求分析

用户需要在应用设置界面中添加一个亚克力材质效果的开关组件，具备以下功能：
1. 启用时：所有界面正确显示亚克力材质效果
2. 关闭时：所有界面恢复为默认材质显示
3. 状态持久化保存，重启后保持用户偏好
4. 符合现有设计规范

## 代码库分析

### 现有设置面板结构
- `src/components/SettingsPanel.svelte` - 设置面板组件，包含配色模式、自动保存、滚动同步、专注模式等设置项
- `src/lib/stores/ui.ts` - UI状态管理，使用 Svelte writable store，部分状态已实现 localStorage 持久化

### 亚克力效果实现
- `src-tauri/src/lib.rs` - 已通过 `EffectsBuilder` 在窗口创建时应用亚克力效果
- 窗口配置在 `tauri.conf.json` 中设置了 `transparent: true`

## 实现方案

### 1. 更新状态管理 (`src/lib/stores/ui.ts`)
- 添加 `acrylicEnabled` store，支持 localStorage 持久化
- 默认值设为 `true`（启用亚克力效果）

### 2. 创建窗口效果切换命令 (`src-tauri/src/commands/window_ops.rs`)
- 添加 `set_acrylic_effect(enabled: bool)` 命令
- 调用 Tauri `window.set_effects()` API 动态切换亚克力效果

### 3. 暴露前端 API (`src/lib/api/window.ts`)
- 添加 `setAcrylicEffect(enabled: boolean)` 函数

### 4. 更新设置面板 (`src/components/SettingsPanel.svelte`)
- 添加亚克力材质开关设置项
- 布局参考现有"滚动同步"开关的设计样式

### 5. 应用启动时加载设置 (`src/App.svelte`)
- 在 `onMount` 中读取 `acrylicEnabled` 状态
- 调用 Tauri 命令应用初始效果

## 文件修改清单

| 文件路径 | 修改类型 | 说明 |
|---------|---------|------|
| `src/lib/stores/ui.ts` | 修改 | 添加 `acrylicEnabled` store，支持持久化 |
| `src-tauri/src/commands/window_ops.rs` | 修改 | 添加 `set_acrylic_effect` 命令 |
| `src/lib/api/window.ts` | 修改 | 添加 `setAcrylicEffect` 函数 |
| `src/components/SettingsPanel.svelte` | 修改 | 添加亚克力开关UI组件 |
| `src/App.svelte` | 修改 | 应用启动时加载并应用亚克力设置 |

## 关键实现细节

### 状态持久化
```typescript
const savedAcrylic = typeof localStorage !== 'undefined' ? localStorage.getItem('puredraft_acrylic') : null;
const acrylicEnabled = writable<boolean>(savedAcrylic !== null ? savedAcrylic === 'true' : true);
acrylicEnabled.subscribe(v => {
  if (typeof localStorage !== 'undefined') localStorage.setItem('puredraft_acrylic', String(v));
});
```

### Tauri 命令实现
```rust
#[tauri::command]
pub async fn set_acrylic_effect(window: tauri::Window, enabled: bool) -> Result<(), String> {
  #[cfg(target_os = "windows")]
  {
    use tauri::window::{Effect, EffectsBuilder};
    if enabled {
      let effects = EffectsBuilder::new().effects(vec![Effect::Acrylic]).build();
      window.set_effects(Some(effects)).map_err(|e| e.to_string())?;
    } else {
      window.set_effects(None).map_err(|e| e.to_string())?;
    }
  }
  Ok(())
}
```

### 开关组件样式
参考现有设置项的 `toggle-btn` 样式，保持视觉一致性。

## 风险评估

1. **跨平台兼容性**：亚克力效果仅在 Windows 10+ 上可用，macOS 和 Linux 应优雅降级
2. **性能影响**：亚克力效果可能对低端设备性能有影响，提供开关让用户选择
3. **状态同步**：确保前端状态与原生窗口效果保持同步

## 测试验证

1. 打开设置面板，验证亚克力开关显示正确
2. 切换开关，验证视觉效果即时变化
3. 重启应用，验证设置持久化生效
4. 在不同主题模式下验证显示效果