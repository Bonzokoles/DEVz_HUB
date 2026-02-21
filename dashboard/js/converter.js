/* ============================================================
   JIMBO HQ — Converter Module
   Handles XML, JSON, CSV, RSS, Atom conversion
   ============================================================ */

function runConversion() {
  var sourceUrl = document.getElementById('convUrl').value.trim();
  var sourceText = document.getElementById('convText').value.trim();
  var inputFormat = document.getElementById('convInFmt').value;
  var outputFormat = document.getElementById('convOutFmt').value;
  var prettyPrint = document.getElementById('convPretty').checked;
  var flatten = document.getElementById('convFlatten').checked;
  var dedup = document.getElementById('convDedup').checked;

  if (!sourceText && !sourceUrl) {
    setConvStatus('error', 'Podaj dane wejściowe lub URL');
    return;
  }

  if (sourceUrl && !sourceText) {
    setConvStatus('info', 'Fetch z URL wymaga serwera proxy (CORS). Wklej dane ręcznie.');
    return;
  }

  try {
    // Auto-detect input format
    if (inputFormat === 'auto') {
      inputFormat = detectFormat(sourceText);
      setConvStatus('info', 'Auto-detected format: ' + inputFormat.toUpperCase());
    }

    // Parse input
    var data = parseInput(sourceText, inputFormat);

    // Flatten if needed
    if (flatten && Array.isArray(data)) {
      data = data.map(function(item) { return flattenObject(item); });
    }

    // Deduplicate
    if (dedup && Array.isArray(data)) {
      data = deduplicateArray(data);
    }

    // Convert to output
    var result = formatOutput(data, outputFormat, prettyPrint);

    document.getElementById('convOutput').textContent = result;
    setConvStatus('success', 'Converted ' + (Array.isArray(data) ? data.length + ' records' : 'data') +
      '  →  ' + outputFormat.toUpperCase() +
      (dedup ? ' (deduped)' : '') +
      (flatten ? ' (flattened)' : ''));

  } catch (err) {
    setConvStatus('error', 'Conversion error: ' + err.message);
    document.getElementById('convOutput').textContent = 'Error: ' + err.message;
  }
}

function detectFormat(text) {
  text = text.trim();
  if (text.startsWith('{') || text.startsWith('[')) return 'json';
  if (text.startsWith('<?xml') || text.startsWith('<rss')) return text.includes('<rss') ? 'rss' : 'xml';
  if (text.startsWith('<feed')) return 'atom';
  if (text.startsWith('<')) return 'xml';
  if (text.includes(',') && text.includes('\n')) return 'csv';
  return 'json';
}

function parseInput(text, format) {
  switch (format) {
    case 'json':
      return JSON.parse(text);

    case 'csv':
      return parseCSV(text);

    case 'xml':
    case 'rss':
    case 'atom':
      return parseXML(text, format);

    default:
      return JSON.parse(text);
  }
}

function parseCSV(text) {
  var lines = text.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
  if (lines.length < 2) return [];
  var headers = parseCSVLine(lines[0]);
  var result = [];
  for (var i = 1; i < lines.length; i++) {
    var vals = parseCSVLine(lines[i]);
    var obj = {};
    headers.forEach(function(h, idx) { obj[h] = vals[idx] || ''; });
    result.push(obj);
  }
  return result;
}

function parseCSVLine(line) {
  var result = [];
  var current = '';
  var inQuotes = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseXML(text, format) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(text, 'text/xml');
  var errors = doc.getElementsByTagName('parsererror');
  if (errors.length > 0) throw new Error('Invalid XML: ' + errors[0].textContent.substring(0, 100));

  if (format === 'rss') {
    return xmlNodesToArray(doc.querySelectorAll('item'));
  }
  if (format === 'atom') {
    return xmlNodesToArray(doc.querySelectorAll('entry'));
  }
  // Generic XML — try common patterns
  var root = doc.documentElement;
  var children = root.children;
  if (children.length > 0 && allSameTag(children)) {
    return xmlNodesToArray(children);
  }
  return [xmlNodeToObj(root)];
}

function xmlNodesToArray(nodes) {
  var result = [];
  for (var i = 0; i < nodes.length; i++) {
    result.push(xmlNodeToObj(nodes[i]));
  }
  return result;
}

function xmlNodeToObj(node) {
  var obj = {};
  // Attributes
  if (node.attributes) {
    for (var a = 0; a < node.attributes.length; a++) {
      obj['@' + node.attributes[a].name] = node.attributes[a].value;
    }
  }
  // Children
  for (var c = 0; c < node.children.length; c++) {
    var child = node.children[c];
    var tag = child.tagName;
    if (child.children.length > 0) {
      obj[tag] = xmlNodeToObj(child);
    } else {
      obj[tag] = child.textContent || '';
    }
  }
  // If no children but has text
  if (node.children.length === 0 && node.textContent) {
    if (Object.keys(obj).length === 0) return node.textContent;
    obj['#text'] = node.textContent;
  }
  return obj;
}

function allSameTag(nodes) {
  if (nodes.length <= 1) return true;
  var tag = nodes[0].tagName;
  for (var i = 1; i < nodes.length; i++) {
    if (nodes[i].tagName !== tag) return false;
  }
  return true;
}

function flattenObject(obj, prefix) {
  prefix = prefix || '';
  var result = {};
  for (var key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    var newKey = prefix ? prefix + '.' + key : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      var flat = flattenObject(obj[key], newKey);
      for (var fk in flat) result[fk] = flat[fk];
    } else {
      result[newKey] = obj[key];
    }
  }
  return result;
}

function deduplicateArray(arr) {
  var seen = {};
  return arr.filter(function(item) {
    var key = JSON.stringify(item);
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function formatOutput(data, format, pretty) {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, pretty ? 2 : 0);

    case 'jsonl':
      if (!Array.isArray(data)) return JSON.stringify(data);
      return data.map(function(item) { return JSON.stringify(item); }).join('\n');

    case 'csv':
      return arrayToCSV(data);

    case 'xml':
      return arrayToXML(data, pretty);

    case 'markdown':
      return arrayToMarkdown(data);

    default:
      return JSON.stringify(data, null, 2);
  }
}

function arrayToCSV(data) {
  if (!Array.isArray(data) || data.length === 0) return '';
  var headers = Object.keys(data[0]);
  var lines = [headers.join(',')];
  data.forEach(function(row) {
    var vals = headers.map(function(h) {
      var v = String(row[h] || '');
      return v.includes(',') || v.includes('"') || v.includes('\n') ?
        '"' + v.replace(/"/g, '""') + '"' : v;
    });
    lines.push(vals.join(','));
  });
  return lines.join('\n');
}

function arrayToXML(data, pretty) {
  var indent = pretty ? '  ' : '';
  var nl = pretty ? '\n' : '';
  var xml = '<?xml version="1.0" encoding="UTF-8"?>' + nl + '<data>' + nl;
  var items = Array.isArray(data) ? data : [data];
  items.forEach(function(item) {
    xml += indent + '<item>' + nl;
    for (var key in item) {
      if (!item.hasOwnProperty(key)) continue;
      var safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
      xml += indent + indent + '<' + safeKey + '>' + escXml(String(item[key] || '')) + '</' + safeKey + '>' + nl;
    }
    xml += indent + '</item>' + nl;
  });
  xml += '</data>';
  return xml;
}

function arrayToMarkdown(data) {
  if (!Array.isArray(data) || data.length === 0) return 'No data';
  var headers = Object.keys(data[0]);
  var lines = [];
  lines.push('| ' + headers.join(' | ') + ' |');
  lines.push('| ' + headers.map(function() { return '---'; }).join(' | ') + ' |');
  data.forEach(function(row) {
    lines.push('| ' + headers.map(function(h) { return String(row[h] || '').replace(/\|/g, '\\|'); }).join(' | ') + ' |');
  });
  return lines.join('\n');
}

function escXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function clearConverter() {
  document.getElementById('convUrl').value = '';
  document.getElementById('convText').value = '';
  document.getElementById('convOutput').textContent = 'No output yet. Paste data and click Convert.';
  document.getElementById('convStatus').innerHTML = '';
}

function copyResult() {
  var text = document.getElementById('convOutput').textContent;
  if (!text || text === 'No output yet. Paste data and click Convert.') return;
  navigator.clipboard.writeText(text).then(function() {
    showToast('Copied to clipboard');
  }).catch(function() {
    // Fallback
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Copied to clipboard');
  });
}

function downloadResult() {
  var text = document.getElementById('convOutput').textContent;
  if (!text || text === 'No output yet. Paste data and click Convert.') return;
  var format = document.getElementById('convOutFmt').value;
  var ext = { json: 'json', csv: 'csv', xml: 'xml', jsonl: 'jsonl', markdown: 'md' }[format] || 'txt';
  var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'converted_output.' + ext;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('File downloaded');
}

function setConvStatus(type, msg) {
  var el = document.getElementById('convStatus');
  el.innerHTML = '<div class="status-msg ' + type + '">' +
    (type === 'success' ? '[OK]' : type === 'error' ? '[!!]' : '[i]') +
    ' ' + msg + '</div>';
}
