# Apple News 官方设计分析 & M3E 融合建议

> 分析日期：2026-05-31  
> 分析范围：Apple News 应用（iOS/macOS）、Apple News Format、apple.com/newsroom  
> 参考资源：Apple HIG、iOS 26 Liquid Glass、Apple News Format 文档

---

## 一、Apple News 设计哲学核心

### 1.1 三大设计支柱

| 支柱 | 核心理念 | 视觉表现 |
|------|---------|---------|
| **编辑优先 Editorial-First** | 内容为王，设计服务于阅读。排版不是装饰，是内容结构的骨骼。 | 大标题、开放留白、无干扰阅读区 |
| **杂志品质 Magazine Quality** | 每一屏都是经过排版设计的页面，而非自动填充的模板。 | 非对称网格、图片跨列、定制化布局 |
| **摄影驱动 Photography-Driven** | 图片是第一视觉入口，封面故事用全幅图片开场。 | 出血图（full-bleed）、视差滚动、图片标题叠加 |

### 1.2 与普通 Blog 设计的关键区别

| 维度 | 普通 Blog | Apple News |
|------|----------|------------|
| 标题层级 | 1-2 级 | 3-7 级（kicker → headline → deck → subhead） |
| 图片角色 | 插图/封面 | 叙事工具（图像序列、对比图、信息图表） |
| 网格 | 对称、统一 | 非对称、每篇文章可定制 |
| 留白 | 紧凑 | 慷慨，甚至"浪费" |
| 排版对比 | 温和（标题略大于正文） | 激进（display 可达 5rem，正文 1.125rem） |

---

## 二、排版系统深度分析

### 2.1 Apple News 的标题层级链（Kicker → Headline → Deck）

Apple News 中一篇文章的标准标题结构包含三个层次：

```
KICKER（引题）
──────────────────────────────────
The Headline That Commands
Attention Across Multiple Lines
──────────────────────────────────
A deck or standfirst that expands on the headline,
providing essential context in 1-2 sentences
```

**CSS 映射建议：**

```css
/* Kicker — 小而有力的引题 */
.apple-news-kicker {
  font-family: "SF Pro Display";
  font-size: 0.8125rem;         /* 13px — 极克制 */
  font-weight: 600;
  letter-spacing: 0.08em;       /* 宽字距制造张力 */
  text-transform: uppercase;
  color: var(--blog-color-primary);
  margin-bottom: 12px;
}

/* Headline — 编辑性大标题 */
.apple-news-headline {
  font-family: "SF Pro Display";
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.025em;     /* 负字距让标题更紧凑有力 */
  margin-bottom: 16px;
}

/* Deck — 标题的延伸说明 */
.apple-news-deck {
  font-family: "SF Pro Text";
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.45;
  color: var(--blog-color-text-secondary);
  max-width: 42ch;              /* 严格限制行长 */
}
```

### 2.2 SF Pro 字体微调规则（关键细节）

Apple News 排版精致的秘密在于精细的字距控制：

| 字号 | 字距（tracking） | SF 变体 | 用途 |
|------|-----------------|---------|------|
| ≥ 36px | -0.025em ~ -0.022em | SF Pro Display | Hero 标题 |
| 28–35px | -0.020em ~ -0.018em | SF Pro Display | 章节标题 |
| 21–27px | -0.014em ~ -0.010em | SF Pro Display | 卡片标题 |
| 17–20px | -0.006em ~ 0 | SF Pro Text | 小标题 |
| ≤ 16px | 0 ~ +0.010em | SF Pro Text | 正文/元数据 |

**与当前 M3E 排版令牌的对比：**

你的项目已有 `-0.022em`（display-large）等负字距，这是对的。但可以增强的地方：

1. **Display 级别的小字号（1.75rem）也需要负字距** — 当前 `display-small` 设了 `-0.014em`，正确
2. **Label 级别字距偏大** — Apple News 的元数据文字字距通常 ≤ 0.03em，你当前最大 0.06em 偏松散
3. **缺少 italic 变体** — Apple News 用 italic 标记引用、书名、外来词

### 2.3 Apple News 的"留白即内容"原则

Apple News 编辑设计的一个标志性特征是**不对称留白**：

```
┌──────────────────────────────────────────────┐
│                                              │
│  KICKER                                      │
│                                              │
│  Headline that spans                         │
│  three lines with                            │
│  generous line-height                        │
│                                              │
│                                              │ ← 大块留白
│                                              │
│  Deck text — a single sentence               │
│  that sets the stage.                        │
│                                              │
│                                              │
│  By Author Name · May 31, 2026               │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │                                      │    │
│  │          HERO IMAGE                  │    │
│  │          (full-width)                │    │
│  │                                      │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  Body text starts here with a                │
│  generous margin-top...                      │
│                                              │
└──────────────────────────────────────────────┘
```

**具体数值参考：**

| 区域 | 间距（Apple News 典型值） | M3E 当前值 | 建议 |
|------|-------------------------|-----------|------|
| Kicker → Headline | 12–16px | — | 新增 `--blog-space-apple-kicker-gap: 12px` |
| Headline → Deck | 16–24px | — | 新增 `--blog-space-apple-headline-gap: 20px` |
| Deck → Meta | 24–32px | — | 取决于有否 Hero 图 |
| Meta → Body | 48–80px | — | 慷慨的视觉呼吸 |
| 段落间距 | 1.2–1.5em | 通过 prose 控制 | 保持 |

---

## 三、文章布局系统

### 3.1 Apple News Format 的列系统

Apple News Format 使用 **7 列网格**（iPad）或 **根据屏幕自动调整**。关键概念：

- **Content Width**: 文章主内容通常占 5/7 列（约 70% 宽）
- **Margin**: 每侧至少 1 列宽（约 15% 留白）
- **Full-width components**: 图片、引用、分割线可跨所有 7 列（出血）

**Web 端翻译：**

```css
/* 文章容器参考 Apple News 7 列网格 */
.article-body {
  --grid-columns: 7;
  --content-columns: 5;
  --margin-columns: 1;
  
  max-width: 680px;        /* ≈ 5/7 of ~950px */
  margin-inline: auto;
  padding-inline: 24px;    /* ≈ 1/7 margin */
}

/* 出血元素 — 跨越全宽 */
.article-body .full-bleed {
  width: calc(100% + 48px); /* 抵消 padding */
  margin-inline: -24px;
  max-width: 100vw;
}

/* 宽元素 — 半出血（6/7 列） */
.article-body .wide {
  width: calc(100% + 24px);
  margin-inline: -12px;
}
```

### 3.2 Apple News 的组件节奏

一篇典型的 Apple News 文章会交替使用以下组件来打破长篇文字的单调：

```
[Hero Image — 全幅出血]
[Heading + Body]
[Pull Quote — 左对齐，大字号]
[Body]
[Inline Image — 5/7 列宽，圆角]
[Body]
[Gallery — 横向滚动 3-5 张图]
[Body]
[Info Box — 浅色背景卡片，关键信息]
[Body]
[Related Story Card — 底部推荐]
```

**M3E 可实现的组件清单：**

| Apple News 组件 | Web 实现 | M3E 优先级 |
|----------------|---------|-----------|
| Hero Image（全幅） | `<figure class="full-bleed">` | ⭐⭐⭐ |
| Pull Quote | `<blockquote class="pull-quote">` | ⭐⭐⭐ |
| Inline Image | `<figure class="article-image">` | ⭐⭐ |
| Image Gallery | 横向滚动容器（纯 CSS） | ⭐ |
| Info Box | `<aside class="callout">` | ⭐⭐ |
| Drop Cap | `::first-letter` 伪元素 | ⭐ |
| Section Divider | 装饰性分割线（· · · 或 — ❖ —） | ⭐⭐ |

### 3.3 Pull Quote — Apple News 的灵魂组件

Apple News 中的 Pull Quote 极具辨识度：

```css
.pull-quote {
  font-family: "SF Pro Display", var(--blog-font-sans);
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.012em;
  color: var(--blog-color-primary);
  
  max-width: 480px;
  margin: var(--blog-space-12) 0;
  padding-left: var(--blog-space-4);
  border-left: 3px solid var(--blog-color-primary);
  
  /* 或者去掉左边框，改为上方的装饰线 */
  /* border-top: 3px solid var(--blog-color-primary); */
  /* padding-top: var(--blog-space-4); */
  /* padding-left: 0; */
}

.pull-quote cite {
  display: block;
  margin-top: var(--blog-space-4);
  font-family: "SF Pro Text", var(--blog-font-sans);
  font-size: 0.875rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  color: var(--blog-color-text-secondary);
  font-style: normal;
}
```

---

## 四、色彩与材质

### 4.1 Apple News 的"报纸白"与"杂志黑"

Apple News 在亮色模式下不使用纯白 `#ffffff`，而是微暖的"报纸白"：

| 色彩角色 | Apple News 典型值 | M3E 当前 | 差异 |
|---------|-------------------|---------|------|
| 背景 | `#FBFBFD` 或 `#FAFAFA` | `#FBFBFD` | ✅ 已对齐 |
| 卡片/表面 | `#FFFFFF` | `#FFFFFF` | ✅ 一致 |
| 主要文本 | `rgba(0,0,0,0.88)` | `rgba(0,0,0,0.88)` | ✅ 一致 |
| 次要文本 | `rgba(0,0,0,0.55)` | `rgba(0,0,0,0.55)` | ✅ 一致 |
| 三级文本 | `rgba(0,0,0,0.28)` | `rgba(0,0,0,0.28)` | ✅ 一致 |
| 分割线 | `rgba(0,0,0,0.06)` | `rgba(0,0,0,0.06)` | ✅ 一致 |
| 强调色 | **可变，通常偏暖** | Indigo `hsl(230,82%,58%)` | ⚠️ 偏冷 |

**建议：Apple News 的强调色通常暖一点（有编辑温度），考虑微调 primary hue：**

```
当前: hsl(230, 82%, 58%) — 冷 Indigo
Apple News 风格: hsl(220, 70%, 45%) — 偏暖的蓝 / hsl(200, 75%, 48%) — 青蓝
或激进一点: hsl(15, 80%, 50%) — Apple News 的"红色强调"模式
```

### 4.2 毛玻璃/透明效果

Apple News（特别是 iOS 版本）大量使用 **模糊半透明材质**作为导航和内容覆盖：

```css
/* Apple News 风格的毛玻璃导航栏 */
.apple-news-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  
  /* 毛玻璃核心 */
  background: rgba(251, 251, 253, 0.72);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.08);
}

[data-theme="dark"] .apple-news-nav {
  background: rgba(10, 10, 12, 0.72);
  border-bottom-color: rgba(255, 255, 255, 0.08);
}
```

**这与 iOS 26 Liquid Glass 材质一致** — M3E 的 Header 可以加上这个效果。

---

## 五、首页 / Feed 布局

### 5.1 Apple News Today 的版面结构

Apple News 首页（Today 标签）是精心策划的编辑版面，不是算法排序的简单列表：

```
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────┐    │  ← Top Story (Hero)
│  │                                 │    │    全幅大图 + 标题叠加
│  │      FEATURED IMAGE             │    │
│  │                                 │    │
│  │  KICKER                         │    │
│  │  Headline for the               │    │
│  │  top story of the day           │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌──────────┐  ┌──────────┐            │  ← 次重要故事
│  │  Story   │  │  Story   │            │    2 列并排
│  │    2     │  │    3     │            │
│  │  IMAGE   │  │  IMAGE   │            │
│  │          │  │          │            │
│  │  Title   │  │  Title   │            │
│  └──────────┘  └──────────┘            │
│                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐            │  ← 快速浏览
│  │Story │ │Story │ │Story │            │    3 列迷你卡片
│  │  4   │ │  5   │ │  6   │            │
│  └──────┘ └──────┘ └──────┘            │
│                                         │
│  ┌──────────────────────────────┐       │  ← 长篇文章
│  │  Story 7                     │       │    单列全宽
│  │  (long-form feature)         │       │
│  └──────────────────────────────┘       │
└─────────────────────────────────────────┘
```

### 5.2 与 M3E 当前首页的对比

| 元素 | M3E 当前 | Apple News 风格 | 建议 |
|------|---------|----------------|------|
| Hero | 纯文字 + 渐变 blob | 大幅图片 + 文字叠加 | 图片为主，文字为叠加层 |
| Featured | 标准 BlogCard 网格 | 非对称布局（1大 + 2小） | 用 CSS Grid `grid-template-areas` |
| 列表密度 | 统一 320px 列 | 密度变化（疏→密→疏） | 分 section 用不同列宽 |
| 图片 | 无 | 关键元素 | 每个卡片配封面图占位 |
| Kicker | 无（只有 eye-brow） | 重要层级 | 已有一个 `.hero-eyebrow`，可复用 |

### 5.3 非对称 Hero 布局实现

```astro
<!-- Apple News 风格的非对称 Hero + 次故事 -->
<section class="apple-news-hero">
  <!-- Top Story — 占 2/3 宽 -->
  <article class="hero-lead">
    <img src={leadStory.image} alt="" class="hero-lead-img" />
    <div class="hero-lead-content">
      <span class="kicker">{leadStory.kicker}</span>
      <h1 class="hero-lead-title">{leadStory.title}</h1>
    </div>
  </article>
  
  <!-- Side Stories — 占 1/3 宽，纵向堆叠 -->
  <div class="hero-side">
    {sideStories.map(story => (
      <article class="hero-side-card">
        <img src={story.image} alt="" />
        <span class="kicker">{story.kicker}</span>
        <h2>{story.title}</h2>
      </article>
    ))}
  </div>
</section>

<style>
  .apple-news-hero {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--blog-space-4);
    margin-bottom: var(--blog-space-12);
  }
  
  .hero-lead {
    position: relative;
    border-radius: var(--blog-radius-lg);
    overflow: hidden;
    aspect-ratio: 3 / 2;
  }
  
  .hero-lead-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .hero-lead-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: var(--blog-space-8);
    background: linear-gradient(transparent, rgba(0,0,0,0.7));
    color: #fff;
  }
  
  .hero-side {
    display: flex;
    flex-direction: column;
    gap: var(--blog-space-4);
  }
  
  @media (max-width: 768px) {
    .apple-news-hero {
      grid-template-columns: 1fr;
    }
  }
</style>
```

---

## 六、手势与动效

### 6.1 Apple News 的微交互语言

| 交互 | 效果 | CSS 实现参考 |
|------|------|------------|
| 卡片按下 | `scale(0.97)` + 轻微阴影收缩 | M3E 已有 `.btn:active`，可扩展到卡片 |
| 页面切换 | 从右滑入（push） | View Transition API |
| 图片点击 | 放大到全屏（zoom） | `<dialog>` + `transform` |
| 滚动入场 | 淡入 + 上移 20px | Intersection Observer + CSS |
| 导航栏 | 滚动时变毛玻璃 + 压缩高度 | `@scroll-timeline` 或 JS |

### 6.2 弹簧动画（Apple 标志性物理曲线）

M3E 已有 `--blog-motion-spring` 令牌，但当前是占位符。实际的 Apple 弹簧曲线近似：

```css
/* Apple 默认弹簧（响应快、轻微回弹） */
--blog-motion-spring-default: linear(
  0, 0.002, 0.01 0.6%, 0.034 1.5%, 0.114 3.2%, 0.282 5.6%,
  0.429 7.7%, 0.559 10%, 0.671 12.5%, 0.764 15.3%, 0.862 19.7%,
  0.924 24%, 0.958 28.7%, 0.978 34%, 0.99 40%, 0.996 47%,
  0.999 55.3%, 1 65.2%, 1 100%
);

/* Apple 弹性弹簧（明显回弹，用于重要动作） */
--blog-motion-spring-bouncy: linear(
  0, 0.003 1.2%, 0.016 2.8%, 0.048 4.8%, 0.107 7%,
  0.193 9.5%, 0.286 12%, 0.385 14.5%, 0.488 17%,
  0.595 19.8%, 0.679 22.3%, 0.749 25%, 0.806 28%,
  0.868 32.5%, 0.909 37%, 0.937 42%, 0.956 47.5%,
  0.969 53.5%, 0.978 60%, 0.984 67%, 0.988 74.5%,
  0.991 82%, 0.993 90%, 0.993 100%
);
```

---

## 七、与野兽派（Brutalist）的融合方向

### 7.1 Apple News × Brutalism 的交集

Apple News 的编辑设计与你之前选择的野兽派风格在某些维度天然契合：

| 维度 | Apple News | Brutalism | 融合方案 |
|------|-----------|-----------|---------|
| 排版 | 大胆的大字号 | 更大胆的极端字号 | **超大字重 + 极端字号对比** |
| 留白 | 慷慨 | 激进 | **故意"浪费"的空间** |
| 网格 | 严谨 | 打破 | **非对称 + 出血元素** |
| 边框 | 几乎无 | 粗黑边框 | **关键元素用粗边框标记** |
| 色彩 | 克制 | 高饱和/原色 | **用 Apple 的透明度层级 + Brutalist 的色块** |
| 图片 | 精致摄影 | 原始/低保真 | **高对比黑白摄影 + 原色叠加** |

### 7.2 具体融合令牌建议

```css
/* ── Brutalist × Apple News 融合令牌 ── */
:root {
  /* 野兽派的粗边框注入 */
  --blog-brutal-border-width: 3px;
  --blog-brutal-border-color: var(--blog-color-text-primary);
  
  /* 野兽派色块 */
  --blog-brutal-color-yellow: #FFD700;
  --blog-brutal-color-red: #FF3B30;
  --blog-brutal-color-blue: #007AFF;
  
  /* Apple 的克制背景 + Brutalist 的原色点缀 */
  --blog-color-accent-brutal: var(--blog-brutal-color-red);
}

/* 野兽派卡片 — Apple 圆角 + 粗边框 */
.card-brutal {
  background: var(--blog-color-surface);
  border-radius: var(--blog-radius-card);
  border: var(--blog-brutal-border-width) solid var(--blog-brutal-border-color);
  box-shadow: 6px 6px 0 var(--blog-brutal-border-color);
  /* Apple 圆角 + Brutalist 阴影偏移 */
}

/* 野兽派 Pull Quote — 去掉优雅左边框，用粗体块 */
.pull-quote-brutal {
  font-size: clamp(1.75rem, 4vw, 3rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  padding: var(--blog-space-6);
  background: var(--blog-brutal-color-yellow);
  color: #000;
  border: 3px solid #000;
}
```

---

## 八、优先级实施路线图

### Phase 1 — 排版升级（低风险、高回报）

- [ ] 添加 Apple News 的 Kicker/Headline/Deck 三层标题结构
- [ ] 微调 Label 级别的 letter-spacing（当前偏大）
- [ ] 添加 Apple 弹簧曲线到 motion tokens
- [ ] 优化 Hero Section 的排版对比

### Phase 2 — 布局升级

- [ ] Hero 区域改为非对称网格（2:1 或 3:2）
- [ ] 文章页添加 Pull Quote 组件
- [ ] 文章页支持 full-bleed 图片
- [ ] BlogCard 添加封面图支持

### Phase 3 — 野兽派注入

- [ ] 添加 `.card-brutal` 等野兽派变体类
- [ ] 在 Featured 区域使用粗边框/偏移阴影
- [ ] 引入 Brutalist 原色色块作为视觉锚点
- [ ] 非对称网格布局首页

### Phase 4 — 动效与材质

- [ ] Header 毛玻璃效果（backdrop-filter）
- [ ] 滚动入场动画（Intersection Observer）
- [ ] View Transition API 页面切换
- [ ] 卡片 hover 动效增强

---

## 九、配色微调方案

### 9.1 可选方案 A："Apple News Red"（编辑感更强）

```css
:root {
  --blog-ref-primary-h: 5;
  --blog-ref-primary-s: 80%;
  --blog-ref-primary-l: 48%;
  /* 结果: hsl(5, 80%, 48%) — 温暖的编辑红 */
}
```

### 9.2 可选方案 B："Apple News Blue"（保持克制，调暖色相）

```css
:root {
  --blog-ref-primary-h: 215;
  --blog-ref-primary-s: 70%;
  --blog-ref-primary-l: 48%;
  /* 结果: hsl(215, 70%, 48%) — 偏暖的蓝 */
}
```

### 9.3 可选方案 C："原色野兽派"（激进）

```css
:root {
  --blog-ref-primary-h: 0;
  --blog-ref-primary-s: 85%;
  --blog-ref-primary-l: 45%;
  /* 大胆的红 — Apple News 的红色主题 + Brutalist 态度 */
}
```

---

*本文档作为设计参考持续更新。下一步可以从 Phase 1 排版升级开始实施。*
