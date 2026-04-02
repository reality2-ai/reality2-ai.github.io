(function(){
const canvas = document.getElementById('mesh-bg');
const ctx = canvas.getContext('2d');

let W, H;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// --- Truly random timing using exponential distribution ---
function expRandom(mean) {
  // Exponential distribution — memoryless, truly random inter-arrival times
  return -mean * Math.log(1 - Math.random());
}

function poissonNext(rate) {
  // Next event in frames, given average rate (events per frame)
  return Math.max(1, Math.round(expRandom(1 / rate)));
}

// --- Trust group colours ---
const trustGroups = [
  { color: [212, 168, 83], name: 'Earthgrid Alpha' },
  { color: [180, 140, 70], name: 'Earthgrid Beta' },
  { color: [230, 190, 100], name: 'Personal Swarm' },
  { color: [160, 130, 80], name: 'Council Feed' },
  { color: [200, 160, 90], name: 'Research Grid' },
];

// --- Activity phases ---
// Activity level drifts organically — sometimes quiet, sometimes busy
let activityLevel = 0.5;       // 0 = dead quiet, 1 = very busy
let activityTarget = 0.5;
let activityChangeTimer = 0;
let activityChangeDue = poissonNext(1/300); // ~every 300 frames, shift activity

function updateActivity() {
  activityChangeTimer += dtScale;
  if (activityChangeTimer >= activityChangeDue) {
    activityChangeTimer = 0;
    // Pick a new target — biased toward moderate but can go extreme
    // Sometimes very quiet (0.05), sometimes burst (1.0)
    const r = Math.random();
    if (r < 0.15) {
      activityTarget = 0.02 + Math.random() * 0.08; // quiet phase
    } else if (r < 0.75) {
      activityTarget = 0.2 + Math.random() * 0.5;   // moderate
    } else {
      activityTarget = 0.7 + Math.random() * 0.3;   // burst
    }
    // Next change at a random time
    activityChangeDue = poissonNext(1 / (150 + Math.random() * 400));
  }
  // Smooth drift toward target
  activityLevel += (activityTarget - activityLevel) * 0.003 * dtScale;
}

// --- Nodes ---
const nodes = [];
const CONNECT_DIST = 200;

// Trust groups are spatial clusters — co-located devices with one gateway each
const NODES_PER_GROUP = 6;  // sensors, devices per trust group
const CLUSTER_SPREAD = 160; // spread wide — zoomed in, fills the screen

function createNode(x, y, group, opts = {}) {
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.005 + Math.random() * 0.008;
  return {
    x: x || Math.random() * W * 0.8 + W * 0.1,
    y: y || Math.random() * H * 0.8 + H * 0.1,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: opts.isGateway ? 5 : (3 + Math.random() * 2),
    group: group,
    pulse: Math.random() * Math.PI * 2,
    alive: true,
    age: 0,
    fadeIn: 0,
    isGateway: opts.isGateway || false,
    // Cluster home — nodes drift back toward their cluster centre
    homeX: x,
    homeY: y,
    clusterGroup: opts.clusterGroup,
    // Wandering: each node has a drift angle that slowly rotates
    wanderAngle: Math.random() * Math.PI * 2,
    wanderRate: (Math.random() - 0.5) * 0.002,
    wanderStrength: 0.0002 + Math.random() * 0.0003,
    // Occasional direction change
    nextNudge: 400 + Math.floor(Math.random() * 1200),
    nudgeTimer: 0,
    mobile: false,
  };
}

// Place trust group clusters across the screen
// Spread them out so they don't overlap, but close enough that the mesh connects them
(function initClusters() {
  // Find good cluster centres — spread across available space
  const margin = 80;
  const centres = [];
  // Spread clusters wide across the full viewport
  const MIN_SEP = CONNECT_DIST * 1.0;   // no overlap between cluster centres
  const MAX_SEP = CONNECT_DIST * 2.5;   // spread wide — fills the screen
  for (let g = 0; g < trustGroups.length; g++) {
    let cx, cy, attempts = 0;
    do {
      cx = margin + Math.random() * (W - margin * 2);
      cy = margin + Math.random() * (H - margin * 2);
      attempts++;
      // Must be at least MIN_SEP from existing centres, but reject if ALL are > MAX_SEP
      const tooClose = centres.some(c => Math.hypot(c.x - cx, c.y - cy) < MIN_SEP);
      const anyReachable = centres.length === 0 || centres.some(c => Math.hypot(c.x - cx, c.y - cy) < MAX_SEP);
      if (!tooClose && anyReachable) break;
    } while (attempts < 200);
    centres.push({ x: cx, y: cy });

    const group = trustGroups[g];

    // Create the gateway node first — slightly larger, marked
    const gw = createNode(cx, cy, group, { isGateway: true, clusterGroup: g });
    gw.fadeIn = 1;
    nodes.push(gw);

    // Create sensor/device nodes scattered around the centre
    for (let n = 0; n < NODES_PER_GROUP; n++) {
      const a = Math.random() * Math.PI * 2;
      const r = 20 + Math.random() * CLUSTER_SPREAD;
      const nx = cx + Math.cos(a) * r;
      const ny = cy + Math.sin(a) * r;
      const node = createNode(nx, ny, group, { clusterGroup: g });
      node.fadeIn = 1;
      nodes.push(node);
    }
  }

  // Add a few mobile nodes
  for (let m = 0; m < 6; m++) {
    const group = trustGroups[Math.floor(Math.random() * trustGroups.length)];
    const n = createNode(
      margin + Math.random() * (W - margin * 2),
      margin + Math.random() * (H - margin * 2),
      group, { clusterGroup: -1 }
    );
    n.fadeIn = 1;
    n.mobile = true;
    n.wanderStrength = 0.0005 + Math.random() * 0.0005;
    n.nextNudge = 300 + Math.floor(Math.random() * 600);
    n.radius = 3.5 + Math.random() * 1.5;
    n.journeyTarget = null;
    n.journeyTimer = 0;
    n.journeyDue = 1000 + Math.floor(Math.random() * 2000);
    nodes.push(n);
  }
})();

// --- Cluster lifecycle metadata ---
const clusterMeta = [];
for (let g = 0; g < trustGroups.length; g++) {
  clusterMeta.push({ alive: true, dying: false, bornFrame: 0, deathStart: 0 });
}
let clusterLifecycleTimer = 0;
let clusterLifecycleDue = 2000 + Math.floor(Math.random() * 1500); // first lifecycle event after ~35-60s

// --- Edges ---
const edgeMap = {};
const edges = [];

function edgeKey(i, j) { return i < j ? `${i}-${j}` : `${j}-${i}`; }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function getOrCreateEdge(i, j) {
  const k = edgeKey(i, j);
  if (edgeMap[k]) return edgeMap[k];
  const edge = {
    key: k, i: Math.min(i, j), j: Math.max(i, j),
    strength: 0, activity: 0,
    maxStrength: 0.4 + Math.random() * 0.6,
    crookedness: 0.06 + Math.random() * 0.12,
    crookPhase: Math.random() * Math.PI * 2,
    cx1: 0, cy1: 0, cx2: 0, cy2: 0,
  };
  edgeMap[k] = edge;
  edges.push(edge);
  return edge;
}

// --- Multi-hop packets ---
const packets = [];

function findPath(srcIdx, maxHops) {
  const hops = 2 + Math.floor(Math.random() * (maxHops - 1));
  const path = [srcIdx];
  const visited = new Set([srcIdx]);
  const ROUTE_DIST = CONNECT_DIST * 1.15; // slightly further than edge rendering to bridge cluster gaps

  for (let h = 0; h < hops; h++) {
    const current = path[path.length - 1];
    const neighbours = [];
    for (let n = 0; n < nodes.length; n++) {
      if (visited.has(n) || !nodes[n].alive) continue;
      const d = dist(nodes[current], nodes[n]);
      if (d < ROUTE_DIST) {
        const k = edgeKey(current, n);
        const e = edgeMap[k];
        // Penalise hops that double back toward the source
        const distFromSrc = dist(nodes[srcIdx], nodes[n]);
        const distCurFromSrc = dist(nodes[srcIdx], nodes[current]);
        const forwardBonus = distFromSrc > distCurFromSrc ? 0.3 : 0; // prefer moving outward
        const proximity = 1 - (d / ROUTE_DIST);
        const edgeBonus = e ? e.strength * 2 : 0;
        const crossGroup = nodes[current].group !== nodes[n].group ? 0.2 : 0;
        const w = 0.1 + proximity * 1.5 + edgeBonus + crossGroup + forwardBonus;
        neighbours.push({ idx: n, weight: w });
      }
    }
    if (neighbours.length === 0) break;
    const total = neighbours.reduce((s, n) => s + n.weight, 0);
    let r = Math.random() * total;
    let chosen = neighbours[0].idx;
    for (const nb of neighbours) {
      r -= nb.weight;
      if (r <= 0) { chosen = nb.idx; break; }
    }
    path.push(chosen);
    visited.add(chosen);
  }
  return path.length >= 2 ? path : null;
}

function sendMultihopPacket() {
  const aliveIndices = nodes.map((n, i) => n.alive ? i : -1).filter(i => i >= 0);
  if (aliveIndices.length < 3) return;
  const src = aliveIndices[Math.floor(Math.random() * aliveIndices.length)];
  const path = findPath(src, 7);
  if (!path) return;
  const group = nodes[src].group;

  for (let h = 0; h < path.length - 1; h++) {
    const a = nodes[path[h]], b = nodes[path[h + 1]];
    if (!a.alive || !b.alive || dist(a, b) > CONNECT_DIST * 1.15) continue; // skip broken hops
    const edge = getOrCreateEdge(path[h], path[h + 1]);
    edge.strength = Math.min(edge.maxStrength, edge.strength + 0.05);
    edge.activity = Math.min(1, edge.activity + 0.15);
  }

  packets.push({
    path: path, hopIndex: 0, t: 0,
    speed: 0.0025 + Math.random() * 0.0025,
    color: group.color,
    size: 2 + Math.random() * 2,
    alive: true,
  });
}

// --- Proximity chatter — low-level discovery/capability exchange between nearby nodes ---
let proximityTimer = 0;
let proximityDue = poissonNext(1/30); // check fairly often but send rarely

function sendProximityChatter() {
  // Pick a random alive node; if it has a close neighbour, exchange a tiny packet
  const alive = nodes.map((n, i) => n.alive ? i : -1).filter(i => i >= 0);
  if (alive.length < 2) return;
  const srcIdx = alive[Math.floor(Math.random() * alive.length)];
  const src = nodes[srcIdx];
  
  // Find close neighbours (within ~60% of connect range — truly proximate)
  const nearby = [];
  for (const j of alive) {
    if (j === srcIdx) continue;
    const d = dist(src, nodes[j]);
    if (d < CONNECT_DIST * 0.6) {
      nearby.push(j);
    }
  }
  if (nearby.length === 0) return;
  
  const dstIdx = nearby[Math.floor(Math.random() * nearby.length)];
  const edge = getOrCreateEdge(srcIdx, dstIdx);
  // Gentle edge reinforcement — a whisper, but persistent
  edge.strength = Math.min(edge.maxStrength, edge.strength + 0.015);
  edge.activity = Math.min(1, edge.activity + 0.06);
  
  // Small, dim, single-hop packet — discovery ping, not real traffic
  const c = src.group.color;
  packets.push({
    path: [srcIdx, dstIdx], hopIndex: 0, t: 0,
    speed: 0.002 + Math.random() * 0.002,
    color: [c[0] * 0.6, c[1] * 0.6, c[2] * 0.6], // dimmer
    size: 1.2 + Math.random() * 0.8, // smaller
    alive: true,
    isProximity: true,
  });
}

// --- Entanglement heartbeats (regular pulse pairs) ---
const heartbeats = [];
const HEARTBEAT_COUNT = 5;

function setupHeartbeats() {
  // Pick pairs of nodes that will maintain a steady heartbeat
  // Each has its own rhythm (period) — not all the same
  heartbeats.length = 0;
  const alive = nodes.map((n, i) => n.alive ? i : -1).filter(i => i >= 0);
  const used = new Set();
  
  for (let h = 0; h < HEARTBEAT_COUNT && alive.length > 1; h++) {
    // Find a pair within range
    let attempts = 0;
    while (attempts < 50) {
      const a = alive[Math.floor(Math.random() * alive.length)];
      const b = alive[Math.floor(Math.random() * alive.length)];
      if (a !== b && !used.has(a) && !used.has(b) && dist(nodes[a], nodes[b]) < CONNECT_DIST * 1.5) {
        // Find a multi-hop path between them
        const path = findPath(a, 5);
        if (path && path.length >= 2) {
          heartbeats.push({
            path: path,
            period: 500 + Math.floor(Math.random() * 500), // 500-1000 frames between pulses
            phase: Math.floor(Math.random() * 200),
            timer: 0,
            color: nodes[a].group.color,
          });
          used.add(a);
          used.add(b);
          break;
        }
      }
      attempts++;
    }
  }
}

// Set up initial heartbeats after a short delay (let edges form)
let heartbeatSetupFrame = 120;
let heartbeatSetupDone = false;
let heartbeatRefreshTimer = 0;
let heartbeatRefreshDue = 1500 + Math.floor(Math.random() * 1000); // refresh pairs periodically

function sendHeartbeatPacket(hb) {
  // Check all hops are still in range
  for (let h = 0; h < hb.path.length - 1; h++) {
    const a = nodes[hb.path[h]], b = nodes[hb.path[h + 1]];
    if (!a || !b || !a.alive || !b.alive || dist(a, b) > CONNECT_DIST * 1.15) return; // path broken
  }
  // Strengthen the path
  for (let h = 0; h < hb.path.length - 1; h++) {
    const edge = getOrCreateEdge(hb.path[h], hb.path[h + 1]);
    edge.strength = Math.min(edge.maxStrength, edge.strength + 0.06);
    edge.activity = Math.min(1, edge.activity + 0.18);
  }

  // Send packet with a slightly different visual — brighter, more consistent size
  packets.push({
    path: hb.path, hopIndex: 0, t: 0,
    speed: 0.003 + Math.random() * 0.002,
    color: hb.color,
    size: 3,  // consistent size — these are regular, not random
    alive: true,
    isHeartbeat: true,
  });
}

// --- Random event scheduling ---
let nextPacketFrame = poissonNext(1/8);
let nextBurstFrame = poissonNext(1/200);
let packetFrameCounter = 0;
let burstFrameCounter = 0;

// --- Simulation ---
let frame = 0;
let dtScale = 1;

function updateEdgeControlPoints(edge) {
  const a = nodes[edge.i];
  const b = nodes[edge.j];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const w1 = Math.sin(frame * 0.002 + edge.crookPhase) * edge.crookedness * len;
  const w2 = Math.cos(frame * 0.0015 + edge.crookPhase * 1.7) * edge.crookedness * len * 0.7;
  edge.cx1 = a.x + dx * 0.33 + nx * w1;
  edge.cy1 = a.y + dy * 0.33 + ny * w1;
  edge.cx2 = a.x + dx * 0.67 + nx * w2;
  edge.cy2 = a.y + dy * 0.67 + ny * w2;
}

function pointOnEdge(edge, t) {
  const a = nodes[edge.i];
  const b = nodes[edge.j];
  const u = 1 - t;
  return {
    x: u*u*u*a.x + 3*u*u*t*edge.cx1 + 3*u*t*t*edge.cx2 + t*t*t*b.x,
    y: u*u*u*a.y + 3*u*u*t*edge.cy1 + 3*u*t*t*edge.cy2 + t*t*t*b.y,
  };
}

function tick() {
  frame += dtScale;
  updateActivity();

  // Move nodes — continuous wandering so clumps break up and reform
  for (const n of nodes) {
    if (!n.alive) continue;
    n.age += dtScale;
    if (n.fadeIn < 1) n.fadeIn = Math.min(1, n.fadeIn + 0.008 * dtScale);

    // Mobile nodes sometimes go on journeys — move purposefully across the mesh
    if (n.mobile) {
      n.journeyTimer += dtScale;
      if (n.journeyTimer >= n.journeyDue) {
        n.journeyTimer = 0;
        n.journeyDue = 600 + Math.floor(Math.random() * 1500);
        // Pick a destination — somewhere else on screen
        n.journeyTarget = {
          x: W * 0.15 + Math.random() * W * 0.7,
          y: H * 0.15 + Math.random() * H * 0.7,
        };
      }
      // Steer toward journey target if we have one
      if (n.journeyTarget) {
        const dx = n.journeyTarget.x - n.x;
        const dy = n.journeyTarget.y - n.y;
        const d = Math.hypot(dx, dy);
        if (d < 40) {
          n.journeyTarget = null; // arrived
        } else {
          const steer = 0.0002;
          n.vx += (dx / d) * steer * dtScale;
          n.vy += (dy / d) * steer * dtScale;
        }
      }
    }

    // Cluster cohesion — non-mobile nodes drift back toward their cluster home
    if (!n.mobile && n.homeX !== undefined) {
      const hx = n.homeX - n.x;
      const hy = n.homeY - n.y;
      const hd = Math.hypot(hx, hy);
      if (hd > 30) { // only pull when drifted noticeably
        const pull = 0.00008 * Math.min(hd / 50, 1); // gentle, proportional
        n.vx += (hx / hd) * pull * dtScale;
        n.vy += (hy / hd) * pull * dtScale;
      }
    }

    // Wander force — gentle persistent drift that slowly changes direction
    n.wanderAngle += n.wanderRate * dtScale;
    n.vx += Math.cos(n.wanderAngle) * n.wanderStrength * dtScale;
    n.vy += Math.sin(n.wanderAngle) * n.wanderStrength * dtScale;

    // Occasional nudge — sometimes a node gets a bigger push (device moving)
    n.nudgeTimer += dtScale;
    if (n.nudgeTimer >= n.nextNudge) {
      n.nudgeTimer = 0;
      n.nextNudge = 400 + Math.floor(Math.random() * 1200);
      const nudgeAngle = Math.random() * Math.PI * 2;
      const nudgeForce = 0.008 + Math.random() * 0.012;
      n.vx += Math.cos(nudgeAngle) * nudgeForce;
      n.vy += Math.sin(nudgeAngle) * nudgeForce;
      // Also shift the wander direction
      n.wanderAngle = nudgeAngle + (Math.random() - 0.5) * 1.5;
      n.wanderRate = (Math.random() - 0.5) * 0.005;
    }

    // Soft mutual repulsion — prevents nodes from piling up
    for (let j = 0; j < nodes.length; j++) {
      const other = nodes[j];
      if (other === n || !other.alive) continue;
      const dx = n.x - other.x;
      const dy = n.y - other.y;
      const d = Math.hypot(dx, dy);
      if (d < 50 && d > 0) {
        const repel = 0.0008 * (1 - d / 50);
        n.vx += (dx / d) * repel * dtScale;
        n.vy += (dy / d) * repel * dtScale;
      }
    }

    n.x += n.vx * dtScale;
    n.y += n.vy * dtScale;

    // Boundary repulsion
    const margin = 80;
    if (n.x < margin) n.vx += 0.004 * (1 - n.x / margin) * dtScale;
    if (n.x > W - margin) n.vx -= 0.004 * (1 - (W - n.x) / margin) * dtScale;
    if (n.y < margin) n.vy += 0.004 * (1 - n.y / margin) * dtScale;
    if (n.y > H - margin) n.vy -= 0.004 * (1 - (H - n.y) / margin) * dtScale;

    // Speed limit and gentle damping
    const speed = Math.hypot(n.vx, n.vy);
    const maxSpeed = 0.05;
    if (speed > maxSpeed) {
      n.vx = (n.vx / speed) * maxSpeed;
      n.vy = (n.vy / speed) * maxSpeed;
    }
    n.vx *= Math.pow(0.997, dtScale);
    n.vy *= Math.pow(0.997, dtScale);

    n.pulse += 0.02 * dtScale;
  }

  // Edge discovery is now ONLY through traffic — edges form when packets route through them
  // No automatic edge creation just from proximity

  // Send packets — rate modulated by activity level
  packetFrameCounter += dtScale;
  if (packetFrameCounter >= nextPacketFrame) {
    packetFrameCounter = 0;
    // Higher activity = more packets, lower = fewer
    // At activityLevel 0.02, mean interval ~80 frames
    // At activityLevel 1.0, mean interval ~4 frames
    const meanInterval = 40 + (1 - activityLevel) * 400;
    nextPacketFrame = poissonNext(1 / meanInterval);

    // Sometimes send multiple packets at once during high activity
    const count = activityLevel > 0.7 && Math.random() < 0.2 ? 
      1 + Math.floor(Math.random() * 2) : 1;
    for (let c = 0; c < count; c++) {
      sendMultihopPacket();
    }
  }

  // Bursts — entanglement heartbeats, more likely during active phases
  burstFrameCounter += dtScale;
  const burstMean = activityLevel > 0.5 ? 600 : 1500;
  if (burstFrameCounter >= nextBurstFrame) {
    burstFrameCounter = 0;
    nextBurstFrame = poissonNext(1 / burstMean);
    
    if (activityLevel > 0.15) {
      const burstSize = 2 + Math.floor(Math.random() * 3);
      for (let b = 0; b < burstSize; b++) {
        setTimeout(() => sendMultihopPacket(), b * (150 + Math.random() * 200));
      }
    }
  }

  // Proximity chatter — ambient discovery between nearby nodes
  // Runs constantly at a low level, independent of activity phase
  proximityTimer += dtScale;
  if (proximityTimer >= proximityDue) {
    proximityTimer = 0;
    // Mean interval ~40-80 frames — frequent checks but only fires if nodes are close
    proximityDue = poissonNext(1 / (40 + Math.random() * 40));
    sendProximityChatter();
  }

  // Setup heartbeats once edges have formed
  if (!heartbeatSetupDone && frame >= heartbeatSetupFrame) {
    setupHeartbeats();
    heartbeatSetupDone = true;
  }

  // Refresh heartbeat pairs periodically (routes change as nodes move)
  heartbeatRefreshTimer += dtScale;
  if (heartbeatRefreshTimer >= heartbeatRefreshDue) {
    heartbeatRefreshTimer = 0;
    heartbeatRefreshDue = 1500 + Math.floor(Math.random() * 1000);
    setupHeartbeats();
  }

  // Tick heartbeats — regular rhythm, independent of activity level
  for (const hb of heartbeats) {
    // Check path is still valid (all nodes alive)
    const valid = hb.path.every(idx => nodes[idx] && nodes[idx].alive);
    if (!valid) continue;

    hb.timer += dtScale;
    if (hb.timer >= hb.period) {
      hb.timer = 0;
      // Send pulse in both directions (ping-pong)
      sendHeartbeatPacket(hb);
      // Return pulse slightly delayed
      setTimeout(() => {
        const returnHb = { ...hb, path: [...hb.path].reverse() };
        sendHeartbeatPacket(returnHb);
      }, hb.period * 8);
    }
  }

  // Decay edges — faster when nodes are far apart, and REMOVE dead edges
  for (let ei = edges.length - 1; ei >= 0; ei--) {
    const e = edges[ei];
    const a = nodes[e.i];
    const b = nodes[e.j];
    if (!a.alive || !b.alive) {
      e.strength *= Math.pow(0.99, dtScale);
      e.activity *= Math.pow(0.96, dtScale);
    } else {
      const d = dist(a, b);
      if (d > CONNECT_DIST * 1.3) {
        // Way out of range — fade but not instantly
        e.strength *= Math.pow(0.994, dtScale);
        e.activity *= Math.pow(0.96, dtScale);
      } else if (d > CONNECT_DIST) {
        // Drifting apart — gentle accelerated decay
        const overRatio = (d - CONNECT_DIST) / (CONNECT_DIST * 0.3);
        e.strength *= Math.pow(0.998 - overRatio * 0.008, dtScale);
        e.activity *= Math.pow(0.97, dtScale);
      } else {
        // In range — very slow decay so well-used paths persist visibly
        // Strength half-life ~23s close, ~12s at range edge
        // Activity half-life ~3-4s — the "just used" glow lingers visibly
        const proximity = 1 - (d / CONNECT_DIST);
        e.strength *= Math.pow(0.9995 + proximity * 0.0003, dtScale);
        e.activity *= Math.pow(0.996, dtScale);
      }
    }

    // Remove truly dead edges — clean up the map
    if (e.strength < 0.003 && e.activity < 0.003) {
      delete edgeMap[e.key];
      edges.splice(ei, 1);
    }
  }

  // Update packets — kill them if the next hop is out of range
  for (const p of packets) {
    if (!p.alive) continue;
    
    const hop = p.hopIndex;
    if (hop >= p.path.length - 1) { p.alive = false; continue; }

    // Check if current hop nodes are still alive and in range
    const srcNode = nodes[p.path[hop]];
    const dstNode = nodes[p.path[hop + 1]];
    if (!srcNode || !dstNode || !srcNode.alive || !dstNode.alive) {
      p.alive = false; // node died
      continue;
    }
    const hopDist = dist(srcNode, dstNode);
    if (hopDist > CONNECT_DIST * 1.2) {
      p.alive = false; // link broken — nodes drifted apart
      continue;
    }

    p.t += p.speed * dtScale;

    // Trail is now rendered from the curve directly — no stored positions needed

    if (p.t >= 1) {
      p.hopIndex++;
      p.t = 0;
      if (p.hopIndex >= p.path.length - 1) {
        p.alive = false;
        const dest = nodes[p.path[p.path.length - 1]];
        if (dest) dest.pulse = 0;
      } else {
        // Check NEXT hop is also reachable before continuing
        const nextSrc = nodes[p.path[p.hopIndex]];
        const nextDst = nodes[p.path[p.hopIndex + 1]];
        if (!nextSrc || !nextDst || !nextSrc.alive || !nextDst.alive || 
            dist(nextSrc, nextDst) > CONNECT_DIST * 1.15) {
          p.alive = false; // next hop unreachable — packet dropped
        }
      }
    }
  }

  // No trail aging needed — trails are rendered from live curves

  // --- Cluster lifecycle ---
  // Occasionally fade out an entire cluster and spawn a new one elsewhere
  clusterLifecycleTimer += dtScale;
  if (clusterLifecycleTimer >= clusterLifecycleDue) {
    clusterLifecycleTimer = 0;
    clusterLifecycleDue = 1500 + Math.floor(Math.random() * 2000); // every ~25-60 seconds

    // Pick a cluster to retire (not all of them — keep at least 3)
    const aliveClusters = [];
    for (let g = 0; g < clusterMeta.length; g++) {
      if (clusterMeta[g].alive) aliveClusters.push(g);
    }

    if (aliveClusters.length > 3) {
      // Retire the oldest cluster
      const retire = aliveClusters.reduce((oldest, g) =>
        clusterMeta[g].bornFrame < clusterMeta[oldest].bornFrame ? g : oldest, aliveClusters[0]);
      clusterMeta[retire].dying = true;
      clusterMeta[retire].deathStart = frame;
    }

    // Spawn a new cluster if we have room
    if (aliveClusters.length < 7) {
      const group = trustGroups[Math.floor(Math.random() * trustGroups.length)];
      const margin = 100;
      let cx, cy, attempts = 0;
      do {
        cx = margin + Math.random() * (W - margin * 2);
        cy = margin + Math.random() * (H - margin * 2);
        attempts++;
      } while (attempts < 100 && nodes.some(n => n.alive && n.fadeIn > 0.3 && Math.hypot(n.x - cx, n.y - cy) < CONNECT_DIST * 0.7));

      const gIdx = clusterMeta.length;
      clusterMeta.push({ alive: true, dying: false, bornFrame: frame, deathStart: 0 });

      // Gateway
      const gw = createNode(cx, cy, group, { isGateway: true, clusterGroup: gIdx });
      gw.fadeIn = 0;
      nodes.push(gw);

      // Sensor nodes
      for (let n = 0; n < NODES_PER_GROUP - 1; n++) {
        const a = Math.random() * Math.PI * 2;
        const r = 30 + Math.random() * CLUSTER_SPREAD;
        const node = createNode(cx + Math.cos(a) * r, cy + Math.sin(a) * r, group, { clusterGroup: gIdx });
        node.fadeIn = 0;
        nodes.push(node);
      }
    }
  }

  // Fade dying clusters out, fade new clusters in
  for (let g = 0; g < clusterMeta.length; g++) {
    const cm = clusterMeta[g];
    if (cm.dying) {
      const deathAge = frame - cm.deathStart;
      for (const n of nodes) {
        if (n.clusterGroup === g && n.alive) {
          n.fadeIn = Math.max(0, n.fadeIn - 0.003 * dtScale);
          if (n.fadeIn <= 0) n.alive = false;
        }
      }
      // Mark cluster dead once all nodes gone
      if (!nodes.some(n => n.clusterGroup === g && n.alive)) {
        cm.alive = false;
      }
    } else if (cm.alive) {
      // Fade in new nodes
      for (const n of nodes) {
        if (n.clusterGroup === g && n.alive && n.fadeIn < 1) {
          n.fadeIn = Math.min(1, n.fadeIn + 0.008 * dtScale);
        }
      }
    }
  }
}

// --- Rendering ---
function draw() {
  ctx.clearRect(0, 0, W, H);

  const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.7);
  bg.addColorStop(0, '#0e0e12');
  bg.addColorStop(1, '#0a0a0e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Edges
  for (const edge of edges) {
    const a = nodes[edge.i];
    const b = nodes[edge.j];
    if (!a.alive || !b.alive) continue;
    const d = dist(a, b);
    if (d > CONNECT_DIST + 30) continue;

    updateEdgeControlPoints(edge);

    const baseAlpha = edge.strength * 1.0 + edge.activity * 0.5;
    if (baseAlpha < 0.003) continue;

    const distFade = d > CONNECT_DIST ? 1 - (d - CONNECT_DIST) / 30 : 1;
    const alpha = Math.min(1, baseAlpha) * distFade * Math.min(a.fadeIn, b.fadeIn);

    const c1 = a.group.color;
    const c2 = b.group.color;
    const mr = (c1[0] + c2[0]) / 2;
    const mg = (c1[1] + c2[1]) / 2;
    const mb = (c1[2] + c2[2]) / 2;

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.bezierCurveTo(edge.cx1, edge.cy1, edge.cx2, edge.cy2, b.x, b.y);
    ctx.lineWidth = 0.8 + edge.strength * 4 + edge.activity * 2;
    ctx.strokeStyle = `rgba(${mr|0},${mg|0},${mb|0},${alpha * 0.85})`;
    ctx.stroke();

    if (alpha > 0.05) {
      ctx.lineWidth = 3 + edge.strength * 8 + edge.activity * 5;
      ctx.strokeStyle = `rgba(${mr|0},${mg|0},${mb|0},${alpha * 0.25})`;
      ctx.stroke();
    }

    if (edge.activity > 0.15) {
      ctx.lineWidth = 6 + edge.activity * 10;
      ctx.strokeStyle = `rgba(${mr|0},${mg|0},${mb|0},${edge.activity * 0.12 * distFade})`;
      ctx.stroke();
    }
  }

  // Packet trails — rendered from live edge curves so they track moving nodes
  for (const p of packets) {
    if (!p.alive) continue;
    const hop = p.hopIndex;
    if (hop >= p.path.length - 1) continue;
    const edge = edgeMap[edgeKey(p.path[hop], p.path[hop + 1])];
    if (!edge) continue;
    const c = p.color;
    const forward = p.path[hop] === edge.i;
    const trailLength = 0.25; // fraction of edge behind the packet
    const trailStart = forward ? Math.max(0, p.t - trailLength) : Math.min(1, (1 - p.t) + trailLength);
    const trailEnd = forward ? p.t : 1 - p.t;
    const steps = 12;
    for (let s = 0; s < steps; s++) {
      const frac0 = s / steps;
      const frac1 = (s + 1) / steps;
      const t0 = trailStart + (trailEnd - trailStart) * frac0;
      const t1 = trailStart + (trailEnd - trailStart) * frac1;
      const p0 = pointOnEdge(edge, t0);
      const p1 = pointOnEdge(edge, t1);
      const fade = frac1; // brighter toward the packet head
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineWidth = p.size * 0.8 * fade;
      ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${fade * 0.5})`;
      ctx.stroke();
    }
  }

  // Packets
  for (const p of packets) {
    if (!p.alive) continue;
    const hop = p.hopIndex;
    if (hop >= p.path.length - 1) continue;

    const edge = edgeMap[edgeKey(p.path[hop], p.path[hop + 1])];
    if (!edge) continue;

    const forward = p.path[hop] === edge.i;
    const pos = pointOnEdge(edge, forward ? p.t : 1 - p.t);
    const c = p.color;

    const glowSize = p.isHeartbeat ? p.size * 16 : p.size * 12;
    const coreSize = p.isHeartbeat ? p.size * 5 : p.size * 4;
    const coreAlpha = p.isHeartbeat ? 1.0 : 0.95;
    const glowAlpha = p.isHeartbeat ? 0.5 : 0.4;

    const g2 = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowSize);
    g2.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${glowAlpha})`);
    g2.addColorStop(0.4, `rgba(${c[0]},${c[1]},${c[2]},${glowAlpha * 0.25})`);
    g2.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, glowSize, 0, Math.PI * 2);
    ctx.fillStyle = g2;
    ctx.fill();

    const g1 = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, coreSize);
    g1.addColorStop(0, `rgba(255,255,255,${coreAlpha})`);
    g1.addColorStop(0.2, `rgba(${c[0]},${c[1]},${c[2]},0.8)`);
    g1.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, coreSize, 0, Math.PI * 2);
    ctx.fillStyle = g1;
    ctx.fill();

    // Heartbeat packets get an extra ring pulse
    if (p.isHeartbeat) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size * 8, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},0.2)`;
      ctx.stroke();
    }
  }

  // Nodes
  for (const n of nodes) {
    if (!n.alive) continue;
    const pulse = 0.7 + Math.sin(n.pulse) * 0.3;
    const r = n.radius * pulse * n.fadeIn;
    const c = n.group.color;

    const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 6);
    glow.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${0.2 * n.fadeIn})`);
    glow.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    ctx.beginPath();
    ctx.arc(n.x, n.y, r * 6, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.85 * n.fadeIn})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(n.x, n.y, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.6 * n.fadeIn * pulse})`;
    ctx.fill();

    // Gateway nodes — double ring to show they're the cloud-connected node
    if (n.isGateway) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, r * 2.2, 0, Math.PI * 2);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.4 * n.fadeIn * pulse})`;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(n.x, n.y, r * 3.2, 0, Math.PI * 2);
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.2 * n.fadeIn * pulse})`;
      ctx.stroke();
    }

    // Mobile nodes get a subtle outer ring — they're people/devices moving through the mesh
    if (n.mobile) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, r * 2.5, 0, Math.PI * 2);
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.25 * n.fadeIn * pulse})`;
      ctx.stroke();
    }
  }

  // Legend removed — keeping it abstract
}

let lastTime = 0;
const TARGET_DT = 1000 / 60;

function loop(now) {
  if (!lastTime) lastTime = now;
  const dt = Math.min(now - lastTime, 50);
  lastTime = now;
  dtScale = dt / TARGET_DT;

  tick();
  draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

})();

// v2
