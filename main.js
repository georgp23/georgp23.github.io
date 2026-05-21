// ─── CURSOR ────────────────────────────────────────────────────────────────
const cursor = document.getElementById('cursor');
const ring   = document.getElementById('cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;
document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
(function animCursor() {
  cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
  rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
  ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
  requestAnimationFrame(animCursor);
})();

// ─── SCROLL REVEAL ─────────────────────────────────────────────────────────
const revEls = document.querySelectorAll('.reveal');
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
revEls.forEach(el => obs.observe(el));

// ─── CERTIFICATION TELESCOPE SCROLL ─────────────────────────────────────────
(function initCertTelescopeScroll() {
  const section = document.getElementById('certifications');
  const telescope = document.querySelector('.cert-telescope');
  const stars = Array.from(document.querySelectorAll('.cert-bg-star'));
  if (!section || !telescope || !stars.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let frame = 0;
  const startAngle = 28;
  const endAngle = -135;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  function getMidScreenProgress() {
    const rect = section.getBoundingClientRect();
    const viewportMid = (window.innerHeight || document.documentElement.clientHeight) / 2;
    return clamp((viewportMid - rect.top) / Math.max(rect.height * 0.5, 1), 0, 1);
  }

  function updateTelescope() {
    frame = 0;
    const progress = smoothstep(getMidScreenProgress());
    const angle = startAngle + (endAngle - startAngle) * progress;
    telescope.style.setProperty('--cert-telescope-angle', `${angle.toFixed(2)}deg`);
    telescope.style.setProperty('--cert-lens-opacity', progress > 0.72 ? ((progress - 0.72) / 0.28).toFixed(2) : '0');

    stars.forEach((star, i) => {
      const start = i / (stars.length + 3);
      const starProgress = clamp((progress - start) / 0.22, 0, 1);
      const finalOpacity = Number(star.style.getPropertyValue('--star-final')) || 0.95;
      star.style.opacity = (smoothstep(starProgress) * finalOpacity).toFixed(2);
      star.style.setProperty('--star-scale', (0.65 + smoothstep(starProgress) * 0.35).toFixed(2));
    });
  }

  function scheduleUpdate() {
    if (!frame) frame = requestAnimationFrame(updateTelescope);
  }

  updateTelescope();
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
})();

// ─── ARTISTIC TREE - small leaves + radius glow on hover ───────────────────
(function initArtTree() {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.getElementById('tree-svg');
  const layer = document.getElementById('leaves-layer');
  const metContent = document.querySelector('.met-content');
  const rainControls = document.querySelector('.rain-controls');
  const windLeafGroups = {};
  ['left', 'center', 'right'].forEach(side => {
    const g = document.createElementNS(NS, 'g');
    g.classList.add('tree-wind-group', `tree-wind-${side}`);
    g.dataset.windSide = side;
    layer.appendChild(g);
    windLeafGroups[side] = g;
  });

  function windSideFor(x) {
    if (x < 215) return 'left';
    if (x > 285) return 'right';
    return 'center';
  }

  const GLOW_RADIUS = 18;
  const CELL_SIZE = GLOW_RADIUS;
  const SHADES = ['#1a4f24', '#226830', '#2a7a38', '#1e5c2c', '#328f44', '#174020'];

  const clusters = [
    { cx: 250, cy: 255, spreadX: 100, spreadY: 88, n: 140 },
    { cx: 250, cy: 215, spreadX: 55, spreadY: 48, n: 45 },
    { cx: 168, cy: 330, spreadX: 72, spreadY: 58, n: 85 },
    { cx: 332, cy: 330, spreadX: 72, spreadY: 58, n: 85 },
    { cx: 118, cy: 368, spreadX: 42, spreadY: 36, n: 40 },
    { cx: 382, cy: 368, spreadX: 42, spreadY: 36, n: 40 },
    { cx: 200, cy: 285, spreadX: 45, spreadY: 40, n: 35 },
    { cx: 300, cy: 285, spreadX: 45, spreadY: 40, n: 35 },
  ];

  const leafRegistry = [];
  const clusterPoints = clusters.map(() => []);
  const hitZones = [];
  const leafGrid = new Map();
  let litLeaves = new Set();
  let activeLeaf = null;
  let targetGlow = null;
  let currentGlow = null;
  let glowTrail = [];
  let glowFrame = 0;

  function leafShape(size) {
    const w = size * 0.42;
    const h = size * 1.05;
    return `M 0 0 C ${-w} ${-h * 0.55} ${-w * 0.85} ${-h} 0 ${-h} C ${w * 0.85} ${-h} ${w} ${-h * 0.55} 0 0`;
  }

  function addLeaf(x, y, size, rotation, shade, clusterIndex = -1) {
    const g = document.createElementNS(NS, 'g');
    g.classList.add('leaf');
    g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rotation.toFixed(1)})`);
    g.dataset.x = x;
    g.dataset.y = y;

    const body = document.createElementNS(NS, 'path');
    body.classList.add('leaf-body');
    body.setAttribute('d', leafShape(size));
    body.setAttribute('fill', shade);

    const vein = document.createElementNS(NS, 'path');
    vein.classList.add('leaf-vein');
    vein.setAttribute('d', `M 0 0 Q ${size * 0.06} ${-size * 0.5} 0 ${-size * 0.95}`);
    vein.setAttribute('fill', 'none');
    vein.setAttribute('stroke', 'rgba(12,40,18,0.45)');
    vein.setAttribute('stroke-width', '0.35');
    vein.setAttribute('stroke-linecap', 'round');

    g.appendChild(body);
    g.appendChild(vein);
    windLeafGroups[windSideFor(x)].appendChild(g);
    leafRegistry.push({ el: g, x, y });
    if (clusterIndex >= 0) clusterPoints[clusterIndex].push({ x, y });
  }

  function cross(o, a, b) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }

  function convexHull(points) {
    if (points.length <= 3) return points;
    const sorted = [...points].sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);
    const lower = [];
    sorted.forEach(p => {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
      lower.push(p);
    });
    const upper = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      const p = sorted[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
      upper.push(p);
    }
    return lower.slice(0, -1).concat(upper.slice(0, -1));
  }

  function inflateHull(hull, cluster, amount = 18) {
    return hull.map(p => {
      const dx = p.x - cluster.cx;
      const dy = p.y - cluster.cy;
      const len = Math.hypot(dx, dy) || 1;
      return {
        x: p.x + (dx / len) * amount,
        y: p.y + (dy / len) * amount
      };
    });
  }

  function createHitZone(cluster, points) {
    const hull = inflateHull(convexHull(points), cluster);
    if (hull.length < 3) return;
    const polygon = document.createElementNS(NS, 'polygon');
    polygon.classList.add('leaf-hit-zone');
    polygon.setAttribute('points', hull.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
    windLeafGroups[windSideFor(cluster.cx)].appendChild(polygon);
    hitZones.push(hull);
  }

  function pointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersects = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / ((yj - yi) || 1) + xi);
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function pointInAnyHitZone(point) {
    return hitZones.some(zone => pointInPolygon(point, zone));
  }

  function gridKey(gx, gy) {
    return `${gx},${gy}`;
  }

  function indexLeaf(leaf) {
    const gx = Math.floor(leaf.x / CELL_SIZE);
    const gy = Math.floor(leaf.y / CELL_SIZE);
    const key = gridKey(gx, gy);
    if (!leafGrid.has(key)) leafGrid.set(key, []);
    leafGrid.get(key).push(leaf);
  }

  function getNearbyLeaves(cx, cy) {
    const gx = Math.floor(cx / CELL_SIZE);
    const gy = Math.floor(cy / CELL_SIZE);
    const nearby = [];
    for (let y = gy - 1; y <= gy + 1; y++) {
      for (let x = gx - 1; x <= gx + 1; x++) {
        const bucket = leafGrid.get(gridKey(x, y));
        if (bucket) nearby.push(...bucket);
      }
    }
    return nearby;
  }

  clusters.forEach((c, clusterIndex) => {
    let placed = 0;
    let attempts = 0;
    while (placed < c.n && attempts < c.n * 4) {
      attempts++;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random());
      const x = c.cx + Math.cos(angle) * r * c.spreadX;
      const y = c.cy + Math.sin(angle) * r * c.spreadY;
      if (y > 468 || (y > 430 && Math.abs(x - 250) < 35)) continue;
      const size = 4 + Math.random() * 4.5;
      const rot = (Math.random() - 0.5) * 110 + (x < 250 ? -15 : 15);
      addLeaf(x, y, size, rot, SHADES[Math.floor(Math.random() * SHADES.length)], clusterIndex);
      placed++;
    }
  });

  const branchTips = [
    [108,282],[148,328],[188,388],[118,382],[172,422],
    [392,282],[352,328],[312,388],[382,382],[328,422],
    [228,242],[244,328],[250,255]
  ];
  branchTips.forEach(([bx, by]) => {
    for (let i = 0; i < 12; i++) {
      const x = bx + (Math.random() - 0.5) * 28;
      const y = by + (Math.random() - 0.5) * 24;
      addLeaf(x, y, 3.5 + Math.random() * 3, Math.random() * 360 - 180, SHADES[i % SHADES.length]);
    }
  });
  leafRegistry.forEach(indexLeaf);
  clusters.forEach((cluster, i) => createHitZone(cluster, clusterPoints[i]));

  function svgPointFromEvent(e) {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function addTrailPoint(cx, cy) {
    const last = glowTrail[glowTrail.length - 1];
    if (!last || Math.hypot(cx - last.x, cy - last.y) > 4) {
      glowTrail.push({ x: cx, y: cy, age: 0 });
      if (glowTrail.length > 8) glowTrail.shift();
    }
  }

  function setGlowTrail() {
    const r2 = GLOW_RADIUS * GLOW_RADIUS;
    const nextLit = new Set();

    glowTrail.forEach((point, index) => {
      const ageFactor = Math.max(0.25, 1 - point.age);
      const orderFactor = 0.45 + ((index + 1) / glowTrail.length) * 0.55;
      const radius = GLOW_RADIUS * ageFactor * orderFactor;
      const rr = radius * radius;

      getNearbyLeaves(point.x, point.y).forEach(({ el, x, y }) => {
        const dx = x - point.x, dy = y - point.y;
        if (dx * dx + dy * dy <= rr) nextLit.add(el);
      });
    });

    litLeaves.forEach(el => {
      if (!nextLit.has(el)) el.classList.remove('lit');
    });
    nextLit.forEach(el => {
      if (!litLeaves.has(el)) el.classList.add('lit');
    });

    litLeaves = nextLit;
  }

  function animateGlow() {
    if (!targetGlow || !currentGlow) {
      glowFrame = 0;
      return;
    }

    currentGlow.x += (targetGlow.x - currentGlow.x) * 0.1;
    currentGlow.y += (targetGlow.y - currentGlow.y) * 0.1;
    addTrailPoint(currentGlow.x, currentGlow.y);
    glowTrail.forEach(p => { p.age += 0.035; });
    glowTrail = glowTrail.filter(p => p.age < 1);
    setGlowTrail();

    const dx = targetGlow.x - currentGlow.x;
    const dy = targetGlow.y - currentGlow.y;
    if (dx * dx + dy * dy > 0.2 || glowTrail.length > 1) {
      glowFrame = requestAnimationFrame(animateGlow);
    } else {
      currentGlow = { ...targetGlow };
      addTrailPoint(currentGlow.x, currentGlow.y);
      setGlowTrail();
      glowFrame = 0;
    }
  }

  function scheduleGlow(cx, cy) {
    targetGlow = { x: cx, y: cy };
    if (!currentGlow) currentGlow = { ...targetGlow };
    if (glowFrame) return;
    glowFrame = requestAnimationFrame(animateGlow);
  }

  function clearGlow() {
    activeLeaf = null;
    targetGlow = null;
    currentGlow = null;
    glowTrail = [];
    if (glowFrame) {
      cancelAnimationFrame(glowFrame);
      glowFrame = 0;
    }
    litLeaves.forEach(el => el.classList.remove('lit'));
    litLeaves = new Set();
  }

  layer.addEventListener('pointermove', e => {
    const zone = e.target.closest('.leaf-hit-zone');
    if (!zone) return;
    activeLeaf = null;
    const pt = svgPointFromEvent(e);
    scheduleGlow(pt.x, pt.y);
  });

  layer.addEventListener('mouseover', e => {
    const leaf = e.target.closest('.leaf');
    if (!leaf) return;
    if (leaf === activeLeaf) return;
    activeLeaf = leaf;
    scheduleGlow(+leaf.dataset.x, +leaf.dataset.y);
  });
  layer.addEventListener('mouseleave', clearGlow);

  function routeOverlayPointer(e) {
    const pt = svgPointFromEvent(e);
    if (pointInAnyHitZone(pt)) {
      activeLeaf = null;
      scheduleGlow(pt.x, pt.y);
    } else {
      clearGlow();
    }
  }

  [metContent, rainControls].filter(Boolean).forEach(el => {
    el.addEventListener('pointermove', routeOverlayPointer);
    el.addEventListener('mouseleave', clearGlow);
  });

  svg.addEventListener('mouseleave', clearGlow);
})();

// ─── TREE RAIN CANVAS ──────────────────────────────────────────────────────
(function initTreeRain() {
  const canvas = document.getElementById('tree-rain-canvas');
  const svg = document.getElementById('tree-svg');
  if (!canvas || !svg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  const metOffice = document.getElementById('met-office');
  const treeContainer = document.querySelector('.tree-container');
  const metBadge = document.querySelector('.met-badge');
  const rainControls = document.querySelector('.rain-controls');
  const rainInput = document.getElementById('raininess');
  const rainOutput = document.getElementById('raininess-value');
  const windInput = document.getElementById('windiness');
  const windOutput = document.getElementById('windiness-value');
  const sunInput = document.getElementById('sunniness');
  const sunOutput = document.getElementById('sunniness-value');
  let W = 0, H = 0, scale = 1, ox = 0, oy = 0;
  let raininess = rainInput ? Number(rainInput.value) : 60;
  let windiness = windInput ? Number(windInput.value) : 60;
  let sunniness = sunInput ? Number(sunInput.value) : 0;
  let manualSunOverride = false;
  let sunScrollFrame = 0;
  let rainWind = 1;
  const WIND_STRENGTH_AT_FULL = 30; // 100% windiness → 2× previous peak (was /60)
  let currentWindStrength = windiness / WIND_STRENGTH_AT_FULL;
  let targetWindStrength = currentWindStrength;
  let windTweenFrame = 0;
  const MAX_RAIN = 125;
  const rain = [];
  const splashes = [];
  const drips = [];
  const canopy = [
    { cx: 250, cy: 255, rx: 118, ry: 96 },
    { cx: 168, cy: 330, rx: 88,  ry: 68 },
    { cx: 332, cy: 330, rx: 88,  ry: 68 },
    { cx: 118, cy: 368, rx: 58,  ry: 46 },
    { cx: 382, cy: 368, rx: 58,  ry: 46 },
    { cx: 200, cy: 285, rx: 62,  ry: 52 },
    { cx: 300, cy: 285, rx: 62,  ry: 52 },
  ];

  function resizeRain() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(W / 500, H / 600);
    ox = (W - 500 * scale) / 2;
    oy = (H - 600 * scale) / 2;
  }

  function toSvgPoint(x, y) {
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function toCanvasPoint(x, y) {
    return { x: ox + x * scale, y: oy + y * scale };
  }

  function canopyHit(x, y) {
    for (const c of canopy) {
      const nx = (x - c.cx) / c.rx;
      const ny = (y - c.cy) / c.ry;
      if (nx * nx + ny * ny <= 1) {
        return { canopy: c, nx, ny };
      }
    }
    return null;
  }

  function getElementRainBoxes() {
    const canvasRect = canvas.getBoundingClientRect();
    return [metBadge, rainControls]
      .filter(Boolean)
      .map(el => {
        const rect = el.getBoundingClientRect();
        return {
          left: rect.left - canvasRect.left,
          right: rect.right - canvasRect.left,
          top: rect.top - canvasRect.top,
          bottom: rect.bottom - canvasRect.top,
        };
      })
      .filter(box => (
        box.right > 0 &&
        box.left < W &&
        box.bottom > 0 &&
        box.top < H
      ));
  }

  function boxRainHit(prevX, prevY, d, boxes) {
    for (const box of boxes) {
      const crossesTop = prevY <= box.top && d.y >= box.top;
      if (!crossesTop) continue;

      const t = (box.top - prevY) / Math.max(d.y - prevY, 0.001);
      const xAtTop = prevX + (d.x - prevX) * t;
      const edgePad = 5;

      if (xAtTop >= box.left - edgePad && xAtTop <= box.right + edgePad) {
        const center = (box.left + box.right) / 2;
        const halfWidth = Math.max((box.right - box.left) / 2, 1);
        return {
          x: xAtTop,
          y: box.top,
          nx: clamp((xAtTop - center) / halfWidth, -1, 1),
          ny: -1,
        };
      }
    }

    return null;
  }

  function resetDrop(d) {
    d.x = Math.random() * W;
    d.y = -40 - Math.random() * H * 0.35;
    d.vx = -rainWind + Math.random() * 0.45;
    d.vy = 7 + Math.random() * 5.5;
    d.len = 12 + Math.random() * 18;
    d.alpha = 0.18 + Math.random() * 0.22;
  }

  function makeRain(count) {
    const target = Math.max(0, Math.round(count));
    while (rain.length > target) rain.pop();
    for (let i = rain.length; i < target; i++) {
      const d = {};
      resetDrop(d);
      d.y = Math.random() * H;
      rain.push(d);
    }
  }

  function setRaininess(value) {
    raininess = Number(value);
    if (rainOutput) rainOutput.value = `${raininess}%`;
    makeRain((raininess / 100) * MAX_RAIN);
    canvas.style.opacity = (0.18 + (raininess / 100) * 0.52).toFixed(2);
  }

  if (rainInput) {
    rainInput.addEventListener('input', () => setRaininess(rainInput.value));
  }

  function applyWindStrength(strength) {
    rainWind = 0.25 + strength * 0.75;
    if (!treeContainer) return;

    const ampBySide = { left: 1.14, center: 1, right: 1.14, trunk: 0.55 };
    treeContainer.style.setProperty('--wind-rot-a', `${(-0.22 * strength).toFixed(3)}deg`);
    treeContainer.style.setProperty('--wind-rot-b', `${(0.62 * strength).toFixed(3)}deg`);
    treeContainer.style.setProperty('--wind-x-a', `${(-2 * strength).toFixed(2)}px`);
    treeContainer.style.setProperty('--wind-x-b', `${(5 * strength).toFixed(2)}px`);
    treeContainer.style.setProperty('--wind-glow-scale-a', (1 - 0.005 * strength).toFixed(4));
    treeContainer.style.setProperty('--wind-glow-scale-b', (1 + 0.015 * strength).toFixed(4));

    treeContainer.querySelectorAll('.tree-wind-group').forEach(group => {
      const amp = ampBySide[group.dataset.windSide] || 1;
      const s = strength * amp;
      group.style.setProperty('--wind-rot-a', `${(-0.22 * s).toFixed(3)}deg`);
      group.style.setProperty('--wind-rot-b', `${(0.62 * s).toFixed(3)}deg`);
      group.style.setProperty('--wind-x-a', `${(-2 * s).toFixed(2)}px`);
      group.style.setProperty('--wind-x-b', `${(5 * s).toFixed(2)}px`);
    });
  }

  function tweenWindStrength() {
    currentWindStrength += (targetWindStrength - currentWindStrength) * 0.12;
    applyWindStrength(currentWindStrength);

    if (Math.abs(targetWindStrength - currentWindStrength) > 0.003) {
      windTweenFrame = requestAnimationFrame(tweenWindStrength);
    } else {
      currentWindStrength = targetWindStrength;
      applyWindStrength(currentWindStrength);
      windTweenFrame = 0;
    }
  }

  function setWindiness(value) {
    windiness = Number(value);
    targetWindStrength = windiness / WIND_STRENGTH_AT_FULL;
    if (windOutput) windOutput.value = `${windiness}%`;
    if (!windTweenFrame) windTweenFrame = requestAnimationFrame(tweenWindStrength);
  }

  if (windInput) {
    windInput.addEventListener('input', () => setWindiness(windInput.value));
  }

  function setSunniness(value, syncControl = false) {
    sunniness = Number(value);
    const t = sunniness / 100;
    if (syncControl && sunInput) sunInput.value = String(Math.round(sunniness));
    if (sunOutput) sunOutput.value = `${sunniness}%`;
    if (treeContainer) {
      treeContainer.style.setProperty('--sun-opacity', (0.03 + t * 0.72).toFixed(2));
      treeContainer.style.setProperty('--sun-scale', (0.78 + t * 0.45).toFixed(3));
      treeContainer.style.setProperty('--sun-wash-opacity', (t * 0.2).toFixed(2));
      treeContainer.style.setProperty('--sun-ray-speed', `${(42 - t * 26).toFixed(1)}s`);
    }
    if (metOffice) {
      metOffice.style.setProperty('--met-sunlight-opacity', (0.03 + t * 0.25).toFixed(2));
    }
  }

  if (sunInput) {
    sunInput.addEventListener('input', () => {
      manualSunOverride = true;
      setSunniness(sunInput.value);
    });
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function getSectionSunProgress() {
    if (!metOffice) return 0;
    const minSun = 25;
    const maxSun = 75;
    const rect = metOffice.getBoundingClientRect();
    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    const viewportMid = viewportH / 2;
    const progress = clamp((viewportMid - rect.top) / Math.max(rect.height, 1), 0, 1);
    const midpointPeak = 1 - Math.abs(progress - 0.5) * 2;
    return (minSun + midpointPeak * (maxSun - minSun)) / 100;
  }

  function updateSunFromScroll() {
    sunScrollFrame = 0;
    if (manualSunOverride) return;
    setSunniness(Math.round(getSectionSunProgress() * 100), true);
  }

  function scheduleSunScrollUpdate() {
    if (manualSunOverride || sunScrollFrame) return;
    sunScrollFrame = requestAnimationFrame(updateSunFromScroll);
  }

  function spawnSplash(x, y, hit) {
    for (let i = 0; i < 3; i++) {
      splashes.push({
        x, y,
        vx: (-1.8 + Math.random() * 3.6) + hit.nx * 1.5,
        vy: -1.2 - Math.random() * 1.6,
        life: 16 + Math.random() * 10,
        maxLife: 26,
      });
    }
    if (Math.random() < 0.35) {
      drips.push({
        x, y,
        vx: hit.nx * (0.8 + Math.random() * 0.7),
        vy: 1.2 + Math.random() * 1.4,
        life: 32 + Math.random() * 22,
        maxLife: 54,
      });
    }
  }

  function updateRain() {
    const elementBoxes = getElementRainBoxes();
    rain.forEach(d => {
      const prevX = d.x;
      const prevY = d.y;
      d.x += d.vx;
      d.y += d.vy;
      const p = toSvgPoint(d.x, d.y);
      const hit = canopyHit(p.x, p.y);
      const boxHit = d.vy > 0 ? boxRainHit(prevX, prevY, d, elementBoxes) : null;
      if (boxHit) {
        spawnSplash(boxHit.x, boxHit.y, boxHit);
        resetDrop(d);
      } else if (hit && d.vy > 0) {
        spawnSplash(d.x, d.y, hit);
        resetDrop(d);
      } else if (d.y > H + 60 || d.x < -80) {
        resetDrop(d);
      }
    });

    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i];
      s.x += s.vx; s.y += s.vy;
      s.vy += 0.12;
      s.life--;
      if (s.life <= 0) splashes.splice(i, 1);
    }
    for (let i = drips.length - 1; i >= 0; i--) {
      const d = drips[i];
      d.x += d.vx; d.y += d.vy;
      d.vy += 0.045;
      d.life--;
      if (d.life <= 0) drips.splice(i, 1);
    }
  }

  function drawRain() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';

    rain.forEach(d => {
      ctx.strokeStyle = `rgba(160,220,255,${d.alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.vx * 1.8, d.y - d.len);
      ctx.stroke();
    });

    splashes.forEach(s => {
      const a = Math.max(0, s.life / s.maxLife) * 0.4;
      ctx.strokeStyle = `rgba(170,235,255,${a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 2.5, s.y - s.vy * 2.5);
      ctx.stroke();
    });

    drips.forEach(d => {
      const a = Math.max(0, d.life / d.maxLife) * 0.42;
      ctx.fillStyle = `rgba(160,235,255,${a})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function loop() {
    updateRain();
    drawRain();
    requestAnimationFrame(loop);
  }

  resizeRain();
  setWindiness(windiness);
  setSunniness(0, true);
  setRaininess(raininess);
  updateSunFromScroll();
  window.addEventListener('scroll', scheduleSunScrollUpdate, { passive: true });
  window.addEventListener('resize', () => {
    resizeRain();
    setRaininess(raininess);
    scheduleSunScrollUpdate();
  });
  loop();
})();

// ─── TRACK CANVAS ─────────────────────────────────────────────────────────
const canvas = document.getElementById('track-canvas');
const ctx    = canvas.getContext('2d');
let W, H;

function resize() {
  W = canvas.width  = canvas.offsetWidth;
  H = canvas.height = canvas.offsetHeight;
}
resize();
window.addEventListener('resize', resize);

// Oval track
function trackPath(ctx) {
  const cx = W/2, cy = H/2;
  const rx = W * 0.42, ry = H * 0.38;
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2);
}

// Cars
const CARS = [
  { t: 0,    speed: 0.0028, color: '#ff2233', trail: [] },
  { t: 0.33, speed: 0.0024, color: '#00ffc8', trail: [] },
  { t: 0.66, speed: 0.0021, color: '#ffe033', trail: [] },
];

function getPos(t) {
  const cx = W/2, cy = H/2;
  const rx = W * 0.42, ry = H * 0.38;
  const a = t * Math.PI * 2;
  return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
}

let lapCount = 0;
let lastLap  = 0;

function drawTrack() {
  ctx.clearRect(0, 0, W, H);

  // track surface
  ctx.save();
  ctx.beginPath(); trackPath(ctx);
  ctx.lineWidth = 48; ctx.strokeStyle = '#111820';
  ctx.stroke();
  ctx.restore();

  // track edge glow
  ctx.save();
  ctx.beginPath(); trackPath(ctx);
  ctx.lineWidth = 50;
  ctx.strokeStyle = 'rgba(255,224,51,0.05)';
  ctx.stroke();
  ctx.restore();

  // centre line dashes
  ctx.save();
  ctx.beginPath(); trackPath(ctx);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.setLineDash([12, 18]);
  ctx.stroke();
  ctx.restore();

  // start/finish line
  const sf = getPos(0);
  ctx.save();
  ctx.translate(sf.x, sf.y);
  ctx.rotate(Math.PI / 2);
  const finishTrackWidth = 48;
  const finishStripeWidth = 10;
  const finishSquare = 5;
  for (let row = 0; row < finishStripeWidth / finishSquare; row++) {
    for (let col = 0; col < finishTrackWidth / finishSquare; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? '#fff' : '#000';
      ctx.fillRect(
        -finishStripeWidth / 2 + row * finishSquare,
        -finishTrackWidth / 2 + col * finishSquare,
        finishSquare,
        finishSquare
      );
    }
  }
  ctx.restore();

  // cars + trails
  CARS.forEach(car => {
    // trail
    car.trail.forEach((p, i) => {
      const a = i / car.trail.length;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI*2);
      ctx.fillStyle = car.color + Math.floor(a * 80).toString(16).padStart(2,'0');
      ctx.fill();
    });

    // car body
    const pos = getPos(car.t);
    const angle = car.t * Math.PI * 2 + Math.PI/2;
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angle);
    // glow
    ctx.shadowColor = car.color;
    ctx.shadowBlur  = 18;
    ctx.fillStyle = car.color;
    ctx.fillRect(-4, -7, 8, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(-2.5, -7, 5, 3);
    ctx.restore();
  });
}

function animTrack() {
  CARS.forEach(car => {
    car.t = (car.t + car.speed) % 1;
    const pos = getPos(car.t);
    car.trail.push({ x: pos.x, y: pos.y });
    if (car.trail.length > 28) car.trail.shift();
  });

  // count laps (first car)
  if (CARS[0].t < lastLap - 0.5) lapCount++;
  lastLap = CARS[0].t;

  drawTrack();
  requestAnimationFrame(animTrack);
}
animTrack();

// ─── SPEED LINES ──────────────────────────────────────────────────────────
const slContainer = document.getElementById('speedLines');
for (let i = 0; i < 6; i++) {
  const line = document.createElement('div');
  line.className = 'speed-line';
  const top  = 10 + Math.random() * 80;
  const w    = 80 + Math.random() * 200;
  const delay= Math.random() * 3;
  const dur  = 1 + Math.random() * 1.2;
  line.style.cssText = `top:${top}%; width:${w}px; animation-delay:${delay}s; animation-duration:${dur}s;`;
  slContainer.appendChild(line);
}

// ─── COLLISION SIMULATION ─────────────────────────────────────────────────
(function initCollisionAnim() {
  const canvas = document.getElementById('collision-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const speedInput = document.getElementById('vehicle-a-speed');
  const speedOutput = document.getElementById('vehicle-a-speed-value');
  const resetBtn = document.getElementById('collision-reset');
  let CW = 0, CH = 0;

  function resizeCollision() {
    CW = canvas.width  = canvas.offsetWidth;
    CH = canvas.height = canvas.offsetHeight;
  }
  resizeCollision();
  window.addEventListener('resize', resizeCollision);

  const CAR = { len: 44, wid: 20 };
  const FRICTION = 0.975;
  const ANG_FRICTION = 0.945;
  const RESTITUTION = 0.88;

  let cars = [];
  let sparks = [];
  let skidMarks = [];
  let phase = 'approach';
  let timer = 0;
  let impactDone = false;
  let vehicleASpeed = speedInput ? Number(speedInput.value) : 3.0;

  function syncVehicleASpeed() {
    if (speedOutput) speedOutput.value = vehicleASpeed.toFixed(1);
    if (cars[0] && phase === 'approach') cars[0].vx = vehicleASpeed;
  }

  if (speedInput) {
    speedInput.addEventListener('input', () => {
      vehicleASpeed = Number(speedInput.value);
      syncVehicleASpeed();
    });
  }

  function reset() {
    cars = [
      { x: 60, y: CH/2 - 5, vx: vehicleASpeed, vy: 0, a: 0, w: 0, color: '#00ffc8', accent: '#0a4035' },
      { x: CW * 0.62, y: CH/2 + 5, vx: 0, vy: 0, a: 0, w: 0, color: '#ffe033', accent: '#4a3a05' }
    ];
    sparks = [];
    skidMarks = [];
    phase = 'approach';
    timer = 0;
    impactDone = false;
    syncVehicleASpeed();
  }

  if (resetBtn) resetBtn.addEventListener('click', reset);

  function drawRoad() {
    ctx.fillStyle = '#080d12';
    ctx.fillRect(0, 0, CW, CH);

    const roadTop = CH * 0.18;
    const roadBot = CH * 0.82;
    const lane    = CH / 2;

    ctx.strokeStyle = 'rgba(0,255,200,0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, roadTop); ctx.lineTo(CW, roadTop);
    ctx.moveTo(0, roadBot); ctx.lineTo(CW, roadBot);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.setLineDash([14, 18]);
    ctx.beginPath();
    ctx.moveTo(0, lane); ctx.lineTo(CW, lane);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawCar(car) {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.a);

    ctx.shadowColor = car.color;
    ctx.shadowBlur = 14;
    ctx.fillStyle = car.color;
    ctx.fillRect(-CAR.len/2, -CAR.wid/2, CAR.len, CAR.wid);
    ctx.shadowBlur = 0;

    // windshield (forward edge)
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(CAR.len/2 - 13, -CAR.wid/2 + 3, 5, CAR.wid - 6);

    // rear window
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-CAR.len/2 + 6, -CAR.wid/2 + 3, 5, CAR.wid - 6);

    // body outline
    ctx.strokeStyle = car.accent;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-CAR.len/2, -CAR.wid/2, CAR.len, CAR.wid);

    ctx.restore();
  }

  function drawSkid() {
    skidMarks.forEach(m => {
      ctx.globalAlpha = m.alpha;
      ctx.fillStyle = '#000';
      ctx.fillRect(m.x - 1, m.y - 1, 2, 2);
    });
    ctx.globalAlpha = 1;
  }

  function drawSparks() {
    sparks.forEach(s => {
      ctx.globalAlpha = Math.max(0, s.life / s.maxLife);
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function spawnSparks(x, y) {
    for (let i = 0; i < 28; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp  = 1 + Math.random() * 4.2;
      sparks.push({
        x, y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        r: 1 + Math.random() * 1.4,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        color: Math.random() < 0.55 ? '#ffaa33' : '#ffe033'
      });
    }
  }

  function checkCollision(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return (dx*dx + dy*dy) < (CAR.len * 0.62) * (CAR.len * 0.62);
  }

  function applyImpact(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    const va = a.vx * nx + a.vy * ny;
    const impulse = va * RESTITUTION;

    b.vx += nx * impulse;
    b.vy += ny * impulse;
    a.vx -= nx * impulse;
    a.vy -= ny * impulse;

    // off-centre hit → angular velocity
    const offset = a.y - b.y;
    b.w = -offset * 0.012;
    a.w = -offset * 0.005;

    // separate slightly to avoid sticking
    const overlap = (CAR.len * 0.62) - dist;
    if (overlap > 0) {
      a.x -= nx * overlap * 0.5;
      a.y -= ny * overlap * 0.5;
      b.x += nx * overlap * 0.5;
      b.y += ny * overlap * 0.5;
    }

    spawnSparks((a.x + b.x) / 2, (a.y + b.y) / 2);
  }

  function updateCar(car, idx) {
    car.x += car.vx;
    car.y += car.vy;
    car.a += car.w;

    const skipFriction = (phase === 'approach' && idx === 0);
    if (!skipFriction) {
      car.vx *= FRICTION;
      car.vy *= FRICTION;
      car.w  *= ANG_FRICTION;
    }

    const speed = Math.hypot(car.vx, car.vy);
    if (speed > 0.5 && phase === 'post_impact') {
      const halfLen = CAR.len * 0.36;
      const halfWid = CAR.wid * 0.5;
      const cos = Math.cos(car.a), sin = Math.sin(car.a);
      [[-halfLen,-halfWid],[-halfLen,halfWid],[halfLen,-halfWid],[halfLen,halfWid]].forEach(([wx,wy]) => {
        skidMarks.push({
          x: car.x + wx*cos - wy*sin,
          y: car.y + wx*sin + wy*cos,
          alpha: 0.55
        });
      });
    }
  }

  function updateSparks() {
    sparks = sparks.filter(s => {
      s.x += s.vx; s.y += s.vy;
      s.vx *= 0.9; s.vy *= 0.9;
      s.life--;
      return s.life > 0;
    });
  }

  function fadeSkid() {
    skidMarks.forEach(m => m.alpha *= 0.998);
    skidMarks = skidMarks.filter(m => m.alpha > 0.05);
  }

  function step() {
    cars.forEach(updateCar);

    if (!impactDone && checkCollision(cars[0], cars[1])) {
      applyImpact(cars[0], cars[1]);
      impactDone = true;
      phase = 'post_impact';
    }

    updateSparks();
    fadeSkid();

    if (phase === 'post_impact') {
      const settled = cars.every(c => Math.hypot(c.vx, c.vy) < 0.08 && Math.abs(c.w) < 0.005);
      if (settled) { phase = 'settle'; timer = 0; }
    }

    if (phase === 'settle') {
      timer++;
      if (timer > 10) reset();
    }

    cars.forEach(c => {
      if (c.x < -120 || c.x > CW + 120 || c.y < -120 || c.y > CH + 120) {
        if (phase !== 'reset') { phase = 'reset'; timer = 0; }
      }
    });
    if (phase === 'reset') {
      timer++;
      if (timer > 50) reset();
    }
  }

  function draw() {
    drawRoad();
    drawSkid();
    cars.forEach(drawCar);
    drawSparks();
  }

  function loop() {
    step();
    draw();
    requestAnimationFrame(loop);
  }

  reset();
  loop();
})();

// ─── CAFFEINE RECOMMENDER · LIVE FEEDBACK RE-RANK ─────────────────────────
(function initCaffeineAnim() {
  const canvas = document.getElementById('caffeine-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let CW = 0, CH = 0;

  function resizeCaff() {
    CW = canvas.width  = canvas.offsetWidth;
    CH = canvas.height = canvas.offsetHeight;
  }
  resizeCaff();
  window.addEventListener('resize', resizeCaff);

  const drinks = [
    { name: 'Cold Brew',  score: 0.84, target: 0.84, displayY: 0, rankY: 0 },
    { name: 'Espresso',   score: 0.78, target: 0.78, displayY: 1, rankY: 1 },
    { name: 'Matcha',     score: 0.72, target: 0.72, displayY: 2, rankY: 2 },
    { name: 'Green Tea',  score: 0.61, target: 0.61, displayY: 3, rankY: 3 },
    { name: 'Decaf',      score: 0.42, target: 0.42, displayY: 4, rankY: 4 }
  ];

  let feedback = null;
  let nextFb = 90;
  let totalFb = 0;

  function reorder() {
    const sorted = drinks.slice().sort((a, b) => b.target - a.target);
    sorted.forEach((d, i) => { d.rankY = i; });
  }

  function triggerFeedback() {
    const target = drinks[Math.floor(Math.random() * drinks.length)];
    const stars  = 1 + Math.floor(Math.random() * 5);
    const delta  = ((stars - 3) / 2) * 0.14;
    target.target = Math.max(0.05, Math.min(0.98, target.target + delta));
    feedback = { drink: target, stars, life: 90, maxLife: 90, delta };
    totalFb++;
  }

  function step() {
    drinks.forEach(d => {
      d.score    += (d.target - d.score) * 0.06;
      d.displayY += (d.rankY  - d.displayY) * 0.09;
    });
    if (feedback) { feedback.life--; if (feedback.life <= 0) feedback = null; }
    nextFb--;
    if (nextFb <= 0) {
      triggerFeedback();
      reorder();
      nextFb = 130 + Math.floor(Math.random() * 70);
    }
  }

  function draw() {
    ctx.fillStyle = '#080d12';
    ctx.fillRect(0, 0, CW, CH);

    const isMobile = CW < 560;
    const padX = isMobile ? 18 : 28;
    const padTop = isMobile ? 78 : 50;
    const padBot = 24;
    const rowAreaH = CH - padTop - padBot;
    const rowH = rowAreaH / drinks.length;
    const nameW = 108;
    const scoreW = 50;
    const barX = padX + nameW;
    const barMaxW = CW - barX - padX - scoreW;

    ctx.font = '10px "Space Mono", monospace';
    ctx.fillStyle = 'rgba(0,255,200,0.55)';
    ctx.textAlign = 'right';
    ctx.fillText(`FEEDBACK COLLECTED · ${totalFb.toString().padStart(3, '0')}`, CW - padX, isMobile ? 56 : 24);

    // grid vertical lines at 0 / 0.25 / 0.5 / 0.75 / 1
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    [0, 0.25, 0.5, 0.75, 1].forEach(t => {
      const x = barX + barMaxW * t;
      ctx.moveTo(x, padTop - 8);
      ctx.lineTo(x, padTop + rowAreaH);
    });
    ctx.stroke();

    // axis ticks
    ctx.font = '9px "Space Mono", monospace';
    ctx.fillStyle = 'rgba(160,180,195,0.4)';
    ctx.textAlign = 'center';
    [0, 0.5, 1].forEach(t => {
      ctx.fillText(t.toFixed(1), barX + barMaxW * t, padTop + rowAreaH + 14);
    });

    drinks.forEach(d => {
      const y = padTop + d.displayY * rowH + rowH / 2;

      // name
      ctx.font = '13px "DM Sans", sans-serif';
      ctx.fillStyle = '#c0d0db';
      ctx.textAlign = 'left';
      ctx.fillText(d.name, padX, y + 4);

      // bar background
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(barX, y - 8, barMaxW, 16);

      // bar fill
      const w = Math.max(0, Math.min(1, d.score)) * barMaxW;
      const grad = ctx.createLinearGradient(barX, 0, barX + barMaxW, 0);
      grad.addColorStop(0,   'rgba(255,140,0,0.85)');
      grad.addColorStop(0.6, 'rgba(255,200,80,0.85)');
      grad.addColorStop(1,   'rgba(0,255,200,0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(barX, y - 8, w, 16);

      // bar end indicator
      ctx.shadowColor = 'rgba(0,255,200,0.8)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(barX + w - 1.5, y - 9, 2, 18);
      ctx.shadowBlur = 0;

      // score value
      ctx.font = '12px "Space Mono", monospace';
      ctx.fillStyle = 'rgba(0,255,200,0.85)';
      ctx.textAlign = 'right';
      ctx.fillText(d.score.toFixed(2), CW - padX, y + 4);
    });

    // feedback pulse + stars
    if (feedback) {
      const alpha = Math.max(0, feedback.life / feedback.maxLife);
      const y = padTop + feedback.drink.displayY * rowH + rowH / 2;
      const w = Math.max(0, Math.min(1, feedback.drink.score)) * barMaxW;
      const pulseR = 4 + (1 - alpha) * 20;
      const isPos = feedback.delta > 0;

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = isPos ? '#4eff6a' : '#ff5566';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(barX + w, y, pulseR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = '11px "Space Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = isPos ? '#7dffa5' : '#ff8a99';
      const sign = isPos ? '+' : '−';
      const stars = '★'.repeat(feedback.stars) + '☆'.repeat(5 - feedback.stars);
      ctx.fillText(`${stars}  ${sign}${Math.abs(feedback.delta).toFixed(2)}`, barX, y - 14);
      ctx.globalAlpha = 1;
    }
  }

  function loop() { step(); draw(); requestAnimationFrame(loop); }
  loop();
})();

// ─── MOBILE NAV ────────────────────────────────────────────────────────────
(function initMobileNav() {
  const nav = document.querySelector('nav');
  const toggle = nav && nav.querySelector('.nav-toggle');
  if (!nav || !toggle) return;

  const setOpen = (open) => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
  nav.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => setOpen(false));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) setOpen(false);
  });
})();

// ─── CONTACT FORM ──────────────────────────────────────────────────────────
(function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = document.getElementById('cf-status');
  const btn = form.querySelector('.cf-submit');

  const setStatus = (msg, kind) => {
    status.textContent = msg;
    status.className = 'cf-status show' + (kind ? ' ' + kind : '');
  };

  const getRecaptchaToken = async () => {
    const key = form.dataset.recaptchaKey;
    if (!key || key === 'YOUR_RECAPTCHA_SITE_KEY' || !window.grecaptcha) return '';
    try {
      await new Promise(r => window.grecaptcha.ready(r));
      return await window.grecaptcha.execute(key, { action: 'submit' });
    } catch (e) {
      return '';
    }
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      setStatus('Please fill in every field', 'err');
      return;
    }

    btn.disabled = true;
    setStatus('Sending...', '');

    try {
      const fd = new FormData(form);
      const token = await getRecaptchaToken();
      if (token) fd.set('g-recaptcha-response', token);

      const res = await fetch(form.action, {
        method: 'POST',
        body: fd,
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        setStatus('✔ Message sent · I will get back to you soon', 'ok');
        form.reset();
      } else {
        const data = await res.json().catch(() => ({}));
        const msg = data.errors && data.errors[0] && data.errors[0].message
          ? data.errors[0].message
          : 'Could not send · please try again later';
        setStatus(msg, 'err');
      }
    } catch (err) {
      setStatus('Network error · please try again later', 'err');
    } finally {
      btn.disabled = false;
    }
  });
})();
