# 当前项目排版实现全景报告
# Comprehensive Typography Implementation Report

> 调研日期：2026-06-03
> 项目：apple_m3e_blog（Apple News 风格 × Material 3 Expressive）
> 覆盖范围：所有 CSS Token 定义、全局样式、组件样式、Astro 布局中的排版应用

---

## 一、排版 Token 架构现状

### 1.1 Primitive Tokens（基础原始层）

**文件**：`packages/framework/src/styles/tokens/typography.css`（第 1–223 行）

**字体族 Token**（第 7–27 行）：

```css
:root {
  /* Sans-serif 系统栈（Primive） */
  --blog-font-sans: -apple-system, BlinkMacSystemFont, "Google Sans Flex",
    "Segoe UI", "Noto Sans JP", "Noto Sans SC", "Noto Sans TC",
    system-ui, sans-serif;

  /* Serif 字体栈（Primive） */
  --blog-font-serif: "New York", "Iowan Old Style", "Noto Serif JP",
    "Noto Serif SC", "Noto Serif TC", serif;

  /* Monospace 字体栈（Primive） */
  --blog-font-mono: "SF Mono", "Google Sans Mono", "JetBrains Mono",
    "Noto Sans Mono", "Cascadia Code", "Fira Code", monospace;
}
```

**字重 Token**（第 29–42 行）：

```css
:root {
  --blog-font-weight-thin: 100;
  --blog-font-weight-light: 300;
  --blog-font-weight-regular: 400;
  --blog-font-weight-medium: 500;
  --blog-font-weight-semibold: 600;
  --blog-font-weight-bold: 700;
  --blog-font-weight-heavy: 800;
}
```

**Type Scale 原始值**（第 44–92 行）：

```css
:root {
  /* Display 层级原始值 */
  --blog-typescale-display-large-size: clamp(3rem, 6vw, 5rem);
  --blog-typescale-display-large-weight: var(-blog-font-weight-bold); /* ← 第29行有BUG */
  --blog-typescale-display-large-tracking: -0.025em;

  --blog-typescale-display-medium-size: clamp(2.5rem, 5vw, 4rem);
  --blog-typescale-display-medium-weight: var(--blog-font-weight-bold);
  --blog-typescale-display-medium-tracking: -0.022em;

  /* Headline / Title / Body / Label / Kicker / Deck / Code 各层级均有定义 */
}
```

**排版间距 Token**（第 157–177 行）：

```css
:root {
  --blog-prose-gap-paragraph: var(--blog-space-4);
  --blog-prose-gap-block: var(--blog-space-6);
  --blog-measure-narrow: 45ch;
  --blog-measure-normal: 65ch;
  --blog-measure-wide: 80ch;
}
```

**注意事项**：

编号列表版：
1. 第 29 行存在 bug：`var(-blog-font-weight-bold)` 缺少第二个短横线，应为 `var(--blog-font-weight-bold)`，会导致 display-large 的字重 token 失效
2. `tracking` 一词来自 Apple HIG 术语，与 Material Design 的 `letter-spacing` 不同，项目内部需保持一致
3. Primitive Token 目前直接在 Semantic Token 中通过 `var()` 引用，符合规范，但组件不应直接使用 Primitive Token

无编号版：
- 第 29 行存在 bug：`var(-blog-font-weight-bold)` 缺少第二个短横线，应为 `var(--blog-font-weight-bold)`，会导致 display-large 的字重 token 失效
- `tracking` 一词来自 Apple HIG 术语，与 Material Design 的 `letter-spacing` 不同，项目内部需保持一致
- Primitive Token 目前直接在 Semantic Token 中通过 `var()` 引用，符合规范，但组件不应直接使用 Primitive Token

---

### 1.2 Semantic Tokens（语义化层）

**Composite Shorthand**（第 94–146 行）：

```css
:root {
  /* Composite shorthand —— 方便一次性应用 */
  --blog-typescale-display-large:
    var(--blog-typescale-display-large-weight)
    var(--blog-typescale-display-large-size)/var(--blog-typescale-display-large-leading)
    var(--blog-font-sans);

  --blog-typescale-body-large:
    var(--blog-typescale-body-large-weight)
    var(--blog-typescale-body-large-size)/var(--blog-typescale-body-large-leading)
    var(--blog-font-sans);

  /* 所有 Type Scale 层级均有对应的 composite shorthand */
}
```

**注意事项**：

编号列表版：
1. Composite shorthand 虽然方便，但在需要单独覆盖某个属性（如仅改变 `font-weight`）时会失效，建议同时保留拆分属性和 composite 属性
2. 当前 `body-large-size` 是固定值 `1.125rem`，而 `display-large-size` 是 `clamp()`，这种混合使用是可以的，但建议统一决策

无编号版：
- Composite shorthand 虽然方便，但在需要单独覆盖某个属性（如仅改变 `font-weight`）时会失效，建议同时保留拆分属性和 composite 属性
- 当前 `body-large-size` 是固定值 `1.125rem`，而 `display-large-size` 是 `clamp()`，这种混合使用是可以的，但建议统一决策

---

### 1.3 Component Tokens（组件级层）

当前项目**尚未显式定义 Component Token**，而是通过 `:is(.post-content, .about-text)` 选择器直接在 `prose.css` 中应用 Semantic Token。这是一种有效的组件作用域方式，但若页面类型增多，建议显式定义 Component Token。

---

## 二、排版 Token 在各文件中的实际应用

### 2.1 全局基础排版（`reset.css` + `global.css`）

**`reset.css`**（第 14–49 行）：

```css
html {
  -webkit-text-size-adjust: 100%;
  text-rendering: optimizeLegibility;
  font-size-adjust: 0.535; /* Google Sans Flex x-height 对齐 */
  color-scheme: light dark;
}

body {
  font-family: var(--blog-font-sans);
  font-size: var(--blog-typescale-body-medium-size);
  line-height: var(--blog-typescale-body-medium-leading);
  font-weight: var(--blog-typescale-body-medium-weight);
  letter-spacing: var(--blog-typescale-body-medium-tracking);
  color: var(--blog-color-text-primary);
  background-color: var(--blog-color-background);
}
```

**`global.css`**（第 8–88 行）定义了排版工具类：

```css
.text-display-large  { font: var(--blog-typescale-display-large); ... }
.text-display-medium { font: var(--blog-typescale-display-medium); ... }
.text-headline-large { font: var(--blog-typescale-headline-large); ... }
/* ... 所有 Type Scale 层级均有对应的工具类 ... */
.text-kicker         { font: var(--blog-typescale-kicker); ... }
.text-deck           { font: var(--blog-typescale-deck); ... }
```

**注意事项**：

编号列表版：
1. `body` 直接使用 `--blog-typescale-body-medium-*` 语义 token，这是正确的做法
2. `font-size-adjust: 0.535` 是为了让 fallback 字体（Segoe UI 等）的 x-height 与 Google Sans Flex 对齐，减少 FOUT 的视觉影响，这是一个很细致的处理
3. 工具类（`.text-*`）的定义是正确的，但需要确保这些类在 Astro 模板中被正确使用

无编号版：
- `body` 直接使用 `--blog-typescale-body-medium-*` 语义 token，这是正确的做法
- `font-size-adjust: 0.535` 是为了让 fallback 字体（Segoe UI 等）的 x-height 与 Google Sans Flex 对齐，减少 FOUT 的视觉影响，这是一个很细致的处理
- 工具类（`.text-*`）的定义是正确的，但需要确保这些类在 Astro 模板中被正确使用

---

### 2.2 Prose 排版（`prose.css`）

**文件**：`packages/framework/src/styles/base/prose.css`

**`:is(.post-content, .about-text)` 选择器**（第 8–11 行）：

```css
:is(.post-content, .about-text) {
  font: var(--blog-typescale-body-large);
  color: var(--blog-color-text-primary);
}
```

**标题排版**（第 14–28 行）：

```css
:is(.post-content, .about-text) h2 {
  font: var(--blog-typescale-headline-medium);
  letter-spacing: var(--blog-typescale-headline-medium-tracking);
  margin-top: var(--blog-space-10);
  margin-bottom: var(--blog-space-4);
}

:is(.post-content, .about-text) h3 {
  font: var(--blog-typescale-headline-small);
  letter-spacing: var(--blog-typescale-headline-small-tracking);
  margin-top: var(--blog-space-8);
  margin-bottom: var(--blog-space-3);
}
```

**段落与列表**（第 31–43 行）：

```css
:is(.post-content, .about-text) p {
  margin-bottom: var(--blog-prose-gap-paragraph);
}

:is(.post-content, .about-text) ul,
:is(.post-content, .about-text) ol {
  padding-left: var(--blog-space-6);
  margin-bottom: var(--blog-prose-gap-paragraph);
}
```

**注意事项**：

编号列表版：
1. `--blog-measure-normal: 65ch` 已在 `typography.css` 中定义，但 `prose.css` 中**没有**将 `.post-content` 的 `max-width` 设置为该 token，导致 Measure Token 定义了却未生效
2. `blockquote`、`pre`、`img` 等块级元素均使用了 `--blog-prose-gap-block`，这是正确的
3. `:is(.post-content, .about-text)` 选择器是共享排版样式的有效方式，但若页面类型增多，建议使用 Component Token

无编号版：
- `--blog-measure-normal: 65ch` 已在 `typography.css` 中定义，但 `prose.css` 中**没有**将 `.post-content` 的 `max-width` 设置为该 token，导致 Measure Token 定义了却未生效
- `blockquote`、`pre`、`img` 等块级元素均使用了 `--blog-prose-gap-block`，这是正确的
- `:is(.post-content, .about-text)` 选择器是共享排版样式的有效方式，但若页面类型增多，建议使用 Component Token

---

### 2.3 组件级排版应用

#### BlogCard 组件（`BlogCard.astro`）

**Kicker**（第 40 行）：
```html
<p class="blog-card-kicker text-kicker">{displayTags[0]}</p>
```

**标题**（第 58 行）：
```html
<h2 class="blog-card-title text-headline-medium">{title}</h2>
```

**描述**（第 60 行）：
```html
<p class="blog-card-desc text-body-medium text-secondary">{description}</p>
```

**日期**（第 65 行）：
```html
<time datetime={publishedAt.toISOString()} class="text-label-medium text-tertiary">
```

**语言标签**（第 208 行）：
```css
.blog-card-lang {
  font-size: var(--blog-typescale-label-small-size);
  font-weight: 700;
  letter-spacing: var(--blog-typescale-label-small-tracking);
  text-transform: uppercase;
}
```

#### HomePage 组件（`HomePage.astro`）

**Hero Kicker**（第 57 行）：
```html
<p class="hero-kicker text-kicker" style="display: flex; ...">
```

**Hero Headline**（第 61 行）：
```html
<h1 class="hero-headline text-display-large">
```

**Hero Deck**（第 66 行）：
```html
<p class="hero-deck text-deck">
```

**Side Story Title**（第 85 行）：
```html
<h2 class="hero-side-title text-headline-medium">
```

**Side Story Description**（第 90 行）：
```html
<p class="hero-side-desc text-body-medium text-secondary">
```

#### BlogPostLayout 组件（`BlogPostLayout.astro`）

**文章标题**（第 74 行）：
```html
<h1 class="post-title text-display-small">{title}</h1>
```

**文章副标题**（第 75 行）：
```html
<p class="post-subtitle text-body-large text-secondary">{description}</p>
```

**发布日期**（第 50 行）：
```html
<time datetime={publishedAt.toISOString()} class="text-label-large text-tertiary">
```

---

### 2.4 断点 Token 化（`breakpoints.css`）

**文件**：`packages/framework/src/styles/semantic/breakpoints.css`

```css
:root {
  --blog-bp-xs: 480px;
  --blog-bp-sm: 600px;
  --blog-bp-md: 768px;
  --blog-bp-lg: 1024px;
}
```

**注意事项**：

编号列表版：
1. 断点 token 已定义，但在 `home.css`、`blog.css`、`prose.css` 等文件中，媒体查询仍使用硬编码值（如 `@media (max-width: 768px)`），未使用 `--blog-bp-md` token
2. 这是因为 CSS 媒体查询中的 `max-width` / `min-width` 目前**不支持** CSS 自定义属性（浏览器限制），需要通过 Sass/Less 变量或 PostCSS 插件才能使用 token

无编号版：
- 断点 token 已定义，但在 `home.css`、`blog.css`、`prose.css` 等文件中，媒体查询仍使用硬编码值（如 `@media (max-width: 768px)`），未使用 `--blog-bp-md` token
- 这是因为 CSS 媒体查询中的 `max-width` / `min-width` 目前**不支持** CSS 自定义属性（浏览器限制），需要通过 Sass/Less 变量或 PostCSS 插件才能使用 token

---

## 三、字体加载策略

### 3.1 Google Fonts 加载（`BaseLayout.astro` 第 54–62 行）

```html
<!-- Google Fonts loaded non-render-blocking via media-swap trick.
     font-display=swap in URL handles FOUT: fallback fonts render immediately,
     web fonts swap in once loaded. -->
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@100..900&family=Noto+Sans+JP:wght@100..900&family=Noto+Sans+SC:wght@100..900&family=Noto+Sans+TC:wght@100..900&family=Noto+Serif+JP:wght@100..900&family=Noto+Serif+SC:wght@100..900&family=Noto+Serif+TC:wght@100..900&display=swap"
  media="print"
  onload="this.media='all';this.onload=null"
/>
```

**字体列表**（从 URL 解析）：

编号列表版：
1. **Google Sans Flex**（可变字体，字重 100–900）— 主要无衬线字体
2. **Noto Sans JP**（日文无衬线，可变字体）— 日文用户
3. **Noto Sans SC**（简体中文无衬线，可变字体）— 中文用户
4. **Noto Sans TC**（繁体中文无衬线，可变字体）— 繁体中文用户
5. **Noto Serif JP**（日文衬线，可变字体）— 衬线主题备用
6. **Noto Serif SC**（简体中文衬线，可变字体）— 衬线主题备用
7. **Noto Serif TC**（繁体中文衬线，可变字体）— 衬线主题备用

无编号版：
- **Google Sans Flex**（可变字体，字重 100–900）— 主要无衬线字体
- **Noto Sans JP**（日文无衬线，可变字体）— 日文用户
- **Noto Sans SC**（简体中文无衬线，可变字体）— 中文用户
- **Noto Sans TC**（繁体中文无衬线，可变字体）— 繁体中文用户
- **Noto Serif JP**（日文衬线，可变字体）— 衬线主题备用
- **Noto Serif SC**（简体中文衬线，可变字体）— 衬线主题备用
- **Noto Serif TC**（繁体中文衬线，可变字体）— 衬线主题备用

**注意事项**：

编号列表版：
1. 使用 `media="print"` + `onload` 技巧实现非阻塞加载，这是正确的
2. URL 中已包含 `display=swap`，确保 fallback 字体立即渲染
3. 中文字体文件极大（Noto Sans SC 可变字体约 2–3MB），会影响 LCP，建议通过 `unicode-range` 拆分子集
4. Google Sans Flex 是 Google 品牌字体，授权需确认（目前通过 Google Fonts API 加载是合规的）

无编号版：
- 使用 `media="print"` + `onload` 技巧实现非阻塞加载，这是正确的
- URL 中已包含 `display=swap`，确保 fallback 字体立即渲染
- 中文字体文件极大（Noto Sans SC 可变字体约 2–3MB），会影响 LCP，建议通过 `unicode-range` 拆分子集
- Google Sans Flex 是 Google 品牌字体，授权需确认（目前通过 Google Fonts API 加载是合规的）

---

## 四、当前排版体系的完整层级结构

以下是当前项目排版 token 从定义到应用的完整链路：

```
【Primitives】 定义于 typography.css
  ├── --blog-font-sans / serif / mono
  ├── --blog-font-weight-*
  └── --blog-typescale-*-size/leading/weight/tracking（原始值）

【Semantic】 定义于 typography.css（composite shorthand）
  ├── --blog-typescale-display-*
  ├── --blog-typescale-headline-*
  ├── --blog-typescale-body-*
  ├── --blog-typescale-label-*
  ├── --blog-typescale-kicker / deck / code
  └── --blog-measure-* / --blog-prose-gap-*

【工具类】 定义于 global.css
  ├── .text-display-* / .text-headline-* / .text-body-*
  ├── .text-label-* / .text-kicker / .text-deck
  └── .measure-narrow / .measure-normal / .measure-wide

【组件应用】 定义于各 .astro 文件
  ├── HomePage.astro → .text-display-large / .text-kicker / .text-deck
  ├── BlogPostLayout.astro → .text-display-small / .text-body-large
  ├── BlogCard.astro → .text-headline-medium / .text-body-medium
  └── prose.css → :is(.post-content, .about-text) 直接应用 token

【主题覆盖】 目前仅支持颜色主题
  ├── data-theme="light" → light.css
  ├── data-theme="dark" → dark.css
  └── data-monet="..." → monet/*.css（动态颜色）
```

**缺失部分**：

编号列表版：
1. **排版主题切换**：目前没有 `data-typography` 属性，无法让用户选择排版主题
2. **Component Token 显式定义**：目前通过 `:is(.post-content, .about-text)` 隐式应用，建议显式定义
3. **Measure Token 应用**：`--blog-measure-normal` 定义了但未应用到 `.post-content`
4. **断点 Token 在媒体查询中的使用**：由于 CSS 限制，目前无法在 `@media` 中使用自定义属性

无编号版：
- **排版主题切换**：目前没有 `data-typography` 属性，无法让用户选择排版主题
- **Component Token 显式定义**：目前通过 `:is(.post-content, .about-text)` 隐式应用，建议显式定义
- **Measure Token 应用**：`--blog-measure-normal` 定义了但未应用到 `.post-content`
- **断点 Token 在媒体查询中的使用**：由于 CSS 限制，目前无法在 `@media` 中使用自定义属性

---

## 五、关键 Bug 与遗漏清单

以下是当前项目中与排版相关的具体 bug 和遗漏：

### 5.1 Bug 清单

编号列表版：
1. **`typography.css` 第 29 行**：`var(-blog-font-weight-bold)` 缺少第二个短横线，应为 `var(--blog-font-weight-bold)`，导致 `--blog-typescale-display-large-weight` 取值失败，display-large 字重会回退到 `initial`（通常是 400）
2. **`main.css` 第 3 行**：注释中写的是 `Layers: Tokens → Theme → Tailwind/daisyUI → Base`，但实际 import 顺序是 Token → Theme → Tailwind → Reset → Base，顺序描述不准确（不影响功能，但影响可维护性）

无编号版：
- **`typography.css` 第 29 行**：`var(-blog-font-weight-bold)` 缺少第二个短横线，应为 `var(--blog-font-weight-bold)`，导致 `--blog-typescale-display-large-weight` 取值失败，display-large 字重会回退到 `initial`（通常是 400）
- **`main.css` 第 3 行**：注释中写的是 `Layers: Tokens → Theme → Tailwind/daisyUI → Base`，但实际 import 顺序是 Token → Theme → Tailwind → Reset → Base，顺序描述不准确（不影响功能，但影响可维护性）

### 5.2 遗漏清单

编号列表版：
1. **`prose.css` 中未应用 Measure Token**：`.post-content` 应有 `max-width: var(--blog-measure-normal)` 以限制行长，提升可读性
2. **`blog.css` 中 `.filter-chip` 硬编码了 `font-family`**（第 54 行）：`font-family: var(--blog-font-sans);` 应该使用工具类或在 `global.css` 中统一设置，不应在组件 CSS 中重复定义
3. **`home.css` 中 `.hero-side-desc` 使用了 `-webkit-line-clamp: 2`**（第 99–104 行），但未设置 `line-height`，可能导致截断行高不一致
4. **没有排版主题切换机制**：这是用户本次需求的核心目标，需要在 `data-typography` 属性下定义多套排版 token 值

无编号版：
- **`prose.css` 中未应用 Measure Token**：`.post-content` 应有 `max-width: var(--blog-measure-normal)` 以限制行长，提升可读性
- **`blog.css` 中 `.filter-chip` 硬编码了 `font-family`**（第 54 行）：`font-family: var(--blog-font-sans);` 应该使用工具类或在 `global.css` 中统一设置，不应在组件 CSS 中重复定义
- **`home.css` 中 `.hero-side-desc` 使用了 `-webkit-line-clamp: 2`**（第 99–104 行），但未设置 `line-height`，可能导致截断行高不一致
- **没有排版主题切换机制**：这是用户本次需求的核心目标，需要在 `data-typography` 属性下定义多套排版 token 值

---

## 六、实施排版主题切换的准备清单

基于以上调研，实施"用户自选字体排版主题"需要完成以下步骤：

### 6.1 修复现有 Bug

编号列表版：
1. 修复 `typography.css` 第 29 行的 `var()` 语法错误
2. 在 `prose.css` 中为 `.post-content` 添加 `max-width: var(--blog-measure-normal)`

无编号版：
- 修复 `typography.css` 第 29 行的 `var()` 语法错误
- 在 `prose.css` 中为 `.post-content` 添加 `max-width: var(--blog-measure-normal)`

### 6.2 创建排版主题文件

创建 `typography-themes.css`，包含：

```css
/* 默认排版主题（Apple News 风格） */
:root {
  --blog-typescale-body-large-size: 1.125rem;
  --blog-typescale-body-large-leading: 1.7;
  /* ... 其他 Semantic Token 默认值 ... */
}

/* 紧凑排版主题 */
:root[data-typography="compact"] {
  --blog-typescale-body-large-size: 1rem;
  --blog-typescale-body-large-leading: 1.5;
}

/* 宽松排版主题 */
:root[data-typography="relaxed"] {
  --blog-typescale-body-large-size: 1.25rem;
  --blog-typescale-body-large-leading: 1.9;
}

/* 衬线排版主题 */
:root[data-typography="serif"] {
  --blog-font-sans: var(--blog-font-serif);
}
```

### 6.3 添加排版主题切换器

复用已有的 `ThemeToggle.astro` 组件的交互模式，创建一个新的 `TypographyToggle.astro` 组件，或将排版主题选择集成到现有设置面板中。

### 6.4 持久化用户选择

使用 `localStorage` 存储用户的排版主题选择，在页面加载时恢复：

```javascript
function setTypographyTheme(theme) {
  document.documentElement.setAttribute('data-typography', theme);
  localStorage.setItem('typography-theme', theme);
}

const saved = localStorage.getItem('typography-theme');
if (saved) {
  document.documentElement.setAttribute('data-typography', saved);
}
```

---

## 七、总结

当前项目的排版 token 化已达到**中高级成熟度**：

编号列表版：
1. **架构正确**：Primitive → Semantic 两层已建立，Composite Shorthand 提高了使用便利性
2. **覆盖全面**：从全局 `body` 到 `.post-content` 到组件，均有对应的 token 应用
3. **细节到位**：`font-size-adjust`、FLOUT 处理、`prefers-reduced-motion` 支持均有体现
4. **存在 Bug**：第 29 行 `var()` 语法错误需要立即修复
5. **存在遗漏**：Measure Token 未应用、没有排版主题切换机制
6. **下一步**：修复 Bug → 创建排版主题文件 → 添加排版主题切换器 → 持久化用户选择

无编号版：
- **架构正确**：Primitive → Semantic 两层已建立，Composite Shorthand 提高了使用便利性
- **覆盖全面**：从全局 `body` 到 `.post-content` 到组件，均有对应的 token 应用
- **细节到位**：`font-size-adjust`、FLOUT 处理、`prefers-reduced-motion` 支持均有体现
- **存在 Bug**：第 29 行 `var()` 语法错误需要立即修复
- **存在遗漏**：Measure Token 未应用、没有排版主题切换机制
- **下一步**：修复 Bug → 创建排版主题文件 → 添加排版主题切换器 → 持久化用户选择

---

*本报告由工程工作流教练协助调研并整理，覆盖项目所有排版相关文件的详细分析，包括 Token 架构、实际应用、Bug 清单、遗漏清单及实施建议。*
