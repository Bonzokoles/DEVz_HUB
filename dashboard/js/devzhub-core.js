/* ============================================================
   DEVz HUB — Core Application Logic
   Navigation, charts, tools, tasks, KB/CC population
   ============================================================ */

// ========== SECTION NAV ==========
function showSection(btn, id) {
  document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
  document.querySelectorAll('.snav').forEach(function(b) { b.classList.remove('active'); });
  var target = document.getElementById(id);
  if (target) target.classList.add('active');
  if (btn) btn.classList.add('active');
  // Init lazy modules
  if (id === 'sec-3d' && !window._threeInitialized) initThreeViz();
  if (id === 'sec-overview' && !window._chartsInitialized) initCharts();
  if (id === 'sec-ai' && !window._aiChartsInitialized) initAICharts();
  if (id === 'sec-graph' && !window._graphLoaded) loadGraphSection();
  window.scrollTo(0, 0);
}
function findSnav(id) {
  return document.querySelector('.snav[onclick*="' + id + '"]');
}

// ========== TAB SWITCHER ==========
function showTab(btn, id) {
  var parent = btn.closest('.card');
  parent.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
  parent.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
  document.getElementById(id).classList.add('active');
  btn.classList.add('active');
}

// ========== CLOCK ==========
function updateClock() {
  var el = document.getElementById('clock');
  if (el) el.textContent = new Date().toLocaleString('pl-PL');
}

// ========== TOAST ==========
function showToast(msg) {
  var t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(function() { t.classList.add('show'); });
  setTimeout(function() { t.classList.remove('show'); setTimeout(function() { t.remove(); }, 300); }, 2500);
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', function() {
  updateClock();
  setInterval(updateClock, 1000);
  populateKPIs();
  populateKB();
  populateCC();
  populateAdditionalLibs();
  populateToolCards();
  populateTasks();
  populateDoD();
  loadNotes();
  initCharts();

  // Enter key for tasks
  var ti = document.getElementById('newTaskInput');
  if (ti) ti.addEventListener('keydown', function(e) { if (e.key === 'Enter') addTask(); });
});

// ========== KPIs ==========
function populateKPIs() {
  var d = JIMBO.data;
  setText('kpi-kb', d.totals.kbFiles.toLocaleString());
  setText('kpi-lib', d.totals.libFiles.toLocaleString());
  setText('kpi-lib-sub', d.libraries.map(function(l){return l.name.replace(/THE_/g,'').replace(/_/g,' ')}).join(' · '));
  setText('kpi-cc', d.totals.ccFiles.toLocaleString());
  setText('kpi-cc-sub', d.controlCenter.length + ' folders — ' + d.totals.ccFiles.toLocaleString() + ' files total');
}

// ========== KNOWLEDGE BASE ==========
function populateKB() {
  var grid = document.getElementById('kbGrid');
  if (!grid) return;
  var html = '';
  JIMBO.data.knowledgeBase.forEach(function(kb) {
    var active = kb.files > 0;
    html += '<div class="kb-item' + (active ? '' : ' empty') + '" data-name="' + kb.name.toLowerCase() + '" data-desc="' + (kb.description||'').toLowerCase() + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:start">' +
        '<div class="kb-item-name">' + kb.name + '</div>' +
        '<span class="badge ' + (active ? 'b-active' : 'b-empty') + '">' + (active ? kb.files + ' files' : 'empty') + '</span>' +
      '</div>' +
      '<div class="kb-item-desc">' + kb.description + '</div>' +
      (kb.indexed ? '<div style="font:9px/1 monospace;color:#f0f;margin-bottom:4px">' + kb.indexed + ' indexed chunks</div>' : '') +
      '<div class="kb-item-bar"><div class="kb-item-bar-fill" style="width:' + Math.min(100, (kb.files / 40) * 100) + '%;background:' + kb.hexColor + '"></div></div>' +
    '</div>';
  });
  grid.innerHTML = html;
}
function filterKB(q) {
  q = q.toLowerCase();
  document.querySelectorAll('.kb-item').forEach(function(el) {
    var n = el.getAttribute('data-name') || '';
    var d = el.getAttribute('data-desc') || '';
    el.style.display = (n.includes(q) || d.includes(q)) ? '' : 'none';
  });
}

// ========== CONTROL CENTER ==========
function populateCC() {
  var grid = document.getElementById('ccGrid');
  if (!grid) return;
  var sorted = JIMBO.data.controlCenter.slice().sort(function(a, b) { return b.files - a.files; });
  var maxF = sorted[0].files;
  var html = '';
  sorted.forEach(function(cc) {
    html += '<div class="cc-item">' +
      '<div class="cc-item-icon">' + cc.icon + '</div>' +
      '<div class="cc-item-name">' + cc.name + '</div>' +
      '<div class="cc-item-files" style="color:' + cc.color + '">' + cc.files.toLocaleString() + '</div>' +
      '<div class="cc-item-bar"><div class="cc-item-bar-fill" style="width:' + Math.min(100, (cc.files / maxF) * 100) + '%;background:' + cc.color + '"></div></div>' +
    '</div>';
  });
  grid.innerHTML = html;
}

// ========== ADDITIONAL LIBRARIES ==========
function populateAdditionalLibs() {
  var el = document.getElementById('additionalLibsTable');
  if (!el) return;
  var html = '<table><tr><th>Library</th><th>Files</th><th>Subfolders</th><th>Description</th><th>Status</th></tr>';
  JIMBO.data.additionalLibraries.forEach(function(lib) {
    var active = lib.files > 0;
    html += '<tr><td style="color:' + lib.hexColor + '">' + lib.name + '</td>' +
      '<td>' + lib.files.toLocaleString() + '</td>' +
      '<td>' + lib.subfolders + '</td>' +
      '<td style="font-size:10px;color:var(--muted)">' + lib.description + '</td>' +
      '<td><span class="badge ' + (active ? 'b-active' : 'b-empty') + '">' + (active ? 'ACTIVE' : 'EMPTY') + '</span></td></tr>';
  });
  html += '</table>';
  el.innerHTML = html;
}

// ========== TOOL SELECTOR (CHUCK SCORING) ==========
var toolsData = {
  'deepseek-r1': { name: 'DeepSeek R1', inputPrice: 0.55, outputPrice: 2.19, quality: 94, role: 'SEO' },
  'claude-sonnet-4': { name: 'Claude Sonnet 4', inputPrice: 3.00, outputPrice: 15.00, quality: 96, role: 'Technical' },
  'gpt-4o': { name: 'GPT-4o', inputPrice: 2.50, outputPrice: 10.00, quality: 95, role: 'Marketing' },
  'qwen-2.5': { name: 'Qwen 2.5 14B', inputPrice: 0.30, outputPrice: 0.60, quality: 91, role: 'Multilingual' },
  'gemini-flash': { name: 'Gemini 2.0 Flash', inputPrice: 0.10, outputPrice: 0.40, quality: 89, role: 'Fast' }
};
var selectedTools = [];

function populateToolCards() {
  var el = document.getElementById('toolCards');
  if (!el) return;
  var html = '';
  for (var id in toolsData) {
    var t = toolsData[id];
    html += '<div class="tool-card" id="tc-' + id + '" onclick="toggleTool(\'' + id + '\')">' +
      '<div class="tool-card-info">' +
        '<div class="tool-card-name">' + t.name + '</div>' +
        '<div class="tool-card-price">$' + t.inputPrice + '/1M in · $' + t.outputPrice + '/1M out</div>' +
        '<div class="tool-card-meta">Role: ' + t.role + ' · Quality: ' + t.quality + '%</div>' +
      '</div>' +
      '<span class="badge ' + (t.inputPrice < 1 ? 'b-active' : t.inputPrice < 3 ? 'b-blue' : 'b-purple') + '">' +
        (t.inputPrice < 1 ? 'BUDGET' : t.inputPrice < 3 ? 'MID' : 'PREMIUM') + '</span>' +
    '</div>';
  }
  el.innerHTML = html;
}
function toggleTool(id) {
  var idx = selectedTools.indexOf(id);
  if (idx >= 0) selectedTools.splice(idx, 1); else selectedTools.push(id);
  // UI
  var card = document.getElementById('tc-' + id);
  if (card) card.classList.toggle('selected', selectedTools.includes(id));
  updateScoring();
}
function updateScoring() {
  var stack = document.getElementById('selectedStack');
  if (selectedTools.length === 0) { stack.textContent = 'No tools selected'; }
  else { stack.textContent = selectedTools.map(function(id) { return toolsData[id].name; }).join(' → '); }
  var completeness = Math.min(100, selectedTools.length * 25);
  var roles = [];
  selectedTools.forEach(function(id) { var r = toolsData[id].role; if (roles.indexOf(r) < 0) roles.push(r); });
  var diversity = Math.min(100, roles.length * 20);
  var compatibility = selectedTools.length > 1 ? 70 + (roles.length * 10) : selectedTools.length === 1 ? 50 : 0;
  var overall = Math.round((completeness + compatibility + diversity) / 3);
  setText('scComplete', completeness + '%');
  setText('scCompat', Math.min(100, compatibility) + '%');
  setText('scDiversity', diversity + '%');
  setText('scOverall', overall + '/100');
  setBarWidth('scCompleteBar', completeness);
  setBarWidth('scCompatBar', Math.min(100, compatibility));
  setBarWidth('scDiversityBar', diversity);
}
function setBarWidth(id, pct) { var el = document.getElementById(id); if (el) el.style.width = pct + '%'; }

// ========== CHARTS — OVERVIEW ==========
function initCharts() {
  if (window._chartsInitialized) return;
  window._chartsInitialized = true;
  var d = JIMBO.data;
  var chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: '#222' }, ticks: { color: '#737373', font: { family: 'monospace', size: 10 } } },
      x: { grid: { display: false }, ticks: { color: '#737373', font: { family: 'monospace', size: 9 }, maxRotation: 45 } }
    }
  };

  // KB Chart
  var kbActive = d.knowledgeBase.filter(function(k) { return k.files > 0; });
  new Chart(document.getElementById('chartKB'), {
    type: 'bar',
    data: {
      labels: kbActive.map(function(k) { return k.name; }),
      datasets: [{ label: 'Pliki', data: kbActive.map(function(k) { return k.files; }),
        backgroundColor: ['#00d9ff','#7c3aed','#4ade80','#facc15','#fb923c','#f472b6','#737373','#60a5fa'],
        borderWidth: 0 }]
    },
    options: chartOpts
  });

  // Revenue
  new Chart(document.getElementById('chartRevenue'), {
    type: 'doughnut',
    data: {
      labels: ['Conservative $500K', 'Optimistic $1M'],
      datasets: [{ data: [500000, 1000000], backgroundColor: ['#4ade80', '#00d9ff'], borderWidth: 0, hoverOffset: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: '#737373', font: { family: 'monospace', size: 10 }, padding: 12 } } }
    }
  });

  // Library Files
  var allLibs = d.libraries.concat(d.additionalLibraries).filter(function(l) { return l.files > 0; })
    .sort(function(a, b) { return b.files - a.files; });
  new Chart(document.getElementById('chartLibFiles'), {
    type: 'bar',
    data: {
      labels: allLibs.map(function(l) { return l.name; }),
      datasets: [{ label: 'Files', data: allLibs.map(function(l) { return l.files; }),
        backgroundColor: allLibs.map(function(l) { return l.hexColor; }),
        borderWidth: 0 }]
    },
    options: chartOpts
  });

  // Market
  new Chart(document.getElementById('chartMarket'), {
    type: 'line',
    data: {
      labels: ['2024', '2025', '2026', '2027', '2028'],
      datasets: [{
        label: 'AI Consulting ($B)', data: [15, 20.5, 27.5, 36, 45],
        borderColor: '#00d9ff', backgroundColor: 'rgba(0,217,255,.08)',
        fill: true, tension: .3, pointRadius: 4, pointBackgroundColor: '#00d9ff', borderWidth: 2
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: '#222' }, ticks: { color: '#737373', font: { family: 'monospace', size: 10 }, callback: function(v) { return '$' + v + 'B'; } } },
        x: { grid: { display: false }, ticks: { color: '#737373', font: { family: 'monospace', size: 10 } } }
      }
    }
  });
}

// ========== CHARTS — AI SECTION ==========
function initAICharts() {
  if (window._aiChartsInitialized) return;
  window._aiChartsInitialized = true;

  // Cost
  new Chart(document.getElementById('chartCost'), {
    type: 'bar',
    data: {
      labels: ['DeepSeek', 'Claude 4', 'GPT-4o', 'Qwen', 'Gemini'],
      datasets: [
        { label: 'Input $/1M', data: [0.55, 3.00, 2.50, 0.30, 0.10], backgroundColor: '#00d9ff' },
        { label: 'Output $/1M', data: [2.19, 15.00, 10.00, 0.60, 0.40], backgroundColor: '#7c3aed' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#737373', font: { family: 'monospace', size: 10 } } } },
      scales: {
        x: { ticks: { color: '#737373' }, grid: { color: '#222' } },
        y: { ticks: { color: '#737373' }, grid: { color: '#222' } }
      }
    }
  });

  // Quality vs Price
  new Chart(document.getElementById('chartQuality'), {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Models',
        data: [
          { x: 0.55, y: 94 }, { x: 3.00, y: 96 }, { x: 2.50, y: 95 },
          { x: 0.30, y: 91 }, { x: 0.10, y: 89 }
        ],
        backgroundColor: ['#00d9ff', '#a78bfa', '#3b82f6', '#4ade80', '#facc15'],
        pointRadius: 8
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: 'Price $/1M', color: '#737373' }, ticks: { color: '#737373' }, grid: { color: '#222' } },
        y: { title: { display: true, text: 'Quality %', color: '#737373' }, ticks: { color: '#737373' }, grid: { color: '#222' } }
      }
    }
  });

  // Service Mix
  new Chart(document.getElementById('chartServiceMix'), {
    type: 'polarArea',
    data: {
      labels: ['Consulting 30%', 'Custom Dev 40%', 'Implementation 20%', 'Training 10%'],
      datasets: [{ data: [30, 40, 20, 10], backgroundColor: ['rgba(0,217,255,.6)', 'rgba(124,58,237,.6)', 'rgba(74,222,128,.6)', 'rgba(250,204,21,.6)'], borderWidth: 0 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: '#737373', font: { family: 'monospace', size: 10 }, padding: 10 } } },
      scales: { r: { grid: { color: '#222' }, ticks: { display: false } } }
    }
  });
}

// ========== TASKS ==========
function getTasks() { try { return JSON.parse(localStorage.getItem('devzhub_tasks') || '[]'); } catch(e) { return []; } }
function saveTasks(t) { localStorage.setItem('devzhub_tasks', JSON.stringify(t)); }
function populateTasks() {
  var tasks = getTasks();
  var list = document.getElementById('taskList');
  if (!list) return;
  if (tasks.length === 0) { list.innerHTML = '<div style="color:var(--dim);font-size:10px;padding:8px">No tasks yet</div>'; return; }
  var html = '';
  tasks.forEach(function(t, i) {
    html += '<div class="task-item' + (t.done ? ' completed' : '') + '">' +
      '<input type="checkbox"' + (t.done ? ' checked' : '') + ' onchange="toggleTask(' + i + ')">' +
      '<span class="task-text">' + escHtml(t.text) + '</span>' +
      '<span class="task-tag priority-' + t.priority + '">' + t.priority + '</span>' +
      '<button class="task-del" onclick="deleteTask(' + i + ')">×</button></div>';
  });
  list.innerHTML = html;
}
function addTask() {
  var inp = document.getElementById('newTaskInput');
  var pri = document.getElementById('newTaskPriority').value;
  if (!inp.value.trim()) return;
  var tasks = getTasks();
  tasks.push({ text: inp.value.trim(), priority: pri, done: false, created: Date.now() });
  saveTasks(tasks); inp.value = ''; populateTasks();
}
function toggleTask(i) { var t = getTasks(); if (t[i]) { t[i].done = !t[i].done; saveTasks(t); populateTasks(); } }
function deleteTask(i) { var t = getTasks(); t.splice(i, 1); saveTasks(t); populateTasks(); }
function clearCompletedTasks() { saveTasks(getTasks().filter(function(t) { return !t.done; })); populateTasks(); }

// ========== DEFINITION OF DONE ==========
function getDoD() { try { return JSON.parse(localStorage.getItem('devzhub_dod') || '{}'); } catch(e) { return {}; } }
function populateDoD() {
  var state = getDoD();
  var el = document.getElementById('dodList');
  if (!el) return;
  var html = '';
  JIMBO.dodItems.forEach(function(item, i) {
    var chk = state[i] || false;
    html += '<div class="dod-item' + (chk ? ' checked' : '') + '">' +
      '<input type="checkbox"' + (chk ? ' checked' : '') + ' onchange="toggleDoD(' + i + ')">' +
      '<label>' + item + '</label></div>';
  });
  el.innerHTML = html;
}
function toggleDoD(i) { var s = getDoD(); s[i] = !s[i]; localStorage.setItem('devzhub_dod', JSON.stringify(s)); populateDoD(); }
function resetDoD() { localStorage.removeItem('devzhub_dod'); populateDoD(); }

// ========== NOTES ==========
function loadNotes() { var e = document.getElementById('notesEditor'); if (e) e.value = localStorage.getItem('devzhub_notes') || ''; }
function saveNotes() { var e = document.getElementById('notesEditor'); if (e) { localStorage.setItem('devzhub_notes', e.value); showToast('Notes saved'); } }

// ========== HELPERS ==========
function setText(id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; }
function escHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

// ========== ARCHITECTURE GRAPH INTEGRATION ==========
var GRAPH_API = 'http://localhost:8001/api/nodle';
var GRAPH_FRONTEND = 'http://localhost:5173';

function loadGraphSection() {
  window._graphLoaded = true;
  // Load iframe
  var frame = document.getElementById('graphFrame');
  if (frame && frame.src === 'about:blank') frame.src = GRAPH_FRONTEND;
  // Load summary data
  loadGraphSummary();
}

function loadGraphSummary() {
  fetch(GRAPH_API + '/stats').then(function(r) { return r.json(); }).then(function(stats) {
    setText('graph-nodes', stats.totalNodes);
    setText('graph-edges', stats.totalEdges);
    setText('graph-types', Object.keys(stats.nodeTypes).length);
    setText('graph-labels', stats.edgeLabels.length);
  }).catch(function(e) {
    setText('graph-nodes', 'ERR');
    console.error('Graph stats error:', e);
  });

  fetch(GRAPH_API + '/summary').then(function(r) { return r.json(); }).then(function(data) {
    // Populate node table
    var nt = document.getElementById('graphNodeTable');
    if (nt && data.nodes) {
      var statusColors = { operational: 'b-active', idle: 'b-blue', error: 'b-hot', warning: 'b-warn' };
      var typeIcons = { application: '[AP]', agent: '[AG]', api: '[PI]', kg: '[KG]', infrastructure: '[IF]', vector_db: '[DB]', service: '[SV]', ai: '[AI]', rag: '[RG]' };
      var html = '<tr><th>Node</th><th>Type</th><th>Status</th><th>Description</th></tr>';
      data.nodes.forEach(function(n) {
        html += '<tr>' +
          '<td style="color:var(--accent);font-weight:700">' + escHtml(n.name) + '</td>' +
          '<td>' + (typeIcons[n.type] || '[--]') + ' ' + escHtml(n.type) + '</td>' +
          '<td><span class="badge ' + (statusColors[n.status] || 'b-empty') + '">' + (n.status || 'unknown').toUpperCase() + '</span></td>' +
          '<td style="color:var(--muted);font-size:10px">' + escHtml(n.description) + '</td></tr>';
      });
      nt.innerHTML = html;
    }

    // Populate edge table
    var et = document.getElementById('graphEdgeTable');
    if (et && data.edges) {
      var html2 = '<tr><th>From</th><th>→</th><th>To</th><th>Relationship</th></tr>';
      data.edges.forEach(function(e) {
        html2 += '<tr>' +
          '<td style="color:var(--green)">' + escHtml(e.from) + '</td>' +
          '<td style="color:var(--dim)">→</td>' +
          '<td style="color:var(--accent)">' + escHtml(e.to) + '</td>' +
          '<td><span class="badge b-blue">' + escHtml(e.label) + '</span></td></tr>';
      });
      et.innerHTML = html2;
    }
  }).catch(function(e) {
    console.error('Graph summary error:', e);
    var nt = document.getElementById('graphNodeTable');
    if (nt) nt.innerHTML = '<tr><td colspan="4" style="color:var(--red)">[!!] Cannot connect to Graph API (localhost:8001). Start the backend first.</td></tr>';
  });
}
