/* ============================================================
   WebGate — Cross-Workspace Navigator & Service Monitor
   Connects all workspace folders, Podman containers, and services.
   API: /api/webgate/status, /api/webgate/podman, /api/webgate/services
   ============================================================ */

var WEBGATE_API = '/api/webgate';
var _wgState = {
  workspaces: [],
  services: [],
  podman: { containers: [], version: null },
  browseRoots: [],
  lastRefresh: null,
  refreshing: false,
};

// ========== MAIN LOADER ==========

function wgLoadStatus() {
  if (_wgState.refreshing) return;
  _wgState.refreshing = true;

  // Show loading indicator
  var statusEl = document.getElementById('wgRefreshStatus');
  if (statusEl) statusEl.textContent = 'Ladowanie...';

  fetch(WEBGATE_API + '/status')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      _wgState.workspaces = data.workspaces || [];
      _wgState.services = data.services || [];
      _wgState.podman = data.podman || { containers: [] };
      _wgState.browseRoots = data.browseRoots || [];
      _wgState.lastRefresh = new Date();
      _wgState.refreshing = false;

      wgRenderAll();

      if (statusEl) statusEl.textContent = 'Ostatnia aktualizacja: ' + _wgState.lastRefresh.toLocaleTimeString('pl-PL');
    })
    .catch(function(e) {
      console.error('WebGate status error:', e);
      _wgState.refreshing = false;
      if (statusEl) statusEl.textContent = '[!!] Blad ladowania';
    });
}

// ========== RENDER ALL ==========

function wgRenderAll() {
  wgRenderWorkspaces();
  wgRenderServices();
  wgRenderPodman();
  wgRenderConnections();
}

// ========== WORKSPACES ==========

function wgRenderWorkspaces() {
  var el = document.getElementById('wgWorkspaceGrid');
  if (!el) return;
  var html = '';
  _wgState.workspaces.forEach(function(ws) {
    var cls = ws.exists ? 'wg-ws-card' : 'wg-ws-card wg-ws-offline';
    var browseBtn = '';
    if (ws.browseRoot) {
      browseBtn = '<button class="wg-btn wg-btn-browse" onclick="openBrowseModal(\'' + ws.browseRoot + '\')">[>>] Przegladaj</button>';
    }
    html += '<div class="' + cls + '">' +
      '<div class="wg-ws-header">' +
        '<span class="wg-ws-icon">' + ws.icon + '</span>' +
        '<span class="wg-ws-label">' + escHtml(ws.label) + '</span>' +
        '<span class="wg-ws-status ' + (ws.exists ? 'wg-online' : 'wg-offline') + '">' +
          (ws.exists ? 'OK' : 'MISSING') + '</span>' +
      '</div>' +
      '<div class="wg-ws-path">' + escHtml(ws.path) + '</div>' +
      '<div class="wg-ws-meta">' +
        '<span>' + ws.files + ' plikow</span>' +
        '<span>' + ws.folders + ' folderow</span>' +
      '</div>' +
      '<div class="wg-ws-actions">' + browseBtn + '</div>' +
    '</div>';
  });
  el.innerHTML = html;
}

// ========== SERVICES ==========

function wgRenderServices() {
  var el = document.getElementById('wgServiceTable');
  if (!el) return;
  var html = '<tr><th>Serwis</th><th>Port</th><th>Status</th><th>Akcja</th></tr>';
  _wgState.services.forEach(function(svc) {
    var badge = svc.alive
      ? '<span class="badge b-active">ONLINE</span>'
      : '<span class="badge b-err">OFFLINE</span>';
    var link = svc.url && svc.alive
      ? '<a href="' + svc.url + '" target="_blank" class="wg-link">[>>] Otworz</a>'
      : '<span style="color:var(--dim)">---</span>';
    html += '<tr>' +
      '<td>' + svc.icon + ' ' + escHtml(svc.name) + '</td>' +
      '<td><code>' + svc.port + '</code></td>' +
      '<td>' + badge + '</td>' +
      '<td>' + link + '</td>' +
    '</tr>';
  });
  el.innerHTML = html;
}

// ========== PODMAN ==========

function wgRenderPodman() {
  var el = document.getElementById('wgPodmanInfo');
  if (!el) return;

  var p = _wgState.podman;
  var html = '';

  // Header
  html += '<div class="wg-podman-header">';
  if (p.installed) {
    html += '<span class="badge b-active">INSTALLED</span> ';
    html += '<span style="color:var(--dim);font-size:10px">' + escHtml(p.version || '') + '</span>';
  } else {
    html += '<span class="badge b-err">NOT FOUND</span>';
  }
  if (p.error) {
    html += '<div style="color:var(--red);font-size:10px;margin-top:4px">' + escHtml(p.error) + '</div>';
  }
  html += '</div>';

  // Containers
  var containers = p.containers || [];
  if (containers.length === 0) {
    html += '<div style="color:var(--dim);font-size:11px;padding:8px">Brak kontenerow</div>';
  } else {
    html += '<table class="wg-podman-table">';
    html += '<tr><th>Kontener</th><th>Image</th><th>Status</th></tr>';
    containers.forEach(function(c) {
      var stateCls = 'b-err';
      if (c.state === 'running') stateCls = 'b-active';
      else if (c.state === 'created') stateCls = 'b-warn';
      html += '<tr>' +
        '<td>' + escHtml(c.name) + '</td>' +
        '<td style="color:var(--dim);font-size:10px;max-width:200px;overflow:hidden;text-overflow:ellipsis">' + escHtml(c.image || '---') + '</td>' +
        '<td><span class="badge ' + stateCls + '">' + escHtml(c.state || 'unknown').toUpperCase() + '</span></td>' +
      '</tr>';
    });
    html += '</table>';
  }

  el.innerHTML = html;
}

// ========== CONNECTIONS MAP ==========

function wgRenderConnections() {
  var el = document.getElementById('wgConnectionMap');
  if (!el) return;

  // Build connection data from workspaces and services
  var connections = [];

  // A0 containers -> services
  var a0Containers = (_wgState.podman.containers || []).filter(function(c) {
    return c.name && c.name.indexOf('agent-zero') >= 0;
  });
  a0Containers.forEach(function(c) {
    connections.push({
      from: '[A0] ' + c.name,
      to: c.state === 'running' ? 'Port 50001/9000' : '(stopped)',
      type: c.state === 'running' ? 'active' : 'inactive',
      rel: 'Podman Container',
    });
  });

  // Dashboard -> API
  connections.push({
    from: '[DS] Dashboard',
    to: '[GR] Graph API :8001',
    type: _wgState.services.find(function(s) { return s.port === 8001; })?.alive ? 'active' : 'inactive',
    rel: 'REST API',
  });

  // Dashboard -> Browse roots
  _wgState.browseRoots.forEach(function(r) {
    connections.push({
      from: '[DS] Dashboard',
      to: r.icon + ' ' + r.label,
      type: r.exists ? 'active' : 'inactive',
      rel: 'File Browse',
    });
  });

  // Gateway Web -> OpenRouter
  connections.push({
    from: '[GW] Gateway :18790',
    to: 'OpenRouter API',
    type: _wgState.services.find(function(s) { return s.port === 18790; })?.alive ? 'active' : 'inactive',
    rel: 'AI Proxy',
  });

  // Render table
  var html = '<tr><th>Zrodlo</th><th></th><th>Cel</th><th>Polaczenie</th></tr>';
  connections.forEach(function(c) {
    var arrow = c.type === 'active'
      ? '<span style="color:var(--accent)">→</span>'
      : '<span style="color:var(--red)">✗</span>';
    html += '<tr>' +
      '<td>' + escHtml(c.from) + '</td>' +
      '<td style="text-align:center">' + arrow + '</td>' +
      '<td>' + escHtml(c.to) + '</td>' +
      '<td><span class="badge ' + (c.type === 'active' ? 'b-active' : 'b-err') + '">' + c.rel + '</span></td>' +
    '</tr>';
  });
  el.innerHTML = html;
}

// ========== HELPERS ==========

function escHtml(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ========== AUTO-LOAD ON SECTION VISIBLE ==========

(function() {
  // Patch showSection to auto-load WebGate when visible
  var _origShowSection = window.showSection;
  if (_origShowSection) {
    window.showSection = function(btn, sectionId) {
      _origShowSection(btn, sectionId);
      if (sectionId === 'sec-webgate' && !_wgState.lastRefresh) {
        wgLoadStatus();
      }
    };
  }
})();
