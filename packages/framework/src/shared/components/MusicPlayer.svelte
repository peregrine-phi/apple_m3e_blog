<!--
  MusicPlayer.svelte — Apple 极简 × M3 Shape 音乐播放器 (v2)

  三态混合模型：Capsule → Strip → Card

  设计语言：
  - Apple Music 式克制留白与精致玻璃态
  - Material Design 3 形状系统：药丸容器 (Full)、圆角方形封面 (Large)、
    卡片容器 (M3 XL)、圆形控制器 (Full)
  - 液态玻璃基底 (--blog-glass-*)，saturate 增强
  - clip-path: inset() round 驱动无割裂形状过渡

  状态流：
    Capsule (88×40 pill)  ──click──▶  Strip (300×44 pill)  ──click cover/title──▶  Card (280×auto rounded rect)
    ◀──outside/ESC───────────────────  ◀──outside/ESC────────────────────────────────┘
-->

<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { slide } from 'svelte/transition';

  // ════════════════════════════════════════════
  // Props
  // ════════════════════════════════════════════
  let {
    audioList = [],
    apiEndpoint = '',
    fallbackTracks = [],
  } = $props();

  // ════════════════════════════════════════════
  // Audio State
  // ════════════════════════════════════════════
  let audio = $state(null);
  let tracks = $state([]);
  let currentIndex = $state(0);
  let playing = $state(false);
  let duration = $state(0);
  let current = $state(0);
  let buffered = $state(0);
  let buffering = $state(false);

  // ════════════════════════════════════════════
  // Three-State Mode: 'capsule' | 'strip' | 'card'
  // ════════════════════════════════════════════
  /** @type {'capsule'|'strip'|'card'} */
  let mode = $state('capsule');
  let stripTimer = null;
  let containerEl = $state(null);

  // ════════════════════════════════════════════
  // UI State
  // ════════════════════════════════════════════
  let volume = $state(0.8);
  let muted = $state(false);
  let playlistOpen = $state(false);
  let consecutiveErrors = $state(0);
  let error = $state('');
  let loading = $state(true);

  // ════════════════════════════════════════════
  // Title Marquee Scroll
  // ════════════════════════════════════════════
  let offset = $state(0);
  let scrollDistance = $state(0);
  let dir = $state(1);
  let titleElement = $state(null);
  let titleContainer = $state(null);
  let scrollInterval = null;

  // ════════════════════════════════════════════
  // i18n
  // ════════════════════════════════════════════
  let lang = $state('en');

  const dict = $derived({
    unknownTrack: lang === 'zh' ? '未知曲目' : 'Unknown Track',
    unknownArtist: lang === 'zh' ? '未知艺术家' : 'Unknown Artist',
    unknown: lang === 'zh' ? '未知' : 'Unknown',
    fallbackLoaded: lang === 'zh' ? '在线歌单不可用，已载入兜底音乐' : 'Online playlist unavailable, fallback loaded',
    loadFailed: lang === 'zh' ? '播放源加载失败，请检查网络' : 'Failed to load audio source, check network',
    musicBox: lang === 'zh' ? '音乐盒' : 'MUSIC BOX',
    playlist: lang === 'zh' ? '播放列表' : 'PLAYLIST',
    loading: lang === 'zh' ? '载入中' : 'Loading',
    play: lang === 'zh' ? '播放' : 'Play',
    pause: lang === 'zh' ? '暂停' : 'Pause',
    collapse: lang === 'zh' ? '折叠' : 'Collapse',
    prev: lang === 'zh' ? '上一首' : 'Previous',
    next: lang === 'zh' ? '下一首' : 'Next',
    mute: lang === 'zh' ? '静音' : 'Mute',
    unmute: lang === 'zh' ? '取消静音' : 'Unmute',
    volume: lang === 'zh' ? '音量' : 'Volume',
  });

  function handleLangChange(e) {
    lang = e.detail.lang;
  }

  // ════════════════════════════════════════════
  // Mode Switching — Direction-aware timing
  //
  // Capsule→Strip: small pill-to-pill change → snappy 280ms
  // Strip→Card: major layout expansion → deliberate 500ms
  // Collapse (any→capsule): quick dismissal → 250ms
  //
  // --_size-dur is consumed by CSS transition for width/clip-path/shadow.
  // Height is handled separately by animateHeight() via WAAPI because
  // CSS transition cannot interpolate between fixed px and auto.
  // ════════════════════════════════════════════
  let heightAnim = null;

  function setTimingFor(targetMode) {
    if (!containerEl) return;
    const ms = targetMode === 'card' ? '500ms' : targetMode === 'strip' ? '280ms' : '250ms';
    containerEl.style.setProperty('--_size-dur', ms);
  }

  function animateHeight(from, to, ms) {
    if (!containerEl) return;
    if (heightAnim) { heightAnim.cancel(); heightAnim = null; }
    heightAnim = containerEl.animate(
      [{ height: from + 'px' }, { height: to + 'px' }],
      {
        duration: ms,
        easing: 'cubic-bezier(0, 0, 0, 1)', /* M3 decelerate */
        fill: 'forwards'
      }
    );
    heightAnim.onfinish = () => {
      containerEl.style.height = (to === 'auto') ? '' : to + 'px';
      heightAnim = null;
    };
  }

  function goStrip() {
    setTimingFor('strip');
    const fromH = containerEl?.getBoundingClientRect().height;
    mode = 'strip';
    playlistOpen = false;
    clearTimeout(stripTimer);
    if (containerEl && fromH && fromH !== 44) {
      animateHeight(fromH, 44, 280);
    }
    stripTimer = setTimeout(() => {
      if (mode === 'strip') goCapsule();
    }, 8000);
  }

  function goCard() {
    setTimingFor('card');
    const fromH = containerEl?.getBoundingClientRect().height;
    mode = 'card';
    playlistOpen = false;
    clearTimeout(stripTimer);
    // Measure card's natural height after DOM update, then animate
    requestAnimationFrame(() => {
      const toH = containerEl?.scrollHeight;
      if (containerEl && fromH && toH) {
        animateHeight(fromH, toH, 500);
      }
    });
  }

  function goCapsule() {
    setTimingFor('capsule');
    const fromH = containerEl?.getBoundingClientRect().height;
    mode = 'capsule';
    playlistOpen = false;
    clearTimeout(stripTimer);
    if (containerEl && fromH && fromH !== 40) {
      animateHeight(fromH, 40, 250);
    }
  }

  function handleOutsideClick() {
    if (mode !== 'capsule') goCapsule();
  }

  function handleKeydown(e) {
    if (e.key === 'Escape' && mode !== 'capsule') goCapsule();
  }

  function resetStripTimer() {
    if (mode === 'strip') {
      clearTimeout(stripTimer);
      stripTimer = setTimeout(() => {
        if (mode === 'strip') goCapsule();
      }, 8000);
    }
  }

  // Re-measure card height when drawer toggles (changes content size)
  $effect(() => {
    if (mode === 'card' && containerEl) {
      const _drawer = playlistOpen; // dependency
      requestAnimationFrame(() => {
        const newH = containerEl.scrollHeight;
        if (newH) {
          const curH = containerEl.getBoundingClientRect().height;
          if (Math.abs(curH - newH) > 2) {
            animateHeight(curH, newH, 350);
          }
        }
      });
    }
  });

  // ════════════════════════════════════════════
  // Lifecycle
  // ════════════════════════════════════════════
  onMount(async () => {
    if (typeof document !== 'undefined') {
      lang = document.documentElement.getAttribute('lang') || 'en';
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('lang-change', handleLangChange);
      window.addEventListener('keydown', handleKeydown);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('click', handleOutsideClick);
    }

    audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = volume;

    // Named handlers for proper cleanup
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleBufferingStart);
    audio.addEventListener('canplay', handleBufferingEnd);
    audio.addEventListener('progress', handleProgress);

    if (apiEndpoint) {
      await loadFromAPI();
    } else {
      tracks = audioList.length > 0 ? audioList : fallbackTracks;
      loading = false;
    }

    if (tracks.length > 0) {
      initCurrent();
    }
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('lang-change', handleLangChange);
      window.removeEventListener('keydown', handleKeydown);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', handleOutsideClick);
    }
    if (audio) {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleBufferingStart);
      audio.removeEventListener('canplay', handleBufferingEnd);
      audio.removeEventListener('progress', handleProgress);
      audio = null;
    }
    if (scrollInterval) clearInterval(scrollInterval);
    clearTimeout(stripTimer);
    if (heightAnim) { heightAnim.cancel(); heightAnim = null; }
  });

  // ════════════════════════════════════════════
  // API Loading & Cache (1 hour TTL)
  // ════════════════════════════════════════════
  async function loadFromAPI() {
    try {
      const cached = localStorage.getItem('meting_cache');
      const cacheTime = localStorage.getItem('meting_cache_time');
      const cacheEndpoint = localStorage.getItem('meting_cache_endpoint');
      const now = Date.now();

      if (cached && cacheTime && cacheEndpoint === apiEndpoint && (now - Number(cacheTime) < 3600000)) {
        tracks = JSON.parse(cached);
        loading = false;
        return;
      }

      console.log('[Music] 请求 API:', apiEndpoint);
      const res = await fetch(`${apiEndpoint}&r=${Date.now()}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      const formatted = data.map(item => ({
        name: item.title || item.name || dict.unknownTrack,
        artist: item.author || item.artist || dict.unknownArtist,
        src: item.url,
        cover: item.pic || '',
      }));

      if (formatted.length === 0) throw new Error('歌单为空');

      localStorage.setItem('meting_cache', JSON.stringify(formatted));
      localStorage.setItem('meting_cache_time', String(now));
      localStorage.setItem('meting_cache_endpoint', apiEndpoint);

      tracks = formatted;
      error = '';
    } catch (err) {
      console.warn('[Music] Meting API 加载失败，启用高可用兜底:', err.message);
      error = dict.fallbackLoaded;
      tracks = fallbackTracks;
    } finally {
      loading = false;
    }
  }

  // ════════════════════════════════════════════
  // Audio Control
  // ════════════════════════════════════════════
  function initCurrent() {
    if (tracks.length === 0) return;
    const track = tracks[currentIndex];
    if (!track || !audio) return;
    audio.src = track.src;
    audio.load();
    playing = false;
    setupScroll();
  }

  function playCurrent() {
    if (tracks.length === 0) return;
    const track = tracks[currentIndex];
    if (!track || !audio) return;
    audio.src = track.src;
    audio.play()
      .then(() => { playing = true; error = ''; })
      .catch((err) => {
        console.warn('[Music] 播放失败 (通常由浏览器限制引起):', err);
        playing = false;
      });
    setupScroll();
  }

  function togglePlay() {
    if (!audio) return;
    if (playing) {
      audio.pause();
      playing = false;
    } else {
      if (!audio.src || audio.src === window.location.href) {
        playCurrent();
      } else {
        audio.play()
          .then(() => { playing = true; })
          .catch((err) => {
            console.warn('[Music] 播放失败:', err);
            playing = false;
          });
      }
    }
  }

  function prev() {
    if (tracks.length === 0) return;
    currentIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    playCurrent();
    resetStripTimer();
  }

  function next() {
    if (tracks.length === 0) return;
    currentIndex = (currentIndex + 1) % tracks.length;
    playCurrent();
    resetStripTimer();
  }

  function selectTrack(index) {
    currentIndex = index;
    playCurrent();
    playlistOpen = false;
    resetStripTimer();
  }

  // ════════════════════════════════════════════
  // Audio Event Handlers (named for proper cleanup)
  // ════════════════════════════════════════════
  function handleLoadedMetadata() {
    duration = audio.duration;
    consecutiveErrors = 0;
    if (error && error !== dict.fallbackLoaded) {
      error = '';
    }
  }

  function handleTimeUpdate() {
    current = audio.currentTime;
  }

  function handleEnded() {
    next();
  }

  function handleError() {
    console.warn('[Music] 音频源加载失败:', tracks[currentIndex]?.name);
    consecutiveErrors++;

    if (consecutiveErrors >= tracks.length) {
      consecutiveErrors = 0;
      playing = false;
      error = dict.loadFailed;
      return;
    }

    next();
  }

  function handleBufferingStart() {
    buffering = true;
  }

  function handleBufferingEnd() {
    buffering = false;
  }

  function handleProgress() {
    if (audio && audio.buffered.length > 0 && audio.duration) {
      buffered = audio.buffered.end(audio.buffered.length - 1) / audio.duration;
    }
  }

  // ════════════════════════════════════════════
  // Volume & Mute
  // ════════════════════════════════════════════
  function handleVolumeChange(e) {
    const val = parseFloat(e.target.value);
    volume = val;
    if (audio) audio.volume = val;
    if (val > 0) muted = false;
  }

  function toggleMute() {
    muted = !muted;
    if (audio) audio.muted = muted;
  }

  // ════════════════════════════════════════════
  // Seek
  // ════════════════════════════════════════════
  function seekByClick(e) {
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
    current = audio.currentTime;
  }

  // ════════════════════════════════════════════
  // Title Marquee Scroll
  // ════════════════════════════════════════════
  function setupScroll() {
    if (scrollInterval) {
      clearInterval(scrollInterval);
      scrollInterval = null;
    }

    offset = 0;
    dir = 1;

    tick().then(() => {
      if (!titleElement || !titleContainer) return;

      scrollDistance = titleElement.scrollWidth - titleContainer.clientWidth;

      if (scrollDistance > 0) {
        scrollInterval = setInterval(() => {
          offset += dir;
          if (offset <= 0) {
            dir = 1;
          } else if (offset >= scrollDistance) {
            dir = -1;
          }
        }, 80);
      }
    });
  }

  // ════════════════════════════════════════════
  // Utilities
  // ════════════════════════════════════════════
  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // ════════════════════════════════════════════
  // Derived: current track
  // ════════════════════════════════════════════
  let currentTrack = $derived(tracks[currentIndex] || null);
  let coverUrl = $derived(currentTrack?.cover || '/music/default-cover.svg');
  let progressRatio = $derived(duration ? current / duration : 0);
</script>

<!-- ═══════════════════════════════════════════════
     LOADING STATE
     ═══════════════════════════════════════════════ -->
{#if loading}
  <div class="player-container is-capsule loading-state">
    <div class="md-progress" role="progressbar" aria-label={dict.loading}>
      <div class="md-progress__primary"><div class="md-progress__bar-inner"></div></div>
      <div class="md-progress__secondary"><div class="md-progress__bar-inner"></div></div>
    </div>
  </div>

<!-- ═══════════════════════════════════════════════
     EMPTY STATE: no tracks → nothing rendered
     ═══════════════════════════════════════════════ -->
{:else if tracks.length === 0}

<!-- ═══════════════════════════════════════════════
     THREE-STATE PLAYER
     ═══════════════════════════════════════════════ -->
{:else}
  <div
    bind:this={containerEl}
    class="player-container is-{mode}"
    onclick={(e) => e.stopPropagation()}
  >

    <!-- ═══════════════════════════════════════
         CAPSULE — 88×40 pill micro player
         M3 Full (pill shell) + XS (cover thumb)
         ═══════════════════════════════════════ -->
    {#if mode === 'capsule'}
      <div
        class="capsule-body"
        onclick={goStrip}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') goStrip(); }}
        role="button"
        tabindex="0"
        aria-label="{dict.play} — {currentTrack?.name || dict.unknownTrack}"
      >
        <!-- M3 XS: cover thumbnail (rounded square) -->
        <div class="art-thumb">
          <img src={coverUrl} alt="" />
        </div>

        <!-- Play/pause button with progress ring -->
        <button
          class="mini-play"
          onclick={(e) => { e.stopPropagation(); togglePlay(); }}
          aria-label={playing ? dict.pause : dict.play}
        >
          {#if playing}
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          {:else}
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          {/if}
          <!-- M3 Full: progress ring -->
          <svg class="progress-ring" viewBox="0 0 28 28">
            <circle
              cx="14" cy="14" r="12"
              stroke-dasharray="75.4"
              stroke-dashoffset={75.4 * (1 - progressRatio)}
            />
          </svg>
        </button>
      </div>

    <!-- ═══════════════════════════════════════
         STRIP — 300×44 pill quick-control bar
         M3 Full (pill shell) + XS (cover)
         Auto-dismiss after 8s of inactivity
         ═══════════════════════════════════════ -->
    {:else if mode === 'strip'}
      <div class="strip-body">
        <!-- Cover: clickable to enter card mode -->
        <div class="art-strip" onclick={goCard} role="button" tabindex="0"
             onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') goCard(); }}
             aria-label="Expand player">
          <img src={coverUrl} alt="" />
        </div>

        <!-- Track info: single-line "Title — Artist", clickable to enter card -->
        <div class="track-info" onclick={goCard} role="button" tabindex="0"
             onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') goCard(); }}>
          <span class="info-text">
            {currentTrack?.name || dict.unknownTrack}
            <span class="info-sep"> — </span>
            {currentTrack?.artist || dict.unknownArtist}
          </span>
        </div>

        <!-- Transport controls -->
        <div class="strip-ctrls">
          <button class="ctrl-btn" onclick={prev} aria-label={dict.prev}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          <button class="ctrl-btn ctrl-btn--primary" onclick={togglePlay} aria-label={playing ? dict.pause : dict.play}>
            {#if playing}
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            {:else}
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            {/if}
          </button>
          <button class="ctrl-btn" onclick={next} aria-label={dict.next}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>
      </div>

    <!-- ═══════════════════════════════════════
         CARD — 280px rounded-rect expanded player
         M3 Large (cover) + Full (buttons/progress)
         Grid layout with playlist drawer support
         ═══════════════════════════════════════ -->
    {:else if mode === 'card'}
      <div class="card-body {playlistOpen ? 'has-drawer' : ''}">

        <!-- M3 Large: cover art spanning full left column -->
        <div class="art-card">
          <img src={coverUrl} alt="" />
        </div>

        <!-- Card title (row 1, col 2) -->
        <div class="card-title-wrap" bind:this={titleContainer}>
          <span class="card-title" bind:this={titleElement} style="transform: translateX(-{offset}px)">
            {currentTrack?.name || dict.unknownTrack}
          </span>
        </div>

        <!-- Card artist (row 2, col 2) -->
        <div class="card-artist">{currentTrack?.artist || dict.unknownArtist}</div>

        <!-- Error notification (row 3, full width) -->
        {#if error}
          <div class="error-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        {/if}

        <!-- M3 Full: progress bar (row 4, full width) -->
        <div class="progress-row">
          <div
            class="progress-track"
            onclick={seekByClick}
            onkeydown={(e) => {
              if (!audio || !duration) return;
              if (e.key === 'ArrowRight') { audio.currentTime = Math.min(audio.currentTime + 5, duration); current = audio.currentTime; }
              if (e.key === 'ArrowLeft') { audio.currentTime = Math.max(audio.currentTime - 5, 0); current = audio.currentTime; }
            }}
            role="button"
            tabindex="0"
          >
            <div class="progress-buffer" style="transform: scaleX({buffered || 0})"></div>
            <div class="progress-fill" style="transform: scaleX({progressRatio})"></div>
            {#if buffering}
              <div class="progress-scan"></div>
            {/if}
          </div>
          <div class="time-row">
            <span>{formatTime(current)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <!-- Transport controls (row 5, full width) -->
        <div class="ctrl-group">
          <button class="ctrl-icon {playlistOpen ? 'active' : ''}" onclick={() => { playlistOpen = !playlistOpen; }} aria-label={dict.playlist}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>

          <div class="transport">
            <button class="ctrl-icon" onclick={prev} aria-label={dict.prev}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            <button class="ctrl-play" onclick={togglePlay} aria-label={playing ? dict.pause : dict.play}>
              {#if playing}
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              {:else}
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              {/if}
            </button>
            <button class="ctrl-icon" onclick={next} aria-label={dict.next}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
          </div>

          <button class="ctrl-icon" onclick={toggleMute} aria-label={muted ? dict.unmute : dict.mute}>
            {#if muted || volume === 0}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            {:else if volume < 0.5}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            {:else}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            {/if}
          </button>
        </div>

        <!-- Volume slider (row 6, full width) -->
        <div class="vol-row">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            oninput={handleVolumeChange}
            class="vol-input"
            style="background: linear-gradient(90deg, var(--blog-color-primary) {volume * 100}%, var(--blog-color-surface-variant) {volume * 100}%)"
            aria-label={dict.volume}
          />
        </div>

        <!-- Playlist drawer (slides up from bottom of card) -->
        {#if playlistOpen}
          <div class="drawer" transition:slide={{ duration: 250 }}>
            <div class="drawer-head">
              <span>{dict.playlist} ({tracks.length})</span>
              <button class="drawer-close" onclick={() => { playlistOpen = false; }}>✕</button>
            </div>
            <div class="drawer-list">
              {#each tracks as t, idx}
                <div
                  class="drawer-row {idx === currentIndex ? 'active' : ''}"
                  onclick={() => selectTrack(idx)}
                  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectTrack(idx); }}
                  role="button"
                  tabindex="0"
                >
                  <img class="drawer-cover" src={t.cover || '/music/default-cover.svg'} alt="" />
                  <div class="drawer-meta">
                    <span class="drawer-title">{t.name}</span>
                    <span class="drawer-artist">{t.artist || dict.unknown}</span>
                  </div>
                  {#if idx === currentIndex && playing}
                    <div class="wave-bars">
                      <span class="wave wave-1"></span>
                      <span class="wave wave-2"></span>
                      <span class="wave wave-3"></span>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}

      </div>
    {/if}

  </div>
{/if}


<style>
  /* ═══════════════════════════════════════════════════════════
     DESIGN: Apple Minimal × Material Design 3 Shape System (v2)

     Three-State Model:
       Capsule → Strip → Card
       88×40    → 300×44 → 280×auto

     Shape Mapping:
       M3 Full  (9999px)  → capsule/strip shells, buttons, progress
       M3 Large (12px)    → cover art (card mode)
       M3 XS    (4px)     → cover thumbnails (capsule/strip)
       Player Card (16px) → card shell (--player-card-radius)

     Animation Pipeline:
       clip-path: inset() round drives shape transitions.
       Capsule→Strip: pill-to-pill (no visual radius change).
       Strip→Card: pill-to-rect (clip-path interpolates smoothly).

     Token Source:
       --player-capsule-radius  = 20px (height/2)
       --player-strip-radius    = 22px (height/2)
       --player-card-radius     = 16px (--blog-radius-lg)
       --player-strip-width     = 300px
       --player-card-width      = 280px
  ═══════════════════════════════════════════════════════════ */

  /* ── Container Base: Glass Morphism ── */
  .player-container {
    --_size-dur: 280ms; /* default: snappy for capsule↔strip */
    box-sizing: border-box;
    background: var(--blog-glass-bg);
    backdrop-filter: var(--blog-glass-backdrop);
    -webkit-backdrop-filter: var(--blog-glass-backdrop);
    border: 1px solid var(--blog-glass-border);
    color: var(--blog-color-on-surface);
    overflow: hidden;

    /* ── Transition pipeline (direction-aware via --_size-dur) ──
       Height is NOT listed here — WAAPI handles it in JS because
       CSS transition cannot interpolate fixed px ↔ auto.

       --_size-dur is set per-transition by goStrip/goCard/goCapsule:
         capsule→strip:  280ms  (snappy pill stretch)
         strip→card:    500ms  (deliberate expansion, decelerate landing)
         any→capsule:    250ms  (quick dismissal)
    */
    transition:
      /* Shape: 350ms emphasized — always settles before size */
      clip-path var(--blog-motion-duration-slow) var(--blog-motion-easing-emphasized),
      /* Size: direction-aware duration, decelerate for smooth arrival */
      width var(--_size-dur) var(--blog-motion-easing-decelerate),
      /* Padding: match size duration */
      padding var(--_size-dur) var(--blog-motion-easing-decelerate),
      /* Surface: glass glow */
      box-shadow var(--_size-dur) var(--blog-motion-easing-standard),
      background var(--blog-motion-duration-normal) var(--blog-motion-easing-standard),
      border-color var(--blog-motion-duration-normal) var(--blog-motion-easing-standard);
  }

  .player-container:hover {
    box-shadow: var(--blog-glass-shadow-hover);
    border-color: var(--blog-glass-border-hover);
  }

  /* Loading state (capsule-sized pill) */
  .loading-state {
    padding: var(--blog-space-4);
    display: flex;
    align-items: center;
    justify-content: center;
  }


  /* ══════════════════════════════════════════════════
     MODE: CAPSULE — 88×40 pill
     ══════════════════════════════════════════════════ */
  .is-capsule {
    --player-radius: var(--player-capsule-radius); /* 20px */
    width: 88px;
    height: var(--pill-h-md); /* 40px */
    padding: var(--blog-space-1); /* 4px */
    cursor: pointer;
    clip-path: inset(0 round var(--player-radius));
    border-radius: var(--player-radius); /* fallback */
    box-shadow: var(--blog-glass-shadow);
  }

  .capsule-body {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    height: 100%;
  }

  /* M3 Full: cover thumbnail (circle) */
  .art-thumb {
    width: 32px;
    height: 32px;
    border-radius: var(--blog-radius-full); /* circle */
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .art-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  /* Play button + progress ring */
  .mini-play {
    position: relative;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: var(--blog-radius-full); /* M3 Full */
    background: color-mix(in srgb, var(--blog-color-primary) 12%, transparent);
    color: var(--blog-color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
    margin-left: auto;
    padding: 0;
  }

  .mini-play:hover {
    background: color-mix(in srgb, var(--blog-color-primary) 22%, transparent);
    transform: scale(1.06);
  }

  .mini-play svg:not(.progress-ring) {
    width: 11px;
    height: 11px;
    position: relative;
    z-index: 1;
  }

  /* M3 Full: micro progress ring inside capsule */
  .progress-ring {
    position: absolute;
    inset: 0;
    width: 28px;
    height: 28px;
    transform: rotate(-90deg);
    pointer-events: none;
  }

  .progress-ring circle {
    fill: none;
    stroke: var(--blog-color-primary);
    stroke-width: 2;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }


  /* ══════════════════════════════════════════════════
     MODE: STRIP — 300×44 pill quick-control bar
     ══════════════════════════════════════════════════ */
  .is-strip {
    --player-radius: var(--player-strip-radius); /* 22px */
    width: var(--player-strip-width); /* 300px */
    max-width: calc(100vw - var(--layout-edge-margin) * 2);
    height: var(--layout-bar-height); /* 44px */
    padding-inline: var(--blog-space-2); /* 8px */
    padding-block: var(--blog-space-1);  /* 4px */
    clip-path: inset(0 round var(--player-radius));
    border-radius: var(--player-radius); /* fallback */
    box-shadow: var(--blog-elevation-3);
  }

  .strip-body {
    display: flex;
    align-items: center;
    gap: var(--blog-space-2); /* 8px */
    width: 100%;
    height: 100%;
  }

  /* M3 Full: strip cover thumbnail (circle) */
  .art-strip {
    width: 32px;
    height: 32px;
    border-radius: var(--blog-radius-full); /* circle */
    overflow: hidden;
    flex-shrink: 0;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    transition: transform 0.15s ease;
  }

  .art-strip:hover {
    transform: scale(1.06);
  }

  .art-strip img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  /* Track info: single-line truncation */
  .track-info {
    flex: 1;
    min-width: 0;
    cursor: pointer;
    overflow: hidden;
  }

  .info-text {
    font-size: var(--mp-info-size);
    font-weight: var(--mp-info-weight);
    color: var(--blog-color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    letter-spacing: var(--mp-info-tracking);
  }

  .info-sep {
    font-weight: var(--mp-info-sep-weight);
    opacity: 0.5;
  }

  /* Strip transport controls */
  .strip-ctrls {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: var(--blog-space-1); /* 4px — tighter in strip */
  }

  .ctrl-btn {
    background: none;
    border: none;
    color: var(--blog-color-text-secondary);
    cursor: pointer;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--blog-radius-full); /* M3 Full */
    transition: all 0.2s;
    padding: 0;
  }

  .ctrl-btn:hover {
    background: var(--blog-color-surface-variant);
    color: var(--blog-color-text-primary);
  }

  .ctrl-btn svg {
    width: 14px;
    height: 14px;
  }

  .ctrl-btn--primary {
    background: color-mix(in srgb, var(--blog-color-primary) 12%, transparent);
    color: var(--blog-color-primary);
  }

  .ctrl-btn--primary:hover {
    background: color-mix(in srgb, var(--blog-color-primary) 22%, transparent);
    transform: scale(1.06);
  }


  /* ══════════════════════════════════════════════════
     MODE: CARD — 280px rounded-rect expanded player
     Grid layout: cover | title / artist / progress / controls
     ══════════════════════════════════════════════════ */
  .is-card {
    --player-radius: var(--player-card-radius); /* 16px */
    width: var(--player-card-width); /* 280px */
    max-width: calc(100vw - var(--layout-edge-margin) * 2);
    padding: var(--blog-space-2); /* 8px */
    /* height intentionally omitted: auto by default, animated via WAAPI
       in goCard() to avoid CSS transition's inability to lerp px↔auto. */
    clip-path: inset(0 round var(--player-radius));
    border-radius: var(--player-radius); /* fallback */
    box-shadow: var(--blog-elevation-4);
  }

  .card-body {
    display: grid;
    grid-template-columns: 56px 1fr;
    grid-template-rows: auto auto;
    gap: var(--blog-space-1-5); /* 6px */
    align-items: center;
    position: relative;
  }

  /* When playlist drawer is open, expand to accommodate it */
  .card-body.has-drawer {
    grid-template-rows: auto auto;
    padding-bottom: 210px; /* space for drawer overlay */
  }

  /* M3 Large: cover art (rounded square, spanning left column) */
  .art-card {
    grid-column: 1;
    grid-row: 1 / 3; /* span title + artist rows */
    width: 56px;
    height: 56px;
    border-radius: var(--blog-radius-md); /* 12px */
    overflow: hidden;
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.08),
      0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .art-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  /* Card title with marquee scroll support */
  .card-title-wrap {
    grid-column: 2;
    grid-row: 1;
    overflow: hidden;
    height: 18px;
    display: flex;
    align-items: center;
  }

  .card-title {
    display: inline-block;
    white-space: nowrap;
    font-size: var(--mp-card-title-size);
    font-weight: var(--mp-card-title-weight);
    color: var(--blog-color-text-primary);
    letter-spacing: var(--mp-card-title-tracking);
    transition: transform 0.08s linear;
  }

  /* Card artist */
  .card-artist {
    grid-column: 2;
    grid-row: 2;
    font-size: var(--mp-artist-size);
    color: var(--blog-color-text-secondary);
    font-weight: var(--mp-artist-weight);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Error bar (M3 Small) — spans full width */
  .error-bar {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--blog-color-error-container);
    color: var(--blog-color-on-error-container);
    padding: 6px 10px;
    border-radius: var(--blog-radius-sm); /* 8px */
    font-size: var(--blog-typescale-label-small-size);
    animation: shake 0.4s ease;
  }

  .error-bar svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-3px); }
    75% { transform: translateX(3px); }
  }

  /* ── M3 Full: Progress Bar ── spans full width */
  .progress-row {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .progress-track {
    position: relative;
    width: 100%;
    height: 14px;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .progress-track::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--blog-color-surface-variant);
    border-radius: var(--blog-radius-full); /* M3 Full */
    transition: height 0.15s ease;
  }

  .progress-track:hover::before {
    height: 5px;
  }

  .progress-buffer {
    position: absolute;
    left: 0;
    right: 0;
    height: 3px;
    background: color-mix(in srgb, var(--blog-color-primary) 25%, var(--blog-color-surface-variant));
    border-radius: var(--blog-radius-full);
    transform-origin: left;
    pointer-events: none;
    transition: height 0.15s ease;
  }

  .progress-track:hover .progress-buffer {
    height: 5px;
  }

  .progress-fill {
    position: absolute;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--blog-color-primary);
    border-radius: var(--blog-radius-full);
    transform-origin: left;
    pointer-events: none;
    transition: height 0.15s ease;
  }

  .progress-track:hover .progress-fill {
    height: 5px;
  }

  /* Progress leading dot */
  .progress-fill::after {
    content: '';
    position: absolute;
    top: -1px;
    right: -2px;
    width: 5px;
    height: 5px;
    background: var(--blog-color-primary);
    border-radius: var(--blog-radius-full);
    box-shadow: 0 0 4px color-mix(in srgb, var(--blog-color-primary) 40%, transparent);
    opacity: 0;
    transition: opacity 0.15s;
  }

  .progress-track:hover .progress-fill::after {
    opacity: 1;
  }

  /* Buffering scan animation */
  .progress-scan {
    position: absolute;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.2) 50%,
      transparent 100%
    );
    border-radius: var(--blog-radius-full);
    animation: scan 1.8s infinite ease-in-out;
    pointer-events: none;
  }

  @keyframes scan {
    from { transform: translateX(-100%); }
    to   { transform: translateX(100%); }
  }

  .time-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--mp-time-size);
    color: var(--blog-color-text-tertiary);
    font-variant-numeric: tabular-nums;
    font-weight: var(--mp-time-weight);
  }

  /* ── M3 Full: Transport Controls ── spans full width */
  .ctrl-group {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .transport {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* Icon button (reused from strip, with card-specific sizing) */
  .ctrl-icon {
    background: none;
    border: none;
    color: var(--blog-color-text-secondary);
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--blog-radius-full); /* M3 Full */
    transition: all 0.2s;
    padding: 0;
  }

  .ctrl-icon:hover {
    background: var(--blog-color-surface-variant);
    color: var(--blog-color-text-primary);
  }

  .ctrl-icon.active {
    color: var(--blog-color-primary);
    background: color-mix(in srgb, var(--blog-color-primary) 10%, transparent);
  }

  .ctrl-icon svg {
    width: 16px;
    height: 16px;
  }

  /* Primary play button (M3 Full, elevated) */
  .ctrl-play {
    background: var(--blog-color-primary);
    color: var(--blog-color-on-primary);
    width: 36px;
    height: 36px;
    border-radius: var(--blog-radius-full);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
    box-shadow:
      0 4px 12px color-mix(in srgb, var(--blog-color-primary) 25%, transparent);
    padding: 0;
  }

  .ctrl-play:hover {
    transform: scale(1.06);
    box-shadow:
      0 6px 18px color-mix(in srgb, var(--blog-color-primary) 35%, transparent);
  }

  .ctrl-play:active {
    transform: scale(0.96);
  }

  .ctrl-play svg {
    width: 16px;
    height: 16px;
  }

  /* ── Volume Slider ── spans full width */
  .vol-row {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    padding: 0 2px;
  }

  .vol-input {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 3px;
    border-radius: var(--blog-radius-full);
    outline: none;
    cursor: pointer;
    transition: height 0.15s;
  }

  .vol-input:hover {
    height: 4px;
  }

  .vol-input::-webkit-slider-runnable-track {
    width: 100%;
    height: 100%;
    background: transparent;
  }

  .vol-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 10px;
    height: 10px;
    border-radius: var(--blog-radius-full);
    background: var(--blog-color-primary);
    border: 2px solid var(--blog-color-surface);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
    margin-top: -3.5px;
    transition: transform 0.15s;
  }

  .vol-input:hover::-webkit-slider-thumb {
    transform: scale(1.2);
  }


  /* ══════════════════════════════════════════════════
     PLAYLIST DRAWER — slides up from bottom of card
     M3 Large (top radius) + Small (row items)
     ══════════════════════════════════════════════════ */
  .drawer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 200px;
    background: var(--blog-color-surface);
    border-top: 1px solid var(--blog-color-divider);
    border-radius: var(--blog-radius-md) var(--blog-radius-md) 0 0; /* M3 Large top */
    z-index: 10;
    display: flex;
    flex-direction: column;
    box-shadow: 0 -6px 20px rgba(0, 0, 0, 0.08);
    transition: var(--blog-transition-color);
    overflow: hidden;
  }

  .drawer-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid var(--blog-color-divider);
    flex-shrink: 0;
  }

  .drawer-head span {
    font-size: var(--mp-drawer-head-size);
    font-weight: var(--blog-font-weight-bold);
    letter-spacing: var(--mp-drawer-head-tracking);
    color: var(--blog-color-text-secondary);
    text-transform: uppercase;
  }

  .drawer-close {
    background: none;
    border: none;
    font-size: var(--mp-info-size);
    color: var(--blog-color-text-tertiary);
    cursor: pointer;
    padding: 2px 6px;
    border-radius: var(--blog-radius-full);
    transition: all 0.15s;
  }

  .drawer-close:hover {
    color: var(--blog-color-text-primary);
    background: var(--blog-color-surface-variant);
  }

  .drawer-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
  }

  .drawer-list::-webkit-scrollbar {
    width: 3px;
  }

  .drawer-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .drawer-list::-webkit-scrollbar-thumb {
    background: var(--blog-color-border);
    border-radius: var(--blog-radius-full);
  }

  /* M3 Small: playlist row items */
  .drawer-row {
    display: flex;
    align-items: center;
    padding: 6px 12px;
    gap: 8px;
    cursor: pointer;
    transition: background 0.12s;
    margin: 0 4px;
    border-radius: var(--blog-radius-sm); /* 8px */
  }

  .drawer-row:hover {
    background: var(--blog-color-surface-variant);
  }

  .drawer-row.active {
    background: color-mix(in srgb, var(--blog-color-primary) 8%, transparent);
  }

  .drawer-cover {
    width: 28px;
    height: 28px;
    border-radius: var(--blog-radius-xs); /* 4px */
    object-fit: cover;
    flex-shrink: 0;
  }

  .drawer-meta {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .drawer-title {
    font-size: var(--mp-drawer-title-size);
    font-weight: var(--mp-drawer-title-weight);
    color: var(--blog-color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .drawer-artist {
    font-size: var(--mp-drawer-artist-size);
    color: var(--blog-color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Audio waveform indicator */
  .wave-bars {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 12px;
    width: 12px;
    flex-shrink: 0;
  }

  .wave {
    width: 2px;
    background: var(--blog-color-primary);
    border-radius: 1px;
  }

  .wave-1 { height: 100%; animation: wave-up 0.8s infinite alternate ease-in-out; }
  .wave-2 { height: 55%; animation: wave-up 0.6s infinite alternate ease-in-out 0.2s; }
  .wave-3 { height: 78%; animation: wave-up 0.9s infinite alternate ease-in-out 0.1s; }

  @keyframes wave-up {
    from { height: 15%; }
    to   { height: 100%; }
  }


  /* ══════════════════════════════════════════════════
     LOADING PROGRESS BAR (Material Design Indeterminate)
     ══════════════════════════════════════════════════ */
  .md-progress {
    position: relative;
    width: 100%;
    height: 3px;
    overflow: hidden;
    background: var(--blog-color-surface-variant);
    border-radius: var(--blog-radius-full);
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
    border-radius: var(--blog-radius-full);
  }

  @keyframes md-primary-translate {
    0% { transform: translateX(0); }
    20% { animation-timing-function: cubic-bezier(0.5, 0, 0.701732, 0.495819); transform: translateX(0); }
    59.15% { animation-timing-function: cubic-bezier(0.302435, 0.381352, 0.55, 0.956352); transform: translateX(83.67142%); }
    100% { transform: translateX(200.611057%); }
  }

  @keyframes md-primary-scale {
    0% { transform: scaleX(0.08); }
    36.65% { animation-timing-function: cubic-bezier(0.334731, 0.12482, 0.785844, 1); transform: scaleX(0.08); }
    69.15% { animation-timing-function: cubic-bezier(0.06, 0.11, 0.6, 1); transform: scaleX(0.661479); }
    100% { transform: scaleX(0.08); }
  }

  @keyframes md-secondary-translate {
    0% { animation-timing-function: cubic-bezier(0.15, 0, 0.515058, 0.409685); transform: translateX(0); }
    25% { animation-timing-function: cubic-bezier(0.31033, 0.284058, 0.8, 0.733712); transform: translateX(37.651913%); }
    48.35% { animation-timing-function: cubic-bezier(0.4, 0, 0.627035, 0.6, 0.902026); transform: translateX(84.386165%); }
    100% { transform: translateX(160.277782%); }
  }

  @keyframes md-secondary-scale {
    0% { animation-timing-function: cubic-bezier(0.205028, 0.057051, 0.57661, 0.453971); transform: scaleX(0.08); }
    19.15% { animation-timing-function: cubic-bezier(0.152313, 0.196432, 0.648374, 1.004315); transform: scaleX(0.457104); }
    44.15% { animation-timing-function: cubic-bezier(0.257759, -0.003163, 0.211762, 1.38179); transform: scaleX(0.72796); }
    100% { transform: scaleX(0.08); }
  }


  /* ══════════════════════════════════════════════════
     DEGRADATION & ACCESSIBILITY
     ══════════════════════════════════════════════════ */

  /* Small screens: adaptive width for strip and card */
  @media (max-width: 380px) {
    .is-strip {
      width: calc(100vw - var(--layout-edge-margin) * 2);
    }
    .is-card {
      width: calc(100vw - var(--layout-edge-margin) * 2);
    }
  }

  /* Fallback for browsers without clip-path: inset() round support */
  @supports not (clip-path: inset(0 round 0px)) {
    .player-container {
      transition:
        width var(--blog-motion-duration-slow) var(--blog-motion-spring-default),
        height var(--blog-motion-duration-slow) var(--blog-motion-spring-default),
        border-radius var(--blog-motion-duration-slow) var(--blog-motion-easing-emphasized),
        background var(--blog-motion-duration-normal) var(--blog-motion-easing-standard),
        box-shadow var(--blog-motion-duration-slow) var(--blog-motion-easing-standard);
    }
  }

  /* Reduced motion: instant state switches, no animation */
  @media (prefers-reduced-motion: reduce) {
    .player-container {
      transition: none !important;
      clip-path: none !important;
    }

    .progress-ring circle,
    .progress-fill,
    .progress-buffer,
    .progress-track::before {
      transition: none !important;
    }

    .progress-scan {
      animation: none !important;
    }

    .wave {
      animation: none !important;
    }
  }
</style>
