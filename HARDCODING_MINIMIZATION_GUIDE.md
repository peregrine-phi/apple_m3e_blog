# 硬编码最小化落地实施指南

> 基于 `HARDCODING_AUDIT.md` 的逐项落地执行方案  
> 每一条引用审计编号（如 A1 = 审计报告第一条），确保可追溯  
> 本项目：Astro v5 + Tailwind CSS v4 + Material 3 Expressive

---

## 前置工作：新增 Token 文件（所有阶段的前置依赖）

在执行任何替换之前，需要先创建以下文件——它们是后续所有替换的"目标 Token"。

### 新建 1：`src/styles/semantic/breakpoints.css`

```css
/* ============================================
   Breakpoint Tokens
   统一管理所有响应式断点，消除分散的硬编码
   ============================================ */
:root {
  --blog-bp-xs: 480px;
  --blog-bp-sm: 600px;
  --blog-bp-md: 768px;
  --blog-bp-lg: 1024px;
}
```

然后在 `src/styles/main.css` 顶部新增一行导入：

```css
@import "./semantic/breakpoints.css";
```

> 由于 `@media` 不支持 `var()`，断点 Token 作为文档记录和构建工具引用的单一事实来源。  
> 所有新增媒体查询应以 `/* = 使用 --blog-bp-{size} */` 注释标注对应的语义 Token。

---

### 新建 2：`src/config/monet.config.ts`

```typescript
// 单一事实来源：Monet 配色预设与变体配置
// 被 src/utils/monet.ts 和 scripts/generate-monet.mjs 共同引用

export const monetConfig = {
  /** 默认种子色，同时也是主题色 meta 标签的默认值 */
  defaultSeed: "#3B5CF6",

  presets: [
    { name: "m3-default", seed: "#6750A4" },
    { name: "ocean",      seed: "#006C52" },
    { name: "coral",      seed: "#BA1A1A" },
    { name: "sapphire",   seed: "#3B5CF6" },
    { name: "amber",      seed: "#825500" },
    { name: "rose",       seed: "#A0004B" },
    { name: "mint",       seed: "#006C4C" },
    { name: "plum",       seed: "#7A0065" },
  ] as const,

  variants: [
    { value: "tonalSpot",  label: "Tonal Spot" },
    { value: "expressive", label: "Expressive" },
    { value: "vibrant",    label: "Vibrant" },
    { value: "content",    label: "Content" },
    { value: "monochrome", label: "Monochrome" },
  ] as const,
} as const;
```

### 新建 3：`src/styles/components/` 目录

```
src/styles/components/
├── button.css      # MDButton 的组件级 Token
├── badge.css       # MDBadge 的组件级 Token
├── chip.css        # Chip 的组件级 Token
├── switch.css      # MDSwitch 的组件级 Token
├── textfield.css   # TextField 的组件级 Token
├── snackbar.css    # MDSnackbar 的组件级 Token
├── searchbar.css   # SearchBar 的组件级 Token
├── toc.css         # TableOfContents 的组件级 Token
├── header.css      # Header / Navigation 的组件级 Token
├── footer.css      # Footer 的组件级 Token
├── blogcard.css    # BlogCard 的组件级 Token
├── pullquote.css   # PullQuote 的组件级 Token
├── themetoggle.css # ThemeToggle 的组件级 Token
├── langtoggle.css  # LanguageToggle 的组件级 Token
└── monetswitcher.css # MonetSwitcher 的组件级 Token
```

每个文件的内容模式见对应阶段。

---

### 新建 4：`src/components/Icon.astro`

（参见下方 Phase 4 — 图标组件化）

---

## Phase 1：立即修复（P0，6 项）

### P0-1. BaseLayout.astro:53 — theme-color 硬编码

| 审计编号 | 文件 | 行号 | 旧值 | 新值 |
|----------|------|------|------|------|
| A2.5-33 | `src/layouts/BaseLayout.astro` | 53 | `content="#3B5CF6"` | `content={monetConfig.defaultSeed}` |

**改动**：

```astro
<!-- 模板部分顶部添加 import -->
---
import { monetConfig } from "../config/monet.config";
---

<!-- 第 53 行改为 -->
<meta name="theme-color" content={monetConfig.defaultSeed} />
```

**可选增强**（如希望跟随用户选择的动态主题色）：通过客户端脚本在 theme/monet 切换时更新 meta 标签。

---

### P0-2. Footer.astro:28 — GitHub 占位符

| 审计编号 | 文件 | 行号 | 旧值 | 新值 |
|----------|------|------|------|------|
| A1-7 | `src/components/Footer.astro` | 28 | `href="https://github.com"` | `href="/about"`（暂指向关于页）或换为实际 GitHub 链接 |

**改动**：直接修改 `Footer.astro:28` 的 `href` 属性为目标 URL。

> 同时建议将 GitHub 链接作为可配置项抽入 `src/config/site.config.ts`（见 Phase 1 可选项）。

---

### P0-3. MonetSwitcher.astro:33 — 默认种子色

| 审计编号 | 文件 | 行号 | 旧值 | 新值 |
|----------|------|------|------|------|
| A2.5-34 | `src/components/MonetSwitcher.astro` | 33 | `value="#3B5CF6"` | `value={monetConfig.defaultSeed}` |

**改动**：

```astro
---
import { monetConfig } from "../config/monet.config";
const defaultSeed = monetConfig.defaultSeed;
---

<!-- 原 33 行 -->
<input ... value={defaultSeed} />
```

---

### P0-4. MonetSwitcher.astro:159 — 硬编码渐变色

| 审计编号 | 文件 | 行号 | 旧内容 | 新内容 |
|----------|------|------|--------|--------|
| A2.5-35 + A2.6-41 | `src/components/MonetSwitcher.astro` | 159 | `linear-gradient(135deg, #ff0055, #00ffaa, #0055ff)` | `linear-gradient(135deg, var(--blog-color-tertiary), var(--blog-color-success), var(--blog-color-primary))` |

**改动**：将渐变色中的三个 hex 值替换为语义化 CSS 变量。

---

### P0-5. Monet 预设去重（monet.ts 和 generate-monet.mjs）

| 审计编号 | 文件 | 改动内容 |
|----------|------|----------|
| A7-4, A7-5, A12-1 | `src/utils/monet.ts` | 删除内联的 `MONET_PRESETS`，改为 `import { monetConfig } from "../config/monet.config"` |
| A7-12, A12-1 | `scripts/generate-monet.mjs` | 同步引用 `monetConfig` |

**`src/utils/monet.ts` 改动**（替换第 264-282 行）：

```typescript
// 删除原来的 MONET_PRESETS 和 MONET_VARIANTS 定义
// 改为：
import { monetConfig } from "../config/monet.config";
export const MONET_PRESETS = monetConfig.presets;
export const MONET_VARIANTS = monetConfig.variants;
```

**`scripts/generate-monet.mjs` 改动**（替换第 36-53 行）：

```javascript
import { monetConfig } from "../src/config/monet.config.js";

const PRESETS = monetConfig.presets.map(p => ({
  name: p.name,
  seed: parseInt(p.seed.replace("#", ""), 16) | 0xFF000000
}));
const VARIANTS = monetConfig.variants.map(v => ({
  key: v.value,
  factory: {
    tonalSpot: SchemeTonalSpot,
    expressive: SchemeExpressive,
    vibrant: SchemeVibrant,
    content: SchemeContent,
    monochrome: SchemeMonochrome,
  }[v.value]
}));
```

---

### P0-6. 断点 Token 定义

| 审计编号 | 文件 | 内容 |
|----------|------|------|
| A6-全部 | `src/styles/semantic/breakpoints.css` | 定义 `--blog-bp-xs/sm/md/lg` 四个 Token |

执行"新建 1"中的内容：创建 `breakpoints.css` 并导入 `main.css`。

---

## Phase 2：组件级 Token 提取（6 个核心组件，P1）

### 组件 Token 定义文件

#### `src/styles/components/button.css`

```css
/* MDButton — Material 3 Button 组件 Token */
:root {
  --btn-height: 40px;
  --btn-height-fab: 56px;
  --btn-min-width-fab: 56px;
  --btn-gap: var(--blog-space-2);
  --btn-padding-x: var(--blog-space-6);
  --btn-radius: var(--blog-radius-full);
  --btn-radius-fab: var(--blog-radius-lg);
  --btn-font-size: var(--blog-typescale-label-large-size);
  --btn-letter-spacing: var(--blog-typescale-label-large-tracking);
}
```

#### `src/styles/components/badge.css`

```css
/* MDBadge — 徽标组件 Token */
:root {
  --badge-height: 16px;
  --badge-min-width: 16px;
  --badge-dot-size: 6px;
  --badge-font-size: var(--blog-typescale-label-small-size);
  --badge-letter-spacing: var(--blog-typescale-label-small-tracking);
  --badge-line-height: 1;
}
```

#### `src/styles/components/chip.css`

```css
/* Chip — 标签/Tag 组件 Token */
:root {
  --chip-height: 32px;
  --chip-gap: var(--blog-space-2);
  --chip-radius: var(--blog-radius-sm);
  --chip-icon-size: 18px;
  --chip-icon-size-large: 24px;
  --chip-max-width: 200px;
}
```

#### `src/styles/components/switch.css`

```css
/* MDSwitch — 开关组件 Token */
:root {
  --switch-track-width: 52px;
  --switch-track-height: 32px;
  --switch-thumb-size: 16px;
  --switch-icon-size: 12px;
  --switch-thumb-checked-size: 24px;
  --switch-thumb-dragging-width: 28px;
}
```

#### `src/styles/components/textfield.css`

```css
/* TextField — 文本输入组件 Token */
:root {
  --textfield-min-height: 56px;
  --textfield-padding-top: 24px;
  --textfield-padding-x: 16px;
  --textfield-padding-bottom: 8px;
  --textfield-radius: var(--blog-radius-xs);
  --textfield-icon-size: 24px;
  --textfield-gap: var(--blog-space-1);
  --textfield-line-height: 1.5;
}
```

#### `src/styles/components/snackbar.css`

```css
/* MDSnackbar — 提示条组件 Token */
:root {
  --snackbar-min-width: 344px;
  --snackbar-max-width: 568px;
  --snackbar-gap: var(--blog-space-6);
  --snackbar-padding-y: 14px;
  --snackbar-padding-x: 16px;
  --snackbar-font-size: var(--blog-typescale-body-medium-size);
  --snackbar-letter-spacing: var(--blog-typescale-body-medium-tracking);
}
```

### 对应组件的替换

#### MDButton.astro 逐项替换

| 审计编号 | 行号 | 旧值 | 新值 |
|----------|------|------|------|
| A4-35 | 61 | `gap: 8px` | `gap: var(--btn-gap)` |
| A4-36 | 62 | `height: 40px` | `height: var(--btn-height)` |
| A4-37 | 192 | `height: 56px` | `height: var(--btn-height-fab)` |
| A4-38 | 193 | `min-width: 56px` | `min-width: var(--btn-min-width-fab)` |
| A4-39 | 220 | `gap: 8px` | `gap: var(--btn-gap)` |

同时在文件顶部确保组件 Token 已通过 `main.css` 间接加载。

#### MDBadge.astro 逐项替换

| 审计编号 | 行号 | 旧值 | 新值 |
|----------|------|------|------|
| A3-25 | 51 | `letter-spacing: var(--blog-typescale-label-small-tracking, 0.5px)` | `letter-spacing: var(--badge-letter-spacing)` |
| A4-40 | 39 | `line-height: 1` | `line-height: var(--badge-line-height)` |
| A4-41 | 45-46 | `height: 16px; min-width: 16px` | `height: var(--badge-height); min-width: var(--badge-min-width)` |
| A4-42 | 56-57 | `width: 6px; height: 6px` | `width: var(--badge-dot-size); height: var(--badge-dot-size)` |

#### Chip.astro 逐项替换

| 审计编号 | 行号 | 旧值 | 新值 |
|----------|------|------|------|
| A4-43 | 60 | `gap: 8px` | `gap: var(--chip-gap)` |
| A4-44 | 61 | `height: 32px` | `height: var(--chip-height)` |
| A4-45 | 63 | `border-radius: 8px` | `border-radius: var(--chip-radius)` |
| A4-46 | 149-150 | `width: 24px; height: 24px` | `width: var(--chip-icon-size-large); height: var(--chip-icon-size-large)` |
| A4-47 | 175-176 | `width: 18px; height: 18px` | `width: var(--chip-icon-size); height: var(--chip-icon-size)` |
| A4-48 | 185 | `max-width: 200px` | `max-width: var(--chip-max-width)` |

#### MDSwitch.astro 逐项替换

| 审计编号 | 行号 | 旧值 | 新值 |
|----------|------|------|------|
| A4-30 | 79-80 | `width: 52px; height: 32px` | `width: var(--switch-track-width); height: var(--switch-track-height)` |
| A4-31 | 99-100 | `width: 16px; height: 16px` | `width: var(--switch-thumb-size); height: var(--switch-thumb-size)` |
| A4-32 | 117-118 | `width: 12px; height: 12px` | `width: var(--switch-icon-size); height: var(--switch-icon-size)` |
| A4-33 | 145-146 | `width: 24px; height: 24px` | `width: var(--switch-thumb-checked-size); height: var(--switch-thumb-checked-size)` |
| A4-34 | 166 | `width: 28px` | `width: var(--switch-thumb-dragging-width)` |

#### TextField.astro 逐项替换

| 审计编号 | 行号 | 旧值 | 新值 |
|----------|------|------|------|
| A3-27 | 51 | `line-height: 1.5` | `line-height: var(--textfield-line-height)` |
| A4-62 | 41 | `gap: 4px` | `gap: var(--textfield-gap)` |
| A4-63 | 42 | `min-height: 56px` | `min-height: var(--textfield-min-height)` |
| A4-64 | 42 | `border-radius: 4px 4px 0 0` | `border-radius: var(--textfield-radius) var(--textfield-radius) 0 0` |
| A4-65 | 49 | `padding: 24px 16px 8px` | `padding: var(--textfield-padding-top) var(--textfield-padding-x) var(--textfield-padding-bottom)` |
| A4-66 | 50 | `padding: 16px` | `padding: var(--textfield-padding-x)` |
| A4-67 | 78 | `width: 24px; height: 24px` | `width: var(--textfield-icon-size); height: var(--textfield-icon-size)` |

#### MDSnackbar.astro 逐项替换

| 审计编号 | 行号 | 旧值 | 新值 |
|----------|------|------|------|
| A3-26 | 31 | `letter-spacing: var(--blog-typescale-body-medium-tracking, 0.25px)` | `letter-spacing: var(--snackbar-letter-spacing)` |
| A4-53 | 20 | `gap: 24px` | `gap: var(--snackbar-gap)` |
| A4-54 | 21 | `min-width: 344px` | `min-width: var(--snackbar-min-width)` |
| A4-55 | 22 | `max-width: 568px` | `max-width: var(--snackbar-max-width)` |
| A4-56 | 23 | `padding: 14px 16px` | `padding: var(--snackbar-padding-y) var(--snackbar-padding-x)` |

---

## Phase 3：间距/排版/容器类替换（97+28 项，P1-P2）

以下逐文件列出，每项标注审计编号和具体替换值。

### 3A. `src/components/Header.astro`

| 审计编号 | 行号 | 旧值 | 新值 |
|----------|------|------|------|
| A3-16 | 161 | `letter-spacing: -0.02em` | `letter-spacing: var(--blog-typescale-headline-small-tracking)` |
| A4-11 | 63 | `padding: 12px 16px 0` | `padding: var(--blog-space-3) var(--blog-space-4) 0` |
| A4-12 | 73 | `max-width: 980px` | `max-width: 980px`（保留，这是 Header 特有的紧凑宽度，但建议新增 `--header-max-width: 980px` 组件 Token） |
| A4-13 | 75 | `border-radius: 18px` | `border-radius: var(--blog-radius-2xl)` |
| A4-16 | 113 | `transition: left 0.75s cubic-bezier(...)` | `transition: left var(--blog-motion-duration-expressive) var(--blog-motion-spring-default)` |
| A4-18 | 147 | `height: 54px` | `height: 54px`（建议新增 `--header-height: 54px` 或使用 calc 表达式） |
| A4-19 | 148 | `padding: 0 24px` | `padding: 0 var(--blog-space-6)` |
| A4-20 | 171-172 | `width: 10px; height: 10px` (logo-dot) | `width: var(--logo-dot-size); height: var(--logo-dot-size)`（需新增 Token，见下方） |
| A4-21 | 191 | `border-radius: 10px` | `border-radius: var(--blog-radius-sm)`（10px 接近 8px）或新增 `--nav-link-radius: 10px` |
| A4-22 | 234 | `border-radius: 10px` | 同上 |
| A4-23 | 247 | `padding-top: 6px` | `padding-top: var(--blog-space-1-5)` |
| A4-24 | 253 | `padding: 8px 10px 0` | `padding: var(--blog-space-2) var(--blog-space-2-5) 0` |
| A4-25 | 257 | `border-radius: 14px` | `border-radius: var(--blog-radius-lg)`（14px 接近 16px） |
| A4-26 | 261 | `height: 48px` | `height: 48px`（建议新增 `--header-height-mobile: 48px`） |
| A4-27 | 262 | `padding: 0 14px` | `padding: 0 var(--blog-space-3-5)` |

**新增 Header 组件 Token `src/styles/components/header.css`**：

```css
:root {
  /* Header — 导航栏组件 Token */
  --header-max-width: 980px;
  --header-height: 54px;
  --header-height-mobile: 48px;
  --header-padding-y: var(--blog-space-3);
  --header-padding-x: var(--blog-space-4);
  --header-padding-x-inner: var(--blog-space-6);
  --header-radius: var(--blog-radius-2xl);
  --header-radius-mobile: var(--blog-radius-lg);
  --header-scrolled-padding-top: var(--blog-space-1-5);

  /* Logo */
  --logo-dot-size: 10px;
  --logo-font-size: var(--blog-typescale-headline-small-size);
  --logo-letter-spacing: var(--blog-typescale-headline-small-tracking);

  /* Nav Link */
  --nav-link-radius: var(--blog-radius-sm);
}
```

则 Header.astro 对应行改为：

```
63:  padding: var(--header-padding-y) var(--header-padding-x) 0
73:  max-width: var(--header-max-width)
75:  border-radius: var(--header-radius)
147: height: var(--header-height)
148: padding: 0 var(--header-padding-x-inner)
161: letter-spacing: var(--logo-letter-spacing)
171: width: var(--logo-dot-size)
172: height: var(--logo-dot-size)
191: border-radius: var(--nav-link-radius)
234: border-radius: var(--nav-link-radius)
247: padding-top: var(--header-scrolled-padding-top)
253: padding: var(--blog-space-2) var(--blog-space-2-5) 0
257: border-radius: var(--header-radius-mobile)
261: height: var(--header-height-mobile)
262: padding: 0 var(--blog-space-3-5)
```

---

### 3B. `src/components/Footer.astro`

| 审计编号 | 行号 | 旧值 | 新值 |
|----------|------|------|------|
| A4-28 | 58 | `max-width: 280px` | `max-width: 280px`（建议新增 `--footer-brand-max-width: 280px`） |
| A4-29 | 74-75 | `width: 10px; height: 10px` (logo-dot) | `width: var(--logo-dot-size); height: var(--logo-dot-size)` |

> Logo dot 样式与 Header 完全重复（A12-3）。统一引用 `--logo-dot-size`。

---

### 3C. `src/components/BlogCard.astro`

| 审计编号 | 行号 | 旧值 | 新值 |
|----------|------|------|------|
| A3-1 | 208 | `font-size: 11px` | `font-size: var(--blog-typescale-label-small-size)` |
| A3-2 | 210 | `letter-spacing: 0.04em` | `letter-spacing: var(--blog-typescale-label-small-tracking)` |
| A3-3 | 207 | fallback `12px` | 去掉 fallback，纯净引用 `var(--blog-radius-badge)` |
| A4-6 | 44 | `style="gap: 6px"` | `style={`gap: var(--blog-space-1-5)`}` |
| A4-9 | 206 | `padding: 2px 8px` | `padding: var(--blog-space-0-5) var(--blog-space-2)` |
| A5-9 | 15-18 | `"en-US"` 日期 locale | 改为动态 locale |
| A5-10 | 48 | `"中文" : "EN"` 三元 | 见 Phase 4 — i18n 字符串 |
| A5-11 | 53 | emoji 三元 | 引用 `stageConfig` |

**BlogCard 日期 locale 修复（A5-9）**：

```astro
---
import { getLangFromUrl } from "../i18n/utils"; // 如果尚无此工具函数
// 或简单方案：从 Astro.url 推断
const locale = Astro.url.pathname.startsWith("/zh") ? "zh-CN" : "en-US";
const formattedDate = publishedAt.toLocaleDateString(locale, {
  year: "numeric", month: "long", day: "numeric",
});
---
```

**BlogCard growthStage emoji 去重（A5-11 + A12-5）**：

```astro
---
import { stageConfig } from "../content/filter-config";
const stageEmoji = stageConfig[growthStage]?.emoji ?? "🌱";
---

<!-- 原 53 行改为 -->
<span class="stage-emoji">{stageEmoji}</span>
```

---

### 3D. `src/components/SearchBar.astro`

| 审计编号 | 行号 | 旧值 | 新值 |
|----------|------|------|------|
| A4-57 | 54 | `height: 48px` | `height: 48px`（建议新增 `--searchbar-height: 48px`） |
| A4-58 | 113-114 | `width: 28px; height: 28px` | 建议新增 `--searchbar-icon-size: 28px` |

---

### 3E. `src/components/TableOfContents.astro`

| 审计编号 | 行号 | 旧值 | 新值 |
|----------|------|------|------|
| A3-28 | 159 | `line-height: 1.45` | `line-height: var(--blog-typescale-body-small-leading)` |
| A4-59 | 121 | `width: 220px` | `width: 220px`（建议新增 `--toc-width: 220px`） |
| A4-60 | 142 | `gap: 2px` | `gap: var(--blog-space-0-5)` |
| A4-61 | 157 | `padding: 4px 0` | `padding: var(--blog-space-1) 0` |

---

### 3F. `src/components/PullQuote.astro`

| 审计编号 | 行号 | 旧值 | 新值 |
|----------|------|------|------|
| A3-10 | 33 | `font-size: clamp(1.5rem, 3vw, 2.25rem)` | `font-size: var(--blog-typescale-display-small-size)` |
| A3-11 | 35 | `line-height: 1.2` | `line-height: var(--blog-typescale-display-small-leading)` |
| A3-12 | 36 | `letter-spacing: -0.012em` | `letter-spacing: var(--blog-typescale-headline-medium-tracking)` |
| A3-13 | 64 | `letter-spacing: -0.02em` | `letter-spacing: var(--blog-typescale-headline-small-tracking)` |
| A3-14 | 77 | `letter-spacing: 0.02em` | `letter-spacing: var(--blog-typescale-label-large-tracking)` |
| A3-15 | 93 | `font-size: 1.375rem` | `font-size: var(--blog-typescale-title-large-size)` |
| A4-70 | 43 | `max-width: 540px` | `max-width: 540px`（建议新增组件 Token） |
| A4-71 | 54 | `max-width: 640px` | `max-width: 640px`（同上） |

---

### 3G. `src/components/ThemeToggle.astro` + `LanguageToggle.astro` + `MonetSwitcher.astro`

| 审计编号 | 文件 | 行号 | 旧值 | 新值 |
|----------|------|------|------|------|
| A4-68 | ThemeToggle | 62-63 | `width: 40px; height: 40px` | 新增 `--toggle-size: 40px` |
| A3-4 | LanguageToggle | 57 | `font-size: 13px` | `font-size: var(--blog-typescale-label-large-size)` |
| A3-5 | LanguageToggle | 58 | `font-weight: 600` | `font-weight: var(--blog-font-weight-semibold)` |
| A4-69 | LanguageToggle | 61 | `width: 20px` | 使用 `var(--toggle-text-width, 20px)` |
| A3-7 | MonetSwitcher | 162 | `font-size: 20px` | `font-size: var(--blog-typescale-title-large-size)` |
| A3-8 | MonetSwitcher | 170 | `font-size: 16px` | `font-size: var(--blog-typescale-body-large-size)` |
| A3-9 | MonetSwitcher | 199 | `letter-spacing: 0.05em` | `letter-spacing: var(--blog-typescale-label-medium-tracking)` |
| A4-49 | MonetSwitcher | 51-52 | `width: 36px; height: 36px` | 新增 `--monet-swatch-size: 36px` |
| A4-50 | MonetSwitcher | 67-68 | `width: 14px; height: 14px` | 新增 `--monet-icon-size: 14px` |
| A4-51 | MonetSwitcher | 86 | `width: 256px` | 新增 `--monet-dropdown-width: 256px` |
| A4-52 | MonetSwitcher | 123-124 | `width: 36px; height: 36px` | `var(--monet-swatch-size)` |

---

### 3H. `src/styles/base/garden.css`

| 审计编号 | 行号 | 旧值 | 新值 |
|----------|------|------|------|
| A3-17 | 46 | `line-height: 1.2` | `line-height: var(--blog-typescale-label-medium-leading)` |
| A3-18 | 87 | `line-height: 1.2` | 同上 |
| A3-19 | 163 | `font-size: 11px` | `font-size: var(--blog-typescale-label-small-size)` |
| A3-20 | 164 | `line-height: 1` | `line-height: var(--blog-typescale-label-small-leading)` |
| A3-21 | 237 | `letter-spacing: 0.05em` | `letter-spacing: var(--blog-typescale-label-medium-tracking)` |
| A3-22 | 245 | `line-height: 1.3` | `line-height: var(--blog-typescale-title-medium-leading)` |
| A3-23 | 252 | `line-height: 1.4` | `line-height: var(--blog-typescale-body-small-leading)` |
| A2.5-36 | 58 | `rgba(128, 128, 128, 0.06)` | 应提取为专属 Token 或使用语义变量 |
| A2.5-37 | 212 | `rgba(255, 255, 255, 0.08)` | 同上 |
| A4-76 | 186 | `width: 280px` (tooltip) | 新增 `--garden-tooltip-width: 280px` |
| A4-77 | 226-227 | `width: 6px; height: 6px` (dot) | `var(--garden-dot-size, 6px)` |
| A4-78 | 114-115 | `width: 8px; height: 8px` | 新增 Token |

---

### 3I. 内联 style 属性替换（Astro 模板）

| 审计编号 | 文件 | 行号 | 旧值 | 新值 |
|----------|------|------|------|------|
| A4-2 | `index.astro` | 38,90,118 | `style="gap: 8px"` | `style={`gap: var(--blog-space-2)`}` |
| A4-3 | `about.astro` | 153 | `style="gap: 16px; max-width: 400px"` | `style={`gap: var(--blog-space-4); max-width: 400px`}` |
| A4-72 | `FilterGroup.astro` | 21 | `style="margin-top: 12px; ... gap: 8px"` | `style={`margin-top: var(--blog-space-3); display: flex; flex-direction: column; gap: var(--blog-space-2)`}` |
| A4-73 | `FilterGroup.astro` | 22 | `style="gap: 8px"` | `style={`gap: var(--blog-space-2)`}` |
| A4-74 | `FilterGroup.astro` | 26 | `style="gap: 8px"` | `style={`gap: var(--blog-space-2)`}` |

---

### 3J. 页面级和布局级容器尺寸

| 审计编号 | 文件 | 行号 | 旧值 | 新值 |
|----------|------|------|------|------|
| A4-92 | `PageLayout.astro` | 24 | `max-width: 800px` | 直接复用 `.container-narrow`（已有 `max-width: 800px`） |
| A4-93 | `HeroLayout.astro` | 35 | `max-width: 1200px` | 直接复用 `.container-wide`（已有 `max-width: 1200px`） |
| A4-94 | `BlogListLayout.astro` | 35 | `max-width: 1200px` | 同上 |
| A4-95 | `WideLayout.astro` | 25 | `max-width: 1200px` | 同上 |

> **策略**：这些 Layout 各自的 `max-width` 可以直接删除，改为在各自的容器 DOM 上添加 `class="container-wide"` 或 `class="container-narrow"`。全局 CSS 中的 `.container-narrow`（800px）和 `.container-wide`（1200px）即成为这些布局的唯一来源。

---

### 3K. 剩余 CSS 文件中的间距/尺寸

| 审计编号 | 文件 | 行号 | 旧值 | 新值 |
|----------|------|------|------|------|
| A4-80 | `home.css` | 112-113 | `width: 700px; height: 700px` | 新增 `--hero-blob-size: 700px` |
| A4-81 | `home.css` | 170-171 | `width: 800px; height: 800px` | 新增 `--hero-blob-size-large: 800px` |
| A4-82 | `home.css` | 233 | `min-width: 260px` | 新增 Token |
| A4-83 | `editorial.css` | 112-113 | `width: 700px; height: 700px` | 复用 `--hero-blob-size` |
| A4-84 | `editorial.css` | 170-171 | `width: 800px; height: 800px` | 复用 `--hero-blob-size-large` |
| A4-85 | `editorial.css` | 226 | `min-width: 260px` | 复用上方的 Token |
| A4-86 | `filters.css` | 15 | `max-width: 480px` | 新增 `--filter-section-max-width: 480px` |
| A4-87 | `filters.css` | 37 | `height: 32px` | `var(--chip-height)` |
| A4-88 | `blog.css` | 26 | `max-width: 480px` | 复用 `--filter-section-max-width` |
| A4-89 | `blog.css` | 48 | `height: 32px` | `var(--chip-height)` |
| A4-90 | `blog.css` | 105-106 | `width: 14px; height: 14px` | 新增 Token |
| A4-91 | `filters.css` | 156-157 | `width: 14px; height: 14px` | 同上 |

---

## Phase 4：图标 / i18n / 重复代码消除（P2）

### 4A. 创建 Icon 组件 `src/components/Icon.astro`

```astro
---
// src/components/Icon.astro — 集中管理所有内联 SVG 图标
// 消除 A9-1 至 A9-10 共 10 处硬编码 SVG
const icons = {
  "arrow-right": `<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>`,
  "search": `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,
  "plus": `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
  "menu": `<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>`,
  "sun": `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`,
  "moon": `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`,
  "globe": `<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>`,
} as const;

interface Props {
  name: keyof typeof icons;
  size?: number;
  class?: string;
}

const { name, size = 24, class: className } = Astro.props;
---

<svg
  class={className}
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  set:html={icons[name]}
/>
```

#### 图标替换映射表

| 审计编号 | 当前文件 | 原内容 | 替换为 |
|----------|----------|--------|--------|
| A9-1 | `index.astro:52-54` | 内联箭头 SVG | `<Icon name="arrow-right" size={16} />` |
| A9-2 | `index.astro:126-128` | 内联箭头 SVG | `<Icon name="arrow-right" size={16} />` |
| A9-4 | `about.astro:105` | 内联搜索 SVG | `<Icon name="search" size={18} />` |
| A9-5 | `about.astro:131` | 内联加号 SVG | `<Icon name="plus" size={18} />` |
| A9-6 | `Header.astro:40-44` | 内联汉堡菜单 SVG | `<Icon name="menu" size={24} />` |
| A9-7 | `ThemeToggle.astro:12-32` | 内联太阳 SVG | `<Icon name="sun" size={20} class="theme-icon theme-icon-light" />` |
| A9-8 | `ThemeToggle.astro:35-48` | 内联月亮 SVG | `<Icon name="moon" size={20} class="theme-icon theme-icon-dark" />` |
| A9-9 | `LanguageToggle.astro:12-27` | 内联地球 SVG | `<Icon name="globe" size={20} />` |

> A9-3（about.astro 头像 SVG）和 A9-10（filter-config.ts 品牌 SVG）保留原位——前者是特定装饰图形非通用图标，后者是配置中的嵌入式标记。

---

### 4B. 客户端 i18n 硬编码字符串

| 审计编号 | 文件 | 行号 | 问题 | 解决方案 |
|----------|------|------|------|----------|
| A5-5 | `blog/index.astro` | 33 | `placeholder="Search..."` | 在模板中使用 `<I18n tKey="blog.searchPlaceholder" />` 但 placeholder 不能放组件，改为服务端注入 |
| A5-6 | `blog/index.astro` | 90 | JS 中硬编码 placeholder | 见下方方案 |
| A5-8 | `blog/index.astro` | 145-147 | JS 中硬编码空状态文本 | 见下方方案 |
| A5-1 | `index.astro` | 25-26 | title 硬编码 | 改为 `<I18n tKey="home.title" />`（需在 translations.ts 中新增） |
| A5-2 | `about.astro` | 9 | title 硬编码 | 已有翻译 `about.title`，改用 `<I18n tKey="about.title" />` |

**`blog/index.astro` JS 中 i18n 字符串修复方案**：

在模板部分（`<BlogListLayout>` 内）添加隐藏的 data 容器：

```astro
<!-- 在 blog/index.astro 模板末尾，</BlogListLayout> 之前 -->
<script type="application/json" id="blog-client-i18n">
  {JSON.stringify({
    emptySearch: {
      en: "No articles found matching your search.",
      zh: "没有找到匹配您搜索的文章。"
    },
    searchPlaceholder: {
      en: "Search articles, tags or descriptions...",
      zh: "搜索文章、标签或描述..."
    }
  })}
</script>
```

JS 部分改为：

```javascript
const clientI18n = JSON.parse(document.getElementById("blog-client-i18n")!.textContent || "{}");
function t(key: string, lang: string): string {
  return clientI18n[key]?.[lang] ?? clientI18n[key]?.en ?? key;
}

// 原 90 行：
searchInput.placeholder = t("searchPlaceholder", lang);

// 原 145-147 行：
emptyEl.innerHTML = `<p class="text-body-large text-secondary">${t("emptySearch", isZh ? "zh" : "en")}</p>`;
```

---

### 4C. 消除重复代码

| 审计编号 | 问题 | 解决方案 |
|----------|------|----------|
| A12-3 | Logo dot 样式 Header/Footer 重复 | 两者统一引用 `--logo-dot-size` 和 `--logo-gradient` |
| A12-4 | 箭头 SVG 出现 2 次 | 已在 Icon 组件化中解决 |
| A12-2 | 容器尺寸 Layout 级重复 | 已在 Phase 3J 中解决 |

**Logo dot 统一（A12-3）**：

在 `tokens/colors.css` 或新文件 `src/styles/components/logo.css` 中定义：

```css
:root {
  --logo-dot-size: 10px;
  --logo-gradient: linear-gradient(
    135deg,
    var(--blog-color-primary),
    var(--blog-color-tertiary)
  );
}
```

Header.astro:171-178 和 Footer.astro:73-82 的 logo-dot 样式都改为：

```css
.logo-dot {
  width: var(--logo-dot-size);
  height: var(--logo-dot-size);
  border-radius: var(--blog-radius-full);
  background: var(--logo-gradient);
}
```

---

## Phase 5：页面级 title/description i18n（A5 类，P2）

### 页面 title 映射

| 审计编号 | 文件 | 行号 | 旧值 | 新值 |
|----------|------|------|------|------|
| A5-1 | `index.astro` | 25 | `title="M3E — Design & Technology Blog"` | 改为从 `translations.ts` 注入 |
| A5-2 | `about.astro` | 9 | `title="About — M3E"` | 已有 key `about.title` |
| A5-3 | `about.astro` | 9 | `description="About the author..."` | 改为 i18n key |

**实现**：在 `HeroLayout` / `PageLayout` / `BlogListLayout` 中，title 和 description 通过 slot 或 prop 传入 `<I18n>` 组件：

```astro
<!-- index.astro 前端 -->
<HeroLayout titleKey="home.heroTitle" descriptionKey="home.heroDesc">
```

Layout 内部：
```astro
---
const { titleKey, descriptionKey } = Astro.props;
---
<BaseLayout title={/* resolve from translations */} description={...}>
```

---

## Phase 6：响应式断点集中管理（A6 类，P1）

| 审计编号 | 文件 | 行号 | 旧值 | 改为（标注语义 Token） |
|----------|------|------|------|------|
| A6-1 | `Header.astro` | 251 | `max-width: 768px` | `/* --blog-bp-md */ 768px` |
| A6-2 | `Footer.astro` | 118 | `max-width: 600px` | `/* --blog-bp-sm */ 600px` |
| A6-3 | `PullQuote.astro` | 87 | `max-width: 640px` | `/* --blog-bp-custom */ 640px` |
| A6-4 | `MDSnackbar.astro` | 76 | `max-width: 480px` | `/* --blog-bp-xs */ 480px` |
| A6-5 | `TableOfContents.astro` | 183 | `max-width: 1024px` | `/* --blog-bp-lg */ 1024px` |
| A6-6 | `SplitLayout.astro` | 67 | `max-width: 1024px` | `/* --blog-bp-lg */ 1024px` |
| A6-7 | `home.css` | 217 | `max-width: 768px` | `/* --blog-bp-md */ 768px` |
| A6-8 | `home.css` | 247 | `max-width: 600px` | `/* --blog-bp-sm */ 600px` |
| A6-9 | `blog.css` | 152 | `max-width: 768px` | `/* --blog-bp-md */ 768px` |
| A6-10 | `blog.css` | 160 | `max-width: 600px` | `/* --blog-bp-sm */ 600px` |
| A6-11 | `global.css` | 210 | `max-width: 768px` | `/* --blog-bp-md */ 768px` |
| A6-11 | `global.css` | 216 | `min-width: 769px` | `/* --blog-bp-md + 1px */ 769px` |
| A6-12 | `layouts.css` | 20 | `max-width: 600px` | `/* --blog-bp-sm */ 600px` |
| A6-13 | `filters.css` | 199 | `max-width: 768px` | `/* --blog-bp-md */ 768px` |
| A6-14 | `editorial.css` | 210 | `max-width: 768px` | `/* --blog-bp-md */ 768px` |

> 由于 CSS `@media` 不支持 `var()`，所以实际数值不变，但统一用注释标注对应 Token，形成文档约束。

---

## Phase 7：i18n 翻译文件补齐（A5 类 + 新增 keys）

### `src/i18n/translations.ts` 需要新增的 keys

```typescript
{
  // 新增：页面 title
  "home.heroTitle": "M3E — Design & Technology Blog",
  "home.heroDesc": "A personal blog exploring the intersection of design, technology, and thoughtful living.",

  // 新增：博客搜索客户端 i18n（供 data 属性桥接使用）
  "blog.clientEmptySearch": "No articles found matching your search.",
  "blog.clientSearchPlaceholder": "Search articles, tags or descriptions...",

  // 新增：日期格式 locale 标记
  "locale.en": "en-US",
  "locale.zh": "zh-CN",
}
```

---

## Phase 8：自动化防线（Stylelint + Pre-commit）

### 8.1 安装

```bash
npm install -D stylelint stylelint-config-standard
```

### 8.2 `.stylelintrc.json`

```json
{
  "extends": ["stylelint-config-standard"],
  "rules": {
    "color-no-hex": [true, {
      "severity": "warning"
    }],
    "declaration-property-value-disallowed-list": {
      "/color|background|border|fill|stroke/": [
        "/^#[0-9a-fA-F]{3,8}$/",
        "/^rgb\\(/",
        "/^hsl\\(/"
      ]
    },
    "number-max-precision": 3
  }
}
```

### 8.3 `.stylelintignore`

```
src/styles/tokens/colors.css
src/styles/tokens/surface.css
src/styles/tokens/brutalist.css
src/styles/themes/dark.css
src/styles/themes/light.css
node_modules/**
dist/**
```

### 8.4 新增 npm script

```json
{
  "scripts": {
    "lint:styles": "stylelint \"src/**/*.css\" \"src/**/*.astro\"",
    "lint:styles:fix": "stylelint --fix \"src/**/*.css\" \"src/**/*.astro\""
  }
}
```

---

## 完整执行顺序总结

```
┌──────────────────────────────────────────────────┐
│ 第 0 步：创建前置依赖文件                          │
│ ├─ src/config/monet.config.ts                    │
│ ├─ src/styles/semantic/breakpoints.css           │
│ ├─ src/styles/components/ (15 个组件 Token 文件)  │
│ ├─ src/components/Icon.astro                     │
│ └─ 更新 src/styles/main.css 导入                 │
├──────────────────────────────────────────────────┤
│ 第 1 步：Phase 1 — P0 立即修复 (6 项)            │
│ ├─ P0-1: BaseLayout theme-color                  │
│ ├─ P0-2: Footer GitHub 链接                      │
│ ├─ P0-3: MonetSwitcher 种子色                    │
│ ├─ P0-4: MonetSwitcher 渐变色                    │
│ ├─ P0-5: Monet 预设去重                          │
│ └─ P0-6: 断点 Token 定义                         │
├──────────────────────────────────────────────────┤
│ 第 2 步：Phase 2 — 组件 Token 提取 (6 个组件)    │
│ ├─ MDButton (5 项替换)                           │
│ ├─ MDBadge (4 项替换)                            │
│ ├─ Chip (6 项替换)                               │
│ ├─ MDSwitch (5 项替换)                           │
│ ├─ TextField (7 项替换)                          │
│ └─ MDSnackbar (5 项替换)                         │
├──────────────────────────────────────────────────┤
│ 第 3 步：Phase 3 — 间距/排版全局替换             │
│ ├─ Header (17 项) + 组件 Token 文件               │
│ ├─ Footer (2 项) + Logo dot 统一                 │
│ ├─ BlogCard (7 项) + locale + emoji 去重         │
│ ├─ SearchBar (2 项)                              │
│ ├─ TableOfContents (4 项)                        │
│ ├─ PullQuote (8 项)                              │
│ ├─ ThemeToggle/LanguageToggle/MonetSwitcher (9 项)│
│ ├─ garden.css (14 项)                            │
│ ├─ 内联 style 属性 (5 处)                        │
│ ├─ page/layout 容器 (4 处)                       │
│ └─ 剩余 CSS 间距 (15 项)                         │
├──────────────────────────────────────────────────┤
│ 第 4 步：Phase 4 — 图标/i18n/去重                │
│ ├─ Icon 组件 + 10 处替换                         │
│ ├─ 客户端 i18n 桥接                              │
│ └─ 重复代码消除 (3 处)                            │
├──────────────────────────────────────────────────┤
│ 第 5 步：Phase 5 — 页面 title i18n               │
│ └─ 3 处页面 title/description                    │
├──────────────────────────────────────────────────┤
│ 第 6 步：Phase 6 — 断点注释标注                   │
│ └─ 15 处 @media 注释                             │
├──────────────────────────────────────────────────┤
│ 第 7 步：Phase 7 — i18n keys 补齐                 │
│ └─ translations.ts 新增 6 个 keys                │
├──────────────────────────────────────────────────┤
│ 第 8 步：Phase 8 — Stylelint + lint-staged       │
│ ├─ 安装 stylelint                                │
│ ├─ 配置 .stylelintrc.json                        │
│ └─ 添加 npm scripts                              │
└──────────────────────────────────────────────────┘
```

---

## 快速参考：Token ↔ 像素值映射表

| 像素值 | 对应 Token | 常见用途 |
|--------|-----------|----------|
| 2px | `--blog-space-0-5` | 微间距、分割线 offset |
| 4px | `--blog-space-1` | 最小间距 |
| 6px | `--blog-space-1-5` | 标签内间距 |
| 8px | `--blog-space-2` | 组件内 gap |
| 10px | *需新增 Token* | logo dot、特殊 padding |
| 12px | `--blog-space-3` | 标准 padding |
| 14px | `--blog-space-3-5` | 中等 padding |
| 16px | `--blog-space-4` | 页面 padding |
| 18px | *需新增 Token* | header border-radius |
| 24px | `--blog-space-6` | 大间距 |
| 32px | `--blog-space-8` | section 间距 |
| 40px | *组件 Token* | 按钮/开关高度 |
| 48px | `--blog-space-12` | 搜索栏/移动 header 高度 |
| 54px | *组件 Token* | header 高度 |
| 56px | `--blog-space-14` | TextField/FAB 高度 |
| 64px | `--blog-space-16` | Surface swatch 高度 |
| 80px | `--blog-space-20` | Avatar 尺寸 |
| 800px | `.container-narrow` | 窄内容宽度 |
| 980px | *组件 Token* | Header 最大宽度 |
| 1200px | `.container-wide` | 宽内容宽度 |

---

*编写时间: 2026-06-01 | 基于 `HARDCODING_AUDIT.md` 全部 207 条发现逐项映射*  
*每个可替换项标注了审计编号（A1-A12），确保从审计到执行的全链路可追溯*
