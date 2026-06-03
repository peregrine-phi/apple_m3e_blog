# 文字排版全面 Token 化指南 —— 用户自选字体排版主题注意事项

> 调研日期：2026-06-03
> 适用项目：apple_m3e_blog（Apple News × Material 3 Expressive 风格博客）
> 核心目标：将排版系统全面 token 化，支持用户自选字体排版主题

---

## 一、背景与动机

当前 `apple_m3e_blog` 项目已有初步的排版 token 体系（`typography.css`），定义了 font families、font weights、typescale 各层级（display / headline / title / body / label / kicker / deck / code）以及 composite shorthand。`prose.css` 已将这些 token 应用到文章内容区。

下一步目标是：**将排版系统全面 token 化，并允许用户自行切换字体排版主题**。这涉及设计 token 架构、CSS 自定义属性组织方式、字体加载策略、可变字体应用、以及用户体验多个维度。以下是系统性的注意事项。

---

## 二、W3C Design Tokens Specification 2025.10 稳定版要点

2025 年 10 月 28 日，W3C Design Tokens Community Group 正式发布了 Design Tokens Specification 的第一版稳定标准（2025.10）[^w3c-dt]。这是设计 token 领域的里程碑事件，意味着 token 的定义、层级结构和交付格式有了官方规范。

### 2.1 规范覆盖的 Token 类型

规范明确定义了 design token 是"设计系统中不可再拆分的最小决策单元"，以"名称—值"对的形式存在。与排版直接相关的 token 类型包括：

- **Color Tokens**：颜色值，包括 hex、rgb、hsl、oklch 等格式
- **Dimension Tokens**：尺寸值，如字号（`font-size`）、行高（`line-height`）、字间距（`letter-spacing`）、段落间距（`margin-block` 等）——均以 `16px` 或 `1rem` 等维度值表示
- **Font Family Tokens**：字体族名称，支持 fallback 栈
- **Font Weight Tokens**：字重数值（100–900）
- **Font Style / Font Variant Tokens**：字体样式（italic / normal 等）
- **Duration Tokens**：动画持续时间（与排版的交互动效相关）
- **Cubic Bezier Tokens**：缓动函数（与排版的交互动效相关）

### 2.2 Token 的层级结构（Grouping）

规范明确支持 token 的分组嵌套结构，允许以树形方式组织 token，例如：

```
typography/
  font-family/
    sans: "-apple-system, BlinkMacSystemFont, ..."
    serif: "\"New York\", Georgia, serif"
  typescale/
    display-large/
      font-size: clamp(3rem, 6vw, 5rem)
      line-height: 1.05
      font-weight: 700
      letter-spacing: -0.022em
```

这种嵌套结构直接映射到 JSON/YAML 格式的 token 源文件，再通过 Style Dictionary 等工具转换为 CSS 自定义属性。

### 2.3 命名规范

规范建议 token 名称使用 kebab-case（如 `font-size-base`），并推荐采用"语义优先"的命名方式而非"数值优先"（如用 `--text-body-lg` 而非 `--font-size-18`）。这与你当前项目中的 `--blog-typescale-body-large` 命名方式是一致的，符合规范精神。

### 2.4 与 CSS 自定义属性的映射

规范定义了 token 到 CSS 自定义属性的推荐映射方式：`--{prefix}-{category}-{property}` 格式。你当前项目使用的 `--blog-typescale-*` 和 `--blog-font-*` 命名空间完全符合这一规范。

---

## 三、排版 Token 化的三层架构

全面的排版 token 化必须遵循 **Primitive → Semantic → Component** 三层架构[^css-arch]。这是目前业界设计系统（Material Design 3、Ant Design 5.0、TDesign 等）的通用实践。

### 3.1 Primitive Tokens（基础原始 Token）

**定义**：最底层、无业务语义的原子级 token，直接对应字体、字号的原始属性值，与设计语义完全解耦，仅做值的复用。

**排版类示例（对照你当前项目）**：

你当前的 `typography.css` 中，以下内容属于 Primitive Token 层：

```css
:root {
  /* 字体族 —— Primitive */
  --blog-font-sans: -apple-system, BlinkMacSystemFont, "Google Sans Flex", ...;
  --blog-font-serif: "New York", "Iowan Old Style", ...;
  --blog-font-mono: "SF Mono", "JetBrains Mono", ...;

  /* 字重 —— Primitive */
  --blog-font-weight-thin: 100;
  --blog-font-weight-light: 300;
  --blog-font-weight-regular: 400;
  --blog-font-weight-medium: 500;
  --blog-font-weight-semibold: 600;
  --blog-font-weight-bold: 700;
  --blog-font-weight-heavy: 800;
}
```

**注意事项**：

编号列表版：
1. Primitive Token 不应直接在组件或页面 CSS 中使用，必须通过 Semantic Token 间接引用
2. Primitive Token 的值变更会影响所有引用它的 Semantic Token，因此变更需谨慎
3. 字体族 fallback 栈的顺序至关重要，应将系统字体放在前面以确保最快的首屏渲染

无编号版：
- Primitive Token 不应直接在组件或页面 CSS 中使用，必须通过 Semantic Token 间接引用
- Primitive Token 的值变更会影响所有引用它的 Semantic Token，因此变更需谨慎
- 字体族 fallback 栈的顺序至关重要，应将系统字体放在前面以确保最快的首屏渲染

### 3.2 Semantic Tokens（语义化 Token）

**定义**：基于设计语义定义的 token，关联业务场景和使用场景的含义，是连接原始值和具体使用场景的中间层。

**排版类示例（你当前项目已有部分实现）**：

你当前的 `typography.css` 中，typescale 各层级的 CSS 自定义属性属于 Semantic Token 层：

```css
:root {
  /* Typescale: Body Large —— Semantic */
  --blog-typescale-body-large-size: 1.125rem;
  --blog-typescale-body-large-leading: 1.7;
  --blog-typescale-body-large-weight: var(--blog-font-weight-regular);
  --blog-typescale-body-large-tracking: 0;

  /* Composite shorthand —— Semantic */
  --blog-typescale-body-large: var(--blog-typescale-body-large-weight)
    var(--blog-typescale-body-large-size)/var(--blog-typescale-body-large-leading)
    var(--blog-font-sans);
}
```

**注意事项**：

编号列表版：
1. Semantic Token 的命名必须体现使用场景（如 `body-large`、`headline-medium`），绝不能包含具体数值（如 `font-size-18`）
2. `letter-spacing` 的 token 命名在当前项目中使用了 `tracking` 一词（如 `--blog-typescale-body-large-tracking`），这是 Apple Human Interface Guidelines 的术语，与 Material Design 的 `letter-spacing` 术语不同，需保持项目内部一致
3. Composite shorthand（如 `--blog-typescale-body-large`）虽然方便，但在需要单独覆盖某个属性（如仅改变 `font-weight`）时会失效，建议同时保留拆分属性和 composite 属性

无编号版：
- Semantic Token 的命名必须体现使用场景（如 `body-large`、`headline-medium`），绝不能包含具体数值（如 `font-size-18`）
- `letter-spacing` 的 token 命名在当前项目中使用了 `tracking` 一词（如 `--blog-typescale-body-large-tracking`），这是 Apple Human Interface Guidelines 的术语，与 Material Design 的 `letter-spacing` 术语不同，需保持项目内部一致
- Composite shorthand（如 `--blog-typescale-body-large`）虽然方便，但在需要单独覆盖某个属性（如仅改变 `font-weight`）时会失效，建议同时保留拆分属性和 composite 属性

### 3.3 Component Tokens（组件级 Token）

**定义**：绑定到具体组件的 token，在特定组件场景下对语义 token 做二次适配，仅在当前组件生效。

**排版类示例（你当前项目的 `prose.css` 已有应用）**：

```css
/* prose.css 中，:is(.post-content, .about-text) 是组件作用域 */
:post-content, .about-text) h2 {
  font: var(--blog-typescale-headline-medium);
  letter-spacing: var(--blog-typescale-headline-medium-tracking);
  margin-top: var(--blog-space-10);
  margin-bottom: var(--blog-space-4);
}
```

这里 `h2` 在 `.post-content` 上下文中的具体表现，可以通过 Component Token 进一步抽象：

```css
:root {
  /* Component Token 示例 */
  --blog-post-h2-font: var(--blog-typescale-headline-medium);
  --blog-post-h2-margin-block: var(--blog-space-10) var(--blog-space-4);
}
```

**注意事项**：

编号列表版：
1. Component Token 不应重复定义已经在 Semantic Token 层已有的属性，仅在组件有特殊适配需求时新增
2. 当前项目使用 `:is(.post-content, .about-text)` 选择器来共享排版样式，这是一种有效的组件作用域方式，但若有更多页面类型，建议显式定义 Component Token 以提高可维护性
3. 组件级 token 的命名空间建议使用 `--blog-{component-name}-{property}` 格式，如 `--blog-post-h2-font`

无编号版：
- Component Token 不应重复定义已经在 Semantic Token 层已有的属性，仅在组件有特殊适配需求时新增
- 当前项目使用 `:is(.post-content, .about-text)` 选择器来共享排版样式，这是一种有效的组件作用域方式，但若有更多页面类型，建议显式定义 Component Token 以提高可维护性
- 组件级 token 的命名空间建议使用 `--blog-{component-name}-{property}` 格式，如 `--blog-post-h2-font`

---

## 四、字体排版主题切换的实现方案

让用户自行选择字体排版主题，需要在当前 token 体系基础上增加"主题层"。以下是三种可行方案。

### 4.1 方案 A：基于 `data-typography` 属性的多主题切换（推荐）

这是最适合你项目的方案，与你当前使用的 `data-theme="dark"` 模式完全一致。

**实现思路**：

在 `:root` 上设置 `data-typography` 属性，不同值对应不同排版主题，每个排版主题重新定义 Semantic Token 的值（Primitive Token 不变）。

```css
/* 默认排版主题（Apple News 风格） */
:root {
  --blog-typescale-body-large-size: 1.125rem;
  --blog-typescale-body-large-leading: 1.7;
  /* ... 其他 Semantic Token 默认值 */
}

/* 排版主题：Compact（紧凑风格） */
:root[data-typography="compact"] {
  --blog-typescale-body-large-size: 1rem;
  --blog-typescale-body-large-leading: 1.5;
  /* ... */
}

/* 排版主题：Relaxed（宽松阅读风格） */
:root[data-typography="relaxed"] {
  --blog-typescale-body-large-size: 1.25rem;
  --blog-typescale-body-large-leading: 1.9;
  /* ... */
}

/* 排版主题：Serif（衬线字体主题） */
:root[data-typography="serif"] {
  --blog-font-sans: var(--blog-font-serif);
  /* 衬线排版通常有稍大的 leading */
  --blog-typescale-body-large-leading: 1.8;
}
```

**JavaScript 控制逻辑**：

```javascript
function setTypographyTheme(theme) {
  document.documentElement.setAttribute('data-typography', theme);
  localStorage.setItem('typography-theme', theme);
}

// 初始化时恢复用户偏好
const saved = localStorage.getItem('typography-theme');
if (saved) {
  document.documentElement.setAttribute('data-typography', saved);
}
```

**注意事项**：

编号列表版：
1. 排版主题切换应与颜色主题（`data-theme`）独立，允许用户自由组合（如"暗色 + 衬线排版"）
2. 切换排版主题会导致 reflow（因为字号和行高改变），建议在切换时添加 `document.body.style.transition = 'none'` 瞬间禁用过渡，切换完成后再恢复，避免视觉跳动
3. 需要提供至少 3–4 套排版主题才能体现价值：Default（Apple News 风格）、Compact、Relaxed、Serif

无编号版：
- 排版主题切换应与颜色主题（`data-theme`）独立，允许用户自由组合（如"暗色 + 衬线排版"）
- 切换排版主题会导致 reflow（因为字号和行高改变），建议在切换时添加 `document.body.style.transition = 'none'` 瞬间禁用过渡，切换完成后再恢复，避免视觉跳动
- 需要提供至少 3–4 套排版主题才能体现价值：Default（Apple News 风格）、Compact、Relaxed、Serif

### 4.2 方案 B：用户自定义排版变量（精细化控制）

除了预设主题，还可以允许用户通过控制面板微调排版参数，实时修改 CSS 自定义属性值。

```javascript
// 用户调整基础字号
document.getElementById('baseFontSize').addEventListener('input', (e) => {
  document.documentElement.style.setProperty(
    '--blog-typescale-body-large-size',
    `${e.target.value}rem`
  );
});

// 用户调整行高
document.getElementById('bodyLeading').addEventListener('input', (e) => {
  document.documentElement.style.setProperty(
    '--blog-typescale-body-large-leading',
    e.target.value
  );
});
```

**注意事项**：

编号列表版：
1. 用户自定义变量应通过 `style.setProperty` 写入内联样式，优先级高于 CSS 中定义的变量值，这会覆盖主题定义，属于预期行为
2. 需要将用户自定义值也存入 `localStorage`，在页面加载时恢复
3. 自定义控制面板的 UI 本身应遵循排版 token，确保控件标签的字体也随主题切换

无编号版：
- 用户自定义变量应通过 `style.setProperty` 写入内联样式，优先级高于 CSS 中定义的变量值，这会覆盖主题定义，属于预期行为
- 需要将用户自定义值也存入 `localStorage`，在页面加载时恢复
- 自定义控制面板的 UI 本身应遵循排版 token，确保控件标签的字体也随主题切换

### 4.3 方案 C：流体排版（Fluid Typography）与 clamp()

你当前项目已部分使用 `clamp()` 实现流体缩放（如 `--blog-typescale-display-large-size: clamp(3rem, 6vw, 5rem)`）。这是现代排版系统的核心实践[^fluid-type]。

**完整流体排版 token 化方案**：

将所有 `font-size` 相关的 Semantic Token 改为 `clamp()` 表达式，通过 CSS 自定义属性控制 `clamp()` 的三个参数：

```css
:root {
  /* 流体排版的三个控制参数（可被主题覆盖） */
  --blog-fluid-min: 1.0;    /* 最小视口缩放因子 */
  --blog-fluid-preferred: 1.5; /* 首选视口缩放因子 */
  --blog-fluid-max: 2.5;    /* 最大视口缩放因子 */

  /* 使用 clamp 的 Semantic Token */
  --blog-typescale-body-large-size: clamp(
    calc(1.0rem * var(--blog-fluid-min)),
    calc(1.5rem * var(--blog-fluid-preferred) * 1vw),
    calc(1.125rem * var(--blog-fluid-max))
  );
}
```

**注意事项**：

编号列表版：
1. `clamp()` 在极端小视口（< 320px）下可能导致字号低于 WCAG 最小可读要求（通常认为 16px/1rem 是下限），需补充 `@media (max-width: 320px)` 兜底规则
2. 流体排版与用户自定义字号（方案 B）结合时，需要确保 `clamp()` 表达式中的参数也可以被用户控制
3. 当前项目中 `body-large-size` 是固定值 `1.125rem`，而 `display-large-size` 是 `clamp()`，这种混合使用是可以的，但建议统一决策：正文是否也需要流体缩放

无编号版：
- `clamp()` 在极端小视口（< 320px）下可能导致字号低于 WCAG 最小可读要求（通常认为 16px/1rem 是下限），需补充 `@media (max-width: 320px)` 兜底规则
- 流体排版与用户自定义字号（方案 B）结合时，需要确保 `clamp()` 表达式中的参数也可以被用户控制
- 当前项目中 `body-large-size` 是固定值 `1.125rem`，而 `display-large-size` 是 `clamp()`，这种混合使用是可以的，但建议统一决策：正文是否也需要流体缩放

---

## 五、可变字体（Variable Fonts）的应用注意事项

可变字体（Variable Fonts）是 2025 年排版设计系统的重要趋势[^fonts-arena]。通过单个字体文件包含多个字重轴、宽度轴、斜度轴等，可以大幅减少字体文件数量，并提供更精细的排版控制。

### 5.1 可变字体的优势

编号列表版：
1. **文件体积优化**：一个可变字体文件替代多个静态字体文件（如 Regular、Medium、SemiBold、Bold 四个文件合并为一个）
2. **精细字重控制**：不再局限于 400/500/600/700 等离散值，可以使用 450 这样的中间字重
3. **动画效果**：可以通过 CSS `font-variation-settings` 实现字重或宽度的平滑过渡动画

无编号版：
- **文件体积优化**：一个可变字体文件替代多个静态字体文件（如 Regular、Medium、SemiBold、Bold 四个文件合并为一个）
- **精细字重控制**：不再局限于 400/500/600/700 等离散值，可以使用 450 这样的中间字重
- **动画效果**：可以通过 CSS `font-variation-settings` 实现字重或宽度的平滑过渡动画

### 5.2 在 Token 体系中集成可变字体

```css
:root {
  /* Primitive Token：可变字体 */
  --blog-font-sans-variable: "Inter Variable", "Google Sans Flex",
    system-ui, sans-serif;
  --blog-font-weight-range: 100 900; /* 可变字体的字重范围 */
}

/* 使用 font-variation-settings 精细控制 */
.headline-dynamic {
  font-family: var(--blog-font-sans-variable);
  font-variation-settings: "wght" 650, "wdth" 95;
}
```

### 5.3 注意事项

编号列表版：
1. 可变字体文件通常比单个静态字体大，但比多个静态字体总和小。需要实际测试 WOFF2 格式下的文件大小
2. 不是所有字体都有可变版本。你当前 fallback 栈中的系统字体（`-apple-system`、`BlinkMacSystemFont`）本身就是可变字体（SF Pro 是可变字体），这一点对 macOS/iOS 用户已经有利
3. 使用可变字体时，`font-weight` 的 token 可以继续使用数值，浏览器会自动映射到可变字体的 `wght` axis，无需改动 Semantic Token 的定义

无编号版：
- 可变字体文件通常比单个静态字体大，但比多个静态字体总和小。需要实际测试 WOFF2 格式下的文件大小
- 不是所有字体都有可变版本。你当前 fallback 栈中的系统字体（`-apple-system`、`BlinkMacSystemFont`）本身就是可变字体（SF Pro 是可变字体），这一点对 macOS/iOS 用户已经有利
- 使用可变字体时，`font-weight` 的 token 可以继续使用数值，浏览器会自动映射到可变字体的 `wght` axis，无需改动 Semantic Token 的定义

---

## 六、字体加载策略

排版主题切换中，如果用户选择了不同的字体族（如 Serif 主题），需要确保新字体正确加载，同时不影响页面渲染性能。

### 6.1 `font-display` 策略

`font-display` 控制浏览器在自定义字体加载过程中如何显示文本[^font-loading]。

**推荐配置**：

编号列表版：
1. **正文排版 token 相关的 `@font-face` 使用 `font-display: swap`**：立即显示系统 fallback 字体，自定义字体加载完成后替换，避免 FOIT（不可见文本闪烁）
2. **装饰性大字排版（display 层级）可使用 `font-display: optional`**：若字体在 100ms 内未加载完成，则永久使用 fallback，避免布局偏移（CLS）

无编号版：
- **正文排版 token 相关的 `@font-face` 使用 `font-display: swap`**：立即显示系统 fallback 字体，自定义字体加载完成后替换，避免 FOIT（不可见文本闪烁）
- **装饰性大字排版（display 层级）可使用 `font-display: optional`**：若字体在 100ms 内未加载完成，则永久使用 fallback，避免布局偏移（CLS）

### 6.2 字体预加载（Preload）

仅预加载首屏必需的字体文件（1–2 个），过多预加载会抢占其他资源的带宽。

```html
<!-- 预加载正文 Regular 和 Medium 两个字重 -->
<link rel="preload" href="/fonts/inter-variable.woff2" as="font" type="font/woff2" crossorigin>
```

### 6.3 FOUT 与 FOIT 的权衡

编号列表版：
1. **FOIT（Flash of Invisible Text）**：浏览器等待自定义字体加载，期间文本不可见。危害：严重影响 FCP（首次内容绘制）指标
2. **FOUT（Flash of Unstyled Text）**：浏览器先显示 fallback 字体，自定义字体加载后替换。危害：短暂样式变化，但比 FOIT 用户体验更好
3. **推荐策略**：全局使用 `font-display: swap`，并通过 `size-adjust`、`ascent-override`、`descent-override` 调整 fallback 字体的 metrics，使 FOUT 的视觉影响最小化

无编号版：
- **FOIT（Flash of Invisible Text）**：浏览器等待自定义字体加载，期间文本不可见。危害：严重影响 FCP（首次内容绘制）指标
- **FOUT（Flash of Unstyled Text）**：浏览器先显示 fallback 字体，自定义字体加载后替换。危害：短暂样式变化，但比 FOIT 用户体验更好
- **推荐策略**：全局使用 `font-display: swap`，并通过 `size-adjust`、`ascent-override`、`descent-override` 调整 fallback 字体的 metrics，使 FOUT 的视觉影响最小化

---

## 七、可访问性（Accessibility）注意事项

### 7.1 WCAG 标准要求

编号列表版：
1. **字号下限**：正文字号不应低于 16px（1rem），`clamp()` 的最小值必须保证这一点
2. **行高要求**：正文行高不应低于 1.5，你当前项目的 `body-large-leading: 1.7` 符合标准
3. **对比度要求**：文本与背景的对比度至少达到 4.5:1（AA 级），你当前项目的颜色 token（`--blog-color-text-primary` 等）需要对此进行验证
4. **用户缩放**：用户应能通过浏览器缩放功能或你提供的控制面板将字号放大至 200% 而不丢失内容或功能

无编号版：
- **字号下限**：正文字号不应低于 16px（1rem），`clamp()` 的最小值必须保证这一点
- **行高要求**：正文行高不应低于 1.5，你当前项目的 `body-large-leading: 1.7` 符合标准
- **对比度要求**：文本与背景的对比度至少达到 4.5:1（AA 级），你当前项目的颜色 token（`--blog-color-text-primary` 等）需要对此进行验证
- **用户缩放**：用户应能够通过浏览器缩放功能或你提供的控制面板将字号放大至 200% 而不丢失内容或功能

### 7.2 尊重用户系统偏好

通过 `prefers-reduced-motion` 和 `prefers-color-scheme` 媒体查询尊重用户的系统级偏好。排版主题切换也应考虑 `prefers-contrast` 媒体查询（高对比度模式）。

```css
/* 高对比度模式下的排版调整 */
@media (prefers-contrast: high) {
  :root {
    --blog-typescale-body-large-leading: 1.9; /* 增大行高提高可读性 */
    --blog-color-text-primary: black;
  }
}
```

---

## 八、当前项目的具体改进建议

基于对你当前项目代码的分析，以下是具体的改进建议。

### 8.1 现有 token 体系的完善

编号列表版：
1. **补充 `.blog-typescale-body-large` 的 `font-family` 引用方式**：当前 composite shorthand 使用了 `var(--blog-font-sans)`，这是正确的，但需确保 `--blog-font-sans` 的 fallback 栈已覆盖中文用户（你已包含 `Noto Sans SC` 等，这一点做得很好）
2. **补充 `.blog-measure-*` token 的应用**：你已定义了 `--blog-measure-narrow: 45ch`、`--blog-measure-normal: 65ch`、`--blog-measure-wide: 80ch`，但 `prose.css` 中尚未使用这些 token 来限制正文容器的 `max-width`，建议补充
3. **补充 `.blog-prose-gap-*` token 的完整应用**：你已定义了 `--blog-prose-gap-paragraph` 和 `--blog-prose-gap-block`，在 `prose.css` 中已有应用，但需确保 `blockquote`、`pre`、`img` 等块级元素都统一使用 `--blog-prose-gap-block`

无编号版：
- **补充 `--blog-typescale-body-large` 的 `font-family` 引用方式**：当前 composite shorthand 使用了 `var(--blog-font-sans)`，这是正确的，但需确保 `--blog-font-sans` 的 fallback 栈已覆盖中文用户（你已包含 `Noto Sans SC` 等，这一点做得很好）
- **补充 `--blog-measure-*` token 的应用**：你已定义了 `--blog-measure-narrow: 45ch`、`--blog-measure-normal: 65ch`、`--blog-measure-wide: 80ch`，但 `prose.css` 中尚未使用这些 token 来限制正文容器的 `max-width`，建议补充
- **补充 `--blog-prose-gap-*` token 的完整应用**：你已定义了 `--blog-prose-gap-paragraph` 和 `--blog-prose-gap-block`，在 `prose.css` 中已有应用，但需确保 `blockquote`、`pre`、`img` 等块级元素都统一使用 `--blog-prose-gap-block`

### 8.2 排版主题切换的具体实施步骤

编号列表版：
1. **第一步**：将当前 `typography.css` 中的 Semantic Token 值提取为"默认排版主题"，写入 `typography-themes.css` 文件
2. **第二步**：在该文件中新增 2–3 套备选排版主题（Compact、Relaxed、Serif），通过 `:root[data-typography="..."]` 选择器定义
3. **第三步**：在博客页面上添加一个排版主题切换器（可以复用你已有的 `ThemeToggle` 组件的交互模式），将切换状态存入 `localStorage`
4. **第四步**：验证切换排版主题时页面布局的正确性，特别注意 `max-width: var(--blog-measure-*)` 容器在字号变化后的表现

无编号版：
- **第一步**：将当前 `typography.css` 中的 Semantic Token 值提取为"默认排版主题"，写入 `typography-themes.css` 文件
- **第二步**：在该文件中新增 2–3 套备选排版主题（Compact、Relaxed、Serif），通过 `:root[data-typography="..."]` 选择器定义
- **第三步**：在博客页面上添加一个排版主题切换器（可以复用你已有的 `ThemeToggle` 组件的交互模式），将切换状态存入 `localStorage`
- **第四步**：验证切换排版主题时页面布局的正确性，特别注意 `max-width: var(--blog-measure-*)` 容器在字号变化后的表现

---

## 九、总结：关键注意事项速查清单

以下是实施排版全面 token 化时最核心的注意事项，按优先级排列。

**架构层面**：

编号列表版：
1. 严格遵循 Primitive → Semantic → Component 三层 token 架构，禁止组件直接使用 Primitive Token
2. Semantic Token 命名必须语义化（`body-large`），禁止数值化（`font-size-18`）
3. 排版主题切换与颜色主题切换相互独立，用户可自由组合

无编号版：
- 严格遵循 Primitive → Semantic → Component 三层 token 架构，禁止组件直接使用 Primitive Token
- Semantic Token 命名必须语义化（`body-large`），禁止数值化（`font-size-18`）
- 排版主题切换与颜色主题切换相互独立，用户可自由组合

**技术层面**：

编号列表版：
1. 使用 `clamp()` 实现流体排版，但必须设置极端小视口的兜底规则
2. `@font-face` 使用 `font-display: swap` 避免 FOIT
3. 仅预加载首屏必需的 1–2 个字体文件
4. 可变字体可以优化文件体积，但需测试 WOFF2 实际大小

无编号版：
- 使用 `clamp()` 实现流体排版，但必须设置极端小视口的兜底规则
- `@font-face` 使用 `font-display: swap` 避免 FOIT
- 仅预加载首屏必需的 1–2 个字体文件
- 可变字体可以优化文件体积，但需测试 WOFF2 实际大小

**可访问性层面**：

编号列表版：
1. 正文字号不低于 16px（1rem）
2. 正文行高不低于 1.5（你当前 1.7 符合标准）
3. 文本对比度至少 4.5:1（AA 级）
4. 尊重 `prefers-reduced-motion`、`prefers-contrast` 等用户系统偏好

无编号版：
- 正文字号不低于 16px（1rem）
- 正文行高不低于 1.5（你当前 1.7 符合标准）
- 文本对比度至少 4.5:1（AA 级）
- 尊重 `prefers-reduced-motion`、`prefers-contrast` 等用户系统偏好

**用户体验层面**：

编号列表版：
1. 排版主题切换应有视觉反馈（可参考你已有的 ThemeToggle 动画）
2. 用户选择应持久化到 `localStorage`
3. 提供"重置为默认"选项
4. 若提供用户自定义排版参数的控制面板，其 UI 本身也应遵循排版 token

无编号版：
- 排版主题切换应有视觉反馈（可参考你已有的 ThemeToggle 动画）
- 用户选择应持久化到 `localStorage`
- 提供"重置为默认"选项
- 若提供用户自定义排版参数的控制面板，其 UI 本身也应遵循排版 token

---

## 参考文献

[^w3c-dt]：W3C Design Tokens Community Group. "Design Tokens Specification Reaches First Stable Version." October 28, 2025. https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/

[^css-arch]：CSS Architecture. "Typography Scale Systems | Design System Token Fundamentals & Naming Conventions." https://www.css-architecture.com/design-system-token-fundamentals-naming-conventions/typography-scale-systems/

[^fluid-type]：Fluid Type Scale Calculator. https://www.fluid-type-scale.com/

[^fonts-arena]：Fonts Arena. "Design Trends 2025: Variable Fonts, Responsive Typography & Studio Workflows." September 26, 2025. https://fontsarena.com/blog/design-trends-2025-variable-font-s-responsive-typography-studio-workflows/

[^font-loading]：Font Converters. "Font Loading Strategies: font-display, Preloading & Performance Guide 2025." https://font-converters.com/guides/font-loading-strategies/

[^webdev-typography]：Google Developers. "使用 CSS 根据用户偏好调整排版." July 27, 2023. https://web.developers.google.cn/articles/adapting-typography-to-user-preferences-with-css?hl=zh-cn

---

*本文档由工程工作流教练协助调研并整理，覆盖 W3C Design Tokens 2025.10 稳定版规范、排版 Token 三层架构、字体主题切换实现方案、可变字体应用、字体加载策略、以及可访问性要求。*
