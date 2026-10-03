// manifest klipleri. id = YouTube video kimliği.
const TAPES = [
  { title: "Zamansızdık", year: 2025, id: "TWo7ktEPxSg", kind: "Official Music Video", shell: "#e9edf2", band: "#5aa9e6" },
  { title: "Snap", year: 2025, id: "KyQCrV-z4_A", kind: "Official Music Video", shell: "#27222c", band: "#ff5a5f" },
  { title: "Arıyo", year: 2025, id: "yQ9lXHfv9Yg", kind: "Official Music Video", shell: "#f29a4c", band: "#ffd166" },
  { title: "KTS", year: 2025, id: "yRqJ6gbkBA0", kind: "Official Music Video", shell: "#f4d24a", band: "#e5435b" },
  { title: "Manifest", year: 2025, id: "fbelrTRlls8", kind: "Official Dance Video", feat: "feat. Arem & Arman", shell: "#c5cad3", band: "#9b7bd8" },
  { title: "Yaşanacaksa", year: 2025, id: "zuP6l1oA3Ro", kind: "Official Music Video", shell: "#d33a4b", band: "#ffd9e1" },
  { title: "RÜYA", year: 2025, id: "nB0Kdt_QQ-w", kind: "Official Music Video", shell: "#b8a1e8", band: "#7ad3e0" },
  { title: "Amatör", year: 2026, id: "JzH6uWBtC3I", kind: "Official Music Video", shell: "#8fd9b6", band: "#ff8fab" },
  { title: "Başrol Sensin", year: 2026, id: "ICfGdpZCE1Q", kind: "Official Music Video", shell: "#d8b25a", band: "#24407e" },
  { title: "Daha İyi", year: 2026, id: "vso1LpaQRbo", kind: "Official Music Video", shell: "#7cc3f0", band: "#fff1a8" },
  { title: "Hileli", year: 2026, id: "kXKhNI4DLHM", kind: "Official Music Video", feat: "x Ajda Pekkan", shell: "#1d1b21", band: "#d4af37" },
  { title: "Toz Pembe", year: 2026, id: "0pg0raFMNIU", kind: "Official Music Video", shell: "#f4b4c5", band: "#d93a5a" },
  { title: "pVg", full: "pVg (Manifest Live Remix)", year: 2026, id: "EQQNb4iJVIk", kind: "Official Music Video", feat: "& Motive & Pango", shell: "#a3e264", band: "#ff6ad5" },
];

const SIDES = [
  { year: 2025, side: "A" },
  { year: 2026, side: "B" },
];

const FACE_TEXT = { idle: "BİR KASET SEÇ!", loading: "KASET TAKILIYOR…", error: "BU KLİP AÇILMADI :(" };

const $ = (s) => document.querySelector(s);
const consoleEl = $("#console");
const slotEl = $(".slot");
const faceText = $("#faceText");
const osdEl = $("#osd");
const tickerEl = $("#ticker");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const narrow = matchMedia("(max-width: 860px)");

const fullTitle = (t) => t.full || t.title;
const watchUrl = (t) => `https://www.youtube.com/watch?v=${t.id}`;

/* ---------- Raf ---------- */
function tapeInner(t) {
  const side = SIDES.find((s) => s.year === t.year).side;
  return `
    <span class="tape-shell"></span>
    <span class="tape-label">
      <span class="tape-top"><span class="tape-title">${t.title}</span><span class="tape-side">${side}</span></span>
      <span class="tape-sub">${t.feat || "manifest"} · C60</span>
      <span class="tape-band"><span class="tape-window"><span class="reel l"></span><span class="reel r"></span></span></span>
    </span>
    <span class="tape-foot"></span>`;
}

function paint(el, t) {
  el.style.setProperty("--shell", t.shell);
  el.style.setProperty("--band", t.band);
}

const tapeEls = [];
const rack = $("#rack");
for (const { year, side } of SIDES) {
  const list = TAPES.map((t, i) => [t, i]).filter(([t]) => t.year === year);
  const cubby = document.createElement("div");
  cubby.className = "cubby";
  cubby.innerHTML = `
    <div class="cubby-head">
      <span class="tag">${side} yüzü <small>${year}</small></span>
      <span class="count">${list.length} KASET</span>
    </div>
    <div class="cubby-box"><div class="tapes"></div></div>`;
  const grid = cubby.querySelector(".tapes");
  for (const [t, i] of list) {
    const b = document.createElement("button");
    b.className = "tape";
    b.type = "button";
    b.innerHTML = tapeInner(t);
    b.setAttribute("aria-label", `${fullTitle(t)} klibini BMO'da oynat`);
    paint(b, t);
    b.addEventListener("click", () => (current === i ? eject() : insert(i, true)));
    b.addEventListener("animationend", () => b.classList.remove("is-back"));
    grid.append(b);
    tapeEls[i] = b;
  }
  rack.append(cubby);
}

/* ---------- YouTube oynatıcı ---------- */
let ytApi = null;
let player = null;
let playerReady = false;
let wantId = null;
let usingFallback = false;

function loadYT() {
  if (!ytApi) {
    ytApi = new Promise((resolve, reject) => {
      if (window.YT && window.YT.Player) return resolve();
      window.onYouTubeIframeAPIReady = resolve;
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.onerror = reject;
      document.head.append(s);
    });
  }
  return ytApi;
}

async function cue(id) {
  wantId = id;
  try {
    await loadYT();
  } catch {
    return fallbackIframe(id);
  }
  if (id !== wantId) return;

  if (!player) {
    // controls:0 + disablekb:1 → YouTube'un kendi düğmeleri yok; kontrol tamamen BMO'da.
    const vars = { autoplay: 1, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, rel: 0, playsinline: 1, modestbranding: 1 };
    if (location.origin.startsWith("http")) vars.origin = location.origin;
    player = new YT.Player("yt", {
      videoId: id,
      playerVars: vars,
      events: {
        onReady() {
          playerReady = true;
          if (current === null) return player.stopVideo();
          if (wantId !== id) player.loadVideoById(wantId);
          else player.playVideo();
        },
        onStateChange,
        onError() {
          if (current !== null) setState("error");
        },
      },
    });
  } else if (playerReady) {
    player.loadVideoById(id);
  }

  // Tarayıcı otomatik oynatmayı engellerse "tıkla, oynat" ekranına düş.
  const my = seq;
  setTimeout(() => {
    if (my === seq && consoleEl.dataset.state === "loading" && playerReady) setState("paused");
  }, 4000);
}

// API yüklenemezse düz gömme ile oynat.
function fallbackIframe(id) {
  usingFallback = true;
  const box = $(".tv-video");
  box.querySelector("#yt").outerHTML = `<iframe id="yt" src="https://www.youtube.com/embed/${id}?autoplay=1&controls=0&rel=0&playsinline=1&iv_load_policy=3"
    title="YouTube" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen
    referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  setState("playing");
}

function onStateChange(e) {
  if (current === null) return;
  const state = consoleEl.dataset.state;
  switch (e.data) {
    case YT.PlayerState.PLAYING:
      setState("playing");
      break;
    case YT.PlayerState.PAUSED:
      if (state !== "loading") setState("paused");
      break;
    case YT.PlayerState.ENDED:
      if (state === "playing") next();
      break;
  }
}

/* ---------- Durum ---------- */
let current = null;
let seq = 0;

function setState(s) {
  consoleEl.dataset.state = s;
  faceText.textContent = FACE_TEXT[s] || "";
  if (s === "paused") osdEl.textContent = "❚❚ DURDU";
}

function updateNow(t) {
  const nowTape = $("#nowTape");
  const link = $("#nowLink");
  if (!t) {
    nowTape.replaceChildren();
    $("#nowEyebrow").textContent = "BMO boşta";
    $("#nowTitle").textContent = "Kaset takılı değil";
    $("#nowMeta").textContent = "Raftan bir kaset seç ya da mavi üçgenle ilk kaseti başlat.";
    link.hidden = true;
    tickerEl.textContent = "";
    return;
  }
  const mini = document.createElement("span");
  mini.className = "tape mini";
  mini.innerHTML = tapeInner(t);
  paint(mini, t);
  nowTape.replaceChildren(mini);
  $("#nowEyebrow").textContent = "Şimdi çalıyor";
  $("#nowTitle").textContent = fullTitle(t);
  $("#nowMeta").textContent = `manifest${t.feat ? " " + t.feat : ""} · ${t.kind} · ${t.year}`;
  link.href = watchUrl(t);
  link.hidden = false;
  tickerEl.textContent = `♪ manifest — ${fullTitle(t)} ♪`;
  osdEl.textContent = "▶ 000";
  consoleEl.style.setProperty("--slot-color", t.band);
}

function release(i) {
  const el = tapeEls[i];
  el.classList.remove("is-out");
  el.classList.add("is-back");
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Kaseti raftan BMO'nun yuvasına uçurur.
function fly(el) {
  const from = el.getBoundingClientRect();
  const to = slotEl.getBoundingClientRect();
  const ghost = el.cloneNode(true);
  ghost.classList.add("flying");
  Object.assign(ghost.style, {
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
  });
  document.body.append(ghost);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top - (from.top + from.height / 2);
  const s = Math.min(1, (to.width * 0.72) / from.width);
  const anim = ghost.animate(
    [
      { transform: "translate(0, 0) rotate(0deg) scale(1)" },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 90}px) rotate(-14deg) scale(${(1 + s) / 2})`, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy - 6}px) rotate(0deg) scale(${s})`, offset: 0.85 },
      { transform: `translate(${dx}px, ${dy + 4}px) rotate(0deg) scale(${s}, ${s * 0.15})`, opacity: 0 },
    ],
    { duration: 850, easing: "cubic-bezier(.45, 0, .3, 1)" },
  );
  return anim.finished.catch(() => {}).then(() => ghost.remove());
}

async function insert(i, fromShelf = false) {
  const t = TAPES[i];
  const my = ++seq;
  if (current !== null) release(current);
  if (playerReady) player.pauseVideo();
  current = i;

  const el = tapeEls[i];
  const animate = fromShelf && !reduceMotion.matches && !narrow.matches;
  const flight = animate ? fly(el) : null;
  el.classList.remove("is-back");
  el.classList.add("is-out");
  consoleEl.classList.remove("has-tape");
  updateNow(t);
  setProgress(0);
  setState("loading");

  if (fromShelf && narrow.matches) {
    consoleEl.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
  }
  await (flight || wait(250));
  if (my !== seq) return;
  consoleEl.classList.add("has-tape");
  await wait(reduceMotion.matches ? 0 : 350);
  if (my !== seq) return;

  if (usingFallback) fallbackIframe(t.id);
  else cue(t.id);
}

function eject() {
  if (current === null) return;
  seq++;
  if (playerReady) player.stopVideo();
  if (usingFallback) $("#yt").outerHTML = '<div id="yt"></div>';
  setProgress(0);
  release(current);
  current = null;
  wantId = null;
  consoleEl.classList.remove("has-tape");
  updateNow(null);
  setState("idle");
}

function next() { insert(current === null ? 0 : (current + 1) % TAPES.length); }
function prev() { insert(current === null ? TAPES.length - 1 : (current - 1 + TAPES.length) % TAPES.length); }

function shuffle() {
  let i;
  do i = Math.floor(Math.random() * TAPES.length);
  while (i === current && TAPES.length > 1);
  insert(i);
}

function toggle() {
  if (current === null) return insert(0);
  if (!playerReady) return;
  if (player.getPlayerState() === YT.PlayerState.PLAYING) player.pauseVideo();
  else player.playVideo();
}

let osdTimer = 0;
function volume(delta) {
  if (!playerReady) return;
  player.unMute();
  const v = Math.max(0, Math.min(100, player.getVolume() + delta));
  player.setVolume(v);
  osdEl.textContent = `SES %${v}`;
  clearTimeout(osdTimer);
  osdTimer = setTimeout(() => (osdTimer = 0), 1400);
}

const seekEl = $("#seek");
const seekFill = $("#seekFill");
function setProgress(ratio) {
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 1000) / 10;
  seekFill.style.width = `${pct}%`;
  seekEl.setAttribute("aria-valuenow", String(Math.round(pct)));
}

// Kaset sayacı (oynatılan saniye, 3 hane) ve ilerleme çubuğu.
setInterval(() => {
  if (!playerReady || consoleEl.dataset.state !== "playing") return;
  const now = player.getCurrentTime() || 0;
  const dur = player.getDuration() || 0;
  if (dur) setProgress(now / dur);
  if (!osdTimer) osdEl.textContent = `▶ ${String(Math.floor(now)).padStart(3, "0")}`;
}, 500);

// Ekrana tıkla: oynat / duraklat.
$("#cover").addEventListener("click", toggle);

// Çubuğa tıkla: o noktaya sar.
seekEl.addEventListener("click", (e) => {
  if (!playerReady || current === null) return;
  const r = seekEl.getBoundingClientRect();
  const ratio = (e.clientX - r.left) / r.width;
  const dur = player.getDuration();
  if (!dur) return;
  player.seekTo(ratio * dur, true);
  setProgress(ratio);
});

// Tam ekran: BMO'nun ekranı tüm ekranı kaplar.
const screenEl = $(".screen");
$("#fsBtn").addEventListener("click", () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else if (screenEl.requestFullscreen) screenEl.requestFullscreen().catch(() => {});
});

/* ---------- Kontroller ---------- */
const ACTIONS = { prev, next, toggle, shuffle, eject, volup: () => volume(10), voldown: () => volume(-10) };

document.querySelectorAll("[data-act]").forEach((b) => {
  b.addEventListener("click", () => ACTIONS[b.dataset.act]());
});

document.addEventListener("keydown", (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const onButton = document.activeElement && document.activeElement.tagName === "BUTTON";
  switch (e.key) {
    case "ArrowRight": next(); break;
    case "ArrowLeft": prev(); break;
    case "ArrowUp":
    case "ArrowDown":
      if (current === null) return; // sayfa kaydırması bozulmasın
      volume(e.key === "ArrowUp" ? 10 : -10);
      break;
    case "Escape": eject(); break;
    case " ":
      if (onButton) return;
      toggle();
      break;
    default: return;
  }
  e.preventDefault();
});

if (location.protocol === "file:") $("#notice").hidden = false;
loadYT().catch(() => {});
