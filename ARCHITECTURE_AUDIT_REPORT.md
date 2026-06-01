# M3E Blog — 前端架构审计报告

> **审计日期**: 2026-06-01  
> **审计范围**: 全项目（85 个源文件，包含 layouts / components / pages / content / config / i18n / styles / utils）  
> **审计维度**: 分层设计 · 仓库边界 · 复用性 · 内容隔离 · 配置管理 · 可维护性  
> **原则**: 不修改代码，仅审计与建议

---

## 1. 当前架构概览

```
src/
├── layouts/          ← 布局层 (7 文件)
│   ├── BaseLayout.astro          [根布局: HTML 骨架、SEO、FOUC 防护]
│   ├── HeroLayout.astro          [首页 Hero 布局]
│   ├── BlogPostLayout.astro      [文章详情布局]
│   ├── BlogListLayout.astro      [文章列表布局]
│   ├── SplitLayout.astro         [侧栏+主内容 双栏布局]
│   ├── PageLayout.astro          [窄幅居中布局]
│   └── WideLayout.astro          [宽幅全宽布局]
│
├── components/       ← 组件层 (21 文件)
│   ├── Header.astro / Footer.astro     [全局布局壳]
│   ├── BlogCard.astro / Chip.astro     [业务组件]
│   ├── SearchBar.astro / FilterGroup.astro  [交互组件]
│   ├── TableOfContents.astro / Backlinks.astro [文章附属]
│   ├── ThemeToggle.astro / LanguageToggle.astro / MonetSwitcher.astro [控制组件]
│   ├── Music.astro / MusicPlayer.svelte       [音乐播放器]
│   ├── I18n.astro / Icon.astro / PullQuote.astro [通用组件]
│   └── MDButton.astro / MDBadge.astro / MDSnackbar.astro / MDSwitch.astro [M3 基元]
│
├── pages/            ← 路由层 (5 文件)
│   ├── index.astro               [首页: Hero + 精选 + 最新]
│   ├── about.astro               [关于页: 混合展示 + 传记内容]
│   ├── blog/index.astro          [文章列表: 搜索 + 筛选]
│   ├── blog/[...slug].astro      [文章详情: 动态路由]
│   └── rss.xml.js                [RSS Feed]
│
├── content/          ← 内容层 (6 文件)
│   ├── config.ts                 [Content Collection Schema]
│   ├── filter-config.ts          [标签/阶段 视觉配置]
│   └── blog/ (4 篇 Markdown)
│
├── i18n/             ← 国际化
│   └── translations.ts          [中英双语翻译表]
│
├── config/           ← 项目配置
│   └── monet.config.js          [Monet 配色预设定义]
│
├── utils/            ← 工具函数
│   └── monet.ts                 [OKLCH → CSS Token 生成器]
│
└── styles/           ← 设计令牌 + 样式
    ├── tokens/ (10 文件)         [colors / typography / spacing / elevation / shape / motion / brutalist / state-layer / surface]
    ├── themes/ (2 文件)          [light.css / dark.css]
    ├── base/ (8 文件)            [reset / global / buttons / cards / editorial / garden / filters / layouts]
    ├── components/ (13 文件)     [每个 UI 组件一个 CSS]
    ├── pages/ (2 文件)           [home.css / blog.css]
    └── semantic/ (1 文件)        [breakpoints.css]

public/              ← 静态资源
├── monet/ (9 文件)               [预生成的 Monet CSS 方案]
├── music/                        [默认封面 SVG]
└── favicon.svg
```

### 当前分层依赖图

```
        pages ─────────────────────┐
          │                        │
    ┌─────┼─────┐                  │
    ▼     ▼     ▼                  │
layouts ←── components             │
    │         │                    │
    │    ┌────┼────────────┐       │
    ▼    ▼    ▼            ▼       │
BaseLayout  Header    FilterGroup  │
    │        Footer     BlogCard   │
    │        Monet*     etc.       │
    │                              │
    ├── utils/monet.ts             │
    ├── config/monet.config.js     │
    ├── i18n/translations.ts       │
    ├── content/config.ts          │
    └── content/filter-config.ts ◄─┘
```

### 关键观察

- **三层结构已经存在**: `layouts/` `components/` `content/` 三层分离清晰  
- **组件层级依赖单向**: layouts → components → tokens（无反向依赖，无循环）  
- **但内容与框架的边界模糊**: pages 内嵌了大量内容型数据；components 跨层依赖 content 目录  

---

## 2. 与目标架构的逐项对比

| 目标要求 | 当前状态 | 符合度 |
|----------|----------|--------|
| **Layout 层 + Component 层归属框架仓库** | 两者均在 `src/` 下，尚未拆分 repo | 目录结构就绪，仓库未拆分 |
| **Content 层归属内容仓库** | content 在同一个 `src/` 下 | 目录结构就绪，仓库未拆分 |
| **框架仓库完整可运行** | 移除 `src/content/blog/*` 后框架可构建（使用示例数据） | ⚠ 部分耦合需解耦 |
| **框架仓库不硬编码真实内容** | 存在 20+ 处硬编码的品牌名、域名、个人信息 | ❌ 严重违规 |
| **框架仓库不保留真实链接/API/作者信息** | Music 组件硬编码 Meting API URL 和歌单 ID | ❌ 违规 |
| **真实内容沉淀到内容仓库** | About 页面内容写在 `pages/about.astro` 而非 content 目录 | ❌ 放错层 |
| **敏感信息/环境差异配置迁到环境变量** | 零 `.env` 使用，site URL 硬编码在 astro.config.mjs | ❌ 缺失 |
| **无身份特征的示例内容允许** | 3 篇预设博客文章使用泛化标题（合理） | ✅ 合规 |
| **不存在真实社交账号** | Footer 有 GitHub 占位符链接（`/about`，非真实账号） | ⚠ 灰区 |

---

## 3. 已符合的部分

### 3.1 分层目录结构 — ✅ 优秀

```
src/layouts/     → 纯布局，零内容
src/components/  → 纯组件，零页面逻辑
src/content/     → 纯内容 + Schema
```

嵌套布局链设计精良：`BaseLayout ← SplitLayout ← BlogPostLayout`，每一层职责单一。

### 3.2 设计 Token 体系 — ✅ 优秀

- 完整的 10 文件 Token 层 (`colors / typography / spacing / elevation / shape / motion / brutalist / state-layer / surface`)
- 统一的 `--blog-{category}-{name}` 命名空间
- 三层 Token 模型已实现：Reference Tokens (`--blog-ref-*-h/s/l`) → System Tokens (`--blog-color-primary`) → 组件内部使用
- 主题切换仅靠 `data-theme` + Token 重映射，组件代码零修改
- 新增的 `breakpoints.css` 统一了响应式断点

### 3.3 组件架构 — ✅ 优秀

- Astro `.astro` 单文件组件（模板 + 样式 + 脚本自包含）
- 组件间通过 Props 通信，无全局状态泄露
- Svelte 仅用于 MusicPlayer（交互密集型场景合理使用 Island）
- Custom Elements（`monet-switcher`）用于 Monet 选择器

### 3.4 类型安全的内容 Schema — ✅ 优秀

`src/content/config.ts` 使用 Zod 定义了完整的 Blog Schema，含 `growthStage` 枚举、`knowledgeDomain` 可选字段。构建时自动验证所有 Markdown frontmatter。

### 3.5 国际化架构 — ✅ 良好

- `I18n.astro` 组件通过 `<span class="i18n-en/zh">` 双轨渲染
- CSS 通过 `html[lang]` 属性选择器控制显示
- `lang-change` CustomEvent 机制让其他组件响应语言切换
- FOUC 防护：`<script is:inline>` 在首帧前恢复 `lang` 属性

---

## 4. 不符合的部分（逐条举证）

### 4.1 站点身份信息散落硬编码 — ❌ 严重

以下所有 "M3E" 出现位置均需提取到内容仓库的站点配置文件：

| # | 文件 | 行号 | 硬编码内容 | 违规类型 |
|---|------|------|-----------|----------|
| 1 | `astro.config.mjs` | L8 | `site: "https://m3e.blog"` | 真实域名 |
| 2 | `src/pages/index.astro` | L25 | `title="M3E — Design & Technology Blog"` | 站点名称 |
| 3 | `src/pages/about.astro` | L9 | `title="About — M3E"` | 站点名称 |
| 4 | `src/pages/blog/index.astro` | L21 | `title="Blog — M3E"` | 站点名称 |
| 5 | `src/pages/rss.xml.js` | L12 | `title: "M3E Blog"` | 站点名称 |
| 6 | `src/pages/rss.xml.js` | L13-L14 | `description: "A personal blog about..."` | 站点描述 |
| 7 | `src/layouts/BaseLayout.astro` | L22 | `description = "A personal blog about design, technology, and thoughtful living."` | 默认站点描述 |
| 8 | `src/components/Header.astro` | L21 | Logo 文本 `M3E` | 品牌名 |
| 9 | `src/components/Footer.astro` | L10-L11 | Logo 文本 `M3E` | 品牌名 |
| 10 | `src/components/Footer.astro` | L36 | `&copy; ... M3E.` | 版权声明 |
| 11 | `src/i18n/translations.ts` | L26 | `"home.welcome": "Welcome to M3E"` | 站点名嵌入 i18n |
| 12 | `src/i18n/translations.ts` | L38 | `"blog.title": "Blog — M3E"` | 站点名嵌入 i18n |
| 13 | `src/i18n/translations.ts` | L64 | `"about.title": "About — M3E"` | 站点名嵌入 i18n |
| 14 | `src/i18n/translations.ts` | L86 | `"home.welcome": "欢迎来到 M3E"` | 站点名嵌入 i18n |
| 15 | `src/i18n/translations.ts` | L98 | `"blog.title": "文章 — M3E"` | 站点名嵌入 i18n |
| 16 | `src/i18n/translations.ts` | L124 | `"about.title": "关于 — M3E"` | 站点名嵌入 i18n |

**问题本质**: 站点名称 "M3E" 出现在 **16+ 个不同位置**，跨 7 个文件。如果某人 fork 该框架仓库并想改名为 "MyBlog"，需要逐个修改所有这些位置。这违反了单一数据源原则 (Single Source of Truth)。

### 4.2 页面内容在 pages 层而非 content 层 — ❌ 放错层

**`src/pages/about.astro`**（约 290 行）包含大量 Markdown 级文本内容，这些属于内容仓库：

```astro
// L26-92: 中英双语的个人传记 + 设计哲学 + Colophon
<p>Hi, I'm the creator of M3E — a blog at the intersection of design and technology.</p>
<p>This space is where I explore the craft of building digital experiences...</p>
// ...共约 100 行纯文本内容，不是布局/组件逻辑
```

**正确做法**: 将这些内容移入 `src/content/about/` 或内容仓库的 Markdown 文件，`pages/about.astro` 仅负责引用布局和渲染。

### 4.3 组件包含业务/个人配置 — ❌ 越层

**`src/components/Music.astro`**（约 86 行）硬编码：

| 行号 | 配置项 | 值 | 问题 |
|------|--------|-----|------|
| L21 | `MODE = 'api'` | `'api'` | 个人偏好，非框架通用 |
| L52 | `METING_API` | `'https://api.i-meto.com/meting/api'` | 第三方 API URL |
| L53 | `PLAYLIST_ID` | `'60198'` | 个人歌单 ID |
| L54 | `SERVER` | `'netease'` | 平台选择 |
| L24-49 | `stableTracks` | 4 首具体曲目（含 Unsplash URL） | 示例内容，但 URL 指向外部资源 |

**问题本质**: 音乐播放器组件本身是框架组件（layout 层引用它在 BaseLayout 中），但其内部硬编码了个人歌单和 API 地址。如果其他人使用该框架，这些配置完全不适合。

### 4.4 组件跨层依赖 content 目录 — ⚠ 架构违规

| 组件 | 依赖 | 违规 |
|------|------|------|
| `BlogCard.astro` (L7) | `import { stageConfig } from "../content/filter-config"` | 组件 → content 目录 |
| `FilterGroup.astro` (L8) | `import type { ChipConfig } from "../content/filter-config"` | 组件 → content 目录 |
| `Backlinks.astro` (L3, L15) | `import { getCollection } from "astro:content"` + 扫描所有博客正文 | 组件 → content schema + 运行时扫描 |
| `index.astro` (L8) | `import { getCollection } from "astro:content"` | 页面查询内容 — 合理 |
| `blog/index.astro` (L8-L9) | `import { getCollection } + import { tagConfig, stageConfig } from "../../content/filter-config"` | 混合依赖 |

**问题本质**: 如果 content 目录被移出框架仓库（移入内容仓库），`BlogCard`、`FilterGroup`、`Backlinks` 三个组件将因 `import` 失败而无法编译。`filter-config.ts` 中的 `tagConfig` 和 `stageConfig` 本质上是内容的视觉呈现配置（属于框架层面），但目前放置在了 `content/` 目录中，造成了反向依赖的假象。

更准确地说：
- `tagConfig` / `stageConfig` 是 **框架层配置**（定义 tag 如何渲染），应该放在 `src/config/` 而非 `src/content/`
- `Backlinks` 组件对 `getCollection` 的调用是合理的业务逻辑，但其实现隐式依赖了 Blog Schema，需要考虑接口抽象

### 4.5 零环境变量使用 — ❌ 缺失

整个项目中**没有任何 `.env` 文件或 `import.meta.env.*` 引用**。以下配置应该环境变量化：

| 配置项 | 当前位置 | 应迁移到 |
|--------|----------|----------|
| `site: "https://m3e.blog"` | `astro.config.mjs` | `PUBLIC_SITE_URL` |
| `METING_API` | `src/components/Music.astro` | `MUSIC_API_ENDPOINT`（可选） |
| `PLAYLIST_ID` / `SERVER` | `src/components/Music.astro` | 内容仓库配置文件 |

### 4.6 真实外部链接存在于框架中 — ❌ 违规

| 文件 | 行号 | 链接 | 类型 |
|------|------|------|------|
| `src/pages/about.astro` | L50 | `https://astro.build` | 框架技术链接（可接受，作为示例） |
| `src/pages/about.astro` | L51 | `https://tailwindcss.com` | 同上 |
| `src/pages/about.astro` | L54 | `https://developer.apple.com/fonts/` | 同上 |
| `src/components/Footer.astro` | L28 | `GitHub` → `href="/about"` | 占位符链接，非真实账号 |

第 L28 的 GitHub 链接指向 `/about` 而非真实 GitHub 账号——这是一个占位符，在这个语境下它恰当地避免了硬编码真实社交账号链接，反而是好的实践。但标签文字 "GitHub" 本身暗示了一个真实社交平台的存在感，在纯框架仓库中应该泛化为 "Social" 或移除。

### 4.7 i18n 翻译表嵌入站点身份 — ❌ 耦合

`src/i18n/translations.ts` 中包含 6 处 "M3E" 的直接引用（见 4.1 表第 11-16 行）。翻译文件的职责是提供语言映射，不应包含站点品牌名。正确的做法是使用变量插值：`"home.welcome": "Welcome to {siteName}"`。

---

## 5. 风险点

### 5.1 高优先级风险

| 风险 | 影响 | 触发场景 |
|------|------|----------|
| **站点名散落** | 换名需改 16+ 处，极易遗漏 | Fork 框架、多站点部署 |
| **BaseLayout 默认 description 硬编码** | 如果某页面不传 description，显示他人博客描述 | 内容仓库未设置 description 时 |
| **Music 组件耦合个人 API** | 第三方框架使用者无法直接使用，需修改源码 | Fork 框架 |
| **content/filter-config.ts 放错位置** | content 目录移出后编译失败 | 拆分仓库 |
| **无环境变量** | 开发/生产环境切换需手动改代码 | 部署到不同域名 |

### 5.2 中优先级风险

| 风险 | 影响 |
|------|------|
| About 页面文本嵌入 Astro 组件 | 无法通过 CMS/纯文本编辑修改 |
| Backlinks 组件运行时扫描所有文章正文 | 文章数量增长后构建时间线性增加 |
| RSS Feed 标题/描述硬编码 | RSS 阅读器中显示错误品牌名 |
| Header 中 `href="/blog"` `/about` 路由硬编码 | 如果内容仓库用不同路由结构，需改组件 |

### 5.3 低优先级风险

| 风险 | 影响 |
|------|------|
| Footer "Built with Astro" 文本 | 技术栈暴露，但属于惯例 |
| `monet.config.js` 中 `defaultSeed: "#3B5CF6"` | 可视为框架默认值，合理 |
| About 页面的 Colophon 链接列表 | 属于示例内容，可保留 |

---

## 6. 重构建议（按优先级排序）

### P0 — 阻塞仓库拆分，必须立即处理

#### 6.1 创建站点配置文件（内容仓库侧）

**新建**: `<content-repo>/site.config.ts` 或 `<content-repo>/src/config/site.ts`

```typescript
export const siteConfig = {
  name: "M3E",
  tagline: "Design & Technology Blog",
  description: "A personal blog exploring the intersection of...",
  url: "https://m3e.blog",
  author: {
    name: "Author Name",
    bio: "...",
    // 注意：bio 文本应引用自 content Markdown，此处仅放短标识
  },
  social: {
    github: "https://github.com/username",  // 真实链接放内容仓库
    // twitter: "..."
  },
  copyright: "M3E",
  defaultLanguage: "en",
};
```

**影响文件**: 需修改 6.2 中的所有引用点。

#### 6.2 消除站点名称硬编码（16 处 → 1 处）

采用 Astro 的 `import.meta.env` + 内容仓库传参模式：

**方案 A（推荐—框架仓库侧）**: 在 BaseLayout 中通过 Props 接受 `siteName`：

```astro
// BaseLayout.astro
interface Props {
  title: string;
  siteName: string;      // ← 新增
  description?: string;
  // ...
}
```

然后通过布局链逐层透传，直到 `<title>{title} — {siteName}</title>` 和 Footer 等位置。

**方案 B（内容仓库侧）**: 使用 Astro Content Collections 添加 `site` collection：

```typescript
// src/content/config.ts
const siteCollection = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    description: z.string(),
    url: z.string().url(),
    // ...
  }),
});
```

然后在各页面/layout 中：`const { name } = (await getEntry("site", "config")).data;`

**推荐组合方案**: 方案 B 用于内容仓库提供数据，方案 A 用于框架仓库的 Props 接口约束。

#### 6.3 astro.config.mjs 域名环境变量化

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
export default defineConfig({
  site: import.meta.env.PUBLIC_SITE_URL || "http://localhost:4321",
  // ...
});
```

创建 `.env.example`（提交到框架仓库）：

```
PUBLIC_SITE_URL=https://your-blog.example.com
```

`.env` 本身在 `.gitignore` 中（内容仓库管理真实值）。

#### 6.4 Music 组件数据源配置外部化

将 `Music.astro` 中的 `MODE`、`METING_API`、`PLAYLIST_ID` 提取为：

```astro
// Music.astro — 框架侧
interface Props {
  mode?: 'api' | 'local';
  apiEndpoint?: string;
  tracks?: Array<{name: string; artist: string; src: string; cover: string}>;
}

const { mode = 'local', apiEndpoint = '', tracks = [] } = Astro.props;
```

内容仓库的 BaseLayout 使用方传入真实值，框架仓库提供合理的空默认值。

#### 6.5 迁移 filter-config.ts 到框架层

**移动**: `src/content/filter-config.ts` → `src/config/filter-config.ts`

**原因**:
1. `filter-config.ts` 定义的是"标签/阶段如何渲染"（颜色、图标、样式变体），这是框架层职责
2. "有哪些标签/阶段"（数据）属于内容层，"标签长什么样"（视觉）属于框架层
3. 当前位置造成 `BlogCard`、`FilterGroup` 等组件对 `content/` 目录的跨层依赖

**修改**:
```typescript
// 旧: import { stageConfig } from "../content/filter-config";
// 新: import { stageConfig } from "../config/filter-config";
```

#### 6.6 清理 Backlinks 组件的跨层依赖

`Backlinks.astro` 当前直接调用 `getCollection("blog", ...)` 并扫描正文。建议：

**方案**: 将链接数据作为 Props 传入，由页面层（pages）负责查询和传递：

```astro
// Backlinks.astro
interface Props {
  backlinks: Array<{ slug: string; title: string; description: string; growthStage: string }>;
}
```

页面层（`blog/[...slug].astro`）负责：
1. 调用 `getCollection` 获取所有文章
2. 用 WikiLink 正则匹配生成 backlinks 数组
3. 传给 `<Backlinks backlinks={...} />`

这样组件不依赖 `astro:content`，框架仓库可独立编译。

---

### P1 — 应在拆分仓库前完成

#### 6.7 About 页面内容移入 content 层

| 当前 | 建议 |
|------|------|
| `src/pages/about.astro` 内嵌 L24-93 的传记文本 | 移到 `src/content/about/index.md` 或内容仓库 |
| 组件展示部分（Chip/Button/TextField showcase） | 保留在 `about.astro` 作为框架功能展示 |
| "Design Philosophy" 文本 | 移到内容仓库 |

**建议结构**:

```
<内容仓库>/content/about/
├── bio-en.md        ← 英文传记（Markdown）
├── bio-zh.md        ← 中文传记（Markdown）
└── colophon.md      ← Colophon 信息
```

`pages/about.astro` 仅保留：
- 布局结构
- 组件 Showcase（这是框架功能演示，合理）
- 从 content 加载的传记内容渲染

#### 6.8 i18n 翻译表去标识化

将 i18n 表中的站点名替换为变量占位符：

```typescript
// 当前
"home.welcome": "Welcome to M3E",

// 建议
"home.welcome": "Welcome to {siteName}",
```

在 `I18n.astro` 或包装函数中实现变量替换：

```astro
<!-- 使用侧 -->
<I18n tKey="home.welcome" vars={{ siteName: siteConfig.name }} />
```

#### 6.9 Header/Footer 路由可配置化

当前 Header 中 `href="/blog"` `/about` 是硬编码路由：

```astro
<!-- Header.astro L25-26 -->
<a href="/blog" class="nav-link">...</a>
<a href="/about" class="nav-link">...</a>
```

建议通过 Props 传入导航项：

```astro
interface NavItem { href: string; labelKey: string; }
interface Props {
  transparent?: boolean;
  navItems?: NavItem[];
}
```

框架仓库提供合理的默认值（如 `[{href: "/", labelKey: "nav.home"}]`），内容仓库可覆盖。

---

### P2 — 可后续优化

#### 6.10 RSS Feed 配置外部化

`src/pages/rss.xml.js` 中的 `title`、`description` 应从站点配置读取。

#### 6.11 favicon.svg 框架化

当前 `public/favicon.svg` 可能是个性化图标。建议：
- 框架仓库提供默认的框架标识 favicon
- 内容仓库提供覆盖机制（`public/favicon.svg` 优先于框架默认）

#### 6.12 Monet 配色预设审查

`src/config/monet.config.js` 的预设值本身是框架层配置（配色算法参数），这是合理的。但 `defaultSeed: "#3B5CF6"` 如果是个人偏好色，应考虑移到内容仓库的站点配置中。

---

## 7. 环境变量 / 内容仓库数据文件 / 框架配置 三者职责边界

### 职责边界图

```
┌─────────────────────────────────────────────────────────────────┐
│                      环境变量 (.env)                             │
│  范围: 敏感信息 + 环境差异                                       │
│  不进入版本控制 (.gitignore)                                     │
│                                                                  │
│  PUBLIC_SITE_URL=https://myblog.com   ← 生产域名                  │
│  PUBLIC_GA_ID=G-XXXXXXXX             ← Google Analytics ID       │
│  MUSIC_API_KEY=sk-xxx                ← 第三方 API Key            │
│  CLOUDSTUDIO_API_TOKEN=xxx           ← 部署凭证                  │
│                                                                  │
│  规则: 永远不在代码中出现明文; 前端可用 PUBLIC_ 前缀暴露           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   内容仓库数据文件                                 │
│  范围: 真实内容 + 真实站点数据 + 真实链接                          │
│  进入版本控制（内容仓库独立 repo）                                 │
│                                                                  │
│  site.config.ts         ← 站点名、描述、域名、作者、社交链接       │
│  content/blog/*.md      ← 博客文章正文 + frontmatter               │
│  content/about/*.md     ← 关于页面传记文本                         │
│  content/music.ts       ← 播放器模式、歌单、API 端点配置            │
│  public/favicon.svg     ← 个人站点图标                             │
│  public/avatar.png      ← 个人头像                                 │
│                                                                  │
│  规则: 所有带"个人身份"的数据放这里; 不依赖任何第三方服务凭证       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    框架仓库配置                                    │
│  范围: 技术配置 + 默认值 + 示例数据                                │
│  进入版本控制（框架仓库独立 repo）                                  │
│                                                                  │
│  astro.config.mjs        ← 构建配置（不含真实 site URL）            │
│  src/config/monet.config.js  ← 配色算法预设（不含个人偏好）         │
│  src/config/filter-config.ts ← 标签/阶段视觉呈现规则                │
│  src/styles/tokens/*.css    ← 设计 Token 定义                       │
│  src/content/config.ts      ← Content Schema（类型约束）            │
│  src/i18n/translations.ts   ← 泛化翻译模板（含变量占位符）           │
│                                                                  │
│  规则: 不含任何个人身份信息; 展示 BlogCard 等组件时用 lorem ipsum   │
│        或虚构示例数据; 所有可配置项通过 Props 暴露给内容仓库         │
└─────────────────────────────────────────────────────────────────┘
```

### 决策流程图

```
某个配置值属于哪里？

是秘密/凭证？ ────Yes──→ 环境变量 (.env)，不提交
     │
    No
     │
是站点身份/个人信息？ ────Yes──→ 内容仓库数据文件
     │
    No
     │
是技术性/框架级配置？ ────Yes──→ 框架仓库配置文件
     │
    No
     │
不确定？ → 默认放内容仓库（宁可多抽象一次，不要泄漏到框架）
```

### 典型混淆案例裁决

| 配置项 | 常见误区 | 正确归属 | 理由 |
|--------|---------|----------|------|
| `site: "https://myblog.com"` | 放 `astro.config.mjs` | **环境变量** `PUBLIC_SITE_URL` | 开发/生产域名不同 |
| 博客名称 "M3E" | 散落在 16+ 个文件 | **内容仓库** `site.config.ts` | 站点身份，非框架逻辑 |
| `monetConfig.defaultSeed` | 放框架 config | **框架仓库** `monet.config.js` | 算法参数默认值，与个人无关 |
| `PLAYLIST_ID = '60198'` | 放 `Music.astro` | **内容仓库** `content/music.ts` | 个人歌单选择 |
| `METING_API` URL | 放 `Music.astro` | **环境变量或内容仓库** | 第三方服务端点可能因部署环境变化 |
| `github: "/about"` | 放 `Footer.astro` | **内容仓库** `site.config.ts` | 真实社交链接 |
| `tags: ["design", "astro"]` | 放 `filter-config.ts` | **框架仓库** `filter-config.ts` | 视觉呈现规则 |
| Shiki 主题 `"css-variables"` | 放 `astro.config.mjs` | **框架仓库** `astro.config.mjs` | 技术选型 |

---

## 8. 最佳实践依据

### 8.1 Astro 官方 Content Layer 架构（Astro 5）

Astro 5 的 Content Layer 设计哲学（[来源](https://astro.build/blog/content-layer-deep-dive/)）：

- Content 是独立的一等公民，通过 `astro:content` 模块提供类型安全的 API
- Content 可以来自本地文件、CMS、数据库——框架不关心数据来源
- **这正是"内容仓库独立"的理论基础**：Astro 本身的 Content Layer 已经将内容和框架解耦，你的仓库拆分只是将这个解耦提升到 repo 级别

### 8.2 Monorepo 单一数据源原则

来自 Google/Microsoft 等大型组织的 monorepo 实践（[monorepo.tools](https://monorepo.tools/)）：

> "A monorepo is a single repository containing multiple distinct projects, with well-defined relationships."

在你的场景中，框架仓库和内容仓库是"有明确关系但独立的项目"：
- 框架仓库 = npm package（可被 install）
- 内容仓库 = 使用框架仓库的项目（install 框架仓库作为 dependency）

### 8.3 十二要素应用 — 配置分离

[12 Factor App](https://12factor.net/config) 第三条：

> "Store config in the environment. An app's config is everything that is likely to vary between deploys (staging, production, developer environments)."

这直接支持了将 `site` URL、API endpoints 移到环境变量的建议。

### 8.4 DTCG (Design Tokens Community Group) W3C 规范

[W3C Design Tokens Specification](https://www.w3.org/community/design-tokens/) 明确了三层 Token 模型：
- **Reference Tokens** → 纯值（对应你的 `--blog-ref-*`）
- **System Tokens** → 语义映射（对应你的 `--blog-color-*`）
- **Component Tokens** → 组件专用（对应你的组件 CSS 变量）

你的 Token 体系已经完美遵循了这个规范——这是项目最大的亮点之一。

### 8.5 站点配置集中化 — 社区共识

几乎所有主流静态站点框架都有"站点配置"概念：

| 框架 | 配置文件 | 内容 |
|------|----------|------|
| Astro (推荐) | `src/content/site/config.ts` (Content Collection) | 站点名、描述、URL |
| Next.js | `next.config.js` + `siteMetadata` | 同上 |
| Hugo | `hugo.toml` / `config.toml` | 同上 |
| Eleventy | `_data/site.js` | 同上 |

统一的做法是：**站点身份信息集中在单一配置文件中，组件通过数据层引用，绝不在组件内部硬编码**。

---

## 9. 总结评分

| 维度 | 评分 | 说明 |
|------|------|------|
| **分层设计** | 8/10 | 三层结构清晰，嵌套布局链优秀。减分：Backlinks 跨层依赖 content schema |
| **仓库边界** | 3/10 | 尚未拆分；16+ 处站点名硬编码阻挡拆分 |
| **复用性** | 7/10 | 组件接口设计好（Props + Slot），Token 体系高复用。减分：Music 组件不可复用 |
| **内容隔离** | 4/10 | Content Collection 做得不错，但 About 页面内容仍在 pages 层，filter-config 放错目录 |
| **配置管理** | 2/10 | 零环境变量、零集中配置、站点名散落、API 配置硬编码 |
| **可维护性** | 7/10 | Token 体系极大降低了视觉变更成本；但品牌改名成本极高 |
| **综合** | **5.2/10** | 框架内核优秀，但配置管理和仓库边界是两个致命短板 |

---

## 10. 执行路线图

```
Phase 1 (P0, 约 2-3 天)
├── 1. 创建 site.config.ts 内容数据文件
├── 2. 消除 16 处站点名硬编码 → 统一从 siteConfig 读取
├── 3. astro.config.mjs 域名环境变量化
├── 4. 迁移 filter-config.ts 到 src/config/
│
Phase 2 (P1, 约 1-2 天)  
├── 5. Music 组件数据源 Props 化
├── 6. Backlinks 组件数据 Props 化
├── 7. About 页面内容移入 content 层
├── 8. i18n 翻译表去标识化 + 变量插值
├── 9. Header/Footer 导航 Props 化
│
Phase 3 (P2, 约 1 天)
├── 10. RSS Feed 配置外部化
├── 11. 拆分仓库（框架 → framework-repo, 内容 → content-repo）
└── 12. 框架仓库去掉所有真实内容，仅保留示例数据
```

---

*审计完成。所有发现均有具体文件路径和行号支撑。如需对任一问题深入讨论或开始 Phase 1 实施，随时可以继续。*
