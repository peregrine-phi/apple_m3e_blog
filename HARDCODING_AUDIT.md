# 全面硬编码排查报告

> 生成时间: 2026-06-01  
> 范围: `src/`、`scripts/`、`astro.config.mjs`、`package.json`  
> 原则: 只排查，不修改

---

## 一、硬编码 URL / 外部链接

| # | 文件 | 行号 | 内容 | 风险等级 |
|---|------|------|------|----------|
| 1 | `astro.config.mjs` | 7 | `site: "https://m3e.blog"` | 中 — 站点域名硬编码，多环境部署需手动改 |
| 2 | `src/pages/about.astro` | 50 | `href="https://astro.build"` | 低 — 外部参考链接 |
| 3 | `src/pages/about.astro` | 51 | `href="https://tailwindcss.com"` | 低 — 外部参考链接 |
| 4 | `src/pages/about.astro` | 51 | `href="https://daisyui.com"` | 低 — 外部参考链接 |
| 5 | `src/pages/about.astro` | 53 | `href="https://developer.apple.com/fonts/"` | 低 — 外部参考链接 |
| 6 | `src/pages/about.astro` | 83-86 | 同上四链接（中文版重复） | 低 — 同上 |
| 7 | `src/components/Footer.astro` | 28 | `href="https://github.com"` | 高 — 占位符链接，不指向实际 GitHub 账号 |
| 8 | `src/components/Footer.astro` | 27 | `href="/rss.xml"` | 低 — 内部链接但路径可能变化 |

---

## 二、硬编码颜色值（未使用 CSS 变量）

### 2.1 Design Token 层（colors.css — Light 主题）

| # | 文件 | 行号 | Token | 值 | 备注 |
|---|------|------|-------|-----|------|
| 1 | `src/styles/tokens/colors.css` | 49 | `--blog-color-on-primary` | `#ffffff` | 纯白色，可接受 |
| 2 | `src/styles/tokens/colors.css` | 66 | `--blog-color-on-secondary` | `#ffffff` | 纯白色，可接受 |
| 3 | `src/styles/tokens/colors.css` | 83 | `--blog-color-on-tertiary` | `#ffffff` | 纯白色，可接受 |
| 4 | `src/styles/tokens/colors.css` | 100 | `--blog-color-on-success` | `#ffffff` | 纯白色，可接受 |
| 5 | `src/styles/tokens/colors.css` | 117 | `--blog-color-on-warning` | `#1a1a1a` | 纯黑色，可接受 |
| 6 | `src/styles/tokens/colors.css` | 134 | `--blog-color-on-error` | `#ffffff` | 纯白色，可接受 |
| 7 | `src/styles/tokens/colors.css` | 147 | `--blog-color-background` | `#fbfbfd` | 硬编码 hex |
| 8 | `src/styles/tokens/colors.css` | 148 | `--blog-color-on-background` | `#1d1d1f` | 硬编码 hex |
| 9 | `src/styles/tokens/colors.css` | 150 | `--blog-color-surface` | `#ffffff` | 硬编码 hex |
| 10 | `src/styles/tokens/colors.css` | 151 | `--blog-color-on-surface` | `#1d1d1f` | 硬编码 hex |
| 11 | `src/styles/tokens/colors.css` | 152 | `--blog-color-surface-variant` | `#f2f2f7` | 硬编码 hex |
| 12 | `src/styles/tokens/colors.css` | 153 | `--blog-color-on-surface-variant` | `#6e6e73` | 硬编码 hex |
| 13 | `src/styles/tokens/colors.css` | 155 | `--blog-color-surface-raised` | `#ffffff` | 硬编码 hex |
| 14 | `src/styles/tokens/colors.css` | 156 | `--blog-color-surface-dim` | `#f5f5fa` | 硬编码 hex |
| 15 | `src/styles/tokens/colors.css` | 158 | `--blog-color-inverse-surface` | `#303030` | 硬编码 hex |
| 16 | `src/styles/tokens/colors.css` | 159 | `--blog-color-inverse-on-surface` | `#f5f5f5` | 硬编码 hex |
| 17 | `src/styles/tokens/colors.css` | 162-183 | 玻璃态变量 | `rgba(255,255,255,...)` | 硬编码 RGBA |
| 18 | `src/styles/tokens/colors.css` | 186 | `--blog-color-text-primary` | `#1d1d1f` | 硬编码 hex |
| 19 | `src/styles/tokens/colors.css` | 187 | `--blog-color-text-secondary` | `#6e6e73` | 硬编码 hex |
| 20 | `src/styles/tokens/colors.css` | 190 | `--blog-color-text-tertiary` | `#aeaeb2` | 硬编码 hex |
| 21 | `src/styles/tokens/colors.css` | 191 | `--blog-color-text-quaternary` | `#c7c7cc` | 硬编码 hex |
| 22 | `src/styles/tokens/colors.css` | 201-203 | 边框/分隔线 | `#e5e5ea`, `#d1d1d6`, `#ececf1` | 硬编码 hex |
| 23 | `src/styles/tokens/colors.css` | 206-207 | Outline | `#8e8e93`, `#c7c7cc` | 硬编码 hex |
| 24 | `src/styles/tokens/colors.css` | 214-217 | Brand 颜色 | `#C53A1B`, `#CC4A00` | 硬编码 hex |

> **说明**: 这是 Design Token 定义层，hex 值在此处是"中央定义"——严格来说不算违规硬编码，而是 Token 的参考值。真正的违规是在**组件/页面中直接使用 hex/rgba** 而不引用 Token。

### 2.2 Design Token 层（dark.css — Dark 主题）

| # | 文件 | 行号 | Token | 值 | 备注 |
|---|------|------|-------|-----|------|
| 25 | `src/styles/themes/dark.css` | 83 | `--blog-color-background` | `#0a0a0c` | 硬编码 hex |
| 26 | `src/styles/themes/dark.css` | 84 | `--blog-color-on-background` | `#f5f5f7` | 硬编码 hex |
| 27 | `src/styles/themes/dark.css` | 86-139 | surface/text/border/outline | 全部硬编码 hex | 约 20+ 行 |

### 2.3 Design Token 层（surface.css）

| # | 文件 | 行号 | 内容 | 备注 |
|---|------|------|------|------|
| 28 | `src/styles/tokens/surface.css` | 14-18 | light: `#f5f5fa` ~ `#e0e0e6` | 5 个硬编码 hex |
| 29 | `src/styles/tokens/surface.css` | 23-27 | dark: `#0e0e10` ~ `#26262a` | 5 个硬编码 hex |

### 2.4 Design Token 层（brutalist.css）

| # | 文件 | 行号 | 内容 | 备注 |
|---|------|------|------|------|
| 30 | `src/styles/tokens/brutalist.css` | 10 | `--blog-brutal-border-color: #000` | 硬编码 |
| 31 | `src/styles/tokens/brutalist.css` | 13-22 | 黄/红/蓝/绿/粉色系 hex | 每种颜色 light+dark 共 12 个 |
| 32 | `src/styles/tokens/brutalist.css` | 27, 59 | `--blog-brutal-on-accent-secondary` | 两个 hex |

### 2.5 组件/页面中的硬编码颜色

| # | 文件 | 行号 | 内容 | 风险 |
|---|------|------|------|------|
| 33 | `src/layouts/BaseLayout.astro` | 53 | `<meta name="theme-color" content="#3B5CF6" />` | 高 — 应与 Token 同步 |
| 34 | `src/components/MonetSwitcher.astro` | 33 | `value="#3B5CF6"` | 高 — 硬编码默认种子色 |
| 35 | `src/components/MonetSwitcher.astro` | 159 | `linear-gradient(135deg, #ff0055, #00ffaa, #0055ff)` | 高 — 硬编码渐变 |
| 36 | `src/styles/base/garden.css` | 58 | `rgba(128, 128, 128, 0.06)` | 中 — 种子期卡片背景 |
| 37 | `src/styles/base/garden.css` | 212 | `rgba(255, 255, 255, 0.08)` | 中 — 暗色主题边框 |
| 38 | `src/styles/base/garden.css` | 117 | `--blog-color-tertiary` (直接使用 token，非硬编码) | 0 — 这个是好的 |

### 2.6 组件中的硬编码渐变（gradient）

| # | 文件 | 行号 | 内容 |
|---|------|------|------|
| 39 | `src/components/Header.astro` | 174-178 | `linear-gradient(135deg, var(--blog-color-primary), var(--blog-color-tertiary))` |
| 40 | `src/components/Footer.astro` | 77-81 | 同上（Logo dot 渐变） |
| 41 | `src/components/MonetSwitcher.astro` | 159 | `linear-gradient(135deg, #ff0055, #00ffaa, #0055ff)` |

> 39、40 使用了 CSS 变量（好的），但渐变方向和色标位置(135deg)是硬编码的。  
> 41 颜色和方向完全硬编码。

---

## 三、硬编码字号 / 排版值（未使用 typography token）

| # | 文件 | 行号 | 内容 | 应使用 |
|---|------|------|------|--------|
| 1 | `src/components/BlogCard.astro` | 208 | `font-size: 11px` | `--blog-typescale-label-small-size` |
| 2 | `src/components/BlogCard.astro` | 210 | `letter-spacing: 0.04em` | Token |
| 3 | `src/components/BlogCard.astro` | 207 | `border-radius: var(--blog-radius-badge, 12px)` fallback 为 `12px` | Token 已定义，fallback 冗余 |
| 4 | `src/components/LanguageToggle.astro` | 57 | `font-size: 13px` | Token |
| 5 | `src/components/LanguageToggle.astro` | 58 | `font-weight: 600` | `--blog-font-weight-semibold` |
| 6 | `src/layouts/BlogPostLayout.astro` | 179 | `font-size: 11px` (代码语言标签) | Token |
| 7 | `src/components/MonetSwitcher.astro` | 162 | `font-size: 20px` | Token |
| 8 | `src/components/MonetSwitcher.astro` | 170 | `font-size: 16px` | Token |
| 9 | `src/components/MonetSwitcher.astro` | 199 | `letter-spacing: 0.05em` | Token |
| 10 | `src/components/PullQuote.astro` | 33 | `font-size: clamp(1.5rem, 3vw, 2.25rem)` | Token |
| 11 | `src/components/PullQuote.astro` | 35 | `line-height: 1.2` | Token |
| 12 | `src/components/PullQuote.astro` | 36 | `letter-spacing: -0.012em` | Token |
| 13 | `src/components/PullQuote.astro` | 64 | `letter-spacing: -0.02em` | Token |
| 14 | `src/components/PullQuote.astro` | 77 | `letter-spacing: 0.02em` | Token |
| 15 | `src/components/PullQuote.astro` | 93 | `font-size: 1.375rem` | Token |
| 16 | `src/components/Header.astro` | 161 | `letter-spacing: -0.02em` | Token |
| 17 | `src/styles/base/garden.css` | 46 | `line-height: 1.2` | Token |
| 18 | `src/styles/base/garden.css` | 87 | `line-height: 1.2` | Token |
| 19 | `src/styles/base/garden.css` | 163 | `font-size: 11px` | Token |
| 20 | `src/styles/base/garden.css` | 164 | `line-height: 1` | Token |
| 21 | `src/styles/base/garden.css` | 237 | `letter-spacing: 0.05em` | Token |
| 22 | `src/styles/base/garden.css` | 245 | `line-height: 1.3` | Token |
| 23 | `src/styles/base/garden.css` | 252 | `line-height: 1.4` | Token |
| 24 | `src/pages/about.astro` | 288 | `letter-spacing: 0.04em` | Token |
| 25 | `src/components/MDBadge.astro` | 51 | `letter-spacing: ...0.5px` (fallback) | Token |
| 26 | `src/components/MDSnackbar.astro` | 31 | `letter-spacing: ...0.25px` (fallback) | Token |
| 27 | `src/components/TextField.astro` | 51 | `line-height: 1.5` | Token |
| 28 | `src/components/TableOfContents.astro` | 159 | `line-height: 1.45` | Token |

---

## 四、硬编码间距 / 尺寸值（未使用 spacing token）

| # | 文件 | 行号 | 内容 | 风险 |
|---|------|------|------|------|
| 1 | `src/layouts/BaseLayout.astro` | 53 | `<meta ...>` — 无 spacing 但属硬编码值 | 中 |
| 2 | `src/pages/index.astro` | 38,90,118 | `style="gap: 8px"` | 中 — 应使用 `--blog-space-2` |
| 3 | `src/pages/about.astro` | 153 | `style="gap: 16px; max-width: 400px"` | 高 — 多处内联 |
| 4 | `src/pages/about.astro` | 270 | `gap: 4px` (surface-showcase) | 中 |
| 5 | `src/pages/about.astro` | 275 | `height: 64px` (surface-swatch) | 中 |
| 6 | `src/components/BlogCard.astro` | 44 | `style="gap: 6px"` | 中 |
| 7 | `src/components/BlogCard.astro` | 99 | `transform: translateY(-2px)` | 低 |
| 8 | `src/components/BlogCard.astro` | 113 | `transform: translate(-2px, -2px)` | 低 |
| 9 | `src/components/BlogCard.astro` | 206 | `padding: 2px 8px` | 中 |
| 10 | `src/components/BlogCard.astro` | 151 | `transform: scale(1.03)` | 低 |
| 11 | `src/components/Header.astro` | 63 | `padding: 12px 16px 0` | 高 |
| 12 | `src/components/Header.astro` | 73 | `max-width: 980px` | 高 |
| 13 | `src/components/Header.astro` | 75 | `border-radius: 18px` | 高 |
| 14 | `src/components/Header.astro` | 108 | `left: -150%` | 中 |
| 15 | `src/components/Header.astro` | 112 | `transform: skewX(-25deg)` | 低 |
| 16 | `src/components/Header.astro` | 113 | `transition: left 0.75s cubic-bezier(0.16, 1, 0.3, 1)` | 中 — 动画时间硬编码 |
| 17 | `src/components/Header.astro` | 119 | `transform: translateY(1px)` | 低 |
| 18 | `src/components/Header.astro` | 147 | `height: 54px` | 高 |
| 19 | `src/components/Header.astro` | 148 | `padding: 0 24px` | 中 |
| 20 | `src/components/Header.astro` | 171-172 | `width: 10px; height: 10px` (logo-dot) | 中 |
| 21 | `src/components/Header.astro` | 191 | `border-radius: 10px` | 中 |
| 22 | `src/components/Header.astro` | 234 | `border-radius: 10px` | 中 |
| 23 | `src/components/Header.astro` | 247 | `padding-top: 6px` | 中 |
| 24 | `src/components/Header.astro` | 253 | `padding: 8px 10px 0` | 中 |
| 25 | `src/components/Header.astro` | 257 | `border-radius: 14px` | 中 |
| 26 | `src/components/Header.astro` | 261 | `height: 48px` | 中 |
| 27 | `src/components/Header.astro` | 262 | `padding: 0 14px` | 中 |
| 28 | `src/components/Footer.astro` | 58 | `max-width: 280px` | 中 |
| 29 | `src/components/Footer.astro` | 74-75 | `width: 10px; height: 10px` (logo-dot) | 中 |
| 30 | `src/components/MDSwitch.astro` | 79-80 | `width: 52px; height: 32px` | 高 — M3 组件尺寸 |
| 31 | `src/components/MDSwitch.astro` | 99-100 | `width: 16px; height: 16px` (thumb) | 中 |
| 32 | `src/components/MDSwitch.astro` | 117-118 | `width: 12px; height: 12px` (icon) | 中 |
| 33 | `src/components/MDSwitch.astro` | 145-146 | `width: 24px; height: 24px` (checked) | 中 |
| 34 | `src/components/MDSwitch.astro` | 166 | `width: 28px` (dragging) | 中 |
| 35 | `src/components/MDButton.astro` | 61 | `gap: 8px` | 中 |
| 36 | `src/components/MDButton.astro` | 62 | `height: 40px` | 高 |
| 37 | `src/components/MDButton.astro` | 192 | `height: 56px` (FAB) | 高 |
| 38 | `src/components/MDButton.astro` | 193 | `min-width: 56px` (FAB) | 高 |
| 39 | `src/components/MDButton.astro` | 220 | `gap: 8px` (FAB extended) | 中 |
| 40 | `src/components/MDBadge.astro` | 39 | `line-height: 1` | 中 |
| 41 | `src/components/MDBadge.astro` | 45-46 | `height: 16px; min-width: 16px` | 高 |
| 42 | `src/components/MDBadge.astro` | 56-57 | `width: 6px; height: 6px` (dot) | 中 |
| 43 | `src/components/Chip.astro` | 60 | `gap: 8px` | 中 |
| 44 | `src/components/Chip.astro` | 61 | `height: 32px` | 高 |
| 45 | `src/components/Chip.astro` | 63 | `border-radius: 8px` | 中 |
| 46 | `src/components/Chip.astro` | 149-150 | `width: 24px; height: 24px` (icon) | 中 |
| 47 | `src/components/Chip.astro` | 175-176 | `width: 18px; height: 18px` (small icon) | 中 |
| 48 | `src/components/Chip.astro` | 185 | `max-width: 200px` | 中 |
| 49 | `src/components/MonetSwitcher.astro` | 51-52 | `width: 36px; height: 36px` | 中 |
| 50 | `src/components/MonetSwitcher.astro` | 67-68 | `width: 14px; height: 14px` (icon) | 中 |
| 51 | `src/components/MonetSwitcher.astro` | 86 | `width: 256px` (dropdown) | 中 |
| 52 | `src/components/MonetSwitcher.astro` | 123-124 | `width: 36px; height: 36px` (preset swatch) | 中 |
| 53 | `src/components/MDSnackbar.astro` | 20 | `gap: 24px` | 中 |
| 54 | `src/components/MDSnackbar.astro` | 21 | `min-width: 344px` | 中 |
| 55 | `src/components/MDSnackbar.astro` | 22 | `max-width: 568px` | 中 |
| 56 | `src/components/MDSnackbar.astro` | 23 | `padding: 14px 16px` | 高 |
| 57 | `src/components/SearchBar.astro` | 54 | `height: 48px` | 高 |
| 58 | `src/components/SearchBar.astro` | 113-114 | `width: 28px; height: 28px` | 中 |
| 59 | `src/components/TableOfContents.astro` | 121 | `width: 220px` | 中 |
| 60 | `src/components/TableOfContents.astro` | 142 | `gap: 2px` | 低 |
| 61 | `src/components/TableOfContents.astro` | 157 | `padding: 4px 0` | 中 |
| 62 | `src/components/TextField.astro` | 41 | `gap: 4px` | 中 |
| 63 | `src/components/TextField.astro` | 42 | `min-height: 56px` | 高 |
| 64 | `src/components/TextField.astro` | 42 | `border-radius: 4px 4px 0 0` | 高 |
| 65 | `src/components/TextField.astro` | 49 | `padding: 24px 16px 8px` | 中 |
| 66 | `src/components/TextField.astro` | 50 | `padding: 16px` | 中 |
| 67 | `src/components/TextField.astro` | 78 | `width: 24px; height: 24px` | 中 |
| 68 | `src/components/ThemeToggle.astro` | 62-63 | `width: 40px; height: 40px` | 中 |
| 69 | `src/components/LanguageToggle.astro` | 61 | `width: 20px` | 中 |
| 70 | `src/components/PullQuote.astro` | 43 | `max-width: 540px` | 中 |
| 71 | `src/components/PullQuote.astro` | 54 | `max-width: 640px` | 中 |
| 72 | `src/components/FilterGroup.astro` | 21 | `style="margin-top: 12px; ... gap: 8px"` | 高 — 内联硬编码 |
| 73 | `src/components/FilterGroup.astro` | 22 | `style="gap: 8px"` | 中 |
| 74 | `src/components/FilterGroup.astro` | 26 | `style="gap: 8px"` | 中 |
| 75 | `src/layouts/BaseLayout.astro` | 53 | `content="#3B5CF6"` meta theme-color | 高 |
| 76 | `src/styles/base/garden.css` | 186 | `width: 280px` (tooltip) | 中 |
| 77 | `src/styles/base/garden.css` | 226-227 | `width: 6px; height: 6px` (dot) | 中 |
| 78 | `src/styles/base/garden.css` | 114-115 | `width: 8px; height: 8px` | 中 |
| 79 | `src/styles/base/garden.css` | 42, 52, 83 | padding / font-size | 中 |
| 80 | `src/styles/pages/home.css` | 112-113 | `width: 700px; height: 700px` (blob) | 中 |
| 81 | `src/styles/pages/home.css` | 170-171 | `width: 800px; height: 800px` (blob) | 中 |
| 82 | `src/styles/pages/home.css` | 233 | `min-width: 260px` | 中 |
| 83 | `src/styles/base/editorial.css` | 112-113 | `width: 700px; height: 700px` (blob) | 中 |
| 84 | `src/styles/base/editorial.css` | 170-171 | `width: 800px; height: 800px` (blob) | 中 |
| 85 | `src/styles/base/editorial.css` | 226 | `min-width: 260px` | 中 |
| 86 | `src/styles/base/filters.css` | 15 | `max-width: 480px` | 中 |
| 87 | `src/styles/base/filters.css` | 37 | `height: 32px` (chip) | 中 |
| 88 | `src/styles/pages/blog.css` | 26 | `max-width: 480px` | 中 |
| 89 | `src/styles/pages/blog.css` | 48 | `height: 32px` (chip) | 中 |
| 90 | `src/styles/pages/blog.css` | 105-106 | `width: 14px; height: 14px` | 中 |
| 91 | `src/styles/base/filters.css` | 156-157 | `width: 14px; height: 14px` | 中 |
| 92 | `src/layouts/PageLayout.astro` | 24 | `max-width: 800px` | 中 |
| 93 | `src/layouts/HeroLayout.astro` | 35 | `max-width: 1200px` | 中 |
| 94 | `src/layouts/BlogListLayout.astro` | 35 | `max-width: 1200px` | 中 |
| 95 | `src/layouts/WideLayout.astro` | 25 | `max-width: 1200px` | 中 |
| 96 | `src/styles/base/global.css` | 165 | `max-width: 800px` (.container-narrow) | 中 |
| 97 | `src/styles/base/global.css` | 172 | `max-width: 1200px` (.container-wide) | 中 |

---

## 五、硬编码字符串 / 文本内容（未使用 i18n）

| # | 文件 | 行号 | 内容 | 风险 |
|---|------|------|------|------|
| 1 | `src/pages/index.astro` | 25-26 | `title="M3E — Design & Technology Blog"` | 高 — 应使用 i18n |
| 2 | `src/pages/about.astro` | 9 | `title="About — M3E"` | 高 — 应使用 i18n |
| 3 | `src/pages/about.astro` | 9 | `description="About the author..."` | 中 |
| 4 | `src/pages/about.astro` | 26 | `"Hi, I'm the creator of M3E..."` | 0 — 是 i18n-en 内的内容，结构正确 |
| 5 | `src/pages/blog/index.astro` | 33 | `placeholder="Search articles, tags or descriptions..."` | 高 — 应使用 i18n（且有中英两份） |
| 6 | `src/pages/blog/index.astro` | 90 | 同样硬编码在 JS 中 | 高 — 同上 |
| 7 | `src/pages/blog/index.astro` | 122-126 | CSS transition 字符串 `"transform 200ms ..."` | 低 |
| 8 | `src/pages/blog/index.astro` | 145-147 | `isZh ? "没有找到匹配..." : "No articles found..."` | 高 — 应使用 i18n |
| 9 | `src/components/BlogCard.astro` | 15-18 | `"en-US"`, `"numeric"`, `"long"`, `"numeric"` 日期格式 | 中 — 日期格式化 locale |
| 10 | `src/components/BlogCard.astro` | 48 | `langTag.toUpperCase() === "ZH" ? "中文" : "EN"` | 中 — 语言标签硬编码 |
| 11 | `src/components/BlogCard.astro` | 53 | `growthStage === "evergreen" ? "🌳" : ...` emoji 映射 | 高 — 逻辑硬编码在组件中 |
| 12 | `src/layouts/BlogPostLayout.astro` | 22 | 代码块语言标签 SVG label 硬编码 | 中 |
| 13 | `src/components/Header.astro` | 21 | `"M3E"` logo 文本 | 低 — 品牌名 |
| 14 | `src/components/Footer.astro` | 11 | `"M3E"` logo 文本 | 低 — 同上 |
| 15 | `src/components/Footer.astro` | 28 | `"GitHub"` 文本 | 中 — 可 i18n |

---

## 六、硬编码响应式断点

| # | 文件 | 行号 | 断点值 | 出现次数 |
|---|------|------|--------|----------|
| 1 | `src/components/Header.astro` | 251 | `max-width: 768px` | 1 |
| 2 | `src/components/Footer.astro` | 118 | `max-width: 600px` | 1 |
| 3 | `src/components/PullQuote.astro` | 87 | `max-width: 640px` | 1 |
| 4 | `src/components/MDSnackbar.astro` | 76 | `max-width: 480px` | 1 |
| 5 | `src/components/TableOfContents.astro` | 183 | `max-width: 1024px` | 1 |
| 6 | `src/layouts/SplitLayout.astro` | 67 | `max-width: 1024px` | 1 |
| 7 | `src/styles/pages/home.css` | 217 | `max-width: 768px` | 1 |
| 8 | `src/styles/pages/home.css` | 247 | `max-width: 600px` | 1 |
| 9 | `src/styles/pages/blog.css` | 152 | `max-width: 768px` | 1 |
| 10 | `src/styles/pages/blog.css` | 160 | `max-width: 600px` | 1 |
| 11 | `src/styles/base/global.css` | 210,216 | `768px`, `769px` | 2 |
| 12 | `src/styles/base/layouts.css` | 20 | `max-width: 600px` | 1 |
| 13 | `src/styles/base/filters.css` | 199 | `max-width: 768px` | 1 |
| 14 | `src/styles/base/editorial.css` | 210 | `max-width: 768px` | 1 |

> **共 15 处硬编码断点，涉及 5 种不同断点值**：`480px`, `600px`, `640px`, `768px`, `769px`, `1024px`。缺少集中的断点 token 管理。

---

## 七、硬编码配置值

| # | 文件 | 行号 | 内容 | 风险 |
|---|------|------|------|------|
| 1 | `astro.config.mjs` | 16 | `pathFormat: "obsidian-absolute"` | 低 — 框架配置 |
| 2 | `astro.config.mjs` | 17 | `hrefTemplate: (permalink) => '/blog/${permalink}'` | 低 — 路由模板 |
| 3 | `astro.config.mjs` | 22 | `theme: "css-variables"` | 低 — Shiki 配置 |
| 4 | `src/utils/monet.ts` | 265-274 | `MONET_PRESETS` 数组 — 8 个预设的种子色 | 中 — 硬编码在源码而非配置文件 |
| 5 | `src/utils/monet.ts` | 276-282 | `MONET_VARIANTS` 数组 — 5 个变体 | 中 — 同上 |
| 6 | `src/utils/monet.ts` | 179-226 | `SCHEME_TOKENS` — tone 映射值 | 低 — 算法配置 |
| 7 | `src/content/config.ts` | 14 | `growthStage: z.enum(["seedling", "budding", "evergreen"])` | 中 — 枚举硬编码 |
| 8 | `src/content/filter-config.ts` | 14-50 | `tagConfig` 全部标签映射 | 中 — 配置文件性质 |
| 9 | `src/content/filter-config.ts` | 52-71 | `stageConfig` 阶段映射 | 中 — 同上 |
| 10 | `scripts/check-contrast.mjs` | 117-118 | 硬编码文件路径 `'src/styles/tokens/colors.css'` 等 | 低 |
| 11 | `scripts/generate-monet.mjs` | 34 | `OUTPUT_DIR = resolve(__dirname, "..", "public", "monet")` | 低 |
| 12 | `scripts/generate-monet.mjs` | 36-45 | `PRESETS` — 与 monet.ts 中 `MONET_PRESETS` **重复定义** | 高 |

---

## 八、硬编码 JSON/数据属性值

| # | 文件 | 行号 | 内容 |
|---|------|------|------|
| 1 | `src/pages/blog/index.astro` | 51 | `["seedling", "budding", "evergreen"]` 数组硬编码 |
| 2 | `src/pages/blog/index.astro` | 112 | `card.dataset.stage \|\| "seedling"` fallback |
| 3 | `src/components/Header.astro` | 76-83 | `backdrop-filter: saturate(190%) blur(24px)` |
| 4 | `src/components/Header.astro` | 90 | `transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)` |
| 5 | `src/components/Header.astro` | 113 | `transition: left 0.75s cubic-bezier(...)` |

---

## 九、硬编码 SVG 图标（内联）

以下组件包含**完全内联的 SVG 图标**，无法通过图标系统替换：

| # | 文件 | 行数 | 图标用途 |
|---|------|------|----------|
| 1 | `src/pages/index.astro` | 52-54 | 箭头图标 (hero CTA) |
| 2 | `src/pages/index.astro` | 126-128 | 箭头图标 (view all) |
| 3 | `src/pages/about.astro` | 16-20 | 头像 SVG (circle + ellipse) |
| 4 | `src/pages/about.astro` | 105 | 搜索图标 (SVG) |
| 5 | `src/pages/about.astro` | 131 | 加号图标 (SVG) |
| 6 | `src/components/Header.astro` | 40-44 | 汉堡菜单图标 |
| 7 | `src/components/ThemeToggle.astro` | 12-32 | 太阳图标 |
| 8 | `src/components/ThemeToggle.astro` | 35-48 | 月亮图标 |
| 9 | `src/components/LanguageToggle.astro` | 12-27 | 地球图标 |
| 10 | `src/content/filter-config.ts` | 25, 32 | CSS/Astro 品牌图标 |

> 共 **10 处**硬编码内联 SVG，缺乏图标组件抽象。

---

## 十、魔法数字（scripts/ 和 TS 中）

### 10.1 scripts/check-contrast.mjs

| # | 行号 | 内容 |
|---|------|------|
| 1 | 103 | `iterations < 10` — var 解析最大深度 |
| 2 | 176 | `contrast >= 4.5` — WCAG AA 阈值 |

### 10.2 scripts/generate-monet.mjs

| # | 行号 | 内容 |
|---|------|------|
| 3 | 128-129 | `contrastLevel: 0.0` — 硬编码对比度级别 |

### 10.3 src/utils/monet.ts

| # | 行号 | 内容 |
|---|------|------|
| 4 | 96 | `tone < 10 ? C * 0.3 : tone > 90 ? C * 0.4` — chroma 缩放 |
| 5 | 116-157 | 大量魔术数字: `0.22`, `0.8`, `0.16`, `0.03`, `0.06`, `60`, `120`, `30` |
| 6 | 160-166 | palette L 固定 `0.5`, error H 固定 `25` |
| 7 | 181-226 | tone 映射: `40, 100, 90, 10, 80, 20, 30, 98, 6, ...` |

### 10.4 src/pages/blog/index.astro (客户端 JS)

| # | 行号 | 内容 |
|---|------|------|
| 8 | 122 | `"translateY(8px)"` — 动画偏移 |
| 9 | 124-125 | `"opacity 200ms ..."`, `"transform 200ms ..."` — 动画时长 |
| 10 | 90 | `"搜索文章、标签或描述..."` / `"Search articles..."` — 重复 i18n |

---

## 十一、内容 Markdown 文件 frontmatter 中的硬编码

所有 4 个 Markdown 文件（`apple-meets-material3.md`, `apple-meets-material3-zh.md`, `astro-content-first-framework.md`, `building-token-design-system.md`）的 frontmatter 都包含硬编码的：

- `publishedAt` 日期（2026-05-15 ~ 2026-05-28）
- `tags` 数组
- `featured` 布尔值
- `growthStage` 枚举值
- `knowledgeDomain` 字符串

> 这些属于内容数据，不算架构层面的硬编码违规，但 `growthStage` 值与 `src/content/config.ts` 中的 z.enum 定义要保持同步。

---

## 十二、重复定义 / 不一致

| # | 问题 | 位置 |
|---|------|------|
| 1 | Monet 预设颜色在 `src/utils/monet.ts` 和 `scripts/generate-monet.mjs` 中**重复定义**（8个预设） | monet.ts:265-274 vs generate-monet.mjs:36-45 |
| 2 | CSS 中 `.container-narrow` (800px) vs 各 Layout 中各自定义 max-width | 至少有 4 处重复 1200px / 800px |
| 3 | Logo dot 样式在 Header 和 Footer 中**完全重复** | Header:171-179, Footer:73-82 |
| 4 | 箭头 SVG icon 在 index.astro 中出现 2 次 | index.astro:52-54, 126-128 |
| 5 | `growthStage` emoji 映射在 BlogCard.astro 和 filter-config 中重复逻辑 | BlogCard.astro:53, filter-config.ts:52-71 |
| 6 | 博客列表搜索 placeholder 在 `src/pages/blog/index.astro` 和 `src/i18n/translations.ts` 中重复（但不完全一致） | index.astro:33 vs translations.ts:43 |

---

## 统计汇总

| 类别 | 数量 |
|------|------|
| 硬编码 URL / 外部链接 | 8 |
| 硬编码颜色值（组件/页面、非 Token 层） | 6 |
| 硬编码字号/排版值 | 28 |
| 硬编码间距/尺寸值 | 97 |
| 硬编码字符串/i18n 缺失 | 15 |
| 硬编码响应式断点 | 15（涉及 5 种断点值） |
| 硬编码配置值 | 12 |
| 硬编码 SVG 图标 | 10 |
| 魔法数字 | 10（组） |
| 重复定义/不一致 | 6 |
| **总计** | **约 207 处** |

---

## 重点问题（按优先级）

### P0 — 应立即修复
1. **`BaseLayout.astro:53`** — `<meta name="theme-color" content="#3B5CF6">` 应与当前主题色同步
2. **`Footer.astro:28`** — `https://github.com` 是占位符，非实际仓库链接
3. **`MonetSwitcher.astro:33,159`** — 默认种子色 `#3B5CF6` 和渐变色硬编码

### P1 — 建议尽快修复
4. **断点系统** — 15 处分散的硬编码断点，应抽象为 `--blog-breakpoint-*` token
5. **Monet 预设重复** — `monet.ts` 和 `generate-monet.mjs` 重复定义
6. **组件间距/尺寸** — 97 处硬编码的 px 值应迁移至 spacing token
7. **博客搜索 i18n** — 中英文搜索提示在 JS 中硬编码

### P2 — 可渐进改进
8. **SVG 图标** — 10 处内联 SVG 无抽象
9. **Logo dot 样式重复** — Header/Footer 各一份
10. **硬编码动画值** — 多处 `cubic-bezier` 和 transition duration 未使用 motion token
11. **排版 token** — 28 处未使用 typography token

---

*排查范围: src/ (30 astro + 22 css + 4 ts + 4 md) + scripts/ (2) + 根配置 (2)*
*未排查: node_modules/, dist/, public/*, .workbuddy/*, dev-err.txt, dev-out.txt*
