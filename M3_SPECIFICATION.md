# Material Design 3 — 完整规范映射分析

> 数据来源：Material Web (material-web.dev)、Android M3 Compose (developer.android.com)、  
> Material Tokens GitHub、M3 官方 Color/State/Type 文档

---

## 1. 颜色系统 (Color System)

### 1.1 完整 Token 映射（27 角色）

| M3 Token | 项目映射 | 用途 |
|----------|----------|------|
| `primary` | `--blog-color-primary` ✅ | 主色 |
| `on-primary` | `--blog-color-on-primary` ✅ | 主色上文字 |
| `primary-container` | `--blog-color-primary-container` ✅ | 主色容器 |
| `on-primary-container` | `--blog-color-on-primary-container` ✅ | 主色容器文字 |
| `secondary` | `--blog-color-secondary` ✅ | 次色 |
| `on-secondary` | `--blog-color-on-secondary` ✅ | — |
| `secondary-container` | `--blog-color-secondary-container` ✅ | — |
| `on-secondary-container` | `--blog-color-on-secondary-container` ✅ | — |
| `tertiary` | `--blog-color-tertiary` ✅ | 补色 |
| `on-tertiary` | `--blog-color-on-tertiary` ✅ | — |
| `tertiary-container` | `--blog-color-tertiary-container` ✅ | — |
| `on-tertiary-container` | `--blog-color-on-tertiary-container` ✅ | — |
| `error` | `--blog-color-error` ✅ | 错误色 |
| `on-error` | **缺失** | 错误色上文字 |
| `error-container` | **缺失** | 错误容器 |
| `on-error-container` | **缺失** | 错误容器文字 |
| `background` | `--blog-color-background` ✅ | 背景 |
| `on-background` | `--blog-color-on-background` ✅ | — |
| `surface` | `--blog-color-surface` ✅ | 默认表面 |
| `on-surface` | `--blog-color-on-surface` ✅ | — |
| `surface-container-lowest` | **缺失** | 最底层容器 |
| `surface-container-low` | **缺失** | 低层容器 |
| `surface-container` | **缺失** | 标准容器 |
| `surface-container-high` | **缺失** | 高层容器 |
| `surface-container-highest` | **缺失** | 最高容器 |
| `outline` | `--blog-color-border-strong` ≈ | 描边 |
| `outline-variant` | `--blog-color-border` ≈ | 弱描边 |

**→ 需新增：6 个 Error 角色 + 5 个 Surface Container 层级 + 精确映射 Outline 角色**

---

## 2. 状态层系统 (State Layer) — 🔑 M3 核心创新

M3 不再使用单独定义 hover/active 颜色，而是用**统一的状态层不透明度 + content color 叠加**。

### 2.1 不透明度规范

| 状态 | 不透明度 | 当前项目处理方式 |
|------|----------|------------------|
| Hover | 0.08 (8%) | 硬编码颜色变化（如 `primary-hover`） |
| Focus | 0.12 (12%) | `outline` 2px（非标准 M3） |
| Pressed | 0.12 (12%) | `scale(0.97)` + 硬编码颜色 |
| Dragged | 0.16 (16%) | 未实现 |

### 2.2 状态层叠加公式

```
最终颜色 = 表面颜色 + (内容颜色色 × 状态不透明度)
```

**示例（按钮 Primary）：**
```
基底: #3B5CF6 (primary)
内容色: #FFFFFF (on-primary)

Hover:  #3B5CF6 + rgba(255,255,255, 0.08) → ~#4A6AF7
Focus:  #3B5CF6 + rgba(255,255,255, 0.12) → ~#506FF8
Pressed:#3B5CF6 + rgba(255,255,255, 0.12) → ~#506FF8
```

### 2.3 Light/Dark 不透明度相同

M3 的 Light 和 Dark 主题使用**完全相同的不透明度值**。视觉效果通过 content color 自动适配（Dark 主题的 content color 是白色/浅色）。

---

## 3. 排版系统 (Typography)

### 3.1 完整 Typescale（15 级）

| Token | Size | Line-Height | Weight | Letter-Spacing |
|-------|------|-------------|--------|----------------|
| Display Large | 57px | 64px | 400 | -0.25px |
| Display Medium | 45px | 52px | 400 | 0 |
| Display Small | 36px | 44px | 400 | 0 |
| Headline Large | 32px | 40px | 400 | 0 |
| Headline Medium | 28px | 36px | 400 | 0 |
| Headline Small | 24px | 32px | 400 | 0 |
| Title Large | 22px | 28px | 400 | 0 |
| Title Medium | 16px | 24px | **500** | +0.15px |
| Title Small | 14px | 20px | **500** | +0.1px |
| Body Large | 16px | 24px | 400 | +0.5px |
| Body Medium | 14px | 20px | 400 | +0.25px |
| Body Small | 12px | 16px | 400 | +0.4px |
| Label Large | 14px | 20px | **500** | +0.1px |
| Label Medium | 12px | 16px | **500** | +0.5px |
| Label Small | 11px | 16px | **500** | +0.5px |

### 3.2 与项目对比

| 问题 | 说明 |
|------|------|
| Display 偏小 | 项目 `--blog-typescale-display-large` 是 48px，M3 是 57px |
| letter-spacing 方向 | M3 的 Display 用**负**值（紧凑），项目用正值 |
| Label 字重 | M3 全部用 500，项目已有 500 ✅ |
| Tracking 缺失 | 部分级别未设 letter-spacing |

---

## 4. 形状系统 (Shape)

| M3 Token | 值 | 项目映射 |
|----------|-----|----------|
| `corner-none` | 0 | `--blog-radius-none` → 0 |
| `corner-extra-small` | 4px | `--blog-radius-xs` → 4px ✅ |
| `corner-small` | 8px | `--blog-radius-sm` → 8px ✅ |
| `corner-medium` | 12px | `--blog-radius-md` → 12px ✅ |
| `corner-large` | 16px | `--blog-radius-lg` → 16px ✅ |
| `corner-extra-large` | 28px | `--blog-radius-xl` → 24px ≈ |
| `corner-full` | 9999px | `--blog-radius-full` ✅ |

**→ 形状系统基本对齐 ✅，minor 调整为 xl → 28px**

---

## 5. 动效系统 (Motion)

M3 动效使用标准缓动函数。项目已有 `--blog-motion-spring-*` 及标准 easing。  
M3 的 Duration 规范：

| 类别 | 值 | 项目 |
|------|-----|------|
| Short | 50-200ms | `--blog-motion-duration-fast`: 150ms ✅ |
| Medium | 200-400ms | `--blog-motion-duration-normal`: 250ms ✅ |
| Long | 300-500ms | `--blog-motion-duration-slow`: 350ms ✅ |
| Extra Long | 450-700ms | `--blog-motion-duration-expressive`: 500ms ✅ |

---

## 6. 组件引入计划

### 6.1 优先引入（高影响力）

| 组件 | M3 变体 | 当前状态 | 优先级 |
|------|---------|----------|--------|
| **State Layer 系统** | 令牌层 | 硬编码 hover/active | 🔴 P0 |
| **Surface Container** | 令牌层 | 缺 5 个层级 | 🔴 P0 |
| **Chip** | Assist / Filter / Input / Suggestion | 无 | 🟡 P1 |
| **Filled Button** | M3 标准 button 变体 | 已有 btn-primary ≈ | 🟢 P2 |
| **Text Field** | Filled / Outlined | 无 | 🟡 P1 |
| **Icon Button** | Standard / Filled / Tonal | ThemeToggle 已有 | 🟢 P2 |
| **Snackbar** | 单行 / 多行 + Action | 无 | 🟢 P2 |

### 6.2 待后续引入

| 组件 | 说明 |
|------|------|
| Navigation Rail | 侧边栏导航，适合博客 |
| FAB | 浮动操作按钮 |
| Dialog | 对话框 |
| Bottom Sheet | 底部弹出面板 |
| Date/Time Picker | 日期时间选择器 |

---

## 7. 实施路线

### Phase 1: 令牌层升级（本次）
1. 新增 `state-layer.css` — 状态层不透明度令牌 + mixin
2. 新增 `surface.css` — 5 级 Surface Container 层级
3. 补齐 `colors.css` — Error on/container 4 个角色
4. 新增 `outline.css` — 精确的 outline/outline-variant 映射
5. 微调 typography — Display 升至 57px, letter-spacing 对齐

### Phase 2: 组件层（后续）
1. Chip 组件（基于 state layer 系统）
2. Text Field 组件
3. Snackbar 组件
4. 现有组件重构（btn → M3 风格状态层）
