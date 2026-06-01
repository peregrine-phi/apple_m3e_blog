# Astro 博客音乐播放器实施指南
# apple_m3e_blog 项目定制版

> **技术方案**：Svelte 5 Island + Meting API + Material Design 波浪进度条
> **面向项目**：apple_m3e_blog（Astro 5.7 + Tailwind CSS v4 + daisyUI v5 + M3 Expressive）
> **预计工期**：2-3 天（MVP → 完整版）
> **最后更新**：2026-06-01
> **维护者**：根据项目实际结构优化

---

## 目录

1. [项目现状分析](#一项目现状分析)
2. [技术架构概览](#二技术架构概览)
3. [文件结构](#三文件结构)
4. [环境准备](#四环境准备)
5. [实施步骤](#五实施步骤)
6. [完整代码](#六完整代码)
7. [Meting API 部署](#七meting-api-部署)
8. [进度条动画](#八进度条动画)
9. [测试清单](#九测试清单)
10. [故障排查](#十故障排查)
11. [后续优化](#十一后续优化)

---

## 一、项目现状分析

### 1.1 当前技术栈

| 技术 | 版本 | 备注 |
|------|------|------|
| Astro | 5.7.0 | 核心框架 |
| Tailwind CSS | v4.1.0 | 通过 `@tailwindcss/vite` 集成 |
| daisyUI | v5.0.0 | 组件库 |
| Prism.js | 1.29.0 | 代码高亮 |
| Svelte | **未安装** | 需通过 `npx astro add svelte` 添加 |

### 1.2 设计 Token 系统

项目使用 **`--blog-*` 命名空间**的 CSS Token 系统，位于 `src/styles/tokens/`：

| Token 类型 | 文件 | 命名规范 |
|-----------|------|-----------|
| 颜色 | `colors.css` | `--blog-color-*`、`--blog-ref-*` |
| 间距 | `spacing.css` | `--blog-space-*` |
| 字体 | `typography.css` | `--blog-typescale-*`、`--blog-font-*` |
| 动效 | `motion.css` | `--blog-motion-*` |
| 形状 | `shape.css` | `--blog-shape-*` |
| 层级 | `elevation.css` | `--blog-elevation-*` |

### 1.3 布局系统

项目使用 `BaseLayout.astro` 作为根布局（非原指南假设的 `Layout.astro`）：

```
BaseLayout.astro
├── Header.astro        ← 顶部导航
├── <main><slot /></main>  ← 页面内容
└── Footer.astro        ← 底部信息
    └── （音乐播放器可放置于此）
```

**播放器放置位置建议**（按推荐顺序）：
1. **Footer 内**（推荐）— 全局可用，不抢占主内容区
2. **Header 右侧** — 随时可访问，但可能拥挤
3. **独立浮动按钮**（类似现有 `MDButton fab`）— 最灵活

### 1.4 主题系统

项目使用**双重主题系统**：

1. **亮色/暗色模式**：`data-theme="light"` 或 `data-theme="dark"`
2. **Monet 动态配色**：`data-monet="<seed-color>--<variant>"`

CSS Token 在 `src/styles/themes/light.css` 和 `dark.css` 中定义，
并支持通过 JS 动态修改（`MonetCSS.astro` + `MonetSwitcher.astro`）。

> **播放器兼容性要求**：样式必须同时响应 `data-theme` 和 `data-monet` 变化。

---

## 二、技术架构概览

### 2.1 系统架构图

```
┌──────────────────────────────────────────────────────────────────┐
│                         用户浏览器                                │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Astro 页面（SSG 静态生成）                          │    │
│  │                                                        │
│  │  ┌──────────────────┐      ┌──────────────────┐    │    │
│  │  │  Music.astro      │      │  BaseLayout.astro│    │    │
│  │  │  （数据配置层）    │─────→│  （根布局）      │    │    │
│  │  └────────┬─────────┘      └──────────────────┘    │    │
│  │           │ client:load                         │    │    │
│  │           ▼                                      │    │    │
│  │  ┌─────────────────────────────────────────┐    │    │    │
│  │  │  MusicPlayer.svelte（Svelte 5 Island）│    │    │    │
│  │  │  ├─ 状态管理（$state runes）          │    │    │    │
│  │  │  ├─ UI 渲染（进度条、封面、按钮）    │    │    │    │
│  │  │  └─ 动画效果（MD 波浪、封面旋转）    │    │    │    │
│  │  └─────────────────────────────────────────┘    │    │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────┬───────────────────────────────┘
                       │ fetch (API 请求)
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Meting API 服务                             │
│  ┌────────────────┐    ┌────────────────┐                   │
│  │  自建实例        │    │  公用实例      │                   │
│  │  (Docker/Vercel)│    │  (api.i-meto) │                   │
│  └────────┬───────┘    └────────┬───────┘                   │
│           │                      │                              │
│           └──────────┬───────────┘                              │
│                      ▼                                          │
│  ┌─────────────────────────────────────────┐                  │
│  │        上游音乐平台                       │                  │
│  │  网易云  QQ音乐  酷狗  百度  酷我        │                  │
│  └─────────────────────────────────────────┘                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈（项目定制版）

| 层级 | 技术 | 用途 | 项目现状 |
|------|------|------|---------|
| **前端框架** | Astro 5.7 | SSG 静态生成 | ✅ 已配置 |
| **CSS 框架** | Tailwind CSS v4 | 工具类 + 主题 | ✅ 已配置（`@tailwindcss/vite`） |
| **组件库** | daisyUI v5 | UI 组件 | ✅ 已配置 |
| **交互组件** | Svelte 5 | Island 架构，按需水合 | ❌ 需安装 |
| **音频播放** | Web Audio API | 浏览器原生 `Audio` 对象 | — |
| **音乐源** | Meting API | 解析各大音乐平台 URL | — |
| **进度条动画** | CSS @keyframes | Material Design 波浪效果 | — |
| **样式系统** | CSS Token（`--blog-*`） | 主题切换（亮色/暗色/Monet） | ✅ 已配置 |
| **缓存策略** | localStorage | 歌单数据缓存（1 小时） | — |

### 2.3 核心特性（项目定制）

- ✅ **完全自定义 UI**：使用项目自有 `--blog-*` Token，与 M3 Expressive 设计系统一致
- ✅ **主题自适应**：响应 `data-theme` 和 `data-monet` 变化
- ✅ **音乐源灵活**：本地 MP3 + Meting API 双模式
- ✅ **流畅动画**：Material Design 波浪进度条 + 封面旋转（使用 `--blog-motion-*` Token）
- ✅ **Svelte 5 运行符**：使用 `$state()`、`$effect()`、`$props()` 现代语法
- ✅ **Tailwind CSS v4 兼容**：可选择性使用 Tailwind 工具类

---

## 三、文件结构

```
apple_m3e_blog/
├── public/
│   └── music/                          # 本地兜底音乐文件
│       ├── fallback-01.mp3              # 本地音频文件
│       ├── fallback-01-cover.jpg       # 本地封面
│       └── default-cover.svg           # 默认封面（无封面时使用）
│
├── src/
│   ├── components/
│   │   ├── Music.astro             # 数据配置层（新文件）
│   │   └── MusicPlayer.svelte     # Svelte 5 播放器组件（新文件）
│   │
│   └── layouts/
│       └── BaseLayout.astro               # 根布局（需修改，引入播放器）
│
├── astro.config.mjs                    # Astro 配置（需修改，添加 Svelte 集成）
└── package.json                       # 依赖配置（需修改，添加 Svelte）
```

---

## 四、环境准备

### 4.1 安装 Svelte 集成

```bash
# 在 apple_m3e_blog 项目根目录执行
npx astro add svelte
```

执行后会自动：
1. 安装 `@astrojs/svelte` 集成（**Svelte 5**）
2. 更新 `astro.config.mjs` 配置文件
3. 创建示例 Svelte 组件（可删除）

**验证安装**：

检查 `astro.config.mjs` 应包含：

```javascript
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import svelte from "@astrojs/svelte";  // ← 新增
import remarkWikiLink from "@flowershow/remark-wiki-link";

export default defineConfig({
  site: "https://m3e.blog",
  integrations: [svelte()],  // ← 新增
  vite: {
    plugins: [tailwindcss()],
  },
  // ... 其他配置
});
```

### 4.2 创建目录结构

```bash
# 创建必要的目录
mkdir -p public/music
```

> **注意**：`src/components/` 目录已存在，无需创建。

### 4.3 准备本地音乐文件（可选）

```bash
# 放置 2-3 首本地 MP3 作为兜底
# 文件名建议：track-01.mp3, track-01-cover.jpg
# 尺寸：封面 300×300 或 40×40（播放器显示尺寸）
```

---

## 五、实施步骤

### 阶段 1：MVP 最小可用版本（Day 1 上午）

**目标**：实现基础播放功能，验证技术可行性

- [ ] **Step 1.1**：创建 `MusicPlayer.svelte` 基础版本（Svelte 5 语法）
  - 使用 `$state()` 运行符管理状态
  - 单个音频文件播放/暂停
  - 显示播放/暂停按钮
  - 显示当前时间

- [ ] **Step 1.2**：创建 `Music.astro` 数据配置层
  - 定义 `audioList` 数组
  - 引入 `MusicPlayer.svelte`
  - 传递 `client:load` 指令

- [ ] **Step 1.3**：在 `BaseLayout.astro` 中引入播放器
  - 推荐放置在 `<Footer />` 之前
  - 测试页面加载时是否正常显示

**验收标准**：
- 页面加载后能看到播放器 UI
- 点击播放按钮能播放本地 MP3
- 点击暂停按钮能暂停

### 阶段 2：完整歌单功能（Day 1 下午）

**目标**：支持多首歌曲切换

- [ ] **Step 2.1**：实现上一曲/下一曲功能
  - 添加 `prev()` 和 `next()` 函数
  - 更新 `$state()` 状态
  - 切换时更新音频源

- [ ] **Step 2.2**：实现封面旋转动画
  - 播放时添加 `.spinning` class
  - 暂停时移除 `.spinning` class
  - 定义 `@keyframes spin` 动画（使用 `--blog-motion-*` Token）

- [ ] **Step 2.3**：实现标题溢出滚动
  - 计算标题宽度是否超出容器
  - 使用 `$effect()` 实现滚动效果
  - 到达边界时反转方向

**验收标准**：
- 能正常切换上一曲/下一曲
- 播放时封面缓缓旋转
- 长标题能来回滚动显示

### 阶段 3：进度条与交互（Day 2 上午）

**目标**：实现进度条显示与拖动

- [ ] **Step 3.1**：显示播放进度
  - 监听 `timeupdate` 事件
  - 更新 `$state()` 响应式变量
  - 计算进度百分比 `current / duration`

- [ ] **Step 3.2**：实现 Material Design 波浪进度条
  - 创建 `.progress` 容器
  - 添加 `.progress-buffered` 和 `.progress-filled` 子元素
  - 编写 CSS 动画（前导光泽 + 缓冲扫光）
  - **使用 `--blog-color-*` Token**（非硬编码颜色）

- [ ] **Step 3.3**：实现点击跳转功能
  - 监听进度条容器的 `click` 事件
  - 计算点击位置对应的时间
  - 调用 `audio.currentTime = ratio * duration`

**验收标准**：
- 进度条能实时显示播放进度
- 点击进度条能跳转到对应位置
- 缓冲时有扫光动画效果

### 阶段 4：Meting API 集成（Day 2 下午）

**目标**：接入在线音乐源

- [ ] **Step 4.1**：修改 `Music.astro` 支持 API 模式
  - 添加 `apiEndpoint` 参数
  - 添加 `fallbackTracks` 参数（本地兜底）

- [ ] **Step 4.2**：在 `MusicPlayer.svelte` 中添加数据获取逻辑
  - `onMount` 时 fetch API 数据
  - 解析返回数据为标准格式
  - 更新 `$state()` 响应式变量

- [ ] **Step 4.3**：实现缓存策略
  - 检查 `localStorage` 中是否有缓存
  - 缓存未过期（1 小时内）直接使用
  - 缓存过期或不存在时请求 API

- [ ] **Step 4.4**：实现降级链
  - 尝试自建 API → 失败
  - 尝试公用 API → 失败
  - 使用本地兜底曲目

**验收标准**：
- 能正常加载在线歌单
- API 失败时自动切换到本地曲目
- 刷新页面后无需重新请求 API（使用缓存）

### 阶段 5：细节打磨（Day 3）

**目标**：完善用户体验，确保与项目设计系统一致

- [ ] **Step 5.1**：错误处理
  - 音频加载失败自动跳过下一首
  - 显示友好错误提示（console.warn）
  - 空白状态保护（无曲目时不渲染）

- [ ] **Step 5.2**：Hover 动效（使用 `--blog-motion-*` Token）
  - 进度条 hover 时高度从 2px 变 4px
  - 按钮 hover 时背景色变为 `--blog-color-primary`
  - 按钮 active 时缩放至 0.92

- [ ] **Step 5.3**：主题切换测试
  - 亮色模式下播放器样式正确（使用 `--blog-color-*` Token）
  - 暗色模式下播放器样式正确
  - Monet 动态配色变化时播放器样式正确
  - 切换主题时无需刷新页面

**验收标准**：
- 所有交互都有视觉反馈
- 亮色/暗色/Monet 模式下都美观
- 边界情况（无网络、API 失败等）都能优雅处理

---

## 六、完整代码

### 6.1 `src/components/Music.astro`

```astro
---
/**
 * Music.astro - 音乐播放器数据配置层
 * 
 * 职责：
 * 1. 定义曲目数据源（本地 MP3 或 Meting API）
 * 2. 引入 Svelte Island 组件
 * 3. 传递数据给播放器
 * 
 * 使用方式：
 * <Music client:load />
 */

import MusicPlayer from './MusicPlayer.svelte';

// ════════════════════════════════════════════
// 配置区：修改以下参数来定制播放器
// ════════════════════════════════════════════

// 模式选择：'local' = 本地 MP3，'api' = Meting API
const MODE = 'local'; // 或 'api'

// ── 模式 1：本地 MP3 ──
const localTracks = [
  {
    name: '有何不可 — 许嵩',
    src: '/music/fallback-01.mp3',
    cover: '/music/fallback-01-cover.jpg',
  },
  // 添加更多本地曲目...
];

// ── 模式 2：Meting API ──
const METING_API = 'https://api.i-meto.com/meting/api'; // 公用实例（测试用）
// const METING_API = 'https://your-api.com/api';       // 自建实例（生产用）
const PLAYLIST_ID = '60198'; // 网易云歌单 ID
const SERVER = 'netease';     // 平台代码

// 本地兜底曲目（API 失败时显示）
const fallbackTracks = [
  {
    name: '本地曲目 1 — 艺术家',
    src: '/music/fallback-01.mp3',
    cover: '/music/fallback-01-cover.jpg',
  },
];

// ════════════════════════════════════════════
// 逻辑区：根据模式选择数据源
// ════════════════════════════════════════════

let audioList = [];
let apiEndpoint = '';

if (MODE === 'api') {
  apiEndpoint = `${METING_API}?server=${SERVER}&type=playlist&id=${PLAYLIST_ID}`;
  audioList = []; // 由 Svelte 组件异步加载
} else {
  audioList = localTracks;
  apiEndpoint = '';
}
---

<!-- 
  播放器组件
  client:load = 页面加载时立即水合（播放器需要立即可交互）
-->
<MusicPlayer
  client:load
  audioList={audioList}
  apiEndpoint={apiEndpoint}
  fallbackTracks={fallbackTracks}
/>

<style>
  /* Music.astro 本身不需要样式，所有样式都在 Svelte 组件中 */
</style>
```

### 6.2 `src/components/MusicPlayer.svelte`（Svelte 5 语法）

```svelte
<!--
  MusicPlayer.svelte - 自定义音乐播放器组件（Svelte 5 版本）
  
  架构分层：
  - 第 1 层：数据层（audioList prop）
  - 第 2 层：状态机（Audio 对象、播放控制，使用 $state() 运行符）
  - 第 3 层：视觉层（DOM 渲染、CSS 动画）
  
  依赖：无（浏览器原生 Audio API）
-->

<script>
  import { onMount } from 'svelte';
  import { tick } from 'svelte';

  // ════════════════════════════════════════════
  // Props：从 Music.astro 接收的配置（Svelte 5 运行符语法）
  // ════════════════════════════════════════════
  let {
    audioList = [],
    apiEndpoint = '',
    fallbackTracks = [],
  } = $props();

  // ════════════════════════════════════════════
  // 状态变量：播放器核心状态（Svelte 5 $state() 运行符）
  // ════════════════════════════════════════════
  let audio = $state(null);                // Audio 对象
  let tracks = $state([]);                // 实际使用的曲目列表（可能来自 API）
  let currentIndex = $state(0);           // 当前播放曲目索引
  let playing = $state(false);             // 是否正在播放
  let duration = $state(0);               // 音频总时长（秒）
  let current = $state(0);                // 当前播放位置（秒）
  let buffered = $state(0);               // 已缓冲比例（0-1）
  let buffering = $state(false);           // 是否正在缓冲
  
  // 标题滚动相关
  let offset = $state(0);                 // 标题滚动偏移量（px）
  let scrollDistance = $state(0);         // 标题需要滚动的总距离
  let dir = $state(1);                   // 滚动方向（1 = 向左，-1 = 向右）
  let titleElement = $state(null);         // 标题 DOM 元素引用
  let containerElement = $state(null);     // 标题容器 DOM 元素引用
  
  // 加载状态
  let loading = $state(true);             // 是否正在加载歌单
  let error = $state('');                 // 错误信息

  // ════════════════════════════════════════════
  // 生命周期：组件挂载时初始化
  // ════════════════════════════════════════════
  onMount(async () => {
    // 1. 创建 Audio 对象
    audio = new Audio();
    audio.preload = 'metadata';

    // 2. 绑定音频事件
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', () => { buffering = true; });
    audio.addEventListener('canplay', () => { buffering = false; });
    audio.addEventListener('progress', handleProgress);

    // 3. 加载曲目数据
    if (apiEndpoint) {
      // 模式 A：从 API 加载
      await loadFromAPI();
    } else {
      // 模式 B：使用本地数据
      tracks = audioList.length > 0 ? audioList : fallbackTracks;
      loading = false;
    }

    // 4. 如果有待播放的曲目，设置第一首
    if (tracks.length > 0) {
      playCurrent();
    }
  });

  // ════════════════════════════════════════════
  // 生命周期：组件销毁时清理
  // ════════════════════════════════════════════
  import { onDestroy } from 'svelte';

  onDestroy(() => {
    if (audio) {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', () => { buffering = true; });
      audio.removeEventListener('canplay', () => { buffering = false; });
      audio.removeEventListener('progress', handleProgress);
      audio = null;
    }

    // 清除所有定时器
    if (scrollInterval) clearInterval(scrollInterval);
    if (progressInterval) clearInterval(progressInterval);
  });

  // ════════════════════════════════════════════
  // API 加载逻辑：从 Meting API 获取歌单
  // ════════════════════════════════════════════
  async function loadFromAPI() {
    try {
      // 1. 尝试从 localStorage 读取缓存
      const cached = localStorage.getItem('meting_cache');
      const cacheTime = localStorage.getItem('meting_cache_time');
      const now = Date.now();

      if (cached && cacheTime && (now - Number(cacheTime) < 3600000)) {
        // 缓存未过期（1 小时内）
        console.log('[Music] 使用缓存数据');
        tracks = JSON.parse(cached);
        loading = false;
        return;
      }

      // 2. 缓存过期或不存在，请求 API
      console.log('[Music] 请求 API:', apiEndpoint);
      const res = await fetch(`${apiEndpoint}&r=${Date.now()}`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      // 3. 转换为标准格式
      const formatted = data.map(item => ({
        name: `${item.title || item.name} — ${(item.author || item.artist || []).join(' / ')}`,
        src: item.url,
        cover: item.pic || '',
      }));

      // 4. 更新缓存
      localStorage.setItem('meting_cache', JSON.stringify(formatted));
      localStorage.setItem('meting_cache_time', String(now));

      tracks = formatted;
      error = '';

    } catch (err) {
      console.warn('[Music] API 加载失败，使用本地兜底:', err.message);
      error = '在线歌单加载失败，已切换到本地曲目';
      tracks = fallbackTracks;
    } finally {
      loading = false;
    }
  }

  // ════════════════════════════════════════════
  // 音频事件处理
  // ════════════════════════════════════════════
  function handleLoadedMetadata() {
    duration = audio.duration;
  }

  function handleTimeUpdate() {
    current = audio.currentTime;
  }

  function handleEnded() {
    // 播放结束后自动下一首
    next();
  }

  function handleError() {
    console.warn('[Music] 音频加载失败:', tracks[currentIndex]?.name);
    // 静默跳过，尝试下一首
    next();
  }

  function handleProgress() {
    if (audio.buffered.length > 0) {
      buffered = audio.buffered.end(audio.buffered.length - 1) / audio.duration;
    }
  }

  // ════════════════════════════════════════════
  // 播放控制函数
  // ════════════════════════════════════════════
  function playCurrent() {
    if (tracks.length === 0) return;
    
    const track = tracks[currentIndex];
    if (!track || !audio) return;

    // 设置音频源
    audio.src = track.src;
    
    // 播放
    audio.play()
      .then(() => {
        playing = true;
      })
      .catch(() => {
        // 浏览器禁止自动播放，静默失败
        playing = false;
      });

    // 重置标题滚动
    setupScroll();
  }

  function togglePlay() {
    if (!audio) return;

    if (playing) {
      audio.pause();
      playing = false;
    } else {
      audio.play()
        .then(() => {
          playing = true;
        })
        .catch(() => {
          playing = false;
        });
    }
  }

  function prev() {
    if (tracks.length === 0) return;
    
    currentIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    playCurrent();
  }

  function next() {
    if (tracks.length === 0) return;
    
    currentIndex = (currentIndex + 1) % tracks.length;
    playCurrent();
  }

  // ════════════════════════════════════════════
  // 进度条交互
  // ════════════════════════════════════════════
  function seekByClick(e) {
    if (!audio || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
    current = audio.currentTime;
  }

  // ════════════════════════════════════════════
  // 标题滚动逻辑
  // ════════════════════════════════════════════
  let scrollInterval = null;

  function setupScroll() {
    // 清除旧定时器
    if (scrollInterval) {
      clearInterval(scrollInterval);
      scrollInterval = null;
    }

    offset = 0;
    dir = 1;

    // 等待 DOM 更新
    tick().then(() => {
      if (!titleElement || !containerElement) return;

      // 计算需要滚动的距离
      scrollDistance = titleElement.scrollWidth - containerElement.clientWidth;

      if (scrollDistance > 0) {
        // 标题溢出，启动滚动
        scrollInterval = setInterval(() => {
          offset += dir;

          if (offset <= 0) {
            dir = 1; // 到达左边界，向右滚动
          } else if (offset >= scrollDistance) {
            dir = -1; // 到达右边界，向左滚动
          }
        }, 100); // 每 100ms 移动 1px
      }
    });
  }

  // ════════════════════════════════════════════
  // 辅助函数：格式化时间（秒 → MM:SS）
  // ════════════════════════════════════════════
  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
</script>

<!-- 
  模板区：播放器 UI
  ─────────────────────────────────────────────
  结构：
  - 外层容器（.player）
  - 封面（.cover）
  - 信息区（.info）
    - 标题（.title-container > .title）
    - 时间（.time）
    - 进度条（.progress）
  - 控制按钮（.controls）
    - 上一曲
    - 播放/暂停
    - 下一曲
-->

{#if loading}
  <!-- 加载状态：显示 Material Design 波浪进度条 -->
  <div class="player loading">
    <div class="md-progress" role="progressbar" aria-label="加载歌单中">
      <div class="md-progress__primary">
        <div class="md-progress__bar-inner"></div>
      </div>
      <div class="md-progress__secondary">
        <div class="md-progress__bar-inner"></div>
      </div>
    </div>
  </div>
{:else if tracks.length === 0}
  <!-- 无曲目状态：不渲染播放器 -->
{:else}
  <!-- 正常状态：显示播放器 -->
  <div class="player">
    <!-- 封面 -->
    <img
      class="cover {playing ? 'spinning' : ''}"
      src={tracks[currentIndex]?.cover || '/music/default-cover.svg'}
      alt={tracks[currentIndex]?.name || '封面'}
      onclick={togglePlay}
    />

    <!-- 信息区 -->
    <div class="info">
      <!-- 标题（溢出时滚动） -->
      <div class="title-container" bind:this={containerElement}>
        <span
          class="title"
          bind:this={titleElement}
          style="transform: translateX(-{offset}px)"
        >
          {tracks[currentIndex]?.name || '未知曲目'}
        </span>
      </div>

      <!-- 时间 -->
      <div class="time">
        {formatTime(current)} / {formatTime(duration)}
      </div>

      <!-- 进度条 -->
      <div class="progress" onclick={seekByClick}>
        <!-- 已缓冲区域 -->
        <div
          class="progress-buffered"
          style="transform: scaleX({buffered || 0})"
        ></div>

        <!-- 已播放区域（带前导光泽） -->
        <div
          class="progress-filled"
          style="transform: scaleX({(current / duration) || 0})"
        ></div>

        <!-- 缓冲扫光 -->
        {#if buffering}
          <div class="progress-scan"></div>
        {/if}
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="controls">
      <button class="ctrl" onclick={prev} aria-label="上一曲">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 20L9 12L19 4V20Z" />
          <line x1="5" y1="19" x2="5" y2="5" />
        </svg>
      </button>

      <button class="ctrl" onclick={togglePlay} aria-label={playing ? '暂停' : '播放'}>
        {#if playing}
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7L8 5z" />
          </svg>
        {/if}
      </button>

      <button class="ctrl" onclick={next} aria-label="下一曲">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 4L15 12L5 20V4Z" />
          <line x1="19" y1="5" x2="19" y2="19" />
        </svg>
      </button>
    </div>
  </div>
{/if}

<!-- 
  样式区：播放器 CSS（使用项目 --blog-* Token）
  ─────────────────────────────────────────────
  设计原则：
  - 使用 CSS 变量（var(--blog-*)）而非硬编码颜色
  - 所有颜色、间距、圆角都引用设计令牌
  - 主题切换时自动适配（无需写 [data-theme="dark"] 选择器）
-->
<style>
  /* ════════════════════════════════════════════
     播放器容器
     ════════════════════════════════════════════ */
  .player {
    display: flex;
    align-items: center;
    gap: var(--blog-space-2);
    padding: var(--blog-space-2);
    box-sizing: border-box;
    width: 100%;
    background: var(--blog-color-surface);
    border-radius: var(--blog-shape-medium);
    color: var(--blog-color-on-surface);
    transition: 
      background var(--blog-motion-duration-normal) var(--blog-motion-easing-standard),
      color var(--blog-motion-duration-normal) var(--blog-motion-easing-standard);
  }

  .player.loading {
    padding: var(--blog-space-4);
  }

  /* ════════════════════════════════════════════
     封面
     ════════════════════════════════════════════ */
  .cover {
    width: 40px;
    height: 40px;
    border-radius: var(--blog-shape-small);
    object-fit: cover;
    cursor: pointer;
    flex-shrink: 0;
    transition: border-radius var(--blog-motion-duration-normal) var(--blog-motion-easing-standard);
  }

  .spinning {
    animation: spin 10s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* ════════════════════════════════════════════
     信息区
     ════════════════════════════════════════════ */
  .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  /* 标题容器（溢出隐藏） */
  .title-container {
    overflow: hidden;
    width: 100%;
  }

  .title {
    display: inline-block;
    white-space: nowrap;
    font-size: var(--blog-typescale-label-medium-size);
    font-weight: var(--blog-font-weight-medium);
    transition: transform 0.1s linear;
    color: var(--blog-color-text-primary);
  }

  /* 时间显示 */
  .time {
    font-size: var(--blog-typescale-label-small-size);
    color: var(--blog-color-text-secondary);
    font-variant-numeric: tabular-nums; /* 等宽数字 */
  }

  /* ════════════════════════════════════════════
     进度条
     ════════════════════════════════════════════ */
  .progress {
    position: relative;
    width: 100%;
    height: 2px;
    border-radius: 1px;
    background: var(--blog-color-surface-variant);
    overflow: hidden;
    transition: height var(--blog-motion-duration-fast) var(--blog-motion-easing-standard);
    cursor: pointer;
  }

  .progress:hover {
    height: 4px;
  }

  /* 已缓冲区域 */
  .progress-buffered {
    position: absolute;
    inset: 0;
    background: color-mix(in srgb, var(--blog-color-surface-variant) 60%, var(--blog-color-primary));
    transform-origin: left;
    transition: transform var(--blog-motion-duration-fast) var(--blog-motion-easing-standard);
  }

  /* 已播放区域（带前导光泽） */
  .progress-filled {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      var(--blog-color-primary) 0%,
      var(--blog-color-primary) 92%,
      color-mix(in srgb, var(--blog-color-primary) 50%, var(--blog-color-surface)) 100%
    );
    border-radius: 1px;
    transform-origin: left;
    animation: shimmer 3s ease-in-out infinite;
    transition: transform var(--blog-motion-duration-fast) linear;
  }

  @keyframes shimmer {
    0%, 100% {
      filter: brightness(1);
    }
    50% {
      filter: brightness(1.12);
    }
  }

  /* 缓冲扫光 */
  .progress-scan {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      color-mix(in srgb, var(--blog-color-primary) 30%, transparent) 50%,
      transparent 100%
    );
    animation: scan 2s ease-in-out infinite;
  }

  @keyframes scan {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  /* ════════════════════════════════════════════
     控制按钮
     ════════════════════════════════════════════ */
  .controls {
    display: flex;
    gap: var(--blog-space-1);
    flex-shrink: 0;
  }

  .ctrl {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    background: var(--blog-color-surface-variant);
    color: var(--blog-color-text-secondary);
    transition: 
      background var(--blog-motion-duration-fast) var(--blog-motion-easing-standard),
      color var(--blog-motion-duration-fast) var(--blog-motion-easing-standard),
      transform var(--blog-motion-duration-fast) var(--blog-motion-easing-standard);
  }

  .ctrl:hover {
    background: var(--blog-color-primary);
    color: var(--blog-color-on-primary);
  }

  .ctrl:active {
    transform: scale(0.92);
  }

  .ctrl svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }

  /* ════════════════════════════════════════════
     Material Design 波浪进度条（加载状态）
     ════════════════════════════════════════════ */
  .md-progress {
    position: relative;
    width: 100%;
    height: 4px;
    overflow: hidden;
    background: var(--blog-color-surface-variant);
  }

  .md-progress__primary,
  .md-progress__secondary {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform-origin: left center;
  }

  .md-progress__primary {
    left: -145.166611%;
    animation: md-primary-translate 2s infinite linear;
  }

  .md-progress__primary .md-progress__bar-inner {
    animation: md-primary-scale 2s infinite linear;
  }

  .md-progress__secondary {
    left: -54.888891%;
    animation: md-secondary-translate 2s infinite linear;
  }

  .md-progress__secondary .md-progress__bar-inner {
    animation: md-secondary-scale 2s infinite linear;
  }

  .md-progress__bar-inner {
    width: 100%;
    height: 100%;
    background: var(--blog-color-primary);
  }

  /* 主条：位移动画 */
  @keyframes md-primary-translate {
    0% {
      transform: translateX(0);
    }
    20% {
      animation-timing-function: cubic-bezier(0.5, 0, 0.701732, 0.495819);
      transform: translateX(0);
    }
    59.15% {
      animation-timing-function: cubic-bezier(0.302435, 0.381352, 0.55, 0.956352);
      transform: translateX(83.67142%);
    }
    100% {
      transform: translateX(200.611057%);
    }
  }

  /* 主条：缩放动画 */
  @keyframes md-primary-scale {
    0% {
      transform: scaleX(0.08);
    }
    36.65% {
      animation-timing-function: cubic-bezier(0.334731, 0.12482, 0.785844, 1);
      transform: scaleX(0.08);
    }
    69.15% {
      animation-timing-function: cubic-bezier(0.06, 0.11, 0.6, 1);
      transform: scaleX(0.661479);
    }
    100% {
      transform: scaleX(0.08);
    }
  }

  /* 次条：位移动画 */
  @keyframes md-secondary-translate {
    0% {
      animation-timing-function: cubic-bezier(0.15, 0, 0.515058, 0.409685);
      transform: translateX(0);
    }
    25% {
      animation-timing-function: cubic-bezier(0.31033, 0.284058, 0.8, 0.733712);
      transform: translateX(37.651913%);
    }
    48.35% {
      animation-timing-function: cubic-bezier(0.4, 0.627035, 0.6, 0.902026);
      transform: translateX(84.386165%);
    }
    100% {
      transform: translateX(160.277782%);
    }
  }

  /* 次条：缩放动画 */
  @keyframes md-secondary-scale {
    0% {
      animation-timing-function: cubic-bezier(0.205028, 0.057051, 0.57661, 0.453971);
      transform: scaleX(0.08);
    }
    19.15% {
      animation-timing-function: cubic-bezier(0.152313, 0.196432, 0.648374, 1.004315);
      transform: scaleX(0.457104);
    }
    44.15% {
      animation-timing-function: cubic-bezier(0.257759, -0.003163, 0.211762, 1.38179);
      transform: scaleX(0.72796);
    }
    100% {
      transform: scaleX(0.08);
    }
  }
</style>
```

### 6.3 `src/layouts/BaseLayout.astro`（修改片段）

在 `<Footer />` **之前**添加音乐播放器：

```astro
---
// BaseLayout.astro — Root layout for all pages
import Header from "../components/Header.astro";
import Footer from "../components/Footer.astro";
import Music from "../components/Music.astro";  // ← 新增
import MonetCSS from "../components/MonetCSS.astro";
import MDButton from "../components/MDButton.astro";
import MDSnackbar from "../components/MDSnackbar.astro";
import "../styles/main.css";
import { monetConfig } from "../config/monet.config.js";
---

<!doctype html>
<html lang="en" data-theme>
  <head>
    <!-- head 内容（保持不变） -->
  </head>
  <body>
    <Header transparent={transparentHeader} />
    <main>
      <slot /><!-- 页面内容插入点 -->
    </main>

    <!-- 音乐播放器（放置在 Footer 之前） -->
    <div class="music-player-container">
      <Music />
    </div>

    <Footer />

    <!-- 其他内容（保持不变） -->
  </body>
</html>
```

配套 CSS（添加到 `BaseLayout.astro` 的 `<style is:global>` 块中）：

```css
/* 音乐播放器容器 */
.music-player-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 90;
  width: 320px;
  box-shadow: var(--blog-elevation-2);
  border-radius: var(--blog-shape-medium);
  overflow: hidden;
  transition: 
    transform var(--blog-motion-duration-normal) var(--blog-motion-easing-emphasized),
    opacity var(--blog-motion-duration-normal) var(--blog-motion-easing-standard);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .music-player-container {
    bottom: 16px;
    right: 16px;
    left: 16px;
    width: auto;
  }
}
```

---

## 七、Meting API 部署

### 7.1 方案 A：使用公用实例（快速测试）

**无需部署**，直接在 `Music.astro` 中配置：

```javascript
const METING_API = 'https://api.i-meto.com/meting/api';
```

**限制**：
- 可能限流（频繁请求返回 429）
- 播放直链有效期数小时
- 无法控制音质

**适合**：快速验证、临时使用

### 7.2 方案 B：Docker 自建（推荐生产）

**步骤 1：编写 `docker-compose.yml`**

```yaml
version: '3'
services:
  meting:
    image: intemd/meting-api:main
    container_name: meting-api
    ports:
      - "3000:3000"
    restart: always
    # 可选：挂载缓存目录
    # volumes:
    #   - ./cache:/app/cache
```

**步骤 2：启动服务**

```bash
docker-compose up -d
```

**步骤 3：测试 API**

```bash
# 获取网易云歌单 #60198 的歌曲列表
curl "http://localhost:3000/api?server=netease&type=playlist&id=60198"
```

**步骤 4：配置反向代理（Nginx）**

```nginx
server {
    listen 443 ssl;
    server_name api.your-blog.com;

    location /music/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # 缓存控制
        add_header Cache-Control "public, max-age=3600";
    }
}
```

**成本**：需要一台 VPS（最低 1C1G，月费约 ¥30-50）

### 7.3 方案 C：Vercel 自建（免费但速度一般）

**步骤 1：Fork 仓库**

访问 [injahow/meting-api](https://github.com/injahow/meting-api) 并 Fork

**步骤 2：部署到 Vercel**

1. 登录 [Vercel](https://vercel.com)
2. Import 你 Fork 的仓库
3. 点击 Deploy

**步骤 3：获取 API 地址**

部署完成后获得：`https://your-app.vercel.app/api`

**限制**：
- Serverless Function 超时 10 秒
- 免费版每月 100GB 带宽
- 国内访问速度不稳定

---

## 八、进度条动画

### 8.1 常态：Apple 风格前导光泽

**视觉效果**：已播放部分的前端微微发亮，像金属表面的光斑

**CSS 实现**（已包含在 `MusicPlayer.svelte` 中）：

```css
.progress-filled {
  background: linear-gradient(
    90deg,
    var(--blog-color-primary) 0%,
    var(--blog-color-primary) 92%,
    color-mix(in srgb, var(--blog-color-primary) 50%, var(--blog-color-surface)) 100%
  );
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { filter: brightness(1); }
  50%      { filter: brightness(1.12); }
}
```

### 8.2 缓冲态：Material Design 波浪进度条

**视觉效果**：两条不同速度的色块在轨道上追逐，产生有机的流动感

**CSS 实现**（已包含在 `MusicPlayer.svelte` 中）：

```css
/* 见完整代码中的 @keyframes md-primary-translate 等 */
```

**原理**：
- 主条：位移 0→200%，缩放 0.08⇢0.66⇢0.08
- 次条：位移 0→160%，缩放 0.08⇢0.73⇢0.08
- 两条浪速度不同，产生追逐效果

### 8.3 加载态：扫光动画

**视觉效果**：一道极淡的光从左到右扫过进度条

**CSS 实现**（已包含在 `MusicPlayer.svelte` 中）：

```css
.progress-scan {
  background: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in srgb, var(--blog-color-primary) 30%, transparent) 50%,
    transparent 100%
  );
  animation: scan 2s ease-in-out infinite;
}

@keyframes scan {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

---

## 九、测试清单

### 9.1 功能测试

- [ ] 页面加载后播放器正常显示
- [ ] 点击播放按钮能播放音频
- [ ] 点击暂停按钮能暂停音频
- [ ] 点击上一曲/下一曲能切换曲目
- [ ] 进度条能实时显示播放进度
- [ ] 点击进度条能跳转到对应位置
- [ ] 播放结束后自动切换到下一首
- [ ] 封面在播放时旋转，暂停时停止

### 9.2 样式测试（使用项目 Token）

- [ ] 亮色模式下播放器样式正确（使用 `--blog-color-*` Token）
- [ ] 暗色模式下播放器样式正确
- [ ] Monet 动态配色变化时播放器样式正确
- [ ] 切换主题时无需刷新页面
- [ ] 进度条 hover 时高度从 2px 变 4px
- [ ] 按钮 hover 时背景色变为 `--blog-color-primary`
- [ ] 长标题能来回滚动显示

### 9.3 边界情况测试

- [ ] 无曲目时不渲染播放器（不报错）
- [ ] 音频加载失败自动跳过下一首
- [ ] API 请求失败时使用本地兜底曲目
- [ ] 刷新页面后无需重新请求 API（缓存生效）
- [ ] 浏览器禁止自动播放时能正常处理（不报错）

### 9.4 性能测试

- [ ] 页面加载速度不受影响（Lighthouse > 90）
- [ ] 播放器水合时间 < 100ms
- [ ] 进度条动画流畅（60fps）
- [ ] 内存占用正常（无泄漏）

---

## 十、故障排查

### 10.1 播放器不显示

**可能原因**：
1. `MusicPlayer.svelte` 文件路径错误
2. `client:load` 指令缺失
3. `audioList` 为空且 `apiEndpoint` 未配置

**解决方案**：

```bash
# 检查文件路径
ls -la src/components/MusicPlayer.svelte

# 检查 Music.astro 中是否正确引入
grep "MusicPlayer" src/components/Music.astro
```

### 10.2 音频无法播放

**可能原因**：
1. 浏览器禁止自动播放
2. 音频文件路径错误
3. 跨域问题（API 返回的 URL 跨域）

**解决方案**：

```javascript
// 检查浏览器控制台是否有错误
// 检查音频 URL 是否可访问
fetch('音频 URL').then(res => console.log(res.status));
```

### 10.3 Meting API 请求失败

**可能原因**：
1. API 地址错误
2. 歌单 ID 错误
3. 上游平台接口变更

**解决方案**：

```bash
# 测试 API 是否可访问
curl "https://api.i-meto.com/meting/api?server=netease&type=playlist&id=60198"

# 检查返回数据格式
# 应该是一个数组，包含 { title, url, pic } 等字段
```

### 10.4 样式显示异常（CSS Token 相关）

**可能原因**：
1. CSS Token 未定义（使用了错误的变量名）
2. 主题切换时 CSS Token 未更新
3. Svelte 样式隔离导致变量无法访问

**解决方案**：

```css
/* 在 MusicPlayer.svelte 的 <style> 中，确保引用的是全局 CSS Token */
/* 错误：var(--space-2) 在项目中等同于 undefined */
/* 正确：var(--blog-space-2) */

/* 如果 Token 未定义，可以在 :root 中检查 */
/* 正确定义的 Token 应该在 src/styles/tokens/ 下的文件中 */
```

---

## 十一、后续优化

### 11.1 功能增强

- [ ] **音量控制**：添加音量滑块（独立于系统音量）
- [ ] **播放模式**：单曲循环 / 列表循环 / 随机播放
- [ ] **快捷键**：Space 播放暂停、←→ 切歌
- [ ] **播放历史**：记住上次播放位置和歌单
- [ ] **Mini 模式**：收缩为单行播放条
- [ ] **可视化波形**：使用 Web Audio API AnalyserNode

### 11.2 性能优化

- [ ] **懒加载**：滚动到视口时才水合（`client:visible`）
- [ ] **音频预加载**：预加载下一首音频
- [ ] **Service Worker 缓存**：离线时可播放已缓存的音频
- [ ] **代码分割**：将播放器代码单独打包

### 11.3 用户体验优化

- [ ] **歌词显示**：解析 LRC 格式歌词并同步显示
- [ ] **播放列表**：展开显示所有曲目，可点击选择
- [ ] **收藏功能**：收藏喜欢的曲目
- [ ] **分享功能**：生成当前曲目的分享链接

---

## 附录 A：网易云歌单 ID 获取方法

1. 打开 [网易云音乐网页版](https://music.163.com)
2. 进入任意歌单页面
3. 复制 URL 中的数字部分

```
https://music.163.com/#/playlist?id=60198
                                      ^^^^^ 这就是歌单 ID
```

## 附录 B：CSS Token 清单

确保在 `src/styles/tokens/` 中定义了以下 Token（项目已定义）：

```css
/* 颜色 Token（src/styles/tokens/colors.css） */
:root {
  /* 主要颜色 */
  --blog-color-primary: hsl(230, 82%, 48%);
  --blog-color-on-primary: #ffffff;
  --blog-color-primary-container: hsl(230, 100%, 93%);
  
  /* 表面颜色 */
  --blog-color-surface: #ffffff;
  --blog-color-on-surface: #1d1d1f;
  --blog-color-surface-variant: #f2f2f7;
  
  /* 文字颜色 */
  --blog-color-text-primary: #1d1d1f;
  --blog-color-text-secondary: #6e6e73;
}

/* 间距 Token（src/styles/tokens/spacing.css） */
:root {
  --blog-space-1: 4px;
  --blog-space-2: 8px;
  --blog-space-4: 16px;
}

/* 字体 Token（src/styles/tokens/typography.css） */
:root {
  --blog-typescale-label-medium-size: 0.875rem;
  --blog-typescale-label-small-size: 0.6875rem;
  --blog-font-weight-medium: 500;
}

/* 动效 Token（src/styles/tokens/motion.css） */
:root {
  --blog-motion-duration-fast: 150ms;
  --blog-motion-duration-normal: 250ms;
  --blog-motion-easing-standard: cubic-bezier(0.2, 0, 0, 1);
}

/* 形状 Token（src/styles/tokens/shape.css） */
:root {
  --blog-shape-small: 8px;
  --blog-shape-medium: 12px;
}
```

## 附录 C：完整文件清单

- [ ] `src/components/Music.astro`
- [ ] `src/components/MusicPlayer.svelte`
- [ ] `public/music/fallback-01.mp3`（可选）
- [ ] `public/music/fallback-01-cover.jpg`（可选）
- [ ] `public/music/default-cover.svg`（可选）
- [ ] `src/layouts/BaseLayout.astro`（修改）
- [ ] `astro.config.mjs`（修改，添加 Svelte 集成）
- [ ] `package.json`（自动修改，添加 Svelte 依赖）

---

**文档版本**：1.0（apple_m3e_blog 项目定制版）  
**最后更新**：2026-06-01  
**维护者**：WorkBuddy AI Assistant  
**反馈**：如有问题，请在项目 Issue 中反馈
