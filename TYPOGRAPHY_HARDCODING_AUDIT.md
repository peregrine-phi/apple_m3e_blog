# 字体与排版硬编码审计报告

> 检查范围：\`packages/framework/src/styles/**\` 全部 CSS 文件
> 检查目标：与字体和排版相关的不合法硬编码（未引用 token 的写法）
> 生成时间：2026-06-03

---

## 方法论

判断"不合法硬编码"的标准：

1. \`font-size\` 直接写 \`px\`/\`rem\` 值，而非引用 \`var(--blog-typescale-*-size)\`
2. \`line-height\` 在组件 token 中写死数值，而非引用 \`var(--blog-typescale-*-leading)\`
3. \`font-weight\` 直接写数字，而非引用 \`var(--blog-font-weight-*)\`
4. \`font-family\` 直接写字体名，而非引用 \`var(--blog-font-*)\`
5. \`letter-spacing\` 直接写 \`em\` 值，而非引用 \`var(--blog-typescale-*-tracking)\`
6. \`text-underline-offset\` / \`text-decoration-thickness\` 直接写 \`px\`，未 token 化
7. \`font\` shorthand 直接写值，而非引用 \`var(--blog-typescale-*)\` composite token

---

## 发现问题汇总

### P0 — 必须修复（排版 token 完全未引用）

#### 1. \`prose.css\` 第 109 行：\`font-size: 11px\`

\`\`\`css
/* 当前（错误） */
.copy-code-btn {
  font-size: 11px;  /* ← 硬编码！*/
}
\`\`\`

**问题**：代码复制按钮的字体大小硬编码为 \`11px\`，未引用任何 token。

**应改为**：
\`\`\`css
.copy-code-btn {
  font-size: var(--blog-typescale-label-small-size); /* 0.6875rem ≈ 11px */
}
\`\`\`

**影响**：当用户切换排版主题时，这个按钮的字号不会跟随变化。

---

#### 2. \`badge.css\` 第 8 行：\`--badge-line-height: 1\`

\`\`\`css
/* 当前（错误） */
:root {
  --badge-line-height: 1;  /* ← 硬编码！*/
}
\`\`\`

**问题**：Badge 组件的行高写死为 \`1\`，未引用 token。

**应改为**：
\`\`\`css
:root {
  --badge-line-height: var(--blog-typescale-label-small-leading); /* 1.3 */
}
\`\`\`

**影响**：Badge 的行高不会跟随排版主题变化。

---

#### 3. \`textfield.css\` 第 10 行：\`--textfield-line-height: 1.5\`

\`\`\`css
/* 当前（错误） */
:root {
  --textfield-line-height: 1.5;  /* ← 硬编码！*/
}
\`\`\`

**问题**：TextField 组件的行高写死为 \`1.5\`，未引用 token。

**应改为**（需在 \`typography.css\` 中新增对应的 body-medium leading token 引用，或直接使用）：
\`\`\`css
:root {
  --textfield-line-height: var(--blog-typescale-body-medium-leading); /* 1.65 */
}
\`\`\`


---

### P1 — 应该修复（排版相关属性未 token 化）

#### 4. \`prose.css\` 第 49 行：\`text-underline-offset: 4px\`

\`\`\`css
:is(.post-content, .about-text) a {
  text-underline-offset: 4px;  /* ← 硬编码 */
}
\`\`\`

**应改为**：建议在 \`typography.css\` 中新增 \`--blog-typescale-link-underline-offset\` token，然后引用。

\`\`\`css
:is(.post-content, .about-text) a {
  text-underline-offset: var(--blog-typescale-link-underline-offset, 4px);
}
\`\`\`

---

#### 5. \`prose.css\` 第 50 行：\`text-decoration-thickness: 1px\`

\`\`\`css
:is(.post-content, .about-text) a {
  text-decoration-thickness: 1px;  /* ← 硬编码 */
}
\`\`\`

**应改为**：建议在 \`typography.css\` 中新增 \`--blog-typescale-link-decoration-thickness\` token。

\`\`\`css
:is(.post-content, .about-text) a {
  text-decoration-thickness: var(--blog-typescale-link-decoration-thickness, 1px);
}
\`\`\`


---

### P2 — 建议修复（组件内间距硬编码，间接影响排版）

以下问题不是严格的"字体排版属性"，但影响文字布局，建议一并 token 化：

#### 6. \`prose.css\` 第 77 行：\`padding-top: calc(var(--blog-space-5) + 16px)\`

\`\`\`css
:is(.post-content, .about-text) pre {
  padding-top: calc(var(--blog-space-5) + 16px);  /* ← 16px 硬编码 */
}
\`\`\`

**应改为**：\`16px\` 是给代码语言标签留的空间，建议定义为 \`--blog-prose-code-tag-height\` token。

---

#### 7. \`prose.css\` 第 105–108 行（.copy-code-btn 间距）

\`\`\`css
.copy-code-btn {
  top: 8px;      /* ← 硬编码 */
  right: 8px;     /* ← 硬编码 */
  height: 28px;    /* ← 硬编码 */
  padding: 0 10px; /* ← 硬编码 */
}
\`\`\`

**应改为**：建议定义 \`--blog-prose-copy-btn-inset\` 和 \`--blog-prose-copy-btn-height\` token。

---

#### 8. \`filters.css\` / \`blog.css\` 第 38/49 行：\`.filter-chip\` padding

\`\`\`css
.filter-chip {
  padding: 0 16px; /* ← 硬编码，两文件重复 */
}
\`\`\`

**应改为**：建议在 \`filters.css\` 或 \`chips.css\` 中定义 \`--chip-padding-x\` token（已在 \`chips.css\` 中定义，但 \`filters.css\`/\`blog.css\` 未引用）。

---

#### 9. \`filters.css\` 第 158 行 / \`blog.css\` 第 107 行：\`.chip-icon-state\` margin

\`\`\`css
.chip-icon-state {
  margin-left: 6px; /* ← 硬编码 */
}
\`\`\`

**应改为**：建议使用 \`var(--blog-space-1)\`（4px）或 \`var(--blog-space-2)\`（8px），或定义 \`--chip-icon-gap\`。


---

## 未发现问题（值得肯定的地方）

以下属性在项目中已正确使用 token，无硬编码：

| 属性 | 使用情况 |
|------|----------|
| \`font-family\` | ✅ 全部通过 \`var(--blog-font-sans)\` / \`serif\` / \`mono\` 引用 |
| \`font-weight\` | ✅ 全部通过 \`var(--blog-font-weight-*)\` 引用 |
| \`letter-spacing\` | ✅ 全部通过 \`var(--blog-typescale-*-tracking)\` 引用 |
| \`font\` (shorthand) | ✅ 全部通过 \`var(--blog-typescale-*)\` composite token 引用 |
| \`line-height\` (prose/global) | ✅ 在 \`prose.css\` 和 \`global.css\` 中正确使用 token |

---

## 修复优先级建议

**编号列表版：**

1. \*\*P0 先修\*\*：\`prose.css:109\` (\`font-size: 11px\`)、\`badge.css:8\` (\`--badge-line-height: 1\`)、\`textfield.css:10\` (\`--textfield-line-height: 1.5\`)
2. \*\*P1 再修\*\*：\`prose.css:49\` (\`text-underline-offset\`)、\`prose.css:50\` (\`text-decoration-thickness\`)
3. \*\*P2 最后\*\*：间距类硬编码，在做排版主题切换功能时一并处理

**无编号版：**

- \*\*P0 先修\*\*：\`prose.css:109\` (\`font-size: 11px\`)、\`badge.css:8\` (\`--badge-line-height: 1\`)、\`textfield.css:10\` (\`--textfield-line-height: 1.5\`)
- \*\*P1 再修\*\*：\`prose.css:49\` (\`text-underline-offset\`)、\`prose.css:50\` (\`text-decoration-thickness\`)
- \*\*P2 最后\*\*：间距类硬编码，在做排版主题切换功能时一并处理

---

## 附：关于 \`typography.css\` 第 29 行 Bug 的核实

\`cb_summary\` 中记录了一个 bug：

> \`typography.css\` 第 29 行：\`--blog-typescale-display-large-weight: var(-blog-font-weight-bold);\` 缺少第二个短横线

\*\*实地核实结果\*\*：当前文件第 29 行写法正确，为 \`var(--blog-font-weight-bold)\`，bug 已在之前被修复。

---

## 下一步行动

要开始修复这些问题吗？我可以：

**编号列表版：**

1. 先修复 P0 的三个硬编码问题（\`prose.css\`、\`badge.css\`、\`textfield.css\`）
2. 在 \`typography.css\` 中新增 \`--blog-typescale-link-underline-offset\` 和 \`--blog-typescale-link-decoration-thickness\` token
3. 修复 P1 问题，让 \`prose.css\` 引用这两个新 token

**无编号版：**

- 先修复 P0 的三个硬编码问题（\`prose.css\`、\`badge.css\`、\`textfield.css\`）
- 在 \`typography.css\` 中新增 \`--blog-typescale-link-underline-offset\` 和 \`--blog-typescale-link-decoration-thickness\` token
- 修复 P1 问题，让 \`prose.css\` 引用这两个新 token
