---
toc: false
---

# DEVz HUB — Wizualizacje Systemu

<div class="hero">
  <h2>Interaktywne wizualizacje danych — modele AI, koszty, baza wiedzy, architektura</h2>
</div>

```js
const system = FileAttachment("data/system.json").json();
const costs = FileAttachment("data/costs.json").json();
const models = FileAttachment("data/models.json").json();
```

<div class="grid grid-4">
  <div class="card">
    <h3>Dokumenty KB</h3>
    <div class="big-number">${system.knowledge_base.total_docs.toLocaleString()}</div>
    <div class="subtitle">ChromaDB wektorów</div>
  </div>
  <div class="card">
    <h3>Modele AI</h3>
    <div class="big-number">${models.length}</div>
    <div class="subtitle">w ekosystemie</div>
  </div>
  <div class="card">
    <h3>Agenci</h3>
    <div class="big-number">${system.agents.length}</div>
    <div class="subtitle">aktywnych profili</div>
  </div>
  <div class="card">
    <h3>Budżet</h3>
    <div class="big-number">$${costs.budget.total}</div>
    <div class="subtitle">miesięcznie</div>
  </div>
</div>

## Serwisy

```js
Plot.plot({
  title: "Status serwisów",
  marginLeft: 140,
  width: 640,
  height: 200,
  x: {label: "Port"},
  color: {domain: ["active", "inactive"], range: ["#22c55e", "#ef4444"]},
  marks: [
    Plot.barX(system.services, {
      y: "name",
      x: "port",
      fill: "status",
      tip: true
    }),
    Plot.text(system.services, {
      y: "name",
      x: "port",
      text: d => `${d.port}`,
      dx: 5,
      textAnchor: "start"
    })
  ]
})
```

## Szybki przegląd kosztów

```js
Plot.plot({
  title: "Alokacja budżetu",
  width: 400,
  height: 400,
  marks: [
    Plot.barY(
      [
        {category: "AI Modele", planned: 300, spent: 187},
        {category: "Cloudflare", planned: 100, spent: 42},
        {category: "Bufor", planned: 100, spent: 0}
      ],
      Plot.groupX({y: "sum"}, {
        x: "category",
        y: "planned",
        fill: "#334155",
        tip: true
      })
    ),
    Plot.barY(
      [
        {category: "AI Modele", spent: 187},
        {category: "Cloudflare", spent: 42},
        {category: "Bufor", spent: 0}
      ],
      {
        x: "category",
        y: "spent",
        fill: "#00FF41",
        tip: true
      }
    ),
    Plot.ruleY([0])
  ]
})
```

<div class="grid grid-3">
  <a href="/system-overview" class="card">
    <h3>📊 System Overview</h3>
    <p>Pełny przegląd zasobów, serwisów i agentów</p>
  </a>
  <a href="/ai-models" class="card">
    <h3>🤖 Modele AI</h3>
    <p>Porównanie cen, jakości i zastosowań</p>
  </a>
  <a href="/costs-budget" class="card">
    <h3>💰 Koszty & Budżet</h3>
    <p>Trendy wydatków, ROI, prognozy</p>
  </a>
  <a href="/recipes" class="card">
    <h3>🧪 Recepty</h3>
    <p>Co z czym łączyć — 6 workflow</p>
  </a>
  <a href="/knowledge-base" class="card">
    <h3>📚 Baza Wiedzy</h3>
    <p>ChromaDB, kategorie, pokrycie</p>
  </a>
  <a href="/architecture" class="card">
    <h3>🏗️ Architektura</h3>
    <p>Mermaid diagramy systemu</p>
  </a>
</div>
