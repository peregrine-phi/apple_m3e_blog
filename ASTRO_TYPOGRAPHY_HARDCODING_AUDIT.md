# .astro 文件字体与排版硬编码审计

> 检查范围：`packages/framework/src/**/*.astro` 全部文件
> 检查目标：与字体和排版相关的不合法硬编码（未引用 token 的写法）
> 生成时间：2026-06-03

---

## 发现问题汇总

### P0 — 必须修复

#### 1. `BlogCard.astro` 第 209 行：`font-weight: 700`

\`\`\`astro
<!-- 当前（错误） -->
.blog-card-lang {
  font-weight: 700;  /* ← 硬编码！*/
}
\`\`\`

**问题**：字重直接写数字 `700`，未引用 token。

**应改为**：
\`\`\`astro
.blog-card-lang {
  font-weight: var(--blog-font-weight-bold); /* 对应 700 */
}
\`\`\`

**影响**：当用户切换排版主题（如切换到更粗的标题主题）时，语言标签的字重不会跟随变化。

---

#### 2. `Chip.astro` 第 70 行：`line-height: 1`

\`\`\`astro
<!-- 当前（错误） -->
.chip {
  line-height: 1;  /* ← 硬编码！*/
}
\`\`\`

**问题**：行高写死为 `1`，未引用 token。

**应改为**：
\`\`\`astro
.chip {
  line-height: var(--blog-typescale-label-large-leading); /* 1.3 */
}
\`\`\`

**影响**：Chip 组件的行高不会跟随排版主题变化。

---

### P1 — 应该修复

#### 3. `AboutPage.astro` 第 285 行：`letter-spacing: 0.04em`

\`\`\`astro
<!-- 当前（错误） -->
.surface-swatch span {
  letter-spacing: 0.04em;  /* ← 硬编码！*/
}
\`\`\`

**问题**：字符间距直接写 `em` 值，未引用 token。

**应改为**：建议在 `typography.css` 中新增 `--blog-typescale-label-small-tracking` 已在 token 中定义为 `0.04em`，直接引用即可：
\`\`\`astro
.surface-swatch span {
  letter-spacing: var(--blog-typescale-label-small-tracking);
}
\`\`\`

---

### P2 — 建议修复（行内样式中的硬编码）

#### 4. `AboutPage.astro` 第 125 行：行内样式 `max-width: 400px`

\`\`\`astro
<div class="showcase-row" style="flex-direction: column; gap: var(--blog-space-4); max-width: 400px;">
\`\`\`

**问题**：`max-width: 400px` 硬编码在行内样式中。

**建议**：这是 demo 展示页面，影响有限。若要 token 化，可新增 `--blog-showcase-textfield-width: 400px` 或在 `breakpoints.css` 中定义。

---

#### 5. `BlogCard.astro` 第 127–128 行：焦点环 `box-shadow` 中的 `px` 值

\`\`\`astro
.blog-card-link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--blog-color-background),
    0 0 0 4px var(--blog-color-primary);
}
\`\`\`

**问题**：`2px` 和 `4px` 是焦点环的宽度，硬编码。

**建议**：这两个值是无障碍焦点环的标准做法，硬编码影响较小。若要极致 token 化，可新增 `--blog-focus-ring-width: 2px` 和 `--blog-focus-ring-offset: 4px`。

---


## 未发现问题（值得肯定的地方）

以下属性在 .astro 文件中已正确使用 token：

| 属性 | 使用情况 |
|------|----------|
| `font-size` | ✅ 全部通过 `var(--blog-typescale-*-size)` 引用 |
| `font-family` | ✅ 全部通过 `var(--blog-font-sans)` 或 `inherit` 引用 |
| `letter-spacing`（大部分） | ✅ 大部分通过 `var(--blog-typescale-*-tracking)` 引用 |
| `line-height`（大部分） | ✅ 大部分通过 `var(--blog-typescale-*-leading)` 引用 |

---

## 与 CSS 文件审计的对比

| 问题类型 | CSS 文件 | .astro 文件 |
|----------|-----------|--------------|
| `font-weight` 硬编码 | 0 处 | 1 处（P0） |
| `line-height` 硬编码 | 2 处（P0） | 1 处（P0） |
| `letter-spacing` 硬编码 | 0 处 | 1 处（P1） |
| `font-size` 硬编码 | 1 处（P0） | 0 处 |
| `text-*` 属性硬编码 | 2 处（P1） | 0 处 |

---

## 修复优先级建议

**编号列表版：**

1. \*\*P0 先修\*\*：`BlogCard.astro:209`（`font-weight: 700`）、`Chip.astro:70`（`line-height: 1`）
2. \*\*P1 再修\*\*：`AboutPage.astro:285`（`letter-spacing: 0.04em`）
3. \*\*P2 最后\*\*：行内样式和焦点环的硬编码，影响较小，可延后处理

**无编号版：**

- \*\*P0 先修\*\*：`BlogCard.astro:209`（`font-weight: 700`）、`Chip.astro:70`（`line-height: 1`）
- \*\*P1 再修\*\*：`AboutPage.astro:285`（`letter-spacing: 0.04em`）
- \*\*P2 最后\*\*：行内样式和焦点环的硬编码，影响较小，可延后处理

---

## 下一步行动

要开始修复这些问题吗？我可以：

**编号列表版：**

1. 先修复 P0 的两个硬编码问题（`BlogCard.astro` 和 `Chip.astro`）
2. 修复 P1 问题（`AboutPage.astro`）
3. 可选：一并修复 CSS 文件中的 P0 问题（上一份报告中的 3 个）

**无编号版：**

- 先修复 P0 的两个硬编码问题（`BlogCard.astro` 和 `Chip.astro`）
- 修复 P1 问题（`AboutPage.astro`）
- 可选：一并修复 CSS 文件中的 P0 问题（上一份报告中的 3 个）
