# 🟠 DEVz HUB

> **Command Center + Architecture Graph — centralne centrum dowodzenia workspace'u.**

[![GitHub](https://img.shields.io/badge/GitHub-Bonzokoles-181717?logo=github)](https://github.com/Bonzokoles)
[![Status](https://img.shields.io/badge/status-active-brightgreen)]()
[![License](https://img.shields.io/badge/license-private-red)]()

---

## 📋 Opis

**DEVz HUB** to zintegrowane centrum zarządzania wieloprojektowym workspace'em. Łączy interaktywny dashboard, wizualizację architekturalną (React Flow), konwerter formatów danych i monitoring AI agentów — wszystko w jednym miejscu.

### Główne możliwości

- 📊 **Dashboard** — 12-sekcyjny panel z KPI, wykresami Chart.js i wizualizacją 3D (Three.js)
- 🕸️ **Architecture Graph** — interaktywny graf zależności (React Flow + Zustand + REST API)
- 🔄 **Data Converter** — konwersja XML ↔ JSON ↔ CSV ↔ YAML ↔ JSONL ↔ Markdown
- 🤖 **Agent Monitoring** — śledzenie agentów AI, modeli i budżetów
- 📚 **Knowledge Base** — przegląd 21 kategorii wiedzy, 3800+ plików
- 🌐 **3D Visualization** — Three.js globe z mapą bibliotek

---

## 🏗️ Architektura

```
┌──────────────────────────────┐
│  DEVz HUB Dashboard (:4200) │
│  ┌──────────────────────┐   │
│  │ 🕸️ Graph Section     │───┼──► Nodle Graph API (:8001)
│  │ 📊 KPI + Charts      │   │
│  │ 🔄 Converter         │   │
│  │ 🌐 3D Globe          │   │
│  └──────────────────────┘   │
│         iframe ─────────────┼──► React Flow (:5173)
└──────────────────────────────┘
```

| Serwis | Port | Stack | Opis |
|--------|------|-------|------|
| **Dashboard** | 4200 | HTML/CSS/JS + Chart.js + Three.js | Główny panel |
| **Graph API** | 8001 | Python (ThreadingHTTPServer) | REST API dla grafu |
| **React Flow** | 5173 | React 19 + @xyflow/react 12 + Vite 6 | Edytor wizualny |

---

## 📁 Struktura repozytorium

```
DEVz_HUB/
├── index.html                  # Landing page
├── THE_Jimbo_DEVz_kgt.html     # DEVz KGT Hub dashboard
├── mit_ai_news.html            # MIT AI News aggregator
├── START_DASHBOARD.bat         # 🚀 Launcher Windows
├── STOP_DASHBOARD.bat          # ⏹ Stop serwisów
├── dashboard/                  # DEVz HUB Command Center
│   ├── index.html              # Dashboard (12 sekcji)
│   ├── server.py               # Python HTTP server
│   ├── DEVZ_HUB_SYSTEM.md     # Dokumentacja systemu
│   ├── config.json             # Konfiguracja
│   ├── css/devzhub.css         # Design system
│   ├── js/
│   │   ├── devzhub-core.js     # Logika nawigacji + integracja
│   │   ├── data.js             # Dane (biblioteki, KB, CC)
│   │   ├── converter.js        # Konwerter formatów
│   │   └── three-viz.js        # Three.js 3D visualization
│   └── modules/                # Moduły rozszerzeń
├── CAY_FEED_conventer/         # Konwerter XML/JSON/CSV/YAML
│   ├── index.html              # Aplikacja konwertera
│   ├── run_windows.bat         # Launcher Windows
│   └── README.md               # Dokumentacja
├── observable/                 # Observable HQ Framework
│   ├── observablehq.config.ts
│   ├── package.json
│   └── src/                    # Observable sources
└── _staging/                   # Staging kopie dashboard
```

---

## 🚀 Szybki start

### Wymagania

- **Python 3.8+** — backend serwery
- **Node.js 18+** — React Flow frontend
- **Przeglądarka** — Chrome / Firefox / Edge

### Uruchomienie jednym kliknięciem

```bash
# Windows — kliknij dwukrotnie:
START_DASHBOARD.bat
```

### Uruchomienie manualne

```powershell
# 1. Graph API Backend
cd dashboard
python server.py                    # → http://localhost:4200

# 2. React Flow (opcjonalnie — jeśli lokalne repo)
cd ../react-flow-diagram
npm install
npm run dev                         # → http://localhost:5173
```

### Weryfikacja

```powershell
# Sprawdź czy serwisy odpowiadają
python -c "import urllib.request; [print(f'Port {p}:', urllib.request.urlopen(f'http://localhost:{p}', timeout=3).status) for p in [4200, 8001, 5173]]"
```

---

## 📊 Sekcje dashboardu

| # | Sekcja | Opis |
|---|--------|------|
| 1 | 📊 Overview | KPI karty, wykresy Chart.js |
| 2 | 📚 Libraries | 4 główne + 7 dodatkowych bibliotek |
| 3 | 🧠 Knowledge Base | 21 kategorii, ~3900 plików |
| 4 | 🏗️ Control Center | 19 folderów, ~12.800 plików |
| 5 | 🤖 AI Models | 6 modeli, budget tracking |
| 6 | 👥 Agents | Agent Zero, Docker, MCP tools |
| 7 | ☁️ Infrastructure | Caddy, Cloudflare Workers, ChromaDB |
| 8 | 🔄 Converter | Multi-format data converter |
| 9 | 🕸️ Graph | Architecture graph (React Flow) |
| 10 | 🌐 3D View | Three.js globe visualization |
| 11 | ✅ Tasks | Task list + DoD (localStorage) |
| 12 | 📝 Notes | Notatnik z auto-save |

---

## 🔌 Graph API

REST API dla wizualizacji architektury. Dane w `graph_data.json`.

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/api/nodle/nodes` | Wszystkie node'y |
| `POST` | `/api/nodle/nodes` | Nowy node |
| `GET` | `/api/nodle/edges` | Wszystkie krawędzie |
| `POST` | `/api/nodle/edges` | Nowa krawędź |
| `GET` | `/api/nodle/graph` | Pełny graf |
| `POST` | `/api/nodle/sync` | Synchronizacja (z ochroną przed nadpisaniem) |
| `GET` | `/api/nodle/search?q=` | Wyszukiwanie |
| `GET` | `/api/nodle/stats` | Statystyki |
| `GET` | `/api/nodle/summary` | Podsumowanie dla dashboardu |

**Pre-populated:** 14 node'ów × 20 krawędzi mapujących architekturę workspace'u.

---

## 🎨 Design System

- **Font:** JetBrains Mono
- **Theme:** Dark (`#0a0a0a`)
- **Border-radius:** 0 (ostre krawędzie)
- **Akcenty:** Kolorowy lewy border (4px) na kartach
- **Badge system:** `.b-active` 🟢 `.b-warn` 🟡 `.b-hot` 🔴 `.b-blue` 🔵 `.b-purple` 🟣

---

## 🔗 Powiązane repozytoria

| Repo | Opis |
|------|------|
| [THE_Jimbo77com_NXT](https://github.com/Bonzokoles/THE_Jimbo77com_NXT) | Jimbo77.com — strona główna (Next.js) |
| [zen-bro-wser.org](https://github.com/Bonzokoles/zen-bro-wser.org) | ZENO Browser — AI-powered browser (Astro + React) |
| [my-bonzo-ai-blog](https://github.com/Bonzokoles/my-bonzo-ai-blog) | MyBonzoAI Blog (Astro) |
| [jimbo-node-system-v2](https://github.com/Bonzokoles/jimbo-node-system-v2) | MCP Server — Node system |
| [Devz_jimbo77_UI](https://github.com/Bonzokoles/Devz_jimbo77_UI) | UI Dashboard |
| [CHUCK_indst_shemat](https://github.com/Bonzokoles/CHUCK_indst_shemat) | CHUCK Industry Schematics |
| [luc-de-zen-on](https://github.com/Bonzokoles/luc-de-zen-on) | Luc de Zen-On |

---

## 📝 Licencja

Prywatne repozytorium — © Bonzokoles 2025-2026

---

*DEVz HUB Command Center v2.0 · Last updated: 2026-03-08*
