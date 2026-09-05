// ========== 全局配置（从config.json加载） ==========
let CONFIG = null;

// ========== 备用音乐（Meting API挂了时降级用） ==========
const FALLBACK_SONGS = [
  { title: "SoundHelix 1", artist: "SoundHelix", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { title: "SoundHelix 2", artist: "SoundHelix", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { title: "SoundHelix 3", artist: "SoundHelix", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { title: "SoundHelix 4", artist: "SoundHelix", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { title: "SoundHelix 5", artist: "SoundHelix", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
  { title: "SoundHelix 6", artist: "SoundHelix", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
  { title: "SoundHelix 7", artist: "SoundHelix", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
  { title: "SoundHelix 8", artist: "SoundHelix", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
  { title: "SoundHelix 9", artist: "SoundHelix", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
  { title: "SoundHelix 10", artist: "SoundHelix", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" }
];

// ========== 音乐播放器 ==========
let playlist = [];
let currentTrack = 0;
let isPlaying = false;
let isMuted = false;
let lastVolume = 0.7;
let audio = new Audio();
audio.volume = 0.7;
audio.referrerPolicy = 'no-referrer';

// 音量控制
document.getElementById('volume-slider').addEventListener('input', function(e) {
  const vol = e.target.value / 100;
  audio.volume = vol;
  if (vol > 0) {
    isMuted = false;
    lastVolume = vol;
    document.getElementById('volume-icon').textContent = vol > 0.5 ? '🔊' : '🔉';
  } else {
    isMuted = true;
    document.getElementById('volume-icon').textContent = '🔇';
  }
});

function toggleMute() {
  if (isMuted) {
    audio.volume = lastVolume;
    document.getElementById('volume-slider').value = lastVolume * 100;
    document.getElementById('volume-icon').textContent = lastVolume > 0.5 ? '🔊' : '🔉';
    isMuted = false;
  } else {
    lastVolume = audio.volume;
    audio.volume = 0;
    document.getElementById('volume-slider').value = 0;
    document.getElementById('volume-icon').textContent = '🔇';
    isMuted = true;
  }
}

async function initPlayer(musicConfig) {
  try {
    const res = await withTimeout(
      fetch(`${musicConfig.api}?type=playlist&id=${musicConfig.playlistId}&server=${musicConfig.server}&_t=${Date.now()}`),
      10000
    );
    const list = await res.json();
    if (Array.isArray(list) && list.length > 0) {
      list.sort(() => Math.random() - 0.5);
      playlist = list.slice(0, musicConfig.count).map(s => ({
        title: s.name || '未知歌曲',
        artist: s.artist || '未知歌手',
        url: s.url
      }));
      currentTrack = 0;
      document.getElementById('music-title').textContent = `🎵 ${playlist[0].title}`;
      document.getElementById('music-artist').textContent = playlist[0].artist;
      return;
    }
    throw new Error('歌单为空');
  } catch (e) {
    console.warn('Meting API失败，降级到备用音乐:', e);
    const shuffled = [...FALLBACK_SONGS].sort(() => Math.random() - 0.5);
    playlist = shuffled.slice(0, 8);
    currentTrack = 0;
    document.getElementById('music-title').textContent = `🎵 ${playlist[0].title}`;
    document.getElementById('music-artist').textContent = playlist[0].artist + '（备用）';
  }
}

function toggleMusic() {
  if (playlist.length === 0) {
    document.getElementById('music-title').textContent = '🎵 音乐加载中...';
    document.getElementById('music-artist').textContent = '请稍候再试';
    return;
  }
  const btn = document.getElementById('music-btn');
  if (isPlaying) {
    audio.pause();
    btn.textContent = '▶';
    isPlaying = false;
  } else {
    playTrack();
    btn.textContent = '⏸';
    isPlaying = true;
  }
}

function playTrack() {
  if (!playlist.length) return;
  const track = playlist[currentTrack];
  audio.src = track.url;
  audio.play().catch(e => {
    console.warn('播放失败:', e);
    setTimeout(() => nextTrack(), 1000);
  });
  document.getElementById('music-title').textContent = `🎵 ${track.title}`;
  document.getElementById('music-artist').textContent = track.artist;
}

function nextTrack() {
  if (!playlist.length) return;
  currentTrack = (currentTrack + 1) % playlist.length;
  playTrack();
  if (!isPlaying) {
    document.getElementById('music-btn').textContent = '⏸';
    isPlaying = true;
  }
}

function prevTrack() {
  if (!playlist.length) return;
  currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
  playTrack();
  if (!isPlaying) {
    document.getElementById('music-btn').textContent = '⏸';
    isPlaying = true;
  }
}

audio.addEventListener('ended', () => { nextTrack(); });
audio.addEventListener('timeupdate', () => {
  if (audio.duration) {
    const progress = (audio.currentTime / audio.duration) * 100;
    document.getElementById('music-progress').style.width = progress + '%';
  }
});
audio.addEventListener('error', () => {
  console.warn('音频加载错误，自动下一首');
  setTimeout(() => nextTrack(), 1500);
});

// ========== 导航 ==========
let currentPage = 'news';
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + btn.dataset.page).classList.add('active');
    currentPage = btn.dataset.page;
  });
});

// ========== 回到顶部 ==========
window.addEventListener('scroll', () => {
  const btn = document.getElementById('back-to-top');
  btn.classList.toggle('show', window.scrollY > 300);
});
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

// ========== 工具函数 ==========
function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return '刚刚';
  if (seconds < 3600) return Math.floor(seconds / 60) + '分钟前';
  if (seconds < 86400) return Math.floor(seconds / 3600) + '小时前';
  return Math.floor(seconds / 86400) + '天前';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? '' : timeAgo(date.getTime());
}

function getDomain(url) {
  try { return new URL(url).hostname; } catch { return ''; }
}

function getFavicon(sourceUrl) {
  const domain = getDomain(sourceUrl);
  return domain ? `https://favicon.im/${domain}` : '';
}

function getImage(item, sourceUrl) {
  let img = '';
  if (item.thumbnail) img = item.thumbnail;
  else if (item.enclosure) {
    if (Array.isArray(item.enclosure) && item.enclosure.length > 0) img = item.enclosure[0].link || item.enclosure[0].url;
    else if (typeof item.enclosure === 'object') img = item.enclosure.link || item.enclosure.url;
    else img = item.enclosure;
  }
  else if (item.media) {
    img = item.media.thumbnail || item.media.content?.url || item.media.url || '';
  }
  if (!img) {
    const html = item.content || item.description || '';
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match) img = match[1];
  }
  if (!img) return '';
  if (img.startsWith('/') && sourceUrl) {
    try { img = new URL(sourceUrl).origin + img; } catch {}
  }
  if (img.startsWith('http')) {
    img = 'https://images.weserv.nl/?url=' + encodeURIComponent(img.replace(/^https?:\/\//, ''));
  }
  return img;
}

function withTimeout(promise, ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
}

function renderSkeleton(container, count = 6, type = 'card') {
  if (type === 'anime') {
    container.innerHTML = Array(count).fill('<div class="skeleton skeleton-card"><div class="skeleton skeleton-image" style="height:220px"></div><div class="skeleton skeleton-line"></div></div>').join('');
  } else {
    container.innerHTML = Array(count).fill('<div class="skeleton skeleton-card"><div class="skeleton skeleton-image"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line"></div></div>').join('');
  }
}

// ========== 渲染卡片 ==========
function renderNewsCards(items) {
  const container = document.getElementById('news-cards');
  if (!items || items.length === 0) {
    container.innerHTML = '<div class="empty">未找到相关资讯</div>';
    return;
  }
  container.innerHTML = items.slice(0, 12).map((item, i) => {
    const img = getImage(item, item.sourceUrl);
    const favicon = getFavicon(item.sourceUrl);
    const displayImg = img || favicon;
    return `
      <div class="card" onclick="window.open('${item.link || '#'}', '_blank')" style="animation-delay: ${i * 0.05}s">
        ${displayImg ? `<img class="card-image" src="${displayImg}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : ''}
        <div class="card-image-placeholder" style="${displayImg ? 'display:none' : 'display:flex'}">📰</div>
        <div class="card-content">
          <span class="card-tag tag-news">${item.icon || '📰'} ${item.source}</span>
          <div class="card-title">${item.title}</div>
          <div class="card-meta"><span class="card-source">${item.source}</span><span>${formatDate(item.pubDate)}</span></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderTechCards(items) {
  const container = document.getElementById('tech-cards');
  if (!items || items.length === 0) {
    container.innerHTML = '<div class="empty">未找到相关资讯</div>';
    return;
  }
  container.innerHTML = items.slice(0, 15).map((item, i) => {
    const img = getImage(item, item.sourceUrl);
    const favicon = getFavicon(item.sourceUrl);
    const displayImg = img || favicon;
    return `
      <div class="card" onclick="window.open('${item.link || '#'}', '_blank')" style="animation-delay: ${i * 0.05}s">
        ${displayImg ? `<img class="card-image" src="${displayImg}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : ''}
        <div class="card-image-placeholder" style="${displayImg ? 'display:none' : 'display:flex'}">💻</div>
        <div class="card-content">
          <span class="card-tag tag-tech">${item.icon || '💻'} ${item.source}</span>
          <div class="card-title">${item.title}</div>
          <div class="card-meta"><span class="card-source">${item.source}</span><span>${formatDate(item.pubDate)}</span></div>
        </div>
      </div>
    `;
  }).join('');
}

// ========== 加载资讯（加时间戳破缓存） ==========
async function loadNews(btn) {
  if (!CONFIG) return;
  const container = document.getElementById('news-cards');
  if (btn) btn.classList.add('loading');
  renderSkeleton(container, 6);
  
  try {
    const allItems = [];
    for (const source of CONFIG.newsSources) {
      try {
        const res = await withTimeout(fetch(`${CONFIG.api.rss2json}?rss_url=${encodeURIComponent(source.url)}&_t=${Date.now()}`));
        const data = await res.json();
        if (data.status === 'ok' && data.items) {
          data.items.forEach(item => allItems.push({ ...item, source: source.name, icon: source.icon, sourceUrl: source.url }));
        }
      } catch (e) { console.warn(`${source.name} 失败:`, e.message); }
    }
    if (allItems.length > 0) {
      renderNewsCards(allItems);
    } else {
      throw new Error('所有源均失败');
    }
  } catch (e) {
    container.innerHTML = '<div class="error">加载失败，请刷新重试</div>';
  } finally {
    if (btn) btn.classList.remove('loading');
    updateTime();
  }
}

// ========== 加载技术（加时间戳破缓存） ==========
async function loadTech(btn) {
  if (!CONFIG) return;
  const container = document.getElementById('tech-cards');
  if (btn) btn.classList.add('loading');
  renderSkeleton(container, 6);
  
  try {
    const allItems = [];
    for (const source of CONFIG.techSources) {
      try {
        const res = await withTimeout(fetch(`${CONFIG.api.rss2json}?rss_url=${encodeURIComponent(source.url)}&_t=${Date.now()}`));
        const data = await res.json();
        if (data.status === 'ok' && data.items) {
          data.items.forEach(item => allItems.push({ ...item, source: source.name, icon: source.icon, sourceUrl: source.url }));
        }
      } catch (e) { console.warn(`${source.name} 失败:`, e.message); }
    }
    if (allItems.length > 0) {
      renderTechCards(allItems);
    } else {
      throw new Error('所有源均失败');
    }
  } catch (e) {
    container.innerHTML = '<div class="error">加载失败，请刷新重试</div>';
  } finally {
    if (btn) btn.classList.remove('loading');
    updateTime();
  }
}

// ========== 加载动漫（加时间戳破缓存） ==========
let currentAnimeType = 'season';

document.querySelectorAll('.sub-nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sub-nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentAnimeType = btn.dataset.type;
    loadAnime();
  });
});

async function loadAnime(btn) {
  if (!CONFIG) return;
  const container = document.getElementById('anime-cards');
  if (btn) btn.classList.add('loading');
  renderSkeleton(container, 6, 'anime');
  
  try {
    let url = '';
    if (currentAnimeType === 'season') {
      url = `${CONFIG.api.jikanBase}/seasons/now?limit=12&_t=${Date.now()}`;
    } else if (currentAnimeType === 'top') {
      url = `${CONFIG.api.jikanBase}/top/anime?limit=12&_t=${Date.now()}`;
    } else {
      const promises = Array(12).fill(null).map(() => 
        withTimeout(fetch(`${CONFIG.api.jikanBase}/random/anime?_t=${Date.now()}`), 10000)
          .then(r => r.json())
          .then(d => d.data)
          .catch(() => null)
      );
      const results = await Promise.allSettled(promises);
      const randomList = results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean);
      if (randomList.length > 0) {
        container.innerHTML = randomList.map((a, i) => `
          <div class="anime-card" onclick="window.open('${a.url}', '_blank')" style="animation-delay: ${i * 0.05}s">
            <span class="anime-rank">🎲</span>
            <img class="anime-cover" src="${a.images?.jpg?.large_image_url || ''}" alt="${a.title}" onerror="this.style.background='linear-gradient(135deg,var(--accent),var(--accent3))';">
            <div class="anime-overlay">
              <div class="anime-title">${a.title}</div>
              <div class="anime-meta"><span>⭐ ${a.score || '-'}</span><span>${a.type || ''}</span></div>
            </div>
            <div class="anime-info">
              <div class="anime-title">${a.title}</div>
              <div class="anime-meta"><span class="anime-rating">⭐ ${a.score || '-'}</span></div>
            </div>
          </div>
        `).join('');
        if (btn) btn.classList.remove('loading');
        return;
      }
      throw new Error('随机推荐失败');
    }
    
    const res = await withTimeout(fetch(url), 15000);
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      container.innerHTML = data.data.map((a, i) => `
        <div class="anime-card" onclick="window.open('${a.url}', '_blank')" style="animation-delay: ${i * 0.05}s">
          <span class="anime-rank">#${i + 1}</span>
          <img class="anime-cover" src="${a.images?.jpg?.large_image_url || ''}" alt="${a.title}" onerror="this.style.background='linear-gradient(135deg,var(--accent),var(--accent3))';">
          <div class="anime-overlay">
            <div class="anime-title">${a.title}</div>
            <div class="anime-meta"><span>⭐ ${a.score || '-'}</span><span>${a.type || ''}</span></div>
          </div>
          <div class="anime-info">
            <div class="anime-title">${a.title}</div>
            <div class="anime-meta"><span class="anime-rating">⭐ ${a.score || '-'}</span></div>
          </div>
        </div>
      `).join('');
    } else {
      throw new Error('无数据');
    }
  } catch (e) {
    container.innerHTML = '<div class="error">加载失败，请刷新重试</div>';
  } finally {
    if (btn) btn.classList.remove('loading');
  }
}

// ========== 更新时间 ==========
function updateTime() {
  const now = new Date();
  document.getElementById('update-time').textContent = 
    now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
}

setInterval(updateTime, 60000);
updateTime();

// ========== 初始化 ==========
async function init() {
  try {
    const res = await fetch('config.json');
    CONFIG = await res.json();
    await initPlayer(CONFIG.music);
    loadNews();
    loadTech();
    loadAnime();
  } catch (e) {
    console.error('配置加载失败:', e);
    document.getElementById('news-cards').innerHTML = '<div class="error">配置加载失败，请检查config.json</div>';
  }
}

init();