---
title: System Overview
---

# Przegląd Systemu

```js
const system = FileAttachment("data/system.json").json();
const costs = FileAttachment("data/costs.json").json();
```

## Zasoby systemu

```js
const kbData = system.knowledge_base.categories.filter(d => d.docs > 0);

Plot.plot({
  title: "Rozkład dokumentów w bazie wiedzy",
  width: 640,
  height: 300,
  marginBottom: 80,
  x: {label: "Kategoria", tickRotate: -35},
  y: {label: "Liczba dokumentów", grid: true},
  color: {scheme: "Observable10"},
  marks: [
    Plot.barY(kbData, {
      x: "name",
      y: "docs",
      fill: "name",
      tip: true,
      sort: {x: "-y"}
    }),
    Plot.ruleY([0])
  ]
})
```

## Pokrycie kategorii KB

```js
const allCategories = system.knowledge_base.categories;

Plot.plot({
  title: "Status kategorii — aktywne vs puste",
  width: 640,
  height: 300,
  marginLeft: 140,
  color: {domain: ["active", "empty"], range: ["#22c55e", "#ef4444"], legend: true},
  marks: [
    Plot.barX(allCategories, {
      y: "name",
      x: d => d.docs || 1,
      fill: "status",
      tip: true,
      sort: {y: "-x"}
    }),
    Plot.text(allCategories, {
      y: "name",
      x: d => d.docs || 1,
      text: d => d.docs > 0 ? d.docs.toLocaleString() : "pusty",
      dx: 5,
      textAnchor: "start",
      fontSize: 11
    })
  ]
})
```

## Serwisy i porty

```js
Inputs.table(system.services, {
  columns: ["name", "port", "status", "type"],
  header: {
    name: "Serwis",
    port: "Port",
    status: "Status",
    type: "Typ"
  },
  format: {
    status: d => d === "active" ? "🟢 Active" : "🔴 Inactive"
  },
  width: {name: 200, port: 80, status: 100, type: 140}
})
```

## Agenci

```js
Plot.plot({
  title: "Profil agentów — modele i narzędzia",
  width: 640,
  height: 300,
  marginLeft: 120,
  marks: [
    Plot.barX(system.agents, {
      y: "name",
      x: "models",
      fill: "#6366f1",
      dx: -0.15,
      tip: true
    }),
    Plot.barX(system.agents, {
      y: "name",
      x: "tools",
      fill: "#00FF41",
      dx: 0.15,
      tip: true
    }),
    Plot.text(system.agents, {
      y: "name",
      x: d => d.models + d.tools,
      text: d => `${d.models}M + ${d.tools}T`,
      dx: 8,
      textAnchor: "start",
      fontSize: 11
    })
  ]
})
```

<div class="grid grid-2">

```js
const totalDocs = system.knowledge_base.categories.reduce((s, c) => s + c.docs, 0);
const activeCats = system.knowledge_base.categories.filter(c => c.status === "active" && c.docs > 0).length;
const totalCats = system.knowledge_base.categories.length;
```

<div class="card">
  <h3>Statystyki KB</h3>
  <table class="data-table">
    <tr><td>Łącznie dokumentów</td><td><strong>${totalDocs.toLocaleString()}</strong></td></tr>
    <tr><td>Aktywne kategorie</td><td><strong class="status-ok">${activeCats}</strong> / ${totalCats}</td></tr>
    <tr><td>Puste kategorie</td><td><strong class="status-warn">${totalCats - activeCats}</strong></td></tr>
    <tr><td>ChromaDB wektory</td><td><strong>4,816</strong></td></tr>
  </table>
</div>

<div class="card">
  <h3>Statystyki agentów</h3>
  <table class="data-table">
    <tr><td>Aktywni agenci</td><td><strong>${system.agents.length}</strong></td></tr>
    <tr><td>Łącznie modeli</td><td><strong>${system.agents.reduce((s,a) => s + a.models, 0)}</strong></td></tr>
    <tr><td>Łącznie narzędzi</td><td><strong>${system.agents.reduce((s,a) => s + a.tools, 0)}</strong></td></tr>
    <tr><td>MCP Tools</td><td><strong>6</strong></td></tr>
  </table>
</div>
</div>
