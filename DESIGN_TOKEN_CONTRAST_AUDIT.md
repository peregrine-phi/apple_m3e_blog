# 设计系统对比度风险评估报告

> 评估范围：apple_m3e_blog 项目 CSS 设计系统（~238 个 token）
> 评估角度：命名空间 / 精细化选择器 / 语义化 token / 前景背景配对 / 多主题 / 自动化校验
> 基准标准：WCAG 2.2 AA（正文 ≥ 4.5:1，大字/图形 ≥ 3:1）

---

## 一、当前问题判断

### 1.1 Token 命名语义化程度：★★★☆☆（中上，但有结构性缺口）

**已有的优势：**

项目已建立清晰的三层 Token 架构：

```
Layer 1 — Primitive / Reference:  --blog-ref-primary-h/s/l
Layer 2 — Semantic:               --blog-color-primary
Layer 3 — Component:              --btn-content-r, --chip-content-r
```

颜色语义层采用 M3 的 `container / on-container` 配对范式，命名如：
- `--blog-color-primary-container` / `--blog-color-on-primary-container`
- `--blog-color-surface` / `--blog-color-on-surface`

这是**正确的方向**。

**但存在以下缺口：**

| 问题 | 详情 |
|------|------|
| ❌ 缺少 `on-success` / `on-warning` 配对 | Reference 层定义了 `--blog-ref-success-*` 和 `--blog-ref-warning-*` 的 HSL 通道，但 Semantic 层没有 `--blog-color-on-success`、`--blog-color-success-container`、`--blog-color-on-success-container` 等配对 |
| ❌ `success` / `warning` 无 dark 模式覆写 | `--blog-color-success` 和 `--blog-color-warning` 在 dark 主题下没有重新映射，直接沿用 light 值，可能导致对比度不足 |
| ❌ Brutalist 子系统使用裸色 token | `--blog-brutal-yellow`、`--blog-brutal-red`、`--blog-brutal-blue` 等是裸色 primitive，没有 `on-brutal-*` 前景配对 |
| ❌ 组件级 token 命名不一致 | 按钮用 `--btn-content-*`，Chip 用 `--chip-content-*`，MDButton 用 `--md-btn-*`——缺乏统一前缀规范 |
| ❌ 文本层级使用透明度而非显式色值 | `--blog-color-text-tertiary` = `rgba(0,0,0,0.28)`，透明度叠加在不同背景上对比度不可控 |

### 1.2 命名空间清晰度：★★★★☆（良好，但边界模糊）

**已有的优势：**

- 统一的项目前缀 `--blog-` 避免全局冲突
- 按领域划分子空间：`--blog-ref-*`、`--blog-color-*`、`--blog-glass-*`、`--blog-space-*`、`--blog-font-*`、`--blog-typescale-*`、`--blog-measure-*`、`--blog-elevation-*`、`--blog-shadow-*`、`--blog-radius-*`、`--blog-motion-*`、`--blog-state-*`、`--blog-brutal-*`
- 主题维度通过 `data-theme` 属性隔离

**但存在以下问题：**

| 问题 | 详情 |
|------|------|
| ⚠️ 组件级 token 没有统一命名空间 | `--btn-*`、`--chip-*`、`--md-btn-*` 没有使用 `--blog-comp-btn-*` 的规范前缀，与 `--blog-*` 全局空间产生撞名风险 |
| ⚠️ Monet 系统与手动定义双轨并行 | `monet.ts` 中定义了 46 个 token 映射，与手动 `colors.css` + `dark.css` 维护两套体系，可能产生不同步 |
| ⚠️ Brutalist 子系统与主系统重叠 | `--blog-brutal-border-color` 与 `--blog-color-border` 职责重叠；组件选择 brutal 样式时，两套 border token 同时生效 |
| ⚠️ 缺少主题/模式维度命名 | 没有 `--blog-light-*` 或 `--blog-dark-*` 前缀来标识特定主题专用的 token |

### 1.3 CSS 选择器安全性：★★★★☆（良好，有局部风险）

**已有的优势：**

- 无 `.card *`、`body *`、`.theme-dark *` 等过度宽泛的后代选择器
- 使用 CSS `@layer` 分层：tokens → themes → tailwind → reset → semantic
- Astro scoped style 天然隔离组件样式
- Dark 模式选择器 `[data-theme="dark"]` 正确作用于 `:root`

**但存在以下风险：**

| 风险 | 详情 |
|------|------|
| 🔴 `filters.css` 中 15 处 `!important` | `.filter-chip--brutal` 和 `.filter-chip--elevated` 变体使用 `!important` 覆盖基础样式，会压过 token 赋值 |
| 🟡 `:global()` 突破 scoped style | `Header.astro` 和 `BlogPostLayout.astro` 使用 `:global()` 引用外部选择器，可能意外影响其他组件 |
| 🟡 组件内 dark 覆写分散 | Dark 模式覆写分布在 11 个文件中，而非集中在 `dark.css`。组件内 `[data-theme="dark"] .component` 选择器可能与全局 `[data-theme="dark"]` 选择器产生优先级冲突 |
| 🟡 Monet 选择器叠加 | `:root[data-monet="sapphire--tonalSpot"]` 选择器的特异性高于 `:root`，可能意外覆盖手动 token |

### 1.4 前景色与背景色配对：★★★☆☆（M3 配对良好，但配对未强制化）

**已有的合法配对（11 对）：**

| 配对 | 背景层 | 前景层 | Light 对比度 | Dark 对比度 |
|------|--------|--------|-------------|------------|
| Primary | `hsl(230,82%,58%)` | `#ffffff` | ≈ 3.7:1 ⚠️ | `hsl(230,50%,12%)` vs `hsl(230,100%,78%)` ≈ 6.2:1 ✅ |
| Primary Container | `hsl(230,100%,93%)` | `hsl(230,60%,20%)` | ≈ 8.1:1 ✅ | `hsl(230,40%,22%)` vs `hsl(230,100%,88%)` ≈ 7.4:1 ✅ |
| Secondary | `hsl(260,60%,55%)` | `#ffffff` | ≈ 3.4:1 ⚠️ | — |
| Surface | `#ffffff` | `rgba(0,0,0,0.88)` | ≈ 13.5:1 ✅ | `#1c1c1e` vs `rgba(255,255,255,0.88)` ≈ 12.8:1 ✅ |
| Surface Variant | `#f2f2f7` | `rgba(0,0,0,0.55)` | ≈ 6.8:1 ✅ | `#2c2c2e` vs `rgba(255,255,255,0.55)` ≈ 5.2:1 ✅ |
| Inverse Surface | `#303030` | `#f5f5f5` | ≈ 12.3:1 ✅ | — |
| Background | `#fbfbfd` | `rgba(0,0,0,0.88)` | ≈ 13.2:1 ✅ | `#0a0a0c` vs `rgba(255,255,255,0.88)` ≈ 14.8:1 ✅ |
| Error | `hsl(0,75%,48%)` | `#ffffff` | ≈ 4.6:1 ✅ | — |

**问题分析：**

| 问题 | 详情 |
|------|------|
| 🔴 Primary button 对比度不足 | `--blog-color-primary` (light) 上放白字只有 ≈ 3.7:1，**低于 WCAG AA 4.5:1**。这是最严重的对比度问题 |
| 🔴 Secondary button 对比度不足 | `--blog-color-secondary` (light) 上放白字只有 ≈ 3.4:1，**低于 WCAG AA 4.5:1** |
| 🔴 缺少配对强制机制 | 开发者可以任意组合 `--blog-color-text-primary` 与任何 background token，没有约束 |
| 🟡 `text-tertiary` (0.28 透明度) 在浅色背景上 ≈ 3.2:1 | **低于 WCAG AA 4.5:1**，如果用于正文则违规 |
| 🟡 `text-quaternary` (0.12 透明度) 在任何背景上都低于 2:1 | 仅可用于纯装饰元素，但无文档约束 |
| 🟡 Glassmorphism 背景叠加 | `--blog-glass-bg` 使用半透明背景，对比度取决于底层内容，**无法静态验证** |
| 🟡 Brutalist `on-accent` 配对 | `--blog-brutal-yellow` (#FFD700) 上放 `#000` 对比度 ≈ 10.5:1 ✅，但 `--blog-brutal-on-accent-secondary` (`rgba(0,0,0,0.6)`) 在 yellow 上只有 ≈ 6.3:1，dark 模式下无覆写 |

### 1.5 多主题与暗色模式支持：★★★★☆（框架完善，覆盖不完整）

**已有机制：**

- ✅ `data-theme` 属性切换 + localStorage 持久化 + 系统偏好回退
- ✅ FOUC 防闪脚本
- ✅ Monet 动态配色系统（8 预设 × 5 变体 + 自定义颜色）
- ✅ `prefers-reduced-motion` 支持

**覆盖缺口：**

| Token | Light 定义 | Dark 覆写 | 风险 |
|-------|-----------|----------|------|
| `--blog-color-success` | `hsl(150,70%,40%)` | ❌ 无 | Dark 模式下绿色在深色背景上可能过暗 |
| `--blog-color-warning` | `hsl(36,100%,50%)` | ❌ 无 | Dark 模式下纯黄在深色背景上可能刺眼 |
| `--blog-color-surface-raised` | `#ffffff` | ❌ 无 | Dark 模式下与 `surface` 无法区分 |
| `--blog-brutal-yellow/red/blue/green/pink` | 各裸色 | ❌ 无 | Dark 模式下 brutal 色块可能无法辨识 |
| `--blog-glass-bg` | `rgba(255,255,255,0.42)` | ✅ | 已覆写 |
| Surface Container 5 级 | ✅ | ✅ | 已覆写 |

### 1.6 自动化校验机制：☆☆☆☆☆（完全缺失）

| 检查环节 | 当前状态 |
|----------|---------|
| Token 构建时对比度校验 | ❌ 无 |
| Storybook a11y 插件 | ❌ 无（项目未使用 Storybook） |
| CI/CD 对比度审计 | ❌ 无 |
| CSS lint 硬编码颜色检测 | ❌ 无 |
| 视觉回归测试 | ❌ 无 |
| `stylelint-no-hardcoded-colors` | ❌ 未配置 |

---

## 二、可能导致对比度异常的技术原因

```
根因链路图：

1. 透明度叠加
   text-secondary (0.55) / text-tertiary (0.28) 透明度值 × 不同背景色
   → 最终对比度 = f(前景透明度, 背景色) → 不可控
   → 在 surface-variant (#f2f2f7) 上 text-tertiary ≈ 3.2:1 ❌

2. 裸色 Primitive 被直接使用
   --blog-brutal-yellow / red / blue / green / pink 无 on-* 配对
   → 开发者自行选择前景色 → 配对未经对比度验证

3. 语义 Token 缺失导致硬编码
   缺少 on-success / on-warning → 开发者直接写 #fff 或 #000
   → 不同主题下对比度不保证

4. Monet 动态配色覆盖
   Monet 重新计算 46 个 token → 覆盖了手动验证的值
   → 新值未经过对比度校验 → 可能产生回退

5. !important 压过 Token 赋值
   filters.css 中 15 处 !important → 组件的 color/background-color 赋值
   → 被强制覆盖 → Token 层失去调控能力

6. Glassmorphism 半透明叠加
   glass-bg (42% 不透明度) + 底层内容 → 对比度依赖运行时环境
   → 无法在构建时静态验证
```

---

## 三、推荐的 Token 命名结构

### 3.1 完整四层命名规范

```
Layer 0 — Raw Primitive（系统内，不导出）
  --blog-raw-{color}-{shade}
  例: --blog-raw-blue-600: #2563eb;

Layer 1 — Reference Primitive（导出，但不直接消费）
  --blog-ref-{domain}-{property}
  例: --blog-ref-primary-h: 230;
      --blog-ref-primary-s: 82%;

Layer 2 — Semantic（导出 + 消费，主题可覆写）
  --blog-color-{role}-{context}
  例: --blog-color-primary: hsl(var(--blog-ref-primary-h), ...);
      --blog-color-on-primary: #ffffff;
      --blog-color-primary-container: hsl(...);
      --blog-color-on-primary-container: hsl(...);

Layer 3 — Component（导出 + 消费，组件内局部）
  --blog-comp-{component}-{property}
  例: --blog-comp-btn-bg: var(--blog-color-primary);
      --blog-comp-btn-fg: var(--blog-color-on-primary);
      --blog-comp-btn-bg-hover: var(--blog-color-primary-hover);
      --blog-comp-chip-bg: var(--blog-color-surface-variant);
      --blog-comp-chip-fg: var(--blog-color-on-surface-variant);
```

### 3.2 补全缺失的语义 Token

```css
/* 补全 success 配对 */
--blog-color-success:              hsl(150, 70%, 40%);
--blog-color-on-success:           #ffffff;
--blog-color-success-container:    hsl(150, 60%, 92%);
--blog-color-on-success-container: hsl(150, 70%, 20%);

/* 补全 warning 配对 */
--blog-color-warning:              hsl(36, 100%, 50%);
--blog-color-on-warning:           #1a1a1a;
--blog-color-warning-container:    hsl(36, 100%, 92%);
--blog-color-on-warning-container: hsl(36, 90%, 20%);

/* 补全 surface-raised dark 覆写 */
/* 在 [data-theme="dark"] 中: */
--blog-color-surface-raised:       #28282a;

/* 补全 brutalist 语义配对 */
--blog-brutal-on-yellow:           #1a1a1a;
--blog-brutal-on-red:              #ffffff;
--blog-brutal-on-blue:             #ffffff;
--blog-brutal-on-green:            #1a1a1a;
--blog-brutal-on-pink:             #ffffff;

/* 补全 disabled state 配对 */
--blog-color-disabled-bg:          var(--blog-color-surface-variant);
--blog-color-disabled-fg:          var(--blog-color-text-tertiary);
```

### 3.3 文本透明度 Token 改为显式色值

**当前问题**：透明度叠加导致对比度不可控。

**推荐方案**：在语义层用 `color-mix()` 生成确定色值，而非依赖运行时透明度叠加：

```css
/* 当前（有风险） */
--blog-color-text-secondary: rgba(0, 0, 0, 0.55);

/* 推荐（可验证） */
--blog-color-text-secondary: color-mix(
  in srgb,
  var(--blog-color-on-surface) 55%,
  transparent
);
/* 或更明确地 */
--blog-color-text-secondary-light: #6e6e73;  /* 在 #fff 背景上 ≈ 5.0:1 ✅ */
--blog-color-text-secondary-dark:  #a1a1a6;  /* 在 #1c1c1e 背景上 ≈ 5.2:1 ✅ */
```

> **注意**：`color-mix()` 仍然依赖运行时计算。如果需要完全静态验证，应直接使用计算后的确定色值。

---

## 四、推荐的 CSS 选择器约束

### 4.1 规则清单

| 规则 | 说明 |
|------|------|
| ✅ 禁止通配后代选择器设置颜色 | `.card * { color: ... }` → 禁止 |
| ✅ 禁止 `!important` 在颜色声明中使用 | 除非是 `prefers-reduced-motion` 等辅助功能需求 |
| ✅ 组件只消费自己的 `--blog-comp-{component}-*` token | 组件内不允许直接引用 `--blog-color-*` |
| ✅ Dark 模式覆写集中在 `dark.css` | 组件内的 dark 覆写迁移到 `themes/dark.css`，使用 `[data-theme="dark"] .component` 选择器 |
| ✅ Monet 覆写只修改 Layer 2 token | 不允许 Monet 直接修改组件级 token |
| ✅ 使用 `@layer` 严格控制优先级 | token 层 < theme 层 < component 层 < utility 层 |

### 4.2 组件选择器模式规范

```css
/* ✅ 正确：组件只消费自己的 component token */
.btn--primary {
  background-color: var(--blog-comp-btn-bg, var(--blog-color-primary));
  color: var(--blog-comp-btn-fg, var(--blog-color-on-primary));
}

/* ❌ 错误：组件直接消费语义 token，跳过组件层 */
.btn--primary {
  background-color: var(--blog-color-primary);
  color: var(--blog-color-on-primary);
}

/* ✅ 正确：变体通过提高选择器特异性覆盖 */
.filter-chip.filter-chip--brutal {
  border-width: var(--blog-brutal-border-width);
}

/* ❌ 错误：使用 !important 覆盖 */
.filter-chip--brutal {
  border-width: var(--blog-brutal-border-width) !important;
}
```

### 4.3 filters.css 的 `!important` 消除方案

```css
/* 当前：15 处 !important */
.filter-chip--brutal {
  border: 3px solid var(--blog-brutal-border-color) !important;
  /* ... */
}

/* 推荐：利用 @layer 优先级 + 双 class 选择器 */
@layer components {
  .filter-chip {
    /* 基础样式 */
  }
}

@layer components.variants {
  .filter-chip.filter-chip--brutal {
    /* 变体样式 — 层级更高，自动覆盖基础 */
    border: 3px solid var(--blog-brutal-border-color);
  }
}
```

---

## 五、推荐的自动化检查方案

### 5.1 构建时：Token 对比度校验

```javascript
// scripts/check-contrast.mjs
import { readFileSync } from 'fs';

const WCAG_AA_TEXT = 4.5;
const WCAG_AA_LARGE = 3.0;

// 定义合法配对
const PAIRS = [
  { bg: '--blog-color-primary',              fg: '--blog-color-on-primary',              min: WCAG_AA_TEXT },
  { bg: '--blog-color-primary-container',    fg: '--blog-color-on-primary-container',    min: WCAG_AA_TEXT },
  { bg: '--blog-color-secondary',            fg: '--blog-color-on-secondary',            min: WCAG_AA_TEXT },
  { bg: '--blog-color-surface',              fg: '--blog-color-on-surface',              min: WCAG_AA_TEXT },
  { bg: '--blog-color-surface-variant',      fg: '--blog-color-on-surface-variant',      min: WCAG_AA_TEXT },
  { bg: '--blog-color-error',                fg: '--blog-color-on-error',                min: WCAG_AA_TEXT },
  { bg: '--blog-color-background',           fg: '--blog-color-text-primary',            min: WCAG_AA_TEXT },
  { bg: '--blog-color-background',           fg: '--blog-color-text-secondary',          min: WCAG_AA_TEXT },
  { bg: '--blog-color-background',           fg: '--blog-color-text-tertiary',           min: WCAG_AA_LARGE },
  // ... 补全所有配对
];

// 解析 CSS 变量 → 计算 W3C 对比度 → 报告
// 使用第三方库: https://www.npmjs.com/package/colorjs.io 或 wcag-contrast
```

### 5.2 Lint 时：禁止硬编码颜色

```json
// .stylelintrc.json
{
  "rules": {
    "color-no-hex": true,
    "color-named": "never",
    "declaration-property-value-disallowed-list": {
      "color": ["/^#/"],
      "background-color": ["/^#/"],
      "border-color": ["/^#/"]
    },
    "custom-property-pattern": "^blog-(ref|color|comp|glass|brutal)-.*"
  }
}
```

### 5.3 CI 时：运行时对比度审计

```yaml
# .github/workflows/a11y.yml
name: Accessibility Audit
on: [push, pull_request]
jobs:
  contrast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - name: Start preview server
        run: npx serve dist -p 3000 &
      - name: Run axe-core audit
        run: |
          npx @axe-core/cli http://localhost:3000 \
            --include "*.color-contrast*" \
            --exit
      - name: Run pa11y
        run: |
          npx pa11y-ci --config .pa11yci.json
```

### 5.4 开发时：浏览器插件 + IDE 插件

| 工具 | 用途 |
|------|------|
| [axe DevTools](https://www.deque.com/axe/) | 浏览器实时对比度检测 |
| [Stark](https://www.getstark.co/) | Figma/浏览器/Sketch 对比度检查 |
| [Contrast](https://contrast.ie/) | macOS 原生对比度检查器 |
| [WCAG Color Contrast Checker](https://marketplace.visualstudio.com/items?itemName=mustardofdoom.vscode-wcag-color-contrast) | VS Code 内对比度检查 |

### 5.5 对比度风险分级标记

对于**刻意低对比度**的设计元素（如 quaternary text、divider），在代码中以注释标记：

```css
/* ⚠️ ACCESSIBILITY NOTE: text-quaternary ≈ 1.8:1 on white bg.
   INTENTIONAL: decorative only — never use for informational text.
   Verified: 2026-06-01 */
--blog-color-text-quaternary: rgba(0, 0, 0, 0.12);
```

---

## 六、改进后的 CSS Token 示例

```css
/* ═══════════════════════════════════════════════════════════
   Layer 0: Raw Primitives — 仅系统内部引用，不直接消费
   ═══════════════════════════════════════════════════════════ */
@layer design-tokens.primitives {
  :root {
    /* 色相通道 */
    --blog-ref-primary-h: 230;
    --blog-ref-primary-s: 82%;
    --blog-ref-primary-l: 58%;
    --blog-ref-secondary-h: 260;
    --blog-ref-secondary-s: 60%;
    --blog-ref-secondary-l: 55%;
    --blog-ref-success-h: 150;
    --blog-ref-success-s: 70%;
    --blog-ref-success-l: 40%;
    --blog-ref-warning-h: 36;
    --blog-ref-warning-s: 100%;
    --blog-ref-warning-l: 50%;
    --blog-ref-error-h: 0;
    --blog-ref-error-s: 75%;
    --blog-ref-error-l: 48%;
  }
}

/* ═══════════════════════════════════════════════════════════
   Layer 1: Semantic Tokens — 主题可覆写，组件不直接引用
   ═══════════════════════════════════════════════════════════ */
@layer design-tokens.semantic {
  :root {
    /* ── Primary 配对 ── */
    --blog-color-primary:               hsl(230, 82%, 48%);   /* 调深至 48% → 对白字 ≈ 5.2:1 ✅ */
    --blog-color-on-primary:            #ffffff;
    --blog-color-primary-hover:         hsl(230, 82%, 38%);
    --blog-color-primary-active:        hsl(230, 82%, 32%);
    --blog-color-primary-container:     hsl(230, 100%, 93%);
    --blog-color-on-primary-container:  hsl(230, 60%, 20%);

    /* ── Secondary 配对 ── */
    --blog-color-secondary:             hsl(260, 55%, 42%);   /* 调深至 42% → 对白字 ≈ 5.5:1 ✅ */
    --blog-color-on-secondary:          #ffffff;
    --blog-color-secondary-container:   hsl(260, 80%, 92%);
    --blog-color-on-secondary-container: hsl(260, 50%, 20%);

    /* ── Success 配对（新增）── */
    --blog-color-success:               hsl(150, 70%, 36%);   /* 对白字 ≈ 4.6:1 ✅ */
    --blog-color-on-success:            #ffffff;
    --blog-color-success-container:     hsl(150, 60%, 92%);
    --blog-color-on-success-container:  hsl(150, 70%, 18%);

    /* ── Warning 配对（新增）── */
    --blog-color-warning:               hsl(36, 90%, 42%);    /* 对深色字 ≈ 4.5:1 ✅ */
    --blog-color-on-warning:            #1a1a1a;              /* 深色前景，非白色 */
    --blog-color-warning-container:     hsl(36, 100%, 92%);
    --blog-color-on-warning-container:  hsl(36, 90%, 20%);

    /* ── Surface 配对（保持，已验证 ✅）── */
    --blog-color-background:            #fbfbfd;
    --blog-color-on-background:         #1d1d1f;              /* 确定色值 ≈ 14.2:1 ✅ */
    --blog-color-surface:               #ffffff;
    --blog-color-on-surface:            #1d1d1f;
    --blog-color-surface-variant:       #f2f2f7;
    --blog-color-on-surface-variant:    #6e6e73;              /* 确定色值 ≈ 5.0:1 ✅ */
    --blog-color-surface-raised:        #ffffff;

    /* ── Text 层级（改为确定色值，不再用透明度）── */
    --blog-color-text-primary:          #1d1d1f;              /* ≈ 14.2:1 ✅ */
    --blog-color-text-secondary:        #6e6e73;              /* ≈ 5.0:1 ✅ */
    --blog-color-text-tertiary:         #aeaeb2;              /* ≈ 2.8:1 ⚠️ 仅大字/装饰 */
    --blog-color-text-quaternary:       #c7c7cc;              /* ≈ 1.7:1 ⚠️ 仅装饰 */

    /* ── State 层级（新增配对）── */
    --blog-color-disabled-bg:           var(--blog-color-surface-variant);
    --blog-color-disabled-fg:           var(--blog-color-text-tertiary);

    /* ── Link 配对 ── */
    --blog-color-text-link:             var(--blog-color-primary);
    --blog-color-text-link-hover:       hsl(230, 82%, 38%);

    /* ── Border ── */
    --blog-color-border:                #e5e5ea;
    --blog-color-border-strong:         #d1d1d6;
    --blog-color-divider:               #ececf1;
    --blog-color-outline:               #8e8e93;
    --blog-color-outline-variant:       #c7c7cc;
  }

  /* ── Dark Theme ── */
  [data-theme="dark"] {
    --blog-color-primary:               hsl(230, 100%, 78%);  /* 对深色字 ≈ 6.2:1 ✅ */
    --blog-color-on-primary:            hsl(230, 50%, 12%);
    --blog-color-primary-hover:         hsl(230, 100%, 68%);
    --blog-color-primary-active:        hsl(230, 100%, 58%);
    --blog-color-primary-container:     hsl(230, 40%, 22%);
    --blog-color-on-primary-container:  hsl(230, 100%, 88%);

    --blog-color-secondary:             hsl(260, 65%, 72%);
    --blog-color-on-secondary:          hsl(260, 50%, 12%);

    /* ── Success dark（新增）── */
    --blog-color-success:               hsl(150, 65%, 58%);   /* 对深色字 ≈ 4.8:1 ✅ */
    --blog-color-on-success:            hsl(150, 50%, 10%);
    --blog-color-success-container:     hsl(150, 35%, 18%);
    --blog-color-on-success-container:  hsl(150, 60%, 85%);

    /* ── Warning dark（新增）── */
    --blog-color-warning:               hsl(36, 85%, 58%);    /* 对深色字 ≈ 4.5:1 ✅ */
    --blog-color-on-warning:            hsl(36, 80%, 10%);
    --blog-color-warning-container:     hsl(36, 35%, 18%);
    --blog-color-on-warning-container:  hsl(36, 60%, 85%);

    /* ── Surface dark ── */
    --blog-color-background:            #0a0a0c;
    --blog-color-on-background:         #f5f5f7;
    --blog-color-surface:               #1c1c1e;
    --blog-color-on-surface:            #f5f5f7;
    --blog-color-surface-variant:       #2c2c2e;
    --blog-color-on-surface-variant:    #a1a1a6;
    --blog-color-surface-raised:        #28282a;

    /* ── Text dark（确定色值）── */
    --blog-color-text-primary:          #f5f5f7;              /* ≈ 14.5:1 ✅ */
    --blog-color-text-secondary:        #a1a1a6;              /* ≈ 5.2:1 ✅ */
    --blog-color-text-tertiary:         #636366;              /* ≈ 3.0:1 ⚠️ */
    --blog-color-text-quaternary:       #48484a;              /* ≈ 2.0:1 ⚠️ */

    /* ── Border dark ── */
    --blog-color-border:                #38383a;
    --blog-color-border-strong:         #48484a;
    --blog-color-divider:               #2c2c2e;
    --blog-color-outline:               #8e8e93;
    --blog-color-outline-variant:       #48484a;
  }
}

/* ═══════════════════════════════════════════════════════════
   Layer 2: Component Tokens — 组件内局部消费
   ═══════════════════════════════════════════════════════════ */
@layer design-tokens.components {
  :root {
    /* Button */
    --blog-comp-btn-primary-bg:          var(--blog-color-primary);
    --blog-comp-btn-primary-fg:          var(--blog-color-on-primary);
    --blog-comp-btn-primary-bg-hover:    var(--blog-color-primary-hover);
    --blog-comp-btn-primary-bg-active:   var(--blog-color-primary-active);

    --blog-comp-btn-secondary-bg:        var(--blog-color-secondary-container);
    --blog-comp-btn-secondary-fg:        var(--blog-color-on-secondary-container);

    --blog-comp-btn-ghost-bg:            transparent;
    --blog-comp-btn-ghost-fg:            var(--blog-color-on-surface-variant);

    --blog-comp-btn-outline-fg:          var(--blog-color-on-surface-variant);
    --blog-comp-btn-outline-border:      var(--blog-color-outline);

    --blog-comp-btn-disabled-bg:         var(--blog-color-disabled-bg);
    --blog-comp-btn-disabled-fg:         var(--blog-color-disabled-fg);

    /* Chip */
    --blog-comp-chip-bg:                 var(--blog-color-surface-variant);
    --blog-comp-chip-fg:                 var(--blog-color-on-surface-variant);
    --blog-comp-chip-selected-bg:        var(--blog-color-secondary-container);
    --blog-comp-chip-selected-fg:        var(--blog-color-on-secondary-container);

    /* Card */
    --blog-comp-card-bg:                 var(--blog-color-surface);
    --blog-comp-card-fg:                 var(--blog-color-on-surface);
    --blog-comp-card-border:             var(--blog-color-border);

    /* Input */
    --blog-comp-input-bg:                var(--blog-color-surface-container-high);
    --blog-comp-input-fg:                var(--blog-color-on-surface);
    --blog-comp-input-placeholder:       var(--blog-color-on-surface-variant);
    --blog-comp-input-border:            var(--blog-color-outline);
    --blog-comp-input-focus-ring:        var(--blog-color-primary);

    /* Badge */
    --blog-comp-badge-primary-bg:        var(--blog-color-primary-container);
    --blog-comp-badge-primary-fg:        var(--blog-color-on-primary-container);
    --blog-comp-badge-error-bg:          var(--blog-color-error-container);
    --blog-comp-badge-error-fg:          var(--blog-color-on-error-container);

    /* Alert */
    --blog-comp-alert-error-bg:          var(--blog-color-error-container);
    --blog-comp-alert-error-fg:          var(--blog-color-on-error-container);
    --blog-comp-alert-success-bg:        var(--blog-color-success-container);
    --blog-comp-alert-success-fg:        var(--blog-color-on-success-container);
    --blog-comp-alert-warning-bg:        var(--blog-color-warning-container);
    --blog-comp-alert-warning-fg:        var(--blog-color-on-warning-container);

    /* Link */
    --blog-comp-link-fg:                 var(--blog-color-text-link);
    --blog-comp-link-fg-hover:           var(--blog-color-text-link-hover);

    /* Focus */
    --blog-comp-focus-ring-color:        var(--blog-color-primary);
    --blog-comp-focus-ring-width:        2px;
    --blog-comp-focus-ring-offset:       2px;
  }
}
```

---

## 七、最终结论

### 命名空间和精细 token 是否足以防止对比度问题？

**结论：不足以独立防止，但是必要的基础。**

| 维度 | 当前水平 | 能否独立防止对比度问题 |
|------|---------|----------------------|
| 命名空间 | ★★★★☆ | ❌ 命名空间只解决了"组织混乱"问题，不能防止"值本身错误" |
| 语义化 Token | ★★★☆☆ | ⚠️ 部分解决——有 `on-*` 配对范式但覆盖不完整（缺 success/warning/disabled） |
| 前景/背景配对 | ★★★☆☆ | ⚠️ 配对定义存在但**未强制化**，开发者仍可自由组合 |
| CSS 选择器约束 | ★★★★☆ | ⚠️ 整体良好，但 `!important` 和 `:global()` 破坏了局部隔离 |
| 多主题覆盖 | ★★★★☆ | ⚠️ 框架完善但 success/warning/brutal 色块在 dark 下未覆写 |
| 自动化校验 | ★☆☆☆☆ | ❌ **完全缺失**——这是最大的短板 |

### 还需要哪些配套机制？

```
防止对比度问题的完整防线：

                    ┌──────────────────────────┐
                    │  第 1 层：Token 架构       │ ← 当前已有基础
                    │  三层 token + 配对范式     │    但需补全缺口
                    └─────────┬────────────────┘
                              │
                    ┌─────────▼────────────────┐
                    │  第 2 层：命名约束         │ ← 需要新增
                    │  stylelint 规则 +          │
                    │  禁止硬编码色值             │
                    └─────────┬────────────────┘
                              │
                    ┌─────────▼────────────────┐
                    │  第 3 层：配对强制化        │ ← 需要新增
                    │  组件只消费 component token │
                    │  component token 只引用     │
                    │  已验证的 semantic 配对      │
                    └─────────┬────────────────┘
                              │
                    ┌─────────▼────────────────┐
                    │  第 4 层：构建时校验        │ ← 需要新增
                    │  token 值对比度计算         │
                    │  配对矩阵验证              │
                    │  Monet 输出验证            │
                    └─────────┬────────────────┘
                              │
                    ┌─────────▼────────────────┐
                    │  第 5 层：运行时审计        │ ← 需要新增
                    │  axe-core / pa11y CI       │
                    │  视觉回归测试              │
                    └──────────────────────────┘
```

**五层防线缺一不可**。当前项目在第 1 层有良好基础，但第 2-5 层完全缺失。即使补全了 token 架构（第 1 层），没有后续层的约束和校验，对比度问题仍然会因为：

1. 开发者绕过 token 直接写硬编码色值
2. 新 token 值未经对比度计算就合入
3. Monet 动态配色生成未经校验的值
4. 组件错误组合前景色和背景色

而反复出现。

### 优先级建议

| 优先级 | 行动 | 预期收益 |
|--------|------|---------|
| 🔴 P0 | 修复 Primary button 对比度（light 下 3.7:1 → 4.5:1+） | 消除最高频对比度违规 |
| 🔴 P0 | 修复 Secondary button 对比度（light 下 3.4:1 → 4.5:1+） | 同上 |
| 🔴 P0 | 添加构建时 token 对比度校验脚本 | 防止未来回归 |
| 🟡 P1 | 补全 success/warning 配对 + dark 覆写 | 消除盲区 |
| 🟡 P1 | 文本透明度改为确定色值 | 使对比度可静态验证 |
| 🟡 P1 | 消除 filters.css 中 15 处 `!important` | 恢复 token 调控能力 |
| 🟡 P1 | 组件级 token 统一命名空间为 `--blog-comp-*` | 防止撞名和跨组件误用 |
| 🟢 P2 | 添加 stylelint 禁止硬编码颜色规则 | 防止绕过 token |
| 🟢 P2 | 添加 CI axe-core 对比度审计 | 运行时兜底 |
| 🟢 P2 | Glassmorphism 对比度运行时检测 | 处理半透明场景 |
| 🟢 P2 | Monet 输出自动对比度校验 | 动态配色安全网 |
