# 音乐播放器重写执行方案

## 三态混合模式：Capsule → Strip (A) → Mini Card (B)

---

## 一、状态模型

```ts
// 当前：boolean 双态
let expanded = $state(false);

// 重写：三态枚举
type PlayerMode = 'capsule' | 'strip' | 'card';
let mode: PlayerMode = $state('capsule');
```

| 状态 | 触发 | 尺寸 | 圆角 | 信息量 |
|------|------|------|------|--------|
| `capsule` | 默认 | 88×40 | 20px (高度半) | 播放图标 + 进度微环 |
| `strip` | 单击胶囊 | 300×44 | 22px (高度半) | 封面32px + 曲名/歌手单行 + 控键 |
| `card` | 双击/长按strip | 280×72 | 16px (`--blog-radius-lg`) | 封面56px + 曲名/歌手双行 + 进度条 + 控键 |

**关键洞察**：capsule → strip 的圆角恒为药丸形（radius = height/2），不需要过渡圆角，彻底避免了当前的核心痛点。

---

## 二、组件树

```
MusicPlayer.svelte
├── .player-container          ← 唯一容器，class 随 mode 切换
│   ├── {#if mode === 'capsule'}
│   │   └── .capsule-body      ← 88×40 药丸
│   │       └── .mini-play     ← 28×28 播放按钮 + 进度环
│   │
│   ├── {:else if mode === 'strip'}
│   │   └── .strip-body        ← 300×44 横条
│   │       ├── .art-strip     ← 32×32 封面缩略图
│   │       ├── .track-info    ← 曲名 + 歌手 (flex:1, truncate)
│   │       └── .strip-ctrls   ← ◀  ▶  ▶▶ (flex row, gap: 12px)
│   │
│   └── {:else if mode === 'card'}
│       └── .card-body         ← 280×72 双行小卡片
│           ├── .art-card      ← 56×56 封面 (grid row: 1/3)
│           ├── .card-title    ← 曲名 (14px bold)
│           ├── .card-artist   ← 歌手 (12px secondary)
│           ├── .ctrl-group    ← ◀  ▶  ▶▶ (flex row)
│           └── .progress-row  ← 进度条 + 时间 (flex row)
```

所有状态共用同一个 `.player-container`，不创建新 DOM 节点——这对动画至关重要。

---

## 三、精确尺寸规格（全部映射到现有 Token）

### 3.1 Capsule 态

```
 88px
┌──────┐
│  ▸   │  ← 28×28 圆形按钮居中
└──────┘
 40px
```

| 属性 | 值 | Token 来源 |
|------|-----|-----------|
| `width` | 88px | — |
| `height` | 40px | `--layout-capsule-height` (= `--layout-size-sm`) |
| `border-radius` | 20px | `calc(var(--layout-capsule-height) / 2)` — 动态跟随高度 |
| `padding` | `--blog-space-1` (4px) | 现有 |
| `background` | `--blog-glass-bg` | 现有 |
| `border` | `1px solid --blog-glass-border` | 现有 |

### 3.2 Strip 态 (Panel A)

```
     300px
┌────────────────────────────────┐
│ ┌──┐ 曲名... — 歌手...  ◀ ▶ ▶▶ │  ← 单行 flex row
│ └──┘                           │
└────────────────────────────────┘
     44px (= --layout-bar-height)
```

| 属性 | 值 | Token 来源 |
|------|-----|-----------|
| `width` | 300px | — |
| `max-width` | `calc(100vw - var(--layout-edge-margin) * 2)` | 现有容器逻辑 |
| `height` | 44px | `--layout-bar-height` (= `--layout-size-md`) |
| `border-radius` | 22px | `calc(var(--layout-bar-height) / 2)` — 药丸形 |
| `padding-inline` | `--blog-space-2` (8px) | |
| `padding-block` | `--blog-space-1` (4px) | |
| `gap` | `--blog-space-2` (8px) | |
| `display` | `flex; align-items: center` | |
| `elevation` | `--blog-elevation-3` | 比胶囊更"浮" |

**子元素规格**：

| 元素 | 尺寸 | 约束 |
|------|------|------|
| `.art-strip` | 32×32px | `border-radius: --blog-radius-xs` (4px), `flex-shrink: 0` |
| `.track-info` | `flex: 1; min-width: 0` | 单行 `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` |
| `.track-info .title` | `font-size: 13px; font-weight: 600` | `--blog-font-label-medium` 或等价 |
| `.track-info .artist` | `font-size: 11px; opacity: 0.6` | 与曲名同行显示，用 `·` 分隔 |
| `.strip-ctrls` | `flex-shrink: 0; gap: --blog-space-3` (12px) | 三个图标按钮，28×28，`--blog-radius-full` |

**曲名+歌手单行格式**：
```
"Bohemian Rhapsody — Queen"
```
整行作为一个 `<span>`，`flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis`。不需要双行。

### 3.3 Mini Card 态 (Panel B)

```
     280px
┌──────────────────────┐
│ ┌────────┐  曲名      │  ← 行1: cover(占两行) + 文字
│ │        │  歌手      │
│ │  56×56 │            │
│ │ 封面   │            │
│ └────────┘            │
│ ◀  ▶  ▶▶  ───●── 2:35│  ← 行2: 控件 + 进度条
└──────────────────────┘
     72px (= --blog-space-18)
```

| 属性 | 值 | Token 来源 |
|------|-----|-----------|
| `width` | 280px | 比 strip 略窄（因为封面大了） |
| `height` | 72px | `--blog-space-18` |
| `border-radius` | 16px | `--blog-radius-lg` |
| `padding` | `--blog-space-2` (8px) | |
| `gap` | `--blog-space-2` (8px) | |
| `elevation` | `--blog-elevation-4` | 最高浮层 |

**Grid 布局**：

```css
.card-body {
  display: grid;
  grid-template-columns: 56px 1fr;
  grid-template-rows: 1fr auto;
  gap: var(--blog-space-1-5); /* 6px */
  align-items: center;
}

.art-card {
  grid-row: 1 / 3;        /* 封面占两行 */
  width: 56px;
  height: 56px;
  border-radius: var(--blog-radius-md); /* 12px — M3 Large */
  overflow: hidden;
}

.card-title {
  grid-column: 2;
  grid-row: 1;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-artist {
  grid-column: 2;
  grid-row: 2;
  font-size: 12px;
  opacity: 0.6;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ctrl-group {
  grid-column: 1 / 3;     /* 跨两列 */
  display: flex;
  align-items: center;
  gap: var(--blog-space-3); /* 12px */
}

.progress-row {
  grid-column: 1 / 3;     /* 跨两列 */
  display: flex;
  align-items: center;
  gap: var(--blog-space-2); /* 8px */
}
```

**进度条规格**：

```
◀  ▶  ▶▶  ───────────●────────────  2:35
           ↑ M3 Full 圆角进度条      ↑ 13px mono
```

---

## 四、动画管线（分轨编排，消除圆角割裂）

### 4.1 核心策略

| 过渡方向 | 圆角变化 | 策略 |
|----------|----------|------|
| capsule → strip | 20px → 22px（都是药丸形） | 纯 `width` + `padding` 过渡，border-radius 无视觉变化 |
| strip → card | 22px(药丸) → 16px(圆角矩形) | `clip-path: inset() round` 接管形状过渡 |
| card → strip | 16px → 22px | `clip-path: inset() round` 反向 |
| 任意 → capsule | 收缩 | FLIP 反向 + `clip-path` |

### 4.2 过渡属性拆分

```css
.player-container {
  transition:
    /* 尺寸：0.3s，带 Apple Spring */
    width var(--blog-motion-duration-slow) var(--blog-motion-spring-default),
    height var(--blog-motion-duration-slow) var(--blog-motion-spring-default),
    padding var(--blog-motion-duration-normal) var(--blog-motion-easing-decelerate),
    /* 形状：clip-path 接管圆角，0.3s */
    clip-path var(--blog-motion-duration-slow) var(--blog-motion-easing-emphasized),
    /* 质感：玻璃态光影 0.25s */
    background var(--blog-motion-duration-normal) var(--blog-motion-easing-standard),
    box-shadow var(--blog-motion-duration-slow) var(--blog-motion-easing-standard);
  
  /* ⚠️ 不再使用 border-radius transition！用 clip-path: inset() round 替代 */
}
```

### 4.3 clip-path 接管圆角（解决从药丸到圆角矩形的过渡）

原理：不直接过渡 `border-radius`，而是用 `clip-path: inset(0 round Xpx)` 来"画"圆角。浏览器对相同函数类型（`inset→inset`）的插值远优于跨类型插值。

```css
.is-capsule {
  --player-radius: calc(var(--layout-capsule-height) / 2);  /* 20px */
  clip-path: inset(0 round var(--player-radius));
  border-radius: var(--player-radius); /* 兼容降级 */
}

.is-strip {
  --player-radius: calc(var(--layout-bar-height) / 2);     /* 22px */
  clip-path: inset(0 round var(--player-radius));
  border-radius: var(--player-radius);
}

.is-card {
  --player-radius: var(--blog-radius-lg);                  /* 16px */
  clip-path: inset(0 round var(--player-radius));
  border-radius: var(--player-radius);
}
```

`@supports` 保底：不支持 `clip-path: inset() round` 的浏览器回退到 `border-radius` 直接过渡。

### 4.4 子元素反向缩放修正

当容器从 40px 高变到 72px 高时，内部的封面图会被拉伸。使用反向 `scale` 修正：

```js
// 在 animation tick 中
const scaleY = capsuleHeight / container.getBoundingClientRect().height;
artCard.style.transform = `scaleY(${scaleY})`;
```

这确保封面图在容器过渡期间保持原始比例。

### 4.5 Animation 时间线

```
capsule ───────────────── strip ───────────────── card

t=0         t=0.3s         t=0.15s      t=0.4s
│                          │
│   width 0→300px          │   height 44→72px
│   padding 4→8px          │   clip-path: 22px→16px
│   gap 0→8px              │   padding 8→8px
│   opacity: strip内容渐显    │   opacity: card内容渐显
│                          │   box-shadow 3→4
│                          │
│   border-radius: 20px→22px (视觉无变化，clip-path处理)
└──────────────────────────┴─────────────────────────
```

---

## 五、交互流

```
               单击胶囊              双击/长按strip
  CAPSULE ──────────────→ STRIP ─────────────────→ CARD
      ↑                      ↑                          │
      │                      │                          │
      └──── 点击外部 ────────┘                          │
      └──── ESC键 ──────────────────────────────────────┘
      └──── 卡片关闭按钮 ────────────────────────────────┘
```

**详细交互**：

| 操作 | 当前状态 | 目标状态 | 备注 |
|------|----------|----------|------|
| 单击胶囊 | capsule | strip | 最常用操作 |
| 单击 strip 上的封面/曲名 | strip | card | "我想看更多" |
| 双击 strip 任意处 | strip | card | 同上 |
| 从 strip 点击外部 | strip | capsule | 类似现在 |
| 从 card 点击外部 | card | capsule | 直接回到最简 |
| 从 card 点击关闭按钮 | card | capsule | |
| 在 card 上切换曲目 | card | card | 不改变状态 |
| ESC 键 | strip/card | capsule | 无障碍 |

**Strip 的"半自动消失"**：
Strip 态在 8 秒无操作后自动回退到 capsule。这个行为可配置。

```js
let stripTimer = null;

function enterStrip() {
  mode = 'strip';
  clearTimeout(stripTimer);
  stripTimer = setTimeout(() => {
    if (mode === 'strip') mode = 'capsule';
  }, 8000);
}
```

---

## 六、BaseLayout 集成变更

### 6.1 容器 CSS 调整

```css
/* 当前 */
.music-player-container {
  width: 320px;
}

/* 重写后 */
.music-player-container {
  /* 移除固定 width，让内部元素自行决定宽度 */
  /* 容器仅负责定位 */
  position: fixed;
  bottom: var(--layout-bottom-gutter);   /* 24px desktop, 16px mobile */
  left: var(--layout-edge-margin);       /* 24px desktop, 16px mobile */
  z-index: var(--layout-z-player);       /* 90 */
  pointer-events: none;                  /* 放行点击到背后 */
  display: flex;
}

/* 展开到 strip/card 时提升 z-index */
.music-player-container:has(.is-strip),
.music-player-container:has(.is-card) {
  z-index: var(--layout-z-player-expanded); /* 2000 */
}
```

### 6.2 你已有的 z-index 层级体系

```
--layout-z-bottom-bar:     1000   ← 你计划中的底部导航栏
--layout-z-fab:            1010   ← 回到顶部按钮
--layout-z-player:           90   ← 折叠态播放器（当前）
--layout-z-player-expanded: 2000  ← 展开态播放器
```

这个层级是完全合理的。展开态 2000 高于所有固定元素，折叠态 90 低于 FAB。

---

## 七、Svelte 5 代码骨架

```svelte
<script>
  // ═══ 状态 ═══
  let mode = $state(/** @type {'capsule'|'strip'|'card'} */ ('capsule'));
  let stripTimer = $state(null);
  let containerEl = $state(null);

  // ═══ 三态切换 ═══
  function goStrip() {
    mode = 'strip';
    clearTimeout(stripTimer);
    stripTimer = setTimeout(() => {
      if (mode === 'strip') mode = 'capsule';
    }, 8000);
  }

  function goCard() {
    mode = 'card';
    clearTimeout(stripTimer);
  }

  function goCapsule() {
    mode = 'capsule';
  }

  function handleOutsideClick() {
    if (mode !== 'capsule') goCapsule();
  }

  function handleKeydown(e) {
    if (e.key === 'Escape' && mode !== 'capsule') goCapsule();
  }

  // ═══ clip-path 动画桥接（WAAPI 备选） ═══
  // 仅在 strip → card 需要时启用
  $effect(() => {
    if (mode === 'card' && containerEl) {
      // FLIP: 记录 strip 的 rect，切到 card，反转，播放
    }
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  bind:this={containerEl}
  class="player-container is-{mode}"
  onclick={(e) => e.stopPropagation()}
>
  {#if mode === 'capsule'}
    <!-- 和现在几乎一样 -->
    <div class="capsule-body" onclick={goStrip} onkeydown={...}>
      <button class="mini-play" ...>
        <!-- 进度环 SVG -->
      </button>
    </div>

  {:else if mode === 'strip'}
    <div class="strip-body" ondblclick={goCard}>
      <div class="art-strip">
        <img src={currentTrack.cover} alt="" />
      </div>
      <div class="track-info" onclick={goCard}>
        <span>{currentTrack.title} — {currentTrack.artist}</span>
      </div>
      <div class="strip-ctrls">
        <button onclick={prevTrack}>◀</button>
        <button onclick={togglePlay}>{playing ? '❚❚' : '▶'}</button>
        <button onclick={nextTrack}>▶▶</button>
      </div>
    </div>

  {:else if mode === 'card'}
    <div class="card-body">
      <div class="art-card">
        <img src={currentTrack.cover} alt="" />
      </div>
      <div class="card-title">{currentTrack.title}</div>
      <div class="card-artist">{currentTrack.artist}</div>
      <div class="ctrl-group">
        <button onclick={prevTrack}>◀</button>
        <button onclick={togglePlay}>{playing ? '❚❚' : '▶'}</button>
        <button onclick={nextTrack}>▶▶</button>
      </div>
      <div class="progress-row">
        <input type="range" value={progress} />
        <span class="time">{formatTime(current)}</span>
      </div>
      <button class="close-btn" onclick={goCapsule}>✕</button>
    </div>
  {/if}
</div>
```

---

## 八、迁移步骤

### Phase 1：Token 预备（不改组件）
1. 验证 `--layout-bar-height` = 44px，`--layout-capsule-height` = 40px
2. 新增 player 专用语义 token（可选，保持现有体系）：

```css
/* 可选：在 shape.css 或新建 player-tokens.css */
:root {
  --player-capsule-radius: calc(var(--layout-capsule-height) / 2);  /* 20px */
  --player-strip-radius: calc(var(--layout-bar-height) / 2);        /* 22px */
  --player-card-radius: var(--blog-radius-lg);                      /* 16px */
  --player-strip-width: 300px;
  --player-card-width: 280px;
  --player-card-height: var(--blog-space-18);                       /* 72px */
}
```

### Phase 2：状态模型重写
- `expanded: boolean` → `mode: 'capsule' | 'strip' | 'card'`
- 删除现有的 `.is-capsule` / `.is-expanded` 两态 CSS
- 新增 `.is-capsule` / `.is-strip` / `.is-card` 三态 CSS

### Phase 3：Strip 布局实现
- 新建 `.strip-body` 模板 + 样式
- 验证 pill 圆角在 capsule→strip 间无需过渡
- 实现 8 秒自动回退逻辑

### Phase 4：Mini Card 布局实现
- 新建 `.card-body` Grid 布局
- 实现进度条（复用现有 progress ring 可改直条）

### Phase 5：动画管线
- 拆分为列 `transition` 属性
- 实现 `clip-path: inset() round` 形状过渡
- 子元素反向缩放修正

### Phase 6：边界处理
- `prefers-reduced-motion` 降级为无动画
- 小屏（<360px）strip 宽度自适应
- BaseLayout 容器 CSS 更新

---

## 九、降级与兼容

```css
/* 小屏：strip 宽度缩小，不溢出 */
@media (max-width: 380px) {
  .is-strip {
    width: calc(100vw - var(--layout-edge-margin) * 2);
  }
  .is-card {
    width: calc(100vw - var(--layout-edge-margin) * 2);
  }
}

/* 无 clip-path 支持的浏览器回退到 border-radius 过渡 */
@supports not (clip-path: inset(0 round 0px)) {
  .player-container {
    transition: border-radius var(--blog-motion-duration-slow)
      var(--blog-motion-easing-emphasized);
  }
}

/* reduced motion 用户：瞬间切换，无动画 */
@media (prefers-reduced-motion: reduce) {
  .player-container {
    transition: none !important;
    clip-path: none !important;
  }
}
```

---

## 十、核心优势总结

| 痛点 | 当前问题 | 重写后 |
|------|----------|--------|
| 圆角过渡割裂 | `all` 绑定 9999px→20px 在同一曲线上 | capsule→strip 无圆角变化；strip→card 用 clip-path 接管 |
| `overflow` 突变 | visible→hidden 瞬间裁剪 | 全程 `overflow: hidden`，依靠 padding 和子元素 scale 修正 |
| 展开后过于庞大 | 100% 宽度全幅卡片，撑满屏幕 | 最大 300px 宽，72px 高，不影响阅读 |
| 缺少中间态 | 要么胶囊要么全卡 | 有 strip 快速控制态，够用即可 |
| 动画属性混杂 | `all 0.4s` 一次性过渡 | 逐属性分轨，各自有独立的 duration/easing |
