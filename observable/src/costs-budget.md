---
title: Koszty & Budżet
---

# Koszty & Budżet — Analiza finansowa

```js
const costs = FileAttachment("data/costs.json").json();
const models = FileAttachment("data/models.json").json();
```

<div class="grid grid-4">
  <div class="card">
    <h3>Budżet</h3>
    <div class="big-number">$${costs.budget.total}</div>
    <div class="subtitle">miesięcznie</div>
  </div>
  <div class="card">
    <h3>Wydano</h3>
    <div class="big-number">$${costs.spending.ai + costs.spending.cloudflare + costs.spending.other}</div>
    <div class="subtitle">${((costs.spending.ai + costs.spending.cloudflare + costs.spending.other) / costs.budget.total * 100).toFixed(0)}% budżetu</div>
  </div>
  <div class="card">
    <h3>Pozostało</h3>
    <div class="big-number" style="color: #22c55e">$${costs.spending.remaining}</div>
    <div class="subtitle">do wykorzystania</div>
  </div>
  <div class="card">
    <h3>Średni dzienny</h3>
    <div class="big-number">$${(costs.daily_costs.reduce((s, d) => s + d.cost, 0) / costs.daily_costs.length).toFixed(1)}</div>
    <div class="subtitle">ostatnie ${costs.daily_costs.length} dni</div>
  </div>
</div>

## Alokacja budżetu vs wydatki

```js
const budgetData = [
  {category: "AI Modele", budżet: costs.budget.ai, wydane: costs.spending.ai},
  {category: "Cloudflare", budżet: costs.budget.cloudflare, wydane: costs.spending.cloudflare},
  {category: "Bufor", budżet: costs.budget.buffer, wydane: costs.spending.other}
];

Plot.plot({
  title: "Budżet vs Wydatki wg kategorii",
  width: 720,
  height: 350,
  marginBottom: 40,
  x: {label: "Kategoria"},
  y: {label: "$", grid: true},
  color: {domain: ["Budżet", "Wydane"], range: ["#334155", "#00FF41"], legend: true},
  marks: [
    Plot.barY(
      budgetData.flatMap(d => [
        {category: d.category, type: "Budżet", value: d.budżet},
        {category: d.category, type: "Wydane", value: d.wydane}
      ]),
      {
        x: "category",
        y: "value",
        fill: "type",
        tip: true
      }
    ),
    Plot.ruleY([0])
  ]
})
```

## Dzienne koszty — trend

```js
Plot.plot({
  title: "Dzienne koszty AI (ostatnie 7 dni)",
  width: 720,
  height: 300,
  grid: true,
  x: {label: "Data", type: "utc"},
  y: {label: "$", domain: [0, Math.max(...costs.daily_costs.map(d => d.cost)) * 1.2]},
  marks: [
    Plot.areaY(costs.daily_costs, {
      x: d => new Date(d.date),
      y: "cost",
      fill: "#00FF41",
      fillOpacity: 0.15,
      curve: "catmull-rom"
    }),
    Plot.lineY(costs.daily_costs, {
      x: d => new Date(d.date),
      y: "cost",
      stroke: "#00FF41",
      strokeWidth: 2.5,
      curve: "catmull-rom"
    }),
    Plot.dot(costs.daily_costs, {
      x: d => new Date(d.date),
      y: "cost",
      fill: "#00FF41",
      r: 5,
      tip: true,
      title: d => `${d.date}\n$${d.cost.toFixed(2)}`
    }),
    Plot.ruleY([0])
  ]
})
```

## Koszty per model

```js
Plot.plot({
  title: "Wydatki na poszczególne modele",
  width: 720,
  height: 350,
  marginLeft: 160,
  x: {label: "$", grid: true},
  color: {scheme: "Warm"},
  marks: [
    Plot.barX(costs.per_model, {
      y: "model",
      x: "cost",
      fill: "cost",
      tip: true,
      sort: {y: "-x"}
    }),
    Plot.text(costs.per_model, {
      y: "model",
      x: "cost",
      text: d => `$${d.cost.toFixed(2)} (${d.calls} wywołań)`,
      dx: 5,
      textAnchor: "start",
      fontSize: 11
    }),
    Plot.ruleX([0])
  ]
})
```

## Koszt per wywołanie

```js
Plot.plot({
  title: "Średni koszt per wywołanie API ($)",
  width: 720,
  height: 300,
  marginLeft: 160,
  x: {label: "$ / wywołanie", grid: true},
  color: {scheme: "RdYlGn", reverse: true},
  marks: [
    Plot.barX(costs.per_model, {
      y: "model",
      x: d => d.calls > 0 ? d.cost / d.calls : 0,
      fill: d => d.calls > 0 ? d.cost / d.calls : 0,
      tip: true,
      sort: {y: "-x"}
    }),
    Plot.text(costs.per_model, {
      y: "model",
      x: d => d.calls > 0 ? d.cost / d.calls : 0,
      text: d => d.calls > 0 ? `$${(d.cost / d.calls).toFixed(4)}` : "N/A",
      dx: 5,
      textAnchor: "start",
      fontSize: 11
    }),
    Plot.ruleX([0])
  ]
})
```

## Gauge — wykorzystanie budżetu

```js
const totalSpent = costs.spending.ai + costs.spending.cloudflare + costs.spending.other;
const pct = (totalSpent / costs.budget.total * 100);
const gaugeColor = pct > 80 ? "#ef4444" : pct > 60 ? "#f59e0b" : "#22c55e";
```

<div class="grid grid-2">
  <div class="card" style="text-align: center;">
    <h3>Wykorzystanie budżetu</h3>
    <div style="position: relative; width: 200px; height: 120px; margin: 0 auto;">
      <svg viewBox="0 0 200 120" width="200" height="120">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1e293b" stroke-width="16" stroke-linecap="round"/>
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="${gaugeColor}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${pct * 2.51} 251" />
        <text x="100" y="90" text-anchor="middle" fill="${gaugeColor}" font-size="28" font-weight="bold">${pct.toFixed(0)}%</text>
        <text x="100" y="110" text-anchor="middle" fill="#94a3b8" font-size="12">$${totalSpent} / $${costs.budget.total}</text>
      </svg>
    </div>
  </div>

  <div class="card">
    <h3>Podsumowanie</h3>
    <table class="data-table">
      <tr><td>AI Modele</td><td>$${costs.spending.ai} / $${costs.budget.ai}</td></tr>
      <tr><td>Cloudflare</td><td>$${costs.spending.cloudflare} / $${costs.budget.cloudflare}</td></tr>
      <tr><td>Inne</td><td>$${costs.spending.other}</td></tr>
      <tr><td><strong>Razem</strong></td><td><strong>$${totalSpent} / $${costs.budget.total}</strong></td></tr>
      <tr><td>Pozostało</td><td style="color: #22c55e"><strong>$${costs.spending.remaining}</strong></td></tr>
    </table>
  </div>
</div>
