# Markdown 功能测试文档

---

## 1. 标题层级

### 三级标题

#### 四级标题

##### 五级标题

###### 六级标题

---

## 2. 文本格式化

这是 **加粗文本**，这是 _斜体文本_，这是 ~~删除线文本~~，这是 `行内代码`。

**加粗中嵌套** _**斜体**_ **文本**

_**全部加粗且斜体**_

---

## 3. 列表

### 无序列表

- 第一项
- 第二项
  - 嵌套子项 A
  - 嵌套子项 B
    - 更深嵌套
- 第三项

### 有序列表

1. 第一步
2. 第二步
   1. 子步骤 2.1
   2. 子步骤 2.2
3. 第三步

---

## 4. 数学公式 (KaTeX)

### 行内公式

质能方程：$E = mc^2$

勾股定理：$a^2 + b^2 = c^2$

黄金比例：$\phi = \frac{1 + \sqrt{5}}{2}$

### 块级公式

二次方程求根公式：

$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

高斯积分：

$$\int\_{-\infty}^{\infty} e^{-x^2} , dx = \sqrt{\pi}$$

欧拉公式：

$$e^{i\pi} + 1 = 0$$

贝叶斯定理：

$$P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)}$$

矩阵：

$$
\begin{bmatrix}
a\_{11} & a\_{12} & a\_{13} \\
a\_{21} & a\_{22} & a\_{23} \\
a\_{31} & a\_{32} & a\_{33}
\end{bmatrix}
$$

求和公式：

$$\sum\_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}$$

极限：

$$\lim\_{x \to 0} \frac{\sin x}{x} = 1$$

---

## 5. 代码块

### JavaScript

```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

console.log(fibonacci(10)); // 55
```

### Python

```python
from typing import List

def quicksort(arr: List[int]) -> List[int]:
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

print(quicksort([3, 6, 8, 10, 1, 2, 1]))
```

### Rust

```rust
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();
    map.insert("key", "value");

    match map.get("key") {
        Some(val) => println!("Found: {}", val),
        None => println!("Not found"),
    }
}
```

### TypeScript

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<User>;
}
```

### CSS

```css
:root {
  --primary-color: #60cdff;
  --bg-color: #1e1e1e;
}

.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  padding: 2rem;
}
```

### JSON

```json
{
  "name": "PureDraft",
  "version": "0.1.0",
  "features": ["markdown", "syntax-highlighting", "live-preview"],
  "settings": {
    "theme": "dark",
    "fontSize": 14
  }
}
```

### Shell

```bash
#!/bin/bash
echo "Building project..."
cargo build --release
echo "Done!"
```

---

## 6. 表格

### 基本表格

| 名称      | 类型   | 描述              |
| --------- | ------ | ----------------- |
| PureDraft | 编辑器 | 轻量级 MD 编辑器  |
| Tauri     | 框架   | Rust 桌面应用框架 |
| Svelte    | 框架   | 响应式 UI 框架    |

### 对齐表格

| 左对齐       | 居中对齐 | 右对齐 |
| :----------- | :------: | -----: |
| 内容 A       |  内容 B  |    100 |
| 长内容 12345 |   居中   |    200 |
| 数据         |   测试   |    300 |

### 复杂表格

| 功能     | 快捷键         | 平台   | 状态 |
| -------- | -------------- | ------ | :--: |
| 打开文件 | `Ctrl+O`       | 全平台 |  ✅  |
| 保存文件 | `Ctrl+S`       | 全平台 |  ✅  |
| 专注模式 | `Ctrl+Shift+F` | 全平台 |  ✅  |
| 切换侧栏 | `Ctrl+B`       | 全平台 |  ✅  |

---

## 7. 任务列表

- [x] 完成 Markdown 解析器
- [x] 实现语法高亮
- [ ] 添加图片粘贴支持
- [ ] 实现文件自动保存
- [ ] 添加插件系统
- [x] 支持深色/浅色主题切换

---

## 8. 引用块

> 这是一段引用文字。

> 多行引用 — 第一行
> 多行引用 — 第二行

> ### 引用中的标题
>
> 引用可以包含其他 Markdown 元素：
>
> - 列表项
> - 另一个列表项
>
> ```javascript
> const x = 42;
> ```

> 嵌套引用：
>
> > 二层引用
> >
> > > 三层引用

---

## 9. 链接与图片

### 链接

[MDN Web Docs](https://developer.mozilla.org)

[GitHub](https://github.com 'GitHub 主页')

### 图片

![占位图片](https://via.placeholder.com/400x200/60cdff/ffffff?text=Placeholder+Image)

---

## 10. HTML 元素

<details>
<summary>点击展开更多内容</summary>

这里是隐藏的详细内容。
支持 **Markdown** 语法。

- 列表项 1
- 列表项 2

</details>

<div align="center">

**居中文本**

使用 HTML `div` 标签实现居中对齐

</div>

---

## 11. 分割线

上面内容

---

下面内容

上面内容

---

下面内容

---

## 12. Emoji & 特殊字符

### Emoji 表情

- 技术相关：💻 🚀 ⚡ 🎯 🔧 📦
- 文档相关：📝 📄 📋 ✅ ❌ ⚠️
- 心情：😀 😎 🤔 🎉 👍

### 特殊符号

| 符号 | 名称     | HTML实体   |
| :--: | -------- | ---------- |
|  ©   | 版权     | `&copy;`   |
|  ®   | 注册商标 | `&reg;`    |
|  ™   | 商标     | `&trade;`  |
|  →   | 箭头     | `&rarr;`   |
|  ←   | 左箭头   | `&larr;`   |
|  •   | 圆点     | `&bull;`   |
|  …   | 省略号   | `&hellip;` |

---

## 13. 脚注

这是一个带有脚注的句子[^1]。

这里还有另一个脚注[^note]。

[^1]: 这是第一个脚注的详细说明内容。

[^note]: 这是自定义标识符的脚注，可以包含**格式化**文本和`代码`。
