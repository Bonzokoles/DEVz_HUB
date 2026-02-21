/* ============================================================
   File Browser — generic reader for KB, Libraries, Control Center
   Click on any tile to browse files and read content.
   API: /api/browse/categories?root=X, /api/browse/files, /api/browse/read
   ============================================================ */

var BROWSE_API = '/api/browse';
var _browseRootLabels = { kb: 'Knowledge Base', lib: 'Libraries', cc: 'Control Center', a0: 'Agent Zero' };
var _browseRootIcons  = { kb: '[KB]', lib: '[LB]', cc: '[CC]', a0: '[A0]' };
var _kbState = {
  root: 'kb',
  categories: [],
  currentCat: null,
  currentFile: null,
  files: [],
  _lastContent: null,
  _lastData: null
};

// ========== MODAL OPEN/CLOSE ==========

/**
 * Open the browser modal for any root.
 * @param {string} root - 'kb' | 'lib' | 'cc'
 * @param {string} [categoryName] - optional category to auto-select
 */
function openBrowseModal(root, categoryName) {
  _kbState.root = root || 'kb';
  var modal = document.getElementById('kbModal');
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Update modal title
  var titleEl = document.getElementById('kbModalTitle');
  if (titleEl) titleEl.textContent = (_browseRootIcons[_kbState.root] || '') + ' ' + (_browseRootLabels[_kbState.root] || _kbState.root);

  // Load sidebar categories
  loadKBCategories(function() {
    if (categoryName) {
      kbSelectCategory(categoryName);
    }
  });

  // ESC to close
  document.addEventListener('keydown', _kbEscHandler);
}

// Legacy wrapper — KB only
function openKBModal(categoryName) { openBrowseModal('kb', categoryName); }
function openCCModal(categoryName)  { openBrowseModal('cc', categoryName); }
function openLibModal(categoryName) { openBrowseModal('lib', categoryName); }
function openA0Modal(categoryName)  { openBrowseModal('a0', categoryName); }

function closeKBModal() {
  var modal = document.getElementById('kbModal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', _kbEscHandler);
}

function _kbEscHandler(e) {
  if (e.key === 'Escape') closeKBModal();
}

// ========== SIDEBAR CATEGORIES ==========

function loadKBCategories(callback) {
  fetch(BROWSE_API + '/categories?root=' + encodeURIComponent(_kbState.root))
    .then(function(r) { return r.json(); })
    .then(function(resp) {
      var cats = resp.categories || resp;
      _kbState.categories = cats;
      renderKBSidebar(cats);
      if (callback) callback();
    })
    .catch(function(e) {
      console.error('Browse categories error:', e);
      var el = document.getElementById('kbSidebarList');
      if (el) el.innerHTML = '<div style="padding:12px;color:var(--red);font:10px monospace">[!!] Nie mozna zaladowac kategorii</div>';
    });
}

function renderKBSidebar(cats) {
  var el = document.getElementById('kbSidebarList');
  if (!el) return;
  var html = '';
  cats.forEach(function(cat) {
    var isEmpty = cat.files === 0;
    var isActive = _kbState.currentCat === cat.name;
    html += '<div class="kb-cat-item' + (isEmpty ? ' empty' : '') + (isActive ? ' active' : '') + '" ' +
      'onclick="kbSelectCategory(\'' + escAttr(cat.name) + '\')" ' +
      'data-cat="' + escAttr(cat.name.toLowerCase()) + '">' +
      '<span>' + escHtml(cat.name) + '</span>' +
      '<span class="kb-cat-count">' + cat.files + '</span>' +
    '</div>';
  });
  el.innerHTML = html;
}

function filterKBSidebar(q) {
  q = q.toLowerCase();
  document.querySelectorAll('.kb-cat-item').forEach(function(el) {
    var name = el.getAttribute('data-cat') || '';
    el.style.display = name.includes(q) ? '' : 'none';
  });
}

// ========== SELECT CATEGORY → SHOW FILES ==========

function kbSelectCategory(catName) {
  _kbState.currentCat = catName;
  _kbState.currentFile = null;

  // Highlight sidebar
  document.querySelectorAll('.kb-cat-item').forEach(function(el) {
    el.classList.toggle('active', el.textContent.trim().startsWith(catName));
  });

  // Update breadcrumb
  var rootLabel = _browseRootLabels[_kbState.root] || _kbState.root;
  var bc = document.getElementById('kbBreadcrumb');
  if (bc) {
    bc.innerHTML = '<a onclick="kbShowCategories()">' + escHtml(rootLabel) + '</a>' +
      '<span style="color:var(--dim)">/</span>' +
      '<span style="color:var(--text)">' + escHtml(catName) + '</span>';
  }

  // Hide reader, show file list
  var reader = document.getElementById('kbReader');
  var fileList = document.getElementById('kbFileList');
  if (reader) reader.classList.remove('active');
  if (fileList) fileList.style.display = '';

  // Load files
  if (fileList) fileList.innerHTML = '<div class="kb-empty-state">Ladowanie...</div>';

  fetch(BROWSE_API + '/files?root=' + encodeURIComponent(_kbState.root) + '&cat=' + encodeURIComponent(catName))
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) {
        fileList.innerHTML = '<div class="kb-empty-state">[!!] ' + escHtml(data.error) + '</div>';
        return;
      }
      _kbState.files = data.files || [];
      renderKBFiles(data.files, catName);
    })
    .catch(function(e) {
      console.error('KB files error:', e);
      if (fileList) fileList.innerHTML = '<div class="kb-empty-state">[!!] Blad ladowania plikow</div>';
    });
}

function renderKBFiles(files, catName) {
  var el = document.getElementById('kbFileList');
  if (!el) return;

  if (!files || files.length === 0) {
    el.innerHTML = '<div class="kb-empty-state">Ten folder jest pusty.<br>Dodaj pliki do: ' + escHtml(_browseRootLabels[_kbState.root] || _kbState.root) + '/' + escHtml(catName) + '/</div>';
    return;
  }

  var html = '';
  files.forEach(function(f) {
    var extClass = f.ext.replace('.', '');
    html += '<div class="kb-file-item" onclick="kbReadFile(\'' + escAttr(catName) + '\',\'' + escAttr(f.name) + '\')">' +
      '<span class="kb-file-ext ' + extClass + '">' + escHtml(f.ext.replace('.', '')) + '</span>' +
      '<span class="kb-file-name">' + escHtml(formatFileName(f.name)) + '</span>' +
      '<span class="kb-file-size">' + escHtml(f.sizeHuman) + '</span>' +
      (f.readable ? '<span class="kb-file-open">OPEN</span>' : '<span class="kb-file-size" style="color:var(--dim)">--</span>') +
    '</div>';
  });
  el.innerHTML = html;
}

// ========== READ FILE ==========

function kbReadFile(catName, fileName) {
  _kbState.currentFile = fileName;

  // Update breadcrumb
  var rootLabel = _browseRootLabels[_kbState.root] || _kbState.root;
  var bc = document.getElementById('kbBreadcrumb');
  if (bc) {
    bc.innerHTML = '<a onclick="kbShowCategories()">' + escHtml(rootLabel) + '</a>' +
      '<span style="color:var(--dim)">/</span>' +
      '<a onclick="kbSelectCategory(\'' + escAttr(catName) + '\')">' + escHtml(catName) + '</a>' +
      '<span style="color:var(--dim)">/</span>' +
      '<span style="color:var(--text)">' + escHtml(truncateFileName(fileName, 60)) + '</span>';
  }

  // Hide file list, show reader
  var fileList = document.getElementById('kbFileList');
  var reader = document.getElementById('kbReader');
  if (fileList) fileList.style.display = 'none';
  if (reader) {
    reader.classList.add('active');
    reader.innerHTML = '<div class="kb-empty-state">Ladowanie pliku...</div>';
  }

  fetch(BROWSE_API + '/read?root=' + encodeURIComponent(_kbState.root) + '&cat=' + encodeURIComponent(catName) + '&file=' + encodeURIComponent(fileName))
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) {
        reader.innerHTML = '<div class="kb-empty-state">[!!] ' + escHtml(data.error) + '</div>';
        return;
      }
      renderKBContent(data);
    })
    .catch(function(e) {
      console.error('KB read error:', e);
      if (reader) reader.innerHTML = '<div class="kb-empty-state">[!!] Blad odczytu pliku</div>';
    });
}

function renderKBContent(data) {
  var reader = document.getElementById('kbReader');
  if (!reader) return;

  var meta = '<div class="kb-reader-meta">' +
    '<strong style="color:var(--accent)">' + escHtml(data.name) + '</strong><br>' +
    'Kategoria: ' + escHtml(data.category) +
    ' | Rozmiar: ' + escHtml(data.sizeHuman) +
    ' | Linii: ' + data.lines +
    ' | Typ: ' + escHtml(data.ext) +
    ' <button class="kb-file-open" style="opacity:1;margin-left:12px" onclick="kbCopyContent()">COPY</button>' +
    ' <button class="kb-file-open" style="opacity:1;margin-left:4px;background:var(--green);color:#000" onclick="kbConvertToHTML()">HTML</button>' +
  '</div>';

  var content;
  if (data.ext === '.md') {
    content = '<div class="kb-reader-content">' + renderMarkdown(data.content) + '</div>';
  } else if (data.ext === '.json') {
    try {
      var pretty = JSON.stringify(JSON.parse(data.content), null, 2);
      content = '<pre class="kb-reader-content" style="white-space:pre;font-size:11px">' + escHtml(pretty) + '</pre>';
    } catch(e) {
      content = '<pre class="kb-reader-content">' + escHtml(data.content) + '</pre>';
    }
  } else {
    content = '<pre class="kb-reader-content">' + escHtml(data.content) + '</pre>';
  }

  reader.innerHTML = meta + content;
  reader.scrollTop = 0;
  _kbState._lastContent = data.content;
  _kbState._lastData = data;
}

// ========== CONVERT TO HTML ==========

function kbConvertToHTML() {
  var data = _kbState._lastData;
  if (!data || !data.content) { showToast('Brak tresci do konwersji'); return; }

  var title = data.name.replace(/_20\d{6}_\d{6}/, '').replace(/\.[^.]+$/, '').replace(/_/g, ' ');
  var bodyHTML = '';

  if (data.ext === '.md') {
    bodyHTML = convertMdToRichHTML(data.content);
  } else if (data.ext === '.json') {
    bodyHTML = convertJsonToRichHTML(data.content);
  } else {
    bodyHTML = '<pre>' + escHtml(data.content) + '</pre>';
  }

  var fullPage = '<!DOCTYPE html>\n<html lang="pl">\n<head>\n' +
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + escHtml(title) + ' — DEVz Knowledge Base</title>\n' +
    '<style>\n' + getKBHtmlStyles() + '\n</style>\n' +
    '</head>\n<body>\n' +
    '<header>\n' +
    '  <div class="header-badge">' + (_browseRootIcons[_kbState.root] || '[KB]') + '</div>\n' +
    '  <div>\n' +
    '    <h1>' + escHtml(title) + '</h1>\n' +
    '    <div class="meta-row">\n' +
    '      <span class="tag">' + escHtml(data.category) + '</span>\n' +
    '      <span class="sep">|</span>\n' +
    '      <span>' + escHtml(data.sizeHuman) + '</span>\n' +
    '      <span class="sep">|</span>\n' +
    '      <span>' + data.lines + ' linii</span>\n' +
    '      <span class="sep">|</span>\n' +
    '      <span class="tag ext">' + escHtml(data.ext) + '</span>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</header>\n' +
    '<main>\n' + bodyHTML + '\n</main>\n' +
    '<footer>\n' +
    '  <div>DEVz HUB ' + escHtml(_browseRootLabels[_kbState.root] || 'Browser') + ' &middot; ' + new Date().toLocaleDateString('pl-PL') + '</div>\n' +
    '  <div>Zrodlo: ' + escHtml(_browseRootLabels[_kbState.root] || '') + '/' + escHtml(data.category) + '/' + escHtml(data.name) + '</div>\n' +
    '</footer>\n' +
    '<script>\n' +
    'document.querySelectorAll("details summary").forEach(function(s){s.style.cursor="pointer"});\n' +
    '</script>\n' +
    '</body>\n</html>';

  // Open in new window
  var win = window.open('', '_blank');
  if (win) {
    win.document.write(fullPage);
    win.document.close();
    showToast('Strona HTML otwarta w nowej karcie');
  } else {
    // Fallback: download
    var blob = new Blob([fullPage], {type: 'text/html;charset=utf-8'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = title.replace(/\s+/g, '_') + '.html';
    a.click(); URL.revokeObjectURL(url);
    showToast('Pobrano plik HTML');
  }
}

function getKBHtmlStyles() {
  return [
    ':root{--bg:#0a0a0a;--bg2:#111;--bg3:#1a1a1a;--border:#262626;--text:#e5e5e5;--muted:#a3a3a3;--dim:#525252;',
    '--accent:#00d9ff;--green:#4ade80;--red:#ef4444;--purple:#a78bfa;--yellow:#facc15}',
    '*{margin:0;padding:0;box-sizing:border-box}',
    'body{background:var(--bg);color:var(--text);font:15px/1.8 "Segoe UI",system-ui,-apple-system,sans-serif;max-width:900px;margin:0 auto;padding:0 24px}',
    'header{padding:32px 0 24px;border-bottom:2px solid var(--accent);margin-bottom:32px;display:flex;align-items:start;gap:16px}',
    'header .header-badge{font:700 14px/1 monospace;padding:6px 10px;background:var(--accent);color:#000;white-space:nowrap}',
    'header h1{font:700 24px/1.2 "Segoe UI",sans-serif;color:var(--accent);margin:0 0 8px}',
    '.meta-row{font:12px/1 monospace;color:var(--dim);display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
    '.meta-row .sep{color:var(--border)}',
    '.meta-row .tag{padding:2px 8px;background:var(--bg3);border:1px solid var(--border);font-size:11px;color:var(--muted)}',
    '.meta-row .tag.ext{color:var(--purple);border-color:var(--purple)}',
    'main{padding-bottom:48px}',
    'h1{font-size:26px;color:var(--accent);margin:32px 0 12px;padding-bottom:8px;border-bottom:1px solid var(--border)}',
    'h2{font-size:21px;color:var(--green);margin:28px 0 10px;padding-bottom:6px;border-bottom:1px solid var(--bg3)}',
    'h3{font-size:17px;color:var(--purple);margin:24px 0 8px}',
    'h4{font-size:15px;color:var(--yellow);margin:20px 0 6px}',
    'p{margin:10px 0;line-height:1.8}',
    'a{color:var(--accent);text-decoration:none;border-bottom:1px solid transparent;transition:border-color .2s}',
    'a:hover{border-bottom-color:var(--accent)}',
    'strong{color:var(--green);font-weight:700}',
    'em{color:var(--purple);font-style:italic}',
    'code{background:var(--bg3);padding:2px 6px;font:13px/1 "JetBrains Mono","Fira Code","Consolas",monospace;color:var(--accent);border-radius:3px}',
    'pre{background:var(--bg2);border:1px solid var(--border);padding:16px 20px;overflow-x:auto;margin:16px 0;font:13px/1.6 "JetBrains Mono",monospace;color:var(--text)}',
    'pre code{background:none;padding:0;color:inherit}',
    'blockquote{border-left:3px solid var(--accent);padding:8px 16px;margin:16px 0;background:var(--bg2);color:var(--muted);font-style:italic}',
    'ul,ol{padding-left:24px;margin:10px 0}',
    'li{margin:4px 0;line-height:1.7}',
    'li::marker{color:var(--accent)}',
    'hr{border:none;border-top:1px solid var(--border);margin:24px 0}',
    'table{width:100%;border-collapse:collapse;margin:16px 0;font-size:14px}',
    'th{background:var(--bg3);color:var(--accent);padding:10px 12px;text-align:left;font:700 12px/1 monospace;text-transform:uppercase;border:1px solid var(--border)}',
    'td{padding:8px 12px;border:1px solid var(--border);vertical-align:top}',
    'tr:nth-child(even){background:var(--bg2)}',
    'details{margin:12px 0;border:1px solid var(--border);background:var(--bg2)}',
    'summary{padding:10px 16px;font-weight:700;color:var(--accent);background:var(--bg3)}',
    'details>div,details>p{padding:12px 16px}',
    '.json-key{color:var(--accent)}',
    '.json-string{color:var(--green)}',
    '.json-number{color:var(--yellow)}',
    '.json-bool{color:var(--purple)}',
    '.json-null{color:var(--dim)}',
    '.section-card{background:var(--bg2);border:1px solid var(--border);padding:20px;margin:16px 0}',
    '.section-card h3{margin-top:0;color:var(--accent)}',
    '.link-list{list-style:none;padding:0}',
    '.link-list li{padding:6px 0;border-bottom:1px solid var(--bg3)}',
    '.link-list li:last-child{border-bottom:none}',
    '.link-list a{font:13px/1 monospace;display:flex;justify-content:space-between}',
    '.link-list .link-meta{color:var(--dim);font-size:11px}',
    'footer{padding:24px 0;border-top:1px solid var(--border);font:11px/1.6 monospace;color:var(--dim);display:flex;justify-content:space-between}',
    '@media print{body{background:#fff;color:#222;max-width:100%}',
    'header{border-bottom-color:#222}h1,h2,h3{color:#111}',
    'a{color:#0066cc}pre,code{background:#f5f5f5;border-color:#ddd}',
    'footer{color:#999}}',
    '@media(max-width:600px){body{padding:0 12px;font-size:14px}header h1{font-size:18px}}',
  ].join('\n');
}

function convertMdToRichHTML(md) {
  var lines = md.split('\n');
  var html = '';
  var inCode = false;
  var inList = false;
  var listType = '';
  var inTable = false;
  var tableRows = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    // Code blocks
    if (line.trim().indexOf('```') === 0) {
      if (inCode) {
        html += '</code></pre>';
        inCode = false;
      } else {
        if (inList) { html += '</' + listType + '>'; inList = false; }
        if (inTable) { html += flushTable(tableRows); inTable = false; tableRows = []; }
        var lang = line.trim().substring(3).trim();
        html += '<pre' + (lang ? ' data-lang="' + escHtml(lang) + '"' : '') + '><code>';
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      html += escHtml(line) + '\n';
      continue;
    }

    // Table detection
    if (line.match(/^\|.*\|\s*$/)) {
      if (inList) { html += '</' + listType + '>'; inList = false; }
      if (!inTable) inTable = true;
      if (!line.match(/^\|[-:|\s]+\|\s*$/)) {
        tableRows.push(line);
      }
      continue;
    } else if (inTable) {
      html += flushTable(tableRows);
      inTable = false;
      tableRows = [];
    }

    // Empty line
    if (line.trim() === '') {
      if (inList) { html += '</' + listType + '>'; inList = false; }
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+\s*$/) || line.match(/^\*\*\*+\s*$/)) {
      html += '<hr>';
      continue;
    }

    // Headers
    var hMatch = line.match(/^(#{1,4})\s+(.*)/);
    if (hMatch) {
      if (inList) { html += '</' + listType + '>'; inList = false; }
      var level = hMatch[1].length;
      var id = hMatch[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      html += '<h' + level + ' id="' + id + '">' + richInline(hMatch[2]) + '</h' + level + '>';
      continue;
    }

    // Blockquote
    if (line.match(/^>\s?/)) {
      if (inList) { html += '</' + listType + '>'; inList = false; }
      html += '<blockquote>' + richInline(line.replace(/^>\s?/, '')) + '</blockquote>';
      continue;
    }

    // Unordered list
    if (line.match(/^\s*[-*]\s/)) {
      if (!inList || listType !== 'ul') {
        if (inList) html += '</' + listType + '>';
        html += '<ul>'; inList = true; listType = 'ul';
      }
      html += '<li>' + richInline(line.replace(/^\s*[-*]\s/, '')) + '</li>';
      continue;
    }

    // Ordered list
    if (line.match(/^\s*\d+\.\s/)) {
      if (!inList || listType !== 'ol') {
        if (inList) html += '</' + listType + '>';
        html += '<ol>'; inList = true; listType = 'ol';
      }
      html += '<li>' + richInline(line.replace(/^\s*\d+\.\s/, '')) + '</li>';
      continue;
    }

    // Paragraph
    if (inList) { html += '</' + listType + '>'; inList = false; }
    html += '<p>' + richInline(line) + '</p>';
  }

  if (inCode) html += '</code></pre>';
  if (inList) html += '</' + listType + '>';
  if (inTable) html += flushTable(tableRows);
  return html;
}

function flushTable(rows) {
  if (rows.length === 0) return '';
  var html = '<table>';
  rows.forEach(function(row, idx) {
    var cells = row.split('|').filter(function(c, ci, arr) { return ci > 0 && ci < arr.length - 1; });
    var tag = idx === 0 ? 'th' : 'td';
    html += '<tr>';
    cells.forEach(function(c) {
      html += '<' + tag + '>' + richInline(c.trim()) + '</' + tag + '>';
    });
    html += '</tr>';
  });
  html += '</table>';
  return html;
}

function convertJsonToRichHTML(raw) {
  var obj;
  try { obj = JSON.parse(raw); } catch(e) { return '<pre>' + escHtml(raw) + '</pre>'; }

  var html = '';

  // If it's an object with string values — render as a nice card
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    html += '<div class="section-card">';
    html += jsonObjToHTML(obj, 0);
    html += '</div>';
  } else if (Array.isArray(obj)) {
    // Array of objects — render as table if uniform
    if (obj.length > 0 && typeof obj[0] === 'object' && !Array.isArray(obj[0])) {
      var keys = Object.keys(obj[0]);
      html += '<table><tr>';
      keys.forEach(function(k) { html += '<th>' + escHtml(k) + '</th>'; });
      html += '</tr>';
      obj.forEach(function(item) {
        html += '<tr>';
        keys.forEach(function(k) {
          var v = item[k];
          html += '<td>' + (typeof v === 'object' ? '<code>' + escHtml(JSON.stringify(v)) + '</code>' : escHtml(String(v != null ? v : ''))) + '</td>';
        });
        html += '</tr>';
      });
      html += '</table>';
    } else {
      html += '<ul>';
      obj.forEach(function(item) {
        html += '<li>' + (typeof item === 'object' ? '<code>' + escHtml(JSON.stringify(item)) + '</code>' : escHtml(String(item))) + '</li>';
      });
      html += '</ul>';
    }
  } else {
    html += '<p>' + escHtml(String(obj)) + '</p>';
  }
  return html;
}

function jsonObjToHTML(obj, depth) {
  var html = '';
  for (var key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    var val = obj[key];
    var label = key.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });

    if (val === null || val === undefined) {
      html += '<p><strong>' + escHtml(label) + ':</strong> <em style="color:var(--dim)">null</em></p>';
    } else if (typeof val === 'string') {
      if (val.match(/^https?:\/\//)) {
        html += '<p><strong>' + escHtml(label) + ':</strong> <a href="' + escHtml(val) + '" target="_blank">' + escHtml(val) + '</a></p>';
      } else if (val.length > 200) {
        html += '<details><summary>' + escHtml(label) + '</summary><div><p>' + richInline(val) + '</p></div></details>';
      } else {
        html += '<p><strong>' + escHtml(label) + ':</strong> ' + richInline(val) + '</p>';
      }
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      html += '<p><strong>' + escHtml(label) + ':</strong> <code>' + val + '</code></p>';
    } else if (Array.isArray(val)) {
      if (val.length > 0 && typeof val[0] === 'object') {
        html += '<h' + Math.min(depth + 3, 4) + '>' + escHtml(label) + '</h' + Math.min(depth + 3, 4) + '>';
        html += convertJsonToRichHTML(JSON.stringify(val));
      } else {
        html += '<p><strong>' + escHtml(label) + ':</strong> ' + val.map(function(v) { return '<code>' + escHtml(String(v)) + '</code>'; }).join(', ') + '</p>';
      }
    } else if (typeof val === 'object') {
      html += '<details open><summary>' + escHtml(label) + '</summary><div class="section-card" style="margin-left:' + (depth * 16) + 'px">';
      html += jsonObjToHTML(val, depth + 1);
      html += '</div></details>';
    }
  }
  return html;
}

function richInline(text) {
  var s = escHtml(text);
  // Bold
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Inline code
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Links [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  // Auto-link bare URLs
  s = s.replace(/(^|\s)(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank">$2</a>');
  return s;
}

function kbCopyContent() {
  if (_kbState._lastContent) {
    navigator.clipboard.writeText(_kbState._lastContent).then(function() {
      showToast('Skopiowano do schowka');
    });
  }
}

// ========== BACK TO CATEGORIES ==========

function kbShowCategories() {
  _kbState.currentCat = null;
  _kbState.currentFile = null;

  // Reset sidebar highlight
  document.querySelectorAll('.kb-cat-item').forEach(function(el) {
    el.classList.remove('active');
  });

  // Update breadcrumb
  var rootLabel = _browseRootLabels[_kbState.root] || _kbState.root;
  var bc = document.getElementById('kbBreadcrumb');
  if (bc) bc.innerHTML = '<a onclick="kbShowCategories()">' + escHtml(rootLabel) + '</a>';

  // Show file list with welcome
  var fileList = document.getElementById('kbFileList');
  var reader = document.getElementById('kbReader');
  if (reader) reader.classList.remove('active');
  if (fileList) {
    fileList.style.display = '';
    fileList.innerHTML = '<div class="kb-empty-state">Wybierz folder z panelu po lewej</div>';
  }
}

// ========== SIMPLE MARKDOWN RENDERER ==========

function renderMarkdown(md) {
  var lines = md.split('\n');
  var html = '';
  var inCode = false;
  var inList = false;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCode) {
        html += '</pre>';
        inCode = false;
      } else {
        if (inList) { html += '</ul>'; inList = false; }
        html += '<pre>';
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      html += escHtml(line) + '\n';
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<br>';
      continue;
    }

    // Headers
    if (line.match(/^### /)) {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<h3>' + inlineFormat(line.substring(4)) + '</h3>';
      continue;
    }
    if (line.match(/^## /)) {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<h2>' + inlineFormat(line.substring(3)) + '</h2>';
      continue;
    }
    if (line.match(/^# /)) {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<h1>' + inlineFormat(line.substring(2)) + '</h1>';
      continue;
    }

    // Blockquote
    if (line.match(/^> /)) {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<blockquote>' + inlineFormat(line.substring(2)) + '</blockquote>';
      continue;
    }

    // List items
    if (line.match(/^[-*] /)) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += '<li>' + inlineFormat(line.substring(2)) + '</li>';
      continue;
    }
    if (line.match(/^\d+\. /)) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += '<li>' + inlineFormat(line.replace(/^\d+\. /, '')) + '</li>';
      continue;
    }

    // Paragraph
    html += '<p>' + inlineFormat(line) + '</p>';
  }

  if (inCode) html += '</pre>';
  if (inList) html += '</ul>';
  return html;
}

function inlineFormat(text) {
  var s = escHtml(text);
  // Bold
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Inline code
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Links
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  // Horizontal rule
  if (s.match(/^---+$/)) return '<hr style="border:1px solid var(--border);margin:8px 0">';
  return s;
}

// ========== HELPERS ==========

function escAttr(s) {
  return s.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function formatFileName(name) {
  // Make long KB filenames more readable
  return name
    .replace(/_20\d{6}_\d{6}/, '')  // strip timestamps
    .replace(/\.md$|\.json$|\.txt$/, '')  // strip ext from display (shown as badge)
    .replace(/_/g, ' ')
    .substring(0, 80);
}

function truncateFileName(name, max) {
  if (name.length <= max) return name;
  return name.substring(0, max - 3) + '...';
}

// ========== HOOK INTO KB TILES ==========
// Patch populateKB to make tiles clickable

(function() {
  // Patch KB tiles
  var _origPopulateKB = window.populateKB;
  window.populateKB = function() {
    _origPopulateKB();
    document.querySelectorAll('.kb-item').forEach(function(el) {
      var nameEl = el.querySelector('.kb-item-name');
      if (!nameEl) return;
      var catName = nameEl.textContent.trim();
      el.style.cursor = 'pointer';
      el.title = 'Kliknij aby przegladac pliki w ' + catName;
      el.onclick = function() { openBrowseModal('kb', catName); };
    });
  };

  // Patch CC tiles
  var _origPopulateCC = window.populateCC;
  window.populateCC = function() {
    _origPopulateCC();
    document.querySelectorAll('.cc-item').forEach(function(el) {
      var nameEl = el.querySelector('.cc-item-name');
      if (!nameEl) return;
      var folderName = nameEl.textContent.trim();
      el.style.cursor = 'pointer';
      el.title = 'Kliknij aby przegladac pliki w ' + folderName;
      el.onclick = function() { openBrowseModal('cc', folderName); };
    });
  };

  // Patch Libraries table
  var _origPopulateLibs = window.populateAdditionalLibs;
  window.populateAdditionalLibs = function() {
    _origPopulateLibs();
    var table = document.getElementById('additionalLibsTable');
    if (!table) return;
    table.querySelectorAll('tr').forEach(function(tr, idx) {
      if (idx === 0) return; // skip header
      var firstTd = tr.querySelector('td');
      if (!firstTd) return;
      var libName = firstTd.textContent.trim();
      tr.style.cursor = 'pointer';
      tr.title = 'Kliknij aby przegladac pliki w ' + libName;
      tr.onclick = function() { openBrowseModal('lib', libName); };
    });
  };
})();
