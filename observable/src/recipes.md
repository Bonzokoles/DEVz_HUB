---
title: Recepty Workflow
---

# Recepty Workflow — Optymalne konfiguracje

```js
const models = FileAttachment("data/models.json").json();
const costs = FileAttachment("data/costs.json").json();
```

## Optymalizacja: Jakość vs Koszt

```js
Plot.plot({
  title: "Mapa efektywności — jakość / koszt input",
  width: 720,
  height: 400,
  grid: true,
  x: {label: "Koszt input $/1M tok (log)", type: "log"},
  y: {label: "Jakość (1-10)"},
  r: {range: [8, 35]},
  marks: [
    // Strefy efektywności
    Plot.rect([{x1: 0.01, x2: 0.5, y1: 7, y2: 10}], {
      x1: "x1", x2: "x2", y1: "y1", y2: "y2",
      fill: "#22c55e", fillOpacity: 0.08
    }),
    Plot.text([{x: 0.08, y: 9.8, t: "🏆 Sweet Spot"}], {
      x: "x", y: "y", text: "t", fontSize: 12, fill: "#22c55e"
    }),
    // Modele
    Plot.dot(models, {
      x: d => Math.max(d.input_price, 0.01),
      y: "quality",
      r: "speed",
      fill: d => d.quality / Math.max(d.input_price, 0.01),
      stroke: "#fff",
      strokeWidth: 1,
      tip: true,
      title: d => `${d.name}\nJakość: ${d.quality}\nKoszt: $${d.input_price}\nEfektywność: ${(d.quality / Math.max(d.input_price, 0.01)).toFixed(1)}`
    }),
    Plot.text(models, {
      x: d => Math.max(d.input_price, 0.01),
      y: "quality",
      text: "name",
      dy: -20,
      fontSize: 11,
      fontWeight: 600
    })
  ]
})
```

## Recepty — rekomendowane konfiguracje

<div class="grid grid-2">

<div class="card">
  <h3>🚀 Szybki Research</h3>
  <p><strong>Cel:</strong> Szybkie wyszukiwanie i analiza</p>
  <table class="data-table">
    <tr><td>Agent</td><td>Angels (Researcher)</td></tr>
    <tr><td>Model główny</td><td>Gemini 2.5 Flash</td></tr>
    <tr><td>Fallback</td><td>DeepSeek R1</td></tr>
    <tr><td>Koszt/sesja</td><td>~$0.02</td></tr>
    <tr><td>Narzędzia</td><td>Brave Search, Exa</td></tr>
  </table>
</div>

<div class="card">
  <h3>🧠 Deep Coding</h3>
  <p><strong>Cel:</strong> Złożone zadania programistyczne</p>
  <table class="data-table">
    <tr><td>Agent</td><td>FastCode (Coder)</td></tr>
    <tr><td>Model główny</td><td>Claude 4.5 Sonnet</td></tr>
    <tr><td>Fallback</td><td>Claude Sonnet 4</td></tr>
    <tr><td>Koszt/sesja</td><td>~$0.45</td></tr>
    <tr><td>Narzędzia</td><td>GitHub, Terminal, LSP</td></tr>
  </table>
</div>

<div class="card">
  <h3>💰 Budget Friendly</h3>
  <p><strong>Cel:</strong> Codzienne zadania, draft</p>
  <table class="data-table">
    <tr><td>Agent</td><td>Jimbo (Orchestrator)</td></tr>
    <tr><td>Model główny</td><td>Qwen 2.5 72B</td></tr>
    <tr><td>Fallback</td><td>Bielik 7B (darmowy)</td></tr>
    <tr><td>Koszt/sesja</td><td>~$0.005</td></tr>
    <tr><td>Narzędzia</td><td>KB Search, File Ops</td></tr>
  </table>
</div>

<div class="card">
  <h3>🔍 Krytyczna Analiza</h3>
  <p><strong>Cel:</strong> Review, audyt, ocena jakości</p>
  <table class="data-table">
    <tr><td>Agent</td><td>Norbert (Critic)</td></tr>
    <tr><td>Model główny</td><td>GPT-4o</td></tr>
    <tr><td>Fallback</td><td>Claude Sonnet 4</td></tr>
    <tr><td>Koszt/sesja</td><td>~$0.35</td></tr>
    <tr><td>Narzędzia</td><td>Codacy, LSP, Tests</td></tr>
  </table>
</div>

<div class="card">
  <h3>🌐 SEO & Content</h3>
  <p><strong>Cel:</strong> Optymalizacja treści, marketing</p>
  <table class="data-table">
    <tr><td>Agent</td><td>Elwirka (SEO)</td></tr>
    <tr><td>Model główny</td><td>Claude Sonnet 4</td></tr>
    <tr><td>Fallback</td><td>DeepSeek R1</td></tr>
    <tr><td>Koszt/sesja</td><td>~$0.25</td></tr>
    <tr><td>Narzędzia</td><td>Exa, Brave, Analytics</td></tr>
  </table>
</div>

<div class="card">
  <h3>⚡ Hackathon Mode</h3>
  <p><strong>Cel:</strong> Maksimum wydajności, bez limitu</p>
  <table class="data-table">
    <tr><td>Agent</td><td>Multi-Agent MoE</td></tr>
    <tr><td>Model główny</td><td>Claude 4.5 Sonnet</td></tr>
    <tr><td>Równoległy</td><td>GPT-4o + DeepSeek R1</td></tr>
    <tr><td>Koszt/sesja</td><td>~$1.50</td></tr>
    <tr><td>Narzędzia</td><td>Wszystkie</td></tr>
  </table>
</div>

</div>

## Radar — porównanie recept

```js
const recipes = [
  {recipe: "Szybki Research", quality: 7.8, speed: 9, cost_efficiency: 9.5, versatility: 6, reliability: 8},
  {recipe: "Deep Coding", quality: 9.5, speed: 6, cost_efficiency: 4, versatility: 7, reliability: 9.5},
  {recipe: "Budget Friendly", quality: 7, speed: 8, cost_efficiency: 10, versatility: 8, reliability: 7},
  {recipe: "Krytyczna Analiza", quality: 9, speed: 5, cost_efficiency: 5, versatility: 6, reliability: 9},
  {recipe: "SEO & Content", quality: 8.5, speed: 7, cost_efficiency: 6, versatility: 5, reliability: 8.5},
  {recipe: "Hackathon Mode", quality: 10, speed: 8, cost_efficiency: 2, versatility: 10, reliability: 8}
];

const dims = ["quality", "speed", "cost_efficiency", "versatility", "reliability"];
const dimLabels = {quality: "Jakość", speed: "Szybkość", cost_efficiency: "Oszczędność", versatility: "Wszechstronność", reliability: "Niezawodność"};

const radarData = recipes.flatMap(r =>
  dims.map(d => ({recipe: r.recipe, dim: dimLabels[d], value: r[d]}))
);

Plot.plot({
  title: "Porównanie recept — profil wielowymiarowy",
  width: 720,
  height: 350,
  marginLeft: 120,
  x: {label: "Wynik (0-10)", domain: [0, 10], grid: true},
  fy: {label: "Przepis"},
  color: {scheme: "Observable10", legend: true},
  facet: {marginRight: 60},
  marks: [
    Plot.barX(radarData, {
      fy: "recipe",
      y: "dim",
      x: "value",
      fill: "dim",
      tip: true
    }),
    Plot.ruleX([0])
  ]
})
```

## Tabela kosztów miesięcznych per recepta

```js
Inputs.table(
  [
    {recipe: "Szybki Research", sessions: 100, cost_per_session: 0.02, monthly: 2.00},
    {recipe: "Deep Coding", sessions: 40, cost_per_session: 0.45, monthly: 18.00},
    {recipe: "Budget Friendly", sessions: 200, cost_per_session: 0.005, monthly: 1.00},
    {recipe: "Krytyczna Analiza", sessions: 30, cost_per_session: 0.35, monthly: 10.50},
    {recipe: "SEO & Content", sessions: 25, cost_per_session: 0.25, monthly: 6.25},
    {recipe: "Hackathon Mode", sessions: 10, cost_per_session: 1.50, monthly: 15.00}
  ],
  {
    columns: ["recipe", "sessions", "cost_per_session", "monthly"],
    header: {
      recipe: "Recepta",
      sessions: "Sesje/mies.",
      cost_per_session: "$/sesja",
      monthly: "$/miesiąc"
    },
    sort: "monthly",
    reverse: true,
    format: {
      cost_per_session: d => `$${d.toFixed(3)}`,
      monthly: d => `$${d.toFixed(2)}`
    }
  }
)
```
