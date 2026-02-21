export default {
  title: "DEVz HUB — Wizualizacje",
  theme: ["dashboard", "dark"],
  style: "style.css",
  header: "",
  footer: "",
  pager: true,
  root: "src",
  output: "dist",
  search: true,
  pages: [
    {
      name: "Przegląd",
      pages: [
        {name: "System Overview", path: "/system-overview"},
        {name: "Koszty & Budżet", path: "/costs-budget"},
      ]
    },
    {
      name: "AI & Modele",
      pages: [
        {name: "Modele AI", path: "/ai-models"},
        {name: "Recepty Workflow", path: "/recipes"},
      ]
    },
    {
      name: "Infrastruktura",
      pages: [
        {name: "Baza Wiedzy", path: "/knowledge-base"},
        {name: "Architektura", path: "/architecture"},
      ]
    }
  ]
};
