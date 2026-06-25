const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");
const journey = document.querySelector(".journey");
const rails = [...document.querySelectorAll(".scene-rail li")];
const heroCopy = document.querySelector(".hero-copy");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const backdrop = new Image();

backdrop.src = "assets/cafeconnect-alpine-restaurant.png";

const state = {
  w: 0,
  h: 0,
  dpr: 1,
  progress: 0,
  target: 0,
  pointerX: 0,
  pointerY: 0,
};

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function ease(t) {
  return t * t * (3 - 2 * t);
}

function resize() {
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.w = window.innerWidth;
  state.h = window.innerHeight;
  canvas.width = Math.floor(state.w * state.dpr);
  canvas.height = Math.floor(state.h * state.dpr);
  canvas.style.width = `${state.w}px`;
  canvas.style.height = `${state.h}px`;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
}

function updateScroll() {
  const rect = journey.getBoundingClientRect();
  const travel = Math.max(1, rect.height - window.innerHeight);
  state.target = clamp(-rect.top / travel);
}

function drawBackdrop(p) {
  const { w, h } = state;
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, "#9bd6e8");
  gradient.addColorStop(0.52, "#f8dd9c");
  gradient.addColorStop(1, "#213a2d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  if (backdrop.complete && backdrop.naturalWidth) {
    const zoom = mix(1.08, 1.82, ease(p));
    const imgRatio = backdrop.naturalWidth / backdrop.naturalHeight;
    const viewRatio = w / h;
    let dw = w * zoom;
    let dh = dw / imgRatio;
    if (dh < h * zoom) {
      dh = h * zoom;
      dw = dh * imgRatio;
    }
    const x = (w - dw) / 2 + mix(0, -w * 0.1, p) + state.pointerX * 18;
    const y = (h - dh) / 2 + mix(h * 0.08, -h * 0.18, p) + state.pointerY * 10;
    ctx.globalAlpha = mix(0.78, 0.48, p);
    ctx.drawImage(backdrop, x, y, dw, dh);
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = `rgba(12, 24, 18, ${mix(0.2, 0.62, p)})`;
  ctx.fillRect(0, 0, w, h);
}

function mountain(points, color, alpha = 1) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (const point of points.slice(1)) ctx.lineTo(point[0], point[1]);
  ctx.closePath();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawWorldLayers(p) {
  const { w, h } = state;
  const drift = p * w * 0.32;
  mountain(
    [
      [-w * 0.2 - drift * 0.1, h * 0.7],
      [w * 0.15 - drift * 0.12, h * 0.26],
      [w * 0.42 - drift * 0.08, h * 0.62],
      [w * 0.62 - drift * 0.1, h * 0.34],
      [w * 1.2 - drift * 0.12, h * 0.72],
    ],
    "#55785c",
    0.48
  );
  mountain(
    [
      [-w * 0.1 - drift * 0.32, h * 0.82],
      [w * 0.22 - drift * 0.35, h * 0.38],
      [w * 0.48 - drift * 0.3, h * 0.74],
      [w * 0.77 - drift * 0.36, h * 0.4],
      [w * 1.18 - drift * 0.34, h * 0.82],
    ],
    "#335f43",
    0.62
  );

  ctx.fillStyle = "#1d3b2c";
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.bezierCurveTo(w * 0.18, h * 0.82, w * 0.34, h * 0.78, w * 0.5, h * 0.86);
  ctx.bezierCurveTo(w * 0.72, h * 0.98, w * 0.86, h * 0.76, w, h * 0.83);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

function drawRoad(p) {
  const { w, h } = state;
  const roadTop = mix(h * 0.58, h * 0.42, p);
  const roadWide = mix(w * 0.08, w * 1.22, p);
  const roadNarrow = mix(w * 0.02, w * 0.22, p);
  ctx.fillStyle = "#bdb09c";
  ctx.beginPath();
  ctx.moveTo(w * 0.5 - roadNarrow, roadTop);
  ctx.lineTo(w * 0.5 + roadNarrow, roadTop);
  ctx.lineTo(w * 0.5 + roadWide, h + 20);
  ctx.lineTo(w * 0.5 - roadWide, h + 20);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(w * 0.5 - roadNarrow, roadTop);
  ctx.lineTo(w * 0.5 + roadNarrow, roadTop);
  ctx.lineTo(w * 0.5 + roadWide, h + 20);
  ctx.lineTo(w * 0.5 - roadWide, h + 20);
  ctx.closePath();
  ctx.clip();
  for (let row = 0; row < 16; row++) {
    const t = row / 15;
    const y = mix(roadTop + 10, h + 40, t * t);
    const stoneW = mix(18, 70, t);
    const stoneH = mix(8, 22, t);
    const count = Math.ceil(w / stoneW);
    for (let col = -2; col < count; col++) {
      const offset = row % 2 ? stoneW * 0.5 : 0;
      const x = col * stoneW + offset - (p * 80) % stoneW;
      ctx.strokeStyle = `rgba(255, 249, 237, ${mix(0.12, 0.34, t)})`;
      ctx.lineWidth = mix(0.8, 1.6, t);
      roundedRect(x, y, stoneW * 0.82, stoneH, 3);
      ctx.stroke();
    }
  }
  ctx.restore();

  for (let i = 0; i < 10; i++) {
    const t = (i / 17 + p * 1.8) % 1;
    const y = mix(roadTop + 12, h + 30, t * t);
    const width = mix(3, 22, t);
    ctx.fillStyle = `rgba(255, 249, 237, ${mix(0.12, 0.42, t)})`;
    ctx.fillRect(w * 0.5 - width / 2, y, width, mix(2, 8, t));
  }
}

function roundedRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawRestaurant(p) {
  const { w, h } = state;
  const appear = ease(clamp((p - 0.08) / 0.18));
  if (appear <= 0.01) return;
  const t = ease(clamp((p - 0.18) / 0.34));
  const scale = mix(0.58, 1.45, t);
  const x = w * 0.58 - w * 0.08 * t;
  const y = mix(h * 0.47, h * 0.23, t);
  const bw = Math.min(w * 0.62 * scale, w * 1.05);
  const bh = h * 0.34 * scale;

  ctx.save();
  ctx.globalAlpha = appear;
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(22, 28, 22, 0.24)";
  ctx.beginPath();
  ctx.ellipse(bw * 0.08, bh * 1.05, bw * 0.55, bh * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f4e2c7";
  roundedRect(-bw * 0.5, 0, bw, bh, 8);
  ctx.fill();
  ctx.fillStyle = "#b84435";
  ctx.beginPath();
  ctx.moveTo(-bw * 0.55, 0);
  ctx.lineTo(0, -bh * 0.32);
  ctx.lineTo(bw * 0.55, 0);
  ctx.closePath();
  ctx.fill();
  for (let tile = 0; tile < 10; tile++) {
    ctx.strokeStyle = "rgba(80, 38, 28, 0.22)";
    ctx.lineWidth = Math.max(1, 1.4 * scale);
    ctx.beginPath();
    const tx = -bw * 0.48 + tile * bw * 0.096;
    ctx.moveTo(tx, -bh * 0.02);
    ctx.lineTo(tx + bw * 0.05, -bh * 0.2);
    ctx.stroke();
  }

  ctx.fillStyle = "#fff1d0";
  roundedRect(-bw * 0.46, bh * 0.02, bw * 0.92, bh * 0.16, 5);
  ctx.fill();
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = i % 2 ? "#fff1d0" : "#c94334";
    ctx.fillRect(-bw * 0.46 + (bw * 0.92 / 9) * i, bh * 0.02, bw * 0.92 / 9, bh * 0.16);
  }
  ctx.fillStyle = "#2e4b39";
  roundedRect(-bw * 0.12, bh * 0.2, bw * 0.24, bh * 0.1, 4);
  ctx.fill();
  ctx.fillStyle = "#165a3b";
  roundedRect(-bw * 0.49, bh * 0.38, bw * 0.08, bh * 0.34, 3);
  roundedRect(bw * 0.41, bh * 0.38, bw * 0.08, bh * 0.34, 3);
  ctx.fill();
  ctx.fillStyle = "#fffaf2";
  ctx.font = `${Math.max(10, bh * 0.045)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("BAR", 0, bh * 0.27);
  ctx.textAlign = "left";
  drawItalianFlag(bw * 0.34, bh * 0.24, bw * 0.12, bh * 0.07);

  ctx.fillStyle = "#492f26";
  roundedRect(-bw * 0.18, bh * 0.38, bw * 0.36, bh * 0.62, 6);
  ctx.fill();
  ctx.fillStyle = "#3b6c50";
  roundedRect(-bw * 0.42, bh * 0.14, bw * 0.22, bh * 0.2, 4);
  roundedRect(bw * 0.2, bh * 0.14, bw * 0.22, bh * 0.2, 4);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 210, 122, 0.35)";
  roundedRect(-bw * 0.39, bh * 0.17, bw * 0.16, bh * 0.14, 3);
  roundedRect(bw * 0.23, bh * 0.17, bw * 0.16, bh * 0.14, 3);
  ctx.fill();

  ctx.fillStyle = "#ffd27a";
  for (const offset of [-0.32, 0.32]) {
    ctx.beginPath();
    ctx.arc(bw * offset, bh * 0.7, Math.max(5, 12 * scale), 0, Math.PI * 2);
    ctx.fill();
  }

  drawStringLights(-bw * 0.42, bh * 0.05, bw * 0.84, bh * 0.18, scale);
  drawMenuBoard(-bw * 0.57, bh * 0.68, scale);
  drawPlant(-bw * 0.54, bh * 0.98, scale);
  drawPlant(bw * 0.52, bh * 1.0, scale * 0.9);
  drawCafeChair(-bw * 0.42, bh * 1.08, scale * 0.95);
  drawCafeChair(-bw * 0.22, bh * 1.09, scale * 0.9);
  drawCafeChair(bw * 0.42, bh * 1.1, scale * 0.86);
  drawTable(-bw * 0.33, bh * 1.02, scale);
  drawTable(bw * 0.3, bh * 1.06, scale * 0.94);
  drawPerson(-bw * 0.03, bh * 0.98, scale, "#1f5a3f");
  drawPerson(bw * 0.2, bh * 1.0, scale * 0.82, "#6f3028");
  ctx.restore();
}

function drawItalianFlag(x, y, width, height) {
  ctx.fillStyle = "#165a3b";
  ctx.fillRect(x, y, width / 3, height);
  ctx.fillStyle = "#fff9ed";
  ctx.fillRect(x + width / 3, y, width / 3, height);
  ctx.fillStyle = "#c9342b";
  ctx.fillRect(x + (width / 3) * 2, y, width / 3, height);
}

function drawMenuBoard(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#2b1c17";
  roundedRect(-18, -42, 36, 48, 3);
  ctx.fill();
  ctx.strokeStyle = "#d9b775";
  ctx.lineWidth = 2;
  ctx.strokeRect(-13, -36, 26, 34);
  ctx.fillStyle = "#fff9ed";
  ctx.fillRect(-9, -28, 18, 2);
  ctx.fillRect(-9, -20, 14, 2);
  ctx.fillRect(-9, -12, 18, 2);
  ctx.strokeStyle = "#2b1c17";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-9, 6);
  ctx.lineTo(-14, 36);
  ctx.moveTo(9, 6);
  ctx.lineTo(14, 36);
  ctx.stroke();
  ctx.restore();
}

function drawStringLights(x, y, width, sag, scale) {
  ctx.strokeStyle = "rgba(255, 250, 242, 0.72)";
  ctx.lineWidth = Math.max(1, 1.2 * scale);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + width / 2, y + sag, x + width, y);
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const lx = x + width * t;
    const ly = y + sag * Math.sin(Math.PI * t);
    ctx.fillStyle = "#ffd27a";
    ctx.beginPath();
    ctx.arc(lx, ly + 5 * scale, Math.max(2, 3.5 * scale), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCafeChair(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = "#2d201b";
  ctx.lineWidth = 4;
  ctx.strokeRect(-18, -28, 36, 26);
  ctx.beginPath();
  ctx.moveTo(-16, -2);
  ctx.lineTo(-24, 36);
  ctx.moveTo(16, -2);
  ctx.lineTo(24, 36);
  ctx.stroke();
  ctx.fillStyle = "#b84435";
  roundedRect(-22, -4, 44, 8, 3);
  ctx.fill();
  ctx.restore();
}

function drawPlant(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#9d5c3b";
  roundedRect(-18, 4, 36, 26, 4);
  ctx.fill();
  ctx.fillStyle = "#2f6f45";
  for (let i = 0; i < 7; i++) {
    const angle = -Math.PI / 2 + (i - 3) * 0.26;
    ctx.beginPath();
    ctx.ellipse(Math.cos(angle) * 12, Math.sin(angle) * 10, 8, 20, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPerson(x, y, scale, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#d9a37a";
  ctx.beginPath();
  ctx.arc(0, -44, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  roundedRect(-10, -34, 20, 34, 8);
  ctx.fill();
  ctx.strokeStyle = "#241b18";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-7, 0);
  ctx.lineTo(-13, 30);
  ctx.moveTo(7, 0);
  ctx.lineTo(13, 30);
  ctx.moveTo(-8, -23);
  ctx.lineTo(-24, -8);
  ctx.moveTo(8, -23);
  ctx.lineTo(24, -8);
  ctx.stroke();
  ctx.restore();
}

function drawTable(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#392820";
  ctx.fillRect(-30, 0, 60, 7);
  ctx.fillRect(-3, 5, 6, 38);
  ctx.fillRect(-28, 40, 56, 5);
  ctx.fillStyle = "#fffaf2";
  roundedRect(-8, -28, 16, 22, 2);
  ctx.fill();
  drawQr(-5, -24, 10, "#17211b");
  ctx.restore();
}

function drawQr(x, y, size, color) {
  ctx.fillStyle = color;
  const cell = size / 5;
  const blocks = [
    [0, 0], [1, 0], [3, 0], [4, 0], [0, 1], [2, 1], [4, 1],
    [1, 2], [3, 2], [0, 3], [2, 3], [4, 3], [0, 4], [1, 4], [3, 4],
  ];
  for (const [cx, cy] of blocks) ctx.fillRect(x + cx * cell, y + cy * cell, cell * 0.72, cell * 0.72);
}

function drawPhone(x, y, width, height, label, accent, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(mix(-0.04, 0.03, t));
  ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
  roundedRect(-width / 2 + 10, -height / 2 + 16, width, height, 22);
  ctx.fill();
  ctx.fillStyle = "#111713";
  roundedRect(-width / 2, -height / 2, width, height, 24);
  ctx.fill();
  ctx.fillStyle = "#fffaf2";
  roundedRect(-width / 2 + 8, -height / 2 + 10, width - 16, height - 20, 18);
  ctx.fill();
  ctx.fillStyle = accent;
  roundedRect(-width / 2 + 20, -height / 2 + 28, width - 40, 42, 8);
  ctx.fill();
  ctx.fillStyle = "#17211b";
  ctx.font = "800 15px system-ui, sans-serif";
  ctx.fillText(label, -width / 2 + 28, -height / 2 + 55);

  for (let i = 0; i < 4; i++) {
    const rowY = -height / 2 + 92 + i * 38;
    ctx.fillStyle = i === 1 ? "#f1c266" : "#e8e1d5";
    roundedRect(-width / 2 + 22, rowY, width - 44, 24, 6);
    ctx.fill();
    ctx.fillStyle = "#17211b";
    ctx.globalAlpha = 0.5;
    ctx.fillRect(-width / 2 + 34, rowY + 8, width * (0.34 + i * 0.08), 4);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawInterfaceScenes(p) {
  const { w, h } = state;
  const phoneIn = ease(clamp((p - 0.42) / 0.34));
  const qrIn = ease(clamp((p - 0.28) / 0.28)) * (1 - ease(clamp((p - 0.66) / 0.22)));

  if (qrIn > 0.01) {
    const size = mix(96, Math.min(w, h) * 0.42, qrIn);
    const x = mix(w * 0.76, w * 0.5, qrIn);
    const y = mix(h * 0.62, h * 0.5, qrIn);
    ctx.globalAlpha = qrIn;
    ctx.fillStyle = "rgba(255, 250, 242, 0.95)";
    roundedRect(x - size / 2, y - size / 2, size, size, 12);
    ctx.fill();
    drawQr(x - size * 0.36, y - size * 0.36, size * 0.72, "#17211b");
    ctx.fillStyle = "#17211b";
    ctx.font = `800 ${Math.max(14, size * 0.07)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("Scan menu", x, y + size * 0.43);
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
  }

  if (phoneIn > 0.01) {
    ctx.globalAlpha = phoneIn;
    const mainW = Math.min(220, w * 0.34);
    const mainH = mainW * 1.9;
    drawPhone(mix(w * 1.12, w * 0.68, phoneIn), h * 0.52, mainW, mainH, "Table 12", "#4b8a55", phoneIn);
    drawPhone(mix(-w * 0.12, w * 0.32, phoneIn), h * 0.58, mainW * 0.86, mainH * 0.86, "Kitchen", "#c94334", 1 - phoneIn);
    ctx.globalAlpha = 1;
  }
}

function drawSignalLines(p) {
  const { w, h } = state;
  const t = ease(clamp((p - 0.56) / 0.34));
  if (t <= 0.01) return;
  ctx.globalAlpha = t * 0.78;
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ffd27a";
  const points = [
    [w * 0.34, h * 0.58],
    [w * 0.5, h * 0.36],
    [w * 0.68, h * 0.52],
  ];
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  ctx.quadraticCurveTo(points[1][0], points[1][1], points[2][0], points[2][1]);
  ctx.stroke();
  for (const point of points) {
    ctx.beginPath();
    ctx.arc(point[0], point[1], 5 + Math.sin(Date.now() / 240) * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd27a";
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawVignette(p) {
  const { w, h } = state;
  const gradient = ctx.createRadialGradient(w * 0.5, h * 0.46, h * 0.1, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, `rgba(8, 16, 12, ${mix(0.35, 0.66, p)})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

function render() {
  if (reducedMotion) state.progress = state.target;
  else state.progress += (state.target - state.progress) * 0.08;

  const p = state.progress;
  ctx.clearRect(0, 0, state.w, state.h);
  drawBackdrop(p);
  drawWorldLayers(p);
  drawRoad(p);
  drawRestaurant(p);
  drawInterfaceScenes(p);
  drawSignalLines(p);
  drawVignette(p);

  const active = Math.min(rails.length - 1, Math.floor(p * rails.length));
  rails.forEach((rail, index) => rail.classList.toggle("active", index === active));
  heroCopy.style.opacity = String(clamp(1 - p * 2.2, 0, 1));
  heroCopy.style.transform = `translateY(${-p * 34}px)`;

  requestAnimationFrame(render);
}

window.addEventListener("resize", resize);
window.addEventListener("scroll", updateScroll, { passive: true });
window.addEventListener("pointermove", (event) => {
  state.pointerX = (event.clientX / Math.max(1, state.w) - 0.5) * 2;
  state.pointerY = (event.clientY / Math.max(1, state.h) - 0.5) * 2;
});

resize();
updateScroll();
render();
