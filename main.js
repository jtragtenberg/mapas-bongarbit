// ===== 0) Paleta de cores por TAG ==========================================
const TAG_COLORS = {
  projeto_rumos     : "#5B2A86", // roxo_escuro
  projeto_funcultura: "#9D4EDD", // roxo_claro
  terreiro_xamba    : "#FF6EA7", // rosa
  moradores_xamba   : "#FFFFFF", // branco
  centro_cultural   : "#FDBA74", // laranja claro
  bongar            : "#D97706", // laranja escuro
  ere_sankofa       : "#FACC15", // laranja amarelado
  mixidinho         : "#FDE047", // amarelo
  pirao             : "#22C55E", // verde
  ori               : "#60A5FA", // azul_claro
};

function renderLegendTagColors() {
  const el = document.getElementById('legend');
  if (!el) return;
  el.innerHTML = "";
  Object.entries(TAG_COLORS).forEach(([key, col]) => {
    const chip = document.createElement('div');
    chip.className = "chip";

    const dot = document.createElement('span');
    dot.className = "dot";
    dot.style.background = col;

    const label = document.createElement('span');
    label.textContent = key;

    chip.appendChild(dot);
    chip.appendChild(label);
    el.appendChild(chip);
  });
}

// Prioridade visual para ordenar offsets quando há várias tags no mesmo par
const TAG_PRIORITY = {
  pirao: 0,
  projeto_rumos: 1, projeto_funcultura: 1,
  terreiro_xamba: 2, moradores_xamba: 2,
  centro_cultural: 3, bongar: 3, ere_sankofa: 3, mixidinho: 3, ori: 3,
  zarina: 4,
};

// ===== 1) Dados — agora aceita pesos (1–100) por tag =======================
// Você pode usar "weights" (recomendado) OU o formato antigo "tags".
// - Com "weights": { id, weights: { tag: numero(1..100), ... } }
// - Com "tags":    { id, tags: ["tagA","tagB"] } -> tratado como peso 100
const rawItems = [
  // --- exemplos usando PESOS explícitos:
  { id: "João Tragtenberg",             weights: { projeto_funcultura: 100, projeto_rumos: 100 } },
  { id: "Daniel Capivara",              weights: { projeto_funcultura: 20, projeto_rumos: 20, ere_sankofa: 50 } },
  { id: "Aline Sou",                    weights: { projeto_funcultura: 30, projeto_rumos: 20, ere_sankofa: 50 } },
  { id: "Miguel Mendes",                weights: { projeto_funcultura: 1 } },
  { id: "Laura Proto",                  weights: { projeto_funcultura: 1 } },
  { id: "Orun Santana",                 weights: { projeto_funcultura: 1 } },
  { id: "Iran Silva",                   weights: { bongar: 1 } },

  { id: "Laís",                         weights: { projeto_rumos: 60 } },
  { id: "Luanda",                       weights: { projeto_rumos: 60 } },

  { id: "Thúlio Xambá",                 weights: { projeto_funcultura: 100, projeto_rumos: 100, ori: 100, bongar: 100, centro_cultural: 100, ere_sankofa: 100 } },
  { id: "Memé Bongar",                  weights: { projeto_funcultura: 10, projeto_rumos: 90, terreiro_xamba: 30, ori: 100, bongar: 100 } },
  { id: "Beto Xambá",                   weights: { projeto_funcultura: 30, projeto_rumos: 80, terreiro_xamba: 50, ori: 100, bongar: 100 } },
  { id: "Tayna Xambá",                  weights: { projeto_funcultura: 90, projeto_rumos: 100, terreiro_xamba: 30, ori: 100, bongar: 20, pirao: 100 } },

  { id: "Henrique Bongar",              weights: { projeto_funcultura: 70, moradores_xamba: 50, terreiro_xamba: 10, bongar: 100, pirao: 100 } },
  { id: "Yngrid Bongar",                weights: { projeto_funcultura: 50, moradores_xamba: 50, terreiro_xamba: 50, bongar: 100, pirao: 100 } },
  { id: "Laurinha da Xambá",            weights: { projeto_funcultura: 10, moradores_xamba: 50, terreiro_xamba: 50, bongar: 100, pirao: 100 } },

  { id: "Ninho Brown",                  weights: { projeto_funcultura: 100, moradores_xamba: 50, terreiro_xamba: 50, ere_sankofa: 100 } },
  { id: "Rodrigo Zarina",               weights: { projeto_funcultura: 60, moradores_xamba: 50, ere_sankofa: 100 } },
  
  { id: "Tarta de Melo",                weights: { projeto_funcultura: 80, ere_sankofa: 80 } },
  { id: "Jota",                         weights: { projeto_funcultura: 100, projeto_rumos: 60, ere_sankofa: 100 } },
  { id: "Vitor da Bomba do Hemetério",  weights: { projeto_funcultura: 30, ere_sankofa: 40 } },
  
  { id: "Rauzinho",                     weights: { projeto_funcultura: 40, moradores_xamba: 50, terreiro_xamba: 50 } },
  { id: "Yaçanã",                       weights: { projeto_funcultura: 20, moradores_xamba: 50, terreiro_xamba: 50 } },

  { id: "Joãozinho da Xambá",           weights: { projeto_funcultura: 60, moradores_xamba: 50, terreiro_xamba: 40, projeto_rumos: 40, ere_sankofa: 70 } },
  { id: "Ivson",                        weights: { projeto_funcultura: 60, moradores_xamba: 50, terreiro_xamba: 50 } },
  { id: "Cauê",                         weights: { projeto_funcultura: 60, moradores_xamba: 50, terreiro_xamba: 50 } },

  { id: "Marileide",                    weights: { terreiro_xamba: 50, bongar: 100, centro_cultural: 100 } },
  { id: "Gogó",                         weights: { moradores_xamba: 50, terreiro_xamba: 50, centro_cultural: 60 } }
];

// ===== 2) Helpers ==========================================================
const toWeights = (item) => {
  // Converte "tags" -> weights=100, mantém "weights" se já existir
  if (item.weights && typeof item.weights === "object") {
    return { id: item.id, weights: { ...item.weights } };
  }
  const w = {};
  (item.tags || []).forEach(tag => { w[tag] = 100; });
  return { id: item.id, weights: w };
};

const commonTagsWithWeights = (wA, wB) => {
  // Retorna lista de { tag, a: pesoA, b: pesoB, mean: média }
  const out = [];
  for (const tag of Object.keys(wA)) {
    const a = wA[tag] || 0;
    const b = wB[tag] || 0;
    if (a > 0 && b > 0) out.push({ tag, a, b, mean: (a + b) / 2 });
  }
  return out;
};

// Normaliza os weights de um nó para frações (0..1), descartando zeros
function buildRingFractions(weights) {
  const entries = Object.entries(weights || {}).filter(([tag, v]) => v > 0);
  const total = entries.reduce((acc, [, v]) => acc + v, 0);
  if (!total) return [];
  // ordena opcional (pode tirar); aqui deixo menor→maior para anéis de dentro→fora
  return entries
    .sort((a, b) => (TAG_PRIORITY[a.tag] ?? 999) - (TAG_PRIORITY[b.tag] ?? 999))
    .map(([tag, v]) => ({
      tag,
      frac: v / total,
      color: TAG_COLORS[tag] || "#999999"
    }));
}

// Desenha anéis concêntricos com ESPESSURA proporcional ao weight (frac)
function drawNodeRings(p, n, R, opts = {}) {
  const slices = n._rings || [];
  if (slices.length === 0) {
    // fallback: nó cinza se não houver pesos
    p.noStroke(); p.fill("#c7c7c7"); p.circle(n.x, n.y, R * 2);
    return;
  }

  const innerPad = opts.innerPad ?? 0;  // “buraco” central opcional (px)
  const minPx    = opts.minPx ?? 1;     // espessura mínima de cada anel (px)

  const Rmin = Math.max(0, innerPad);
  const Rmax = R;
  const span = Math.max(0, Rmax - Rmin); // espessura total disponível

  // Agora espessura de cada anel = frac * span (linear), não por área
  let acc = 0; // soma de frações já desenhadas (0..1)
  for (const s of slices) {
    const r_i = Rmin + acc * span;
    const r_o = Rmin + (acc + s.frac) * span;

    let thick = Math.max(minPx, r_o - r_i); // largura radial do anel
    const rMid = r_i + thick / 2;           // raio no meio do anel

    p.noFill();
    p.stroke(s.color);
    p.strokeWeight(thick);
    p.circle(n.x, n.y, 2 * rMid);

    acc += s.frac;
  }

  // contorno sutil
  p.noFill(); p.stroke(0, 180); p.strokeWeight(1);
  p.circle(n.x, n.y, 2 * Rmax + 0.5);
}


// ===== 3) Construção do grafo (múltiplas arestas por tag em comum) =========
function buildGraph(items) {
  // 3.1 Dedup e normalização para weights
  const byId = new Map();
  for (const it of items) if (!byId.has(it.id)) byId.set(it.id, toWeights(it));
  const dedup = [...byId.values()];

  const nodes = dedup.map(d => ({
  id: d.id,
  weights: d.weights,          // já convertido antes por toWeights(...)
  label: "pessoa",
  color: "#c7c7c7",
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,

  // <<< novo: frações para os anéis concêntricos
  _rings: buildRingFractions(d.weights),
}));


  // 3.3 Arestas (uma por tag em comum), com espessura pela média dos pesos
  const links = [];
  for (let i = 0; i < dedup.length; i++) {
    for (let j = i + 1; j < dedup.length; j++) {
      const commons = commonTagsWithWeights(dedup[i].weights, dedup[j].weights);
      if (commons.length === 0) continue;

      // ordena por prioridade (apenas para offsets estáveis)
      commons.sort((A, B) => (TAG_PRIORITY[A.tag] ?? 999) - (TAG_PRIORITY[B.tag] ?? 999));

      const total = commons.length;
      commons.forEach((c, idx) => {
        const aff = Math.max(1, Math.min(100, c.mean));    // 1..100
        const affNorm = aff / 100;                         // 0..1

        links.push({
          source: dedup[i].id,
          target: dedup[j].id,
          tag: c.tag,
          color: TAG_COLORS[c.tag] || "#999",
          aff,               // média 1..100 (para espessura)
          affNorm,           // 0..1 (para física)
          _offsetIndex: idx,
          _offsetCount: total,
        });
      });
    }
  }

  // 3.4 Índice: links por tag (para mapa de densidade)
  const linksByTag = {};
  Object.keys(TAG_COLORS).forEach(k => (linksByTag[k] = []));
  for (const l of links) (linksByTag[l.tag] || (linksByTag[l.tag] = [])).push(l);

  return { nodes, links, linksByTag };
}

let { nodes, links, linksByTag } = buildGraph(rawItems);

// ===== 4) d3-force =========================================================
let simulation;
const clusterTargets = new Map();

function updateClusterTargets() {
  clusterTargets.set("all", { x: innerWidth / 2, y: innerHeight / 2 });
}

function forceCluster(alpha, k) {
  const t = clusterTargets.get("all");
  if (!t) return;
  nodes.forEach(n => {
    n.vx += (t.x - n.x) * k * alpha;
    n.vy += (t.y - n.y) * k * alpha;
  });
}

// Força extra de atração por afinidade (média dos pesos) em cada aresta
function forceAffinity(k = 0.15) {
  // k: ganho global (0.05..0.4 é um bom range)
  let L = links; // usa o array global de links

  function force(alpha) {
    const gain = k * alpha;
    for (const l of L) {
      const s = (typeof l.source === 'object') ? l.source : null;
      const t = (typeof l.target === 'object') ? l.target : null;
      if (!s || !t) continue;

      // vetor unitário s->t
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ux = dx / dist;
      const uy = dy / dist;

      // intensidade proporcional à afinidade média normalizada (0..1)
      const a = (l.affNorm ?? (l.aff ? l.aff/100 : 0.5));

      // aplica aceleração simétrica (puxa um ao outro)
      const ax = ux * a * gain;
      const ay = uy * a * gain;

      s.vx += ax;
      s.vy += ay;
      t.vx -= ax;
      t.vy -= ay;
    }
  }

  // API opcional para trocar links/ganho se precisar no futuro
  force.links = (_) => (L = _, force);
  force.strength = (_) => (k = +_, force);
  return force;
}

function makeSimulation() {
  updateClusterTargets();

  const link = d3.forceLink(links)
    .id(d => d.id)
    // distância/força variam com o vínculo médio (affNorm)
    .distance(d => 140 - d.affNorm * 80)           // mais vínculo -> mais perto
    .strength(d => 0.05 + d.affNorm * 0.5);        // mais vínculo -> mais forte

  const charge  = d3.forceManyBody().strength(+document.getElementById('charge').value);
  const collide = d3.forceCollide(+document.getElementById('collisionR').value);

  simulation = d3.forceSimulation(nodes)
    .force("link", link)
    .force("charge", charge)
    .force("center", d3.forceCenter(innerWidth / 2, innerHeight / 2))
    .force("collide", collide)
    .alphaDecay(0.03)
    .velocityDecay(0.3)
    .on("tick", () => { /* p5 desenha no draw() */ });

  simulation.alpha(1).restart();
}
// function makeSimulation() {
//   updateClusterTargets();

//   // 1) deixe distância e força dependerem mais de affNorm (0..1)
//   const link = d3.forceLink(links)
//     .id(d => d.id)
//     // mais vínculo -> mais perto (clamp para evitar distância negativa)
//     .distance(d => {
//       const a = d.affNorm ?? (d.aff ? d.aff/100 : 0.5);
//       const base = 160, span = 110;         // ajuste fino aqui
//       return Math.max(20, base - a * span); // 20..160 px
//     })
//     // mais vínculo -> link mais “duro”
//     .strength(d => {
//       const a = d.affNorm ?? (d.aff ? d.aff/100 : 0.5);
//       // curva levemente exponencial pra destacar vínculos altos
//       const g = Math.pow(a, 1.2);
//       return 0.05 + g * 0.7; // 0.05..0.75
//     });

//   const charge  = d3.forceManyBody().strength(+document.getElementById('charge').value);
//   const collide = d3.forceCollide(+document.getElementById('collisionR').value);

//   // 2) adiciona a força personalizada de afinidade (puxa ao longo da aresta)
//   const affinity = forceAffinity(0.22); // ↑/↓ para mais/menos atração extra

//   simulation = d3.forceSimulation(nodes)
//     .force("link", link)
//     .force("charge", charge)
//     .force("affinity", affinity) // << AQUI
//     .force("center", d3.forceCenter(window.innerWidth/2, window.innerHeight/2))
//     .force("collide", collide)
//     .alphaDecay(0.03)
//     .velocityDecay(0.3)
//     .on("tick", () => { /* p5 desenha no draw() */ });

//   simulation.alpha(1).restart();
// }

// ===== 5) UI ===============================================================
function setupUIBindings() {
  const clusterKEl = document.getElementById('clusterK');
  const chargeEl   = document.getElementById('charge');
  const collEl     = document.getElementById('collisionR');
  const toggleBtn  = document.getElementById('toggle');
  const coolBtn    = document.getElementById('cool');
  const reheatBtn  = document.getElementById('reheat');

  if (chargeEl) chargeEl.addEventListener('input', () => {
    simulation.force("charge").strength(+chargeEl.value);
    simulation.alpha(0.3).restart();
  });
  if (collEl) collEl.addEventListener('input', () => {
    simulation.force("collide").radius(+collEl.value);
    simulation.alpha(0.3).restart();
  });
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (simulation && simulation.alpha() > 0) {
        simulation.stop(); toggleBtn.textContent = "Retomar";
      } else {
        simulation.alpha(0.3).restart(); toggleBtn.textContent = "Pausar";
      }
    });
  }
  if (coolBtn) coolBtn.addEventListener('click', () => simulation.alpha(0));
  if (reheatBtn) reheatBtn.addEventListener('click', () => simulation.alpha(0.6).restart());

  window.getClusterGain = () => clusterKEl ? +clusterKEl.value : 0.2;
}

// ===== 6) Mapa de densidade por LINHAS (considera vínculo) =================
let heatLayers = {}; // { tag: PGraphics }

function createHeatLayers(p) {
  const DPI = Math.min(2, window.devicePixelRatio || 1);
  heatLayers = {};
  for (const tag of Object.keys(TAG_COLORS)) {
    const g = p.createGraphics(innerWidth, innerHeight);
    g.pixelDensity(DPI);
    heatLayers[tag] = g;
  }
}

function drawHeatFromLinks(p) {
  const show = document.getElementById('heatOn')?.checked ?? true;
  if (!show) return;

  const baseThickness = +document.getElementById('heatThickness')?.value || 8;
  const blurAmt       = +document.getElementById('heatBlur')?.value || 2;
  const alpha         = +document.getElementById('heatAlpha')?.value || 24;

  for (const [tag, g] of Object.entries(heatLayers)) {
    const lines = linksByTag[tag] || [];
    g.clear();
    g.noFill();

    for (const l of lines) {
      const s = (typeof l.source === 'object') ? l.source : null;
      const t = (typeof l.target === 'object') ? l.target : null;
      if (!s || !t) continue;

      const col = p.color(TAG_COLORS[tag] || l.color || "#999");
      col.setAlpha(alpha);
      g.stroke(col);

      // Espessura proporcional ao vínculo médio (1..100)
      g.strokeWeight(baseThickness * (l.aff / 100));

      // usamos a rota central (sem offset) para medir densidade real
      g.line(s.x, s.y, t.x, t.y);
    }
    if (blurAmt > 0) g.filter(p.BLUR, blurAmt);
  }

  // Composição aditiva de todas as camadas
  p.push();
  p.blendMode(p.ADD);
  for (const tag of Object.keys(TAG_COLORS)) {
    const g = heatLayers[tag];
    if (g) p.image(g, 0, 0);
  }
  p.pop();
}

// ===== 7) p5 sketch (desenho/drag/labels) =================================
let dragging = null;

let sketch = (p) => {
  const DPI = Math.min(2, window.devicePixelRatio || 1);

  p.setup = () => {
    p.createCanvas(innerWidth, innerHeight);
    p.pixelDensity(DPI);
    createHeatLayers(p);
    setupUIBindings();
    makeSimulation();
  };

  p.windowResized = () => {
    p.resizeCanvas(innerWidth, innerHeight);
    createHeatLayers(p);
    simulation.force("center", d3.forceCenter(innerWidth / 2, innerHeight / 2));
    updateClusterTargets();
    simulation.alpha(0.4).restart();
  };

  p.mousePressed = () => {
    const r = +document.getElementById('collisionR').value;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (p.dist(p.mouseX, p.mouseY, n.x, n.y) < r + 4) {
        dragging = n; n.fx = n.x; n.fy = n.y;
        simulation.alphaTarget(0.4).restart();
        return;
      }
    }
  };

  p.mouseDragged = () => {
    if (dragging) { dragging.fx = p.mouseX; dragging.fy = p.mouseY; }
  };

  p.mouseReleased = () => {
    if (dragging) { dragging.fx = null; dragging.fy = null; dragging = null; simulation.alphaTarget(0).alpha(0.25); }
  };

  // Mapeamento de espessura visual (linhas)
  const EDGE_THICK_MIN = 0.00001;
  const EDGE_THICK_MAX = 5.0;

  p.draw = () => {
    forceCluster(0.9, window.getClusterGain ? window.getClusterGain() : 0.2);

    p.background(12, 13, 16);

    // --- mapa de densidade por linhas (com peso) ---
    drawHeatFromLinks(p);

    // --- arestas visíveis (uma por tag) com offset e espessura pelo vínculo ---
    for (const l of links) {
      const s = (typeof l.source === 'object') ? l.source : null;
      const t = (typeof l.target === 'object') ? l.target : null;
      if (!s || !t) continue;

      // offsets paralelos quando há muitas tags entre o mesmo par
      const dx = t.x - s.x, dy = t.y - s.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const k  = (l._offsetIndex - (l._offsetCount - 1) / 2);
      const spread = 3;
      const ox = nx * k * spread, oy = ny * k * spread;

      // espessura por média (1..100) -> mapeia para [EDGE_THICK_MIN..MAX]
      const stw = EDGE_THICK_MIN + (EDGE_THICK_MAX - EDGE_THICK_MIN) * (l.aff / 100);

      p.stroke(l.color);
      p.strokeWeight(stw);
      p.line(s.x + ox, s.y + oy, t.x + ox, t.y + oy);
    }

    // ===== Nós (anéis concêntricos por weights) + plaquinha do rótulo =========
const R = +document.getElementById('collisionR').value;
p.textAlign(p.CENTER, p.CENTER);
p.textSize(11);

for (const n of nodes) {
  // desenha os círculos concêntricos (área ∝ weight)
  drawNodeRings(p, n, R, { innerPad: 0, minPx: 1 });

  // plaquinha preta atrás do nome
  const label = n.id;
  const tw = p.textWidth(label) + 8;
  const th = 16;
  const tx = n.x;
  const ty = n.y - (R + 10);

  p.rectMode(p.CENTER);
  p.fill(0, 180);
  p.noStroke();
  p.rect(tx, ty, tw, th, 4);

  p.fill(220);
  p.text(label, tx, ty + 1);
}


    p.cursor(dragging ? 'grabbing' : 'default');
  };
};

new p5(sketch);

// ===== 8) Menu minimizar/expandir =========================================
document.addEventListener('DOMContentLoaded', () => {
  // PREENCHE A LEGENDA ASSIM QUE A PÁGINA CARREGA
  renderLegendTagColors();

  const ui  = document.getElementById('ui');
  const btn = document.getElementById('toggle-ui');
  if (!ui || !btn) return;

  btn.addEventListener('click', () => {
    ui.classList.toggle('minimized');
    btn.textContent = ui.classList.contains('minimized') ? '⮟' : '⮝';
  });
});
