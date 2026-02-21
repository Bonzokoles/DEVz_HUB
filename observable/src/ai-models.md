---
title: Modele AI
---

# Modele AI — Analiza porównawcza

```js
const models = FileAttachment("data/models.json").json();
```

## Jakość vs Koszt wejściowy

```js
Plot.plot({
  title: "Jakość modelu vs koszt (input / 1M tokenów)",
  width: 720,
  height: 400,
  grid: true,
  x: {label: "Koszt input $/1M tok", type: "log", domain: [0.05, 20]},
  y: {label: "Jakość (1-10)", domain: [5, 10]},
  r: {range: [5, 30]},
  color: {scheme: "Spectral", legend: true},
  marks: [
    Plot.dot(models, {
      x: d => Math.max(d.input_price, 0.01),
      y: "quality",
      r: "speed",
      fill: "quality",
      stroke: "#fff",
      strokeWidth: 1,
      tip: true,
      title: d => `${d.name}\nJakość: ${d.quality}\nInput: $${d.input_price}\nOutput: $${d.output_price}\nSzybkość: ${d.speed} tok/s`
    }),
    Plot.text(models, {
      x: d => Math.max(d.input_price, 0.01),
      y: "quality",
      text: "name",
      dy: -18,
      fontSize: 11,
      fontWeight: 600
    })
  ]
})
```

## Porównanie cen — Input vs Output

```js
Plot.plot({
  title: "Koszt za 1M tokenów — input vs output",
  width: 720,
  height: 350,
  marginBottom: 80,
  x: {label: "Model", tickRotate: -30},
  y: {label: "$/1M tokenów", grid: true},
  color: {domain: ["Input", "Output"], range: ["#6366f1", "#f59e0b"], legend: true},
  marks: [
    Plot.barY(
      models.flatMap(m => [
        {name: m.name, type: "Input", price: m.input_price},
        {name: m.name, type: "Output", price: m.output_price}
      ]),
      {
        x: "name",
        y: "price",
        fill: "type",
        fx: null,
        tip: true,
        sort: {x: {value: "y", reduce: "max", reverse: true}}
      }
    ),
    Plot.ruleY([0])
  ]
})
```

## Ranking jakości

```js
Plot.plot({
  title: "Ranking jakości modeli",
  width: 720,
  height: 300,
  marginLeft: 140,
  x: {label: "Jakość (1-10)", domain: [0, 10]},
  color: {scheme: "RdYlGn", domain: [5, 10]},
  marks: [
    Plot.barX(models, {
      y: "name",
      x: "quality",
      fill: "quality",
      tip: true,
      sort: {y: "-x"}
    }),
    Plot.text(models, {
      y: "name",
      x: "quality",
      text: d => d.quality.toFixed(1),
      dx: 5,
      textAnchor: "start",
      fontWeight: 700,
      fontSize: 13
    }),
    Plot.ruleX([0])
  ]
})
```

## Szybkość generowania

```js
Plot.plot({
  title: "Szybkość generowania (tok/s)",
  width: 720,
  height: 300,
  marginLeft: 140,
  x: {label: "Tokeny na sekundę", grid: true},
  color: {scheme: "Blues", domain: [0, 200]},
  marks: [
    Plot.barX(models, {
      y: "name",
      x: "speed",
      fill: "speed",
      tip: true,
      sort: {y: "-x"}
    }),
    Plot.text(models, {
      y: "name",
      x: "speed",
      text: d => `${d.speed} tok/s`,
      dx: 5,
      textAnchor: "start",
      fontSize: 11
    }),
    Plot.ruleX([0])
  ]
})
```

## Tabela szczegółowa

```js
Inputs.table(models, {
  columns: ["name", "role", "provider", "input_price", "output_price", "quality", "speed"],
  header: {
    name: "Model",
    role: "Rola",
    provider: "Dostawca",
    input_price: "Input $/1M",
    output_price: "Output $/1M",
    quality: "Jakość",
    speed: "Tok/s"
  },
  sort: "quality",
  reverse: true,
  format: {
    quality: d => `⭐ ${d.toFixed(1)}`,
    input_price: d => `$${d.toFixed(2)}`,
    output_price: d => `$${d.toFixed(2)}`,
    speed: d => `${d} tok/s`
  }
})
```

<div class="grid grid-3">
  <div class="card">
    <h3>Najtańszy</h3>
    <div class="big-number">${models.reduce((a, b) => (a.input_price || 999) < (b.input_price || 999) ? a : b).name}</div>
    <div class="subtitle">$${models.reduce((a, b) => (a.input_price || 999) < (b.input_price || 999) ? a : b).input_price}/1M tok</div>
  </div>
  <div class="card">
    <h3>Najlepszy</h3>
    <div class="big-number">${models.reduce((a, b) => a.quality > b.quality ? a : b).name}</div>
    <div class="subtitle">Jakość: ${models.reduce((a, b) => a.quality > b.quality ? a : b).quality}</div>
  </div>
  <div class="card">
    <h3>Najszybszy</h3>
    <div class="big-number">${models.reduce((a, b) => a.speed > b.speed ? a : b).name}</div>
    <div class="subtitle">${models.reduce((a, b) => a.speed > b.speed ? a : b).speed} tok/s</div>
  </div>
</div>
