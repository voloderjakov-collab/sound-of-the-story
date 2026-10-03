/* THE SOUND OF THE STORY — presentation engine v2 (offline, no dependencies)
   One click = one slide. Media slides: one click plays the clip. Everything on a slide appears by itself. */
(function () {
"use strict";
const D = window.DECK, M = D.motifs, SC = D.scenes, RF = D.refs, ORDER = D.order;
const stage = document.getElementById("stage"), host = document.getElementById("slides");
const W = 1920, H = 1080, ROMAN = ["I", "II", "III", "IV", "V"];
function fit() { const s = Math.min(innerWidth / W, innerHeight / H); stage.style.transform = `scale(${s})`; }
addEventListener("resize", fit); fit();

/* ---------- helpers ---------- */
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const pos = (e, x, y, w, h) => { e.style.position = "absolute"; e.style.left = x + "px"; e.style.top = y + "px"; if (w != null) e.style.width = w + "px"; if (h != null) e.style.height = h + "px"; return e; };
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const fmt = s => esc(s).replace(/'([^']{3,}?)'/g, '<span class="qt">‘$1’</span>');
const COL = k => getComputedStyle(stage).getPropertyValue(`--${k}`).trim();
function rgba(hex, a) { const n = parseInt(hex.replace("#", ""), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
/* add an element that fades in by itself, d = delay in ms after the slide opens */
function put(o, e, d = 0) { e.classList.add("rv"); e.dataset.d = d; o.el.appendChild(e); return e; }
function txt(o, html, x, y, w, css, d, cls = "") { const e = pos(el("div", cls, html), x, y, w); if (css) e.style.cssText += css; return put(o, e, d); }
function img(src) { return `assets/img/${src}.jpg`; }

function glyph(k, size = 120, colVar) {
  const c = colVar || `var(--${k})`, sw = 6;
  const g = {
    shire: `<circle cx="60" cy="66" r="34" fill="none" stroke="${c}" stroke-width="${sw}"/><circle cx="60" cy="66" r="24" fill="none" stroke="${c}" stroke-opacity=".45" stroke-width="3"/><circle cx="60" cy="72" r="4" fill="${c}"/><path d="M8 52 Q60 -6 112 52" fill="none" stroke="${c}" stroke-width="3"/>`,
    fellowship: [...Array(9)].map((_, i) => { const t = i / 8, x = 12 + t * 96, y = 92 - Math.sin(t * Math.PI * .85) * 52 - t * 12; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i < 2 ? 6.5 : 4.5}" fill="${c}" fill-opacity="${i < 2 ? 1 : .55}"/>`; }).join("") + `<line x1="8" y1="104" x2="112" y2="104" stroke="${c}" stroke-opacity=".5" stroke-width="2"/>`,
    seduction: `<circle cx="60" cy="60" r="32" fill="none" stroke="${c}" stroke-width="8"/><circle cx="60" cy="60" r="24" fill="none" stroke="${c}" stroke-opacity=".4" stroke-width="2"/><path d="M98 38 A44 44 0 0 1 98 82 M22 38 A44 44 0 0 0 22 82" fill="none" stroke="${c}" stroke-opacity=".55" stroke-width="3"/>`,
    lothlorien: `<path d="M60 14 L60 106 M14 60 L106 60 M27 27 L93 93 M93 27 L27 93" stroke="${c}" stroke-opacity=".45" stroke-width="2"/><circle cx="60" cy="60" r="16" fill="${c}"/><circle cx="60" cy="60" r="30" fill="none" stroke="${c}" stroke-opacity=".6" stroke-width="3"/><circle cx="60" cy="60" r="44" fill="none" stroke="${c}" stroke-opacity=".3" stroke-width="2"/>`,
    isengard: [[14, 1], [30, 0], [56, 1], [72, 0], [88, 0]].map(([x, a]) => `<rect x="${x}" y="${a ? 30 : 48}" width="10" height="${a ? 70 : 52}" fill="${c}" fill-opacity="${a ? 1 : .55}"/>`).join("") + `<line x1="46" y1="22" x2="46" y2="102" stroke="${c}" stroke-opacity=".5" stroke-width="2"/><line x1="8" y1="106" x2="112" y2="106" stroke="${c}" stroke-width="3"/>`,
  }[k];
  return `<svg viewBox="0 0 120 120" width="${size}" height="${size}" style="display:block">${g}</svg>`;
}

/* ---------- slide object ---------- */
let playing = null;
const B = {};
function make(s) { const e = el("section", "slide"); host.appendChild(e); return { el: e, s, steps: [], onEnter: null, onLeave: null }; }
function bg(o, name, kb = true, shades = []) { if (name === "map_soft") o.el.classList.add("darkmap"); const b = el("div", "bg" + (kb ? " kb" : "")); b.style.backgroundImage = `url("${img(name)}")`; o.el.appendChild(b); shades.forEach(c => o.el.appendChild(el("div", "shade " + c))); return b; }
function head(o, label, title, x = 110, y = 140, dark = false, size = 60) {
  txt(o, label, x, y, 1400, `color:${dark ? "#4f370c" : "var(--acc)"}`, 0, "label");
  const t = txt(o, fmt(title), x, y + 36, 1700, `font-size:${size}px;color:${dark ? "var(--ink)" : "var(--cream)"}`, 150, "h2");
  return t;
}

/* ---------- OPENING ---------- */
B.hook = o => {
  if (o.s.video) {  // v2: the opening is a film clip (picture + the choir, frame-locked)
    const b = bg(o, o.s.bg, false, []); b.style.opacity = .4; b.style.transition = "opacity 1.5s ease";
    const v = el("video", "hookv"); v.src = o.s.video; v.preload = "auto"; v.playsInline = true; v.setAttribute("playsinline", ""); o.el.appendChild(v);
    const sh = el("div", "shade"); sh.style.cssText = "background:rgba(10,8,5,.0);transition:background 2.5s ease"; o.el.appendChild(sh);
    const lines = o.s.lines.map((l, i) => { const e = pos(el("div", "", fmt(l)), 0, 380 + i * 110, W); e.style.cssText += `text-align:center;font-size:${i === 2 ? 74 : 64}px;font-style:italic;text-shadow:0 2px 18px rgba(0,0,0,.8);${i === 2 ? "color:var(--goldL)" : ""}`; e.classList.add("rv", "late"); o.el.appendChild(e); return e; });
    const showLines = () => { sh.style.background = "rgba(10,8,5,.62)"; lines.forEach((e, i) => setTimeout(() => e.classList.add("on"), 300 + i * 900)); };
    o.steps.push(() => { v.currentTime = 0; v.classList.add("on"); v.play(); playing = v; v.onended = () => { playing = null; showLines(); }; });
    o.onLeave = () => { v.pause(); v.onended = null; v.classList.remove("on"); sh.style.background = "rgba(10,8,5,0)"; };
    o.revealAll = () => { v.classList.add("on"); showLines(); };
    o.media = "▶ PLAY THE OPENING CLIP";
    return;
  }
  const b = bg(o, o.s.bg, false, ["sh-soft"]); b.style.opacity = .75; b.style.transition = "opacity 8s ease";
  const au = el("audio"); au.src = o.s.audio; au.preload = "auto"; o.el.appendChild(au);
  const lines = o.s.lines.map((l, i) => { const e = pos(el("div", "", fmt(l)), 0, 380 + i * 110, W); e.style.cssText += `text-align:center;font-size:${i === 2 ? 74 : 64}px;font-style:italic;${i === 2 ? "color:var(--goldL)" : ""}`; e.classList.add("rv", "late"); o.el.appendChild(e); return e; });
  const showLines = () => lines.forEach((e, i) => setTimeout(() => e.classList.add("on"), 300 + i * 900));
  o.steps.push(() => { au.currentTime = 0; au.play(); playing = au; b.style.opacity = 1; au.onended = () => { playing = null; showLines(); }; });
  o.onLeave = () => { au.pause(); au.onended = null; b.style.opacity = .75; };
  o.revealAll = () => { b.style.opacity = 1; lines.forEach(e => e.classList.add("on")); };
};

B.title = o => {
  bg(o, o.s.bg, true, ["sh-soft"]);
  txt(o, "A leitmotif analysis", 0, 220, W, "text-align:center;color:var(--goldL)", 200, "label");
  txt(o, "The Sound of the Story", 0, 275, W, "text-align:center;font-size:118px", 400, "h1");
  txt(o, "Howard Shore's music in <i>The Lord of the Rings: The Fellowship of the Ring</i> (2001)", 0, 430, W, "text-align:center;font-size:38px;font-style:italic", 900);
  txt(o, "Jakov Voloder <span class='orn' style='width:30px'></span> Music", 0, 505, W, "text-align:center;color:#d9cfb8", 1200, "label");
  const c = put(o, pos(el("div", "card"), 260, 650, 1400, 270), 1700);
  c.innerHTML = `<div class="lab" style="position:absolute;left:0;right:0;top:46px;text-align:center">Key question</div><div style="position:absolute;left:80px;right:80px;top:96px;text-align:center;font-size:44px;line-height:1.25;font-style:italic">${fmt(o.s.question)}</div>`;
};

B.roadmap = o => {
  bg(o, o.s.bg, true, ["sh-paper"]);
  head(o, "The structure", "My presentation", 110, 140, false);
  const P = [[250, 820], [620, 640], [980, 760], [1330, 560], [1680, 420]];
  let d = `M${P[0][0]} ${P[0][1]}`; for (let i = 1; i < P.length; i++) { const [a, b] = P[i - 1], [c, e] = P[i]; d += ` C${a + 180} ${b - 120} ${c - 180} ${e + 120} ${c} ${e}`; }
  const svg = pos(el("div"), 0, 0, W, H); svg.innerHTML = `<svg width="1920" height="1080"><path class="route" d="${d}" fill="none" stroke="#c9a45a" stroke-width="5" stroke-dasharray="14 12" stroke-linecap="round"/></svg>`; o.el.appendChild(svg);
  const route = svg.querySelector(".route");
  o.s.stops.forEach(([n, t], i) => {
    const [x, y] = P[i];
    const node = pos(el("div", "", `<div style="width:110px;height:110px;border-radius:50%;background:#2a2118;border:4px solid var(--gold);display:flex;align-items:center;justify-content:center;font-family:Cinzel;font-size:40px;color:var(--goldL)">${n}</div>`), x - 55, y - 55);
    put(o, node, 600 + i * 450);
    const lab = pos(el("div", "card", `<div style="padding:26px 34px;font-size:36px;line-height:1.15;text-align:center">${fmt(t)}</div>`), x - 170, y + 75, 340);
    put(o, lab, 750 + i * 450);
  });
  o.onEnter = () => { const L = route.getTotalLength(); route.style.transition = "none"; route.style.strokeDashoffset = 0; route.style.clipPath = "inset(0 100% 0 0)"; requestAnimationFrame(() => requestAnimationFrame(() => { route.style.transition = "clip-path 2.6s cubic-bezier(.4,.1,.2,1) .4s"; route.style.clipPath = "inset(0 0 0 0)"; })); };
  o.revealAll = () => { route.style.clipPath = "none"; };
};

B.film = o => {
  bg(o, "council_blur", false, ["sh-soft"]);
  head(o, "I · The film", "The Fellowship of the Ring", 110, 140);
  put(o, pos(el("div", "frame"), 110, 290, 840, 352), 300).style.backgroundImage = `url("${img("council")}")`;
  put(o, pos(el("div", "frame"), 110, 690, 405, 240), 500).style.backgroundImage = `url("${img("ring_prologue")}")`;
  put(o, pos(el("div", "frame"), 545, 690, 405, 240), 650).style.backgroundImage = `url("${img("bagend")}")`;
  const c = put(o, pos(el("div", "card"), 1030, 260, 780, 700), 400);
  let h = `<div style="position:absolute;left:60px;right:60px;top:56px;display:grid;grid-template-columns:1fr 1fr;row-gap:26px;column-gap:30px">`;
  o.s.facts.forEach(([a, b]) => h += `<div><div class="lab">${a}</div><div style="font-size:38px;line-height:1.1;margin-top:6px">${esc(b)}</div></div>`);
  h += `</div><div class="rule" style="position:absolute;left:60px;right:60px;top:300px"></div><div class="lab" style="position:absolute;left:60px;top:330px">The story</div>`;
  o.s.plot.forEach((p, i) => h += `<div style="position:absolute;left:60px;right:50px;top:${380 + i * 100}px;display:flex;gap:22px;font-size:34px;line-height:1.2"><span style="font-family:Cinzel;color:var(--accD);font-size:30px">${i + 1}</span><span>${fmt(p)}</span></div>`);
  c.innerHTML = h;
};

B.cast = o => {
  bg(o, o.s.bg, true, ["sh-soft"]);
  head(o, "I · The film", "Characters, themes and relevance", 110, 140);
  txt(o, "The Fellowship of the Ring", 110, 290, 900, "color:var(--goldL)", 200, "label");
  o.s.heroes.forEach(([n, r], i) => {
    const c = pos(el("div", "card", `<div style="position:absolute;left:0;right:0;top:26px;text-align:center;font-family:Cinzel;font-size:34px">${n}</div><div style="position:absolute;left:0;right:0;top:76px;text-align:center;font-size:26px;font-style:italic;color:var(--ink2)">${r}</div>`), 110 + (i % 3) * 300, 340 + Math.floor(i / 3) * 160, 280, 140);
    put(o, c, 300 + i * 90);
  });
  const g = put(o, pos(el("div", "glass"), 1060, 290, 750, 640), 900);
  g.innerHTML = `<div class="label" style="position:absolute;left:50px;top:44px;color:var(--goldL)">Against them</div>
    <div style="position:absolute;left:50px;right:40px;top:88px;font-size:36px;line-height:1.3">${o.s.enemies.join(" · ")}</div>
    <div class="rule" style="position:absolute;left:50px;right:50px;top:208px"></div>
    <div class="label" style="position:absolute;left:50px;top:236px;color:var(--goldL)">Themes</div>
    ${o.s.themes.map((t, i) => `<div style="position:absolute;left:50px;top:${284 + i * 58}px;font-size:38px;font-style:italic">${t}</div>`).join("")}
    <div class="rule" style="position:absolute;left:50px;right:50px;top:470px"></div>
    <div style="position:absolute;left:50px;top:492px;font-family:Cinzel;font-size:100px;line-height:1;color:var(--goldL)">${o.s.stat[0]}</div>
    <div style="position:absolute;left:150px;right:40px;top:512px;font-size:34px;line-height:1.2">${o.s.stat[1]}</div>`;
};

/* timeline as a curve */
B.composer = o => {
  bg(o, "map_soft", false, ["sh-paper"]);
  txt(o, "II · The composer", 110, 140, 900, "color:var(--goldL)", 0, "label");
  txt(o, "Howard Shore", 110, 178, 1200, "font-size:96px;color:var(--ink)", 150, "h1");
  txt(o, "born 1946 · Toronto, Canada", 116, 290, 900, "font-size:36px;font-style:italic;color:var(--ink2)", 400);
  const d = "M90 820 C 420 900, 560 560, 860 640 S 1320 820, 1520 560 S 1760 330, 1840 360";
  const box = pos(el("div"), 0, 0, W, H); box.innerHTML = `<svg width="1920" height="1080"><path id="tlc" d="${d}" fill="none" stroke="#c9a45a" stroke-width="5" stroke-linecap="round"/></svg>`; o.el.appendChild(box);
  const path = box.querySelector("path"); const L = path.getTotalLength();
  const n = o.s.timeline.length;
  o.s.timeline.forEach(([y, t], i) => {
    const p = path.getPointAtLength(L * (0.04 + i * 0.92 / (n - 1)));
    const up = i % 2 === 1;
    const dot = pos(el("div"), p.x - 16, p.y - 16, 32, 32); dot.style.cssText += `border-radius:50%;background:${i === n - 1 ? "var(--gold)" : "#2a2118"};border:4px solid var(--gold)`;
    put(o, dot, 900 + i * 380);
    const lb = pos(el("div", "", `<div style="font-family:Cinzel;font-size:28px;color:var(--accD);font-weight:700">${y}</div><div style="font-size:31px;line-height:1.15;color:var(--ink)">${fmt(t)}</div>`), p.x - 125, up ? p.y - 150 : p.y + 34, 250);
    lb.style.textAlign = "center"; put(o, lb, 1000 + i * 380);
  });
  path.style.strokeDasharray = L; path.style.strokeDashoffset = L;
  o.onEnter = () => { path.style.transition = "none"; path.style.strokeDashoffset = L; requestAnimationFrame(() => requestAnimationFrame(() => { path.style.transition = "stroke-dashoffset 3.4s cubic-bezier(.4,.1,.2,1) .6s"; path.style.strokeDashoffset = 0; })); };
  o.revealAll = () => { path.style.transition = "none"; path.style.strokeDashoffset = 0; };
};

B.approach = o => {
  bg(o, o.s.bg, true, ["sh-soft"]);
  head(o, "II · The composer", "His approach and his work on this film", 110, 140);
  txt(o, "<span class='orn'></span>Every culture in Middle-earth gets its own sound<span class='orn'></span>", 0, 300, W, "text-align:center;font-size:48px;font-style:italic;color:var(--goldL)", 400);
  o.s.tiles.forEach(([a, b, c], i) => {
    const g = pos(el("div", "glass", `<div style="position:absolute;left:0;right:0;top:50px;text-align:center;font-family:Cinzel;font-size:${a.length > 4 ? 52 : 96}px;line-height:1;color:var(--goldL);${a.length > 4 ? "top:76px" : ""}">${a}</div>
      <div style="position:absolute;left:20px;right:20px;top:180px;text-align:center;font-size:38px;line-height:1.15">${b}</div><div style="position:absolute;left:20px;right:20px;top:232px;text-align:center;font-size:30px;font-style:italic;color:#d6cbb2">${c}</div>`), 110 + i * 432, 420, 400, 320);
    put(o, g, 800 + i * 350);
  });
  const r = put(o, pos(el("div", "card", `<div style="position:absolute;left:0;right:0;top:34px;text-align:center"><span class="lab">Recorded by</span><span style="font-size:36px;margin-left:24px">${o.s.rec}</span></div>`), 260, 800, 1400, 120), 2400);
};

B.leitmotif = o => {
  bg(o, "map_soft", false, ["sh-paper"]);
  txt(o, "III · Key term", 110, 140, 900, "color:var(--goldL)", 0, "label");
  txt(o, "The Leitmotif", 110, 178, 1200, "font-size:96px;color:var(--ink)", 150, "h1");
  txt(o, `<span style="font-family:Cinzel;font-size:120px;color:var(--gold);position:absolute;left:-70px;top:-50px">“</span>${fmt(o.s.definition)}`, 180, 330, 1560, "font-size:52px;line-height:1.25;font-style:italic;color:var(--ink)", 500);
  txt(o, "— a technique connected with the opera composer <b>Richard Wagner</b>", 180, 480, 1500, "font-size:34px;color:var(--ink2)", 900);
  txt(o, "Its power: it comes back, and when it changes, its meaning changes.", 180, 545, 1600, "font-size:38px;color:var(--ink)", 1300);
  // method diagram on a curve
  const P = [[330, 800], [790, 760], [1250, 800], [1650, 760]];
  const box = pos(el("div"), 0, 0, W, H); box.innerHTML = `<svg width="1920" height="1080"><defs><marker id="ah" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto"><path d="M0,0 L12,6 L0,12 Z" fill="#c9a45a"/></marker></defs>${P.slice(1).map((p, i) => { const a = P[i]; return `<path d="M${a[0] + 100} ${a[1]} Q ${(a[0] + p[0]) / 2} ${Math.min(a[1], p[1]) - 90} ${p[0] - 104} ${p[1]}" fill="none" stroke="#c9a45a" stroke-width="4" marker-end="url(#ah)"/>`; }).join("")}</svg>`;
  put(o, box, 1800);
  o.s.method.forEach(([a, b], i) => {
    const [x, y] = P[i];
    const c = pos(el("div", "", `<div style="width:190px;height:190px;border-radius:50%;background:#2a2118;border:5px solid var(--gold);display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--cream)"><div style="font-family:Cinzel;font-size:34px">${a}</div>${b ? `<div style="font-size:24px;font-style:italic;color:var(--goldL);margin-top:4px;text-align:center;line-height:1.1;padding:0 18px">${b}</div>` : ""}</div>`), x - 95, y - 95);
    put(o, c, 1700 + i * 300);
  });
};

/* the journey map: the five leitmotifs on the route */
function routeSVG(hl, ink = "#4a3a26") {
  const S = D.stations;
  let d = `M${S[0].p[0]} ${S[0].p[1]}`; for (let i = 1; i < S.length; i++) { const [a, b] = S[i - 1].p, [c, e] = S[i].p; d += ` Q${(a + c) / 2} ${(b + e) / 2 + (i % 2 ? -60 : 60)} ${c} ${e}`; }
  const st = S.map(s => `<g><circle cx="${s.p[0]}" cy="${s.p[1]}" r="${hl === s.id ? 20 : 15}" fill="var(--${s.m}D)" stroke="#f1e7cf" stroke-width="4"/><text x="${s.p[0]}" y="${s.p[1] + (s.up ? -30 : 50)}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="21" letter-spacing="2" fill="${ink}">${s.place.toUpperCase()}</text></g>`).join("");
  return `<svg width="1920" height="1080"><path class="route" d="${d}" fill="none" stroke="${ink}" stroke-width="4" stroke-dasharray="12 10" stroke-linecap="round"/>${st}</svg>`;
}
B.five = o => {
  bg(o, o.s.bg, true, ["sh-paper"]);
  head(o, "IV · My selection", "Five leitmotifs · ten scenes", 110, 140, false);
  const m = pos(el("div"), 0, 0, W, H); m.innerHTML = routeSVG(null, "#e3d3ae"); o.el.appendChild(m);
  const route = m.querySelector(".route"), gs = [...m.querySelectorAll("g")];
  gs.forEach((g, i) => { g.style.opacity = 0; g.style.transition = `opacity .6s ease ${0.6 + i * .25}s`; });
  ORDER.forEach((k, i) => {
    const c = pos(el("div", "card"), 110 + i * 344, 640, 324, 360);
    c.innerHTML = `<div style="position:absolute;left:22px;right:22px;top:22px;height:150px;background:url('${img(M[k].plate)}') center/cover;border:2px solid var(--gold)"></div>
      <div style="position:absolute;left:0;right:0;top:190px;text-align:center;font-family:Cinzel;font-size:26px;color:var(--${k}D);font-weight:700">${ROMAN[i]}</div>
      <div style="position:absolute;left:14px;right:14px;top:226px;text-align:center;font-family:Cinzel;font-size:${M[k].name.length > 16 ? 25 : 31}px;line-height:1.15">${M[k].name}</div>
      <div style="position:absolute;left:14px;right:14px;top:300px;text-align:center;font-size:27px;font-style:italic;color:var(--ink2)">${M[k].tag}</div>`;
    put(o, c, 1400 + i * 420);
  });
  o.onEnter = () => { route.style.transition = "none"; route.style.clipPath = "inset(0 100% 0 0)"; gs.forEach(g => g.style.opacity = 0); requestAnimationFrame(() => requestAnimationFrame(() => { route.style.transition = "clip-path 3s cubic-bezier(.4,.1,.2,1) .3s"; route.style.clipPath = "inset(0 0 0 0)"; gs.forEach(g => g.style.opacity = 1); })); };
  o.revealAll = () => { route.style.clipPath = "none"; gs.forEach(g => g.style.opacity = 1); };
};

/* ---------- CHAPTERS ---------- */
B.chapter = o => {
  const k = o.s.motif, m = M[k];
  bg(o, m.plate, true, ["sh-left"]);
  txt(o, `Leitmotif ${ROMAN[m.n - 1]} of V`, 110, 190, 900, "", 100, "label");
  put(o, pos(el("div", "", glyph(k, 110)), 104, 240), 300);
  const long = m.name.length > 16;
  txt(o, m.name, 110, 370, 1700, `font-size:${long ? 74 : 112}px;color:var(--cream);white-space:nowrap`, 450, "h1");
  txt(o, m.tag, 116, long ? 470 : 500, 900, "font-size:44px;font-style:italic;color:var(--acc)", 800);
  o.s.facts.forEach(([a, b], i) => {
    txt(o, a, 116, 610 + i * 120, 300, "padding-top:10px", 1300 + i * 400, "label");
    txt(o, fmt(b), 400, 600 + i * 120, 760, "font-size:40px;line-height:1.2", 1400 + i * 400);
  });
};

B.listen = o => {
  const k = o.s.motif, r = RF[k];
  bg(o, M[k].plate + "_blur", false, ["sh-soft"]);
  const cv = el("canvas", "viz"); cv.width = W; cv.height = H; o.el.appendChild(cv);
  txt(o, `Listening example · Leitmotif ${ROMAN[M[k].n - 1]}`, 0, 160, W, "text-align:center", 0, "label");
  txt(o, "Listen for", 0, 800, W, "text-align:center;color:#d6cbb2", 300, "label");
  txt(o, fmt(o.s.short), 0, 838, W, "text-align:center;font-size:56px;font-style:italic;color:var(--acc)", 500);
  txt(o, `Film ${r.at.split("–")[0]} · ${r.label}`, 0, 950, W, "text-align:center;font-size:26px;color:#cfc4ab", 700);
  const ind = pos(el("div", "", "<span class='playdot'></span><span class='playdot'></span><span class='playdot'></span>"), 0, 760, W); ind.style.textAlign = "center"; o.el.appendChild(ind);
  const au = el("audio"); au.src = r.file; au.preload = "auto"; o.el.appendChild(au);
  const V = (window.VIZ || {})[r.id]; let raf = 0;
  function draw() {
    const x = cv.getContext("2d"); x.clearRect(0, 0, W, H);
    const t = au.currentTime, f = V ? Math.min(V.bands.length - 1, Math.floor(t * V.fps)) : 0;
    const on = V && !au.paused, bands = on ? V.bands[f] : new Array(24).fill(0), rms = on ? V.rms[f] : 0;
    x.save(); x.translate(0, 40); VIZ[k](x, bands, rms, t, V, au.paused); x.restore();
    if (au.duration) { const p = au.currentTime / au.duration; x.fillStyle = "rgba(255,255,255,.18)"; x.fillRect(660, 735, 600, 3); x.fillStyle = COL(k); x.fillRect(660, 735, 600 * p, 3); }
    raf = requestAnimationFrame(draw);
  }
  o.onEnter = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
  o.onLeave = () => { cancelAnimationFrame(raf); au.pause(); au.currentTime = 0; ind.classList.remove("playing-ind"); };
  o.steps.push(() => { au.currentTime = 0; au.play(); playing = au; ind.classList.add("playing-ind"); au.onended = () => { playing = null; ind.classList.remove("playing-ind"); }; });
  o.media = "▶ PLAY THE LISTENING EXAMPLE";
};
const VIZ = {
  shire(x, b, rms, t) { const c = COL("shire");
    for (let L = 0; L < 6; L++) { x.beginPath(); const base = 600 - L * 40;
      for (let px = 0; px <= W; px += 12) { const a = b[Math.min(23, Math.floor(px / W * 12) + L * 2)] || 0; const y = base - Math.sin(px / (260 + L * 40) + t * .4 + L) * (22 + a * 120) - a * 36; px ? x.lineTo(px, y) : x.moveTo(px, y); }
      x.strokeStyle = rgba(c, .3 + .12 * (5 - L) / 5 + rms * .5); x.lineWidth = 3; x.stroke(); }
    x.beginPath(); x.arc(960, 440, 60 + rms * 70, 0, Math.PI * 2); x.strokeStyle = rgba(c, .6 + rms); x.lineWidth = 5; x.stroke(); },
  fellowship(x, b, rms) { const c = COL("fellowship");
    for (let i = 0; i < 9; i++) { const tt = i / 8, px = 560 + tt * 800, py = 600 - Math.sin(tt * Math.PI * .85) * 270 - tt * 60, a = Math.min(1, (b[i * 2] + b[i * 2 + 1]) * .9 + rms * .7);
      const g = x.createRadialGradient(px, py, 0, px, py, 70 + a * 80); g.addColorStop(0, rgba(c, .55 * a + .1)); g.addColorStop(1, rgba(c, 0)); x.fillStyle = g; x.beginPath(); x.arc(px, py, 160, 0, Math.PI * 2); x.fill();
      x.fillStyle = rgba(c, .5 + .5 * a); x.beginPath(); x.arc(px, py, 14 + a * 12, 0, Math.PI * 2); x.fill(); } },
  seduction(x, b, rms, t) { const c = COL("seduction"), r = 140 + rms * 70;
    for (let k = 0; k < 5; k++) { const rr = r + ((t * 60 + k * 70) % 320); x.beginPath(); x.arc(960, 450, rr, 0, Math.PI * 2); x.strokeStyle = rgba(c, Math.max(0, .4 - (rr - r) / 900) * (.35 + rms)); x.lineWidth = 2.5; x.stroke(); }
    const g = x.createRadialGradient(960, 450, r * .6, 960, 450, r * 1.6); g.addColorStop(0, rgba(c, 0)); g.addColorStop(.5, rgba(c, .16 + rms * .45)); g.addColorStop(1, rgba(c, 0)); x.fillStyle = g; x.beginPath(); x.arc(960, 450, r * 1.7, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(960, 450, r, 0, Math.PI * 2); x.strokeStyle = rgba(c, .95); x.lineWidth = 16; x.stroke(); },
  lothlorien(x, b, rms, t) { const c = COL("lothlorien");
    const g = x.createRadialGradient(960, 420, 10, 960, 420, 260 + rms * 160); g.addColorStop(0, rgba(c, .55 + rms * .4)); g.addColorStop(.35, rgba(c, .16 + rms * .2)); g.addColorStop(1, rgba(c, 0));
    x.fillStyle = g; x.beginPath(); x.arc(960, 420, 460, 0, Math.PI * 2); x.fill();
    for (let i = 0; i < 70; i++) { const ph = (i * 137.5) % 360, a = b[i % 24] || 0, sp = 18 + (i % 7) * 6;
      const px = 960 + Math.cos(ph) * (160 + (i * 37) % 600), py = 760 - ((t * sp + i * 53) % 700);
      x.fillStyle = rgba(c, Math.min(1, .15 + a * .9)); x.beginPath(); x.arc(px, py, 2 + a * 5, 0, Math.PI * 2); x.fill(); }
    x.beginPath(); x.arc(960, 420, 26 + rms * 30, 0, Math.PI * 2); x.fillStyle = rgba(c, .95); x.fill(); },
  isengard(x, b, rms, t, V) { const c = COL("isengard"); let bi = -1, since = 9;
    if (V && V.beats) for (let i = 0; i < V.beats.length; i++) { if (V.beats[i] <= t) { bi = i; since = t - V.beats[i]; } else break; }
    [[0, 1], [1, 0], [2, 1], [3, 0], [4, 0]].forEach(([j, acc]) => { const px = 610 + j * 150 + (j >= 2 ? 50 : 0), on = !V || !V.beats || bi < 0 ? 0 : ((bi + (V.phase || 0)) % 5 === j) ? Math.max(0, 1 - since * 2.6) : 0, h = acc ? 300 : 210;
      x.fillStyle = rgba(c, .22 + .78 * on); x.fillRect(px, 640 - h, 110, h); x.font = "600 44px Cinzel"; x.textAlign = "center"; x.fillStyle = on > .3 ? "#140f0a" : rgba(c, .9); x.fillText(["1", "2", "1", "2", "3"][j], px + 55, 610); });
    for (let i = 0; i < 24; i++) { const a = b[i] || 0; x.fillStyle = rgba(c, .3 + a * .6); x.fillRect(610 + i * 30, 670, 18, 6 + a * 26); } },
};

/* ---------- scene player ---------- */
function cinema(o, sid) {
  const sc = SC[sid];
  const scr = pos(el("div", "screen"), 0, 140, W, 800);
  const still = el("div", "still"); still.style.backgroundImage = `url("${sc.poster}")`; scr.appendChild(still);
  const v = el("video"); v.src = sc.file; v.preload = "auto"; v.playsInline = true; scr.appendChild(v);
  o.el.appendChild(scr);
  const hd = el("div", "sc-head", `<span class="t">${sid === "END" ? "" : "SCENE " + sid + " &nbsp;·&nbsp; "}${esc(sc.title).toUpperCase()}</span><span class="ts">FILM ${sc.at}</span>`); o.el.appendChild(hd);
  const tl = el("div", "tl", `<div class="track"></div><div class="fill"></div><div class="t0">0:00</div><div class="t1">0:${String(Math.round(sc.dur)).padStart(2, "0")}</div>`);
  const mk = el("div", "mk" + (sc.cue / sc.dur > .6 ? " right" : ""), `<span>${esc(sc.cuelabel)} · enters at 0:${String(Math.floor(sc.cue)).padStart(2, "0")}</span>`); mk.style.left = (sc.cue / sc.dur * 100) + "%"; tl.appendChild(mk);
  o.el.appendChild(tl);
  let raf = 0;
  const tick = () => { const p = v.duration ? v.currentTime / v.duration : 0; tl.querySelector(".fill").style.width = (p * 100) + "%"; mk.classList.toggle("hit", v.currentTime >= sc.cue); raf = requestAnimationFrame(tick); };
  return { scr, v, tl,
    play: () => { scr.classList.add("playing"); document.body.classList.add("cinema"); v.currentTime = 0; v.play(); playing = v; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
      v.onended = () => { playing = null; } },
    stop: () => { cancelAnimationFrame(raf); v.pause(); document.body.classList.remove("cinema"); },
    reset: () => { scr.classList.remove("playing"); v.currentTime = 0; tl.querySelector(".fill").style.width = "0"; mk.classList.remove("hit"); } };
}
B.scene = o => {
  const sc = SC[o.s.scene], k = o.s.motif, ab = o.s.scene.slice(1);
  bg(o, sc.poster.replace("assets/img/", "").replace(".jpg", "") + "_blur", false, []);
  const c = cinema(o, o.s.scene);
  const pr = el("div", "prompt", `<div class="label" style="color:var(--acc)">Scene ${ab} &nbsp;·&nbsp; film ${sc.at.split("–")[0]}</div>
     <div class="h2" style="font-size:66px;margin-top:10px">${fmt(sc.title)}</div>
     <div style="font-size:34px;font-style:italic;margin-top:12px;color:#e2d8c0">Listen for: <span style="color:var(--acc)">${esc(sc.cuelabel)}</span></div>`);
  c.scr.appendChild(pr); pr.classList.add("rv"); pr.dataset.d = 300; o.rvExtra = [pr];
  o.onEnter = () => c.reset(); o.onLeave = () => c.stop();
  o.steps.push(() => c.play());
  o.media = "▶ PLAY SCENE " + o.s.scene;
};

B.analysis = o => {
  const k = o.s.motif, sc = SC[o.s.scene], ab = o.s.scene.slice(1);
  bg(o, sc.poster.replace("assets/img/", "").replace(".jpg", "") + "_blur", false, ["sh-soft"]);
  head(o, `Scene ${ab} · analysis`, sc.title, 110, 140);
  put(o, pos(el("div", "frame"), 110, 300, 880, 368), 300).style.backgroundImage = `url("${sc.poster}")`;
  // mini timeline of the scene
  const tl = pos(el("div"), 110, 730, 880, 120);
  const f = sc.cue / sc.dur;
  tl.innerHTML = `<div class="label" style="color:#d6cbb2;font-size:17px">When the leitmotif enters</div>
    <div style="position:absolute;left:0;right:0;top:66px;height:4px;background:rgba(255,255,255,.25)"></div>
    <div style="position:absolute;left:0;width:${f * 100}%;top:66px;height:4px;background:rgba(255,255,255,.5)"></div>
    <div style="position:absolute;left:calc(${f * 100}% - 12px);top:56px;width:24px;height:24px;border-radius:50%;background:var(--acc);box-shadow:0 0 18px var(--acc)"></div>
    <div style="position:absolute;${f > .6 ? "right:" + (100 - f * 100) + "%" : "left:" + (f * 100) + "%"};top:92px;font-family:Cinzel;font-size:17px;letter-spacing:.12em;color:var(--acc);white-space:nowrap;${f > .6 ? "" : "margin-left:-12px"}">♪ ${esc(sc.cuelabel)} · 0:${String(Math.floor(sc.cue)).padStart(2, "0")}</div>
    <div style="position:absolute;left:0;top:30px;font-size:22px;color:#cfc4ab">0:00</div><div style="position:absolute;right:0;top:30px;font-size:22px;color:#cfc4ab">0:${String(Math.round(sc.dur)).padStart(2, "0")}</div>`;
  put(o, tl, 600);
  const c = put(o, pos(el("div", "card"), 1050, 280, 770, 700), 400);
  const rows = [["The story", sc.title]].concat(o.s.cards);
  c.innerHTML = rows.map(([a, b], i) => `<div style="position:absolute;left:60px;right:56px;top:${58 + i * 158}px"><div class="lab">${a}</div><div style="font-size:${i === 3 ? 36 : 34}px;line-height:1.2;margin-top:8px;${i === 3 ? "font-style:italic;color:var(--accD)" : ""}">${fmt(b)}</div></div>${i < 3 ? `<div class="rule" style="position:absolute;left:60px;right:60px;top:${58 + i * 158 + 140}px;opacity:.6"></div>` : ""}`).join("");
};

B.compare = o => {
  const k = o.s.motif, n = M[k].n, A = SC[n + "A"], Bs = SC[n + "B"];
  bg(o, Bs.poster.replace("assets/img/", "").replace(".jpg", "") + "_blur", false, ["sh-soft"]);
  head(o, "Scene B · comparison", "Same leitmotif, different effect", 110, 140);
  put(o, pos(el("div", "frame"), 110, 290, 560, 234), 200).style.backgroundImage = `url("${A.poster}")`;
  put(o, pos(el("div", "frame"), 1250, 290, 560, 234), 500).style.backgroundImage = `url("${Bs.poster}")`;
  txt(o, `Scene A<br><span style="font-family:'Garamond EB';text-transform:none;letter-spacing:0;font-size:32px;color:var(--cream)">${esc(A.title)}</span>`, 110, 540, 560, "line-height:1.4", 300, "label");
  txt(o, `Scene B<br><span style="font-family:'Garamond EB';text-transform:none;letter-spacing:0;font-size:32px;color:var(--cream)">${esc(Bs.title)}</span>`, 1250, 540, 560, "line-height:1.4", 600, "label");
  txt(o, "→", 700, 330, 520, "text-align:center;font-size:110px;color:var(--acc);line-height:1", 400);
  txt(o, `<span style="font-family:Cinzel;letter-spacing:.2em;font-size:20px;color:#d6cbb2">THE SAME</span><br><span style="font-size:40px;font-style:italic">${M[k].name.replace("The ", "")} theme</span>`, 700, 460, 520, "text-align:center;line-height:1.3", 450);
  const c = put(o, pos(el("div", "card"), 110, 660, 1700, 300), 800);
  c.innerHTML = o.s.rows.map(([a, x, y], i) => `<div style="position:absolute;left:60px;top:${50 + i * 74}px;width:220px" class="lab">${a}</div>
     <div style="position:absolute;left:290px;top:${42 + i * 74}px;width:600px;font-size:34px">${fmt(x)}</div>
     <div style="position:absolute;left:900px;top:${38 + i * 74}px;font-size:36px;color:var(--accD)">→</div>
     <div style="position:absolute;left:970px;top:${42 + i * 74}px;width:700px;font-size:34px;${i === 2 ? "font-style:italic;color:var(--accD);font-weight:600" : ""}">${fmt(y)}</div>`).join("");
  txt(o, fmt(o.s.effect), 0, 985, W, "text-align:center;font-size:44px;font-style:italic;color:var(--acc)", 1600);
};

/* ---------- CONCLUSION ---------- */
B.synthesis = o => {
  bg(o, o.s.bg, true, ["sh-soft"]);
  head(o, "V · Conclusion", "How does Howard Shore use leitmotifs to tell the story?", 110, 140, false, 48);
  o.s.pillars.forEach(([n, t, d], i) => {
    const c = pos(el("div", "card", `<div style="position:absolute;left:0;right:0;top:40px;text-align:center"><span style="display:inline-block;width:70px;height:70px;border-radius:50%;background:var(--ink);color:var(--goldL);font-family:Cinzel;font-size:36px;line-height:70px">${n}</span></div>
      <div style="position:absolute;left:0;right:0;top:130px;text-align:center;font-family:Cinzel;font-size:44px">${t}</div>
      <div style="position:absolute;left:40px;right:40px;top:200px;text-align:center;font-size:31px;line-height:1.25;font-style:italic;color:var(--ink2)">${fmt(d)}</div>`), 110 + i * 580, 340, 540, 340);
    put(o, c, 400 + i * 600);
  });
  o.s.pairs.forEach(([k, a, b], i) => {
    const g = pos(el("div", "glass", `<div style="position:absolute;left:24px;top:22px">${glyph(k, 54)}</div><div style="position:absolute;left:92px;top:26px;font-family:Cinzel;font-size:20px;letter-spacing:.06em;color:var(--${k});line-height:1.2;right:10px">${M[k].name}</div>
      <div style="position:absolute;left:0;right:0;top:110px;text-align:center;font-size:32px;font-style:italic">${a} <span style="color:var(--${k})">→</span> ${b}</div>`), 110 + i * 344, 740, 324, 190);
    put(o, g, 2200 + i * 250);
  });
};

B.choice = o => {
  bg(o, o.s.bg, true, ["sh-left"]);
  txt(o, "V · My choice: the most effective leitmotif", 110, 150, 1200, "color:var(--fellowship)", 0, "label");
  txt(o, "The Fellowship", 110, 195, 1100, "font-size:110px", 200, "h1");
  const rows = [["2", "two instruments for two hobbits"], ["9", "the full orchestra for nine companions"], ["3", "only three go on: it returns one last time"]];
  rows.forEach(([n, t], i) => {
    txt(o, n, 110, 360 + i * 100, 100, "font-family:Cinzel;font-size:72px;line-height:1;color:var(--fellowship)", 800 + i * 1800);
    txt(o, fmt(t), 210, 372 + i * 100, 900, "font-size:40px", 900 + i * 1800);
  });
  // orbs: 2 -> 9 -> 3
  const g = pos(el("div", "glass"), 1300, 150, 520, 360); g.style.borderRadius = "6px"; o.el.appendChild(g);
  const dots = [...Array(9)].map((_, i) => { const ang = Math.PI * (.95 - i * .9 / 8), x = 260 + Math.cos(ang) * 220, y = 290 - Math.sin(ang) * 220; const d = el("div", "orb"); pos(d, x - 20, y - 20, 40, 40); g.appendChild(d); return d; });
  let T = []; const later = (f, ms) => T.push(setTimeout(f, ms)); const clear = () => { T.forEach(clearTimeout); T = []; };
  const fr = pos(el("div", "endframe"), 1060, 560, 760, 318);
  const v = el("video"); v.src = SC.END.file; v.preload = "auto"; fr.appendChild(v); o.el.appendChild(fr);
  const q = pos(el("div", "card", `<div style="position:absolute;left:56px;right:50px;top:44px;font-size:40px;font-style:italic;line-height:1.25">${fmt("'still weakened, still partial, but undefeated'")}</div><div style="position:absolute;left:56px;top:162px" class="lab">Doug Adams, music critic</div>`), 110, 700, 880, 230);
  q.classList.add("rv"); o.el.appendChild(q);
  const last = pos(el("div", "", "It tells its whole story."), 110, 960, 900); last.style.cssText += "font-size:40px;font-style:italic;color:var(--fellowship)"; last.classList.add("rv"); o.el.appendChild(last);
  o.onEnter = () => { clear(); dots.forEach(d => d.classList.remove("on", "dim"));
    dots.forEach((d, i) => later(() => d.classList.add("on"), i < 2 ? 900 : 2700 + (i - 2) * 220));
    [0, 1, 3, 5, 7, 8].forEach((i, j) => later(() => dots[i].classList.add("dim"), 5000 + j * 200)); };
  o.onLeave = () => { clear(); v.pause(); fr.classList.remove("on"); };
  o.steps.push(() => { fr.classList.add("on"); v.currentTime = 0; v.play(); playing = v; v.onended = () => { playing = null; setTimeout(() => q.classList.add("on"), 300); setTimeout(() => last.classList.add("on"), 1500); }; });
  o.media = "▶ PLAY THE FINAL SCENE (then say block 2)";
  o.revealAll = () => { dots.forEach((d, i) => { d.classList.add("on"); if ([0, 1, 3, 5, 7, 8].includes(i)) d.classList.add("dim"); }); q.classList.add("on"); last.classList.add("on"); };
};

B.end = o => {
  bg(o, "end", true, ["sh-soft"]);
  txt(o, "Music lets us hear what the characters cannot see yet.", 0, 330, W, "text-align:center;font-size:46px;font-style:italic;color:#e6dcc4", 300);
  txt(o, fmt(o.s.lines[0]), 0, 450, W, "text-align:center;font-size:64px", 1200, "h2");
  txt(o, fmt(o.s.lines[1]), 0, 540, W, "text-align:center;font-size:64px;color:var(--goldL)", 2200, "h2");
  txt(o, "Thank you for listening", 0, 760, W, "text-align:center;font-size:30px", 3600, "label");
  o.steps.push(() => document.getElementById("black").classList.add("on"));
};

/* ---------- journey nav (the curve) ---------- */
const CHAP = ["Introduction"].concat(ORDER.map((k, i) => ROMAN[i] + " · " + M[k].name.replace("The Seduction of the Ring", "Seduction").replace("The ", ""))).concat(["Conclusion"]);
const NX = CHAP.map((_, i) => 90 + i * 172), NY = i => 50 + Math.sin(i * 1.1) * 10;
function navChapter(s) { if (s.motif && s.kind !== "choice") return M[s.motif].n; if (["synthesis", "choice", "end"].includes(s.kind)) return 6; return 0; }
function drawNav(ch, k) {
  let d = `M${NX[0]} ${NY(0)}`; for (let i = 1; i < NX.length; i++) d += ` Q${(NX[i - 1] + NX[i]) / 2} ${(NY(i - 1) + NY(i)) / 2 + (i % 2 ? -16 : 16)} ${NX[i]} ${NY(i)}`;
  const col = k ? `var(--${k})` : "var(--goldL)";
  let h = `<path d="${d}" fill="none" stroke="rgba(216,185,104,.55)" stroke-width="2.5" stroke-dasharray="6 6"/>`;
  CHAP.forEach((c, i) => { const cur = i === ch, past = i < ch; const nc = i >= 1 && i <= 5 ? `var(--${ORDER[i - 1]})` : "var(--goldL)";
    h += `<circle cx="${NX[i]}" cy="${NY(i)}" r="${cur ? 11 : 7}" fill="${cur || past ? nc : "rgba(20,16,11,.9)"}" stroke="${nc}" stroke-width="2.5"/>`;
    h += `<text x="${NX[i]}" y="${NY(i) + 34}" text-anchor="middle" font-family="Cinzel" font-size="${cur ? 15 : 13}" font-weight="${cur ? 700 : 500}" letter-spacing="1.5" fill="${cur ? nc : "rgba(244,236,217,.6)"}">${c.toUpperCase()}</text>`; });
  document.getElementById("navsvg").innerHTML = h;
}
const STEPK = { listen: 0, scene: -1, analysis: 2, compare: 4 };
function setNav(o) {
  const s = o.s, nav = document.getElementById("nav"), st = document.getElementById("steps");
  if (["hook", "title", "end"].includes(s.kind)) { nav.classList.remove("on"); return; }
  nav.classList.add("on");
  const ch = navChapter(s); drawNav(ch, s.motif);
  if (ch >= 1 && ch <= 5) {
    let cur = s.kind === "chapter" ? -1 : STEPK[s.kind]; if (s.kind === "scene") cur = s.scene.endsWith("A") ? 1 : 3;
    st.innerHTML = ["Listen", "Scene A", "Analysis", "Scene B", "Comparison"].map((t, i) => `<span class="${i === cur ? "cur" : i < cur ? "done" : ""}">${t}</span>`).join("");
  } else st.innerHTML = "";
}

/* ---------- build & navigation ---------- */
const SL = D.slides.map(s => { const o = make(s); B[s.kind](o); return o; });
let cur = -1, stp = 0, skipArm = 0, timers = [];
function stopAll() { document.querySelectorAll("video,audio").forEach(m => m.pause()); playing = null; document.body.classList.remove("cinema"); }
function go(i, revealAll) {
  if (i < 0 || i >= SL.length) return;
  document.getElementById("black").classList.remove("on"); stopAll(); timers.forEach(clearTimeout); timers = [];
  if (cur >= 0) { const p = SL[cur]; p.el.classList.remove("active"); p.onLeave && p.onLeave(); }
  const o = SL[i]; cur = i; stp = 0;
  const rvs = [...o.el.querySelectorAll(".rv")];
  rvs.forEach(e => e.classList.remove("on"));
  stage.style.setProperty("--acc", o.s.motif ? `var(--${o.s.motif})` : "var(--neutral)");
  stage.style.setProperty("--accD", o.s.motif ? `var(--${o.s.motif}D)` : "var(--neutralD)");
  o.el.querySelectorAll(".bg.kb").forEach(b => { b.style.animation = "none"; b.offsetHeight; b.style.animation = ""; });
  o.el.classList.add("active"); setNav(o);
  o.onEnter && o.onEnter();
  if (revealAll) { rvs.forEach(e => { if (!e.classList.contains("late") || o.revealAll) e.classList.add("on"); }); o.revealAll && o.revealAll(); }
  else rvs.filter(e => e.dataset.d != null).forEach(e => timers.push(setTimeout(() => e.classList.add("on"), 250 + (+e.dataset.d))));
  sync();
}
function next() {
  if (playing && !playing.paused && !playing.ended) {
    if (Date.now() - skipArm < 2200) { const p = playing; stopAll(); skipArm = 0; document.getElementById("skip").classList.remove("on"); p.onended && p.onended(); }
    else { skipArm = Date.now(); const s = document.getElementById("skip"); s.classList.add("on"); setTimeout(() => s.classList.remove("on"), 2000); }
    return;
  }
  const o = SL[cur]; if (stp < o.steps.length) { o.steps[stp++](); sync(); } else go(cur + 1);
}
function prev() { if (cur > 0) go(cur - 1, true); }
addEventListener("keydown", e => {
  if (["ArrowRight", " ", "PageDown", "Enter", "ArrowDown"].includes(e.key)) { e.preventDefault(); next(); }
  else if (["ArrowLeft", "PageUp", "ArrowUp"].includes(e.key)) { e.preventDefault(); prev(); }
  else if (e.key === "f" || e.key === "F") { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }
  else if (e.key === "p" || e.key === "P") openPresenter();
  else if (e.key === "o" || e.key === "O") overview();
  else if (e.key === "Escape") document.getElementById("ov").classList.remove("on");
  else if (e.key === "Home") go(0);
});
stage.addEventListener("click", next);
/* v2: phones and tablets. Tap = next (tap the left edge = back), swipe left/right = next/back. */
(function touch() {
  const vp = document.getElementById("viewport"); let sx = 0, sy = 0, st = 0;
  vp.addEventListener("touchstart", e => { const t = e.changedTouches[0]; sx = t.clientX; sy = t.clientY; st = Date.now(); }, { passive: true });
  vp.addEventListener("touchend", e => {
    if (e.target.closest && e.target.closest("#ov,#fsbtn")) return;
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; e.preventDefault();
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) { dx < 0 ? next() : prev(); return; }
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && Date.now() - st < 600) { t.clientX < innerWidth * .15 ? prev() : next(); }
  }, { passive: false });
  if (matchMedia("(pointer: coarse)").matches) {
    document.body.classList.add("touch");
    const fb = el("button", "", "\u26F6"); fb.id = "fsbtn"; fb.title = "Full screen";
    fb.addEventListener("click", e => { e.stopPropagation(); const d = document.documentElement; try { if (document.fullscreenElement) document.exitFullscreen(); else (d.requestFullscreen || d.webkitRequestFullscreen || (() => {})).call(d); } catch (_) {} });
    document.body.appendChild(fb);
    const rot = el("div", "", "<div style='font-size:46px'>\u27F2</div>Turn your phone sideways<br><span>Tap to go forward \u00B7 tap the left edge to go back</span>"); rot.id = "rotate"; document.body.appendChild(rot);
  }
})();
let mt = 0; addEventListener("mousemove", () => { document.body.classList.add("cursor"); clearTimeout(mt); mt = setTimeout(() => document.body.classList.remove("cursor"), 1800); });
function overview() { const ov = document.getElementById("ov"); if (ov.classList.contains("on")) { ov.classList.remove("on"); return; } ov.innerHTML = ""; SL.forEach((o, i) => { const d = el("div", "", `<b>${i + 1}</b> · ${esc(o.s.title)}`); d.onclick = () => { ov.classList.remove("on"); go(i); }; ov.appendChild(d); }); ov.classList.add("on"); }

/* presenter window: the full text to say on this slide, what the next click does, timer */
let pw = null, t0 = null;
function openPresenter() {
  pw = window.open("", "presenter", "width=1100,height=800"); if (!pw) return;
  pw.document.write(`<!doctype html><title>Presenter · The Sound of the Story</title><body style="background:#15120e;color:#eee;font-family:Georgia,serif;margin:28px"><div style="display:flex;justify-content:space-between;color:#999"><span id="pos"></span><span id="clock" style="font-size:30px;color:#eee"></span></div><h2 id="ttl" style="color:#d8b968;font-weight:normal"></h2><div id="cue" style="font-size:17px;color:#c9a96a;margin-bottom:14px"></div><div id="now" style="font-size:27px;line-height:1.45"></div><p style="color:#888;margin-top:24px">NEXT CLICK:</p><div id="nxt" style="font-size:22px;color:#bbb"></div></body>`);
  pw.document.close(); if (!t0) t0 = Date.now(); sync();
  setInterval(() => { if (pw && !pw.closed) { const s = Math.floor((Date.now() - t0) / 1000); pw.document.getElementById("clock").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; } }, 500);
}
function sync() {
  if (!pw || pw.closed) return; const o = SL[cur], d = pw.document;
  d.getElementById("pos").textContent = `Slide ${cur + 1} / ${SL.length}`; d.getElementById("ttl").textContent = o.s.title;
  d.getElementById("cue").textContent = o.s.cue || "";
  d.getElementById("now").innerHTML = o.s.say.map((b, i) => `<p style="margin:0 0 14px;${o.s.kind === "choice" && i !== (stp ? 1 : 0) ? "opacity:.4" : ""}">${esc(b)}</p>`).join(o.s.kind === "choice" ? `<p style="color:#d8b968">▶ final scene</p>` : "");
  d.getElementById("nxt").textContent = stp < o.steps.length ? (o.media || "▶") : (SL[cur + 1] ? "→ " + SL[cur + 1].s.title : "END");
}
document.getElementById("help").classList.add("on"); setTimeout(() => document.getElementById("help").classList.remove("on"), 7000);
go(0);
window.__deck = { go, next, prev, SL, get cur() { return cur; }, get stp() { return stp; } };
})();
