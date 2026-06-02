---
title: "关于作者"
---
你好，我是 M3E 的创作者 —— 一个关于设计系统理论与前端技艺交汇点的个人博客。

「M3E」即 **Material 3 Expressive × Apple HIG** 的融合设计语言 — 将 HIG 的克制精准与 Material 3 的表现活力融为一体。这个博客本身就是这种融合成形的实验场。

## 设计哲学

- **Token 优先，始终如此。** 每一个视觉决策 — 颜色、字体、间距、动效 — 都存在于 CSS 自定义属性中，无一例外。
- **渐进增强。** 页面在无 JavaScript 时完全可用，交互性按需以隔离「岛屿」叠加。
- **无障碍内建。** WCAG 2.1 AA 对比度、键盘导航和屏幕阅读器语义是内建的，而非事后附加。
- **有目的的动效。** 动画引导注意力、强化空间关系 — 绝非装饰。

## 结构记事

| 层级 | 工具 |
|------|-------|
| 框架 | [Astro 5](https://astro.build) — 内容优先，默认零 JS |
| 交互 | [Svelte 5](https://svelte.dev) — 响应式岛屿（主题切换、Monet 取色器、音乐播放器） |
| 样式 | [Tailwind CSS v4](https://tailwindcss.com) + [daisyUI v5](https://daisyui.com) — 工具层 + 组件原语 |
| 设计 Token | `@m3e/framework`（工作区包）— 三层 Token 架构：Reference → System → Component |
| 色彩系统 | `@material/material-color-utilities` — Material 3 色调调色板 + 动态 Monet 提取 |
| 代码高亮 | [Prism](https://prismjs.com) — 服务端分词，零客户端 JS |
| 字体排版 | Google Sans Flex + Noto Sans/Serif（JP / SC / TC）— 可变字体栈 |
| 部署 | 边缘优先的静态部署 |

## M3E 设计系统

`@m3e/framework` 包是本项目的共享设计系统工作区。它发布按层级组织的语义化 CSS 自定义属性：

- **Reference Token** — 原始 hex、px、rem 值（如 `--ref-blue-500: #3B5CF6`）
- **System Token** — 语义角色映射（如 `--sys-color-primary: var(--ref-blue-500)`）
- **Component Token** — 作用域限定至各 UI 元素（如 `--btn-bg: var(--sys-color-primary)`）
- **Layout Token** — `--layout-base-unit: 11`（44px）作为唯一缩放铰链
- **Pill Token** — `--pill-*` 比例尺（sm/md/lg），配对胶囊高度、字号与水平内边距

视觉识别将 HIG 的液态玻璃表面和弹簧曲线动效，与 Material 3 的色调调色板系统和圆角 Token 形状融为一体。结果：界面同时感觉精准而生动。
