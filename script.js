const SONGS_DB = [
  "lirik/Monokrom.json",
  "lirik/Tujuhbelas.json",
  "lirik/Sebuahkisahklasik.json",
  "lirik/Photograph.json",
  "lirik/Sundaymorning.json",
  "lirik/Amilliondreams.json",
  "lirik/Untukku.json",
  "lirik/Untilifoundyou.json",
  "lirik/Lover.json",
  "lirik/Pesonasederhana.json",
  "lirik/Manusiakuat.json",
  "lirik/Antihero.json",
  "lirik/Sempurnanyaaku.json",
  "lirik/Takkanadacintayanglain.json",
  "lirik/Thatswhyyougoaway.json",
  "lirik/Goodbye.json",
]
const MOODS = {
  nostalgia: {
    label: "Nostalgia", emoji: "\uD83C\uDF9E\uFE0F",
    tag: "Back when life was simpler",
    acc: "#D2A679", gradient: ["#1a0f07","#4b2e1a","#8b5e3c"],
  },
  "study-focus": {
    label: "Study Focus", emoji: "\uD83D\uDCD6",
    tag: "In the zone, no distractions",
    acc: "#A8E6CF", gradient: ["#041a12","#0d3d2a","#1d8060"],
  },
  "falling-in-love": {
    label: "Falling in Love", emoji: "\uD83D\uDC96",
    tag: "That feeling you can't explain",
    acc: "#FF8B94",  gradient: ["#1a040a","#5c1e2a","#b05060"],
  },
  "main-character-energy": {
    label: "Main Character Energy", emoji: "\u2728",
    tag: "The world is your movie",
    acc: "#FFD3B6", gradient: ["#150b26","#3d2060","#8a5cc0"],
  },
  "deep-night": {
    label: "Deep Night", emoji: "\uD83C\uDF19",
    tag: "2AM thoughts hit different",
    acc:"#7BA7D4", gradient: ["#010a18","#052040","#0e3a6b"],
  },
};
const S = {
  allSongs: [],
  filter: "all",
  sort: "default",
  query: "",
  queue: [],
  curIdx: 0,
  lrcOn: true,
  autoNext: true,
  shuffle: false,
  plOpen: false,
};
const fmt = s =>
  (!s || isNaN(s)) ? "0:00"
  : `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;
 
const getMoodCfg = id => MOODS[id] || { label: id, emoji: "🎵", acc: "#ffffff", gradient: ["#111","#222","#333"] };
 
const shuffleArr = a => {
  const b = [...a];
  for (let i = b.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [b[i],b[j]] = [b[j],b[i]];
  }
  return b;
};
const el = id => document.getElementById(id);
function applyTheme(moodId) {
  const m = getMoodCfg(moodId);
  const r = document.documentElement.style;
  r.setProperty("--acc", m.acc);
  r.setProperty("--g1",  m.gradient[0]);
  r.setProperty("--g2",  m.gradient[1]);
  r.setProperty("--g3",  m.gradient[2]);
}
async function loadAllSongs() {
  const results = await Promise.all(
    SONGS_DB.map(path =>
      fetch(path).then(r => r.json()).catch(() => null)
    )
  );
  S.allSongs = results.filter(Boolean).map(s => ({...s,
    mood: s.mood.toLowerCase().replace(/\s+/g, "-")
  }));
  buildFilterChips();
  renderBrowse();
}
function buildFilterChips() {
  const row = el("filter-row");
  const all = makeChip("Semua", "all", true);
  all.classList.add("filter-chip");
  all.dataset.mood = "all";
  all.onclick = () => setFilter("all");
  row.appendChild(all);
  const usedMoods = [...new Set(S.allSongs.map(s => s.mood))];
  usedMoods.forEach(id => {
    const m = getMoodCfg(id);
    const c = makeChip(`${m.emoji} ${m.label}`, id, false);
    c.classList.add("filter-chip");
    c.dataset.mood = id;
    c.onclick = () => setFilter(id);
    row.appendChild(c);
  });
  const sortRow = el("sort-row");
  [["default","Default"],["bpm-asc","BPM ↑"],["bpm-desc","BPM ↓"]].forEach(([mode,label]) => {
    const c = makeChip(label, mode, mode === "default");
    c.classList.add("sort-chip");
    c.dataset.sort = mode;
    c.onclick = () => setSort(mode);
    sortRow.appendChild(c);
  });
}
function makeChip(label, val, active) {
  const d = document.createElement("div");
  d.className = "chip" + (active ? " on" : "");
  d.textContent = label;
  return d;
}
function getFiltered() {
  let songs = [...S.allSongs];
  if (S.filter !== "all") songs = songs.filter(s => s.mood === S.filter);
  if (S.query)            songs = songs.filter(s =>
    s.title.toLowerCase().includes(S.query) ||
    s.artist.toLowerCase().includes(S.query)
  );
  if (S.sort === "bpm-asc")  songs.sort((a,b) => a.bpm - b.bpm);
  if (S.sort === "bpm-desc") songs.sort((a,b) => b.bpm - a.bpm);
  return songs;
}
function setFilter(mood) {
  S.filter = mood;
  document.querySelectorAll(".filter-chip").forEach(c =>
    c.classList.toggle("on", c.dataset.mood === mood)
  );
  renderBrowse();
}
function setSort(mode) {
  S.sort = mode;
  document.querySelectorAll(".sort-chip").forEach(c =>
    c.classList.toggle("on", c.dataset.sort === mode)
  );
  renderBrowse();
}
function doSearch() {
  S.query = el("search-input").value.toLowerCase().trim();
  el("search-clear").classList.toggle("visible", S.query.length > 0);
  renderBrowse();
}
function clearSearch() {
  el("search-input").value = "";
  S.query = "";
  el("search-clear").classList.remove("visible");
  renderBrowse();
}
function renderBrowse() {
  const bc  = el("browse-content");
  const noFilter = (S.filter === "all" && S.sort === "default" && !S.query);
  if (noFilter) {
    const moodIds = [...new Set(S.allSongs.map(s => s.mood))];
    bc.innerHTML = `
      <p class="section-title">Pilih Mood</p>
      <div class="mood-list">
        ${moodIds.map(id => {
          const m   = getMoodCfg(id);
          const cnt = S.allSongs.filter(s => s.mood === id).length;
          return `<div class="mc" style="--card-accent:${m.acc}" onclick="quickPlayMood('${id}')">
            <span class="mc-em">${m.emoji}</span>
            <span class="mc-lb">${m.label}</span>
            <span class="mc-tg">${m.tag}</span>
            <span class="mc-ct">${cnt} lagu</span>
          </div>`;
        }).join("")}
      </div>`;
    return;
  }
  const songs = getFiltered();
  const curId = S.queue[S.curIdx]?.id;
  bc.innerHTML = `
    <p class="section-title">${songs.length} lagu ditemukan</p>
    <div class="all-songs">
      ${songs.length
        ? songs.map((s,i) => songItem(s, i+1, s.id === curId)).join("")
        : `<div class="no-results">🔍<br>Tidak ada hasil untuk "<em>${S.query}</em>"</div>`}
    </div>`;
}
function quickPlayMood(moodId) {
  setFilter(moodId);
}
function songItem(s, num, isCur) {
  const m = getMoodCfg(s.mood);
  return `
    <div class="si ${isCur?"cur":""}" onclick="playSongById('${s.id}')">
      <div class="si-num">${isCur ? "▶" : num}</div>
      <div class="si-meta">
        <div class="si-tt">${s.title}</div>
        <div class="si-ar">${s.artist}</div>
      </div>
      <div class="si-right">
        <div class="mood-badge">${m.emoji} ${m.label}</div>
        <div class="si-bpm">${s.bpm} bpm</div>
        <div class="si-dur">${fmt(s.duration)}</div>
      </div>
    </div>`;
}
function buildQueue(startId) {
  let songs = getFiltered();
  if (!songs.length) songs = [...S.allSongs];
  if (S.shuffle) songs = shuffleArr(songs);
  S.queue = songs;
  const idx = songs.findIndex(s => s.id === startId);
  S.curIdx = idx >= 0 ? idx : 0;
}
const audio = el("audio");
audio.addEventListener("play",       () => setPlayIcon(true));
audio.addEventListener("pause",      () => setPlayIcon(false));
audio.addEventListener("ended",      () => { if (S.autoNext) skipSong(1); });
audio.addEventListener("timeupdate", () => {
  const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  el("progress-fill").style.width = pct + "%";
  el("time-current").textContent  = fmt(audio.currentTime);
  if (S.lrcOn) syncLyrics();
});
function playSongById(id) {
  buildQueue(id);
  loadCurrent();
  showScreen("player");
}
function loadCurrent() {
  const song = S.queue[S.curIdx];
  if (!song) return;
  const m = getMoodCfg(song.mood);
  applyTheme(song.mood);
  el("player-title").textContent   = song.title;
  el("player-artist").textContent  = song.artist;
  el("player-mood").textContent    = `${m.emoji} ${m.label}`;
  el("player-bpm").textContent     = `${song.bpm} BPM`;
  el("time-total").textContent     = fmt(song.duration);
  el("time-current").textContent   = "0:00";
  el("progress-fill").style.width  = "0%";
  renderLyrics(song.lyrics || []);
  renderPlaylistPanel();
  audio.src = song.file;
  audio.load();
  audio.play().catch(() => setPlayIcon(false));
}
function togglePlay() {
  if (audio.paused) audio.play(); else audio.pause();
}
function setPlayIcon(playing) {
  el("play-icon").innerHTML = playing
    ? `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`
    : `<polygon points="5,3 19,12 5,21"/>`;
}
function skipSong(dir) {
  const next = S.curIdx + dir;
  if      (next < 0)                  S.curIdx = 0;
  else if (next >= S.queue.length)    { if (S.autoNext) S.curIdx = 0; else return; }
  else                                S.curIdx = next;
  loadCurrent();
}
function restartOrFirst() {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
  } else {
    S.curIdx = 0;
    loadCurrent();
  }
}
function seekTo(e) {
  const track = el("progress-track");
  const pct   = Math.max(0, Math.min(e.offsetX / track.offsetWidth, 1));
  if (audio.duration) audio.currentTime = pct * audio.duration;
}
function renderLyrics(lyrics) {
  el("lyrics-inner").innerHTML =
    lyrics.map((l,i) => `<div class="lyric-line" id="ll-${i}">${l.x}</div>`).join("");
}
function syncLyrics() {
  const lyrics = S.queue[S.curIdx]?.lyrics || [];
  const t = audio.currentTime;
  let ai = -1;
  lyrics.forEach((l,i) => { if (t >= l.t) ai = i; });
  document.querySelectorAll(".lyric-line").forEach((line,i) => {
    line.classList.toggle("active", i === ai);
    line.classList.toggle("past",   i < ai);
    if (i === ai) line.scrollIntoView({ behavior:"smooth", block:"center" });
  });
}
function toggleLyrics() {
  S.lrcOn = !S.lrcOn;
  el("lyrics-box").classList.toggle("off", !S.lrcOn);
  el("tgl-lyrics").classList.toggle("on",   S.lrcOn);
}
 
function toggleAutoNext() {
  S.autoNext = !S.autoNext;
  el("tgl-auto").classList.toggle("on", S.autoNext);
}
function toggleShuffle() {
  S.shuffle = !S.shuffle;
  el("tgl-shuffle").classList.toggle("on", S.shuffle);
  const curId = S.queue[S.curIdx]?.id;
  buildQueue(curId);
  renderPlaylistPanel();
}
function renderPlaylistPanel() {
  const curId = S.queue[S.curIdx]?.id;
  el("playlist-inner").innerHTML = S.queue.map((s,i) => {
    const m     = getMoodCfg(s.mood);
    const isCur = s.id === curId;
    return `
      <div class="si ${isCur?"cur":""}" onclick="jumpToIdx(${i})"
           style="border-left:3px solid ${isCur ? m.acc : "transparent"};padding-left:8px">
        <div class="si-num">${isCur ? "▶" : i+1}</div>
        <div class="si-meta">
          <div class="si-tt">${s.title}</div>
          <div class="si-ar">${s.artist}</div>
        </div>
        <div class="si-dur">${fmt(s.duration)}</div>
      </div>`;
  }).join("");
  setTimeout(() => {
    el("playlist-inner").querySelector(".cur")
      ?.scrollIntoView({ behavior:"smooth", block:"nearest" });
  }, 80);
}
function jumpToIdx(idx) {
  S.curIdx = idx;
  loadCurrent();
}
function togglePlaylistPanel() {
  S.plOpen = !S.plOpen;
  el("playlist-panel").classList.toggle("open", S.plOpen);
}
function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s =>
    s.classList.toggle("active", s.id === `screen-${name}`)
  );
}
function goHome() {
  if (S.plOpen) togglePlaylistPanel();
  showScreen("home");
  renderBrowse();
}
document.addEventListener("DOMContentLoaded", () => {
  el("tgl-lyrics").classList.add("on");
  el("tgl-auto").classList.add("on");
  loadAllSongs();
});