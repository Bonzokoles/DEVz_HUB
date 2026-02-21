#!/usr/bin/env python3
"""
JIMBO HQ Dashboard — Dev Server
Simple HTTP server with CORS, directory listing, and file browser API.
Usage: python server.py [port]
Default: http://localhost:4200

Browse API (generic for KB, Libraries, Control Center, Agent Zero):
  GET /api/browse/roots                     — list available roots
  GET /api/browse/categories?root=kb        — list folders in a root
  GET /api/browse/files?root=kb&cat=01_AI_SEO  — list files in a folder
  GET /api/browse/read?root=kb&cat=X&file=Y    — read file content

WebGate API:
  GET /api/webgate/status                   — workspace folders + podman + ports

Knowledge API (for Agent Zero & dashboard):
  GET  /api/knowledge/sources               — list all knowledge sources with stats
  GET  /api/knowledge/list?source=kb&cat=X   — list files in source/category
  GET  /api/knowledge/read?source=kb&cat=X&file=Y — read file content
  GET  /api/knowledge/search?q=term&source=all   — full-text search across knowledge
  GET  /api/knowledge/stats                  — aggregate statistics
  POST /api/knowledge/write                  — create or update a knowledge file
  POST /api/knowledge/delete                 — delete a knowledge file
  POST /api/knowledge/mkdir                  — create a new category folder

Legacy KB API (still works):
  GET /api/kb/categories, /api/kb/files, /api/kb/read
"""

import http.server
import socketserver
import os
import sys
import json
import urllib.parse
import mimetypes
import subprocess
import socket
import re
import shutil
from datetime import datetime

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4200
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Root directories for browsing
BROWSE_ROOTS = {
    "kb": {
        "path": r"U:\The_DEVz_HUB_of_work\knowledge_base",
        "label": "Knowledge Base",
        "icon": "[KB]",
    },
    "lib": {
        "path": r"U:\The_DEVz_HUB_of_work\knowledge_base\_LIBRARIES",
        "label": "Libraries",
        "icon": "[LB]",
    },
    "cc": {
        "path": r"U:\The_DEVz_HUB_of_work\CONTROL_CENTER",
        "label": "Control Center",
        "icon": "[CC]",
    },
    "a0": {
        "path": r"U:\AGENT_ZERO",
        "label": "Agent Zero",
        "icon": "[A0]",
    },
}

# WebGate workspace roots (all workspace folders for navigation)
WEBGATE_WORKSPACES = [
    {
        "key": "devzhub",
        "label": "DEVz HUB",
        "path": r"U:\The_DEVz_HUB_of_work",
        "icon": "[DH]",
    },
    {"key": "a0", "label": "Agent Zero", "path": r"U:\AGENT_ZERO", "icon": "[A0]"},
    {
        "key": "jimbo",
        "label": "JIMBO NEW OP",
        "path": r"U:\JIMBO_NEW_OP_INIT",
        "icon": "[JM]",
    },
    {
        "key": "a0profiles",
        "label": "A0 Profiles",
        "path": r"C:\Users\Bonzo2\agent-zero-profiles",
        "icon": "[PR]",
    },
    {
        "key": "a0prompts",
        "label": "A0 Prompts",
        "path": r"C:\Users\Bonzo2\agent-zero-prompts",
        "icon": "[PM]",
    },
    {
        "key": "a0data",
        "label": "A0 Data",
        "path": r"C:\Users\Bonzo2\agent-zero-data",
        "icon": "[DT]",
    },
    {
        "key": "movies",
        "label": "Movies",
        "path": r"U:\The_DEVz_HUB_of_work\movies",
        "icon": "[MV]",
    },
    {
        "key": "filmmedia",
        "label": "Film Media",
        "path": r"U:\The_DEVz_HUB_of_work\CONTROL_CENTER\FILM_MEDIA",
        "icon": "[FM]",
    },
]

# WebGate known services
WEBGATE_SERVICES = [
    {"name": "Dashboard", "port": 4200, "icon": "[DS]", "url": "http://localhost:4200"},
    {
        "name": "Agent Zero UI",
        "port": 50001,
        "icon": "[A0]",
        "url": "http://localhost:50001",
    },
    {
        "name": "Agent Zero Alt",
        "port": 9000,
        "icon": "[A0]",
        "url": "http://localhost:9000",
    },
    {
        "name": "Gateway Web",
        "port": 18790,
        "icon": "[GW]",
        "url": "http://localhost:18790",
    },
    {
        "name": "Gateway Admin",
        "port": 18791,
        "icon": "[GA]",
        "url": "http://localhost:18791",
    },
    {"name": "Graph API", "port": 8001, "icon": "[GR]", "url": "http://localhost:8001"},
    {
        "name": "React Flow",
        "port": 5173,
        "icon": "[RF]",
        "url": "http://localhost:5173",
    },
    {"name": "PostgreSQL", "port": 5432, "icon": "[PG]", "url": None},
    {"name": "Redis", "port": 6379, "icon": "[RD]", "url": None},
]

# Max file size we'll serve for reading (2 MB)
MAX_READ_SIZE = 2 * 1024 * 1024

# ========== KNOWLEDGE SOURCES ==========
# All knowledge repositories accessible through the Knowledge API.
# writable=True means Agent Zero and the dashboard can create/update/delete files.
KNOWLEDGE_SOURCES = {
    "kb": {
        "path": r"U:\The_DEVz_HUB_of_work\knowledge_base",
        "label": "Knowledge Base",
        "icon": "[KB]",
        "writable": True,
        "description": "Glowna baza wiedzy — artykuly, prompty, plany, archiwa",
    },
    "lib": {
        "path": r"U:\The_DEVz_HUB_of_work\knowledge_base\_LIBRARIES",
        "label": "Libraries",
        "icon": "[LB]",
        "writable": True,
        "description": "Biblioteki projektowe — business, AI lab, prywatne",
    },
    "a0_knowledge": {
        "path": r"U:\AGENT_ZERO\usr\knowledge\main",
        "label": "A0 User Knowledge",
        "icon": "[A0]",
        "writable": True,
        "description": "Agent Zero FAISS VectorDB — pliki wiedzy uzytkownika",
    },
    "a0_default": {
        "path": r"U:\AGENT_ZERO\knowledge\main",
        "label": "A0 Default Knowledge",
        "icon": "[AD]",
        "writable": False,
        "description": "Agent Zero domyslna wiedza (tylko odczyt)",
    },
    "cc": {
        "path": r"U:\The_DEVz_HUB_of_work\CONTROL_CENTER",
        "label": "Control Center",
        "icon": "[CC]",
        "writable": False,
        "description": "Centrum kontroli — konfiguracja systemu (tylko odczyt)",
    },
    "prompts": {
        "path": r"C:\Users\Bonzo2\agent-zero-prompts",
        "label": "A0 Prompts",
        "icon": "[PM]",
        "writable": False,
        "description": "Prompty agentow Agent Zero (tylko odczyt)",
    },
}
# Extensions we allow reading
READABLE_EXT = {
    ".md",
    ".txt",
    ".json",
    ".jsonl",
    ".csv",
    ".py",
    ".yaml",
    ".yml",
    ".toml",
    ".cfg",
    ".ini",
    ".xml",
    ".html",
    ".js",
    ".ts",
    ".tsx",
    ".jsx",
    ".css",
    ".scss",
    ".sh",
    ".bat",
    ".ps1",
    ".sql",
    ".r",
    ".ipynb",
    ".env",
    ".gitignore",
    ".dockerfile",
}


def safe_path(base, *parts):
    """Resolve path and ensure it stays within base directory."""
    full = os.path.normpath(os.path.join(base, *parts))
    if not full.startswith(os.path.normpath(base)):
        return None
    return full


def _resolve_root(root_key):
    """Get root config by key, return (path, config) or (None, None)."""
    cfg = BROWSE_ROOTS.get(root_key)
    if not cfg:
        return None, None
    return cfg["path"], cfg


def get_categories(root_path):
    """Scan a root dir and return list of subdirectories with file counts."""
    cats = []
    if not os.path.isdir(root_path):
        return cats
    for entry in sorted(os.listdir(root_path)):
        cat_path = os.path.join(root_path, entry)
        if not os.path.isdir(cat_path):
            continue
        if entry.startswith(".") or entry == "__pycache__" or entry == "node_modules":
            continue
        file_count = 0
        try:
            for f in os.listdir(cat_path):
                if os.path.isfile(os.path.join(cat_path, f)):
                    file_count += 1
        except PermissionError:
            pass
        # Count subdirectories
        sub_count = 0
        try:
            for f in os.listdir(cat_path):
                if os.path.isdir(os.path.join(cat_path, f)):
                    sub_count += 1
        except PermissionError:
            pass
        cats.append(
            {
                "name": entry,
                "files": file_count,
                "subfolders": sub_count,
            }
        )
    return cats


def get_files(root_path, category):
    """List files in a category folder with metadata."""
    cat_path = safe_path(root_path, category)
    if not cat_path or not os.path.isdir(cat_path):
        return None
    result = []
    for f in sorted(os.listdir(cat_path)):
        fp = os.path.join(cat_path, f)
        if not os.path.isfile(fp):
            continue
        _, ext = os.path.splitext(f)
        size = os.path.getsize(fp)
        result.append(
            {
                "name": f,
                "ext": ext.lower(),
                "size": size,
                "sizeHuman": _human_size(size),
                "readable": ext.lower() in READABLE_EXT or ext == "",
            }
        )
    return result


def read_file_content(root_path, category, filename):
    """Read a file and return its content."""
    fp = safe_path(root_path, category, filename)
    if not fp or not os.path.isfile(fp):
        return None, "File not found"
    _, ext = os.path.splitext(filename)
    if ext.lower() not in READABLE_EXT and ext != "":
        return None, f"File type {ext} not supported for reading"
    size = os.path.getsize(fp)
    if size > MAX_READ_SIZE:
        return None, f"File too large ({_human_size(size)} > 2 MB limit)"
    try:
        with open(fp, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        return {
            "name": filename,
            "category": category,
            "ext": ext.lower(),
            "size": size,
            "sizeHuman": _human_size(size),
            "content": content,
            "lines": content.count("\n") + 1,
        }, None
    except Exception as e:
        return None, str(e)


def _human_size(b):
    for unit in ["B", "KB", "MB", "GB"]:
        if b < 1024:
            return f"{b:.0f} {unit}" if b == int(b) else f"{b:.1f} {unit}"
        b /= 1024
    return f"{b:.1f} TB"


# ========== KNOWLEDGE API FUNCTIONS ==========


def _resolve_knowledge_source(source_key):
    """Get knowledge source config by key."""
    cfg = KNOWLEDGE_SOURCES.get(source_key)
    if not cfg:
        return None, None
    return cfg["path"], cfg


def knowledge_get_sources():
    """List all knowledge sources with stats."""
    sources = []
    for key, cfg in KNOWLEDGE_SOURCES.items():
        src_path = cfg["path"]
        exists = os.path.isdir(src_path)
        total_files = 0
        total_folders = 0
        total_size = 0
        if exists:
            try:
                for entry in os.listdir(src_path):
                    ep = os.path.join(src_path, entry)
                    if os.path.isdir(ep) and not entry.startswith("."):
                        total_folders += 1
                        for f in os.listdir(ep):
                            fp = os.path.join(ep, f)
                            if os.path.isfile(fp):
                                total_files += 1
                                total_size += os.path.getsize(fp)
                    elif os.path.isfile(ep):
                        total_files += 1
                        total_size += os.path.getsize(ep)
            except PermissionError:
                pass
        sources.append(
            {
                "key": key,
                "label": cfg["label"],
                "icon": cfg["icon"],
                "path": src_path,
                "exists": exists,
                "writable": cfg["writable"],
                "description": cfg["description"],
                "totalFiles": total_files,
                "totalFolders": total_folders,
                "totalSize": total_size,
                "totalSizeHuman": _human_size(total_size),
            }
        )
    return sources


def knowledge_list_files(source_key, category=None):
    """List files in a knowledge source, optionally in a specific category."""
    src_path, cfg = _resolve_knowledge_source(source_key)
    if not src_path or not os.path.isdir(src_path):
        return None, f"Source '{source_key}' not found or inaccessible"

    if category:
        cat_path = safe_path(src_path, category)
        if not cat_path or not os.path.isdir(cat_path):
            return None, f"Category '{category}' not found in {cfg['label']}"
        files = _list_files_in_dir(cat_path)
        return {
            "source": source_key,
            "category": category,
            "files": files,
            "total": len(files),
            "writable": cfg["writable"],
        }, None
    else:
        categories = get_categories(src_path)
        root_files = _list_files_in_dir(src_path)
        return {
            "source": source_key,
            "label": cfg["label"],
            "categories": categories,
            "rootFiles": root_files,
            "writable": cfg["writable"],
        }, None


def _list_files_in_dir(dir_path):
    """List files with metadata in a directory."""
    result = []
    try:
        for f in sorted(os.listdir(dir_path)):
            fp = os.path.join(dir_path, f)
            if not os.path.isfile(fp):
                continue
            _, ext = os.path.splitext(f)
            size = os.path.getsize(fp)
            mtime = os.path.getmtime(fp)
            result.append(
                {
                    "name": f,
                    "ext": ext.lower(),
                    "size": size,
                    "sizeHuman": _human_size(size),
                    "modified": datetime.fromtimestamp(mtime).isoformat(),
                    "readable": ext.lower() in READABLE_EXT or ext == "",
                }
            )
    except PermissionError:
        pass
    return result


def knowledge_search(query, source_key="all", max_results=50):
    """Full-text search across knowledge files."""
    results = []
    pattern = re.compile(re.escape(query), re.IGNORECASE)

    if source_key == "all":
        sources_to_search = KNOWLEDGE_SOURCES
    elif source_key in KNOWLEDGE_SOURCES:
        sources_to_search = {source_key: KNOWLEDGE_SOURCES[source_key]}
    else:
        return {"error": f"Unknown source '{source_key}'", "results": []}

    for skey, cfg in sources_to_search.items():
        src_path = cfg["path"]
        if not os.path.isdir(src_path):
            continue
        _search_dir(src_path, skey, "", pattern, results, max_results)
        if len(results) >= max_results:
            break

    return {
        "query": query,
        "source": source_key,
        "results": results[:max_results],
        "total": len(results),
        "truncated": len(results) >= max_results,
    }


def _search_dir(dir_path, source_key, rel_path, pattern, results, max_results):
    """Recursively search files in a directory."""
    try:
        for entry in sorted(os.listdir(dir_path)):
            if len(results) >= max_results:
                return
            ep = os.path.join(dir_path, entry)
            entry_rel = os.path.join(rel_path, entry) if rel_path else entry

            if (
                os.path.isdir(ep)
                and not entry.startswith(".")
                and entry not in ("__pycache__", "node_modules", ".git")
            ):
                _search_dir(ep, source_key, entry_rel, pattern, results, max_results)
            elif os.path.isfile(ep):
                _, ext = os.path.splitext(entry)
                if ext.lower() not in READABLE_EXT and ext != "":
                    continue
                size = os.path.getsize(ep)
                if size > MAX_READ_SIZE:
                    continue
                try:
                    with open(ep, "r", encoding="utf-8", errors="replace") as f:
                        content = f.read()
                    matches = list(pattern.finditer(content))
                    if matches:
                        m = matches[0]
                        start = max(0, m.start() - 80)
                        end = min(len(content), m.end() + 80)
                        snippet = content[start:end].replace("\n", " ")
                        if start > 0:
                            snippet = "..." + snippet
                        if end < len(content):
                            snippet = snippet + "..."
                        results.append(
                            {
                                "source": source_key,
                                "category": (
                                    rel_path.split(os.sep)[0]
                                    if os.sep in rel_path
                                    else rel_path
                                ),
                                "file": entry,
                                "path": entry_rel,
                                "matchCount": len(matches),
                                "snippet": snippet,
                                "size": size,
                                "sizeHuman": _human_size(size),
                            }
                        )
                except Exception:
                    pass
    except PermissionError:
        pass


def knowledge_write(source_key, category, filename, content):
    """Write (create/update) a knowledge file. Only writable sources allowed."""
    cfg = KNOWLEDGE_SOURCES.get(source_key)
    if not cfg:
        return None, f"Unknown source '{source_key}'"
    if not cfg["writable"]:
        return None, f"Source '{cfg['label']}' is read-only"

    src_path = cfg["path"]
    if not os.path.isdir(src_path):
        return None, f"Source path does not exist: {src_path}"

    if not filename or ".." in filename or "/" in filename or "\\" in filename:
        return None, "Invalid filename"
    _, ext = os.path.splitext(filename)
    if ext.lower() not in READABLE_EXT and ext != "":
        return None, f"File type {ext} not allowed"

    if category:
        cat_path = safe_path(src_path, category)
        if not cat_path:
            return None, "Invalid category path"
        os.makedirs(cat_path, exist_ok=True)
        file_path = os.path.join(cat_path, filename)
    else:
        file_path = os.path.join(src_path, filename)

    final_path = os.path.normpath(file_path)
    if not final_path.startswith(os.path.normpath(src_path)):
        return None, "Path traversal not allowed"

    existed = os.path.isfile(final_path)
    try:
        with open(final_path, "w", encoding="utf-8") as f:
            f.write(content)
        size = os.path.getsize(final_path)
        return {
            "action": "updated" if existed else "created",
            "source": source_key,
            "category": category or "(root)",
            "file": filename,
            "path": final_path,
            "size": size,
            "sizeHuman": _human_size(size),
            "timestamp": datetime.now().isoformat(),
        }, None
    except Exception as e:
        return None, str(e)


def knowledge_delete(source_key, category, filename):
    """Delete a knowledge file. Only writable sources allowed."""
    cfg = KNOWLEDGE_SOURCES.get(source_key)
    if not cfg:
        return None, f"Unknown source '{source_key}'"
    if not cfg["writable"]:
        return None, f"Source '{cfg['label']}' is read-only"

    src_path = cfg["path"]
    if category:
        file_path = safe_path(src_path, category, filename)
    else:
        file_path = safe_path(src_path, filename)

    if not file_path or not os.path.isfile(file_path):
        return None, f"File not found: {filename}"

    try:
        size = os.path.getsize(file_path)
        os.remove(file_path)
        return {
            "action": "deleted",
            "source": source_key,
            "category": category or "(root)",
            "file": filename,
            "size": size,
            "timestamp": datetime.now().isoformat(),
        }, None
    except Exception as e:
        return None, str(e)


def knowledge_mkdir(source_key, category):
    """Create a new category (folder) in a writable knowledge source."""
    cfg = KNOWLEDGE_SOURCES.get(source_key)
    if not cfg:
        return None, f"Unknown source '{source_key}'"
    if not cfg["writable"]:
        return None, f"Source '{cfg['label']}' is read-only"

    src_path = cfg["path"]
    if not category or ".." in category:
        return None, "Invalid category name"

    cat_path = safe_path(src_path, category)
    if not cat_path:
        return None, "Invalid category path"

    if os.path.exists(cat_path):
        return None, f"Category '{category}' already exists"

    try:
        os.makedirs(cat_path, exist_ok=True)
        return {
            "action": "created",
            "source": source_key,
            "category": category,
            "path": cat_path,
            "timestamp": datetime.now().isoformat(),
        }, None
    except Exception as e:
        return None, str(e)


def knowledge_get_stats():
    """Aggregate statistics across all knowledge sources."""
    stats = {
        "totalSources": len(KNOWLEDGE_SOURCES),
        "totalFiles": 0,
        "totalSize": 0,
        "totalCategories": 0,
        "writableSources": 0,
        "sources": {},
    }
    for key, cfg in KNOWLEDGE_SOURCES.items():
        src_path = cfg["path"]
        exists = os.path.isdir(src_path)
        file_count = 0
        folder_count = 0
        total_size = 0
        ext_breakdown = {}
        if exists:
            try:
                for root, dirs, files in os.walk(src_path):
                    dirs[:] = [
                        d
                        for d in dirs
                        if not d.startswith(".")
                        and d not in ("__pycache__", "node_modules", ".git")
                    ]
                    if root == src_path:
                        folder_count = len(dirs)
                    for f in files:
                        fp = os.path.join(root, f)
                        fsize = os.path.getsize(fp)
                        file_count += 1
                        total_size += fsize
                        _, ext = os.path.splitext(f)
                        ext = ext.lower() or "(no ext)"
                        ext_breakdown[ext] = ext_breakdown.get(ext, 0) + 1
            except PermissionError:
                pass

        stats["sources"][key] = {
            "label": cfg["label"],
            "icon": cfg["icon"],
            "exists": exists,
            "writable": cfg["writable"],
            "files": file_count,
            "folders": folder_count,
            "size": total_size,
            "sizeHuman": _human_size(total_size),
            "extensions": ext_breakdown,
        }
        stats["totalFiles"] += file_count
        stats["totalSize"] += total_size
        stats["totalCategories"] += folder_count
        if cfg["writable"]:
            stats["writableSources"] += 1

    stats["totalSizeHuman"] = _human_size(stats["totalSize"])
    return stats


# ========== WEBGATE FUNCTIONS ==========


def _check_port(port, timeout=0.3):
    """Check if a port is listening."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(timeout)
        result = s.connect_ex(("127.0.0.1", port))
        s.close()
        return result == 0
    except Exception:
        return False


def _get_podman_containers():
    """Get list of podman containers with status."""
    try:
        result = subprocess.run(
            ["podman", "ps", "-a", "--format", "json"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode != 0:
            return {"error": result.stderr.strip(), "containers": []}
        raw = json.loads(result.stdout) if result.stdout.strip() else []
        containers = []
        for c in raw:
            containers.append(
                {
                    "id": c.get("Id", "")[:12],
                    "name": (
                        c.get("Names", [c.get("Name", "unknown")])[0]
                        if isinstance(c.get("Names"), list)
                        else c.get("Names", c.get("Name", "unknown"))
                    ),
                    "image": c.get("Image", ""),
                    "state": c.get("State", "unknown"),
                    "status": c.get("Status", ""),
                    "ports": c.get("Ports", []),
                    "created": c.get("Created", ""),
                }
            )
        return {"containers": containers, "total": len(containers)}
    except FileNotFoundError:
        return {"error": "Podman not found in PATH", "containers": []}
    except subprocess.TimeoutExpired:
        return {"error": "Podman command timed out", "containers": []}
    except Exception as e:
        return {"error": str(e), "containers": []}


def _get_podman_version():
    """Get podman version string."""
    try:
        result = subprocess.run(
            ["podman", "--version"], capture_output=True, text=True, timeout=5
        )
        return result.stdout.strip() if result.returncode == 0 else None
    except Exception:
        return None


def _get_workspace_info(ws):
    """Get workspace folder info."""
    p = ws["path"]
    exists = os.path.isdir(p)
    info = {
        "key": ws["key"],
        "label": ws["label"],
        "path": p,
        "icon": ws["icon"],
        "exists": exists,
        "files": 0,
        "folders": 0,
        "sizeHuman": "N/A",
    }
    if exists:
        try:
            entries = os.listdir(p)
            info["files"] = sum(
                1 for e in entries if os.path.isfile(os.path.join(p, e))
            )
            info["folders"] = sum(
                1
                for e in entries
                if os.path.isdir(os.path.join(p, e)) and not e.startswith(".")
            )
        except PermissionError:
            pass
    # Check if it's a browsable root
    for rk, rc in BROWSE_ROOTS.items():
        if os.path.normpath(rc["path"]) == os.path.normpath(p):
            info["browseRoot"] = rk
            break
    return info


def get_webgate_status():
    """Aggregate status for the WebGate dashboard."""
    # Workspaces
    workspaces = [_get_workspace_info(ws) for ws in WEBGATE_WORKSPACES]

    # Services / ports
    services = []
    for svc in WEBGATE_SERVICES:
        alive = _check_port(svc["port"])
        services.append(
            {
                "name": svc["name"],
                "port": svc["port"],
                "icon": svc["icon"],
                "url": svc["url"],
                "alive": alive,
                "status": "ONLINE" if alive else "OFFLINE",
            }
        )

    # Podman
    podman_version = _get_podman_version()
    podman = _get_podman_containers()
    podman["version"] = podman_version
    podman["installed"] = podman_version is not None

    # Browse roots
    roots = []
    for key, cfg in BROWSE_ROOTS.items():
        roots.append(
            {
                "key": key,
                "label": cfg["label"],
                "icon": cfg["icon"],
                "exists": os.path.isdir(cfg["path"]),
            }
        )

    return {
        "workspaces": workspaces,
        "services": services,
        "podman": podman,
        "browseRoots": roots,
    }


class CORSHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-API-KEY")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        params = urllib.parse.parse_qs(parsed.query)

        # ---- WebGate API ----
        if path == "/api/webgate/status":
            data = get_webgate_status()
            self._json_response(data)
            return

        if path == "/api/webgate/podman":
            podman = _get_podman_containers()
            podman["version"] = _get_podman_version()
            self._json_response(podman)
            return

        if path == "/api/webgate/services":
            services = []
            for svc in WEBGATE_SERVICES:
                alive = _check_port(svc["port"])
                services.append(
                    {
                        "name": svc["name"],
                        "port": svc["port"],
                        "icon": svc["icon"],
                        "url": svc["url"],
                        "alive": alive,
                        "status": "ONLINE" if alive else "OFFLINE",
                    }
                )
            self._json_response(services)
            return

        # ---- Knowledge API (GET) ----
        if path == "/api/knowledge/sources":
            self._json_response(knowledge_get_sources())
            return

        if path == "/api/knowledge/list":
            source = params.get("source", [None])[0]
            cat = params.get("cat", [None])[0]
            if not source:
                self._json_error(
                    400,
                    "Missing 'source' parameter. Use: kb, lib, a0_knowledge, a0_default, cc, prompts",
                )
                return
            data, err = knowledge_list_files(source, cat)
            if err:
                self._json_error(404, err)
                return
            self._json_response(data)
            return

        if path == "/api/knowledge/read":
            source = params.get("source", [None])[0]
            cat = params.get("cat", [None])[0]
            fname = params.get("file", [None])[0]
            if not source:
                self._json_error(400, "Missing 'source' parameter")
                return
            src_path, cfg = _resolve_knowledge_source(source)
            if not src_path:
                self._json_error(400, f"Unknown source '{source}'")
                return
            if not fname:
                self._json_error(400, "Missing 'file' parameter")
                return
            # Use cat if provided, otherwise read from root
            data, err = read_file_content(src_path, cat or ".", fname)
            if err:
                self._json_error(404, err)
                return
            data["source"] = source
            self._json_response(data)
            return

        if path == "/api/knowledge/search":
            q = params.get("q", [None])[0]
            source = params.get("source", ["all"])[0]
            limit = int(params.get("limit", ["50"])[0])
            if not q:
                self._json_error(400, "Missing 'q' (query) parameter")
                return
            data = knowledge_search(q, source, min(limit, 100))
            self._json_response(data)
            return

        if path == "/api/knowledge/stats":
            self._json_response(knowledge_get_stats())
            return

        # ---- Generic Browse API ----
        if path == "/api/browse/roots":
            roots = []
            for key, cfg in BROWSE_ROOTS.items():
                roots.append(
                    {
                        "key": key,
                        "label": cfg["label"],
                        "icon": cfg["icon"],
                        "exists": os.path.isdir(cfg["path"]),
                    }
                )
            self._json_response(roots)
            return

        if path == "/api/browse/categories":
            root_key = params.get("root", [None])[0]
            root_path, cfg = _resolve_root(root_key)
            if not root_path:
                self._json_error(
                    400, f"Unknown root '{root_key}'. Use: kb, lib, cc, a0"
                )
                return
            cats = get_categories(root_path)
            self._json_response(
                {"root": root_key, "label": cfg["label"], "categories": cats}
            )
            return

        if path == "/api/browse/files":
            root_key = params.get("root", [None])[0]
            cat = params.get("cat", [None])[0]
            root_path, cfg = _resolve_root(root_key)
            if not root_path:
                self._json_error(400, f"Unknown root '{root_key}'")
                return
            if not cat:
                self._json_error(400, "Missing 'cat' parameter")
                return
            files = get_files(root_path, cat)
            if files is None:
                self._json_error(404, f"Folder '{cat}' not found in {cfg['label']}")
                return
            self._json_response(
                {"root": root_key, "category": cat, "files": files, "total": len(files)}
            )
            return

        if path == "/api/browse/read":
            root_key = params.get("root", [None])[0]
            cat = params.get("cat", [None])[0]
            fname = params.get("file", [None])[0]
            root_path, cfg = _resolve_root(root_key)
            if not root_path:
                self._json_error(400, f"Unknown root '{root_key}'")
                return
            if not cat or not fname:
                self._json_error(400, "Missing 'cat' and/or 'file' parameter")
                return
            data, err = read_file_content(root_path, cat, fname)
            if err:
                self._json_error(404, err)
                return
            self._json_response(data)
            return

        # ---- Legacy KB API (backwards compat) ----
        if path == "/api/kb/categories":
            root_path = BROWSE_ROOTS["kb"]["path"]
            self._json_response(get_categories(root_path))
            return
        if path == "/api/kb/files":
            cat = params.get("cat", [None])[0]
            if not cat:
                self._json_error(400, "Missing 'cat' parameter")
                return
            files = get_files(BROWSE_ROOTS["kb"]["path"], cat)
            if files is None:
                self._json_error(404, f"Category '{cat}' not found")
                return
            self._json_response({"category": cat, "files": files, "total": len(files)})
            return
        if path == "/api/kb/read":
            cat = params.get("cat", [None])[0]
            fname = params.get("file", [None])[0]
            if not cat or not fname:
                self._json_error(400, "Missing 'cat' and/or 'file' parameter")
                return
            data, err = read_file_content(BROWSE_ROOTS["kb"]["path"], cat, fname)
            if err:
                self._json_error(404, err)
                return
            self._json_response(data)
            return

        # ---- Default static file serving ----
        super().do_GET()

    def _read_json_body(self):
        """Read and parse JSON body from POST request."""
        try:
            length = int(self.headers.get("Content-Length", 0))
            if length == 0:
                return None, "Empty request body"
            if length > 10 * 1024 * 1024:  # 10MB max
                return None, "Request body too large"
            raw = self.rfile.read(length)
            return json.loads(raw.decode("utf-8")), None
        except json.JSONDecodeError:
            return None, "Invalid JSON"
        except Exception as e:
            return None, str(e)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # ---- Knowledge API (POST) ----
        if path == "/api/knowledge/write":
            body, err = self._read_json_body()
            if err:
                self._json_error(400, err)
                return
            source = body.get("source")
            category = body.get("category", "")
            filename = body.get("file") or body.get("filename")
            content = body.get("content")
            if not source or not filename or content is None:
                self._json_error(
                    400,
                    "Required fields: source, file (or filename), content. Optional: category",
                )
                return
            data, err = knowledge_write(source, category, filename, content)
            if err:
                self._json_error(400, err)
                return
            self._json_response(data, 201)
            return

        if path == "/api/knowledge/delete":
            body, err = self._read_json_body()
            if err:
                self._json_error(400, err)
                return
            source = body.get("source")
            category = body.get("category", "")
            filename = body.get("file") or body.get("filename")
            if not source or not filename:
                self._json_error(
                    400,
                    "Required fields: source, file (or filename). Optional: category",
                )
                return
            data, err = knowledge_delete(source, category, filename)
            if err:
                self._json_error(400, err)
                return
            self._json_response(data)
            return

        if path == "/api/knowledge/mkdir":
            body, err = self._read_json_body()
            if err:
                self._json_error(400, err)
                return
            source = body.get("source")
            category = body.get("category")
            if not source or not category:
                self._json_error(400, "Required fields: source, category")
                return
            data, err = knowledge_mkdir(source, category)
            if err:
                self._json_error(400, err)
                return
            self._json_response(data, 201)
            return

        self._json_error(404, f"Unknown POST endpoint: {path}")

    def _json_response(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _json_error(self, status, msg):
        self._json_response({"error": msg}, status)

    def log_message(self, format, *args):
        # Quieter logs — only show API calls
        msg = format % args
        if "/api/" in msg or "404" in msg or "500" in msg:
            super().log_message(format, *args)


if __name__ == "__main__":
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("", PORT), CORSHandler) as httpd:
        httpd.daemon_threads = True
        print(f"\n  JIMBO HQ Dashboard Server")
        print(f"  ========================")
        print(f"  http://localhost:{PORT}")
        print(f"  Serving: {DIRECTORY}")
        print(f"  Browse Roots:")
        for k, cfg in BROWSE_ROOTS.items():
            status = "OK" if os.path.isdir(cfg["path"]) else "MISSING"
            print(f"    {cfg['icon']} {cfg['label']}: {cfg['path']}  [{status}]")
        print(f"  Knowledge Sources:")
        for k, cfg in KNOWLEDGE_SOURCES.items():
            status = "OK" if os.path.isdir(cfg["path"]) else "MISSING"
            rw = "RW" if cfg["writable"] else "RO"
            print(f"    {cfg['icon']} {cfg['label']}: {cfg['path']}  [{status}] [{rw}]")
        print(f"  Press Ctrl+C to stop\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  Server stopped.")
