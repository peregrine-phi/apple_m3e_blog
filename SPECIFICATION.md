# M3E Blog — 开发说明书 (Development Specification)

> **版本**: 1.0.0  
> **最后更新**: 2026-05-31  
> **框架**: Astro 5.x  
> **设计系统**: Apple HIG × Material 3 Expressive 融合体系

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [设计系统架构](#3-设计系统架构)
4. [CSS 令牌体系](#4-css-令牌体系)
5. [主题系统](#5-主题系统)
6. [组件架构](#6-组件架构)
7. [内容管理](#7-内容管理)
8. [构建与部署](#8-构建与部署)
9. [开发工作流](#9-开发工作流)
10. [主题扩展指南](#10-主题扩展指南)
11. [已知限制与待办](#11-已知限制与待办)

---

## 1. 项目概述

M3E 是一个以 Astro 为构建框架的个人博客，视觉风格融合了 Apple Human Interface Guidelines 的克制优雅与 Material 3 Expressive 的情感表现力。

### 设计理念

| 原则 | Apple 影响 | M3 Expressive 影响 |
|------|-----------|-------------------|
| 色彩 | 基于透明度的文本层级 | 色调调色板、容器颜色 |
| 排版 | SF Pro 精准光学尺寸 | 情感化字号梯度 |
| 表面 | 毛玻璃材质 | 层级抬升与色调叠加 |
| 动效 | 弹簧物理曲线 | 强调缓动 |
| 形状 | 连续圆角矩形 | 角半径令牌系统 |

### 核心工程原则

- **零硬编码 CSS**: 所有视觉属性均通过 CSS 自定义属性（设计令牌）引用
- **语义化抽象**: 使用描述用途的变量名（`--blog-color-primary`）而非字面值（`#3B5CF6`）
- **主题可替换**: 亮/暗模式仅通过令牌重映射实现，组件代码无需修改
- **渐进增强**: 基础功能零 JS 依赖，互动功能通过 Islands 架构按需加载

---

## 2. 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | [Astro](https://astro.build) | ^5.7 | 静态站点生成，Islands 架构 |
| CSS 引擎 | [Tailwind CSS](https://tailwindcss.com) | ^4.1 | 原子化 CSS 工具类 |
| 组件库 | [daisyUI](https://daisyui.com) | ^5.0 | Tailwind 语义组件 |
| 排版 | [@tailwindcss/typography](https://tailwindcss.com/docs/typography-plugin) | ^0.5 | 文章排版增强 |
| 构建 | [Vite](https://vitejs.dev) | latest | 构建工具（Astro 底层） |
| 语言 | TypeScript | ^5.x | 类型安全 |
| 字体 | SF Pro / Inter / Noto Sans SC | — | 系统字体栈 |
| 运行环境 | Node.js | ≥22 | 开发与构建 |

### 包管理

```bash
npm install          # 安装所有依赖
npm run dev          # 启动开发服务器 (localhost:4321)
npm run build        # 生产构建 → dist/
npm run preview      # 预览生产构建
```

### 为什么选择这些技术？

- **Astro**: 内容驱动型网站的理想框架。默认零 JS，仅在需要时加载互动组件（Islands）。Content Collections 提供类型安全的 Markdown 管理。
- **Tailwind CSS v4**: 通过 `@tailwindcss/vite` 插件零配置集成。v4 引入 `@theme` 指令，与 CSS 自定义属性无缝协作。
- **daisyUI v5**: 提供语义化的 UI 组件类名（`btn`, `card`, `badge`），减少样板代码。v5 支持 Tailwind v4 的原生 `@plugin` 语法。
- **不选 React/Vue**: 博客类站点内容为主、互动为辅，SSR/SSG 足够，不需要重型运行时框架。

---

## 3. 设计系统架构

### 3.1 分层架构

```
┌─────────────────────────────────────────────────┐
│                 Component Layer                   │
│         Header, BlogCard, Footer, etc.           │
│         (引用 tokens，零硬编码 CSS)                │
├─────────────────────────────────────────────────┤
│                 Theme Layer                      │
│           light.css / dark.css                   │
│     (重映射 tokens → 实现主题切换)                 │
├─────────────────────────────────────────────────┤
│                 Token Layer                      │
│   colors / typography / spacing / elevation      │
│          shape / motion / index                  │
│      (单一数据源，所有视觉属性的定义处)              │
└─────────────────────────────────────────────────┘
```

### 3.2 令牌命名规范

所有令牌使用 `--blog-{category}-{name}` 命名空间：

```
--blog-color-*          # 色彩令牌
--blog-typescale-*      # 排版令牌
--blog-space-*          # 间距令牌
--blog-elevation-*      # 阴影/抬升令牌
--blog-radius-*         # 圆角令牌
--blog-motion-*         # 动效令牌
--blog-font-*           # 字体令牌
--blog-measure-*        # 阅读宽度令牌
```

### 3.3 文件结构

```
src/styles/
├── tokens/
│   ├── colors.css       # 🎨 色彩令牌 (参考色 + 系统色)
│   ├── typography.css   # 🔤 排版令牌 (字号/行高/字重/字距)
│   ├── spacing.css      # 📏 间距令牌 (4px 基准网格)
│   ├── elevation.css    # 📦 阴影令牌 (5 级抬升)
│   ├── shape.css        # 🔲 圆角令牌 (语义化命名)
│   ├── motion.css       # 🎬 动效令牌 (时长/缓动/Spring)
│   └── index.css        # 📋 令牌聚合入口
├── themes/
│   ├── light.css        # ☀️ 亮色主题 (默认)
│   └── dark.css         # 🌙 暗色主题
├── base/
│   ├── reset.css        # 🔄 CSS Reset
│   └── global.css       # 🌐 语义工具类 (.card, .btn, .badge...)
└── main.css             # 🚀 主入口 (导入顺序: tokens → themes → tailwind → base)
```

---

## 4. CSS 令牌体系

### 4.1 色彩令牌

#### 参考色 (Reference Tokens)

参考色以 HSL 分量定义，便于运行时计算与调整：

```css
--blog-ref-primary-h: 230;
--blog-ref-primary-s: 82%;
--blog-ref-primary-l: 58%;

--blog-ref-secondary-h: 260;
--blog-ref-tertiary-h: 340;

--blog-ref-success-h: 150;
--blog-ref-warning-h: 36;
--blog-ref-error-h: 0;
```

#### 系统色 (System Tokens)

采用 Material 3 的 `primary / on-primary / primary-container / on-primary-container` 模型，融合 Apple 的透明度文本层级。

**完整令牌清单：**

| 令牌 | 亮色默认值 | 说明 |
|------|-----------|------|
| `--blog-color-primary` | `hsl(230,82%,58%)` | 主品牌色 |
| `--blog-color-on-primary` | `#ffffff` | 主色上的内容 |
| `--blog-color-primary-container` | `hsl(230,100%,93%)` | 主色容器 |
| `--blog-color-on-primary-container` | `hsl(230,60%,20%)` | 容器上的内容 |
| `--blog-color-secondary` | `hsl(260,60%,55%)` | 次要色 |
| `--blog-color-tertiary` | `hsl(340,80%,52%)` | 第三色 |
| `--blog-color-background` | `#fbfbfd` | 页面背景 |
| `--blog-color-surface` | `#ffffff` | 组件表面 |
| `--blog-color-surface-variant` | `#f2f2f7` | 表面变体 |
| `--blog-color-text-primary` | `rgba(0,0,0,0.88)` | 主要文本 |
| `--blog-color-text-secondary` | `rgba(0,0,0,0.55)` | 次要文本 |
| `--blog-color-text-tertiary` | `rgba(0,0,0,0.28)` | 三级文本 |
| `--blog-color-text-link` | `var(--blog-color-primary)` | 链接色 |
| `--blog-color-border` | `rgba(0,0,0,0.08)` | 边框 |
| `--blog-color-divider` | `rgba(0,0,0,0.06)` | 分割线 |

### 4.2 排版令牌

采用 Material 3 Expressive 的排版梯度，融合 Apple 的精细字距控制。

| 梯度 | 尺寸 | 用途 |
|------|------|------|
| `display-large` | `clamp(3rem, 6vw, 5rem)` | Hero 标题 |
| `display-medium` | `clamp(2.25rem, 4.5vw, 3.5rem)` | 章节标题 |
| `display-small` | `clamp(1.75rem, 3vw, 2.5rem)` | 页面标题 |
| `headline-large` | `clamp(1.5rem, 2.5vw, 2rem)` | 卡片标题 |
| `headline-medium` | `clamp(1.25rem, 2vw, 1.5rem)` | 文章副标题 |
| `headline-small` | `clamp(1.1rem, 1.5vw, 1.25rem)` | 小节标题 |
| `title-large` | `1.125rem` | 列表标题 |
| `title-medium` | `1rem` | 导航项 |
| `body-large` | `1.125rem / 1.7` | 文章正文 |
| `body-medium` | `1rem / 1.65` | 默认正文 |
| `body-small` | `0.8125rem` | 辅助文本 |
| `label-large` | `0.875rem` | 按钮文字 |
| `label-medium` | `0.75rem` | 标签 |
| `label-small` | `0.6875rem` | 微小标注 |

**字体栈：**

```css
--blog-font-sans: "SF Pro Display", "SF Pro Text", "Inter", ...;
--blog-font-serif: "New York", "Iowan Old Style", ...;
--blog-font-mono: "SF Mono", "JetBrains Mono", "Fira Code", ...;
```

### 4.3 间距令牌

基于 4px 基准网格，覆盖 `0` 到 `256px`：

```
--blog-space-unit: 0.25rem (4px)
--blog-space-0 ... --blog-space-64
```

语义化间距：
- `--blog-space-page-inline`: 页面水平内边距（响应式）
- `--blog-space-section-gap`: 章节间距
- `--blog-space-card-padding`: 卡片内边距

### 4.4 阴影令牌

5 级抬升体系 + 语义化别名：

```css
--blog-elevation-0: none          /* 无阴影 */
--blog-elevation-1: ...           /* 卡片默认 */
--blog-elevation-2: ...           /* 导航栏 */
--blog-elevation-3: ...           /* 下拉菜单 / 卡片悬停 */
--blog-elevation-4: ...           /* 模态框 */
--blog-elevation-5: ...           /* 最高层级 */
```

### 4.5 动效令牌

**时长 (Duration):**

```css
--blog-motion-duration-fast: 150ms       /* 微交互 */
--blog-motion-duration-normal: 250ms     /* 标准过渡 */
--blog-motion-duration-slow: 350ms       /* 页面过渡 */
--blog-motion-duration-expressive: 500ms /* 情感化动效 */
```

**缓动 (Easing):**

```css
--blog-motion-easing-standard: cubic-bezier(0.2, 0, 0, 1)      /* M3 标准 */
--blog-motion-easing-emphasized: cubic-bezier(0.05, 0.7, 0.1, 1) /* M3 强调 */
--blog-motion-spring: linear(...)                                /* Apple 弹簧 */
```

> `--blog-motion-spring` 使用 CSS `linear()` 函数近似 Apple 的弹簧物理曲线，无需 JavaScript。

**可访问性**: 所有动效令牌在 `prefers-reduced-motion: reduce` 时被重设为 `0ms`。

---

## 5. 主题系统

### 5.1 主题切换原理

主题切换通过 `data-theme` 属性实现，不依赖任何 JavaScript 框架：

```html
<html data-theme="light">  <!-- 亮色模式 -->
<html data-theme="dark">   <!-- 暗色模式 -->
```

CSS 通过属性选择器重映射令牌：

```css
[data-theme="dark"] {
  --blog-color-primary: hsl(230, 100%, 78%);
  --blog-color-background: #0a0a0c;
  --blog-color-surface: #1c1c1e;
  /* ... 所有令牌重映射 */
}
```

### 5.2 ThemeToggle 组件

- 读取 `localStorage.theme` 或系统偏好（`prefers-color-scheme`）
- 通过内联 `<script is:inline>` 在页面渲染前设置 `data-theme`，防止闪烁（FOUC）
- 点击时切换 `data-theme` 并持久化到 `localStorage`

### 5.3 添加新主题

只需创建一个新的主题 CSS 文件，重映射所需的令牌：

```css
/* src/styles/themes/sepia.css */
[data-theme="sepia"] {
  --blog-color-background: #f4ecd8;
  --blog-color-surface: #faf3e0;
  --blog-color-primary: hsl(25, 80%, 40%);
  --blog-color-text-primary: rgba(60, 30, 10, 0.88);
  /* ... 完整令牌映射 */
}
```

然后在 `main.css` 中导入，并在 ThemeToggle 中添加新选项。

---

## 6. 组件架构

### 6.1 组件树

```
BaseLayout
├── Header
│   ├── Logo (.site-logo)
│   ├── Navigation (.site-nav)
│   │   ├── Blog link
│   │   └── About link
│   ├── ThemeToggle
│   └── MobileMenu (.mobile-nav)
├── <slot /> (页面内容)
└── Footer
    ├── Brand
    ├── Navigation links
    └── Copyright
```

### 6.2 布局组件

| 组件 | 文件 | 用途 |
|------|------|------|
| `BaseLayout` | `src/layouts/BaseLayout.astro` | 根布局：HTML 骨架、SEO meta、字体加载 |
| `BlogPostLayout` | `src/layouts/BlogPostLayout.astro` | 文章布局：标题区、正文排版、导航 |

### 6.3 UI 组件

| 组件 | 文件 | 用途 |
|------|------|------|
| `Header` | `src/components/Header.astro` | 粘性顶栏，含导航和主题切换 |
| `Footer` | `src/components/Footer.astro` | 页脚：品牌、链接、版权 |
| `ThemeToggle` | `src/components/ThemeToggle.astro` | 亮/暗模式切换按钮 |
| `BlogCard` | `src/components/BlogCard.astro` | 博客列表卡片 |

### 6.4 页面

| 路由 | 文件 | 说明 |
|------|------|------|
| `/` | `src/pages/index.astro` | 首页：Hero + 精选 + 最新文章 |
| `/blog` | `src/pages/blog/index.astro` | 博客列表（全部文章） |
| `/blog/[...slug]` | `src/pages/blog/[...slug].astro` | 文章详情（动态路由） |
| `/about` | `src/pages/about.astro` | 关于页面 |
| `/rss.xml` | `src/pages/rss.xml.js` | RSS 订阅源 |

### 6.5 组件开发规范

1. **所有组件引用设计令牌**，不在 `<style>` 中硬编码颜色或尺寸
2. **优先使用 Tailwind 工具类**（如 `flex`、`gap-4`、`p-6`），令牌用于语义属性
3. **动画使用 `--blog-motion-*` 令牌**定义时长和缓动
4. **响应式使用 CSS `clamp()` 和媒体查询**，断点引用令牌
5. **可访问性**: 语义化 HTML、`aria-label`、键盘导航支持

---

## 7. 内容管理

### 7.1 Content Collections

博客文章使用 Astro Content Collections 管理，提供类型安全和构建时验证。

**配置** (`src/content/config.ts`):

```typescript
const blogCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),               // 文章标题
    description: z.string(),          // 摘要（SEO + 卡片展示）
    publishedAt: z.date(),           // 发布日期
    updatedAt: z.date().optional(),  // 更新日期（可选）
    tags: z.array(z.string()),       // 标签
    draft: z.boolean().default(false), // 草稿（构建时排除）
    featured: z.boolean().default(false), // 精选（首页优先展示）
    image: z.string().optional(),    // 封面图（可选）
  }),
});
```

### 7.2 添加新文章

在 `src/content/blog/` 下创建 Markdown 文件：

```markdown
---
title: "文章标题"
description: "文章摘要，用于 SEO 和卡片展示"
publishedAt: 2026-06-01
tags: ["frontend", "css"]
draft: false
featured: false
---

正文内容...
```

### 7.3 数据查询

```typescript
// 获取所有已发布文章
const posts = await getCollection("blog", ({ data }) => !data.draft);

// 按日期排序
posts.sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());

// 获取精选文章
const featured = posts.filter((p) => p.data.featured);
```

---

## 8. 构建与部署

### 8.1 本地开发

```bash
npm run dev        # 启动开发服务器 → http://localhost:4321
```

开发服务器支持热模块替换（HMR），修改 Astro 组件和 Markdown 内容即时生效。

### 8.2 生产构建

```bash
npm run build      # 输出到 dist/
npm run preview    # 预览生产构建 → http://localhost:4321
```

构建输出为纯静态文件（HTML + CSS + 少量 JS），可部署到任何静态托管服务。

### 8.3 部署选项

| 平台 | 说明 |
|------|------|
| **CloudStudio** | 一键部署，使用 `workbuddy_cloudstudio_deploy` 工具 |
| **EdgeOne Pages** | 腾讯边缘部署，连接器方式 |
| **GitHub Pages** | 配置 `.github/workflows/deploy.yml` |
| **Vercel / Netlify** | 原生支持 Astro，自动检测框架 |

### 8.4 配置文件

`astro.config.mjs`:

```js
export default defineConfig({
  site: "https://m3e.blog",  // 生产域名
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      theme: "css-variables",  // 使用 CSS 变量支持主题切换
    },
  },
});
```

---

## 9. 开发工作流

### 9.1 文件组织原则

- **令牌优先**: 添加新视觉属性前，先在 `tokens/` 中定义令牌
- **组件独立**: 每个 `.astro` 文件自包含模板、样式、脚本
- **内容分离**: Markdown 在 `content/`，组件在 `components/`，布局在 `layouts/`

### 9.2 样式优先级

1. 首选：Tailwind 工具类（`flex`, `gap-4`, `rounded-lg`）
2. 其次：语义化全局类（`.card`, `.btn-primary`, `.text-headline-large`）
3. 最后：组件级 `<style>` 标签（仅在独特布局需要时）
4. 禁止：内联 `style` 属性

### 9.3 代码风格

- TypeScript 严格模式
- CSS 使用 kebab-case 类名
- 令牌使用 `--blog-category-name` 命名
- 注释使用中文（面向团队）/ 英文（面向国际）

### 9.4 常见任务速查

```bash
# 添加新令牌
touch src/styles/tokens/new-category.css
# 在 tokens/index.css 中添加 @import

# 添加新组件
touch src/components/NewComponent.astro

# 添加新文章
touch "src/content/blog/my-new-post.md"
# 填写 frontmatter 后写入内容

# 添加新主题
touch src/styles/themes/new-theme.css
# 在 main.css 中导入
# 在 ThemeToggle.astro 中添加选项
```

---

## 10. 主题扩展指南

### 10.1 换肤流程

M3E 的设计令牌体系使主题替换极其简单。以下是完整流程：

#### 步骤 1: 选择新调色板

确定新的参考色（HSL 分量）：

```css
/* 例如：从 Indigo 主题切换到 Teal 主题 */
--blog-ref-primary-h: 175;    /* 原: 230 */
--blog-ref-primary-s: 70%;    /* 原: 82% */
--blog-ref-primary-l: 42%;    /* 原: 58% */
```

#### 步骤 2: 更新令牌文件

修改 `src/styles/tokens/colors.css` 中的参考色变量。由于所有系统色都基于参考色计算，**仅需修改 3 个 HSL 分量即可全局生效**。

#### 步骤 3: 调整暗色主题

同步更新 `src/styles/themes/dark.css` 中的暗色模式配色，确保对比度。

#### 步骤 4: 更新主题色 Meta

修改 `src/layouts/BaseLayout.astro` 中的 `<meta name="theme-color">`。

#### 步骤 5: 验证

```bash
npm run dev
# 检查亮/暗模式下的所有页面
# 确认对比度（WCAG AA 最低要求）
```

### 10.2 多主题方案

如需支持 >2 个主题（如：Light / Dark / Sepia / High Contrast），建议：

1. 将所有主题色提取到独立文件
2. 使用 `<html data-theme="...">` 切换
3. ThemeToggle 改为下拉选择器或循环按钮

### 10.3 字体替换

修改 `src/styles/tokens/typography.css` 中的 `--blog-font-sans` 即可全局换字：

```css
--blog-font-sans: "Your Font", "Fallback", sans-serif;
```

> **注意**: 如果使用 Web Font（如 Google Fonts），需在 `BaseLayout.astro` 的 `<head>` 中添加 `<link>` 预加载。

---

## 11. 已知限制与待办

### 当前限制

1. **无搜索功能**: 目前没有站内搜索。未来可集成 Pagefind 或 Algolia。
2. **无评论系统**: 静态博客，无原生评论。可集成 Giscus 或 Disqus。
3. **无分页**: 博客列表无限滚动（或全量展示），文章数量增长后需添加分页。
4. **无标签页**: 标签仅在卡片和文章页显示，无独立的标签聚合页。
5. **无图片优化**: Astro 内置的 `<Image />` 组件可进一步利用以优化图片加载。
6. **代码高亮主题**: 目前使用 `css-variables` 主题，需要定义对应的 CSS 变量以支持暗色模式切换。

### 未来增强

- [ ] **搜索**: 集成 Pagefind（构建时索引，零运行时 JS）
- [ ] **评论**: 集成 Giscus（GitHub Discussions 驱动）
- [ ] **分页**: 使用 Astro `paginate()` API
- [ ] **标签系统**: 标签聚合页 + 按标签筛选
- [ ] **图片优化**: Astro Image 组件 + 响应式图片
- [ ] **Web 字体**: 通过 `@font-face` 引入 SF Pro 或 Inter 变量字体
- [ ] **动画增强**: Intersection Observer 驱动的滚动入场动画
- [ ] **PWA**: Service Worker + manifest，支持离线阅读
- [ ] **多主题**: 支持 >2 个主题选项

---

## 附录 A: 完整令牌速查

### A.1 色彩令牌 (colors.css)

```
--blog-ref-primary-h / -s / -l       # 主色 HSL 分量
--blog-ref-secondary-h / -s / -l     # 次要色 HSL 分量
--blog-ref-tertiary-h / -s / -l      # 第三色 HSL 分量
--blog-ref-success-h / -s / -l       # 成功色 HSL 分量
--blog-ref-warning-h / -s / -l       # 警告色 HSL 分量
--blog-ref-error-h / -s / -l         # 错误色 HSL 分量

--blog-color-primary                 # 主色
--blog-color-on-primary              # 主色上内容
--blog-color-primary-container       # 主色容器
--blog-color-on-primary-container    # 主色容器上内容
--blog-color-secondary               # 次要色 (同上四个变体)
--blog-color-tertiary                # 第三色 (同上四个变体)
--blog-color-success / warning / error # 语义色

--blog-color-background / on-background # 背景
--blog-color-surface / on-surface       # 表面
--blog-color-surface-variant / on-surface-variant # 表面变体
--blog-color-surface-raised / surface-dim # 抬升/降低表面

--blog-color-text-primary / secondary / tertiary / quaternary # 文本层级
--blog-color-text-link / link-hover   # 链接

--blog-color-border / border-strong   # 边框
--blog-color-divider                 # 分割线
--blog-color-selection-bg / text     # 选中
```

### A.2 排版令牌 (typography.css)

```
--blog-font-sans / serif / mono       # 字体族
--blog-font-weight-thin ... heavy     # 字重 (100-800)

--blog-typescale-display-*            # Display: large / medium / small
--blog-typescale-headline-*           # Headline: large / medium / small
--blog-typescale-title-*              # Title: large / medium / small
--blog-typescale-body-*               # Body: large / medium / small
--blog-typescale-label-*              # Label: large / medium / small
--blog-typescale-code-*               # Code

--blog-measure-narrow / normal / wide # 阅读宽度 (45/65/80 ch)
```

### A.3 间距令牌 (spacing.css)

```
--blog-space-unit: 0.25rem (4px)
--blog-space-0 ... 64                # 线性梯度
--blog-space-page-inline             # 响应式页面内边距
--blog-space-section-gap             # 响应式章节间距
--blog-space-card-padding            # 响应式卡片内边距
```

### A.4 语义工具类 (global.css)

```
.text-display-large ... .text-label-small   # 排版工具类
.text-primary / .text-secondary / .text-tertiary  # 文本颜色
.measure-narrow / .measure-normal / .measure-wide  # 阅读宽度
.surface / .surface-variant / .surface-raised      # 表面
.card                      # 卡片（含悬停效果）
.btn / .btn-primary / .btn-secondary / .btn-ghost   # 按钮
.container-narrow / .container-wide    # 容器
.divider                   # 分割线
.badge                     # 标签
.sr-only                   # 屏幕阅读器专用
```

---

## 附录 B: 资源参考

- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [daisyUI v5 Documentation](https://daisyui.com)
- [Material Design 3 — Design Tokens](https://m3.material.io/foundations/design-tokens)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [W3C Design Tokens Specification](https://www.w3.org/community/design-tokens/)
- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [WCAG 2.2 Guidelines](https://www.w3.org/TR/WCAG22/)

---

*本说明书随项目演进持续更新。最后修改: 2026-05-31*
