# DEVz HUB — Command Center + Architecture Graph

> Kompletna dokumentacja systemu DEVz HUB — dashboard, backend graph API, React Flow visualizer.
> Data: 2026-02-20 · v2.0

---

## 1. Przegląd systemu

DEVz HUB to zintegrowane centrum dowodzenia workspace'u `U:\The_DEVz_HUB_of_work`.  
Składa się z **3 niezależnych serwisów** komunikujących się przez REST API:

| Serwis | Port | Technologia | Lokalizacja |
|--------|------|------------|-------------|
| **DEVz HUB Dashboard** | 4200 | HTML/CSS/JS + Chart.js + Three.js | `U:\JIMBO_NEW_OP_INIT\dashboard\` |
| **Nodle Graph API** | 8001 | Python (http.server, ThreadingHTTPServer) | `U:\The_DEVz_HUB_of_work\react-flow-diagram\backend\` |
| **React Flow Frontend** | 5173 | React 19 + @xyflow/react 12 + Vite 6 | `U:\The_DEVz_HUB_of_work\react-flow-diagram\` |

### Diagram przepływu

```
┌──────────────────────────────┐
│  DEVz HUB Dashboard (:4200) │
│  ┌──────────────────────┐   │
│  │ 🕸️ Graph Section     │   │
│  │  ├─ KPI Cards ───────┼───┼──► fetch /api/nodle/stats
│  │  ├─ Node Registry ───┼───┼──► fetch /api/nodle/summary
│  │  ├─ Connection Map ──┼───┼──► fetch /api/nodle/summary
│  │  └─ iframe ──────────┼───┼──► http://localhost:5173
│  └──────────────────────┘   │
│  + Overview, Libraries, KB, │
│    CC, AI, Agents, Infra,   │
│    Converter, 3D, Tasks,    │
│    Notes                    │
└──────────────────────────────┘
         │ fetch()                    │ iframe
         ▼                            ▼
┌─────────────────────┐    ┌─────────────────────────┐
│ Nodle Graph API     │◄───│ React Flow Frontend     │
│ (:8001)             │    │ (:5173)                 │
│                     │    │                         │
│ GET  /nodes         │    │ @xyflow/react 12        │
│ POST /nodes         │    │ Zustand store           │
│ GET  /edges         │    │ Drag & drop nodes       │
│ POST /edges         │    │ Custom node types        │
│ GET  /graph         │    │ Toolbar + NodeLibrary   │
│ POST /sync          │    └─────────────────────────┘
│ GET  /search?q=     │
│ GET  /stats         │
│ GET  /summary       │
│                     │
│ Data: graph_data.json│
└─────────────────────┘
```

---

## 2. DEVz HUB Dashboard

### 2.1 Struktura plików

```
U:\JIMBO_NEW_OP_INIT\dashboard\
├── index.html              ← główny HTML (579 linii, 12 sekcji)
├── server.py               ← prosty HTTP server (Python)
├── DEVZ_HUB_SYSTEM.md      ← ten plik
├── css/
│   └── devzhub.css         ← unified design system (250 linii)
└── js/
    ├── data.js             ← JIMBO.data — biblioteki, KB, CC, ChromaDB, DoD (300 linii)
    ├── devzhub-core.js     ← logika — nav, charts, graph integration (453 linie)
    ├── converter.js        ← XML/JSON/CSV/RSS/Atom converter (328 linii)
    └── three-viz.js        ← Three.js 3D visualization (342 linie)
```

### 2.2 Sekcje dashboardu

| Sekcja | ID | Opis |
|--------|----|------|
| 📊 Overview | `sec-overview` | KPI karty, wykresy Chart.js (KB, CC, Libraries, ChromaDB, AI) |
| 📚 Libraries | `sec-libraries` | 4 główne + 7 dodatkowych bibliotek strategicznych |
| 🧠 Knowledge Base | `sec-kb` | 21 kategorii wiedzy, 3892 plików |
| 🏗️ Control Center | `sec-cc` | 19 folderów danych, 12,805 plików + katalog backupów |
| 🤖 AI Models | `sec-ai` | 6 modeli AI, budget tracking, performance radar |
| 👥 Agents | `sec-agents` | Agent Zero — 5 agentów, Docker, MCP tools |
| ☁️ Infrastructure | `sec-infra` | Caddy proxy, Cloudflare Workers, ChromaDB, serwisy |
| 🔄 Converter | `sec-converter` | Konwerter formatów: XML ↔ JSON ↔ CSV ↔ JSONL ↔ Markdown |
| 🕸️ Graph | `sec-graph` | **Architecture Graph** — iframe React Flow + tabele z API |
| 🌐 3D View | `sec-3d` | Three.js 3D globe visualization bibliotek |
| ✅ Tasks | `sec-tasks` | Task list + Definition of Done (localStorage) |
| 📝 Notes | `sec-notes` | Notatnik z auto-save do localStorage |

### 2.3 Design system

- **Font**: JetBrains Mono (monospace)
- **Tło**: `#0a0a0a` (dark theme)
- **Border-radius**: `0` (ostre krawędzie)
- **Karty**: kolorowy lewy border (4px), system kart `.card`, `.card.purple`, `.card.green`, `.card.yellow`
- **Badge'e**: `.b-active` (zielony), `.b-empty` (szary), `.b-warn` (żółty), `.b-hot` (czerwony), `.b-blue`, `.b-purple`

### 2.4 Uruchamianie

```powershell
cd U:\JIMBO_NEW_OP_INIT\dashboard
python server.py           # domyślnie port 4200
python server.py 8080      # custom port
```

---

## 3. Nodle Graph API (Backend)

### 3.1 Opis

Samodzielny backend REST API zastępujący pełny Nodle/FastAPI.  
Oparty na `http.server.HTTPServer` z `ThreadingMixIn` — obsługuje wiele reqestów jednocześnie.  
Dane przechowywane w pliku JSON (`graph_data.json`).

### 3.2 Plik: `server.py`

- **Lokalizacja**: `U:\The_DEVz_HUB_of_work\react-flow-diagram\backend\server.py`
- **Linie**: ~300
- **Zależności**: zero (stdlib Python)
- **Threading**: `ThreadingHTTPServer` — zapobiega blokowaniu przez długotrwałe połączenia
- **CORS**: `Access-Control-Allow-Origin: *`

### 3.3 Endpointy API

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/nodle/nodes` | Wszystkie node'y |
| `GET` | `/api/nodle/nodes/:id` | Pojedynczy node |
| `POST` | `/api/nodle/nodes` | Utwórz nowy node |
| `PUT` | `/api/nodle/nodes/:id` | Aktualizuj node |
| `DELETE` | `/api/nodle/nodes/:id` | Usuń node (+ powiązane edge'e) |
| `GET` | `/api/nodle/edges` | Wszystkie edge'e |
| `POST` | `/api/nodle/edges` | Utwórz nowy edge |
| `DELETE` | `/api/nodle/edges/:id` | Usuń edge |
| `GET` | `/api/nodle/graph` | Pełny graf (nodes + edges) |
| `POST` | `/api/nodle/sync` | Zastąp cały graf (ochrona przed pustym sync) |
| `GET` | `/api/nodle/search?q=` | Wyszukaj node'y po nazwie/opisie/typie |
| `GET` | `/api/nodle/stats` | Statystyki dla dashboardu (totalNodes, totalEdges, nodeTypes, edgeLabels) |
| `GET` | `/api/nodle/summary` | Kompaktowe podsumowanie (listy nodes + edges z nazwami) |

### 3.4 Ochrona danych

Endpoint `/sync` odrzuca puste payloady — jeśli frontend wyśle `nodes: []` a backend ma dane, zwraca aktualne dane zamiast nadpisywać. Zapobiega to wymazaniu grafu przez race condition przy starcie React Flow.

### 3.5 Pre-populated graph

Plik `graph_data.json` zawiera architekturę DEVz HUB:

**14 nodes:**

| ID | Nazwa | Typ |
|----|-------|-----|
| `hub-main` | DEVz HUB Dashboard | application |
| `agent-zero` | Agent Zero | agent |
| `react-flow` | React Flow Diagram | application |
| `nodle-api` | Nodle Graph API | api |
| `kb-store` | Knowledge Base | kg |
| `libraries` | Strategic Libraries | infrastructure |
| `control-center` | Control Center | infrastructure |
| `chromadb` | ChromaDB | vector_db |
| `caddy-proxy` | Caddy Reverse Proxy | infrastructure |
| `cf-workers` | Cloudflare Workers | service |
| `ai-models` | AI Model Fleet | ai |
| `movie-system` | Movie Review System | application |
| `moa-pipeline` | MOA Pipeline | rag |
| `converter` | Data Converter | service |

**20 edges (połączenia):**

| From → To | Relacja |
|-----------|---------|
| DEVz HUB → Agent Zero | monitors |
| DEVz HUB → React Flow | embeds graph |
| DEVz HUB → Knowledge Base | displays stats |
| DEVz HUB → Control Center | displays stats |
| DEVz HUB → Libraries | displays stats |
| DEVz HUB → AI Models | pricing & scoring |
| DEVz HUB → Converter | contains |
| DEVz HUB → Caddy Proxy | routes through |
| React Flow → Nodle API | CRUD API |
| Agent Zero → AI Models | uses models |
| Agent Zero → KB | reads/writes |
| Agent Zero → ChromaDB | vector search |
| KB → ChromaDB | indexed in |
| Caddy → Agent Zero | proxy :50001 |
| Caddy → DEVz HUB | proxy :5025 |
| Caddy → Movie System | proxy :5675 |
| CF Workers → MOA Pipeline | orchestrates |
| MOA → AI Models | calls models |
| MOA → KB | generates to |
| Nodle API → DEVz HUB | summary API |

### 3.6 Uruchamianie

```powershell
cd U:\The_DEVz_HUB_of_work\react-flow-diagram\backend
python server.py            # domyślnie port 8001
python server.py 9000       # custom port
```

---

## 4. React Flow Frontend

### 4.1 Opis

Interaktywny wizualizer grafów oparty na React 19 + @xyflow/react 12.  
Drag & drop node'ów, edycja krawędzi, wyszukiwanie, custom node types.

### 4.2 Stack technologiczny

| Package | Wersja |
|---------|--------|
| React | 19.1.0 |
| @xyflow/react | 12.8.2 |
| Zustand | 5.0.6 |
| Vite | 6.4.1 |
| TypeScript | 5.9.3 |
| Axios | 1.9.0 |

### 4.3 Struktura plików (kluczowe)

```
U:\The_DEVz_HUB_of_work\react-flow-diagram\
├── .env                    ← VITE_FASTCODE_URL=http://localhost:8001
├── start.bat               ← launcher: backend + frontend
├── backend/
│   ├── server.py           ← Nodle Graph API
│   └── graph_data.json     ← dane grafu (14 nodes, 20 edges)
├── src/
│   ├── App.tsx             ← główny komponent ReactFlow
│   ├── types.ts            ← interfejsy TypeScript
│   ├── store/
│   │   └── diagramStore.ts ← Zustand store (CRUD, sync, WebSocket)
│   ├── api/
│   │   ├── noodleClient.ts ← Axios client do Nodle API
│   │   └── websocket.ts    ← WebSocket client (reconnect)
│   └── components/         ← 17 komponentów UI
│       ├── Toolbar.tsx
│       ├── NodeLibrary.tsx
│       ├── NodeModal.tsx
│       ├── NodePanel.tsx
│       ├── CustomNode.tsx
│       ├── CustomEdge.tsx
│       ├── GroupNode.tsx
│       ├── LogViewer.tsx
│       └── ...
└── package.json
```

### 4.4 Custom Node Types

- `custom` — standardowy node z metadanymi
- `group` — grupowanie node'ów
- `localLLMProcessor` — procesor lokalnych modeli LLM

### 4.5 Uruchamianie

```powershell
cd U:\The_DEVz_HUB_of_work\react-flow-diagram
npm run dev                 # Vite dev server na port 5173
```

Lub użyj launchera:

```powershell
U:\The_DEVz_HUB_of_work\react-flow-diagram\start.bat
```

---

## 5. Integracja Dashboard ↔ Graph API

### 5.1 Mechanizm

Dashboard (`devzhub-core.js`) ładuje dane z Graph API przez `fetch()`:

```javascript
var GRAPH_API = 'http://localhost:8001/api/nodle';
var GRAPH_FRONTEND = 'http://localhost:5173';
```

- **Lazy loading** — dane ładowane tylko po kliknięciu zakładki 🕸️ Graph
- **KPI Cards** — `fetch(/stats)` → totalNodes, totalEdges, nodeTypes count, edgeLabels count
- **Node Registry** — `fetch(/summary)` → tabela z ikonami typów i badge'ami statusu
- **Connection Map** — `fetch(/summary)` → tabela from → to z etykietami relacji
- **iframe** — React Flow na `http://localhost:5173` — pełny edytor grafów

### 5.2 Obsługa błędów

Gdy Graph API jest niedostępne:
- KPI karty pokazują "ERR"
- Tabela Node Registry: `⚠ Cannot connect to Graph API (localhost:8001). Start the backend first.`
- Console error logowany

---

## 6. Uruchamianie pełnego systemu

### Krok po kroku:

```powershell
# 1. Graph API Backend
cd U:\The_DEVz_HUB_of_work\react-flow-diagram\backend
Start-Process python -ArgumentList "server.py" -WindowStyle Minimized

# 2. React Flow Frontend
cd U:\The_DEVz_HUB_of_work\react-flow-diagram
npm run dev

# 3. DEVz HUB Dashboard
cd U:\JIMBO_NEW_OP_INIT\dashboard
python server.py
```

### Lub jednym skryptem:

```powershell
U:\The_DEVz_HUB_of_work\react-flow-diagram\start.bat
# + osobno:
cd U:\JIMBO_NEW_OP_INIT\dashboard; python server.py
```

### Weryfikacja:

```powershell
# Wszystkie 3 serwisy
python -c "import urllib.request; [print(f'Port {p}:', urllib.request.urlopen(f'http://localhost:{p}',timeout=3).status) for p in [4200, 5173, 8001]]"

# Dane grafu
python -c "import urllib.request,json; r=urllib.request.urlopen('http://localhost:8001/api/nodle/stats',timeout=5); print(json.loads(r.read()))"
```

---

## 7. Znane uwagi

| Temat | Status | Opis |
|-------|--------|------|
| WebSocket | ⚠️ Nie zaimplementowany | React Flow próbuje łączyć się z `ws://localhost:8001/api/realtime/ws` — backend nie obsługuje WS, więc frontend pokazuje błędy reconnect w konsoli. Nie wpływa na funkcjonalność. |
| Sync protection | ✅ Zaimplementowane | Pusty `POST /sync` nie nadpisuje danych w `graph_data.json` |
| Threading | ✅ Naprawione | Backend używa `ThreadingHTTPServer` — obsługuje wiele requestów jednocześnie |
| PowerShell curl | ℹ️ Uwaga | `curl` w PowerShell jest aliasem `Invoke-WebRequest` — użyj `python -c` do testowania API |
| Dashboard server | ℹ️ Uwaga | Prosty `http.server` w Pythonie — restart wymagany po modyfikacji kodu |

---

## 8. API — przykłady użycia

### Dodanie nowego node'a:

```bash
curl -X POST http://localhost:8001/api/nodle/nodes \
  -H "Content-Type: application/json" \
  -d '{"name": "New Service", "type": "service", "description": "Custom service", "position": {"x": 500, "y": 300}}'
```

### Dodanie edge'a:

```bash
curl -X POST http://localhost:8001/api/nodle/edges \
  -H "Content-Type: application/json" \
  -d '{"source": "hub-main", "target": "new-service-id", "label": "monitors"}'
```

### Wyszukiwanie:

```bash
curl http://localhost:8001/api/nodle/search?q=agent
```

### Pobranie pełnego grafu:

```bash
curl http://localhost:8001/api/nodle/graph
```

---

*Wygenerowano automatycznie · DEVz HUB Command Center v2.0*
