/* ============================================================
   DEVz HUB — Agent ChatBox + Fleet Control
   Chat connected to Knowledge Base, Libraries & Agent Fleet
   API: http://localhost:8001/api/chat/*
         http://localhost:8001/api/agents/*
   ============================================================ */

var CHAT_API = 'http://localhost:8001/api';

// ========== AGENT FLEET DATA ==========
var AGENT_FLEET = [
  { id: 'jimbo',    name: 'Jimbo',    role: 'Orchestrator & Lead',      tag: '[JM]', status: 'active',  tasks: 'All ops',         color: '#00d9ff', model: 'Claude 4.5 Sonnet' },
  { id: 'elwirka',  name: 'Elwirka',  role: 'E-commerce Specialist',    tag: '[EL]', status: 'active',  tasks: 'Product, SEO',    color: '#f472b6', model: 'GPT-4o' },
  { id: 'norbert',  name: 'Norbert',  role: 'Research & Data',          tag: '[NR]', status: 'standby', tasks: 'Analysis',        color: '#7c3aed', model: 'DeepSeek R1' },
  { id: 'zbychu',   name: 'Zbychu',   role: 'Automation & DevOps',      tag: '[ZB]', status: 'standby', tasks: 'CI/CD, Infra',    color: '#facc15', model: 'Qwen 2.5' },
  { id: 'angels',   name: 'Angels',   role: 'Quality Control',          tag: '[AN]', status: 'standby', tasks: 'Review, Test',    color: '#4ade80', model: 'Gemini Flash' }
];

var agChatHistory = [];
var agSelectedAgent = 'all';
var agSelectedLibrary = '';

// ========== INIT (called when Agents section opens) ==========
function initAgentChat() {
  if (window._agentChatInitialized) return;
  window._agentChatInitialized = true;
  renderFleetGrid();
  renderAgentButtons();
  loadChatLibraries();
  loadChatHistory();
  updateAgentStats();
}

// ========== FLEET GRID ==========
function renderFleetGrid() {
  var grid = document.getElementById('agFleetGrid');
  if (!grid) return;
  var html = '';
  AGENT_FLEET.forEach(function(agent) {
    var isActive = agent.status === 'active';
    html += '<div class="ag-agent-card' + (isActive ? ' ag-active' : ' ag-standby') + '" id="ag-card-' + agent.id + '">' +
      '<div class="ag-agent-header">' +
        '<span class="ag-agent-tag" style="color:' + agent.color + '">' + agent.tag + '</span>' +
        '<span class="ag-agent-name">' + agent.name + '</span>' +
        '<span class="badge ' + (isActive ? 'b-active' : 'b-blue') + '" id="ag-badge-' + agent.id + '">' + agent.status.toUpperCase() + '</span>' +
      '</div>' +
      '<div class="ag-agent-role">' + agent.role + '</div>' +
      '<div class="ag-agent-meta">' +
        '<span>Model: ' + agent.model + '</span>' +
        '<span>Tasks: ' + agent.tasks + '</span>' +
      '</div>' +
      '<div class="ag-agent-actions">' +
        '<button class="ag-btn' + (isActive ? ' ag-btn-danger' : ' ag-btn-success') + '" onclick="agToggleAgent(\'' + agent.id + '\')">' +
          (isActive ? '[SB] Standby' : '[ON] Activate') +
        '</button>' +
        '<button class="ag-btn" onclick="agChatQuick(\'/agent ' + agent.id + ' \')">[>>] Chat</button>' +
        '<button class="ag-btn" onclick="agAssignTask(\'' + agent.id + '\')"> [TK] Task</button>' +
      '</div>' +
    '</div>';
  });
  grid.innerHTML = html;
}

// ========== AGENT BUTTONS IN CHAT ==========
function renderAgentButtons() {
  var bar = document.getElementById('agChatAgentBar');
  if (!bar) return;
  var html = '<span class="ag-chat-agent-label">Target:</span>' +
    '<button class="ag-chat-agent-btn active" data-agent="all" onclick="agChatSelectAgent(this,\'all\')"> [ALL]</button>';
  AGENT_FLEET.forEach(function(agent) {
    html += '<button class="ag-chat-agent-btn" data-agent="' + agent.id + '" onclick="agChatSelectAgent(this,\'' + agent.id + '\')">' +
      agent.tag + ' ' + agent.name + '</button>';
  });
  bar.innerHTML = html;
}

// ========== AGENT TOGGLE ==========
function agToggleAgent(id) {
  var agent = AGENT_FLEET.find(function(a) { return a.id === id; });
  if (!agent) return;
  agent.status = agent.status === 'active' ? 'standby' : 'active';
  renderFleetGrid();
  updateAgentStats();
  agAddSystemMessage(agent.tag + ' ' + agent.name + ' >> ' + agent.status.toUpperCase());

  // Try to persist to backend
  fetch(CHAT_API + '/agents/' + id + '/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: agent.status })
  }).catch(function() {});
}

function agActivateAll() {
  AGENT_FLEET.forEach(function(a) { a.status = 'active'; });
  renderFleetGrid();
  updateAgentStats();
  agAddSystemMessage('[ON] Wszyscy agenci aktywowani');
}

function agStandbyAll() {
  AGENT_FLEET.forEach(function(a) { a.status = 'standby'; });
  renderFleetGrid();
  updateAgentStats();
  agAddSystemMessage('[SB] Wszyscy agenci w trybie standby');
}

function agRefreshStatus() {
  fetch(CHAT_API + '/agents').then(function(r) { return r.json(); }).then(function(data) {
    if (data.agents) {
      data.agents.forEach(function(serverAgent) {
        var local = AGENT_FLEET.find(function(a) { return a.id === serverAgent.id; });
        if (local) local.status = serverAgent.status;
      });
    }
    renderFleetGrid();
    updateAgentStats();
    showToast('[AG] Agent status refreshed');
  }).catch(function() {
    showToast('[AG] Using local agent data');
    renderFleetGrid();
    updateAgentStats();
  });
}

function agAssignTask(agentId) {
  var task = prompt('Przypisz zadanie dla ' + agentId + ':');
  if (!task) return;
  var agent = AGENT_FLEET.find(function(a) { return a.id === agentId; });
  if (agent) {
    agent.tasks = task;
    renderFleetGrid();
    agAddSystemMessage('[TK] Zadanie przypisane do ' + agent.tag + ' ' + agent.name + ': ' + task);
  }
}

// ========== CHAT LIBRARIES ==========
function loadChatLibraries() {
  var select = document.getElementById('agChatLibrary');
  if (!select) return;

  fetch(CHAT_API + '/chat/libraries').then(function(r) { return r.json(); }).then(function(data) {
    var libs = data.libraries || [];
    var html = '<option value="">[ALL] Wszystkie biblioteki</option>';
    libs.forEach(function(lib) {
      var status = lib.exists ? '' : ' (offline)';
      html += '<option value="' + lib.id + '">[LB] ' + lib.name + status + '</option>';
    });
    select.innerHTML = html;
    setText('agStatLibs', libs.length.toString());
    setText('agStatKB', libs.filter(function(l) { return l.exists; }).length + '/' + libs.length);
  }).catch(function() {
    setText('agStatLibs', '6');
    setText('agStatKB', 'offline');
  });
}

function agChatSwitchLibrary(value) {
  agSelectedLibrary = value;
  var libName = value ? document.querySelector('#agChatLibrary option[value="' + value + '"]').textContent : 'Wszystkie';
  agAddSystemMessage('[LB] Biblioteka: ' + libName);
}

// ========== CHAT HISTORY ==========
function loadChatHistory() {
  fetch(CHAT_API + '/chat/history?limit=30').then(function(r) { return r.json(); }).then(function(data) {
    agChatHistory = data.messages || [];
    setText('agStatMessages', data.total.toString());
    renderChatMessages();
  }).catch(function() {
    setText('agStatMessages', '0');
  });
}

// ========== RENDER MESSAGES ==========
function renderChatMessages() {
  var container = document.getElementById('agChatMessages');
  if (!container) return;

  if (agChatHistory.length === 0) {
    container.innerHTML = '<div class="ag-chat-welcome">' +
      '<div style="color:var(--accent);font-weight:700;margin-bottom:8px">[>>] AGENT CHATBOX</div>' +
      '<div>Polaczony z <strong>6 bibliotekami</strong> i <strong>5 agentami</strong>.</div>' +
      '<div style="margin-top:4px;color:var(--dim)">Zadaj pytanie, przeszukaj wiedze, lub wydaj komende agentowi.</div>' +
    '</div>';
    return;
  }

  var html = '';
  agChatHistory.forEach(function(msg) {
    if (msg.role === 'system') {
      html += '<div class="ag-chat-msg ag-msg-system">' +
        '<div class="ag-msg-text">' + escHtml(msg.message) + '</div>' +
      '</div>';
    } else if (msg.role === 'user') {
      html += '<div class="ag-chat-msg ag-msg-user">' +
        '<div class="ag-msg-header"><span class="ag-msg-sender">[>>] Ty</span><span class="ag-msg-time">' + formatTime(msg.timestamp) + '</span></div>' +
        '<div class="ag-msg-text">' + escHtml(msg.message) + '</div>' +
      '</div>';
    } else if (msg.role === 'assistant') {
      var agentTag = '[SY]';
      var agentName = 'System';
      if (msg.agent) {
        var ag = AGENT_FLEET.find(function(a) { return a.id === msg.agent; });
        if (ag) { agentTag = ag.tag; agentName = ag.name; }
      }
      html += '<div class="ag-chat-msg ag-msg-assistant">' +
        '<div class="ag-msg-header"><span class="ag-msg-sender">' + agentTag + ' ' + agentName + '</span><span class="ag-msg-time">' + formatTime(msg.timestamp) + '</span></div>' +
        '<div class="ag-msg-text">' + formatMarkdown(msg.message) + '</div>';

      // Sources
      if (msg.sources && msg.sources.length > 0) {
        html += '<details class="ag-msg-sources"><summary>[SR] ' + msg.sources.length + ' zrodel</summary><div class="ag-sources-list">';
        msg.sources.forEach(function(src) {
          html += '<div class="ag-source-item">' +
            '<span class="ag-source-lib">' + (src.library_name || src.library) + '</span>' +
            '<span class="ag-source-file">' + src.file + '</span>' +
            '<span class="ag-source-score">score:' + src.score + '</span>' +
          '</div>';
        });
        html += '</div></details>';
      }
      html += '</div>';
    }
  });
  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
}

// ========== SEND MESSAGE ==========
function agChatSend() {
  var input = document.getElementById('agChatInput');
  var message = (input.value || '').trim();
  if (!message) return;

  input.value = '';
  input.style.height = 'auto';

  // Handle special commands
  if (message.startsWith('/')) {
    handleCommand(message);
    return;
  }

  // Add user message
  var userMsg = { role: 'user', message: message, timestamp: new Date().toISOString() };
  agChatHistory.push(userMsg);
  renderChatMessages();

  // Disable send
  var btn = document.getElementById('agChatSendBtn');
  if (btn) { btn.disabled = true; btn.textContent = '...'; }

  // Determine target
  var targetAgent = agSelectedAgent !== 'all' ? agSelectedAgent : null;
  var useKB = document.getElementById('agChatUseKB').checked;
  var library = agSelectedLibrary || null;

  // Send to API
  fetch(CHAT_API + '/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message,
      library: library,
      useKB: useKB,
      agent: targetAgent
    })
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (data.assistantMessage) {
      agChatHistory.push(data.assistantMessage);
    }
    renderChatMessages();
    updateAgentStats();
  }).catch(function(err) {
    agChatHistory.push({
      role: 'assistant',
      message: '[!!] Blad polaczenia z API: ' + err.message + '\nUpewnij sie, ze backend dziala na porcie 8001.',
      timestamp: new Date().toISOString(),
      sources: []
    });
    renderChatMessages();
  }).finally(function() {
    if (btn) { btn.disabled = false; btn.textContent = '[>>]'; }
  });
}

// ========== COMMANDS ==========
function handleCommand(cmd) {
  var parts = cmd.split(/\s+/);
  var command = parts[0].toLowerCase();

  switch (command) {
    case '/search':
      var query = parts.slice(1).join(' ');
      if (!query) { agAddSystemMessage('[!!] Uzyj: /search <zapytanie>'); return; }
      agChatSearchKB(query);
      break;

    case '/agent':
      var agentId = parts[1];
      var agentCmd = parts.slice(2).join(' ');
      if (!agentId) { agAddSystemMessage('[!!] Uzyj: /agent <nazwa> <komenda>'); return; }
      agChatAgentCommand(agentId, agentCmd);
      break;

    case '/status':
      agShowFleetStatus();
      break;

    case '/libs':
    case '/libraries':
      agShowLibraries();
      break;

    case '/help':
      agAddSystemMessage(
        '[HP] Komendy:\n' +
        '/search <query> — Przeszukaj baze wiedzy\n' +
        '/agent <id> <cmd> — Wydaj komende agentowi\n' +
        '/status — Pokaz status floty\n' +
        '/libs — Pokaz biblioteki\n' +
        '/help — Ta pomoc'
      );
      break;

    default:
      agAddSystemMessage('[??] Nieznana komenda: ' + command + '. Wpisz /help');
  }
}

function agChatSearchKB(query) {
  agAddSystemMessage('[SR] Szukam: "' + query + '"...');

  fetch(CHAT_API + '/chat/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: query,
      library: agSelectedLibrary || null,
      limit: 10
    })
  }).then(function(r) { return r.json(); }).then(function(data) {
    var results = data.results || [];
    if (results.length === 0) {
      agChatHistory.push({
        role: 'assistant',
        message: '[SR] Brak wynikow dla: "' + query + '"',
        timestamp: new Date().toISOString(),
        sources: []
      });
    } else {
      var msg = '[SR] Znaleziono **' + results.length + '** wynikow:\n\n';
      results.forEach(function(r, i) {
        msg += '**' + (i + 1) + '.** ' + r.library_name + ' >> `' + r.file + '` (score: ' + r.score + ')\n';
        if (r.snippet) msg += '> ' + r.snippet.substring(0, 150) + '...\n\n';
      });
      agChatHistory.push({
        role: 'assistant',
        message: msg,
        timestamp: new Date().toISOString(),
        sources: results
      });
    }
    renderChatMessages();
  }).catch(function(err) {
    agAddSystemMessage('[!!] Blad wyszukiwania: ' + err.message);
  });
}

function agChatAgentCommand(agentId, cmd) {
  var agent = AGENT_FLEET.find(function(a) { return a.id === agentId.toLowerCase() || a.name.toLowerCase() === agentId.toLowerCase(); });
  if (!agent) {
    agAddSystemMessage('[??] Nieznany agent: ' + agentId + '. Dostepni: ' + AGENT_FLEET.map(function(a) { return a.id; }).join(', '));
    return;
  }

  if (!cmd) {
    // Show agent info
    agChatHistory.push({
      role: 'assistant',
      message: agent.tag + ' **' + agent.name + '** — ' + agent.role + '\n' +
        'Status: ' + agent.status.toUpperCase() + '\n' +
        'Model: ' + agent.model + '\n' +
        'Tasks: ' + agent.tasks,
      timestamp: new Date().toISOString(),
      agent: agent.id,
      sources: []
    });
    renderChatMessages();
    return;
  }

  // Route command to agent
  agChatHistory.push({ role: 'user', message: '/agent ' + agent.id + ' ' + cmd, timestamp: new Date().toISOString() });

  // Send as chat with agent context
  fetch(CHAT_API + '/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: cmd,
      agent: agent.id,
      useKB: document.getElementById('agChatUseKB').checked,
      library: agSelectedLibrary || null
    })
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (data.assistantMessage) {
      data.assistantMessage.agent = agent.id;
      agChatHistory.push(data.assistantMessage);
    }
    renderChatMessages();
  }).catch(function(err) {
    agAddSystemMessage('[!!] ' + agent.name + ' nie odpowiada: ' + err.message);
  });
}

function agShowFleetStatus() {
  var lines = ['[AG] **Agent Fleet Status:**\n'];
  AGENT_FLEET.forEach(function(a) {
    var icon = a.status === 'active' ? '[ON]' : '[SB]';
    lines.push(icon + ' **' + a.name + '** — ' + a.role + ' [' + a.status.toUpperCase() + '] — ' + a.model);
  });
  var active = AGENT_FLEET.filter(function(a) { return a.status === 'active'; }).length;
  lines.push('\n[++] Active: ' + active + '/' + AGENT_FLEET.length);
  agChatHistory.push({
    role: 'assistant',
    message: lines.join('\n'),
    timestamp: new Date().toISOString(),
    sources: []
  });
  renderChatMessages();
}

function agShowLibraries() {
  fetch(CHAT_API + '/chat/libraries').then(function(r) { return r.json(); }).then(function(data) {
    var libs = data.libraries || [];
    var lines = ['[LB] **Dostepne biblioteki:**\n'];
    libs.forEach(function(lib) {
      var status = lib.exists ? '[ON]' : '[--]';
      lines.push(status + ' [LB] **' + lib.name + '** — ' + lib.description);
    });
    agChatHistory.push({
      role: 'assistant',
      message: lines.join('\n'),
      timestamp: new Date().toISOString(),
      sources: []
    });
    renderChatMessages();
  }).catch(function(err) {
    agAddSystemMessage('[!!] Nie moge pobrac listy bibliotek: ' + err.message);
  });
}

// ========== CHAT HELPERS ==========
function agChatSelectAgent(btn, agentId) {
  agSelectedAgent = agentId;
  document.querySelectorAll('.ag-chat-agent-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  var label = agentId === 'all' ? 'Wszyscy agenci' : AGENT_FLEET.find(function(a) { return a.id === agentId; }).name;
  agAddSystemMessage('[>>] Target: ' + label);
}

function agChatQuick(text) {
  var input = document.getElementById('agChatInput');
  if (input) {
    input.value = text;
    input.focus();
  }
}

function agChatClear() {
  agChatHistory = [];
  renderChatMessages();
  fetch(CHAT_API + '/chat/clear', { method: 'POST' }).catch(function() {});
  showToast('[CB] Chat cleared');
}

function agChatKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    agChatSend();
  }
  // Auto-resize
  var ta = e.target;
  setTimeout(function() {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, 0);
}

function agAddSystemMessage(text) {
  agChatHistory.push({ role: 'system', message: text, timestamp: new Date().toISOString() });
  renderChatMessages();
}

function updateAgentStats() {
  var active = AGENT_FLEET.filter(function(a) { return a.status === 'active'; }).length;
  var standby = AGENT_FLEET.length - active;
  setText('agStatActive', active.toString());
  setText('agStatStandby', standby.toString());
  setText('agStatMessages', agChatHistory.length.toString());
}

// ========== FORMATTING ==========
function formatTime(ts) {
  if (!ts) return '';
  try {
    var d = new Date(ts);
    return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  } catch(e) { return ''; }
}

function formatMarkdown(text) {
  if (!text) return '';
  // Basic markdown rendering
  var html = escHtml(text);
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Inline code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  // Line breaks
  html = html.replace(/\n/g, '<br>');
  // Blockquotes
  html = html.replace(/(^|<br>)&gt;\s*(.+?)(?=<br>|$)/g, '$1<span class="ag-blockquote">$2</span>');
  return html;
}

// ========== HOOK INTO SECTION NAV ==========
var _origShowSection = window.showSection;
window.showSection = function(btn, id) {
  _origShowSection(btn, id);
  if (id === 'sec-agents') initAgentChat();
};

// Also init if already on agents section
document.addEventListener('DOMContentLoaded', function() {
  var agSec = document.getElementById('sec-agents');
  if (agSec && agSec.classList.contains('active')) initAgentChat();
});
