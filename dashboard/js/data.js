/* ============================================================
   JIMBO HQ — Core Data Store
   Live data from U:\The_DEVz_HUB_of_work scan (2026-02-20)
   ============================================================ */

var JIMBO = window.JIMBO || {};

JIMBO.data = {
  // ========== MAIN LIBRARIES [BIZ] ==========
  libraries: [
    {
      name: "[BIZ] THE_MONEY_MACHINE",
      cls: "BUSINESS",
      color: 0x00ff88,
      hexColor: "#00ff88",
      description: "AI monetization, e-commerce, business tools -- primary revenue library",
      subfolders: ["ai-monetization", "ecommerce", "payment-systems", "business_blueprints", "research_backup"],
      files: 21,
      group: "money",
      position: { x: -8, y: 2, z: 0 }
    },
    {
      name: "[BIZ] THE_BUCKET_OF_BLOOD",
      cls: "BUSINESS",
      color: 0xff0066,
      hexColor: "#ff0066",
      description: "Customer retention, LTV optimization, enterprise sales strategies",
      subfolders: ["customer-retention", "enterprise-sales"],
      files: 4,
      group: "blood",
      position: { x: 0, y: 6, z: 4 }
    },
    {
      name: "[BIZ] THE_NOW",
      cls: "BUSINESS",
      color: 0xffff00,
      hexColor: "#ffff00",
      description: "Quick cash, arbitrage, viral marketing, instant monetization",
      subfolders: ["flipping-arbitrage", "viral-marketing", "research_backup"],
      files: 21,
      group: "now",
      position: { x: 8, y: 2, z: 0 }
    },
    {
      name: "[BIZ] THE_SHADOW_BOXING",
      cls: "BUSINESS",
      color: 0x00aaff,
      hexColor: "#00aaff",
      description: "Growth hacking, competitive intel, automation, psychological triggers",
      subfolders: ["growth-hacking", "competitive-intel", "research_backup"],
      files: 11,
      group: "shadow",
      position: { x: 0, y: -2, z: -4 }
    }
  ],

  // ========== ADDITIONAL LIBRARIES [BIZ] + [PRV] ==========
  additionalLibraries: [
    { name: "[BIZ] BUSINESS_CENTRE", cls: "BUSINESS", color: 0xf59e0b, hexColor: "#f59e0b", files: 6, subfolders: 10, description: "Business plans, templates, strategies", position: { x: -9, y: 8, z: -3 } },
    { name: "[BIZ] business_launches", cls: "BUSINESS", color: 0x8b5cf6, hexColor: "#8b5cf6", files: 6, subfolders: 1, description: "Startup launch materials, go-to-market plans", position: { x: 14, y: 8, z: -1 } },
    { name: "[PRV] AI_LAB", cls: "PRIVATE", color: 0x22c55e, hexColor: "#22c55e", files: 8, subfolders: 11, description: "AI experiments, model testing, fine-tuning lab", position: { x: -14, y: 8, z: 2 } },
    { name: "[PRV] TECH_VAULT", cls: "PRIVATE", color: 0x3b82f6, hexColor: "#3b82f6", files: 2100, subfolders: 17, description: "Technical resources, docs, frameworks -- 2100 files", position: { x: -4, y: 8, z: 4 } },
    { name: "[PRV] PRIVATE_SECTOR", cls: "PRIVATE", color: 0x64748b, hexColor: "#64748b", files: 1, subfolders: 11, description: "Private projects, credentials, internal ops", position: { x: 4, y: 8, z: -3 } },
    { name: "[PRV] TheCHUCKnodle", cls: "PRIVATE", color: 0xef4444, hexColor: "#ef4444", files: 1912, subfolders: 6, description: "Nodle graph engine -- 1912 files", position: { x: 9, y: 8, z: 2 } },
    { name: "[PRV] low_quality_quarantine", cls: "PRIVATE", color: 0x78716c, hexColor: "#78716c", files: 8520, subfolders: 31, description: "Kwarantanna -- pliki niskiej jakosci (8520 files)", position: { x: 0, y: 12, z: 0 } }
  ],

  // ========== KNOWLEDGE BASE ==========
  knowledgeBase: [
    { name: "01_AI_SEO", color: 0xaa00ff, hexColor: "#aa00ff", files: 3111, indexed: 3912, description: "Strategie SEO pod AI, boty, schema.org", position: { x: -12, y: -6, z: 5 } },
    { name: "02_WHITECAT_SYSTEM", color: 0xaa00ff, hexColor: "#aa00ff", files: 0, indexed: 0, description: "Dokumentacja Whitecat", position: { x: -8, y: -6, z: 5 } },
    { name: "03_PYTHON_AUTOMATION", color: 0xaa00ff, hexColor: "#aa00ff", files: 0, indexed: 0, description: "Skrypty Python", position: { x: -4, y: -6, z: 5 } },
    { name: "04_ECOMMERCE_SHOPS", color: 0xaa00ff, hexColor: "#aa00ff", files: 4, indexed: 23, description: "E-commerce: Astro, Stripe, IdoSell", position: { x: 0, y: -6, z: 5 } },
    { name: "05_AGENTS_AND_RAG", color: 0xaa00ff, hexColor: "#aa00ff", files: 12, indexed: 81, description: "Architektura agentów i RAG", position: { x: 4, y: -6, z: 5 } },
    { name: "06_FINANCE", color: 0xaa00ff, hexColor: "#aa00ff", files: 4, indexed: 26, description: "Strategie finansowe", position: { x: 8, y: -6, z: 5 } },
    { name: "07_B2B_SALES", color: 0xaa00ff, hexColor: "#aa00ff", files: 2, indexed: 13, description: "B2B lead generation", position: { x: 12, y: -6, z: 5 } },
    { name: "08_MARKETPLACE", color: 0x8b5cf6, hexColor: "#8b5cf6", files: 0, indexed: 0, description: "Allegro, Amazon, eBay", position: { x: -12, y: -6, z: -5 } },
    { name: "09_BUY_AND_SELL", color: 0x8b5cf6, hexColor: "#8b5cf6", files: 0, indexed: 0, description: "Flipping, okazje rynkowe", position: { x: -8, y: -6, z: -5 } },
    { name: "10_MARKET_ANALYSIS", color: 0x8b5cf6, hexColor: "#8b5cf6", files: 0, indexed: 0, description: "Raporty, analiza konkurencji", position: { x: -4, y: -6, z: -5 } },
    { name: "11_OPPORTUNITIES", color: 0x8b5cf6, hexColor: "#8b5cf6", files: 0, indexed: 0, description: "Nowe nisze, możliwości", position: { x: 0, y: -6, z: -5 } },
    { name: "12_FORECASTING", color: 0x8b5cf6, hexColor: "#8b5cf6", files: 0, indexed: 0, description: "Prognozy 2025-2027", position: { x: 4, y: -6, z: -5 } },
    { name: "13_AI_NEWS", color: 0xaa00ff, hexColor: "#aa00ff", files: 2, indexed: 12, description: "Nowości AI, modele, update", position: { x: 8, y: -6, z: -5 } },
    { name: "14_BLOG_TOPICS", color: 0x8b5cf6, hexColor: "#8b5cf6", files: 0, indexed: 0, description: "Pomysły na artykuły", position: { x: 12, y: -6, z: -5 } },
    { name: "15_READY_ARTICLES", color: 0x8b5cf6, hexColor: "#8b5cf6", files: 0, indexed: 0, description: "Gotowe artykuły", position: { x: -8, y: -10, z: 0 } },
    { name: "16_PROMPT_LIBRARY", color: 0x8b5cf6, hexColor: "#8b5cf6", files: 0, indexed: 0, description: "Kolekcja promptów", position: { x: -4, y: -10, z: 0 } },
    { name: "17_AGENT_KNOWLEDGE", color: 0x8b5cf6, hexColor: "#8b5cf6", files: 0, indexed: 0, description: "Kod i konfiguracja agentów", position: { x: 0, y: -10, z: 0 } },
    { name: "18_MCP_TOOLS", color: 0x8b5cf6, hexColor: "#8b5cf6", files: 0, indexed: 0, description: "Integracje MCP", position: { x: 4, y: -10, z: 0 } },
    { name: "19_PROJECT_PLANS", color: 0x8b5cf6, hexColor: "#8b5cf6", files: 0, indexed: 0, description: "Plany i specyfikacje", position: { x: 8, y: -10, z: 0 } },
    { name: "20_TRAINING_CORPUS", color: 0x8b5cf6, hexColor: "#8b5cf6", files: 0, indexed: 0, description: "Dane treningowe", position: { x: 12, y: -10, z: 0 } },
    { name: "99_ARCHIVE", color: 0x78716c, hexColor: "#78716c", files: 757, indexed: 0, description: "Archiwum starych plików", position: { x: 0, y: -14, z: 0 } }
  ],

  // ========== CONTROL CENTER ==========
  controlCenter: [
    { name: "AI_TOOLS", files: 272, color: "#3b82f6", icon: "[AI]" },
    { name: "AUTOMATION_TOOLS", files: 30, color: "#10b981", icon: "[AT]" },
    { name: "BUSINESS_INTELLIGENCE", files: 2491, color: "#f59e0b", icon: "[BI]" },
    { name: "CLOUD_SERVICES", files: 24, color: "#06b6d4", icon: "[CS]" },
    { name: "DATA_SCIENCE", files: 39, color: "#8b5cf6", icon: "[DS]" },
    { name: "DEVOPS_TOOLS", files: 25, color: "#64748b", icon: "[DO]" },
    { name: "ECOMMERCE_CHATBOTS", files: 129, color: "#ec4899", icon: "[EC]" },
    { name: "FILM_MEDIA", files: 1550, color: "#ef4444", icon: "[FM]" },
    { name: "FINANCE_DATA", files: 1836, color: "#22c55e", icon: "[FD]" },
    { name: "MARKETING_ECOMMERCE", files: 1166, color: "#f97316", icon: "[MK]" },
    { name: "ML_AI_DATASETS", files: 142, color: "#a855f7", icon: "[ML]" },
    { name: "movies", files: 3222, color: "#dc2626", icon: "[MV]" },
    { name: "POLISH_MARKET", files: 5, color: "#71717a", icon: "[PL]" },
    { name: "PROMPT_ENGINEERING", files: 25, color: "#d946ef", icon: "[PE]" },
    { name: "TECH_RESEARCH", files: 1690, color: "#2563eb", icon: "[TR]" },
    { name: "WEB_AUTOMATION", files: 35, color: "#14b8a6", icon: "[WA]" },
    { name: "DATASET_GOLD", files: 15, color: "#eab308", icon: "[DG]" },
    { name: "DATASET_RAW", files: 14, color: "#78716c", icon: "[DR]" },
    { name: "DATASETMOJA", files: 122, color: "#a3a3a3", icon: "[DM]" },
    { name: "LUCjan_MOjA_mac", files: 615, color: "#06b6d4", icon: "[LC]" },
    { name: "_ARCHIVE", files: 30, color: "#78716c", icon: "[AR]" },
    { name: "_agent_stats", files: 15, color: "#22c55e", icon: "[ST]" },
    { name: "_analytics_csv", files: 5, color: "#f59e0b", icon: "[AN]" },
    { name: "_diagrams", files: 4, color: "#8b5cf6", icon: "[DI]" },
    { name: ".venv", files: 2621, color: "#64748b", icon: "[PY]" }
  ],

  // ========== RESEARCH BACKUP (not in LIBRARIES — separate) ==========
  researchBackup: {
    path: "U:\\The_DEVz_HUB_of_work\\JIMBO_RESEARCH_BACKUP",
    totalFiles: 22,
    categories: [
      { name: "ai-tools", files: 1 },
      { name: "competitors", files: 1 },
      { name: "ecommerce", files: 6 },
      { name: "marketing-tools", files: 2 },
      { name: "seo-ai", files: 4 },
      { name: "solutions", files: 3 },
      { name: "trends", files: 3 }
    ],
    note: "Osobny backup research — NIE jest w LIBRARIES. Rozważ przeniesienie do KB lub bibliotek."
  },

  // ========== EXTERNAL TOOLS ==========
  externalTools: [
    { name: "smolagents", status: "ready", description: "HuggingFace agent framework — workspace_guardian.py + jimbo_scout.py, DeepSeek via OpenRouter", type: "agent" },
    { name: "FastCode", status: "ready", description: "Code understanding framework — AST parser, graph builder, embedder, vector store, RAG retrieval", type: "indexer" },
    { name: "youtu-graphrag", status: "ready", description: "Tencent GraphRAG — knowledge graph construction + retrieval, jimbo_indexer.py for auto-upload", type: "graphrag" },
    { name: "visual-explainer", status: "ready", description: "Agent skill — turns terminal output into styled HTML pages with Mermaid diagrams", type: "skill" },
    { name: "fastcode-noodle-adapter", status: "ready", description: "Bridge between FastCode indexer and Nodle graph API", type: "adapter" }
  ],

  // ========== CHROMADB ==========
  chromaDB: {
    totalDocs: 4816,
    collections: 26,
    sizeGB: 0.0691,
    activeCategories: 6,
    position: { x: 0, y: -2, z: 8 }
  },

  // ========== PATHS ==========
  paths: {
    libraries: "U:\\The_DEVz_HUB_of_work\\LIBRARIES",
    knowledgeBase: "U:\\The_DEVz_HUB_of_work\\knowledge_base",
    controlCenter: "U:\\The_DEVz_HUB_of_work\\CONTROL_CENTER",
    workspace: "U:\\The_DEVz_HUB_of_work"
  }
};

// ========== COMPUTED TOTALS ==========
(function() {
  var d = JIMBO.data;
  var libFiles = 0, kbFiles = 0, ccFiles = 0;
  d.libraries.forEach(function(l) { libFiles += l.files; });
  d.additionalLibraries.forEach(function(l) { libFiles += l.files; });
  d.knowledgeBase.forEach(function(k) { kbFiles += k.files; });
  d.controlCenter.forEach(function(c) { ccFiles += c.files; });
  d.totals = { libFiles: libFiles, kbFiles: kbFiles, ccFiles: ccFiles, allFiles: libFiles + kbFiles + ccFiles };
})();

// ========== DEFINITION OF DONE ==========
JIMBO.dodItems = [
  "Kod kompiluje się bez błędów",
  "Testy przechodzą (unit + integration)",
  "Type-check OK (tsc --noEmit)",
  "Brak hardcoded secrets",
  "Dokumentacja zaktualizowana",
  "Impact analysis wykonana",
  "Code review ukończone",
  "Brak dead code bez TODO"
];
