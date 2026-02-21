---
title: Baza Wiedzy
---

# Baza Wiedzy — Analiza zasobów

```js
const system = FileAttachment("data/system.json").json();
```

<div class="grid grid-4">
  <div class="card">
    <h3>Dokumenty</h3>
    <div class="big-number">${system.knowledge_base.total_docs.toLocaleString()}</div>
  </div>
  <div class="card">
    <h3>Kategorie</h3>
    <div class="big-number">${system.knowledge_base.categories.length}</div>
  </div>
  <div class="card">
    <h3>ChromaDB</h3>
    <div class="big-number">${system.chromadb.collections}</div>
    <div class="subtitle">kolekcji</div>
  </div>
  <div class="card">
    <h3>Rozmiar DB</h3>
    <div class="big-number">${system.chromadb.size}</div>
  </div>
</div>

## Rozkład dokumentów per kategoria

```js
const categories = system.knowledge_base.categories;
const activeCategories = categories.filter(c => c.docs > 0);

Plot.plot({
  title: "Liczba dokumentów w każdej kategorii KB",
  width: 720,
  height: 400,
  marginBottom: 100,
  x: {label: "Kategoria", tickRotate: -45},
  y: {label: "Dokumenty", grid: true},
  color: {scheme: "Tableau10"},
  marks: [
    Plot.barY(activeCategories, {
      x: "name",
      y: "docs",
      fill: "name",
      tip: true,
      sort: {x: "-y"}
    }),
    Plot.text(activeCategories, {
      x: "name",
      y: "docs",
      text: d => d.docs.toLocaleString(),
      dy: -8,
      fontSize: 12,
      fontWeight: 700
    }),
    Plot.ruleY([0])
  ]
})
```

## Proporcje — udział kategorii

```js
const total = activeCategories.reduce((s, c) => s + c.docs, 0);
const withPct = activeCategories.map(c => ({
  ...c,
  pct: (c.docs / total * 100).toFixed(1)
}));

Plot.plot({
  title: "Procentowy udział kategorii w bazie wiedzy",
  width: 720,
  height: 400,
  marginLeft: 160,
  x: {label: "%", domain: [0, 100], grid: true},
  color: {scheme: "Observable10"},
  marks: [
    Plot.barX(withPct, {
      y: "name",
      x: d => parseFloat(d.pct),
      fill: "name",
      tip: true,
      sort: {y: "-x"}
    }),
    Plot.text(withPct, {
      y: "name",
      x: d => parseFloat(d.pct),
      text: d => `${d.pct}% (${d.docs.toLocaleString()})`,
      dx: 5,
      textAnchor: "start",
      fontSize: 11
    }),
    Plot.ruleX([0])
  ]
})
```

## Status kategorii — aktywne vs puste

```js
Plot.plot({
  title: "Wszystkie kategorie — status",
  width: 720,
  height: 400,
  marginLeft: 180,
  x: {label: "Dokumenty (log)", type: "symlog"},
  color: {domain: ["active", "empty"], range: ["#22c55e", "#ef4444"], legend: true},
  marks: [
    Plot.barX(categories, {
      y: "name",
      x: d => d.docs > 0 ? d.docs : 1,
      fill: "status",
      tip: true,
      sort: {y: "-x"}
    }),
    Plot.text(categories, {
      y: "name",
      x: d => d.docs > 0 ? d.docs : 1,
      text: d => d.docs > 0 ? d.docs.toLocaleString() : "∅",
      dx: 5,
      textAnchor: "start",
      fontSize: 11,
      fill: d => d.docs > 0 ? "#22c55e" : "#ef4444"
    })
  ]
})
```

## Treemap — wizualizacja wielkości

```js
// Treemap using nested rects
const sorted = [...activeCategories].sort((a, b) => b.docs - a.docs);

Plot.plot({
  title: "Relative size — aktywne kategorie",
  width: 720,
  height: 300,
  x: {label: "Kategoria"},
  y: {label: "Dokumenty", grid: true},
  color: {scheme: "Warm"},
  marks: [
    Plot.barY(sorted, {
      x: "name",
      y: "docs",
      fill: "docs",
      tip: true
    }),
    Plot.text(sorted, {
      x: "name",
      y: "docs",
      text: d => `${d.name}\n${d.docs}`,
      dy: -12,
      fontSize: 10,
      lineWidth: 10
    }),
    Plot.ruleY([0])
  ]
})
```

## ChromaDB — szczegóły

<div class="grid grid-2">
  <div class="card">
    <h3>Statystyki wektorowe</h3>
    <table class="data-table">
      <tr><td>Wektory</td><td><strong>${system.chromadb.vectors.toLocaleString()}</strong></td></tr>
      <tr><td>Kolekcje</td><td><strong>${system.chromadb.collections}</strong></td></tr>
      <tr><td>Rozmiar</td><td><strong>${system.chromadb.size}</strong></td></tr>
      <tr><td>Średnia/kolekcja</td><td><strong>${Math.round(system.chromadb.vectors / system.chromadb.collections)}</strong></td></tr>
    </table>
  </div>

  <div class="card">
    <h3>Rekomendacje</h3>
    <ul>
      <li>🔴 <strong>${categories.filter(c => c.docs === 0).length}</strong> pusty${categories.filter(c => c.docs === 0).length !== 1 ? "ch" : ""} kategori${categories.filter(c => c.docs === 0).length !== 1 ? "i" : "a"} — rozważ uzupełnienie</li>
      <li>🟡 <strong>control_center</strong> dominuje z ${categories.find(c => c.name === "control_center")?.docs || 0} dokumentami</li>
      <li>🟢 Łącznie <strong>${total.toLocaleString()}</strong> dokumentów indexed</li>
      <li>📊 Ratio wektory/dokumenty: <strong>${(system.chromadb.vectors / total).toFixed(2)}</strong></li>
    </ul>
  </div>
</div>

## Tabela interaktywna

```js
Inputs.table(categories, {
  columns: ["name", "docs", "status"],
  header: {
    name: "Kategoria",
    docs: "Dokumenty",
    status: "Status"
  },
  sort: "docs",
  reverse: true,
  format: {
    docs: d => d.toLocaleString(),
    status: d => d === "active" ? "🟢 Active" : "🔴 Empty"
  }
})
```
