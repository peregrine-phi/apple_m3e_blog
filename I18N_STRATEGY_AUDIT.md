# M3E Blog — i18n 策略分析

> **审计日期**: 2026-06-01  
> **审计范围**: i18n 全链路（translations.ts → I18n 组件 → CSS 控制 → LanguageToggle → 内容层语言标记）  
> **对照基准**: "只做 layout 和 component 的国际化，内容层允许多语言文章，不同语言文章不单独路由"

---

## 1. 当前 i18n 机制全景

### 1.1 架构链路

```
                    translations.ts (132行)
                    ├── en: 35 keys (nav/footer/home/blog/post/about)
                    └── zh: 35 keys (一一对应)
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        I18n.astro    global.css    LanguageToggle.astro
     (双轨渲染组件)   (lang选择器)   (按钮+localStorage)
              │            │              │
         <span class=   html[lang="en"]   切换data-lang
         "i18n-en">  →  .i18n-zh{display:none}
         <span class=   html[lang="zh"]
         "i18n-zh">  →  .i18n-en{display:none}
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
 layouts   components  pages
 (全部通过I18n组件或.i18n-en/zh类名引用)
```

### 1.2 两套并行渲染机制

当前项目实际存在 **两套** i18n 文本渲染方式，它们各自独立运作：

| 方式 | 机制 | 使用位置 |
|------|------|----------|
| **方式 A: `<I18n tKey="..." />`** | 从 translations.ts 查表，双轨输出 | Header、Footer、HeroLayout、BlogListLayout、BlogPostLayout（`post.back`）、index.astro（`home.welcome`） |
| **方式 B: `<span class="i18n-en/zh">` + 内联文本** | 直接在模板中写死双语文本，CSS 控制显隐 | BlogPostLayout（日期、growth stage）、about.astro（组件 Showcase）、LanguageToggle（按钮文字） |

### 1.3 语言切换机制

```
Lang 初始化:
  BaseLayout <script is:inline>:
    1. localStorage.getItem("lang")
    2. 或 navigator.language.startsWith("zh") ? "zh" : "en"
    3. setAttribute("lang", l)  ← 在首帧前执行，防FOUC

Lang 切换:
  LanguageToggle.astro click handler:
    1. 切换 document.documentElement.lang
    2. localStorage.setItem("lang", lang)
    3. dispatchEvent("lang-change") → 被 blog/index.astro 等监听

CSS 控制:
  html[lang="en"] .i18n-zh { display: none !important; }
  html[lang="zh"] .i18n-en { display: none !important; }
```

**关键特征**: 无路由切换，无页面重载，纯 CSS + DOM 属性切换。

---

## 2. 与目标策略的逐项对照

### 2.1 "只做 layout 和 component 的国际化" ✅ 基本符合

| 层级 | i18n 方式 | 评估 |
|------|-----------|------|
| **Layouts** | `<I18n tKey="..."/>` 统一走 translations.ts | ✅ 符合 |
| **Components (Header/Footer)** | nav 文字、footer 描述全部走 I18n 组件 | ✅ 符合 |
| **Components (SearchBar)** | placeholder 从 Props 传入，不自行国际化 | ✅ 符合 |
| **Components (BlogCard)** | 展示文章原始数据（title/description/tags），不做翻译——这是对的 | ✅ 符合 |
| **Components (FilterGroup)** | 标签文本有内联中文硬编码（L52-L57） | ⚠ 偏移 |
| **Components (Backlinks)** | "Connections & Backlinks" 英文硬编码 | ⚠ 偏移 |

### 2.2 "内容层允许多语言文章" ✅ 已实现，但有两套不统一的标记机制

**博客文章** — 通过 `tags` frontmatter 标记语言：

```yaml
# apple-meets-material3.md     → tags: [..., "en"]
# apple-meets-material3-zh.md  → tags: [..., "zh"]
```

然后由组件层识别和过滤：

```typescript
// BlogCard.astro L28-29
const langTag = tags.find(t => t.toLowerCase() === "en" || t.toLowerCase() === "zh");
const displayTags = tags.filter(t => t.toLowerCase() !== "en" && t.toLowerCase() !== "zh");
```

**关于页面** — 通过独立的 content collection entries：

```typescript
// about.astro L11-12
const enBio = await getEntry("about", "en");
const zhBio = await getEntry("about", "zh");
```

**问题**: 同一件事（标记内容的语言）用了两套不同的机制——博客用 `tags` 里的 `"en"/"zh"` 字符串，about 用 content collection 的 entry ID。

### 2.3 "不同语言文章不单独路由" ✅ 完全符合

- 博客文章路由统一为 `/blog/{slug}`，不区分 `/blog/en/{slug}` 和 `/blog/zh/{slug}`
- About 页面统一为 `/about`，不区分 `/about-en` 和 `/about-zh`
- 语言切换通过 `html[lang]` 属性 + CSS 显隐，不触发路由跳转

---

## 3. 具体问题清单

### P1 — 布局层/组件层的内联 i18n 文本（应使用 I18n 组件）

| # | 文件:行 | 当前做法 | 问题 |
|---|---------|----------|------|
| B1 | `BlogPostLayout.astro` L48-L49 | `date.toLocaleDateString("en-US",...)` / `toLocaleDateString("zh-CN",...)` 直接写入 `<span class="i18n-en/zh">` | 布局层含有内容格式化逻辑；应抽取为 i18n key 或至少用 `Intl.DateTimeFormat` |
| B2 | `BlogPostLayout.astro` L53-L55 | "Updated" / "更新于" + 日期双轨硬编码 | 同上 |
| B3 | `BlogPostLayout.astro` L61-L62 | `growthStage` + 中文翻译（"常青树"/"成长"/"幼苗"）硬编码在布局 | stage 名称翻译散落在 3 处（此处 + FilterGroup + translations.ts） |
| B4 | `FilterGroup.astro` L52-L57 | 标签名硬编码：`"中文"` `"EN"` `"幼苗期"` `"成长中"` `"常青树"` | 组件层硬编码中文；这些值已在 translations.ts 中有对应 key（`blog.seedling` 等），应复用 |
| B5 | `Backlinks.astro` L58 | `"Connections & Backlinks"` 英文硬编码，无中文版本 | 组件层硬编码英文 |

### P2 — 内容层语言标记机制不一致

| # | 位置 | 机制 | 对比 |
|---|------|------|------|
| C1 | 博客文章 | `tags: [..., "en" 或 "zh"]` — 语言是"标签" | 语义扭曲：语言不是"标签"，把 `"en"` 和 `"design"` 放在同一个 tags 数组里是一种分类污染 |
| C2 | About 页面 | `getEntry("about", "en")` / `getEntry("about", "zh")` — 语言是 entry ID | 更干净的语义，但与博客机制不一致 |
| C3 | 博客文章过滤 | `displayTags = tags.filter(t => t !== "en" && t !== "zh")` — 硬编码过滤逻辑 | BlogCard.astro L29 和 BlogPostLayout.astro L35 各写了一遍相同的过滤逻辑 |

### P2 — 翻译表中存在未使用的 keys

| # | Key | 定义位置 | 使用位置 | 状态 |
|---|-----|---------|---------|------|
| D1 | `about.title` | translations.ts L64 | 未在任何文件中调用 | 在 about.astro 中改为直接拼接 `${siteConfig.name}` |
| D2 | `about.philosophy` | translations.ts L66 | 未调用 | 内容移至 Markdown |
| D3 | `about.colophon` | translations.ts L67 | 未调用 | 内容移至 Markdown |
| D4 | `about.sysTitle` | translations.ts L68 | 未调用 | 同上 |
| D5 | `about.sysDesc` | translations.ts L69 | 未调用 | 同上 |

### P3 — 语言检测逻辑中的越界判断

| # | 文件:行 | 问题 |
|---|---------|------|
| E1 | `BaseLayout.astro` L56 | `navigator.language.indexOf("zh") === 0` —— 匹配 `zh`、`zh-CN`、`zh-TW`、`zh-HK`，但 `zh-TW` / `zh-HK` 用户看到的是简体中文翻译，可能不准确 |

---

## 4. 设计分析：当前方案的优势

### 4.1 CSS 驱动切换 → 零路由负担

当前 i18n 的**最大亮点**是纯 CSS 驱动的语言切换：`html[lang]` 属性选择器控制 `.i18n-en` / `.i18n-zh` 的 `display`。这意味着：

- 不产生重复页面（SEO 单 URL）
- 切换即时响应，无需网络请求
- 与 Astro SSG 完美兼容（所有语言文本都在构建时静态输出）

这与 Astro 的内容层理念高度吻合——框架不关心内容语言，只是把两种语言都渲染出来，由用户端 CSS 决定显示哪个。

### 4.2 I18n 组件的双轨渲染设计

```astro
<span class="i18n-en">{enText}</span><span class="i18n-zh">{zhText}</span>
```

一个 `<I18n>` 调用同时输出两种语言，CSS 只显示当前激活的那种。这意味着：
- 不需要客户端 hydration 来做语言切换
- SEO 可以抓取到两种语言的文本（虽然搜索引擎会看到重复内容——但这是可以接受的 tradeoff）

### 4.3 内容层完全不感知 i18n 机制

博客文章 Markdown 是纯文本，不包含任何 i18n 标签或组件引用。内容创作者只管写文章，语言选择通过 `tags` 标记——虽然没有用最干净的方式，但本质上是"内容层独立"的正确方向。

---

## 5. 建议方案：精简方向

### 5.1 核心原则（与原始意图对齐）

```
Layout / Component 层 → I18n 组件 + translations.ts（查表）
Content 层           → 多语言文章并存，同一路由，不参与 i18n 机制
```

### 5.2 具体改进（按优先级）

#### 建议 1: 将 BlogPostLayout 中的内联双语文本迁移到 translations.ts

当前：
```astro
<span class="i18n-en">{formattedDate}</span>
<span class="i18n-zh">{publishedAt.toLocaleDateString("zh-CN",...)}</span>
```

改为：
```astro
<!-- L48: 日期格式化逻辑留在组件里是合理的，因为这是展示逻辑不是翻译 -->
<time datetime={publishedAt.toISOString()}>
  <span class="i18n-en">{formatDate(publishedAt, "en")}</span>
  <span class="i18n-zh">{formatDate(publishedAt, "zh")}</span>
</time>
```

或者更进一步，用 I18n 组件传参：
```astro
<I18n tKey="post.publishedAt" vars={{ date: formatDate(publishedAt, Astro.url) }} />
```

但当前的 L61-L62 growth stage 翻译（"常青树"/"成长"/"幼苗"）确实应该走 translations.ts，因为 `translations.ts` 中已经有 `blog.seedling` / `blog.budding` / `blog.evergreen` 这些 key。

#### 建议 2: 统一内容层语言标记机制

**问题**: 当前 tags 数组里混入了 `"en"` / `"zh"` 作为"语言标签"，这混淆了两个不同的语义维度。

**建议**: 
- **方案 A（轻量）**: 在 frontmatter 中新增独立的 `lang` 字段，与 `tags` 解耦
  ```yaml
  lang: en          # 或 zh
  tags: [design, material-design, apple]
  ```
- **方案 B（内容层不标记）**: 完全不标记——反正同一 URL 下只有一篇文章的两种语言版本用 CSS 切换，语言标记冗余

**推荐方案 A**。理由：
1. `tags` 数组恢复为纯内容标签，不再需要 `displayTags.filter(t => t !== "en" && t !== "zh")` 这种丑陋的过滤逻辑
2. 未来 RSS 可以按语言过滤输出
3. 代码中不再把 `"en"` 和 `"design"` 当同类型数据处理

#### 建议 3: FilterGroup 中的硬编码标签文本改为走 I18n

当前 `FilterGroup.astro` L52-L57 有硬编码的中文映射：
```typescript
itemId.toLowerCase() === "zh" ? "中文" : 
itemId.toLowerCase() === "en" ? "EN" : 
itemId.toLowerCase() === "seedling" ? "幼苗期" : ...
```

这些值应该从 translations.ts 读取（对应 `blog.seedling` 等已有 key）。

#### 建议 4: Backlinks 标题国际化

`Backlinks.astro` L58 `"Connections & Backlinks"` 应走 I18n。

#### 建议 5: 清理 translations.ts 中的死 key

移除 `about.title` / `about.philosophy` / `about.colophon` / `about.sysTitle` / `about.sysDesc` 等 5 个未使用的 key——或者如果有意保留以备未来使用，加上 `// reserved` 注释。

---

## 6. 总结

| 评估维度 | 评分 | 说明 |
|----------|------|------|
| 与原始意图对齐度 | 7/10 | 核心理念正确（layout/component 国际化 + 内容层多语言同路由），但翻译表有死 key，部分组件有内联硬编码 |
| 机制一致性 | 5/10 | I18n 组件与 `.i18n-en/zh` 内联文本两套并存；博客语言标记用 tags，about 用 entry ID |
| 框架/内容边界 | 7/10 | 内容层不感知 i18n 机制的方向是正确的；但 tags 里混入语言标记是一种边界泄漏 |
| 可维护性 | 6/10 | 改一个 stage 名称需要同步 3 处；翻译表有 5 个未使用的 key |
| 综合 | **6.3/10** | 方向正确，细节需要收敛 |

**一句话总结**: 当前的 i18n 策略在核心理念上与原始想法一致——纯框架层国际化 + 内容层多语言并存于同一路由。但实现上存在两套机制的混用、部分硬编码残留、以及内容语言标记机制的语义污染。建议通过新增 `lang` frontmatter 字段和统一 I18n 组件使用来收敛。
