# Workspace Memory

## 2026-06-01 — 硬编码排查
- 完成全项目硬编码审计，报告保存至 `HARDCODING_AUDIT.md`
- 共发现约 207 处各类硬编码：URL(8)、颜色(6)、字号(28)、间距(97)、i18n缺失(15)、断点(15)、配置(12)、SVG(10)、魔法数字(10)
- P0 问题: BaseLayout theme-color 硬编码、Footer GitHub 占位符、MonetSwitcher 种子色/渐变
- P1 问题: 断点系统缺失、Monet 预设重复定义、组件间距/尺寸、搜索 i18n
- 项目整体 Token 化程度较好（colors/spacing/typography/motion/shape 均有完整 token 层），但组件内部仍大量直接使用 px 值和具体数值

## 2026-06-01 — 硬编码最小化实践指南
- 联网搜索了 2025-2026 年最新的社区最佳实践，编写了完整的迁移指南
- 指南保存至 `HARDCODING_MINIMIZATION_GUIDE.md`
- 核心来源: Mavik Labs Tailwind v4 设计令牌文章、DTCG W3C 标准、CSS Architecture Stylelint 配置、M3 Design Tokens 官方文档
- 指南包含: 三层 Token 架构、命名规范、组件开发规范、断点 Token 化、动画 Token、图标管理、i18n 桥接、配置外置、Stylelint 自动化检测、CI/CD 集成
- 提供了本项目专属的 5 阶段迁移路径和速查卡片

## 2026-06-01 — 硬编码最小化落地版（基于审计报告逐项定制）
- 将 `HARDCODING_MINIMIZATION_GUIDE.md` 重写为执行级方案，每条审计发现均映射到具体的文件/行号/旧值/新值
- 新增 3 个文件（breakpoints.css, monet.config.ts, 15 个组件 Token 文件）作为前置依赖
- 8 个 Phase 的完整执行顺序：前置 → P0(6项) → 组件Token(32项) → 间距排版(110+项) → 图标i18n去重 → 页面title → 断点注释 → i18n keys → Stylelint
- 附加 Token↔像素值映射表，确保所有硬编码值都有精确的替换目标
