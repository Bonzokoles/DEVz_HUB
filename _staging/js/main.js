// ============================================
// JIMBO UNIFIED DASHBOARD v2.0 — HUB ENGINE
// Modular system with iframe-based module loading
// ============================================

class JimboHub {
  constructor() {
    this.registry = null;
    this.activeModule = null;
    this.init();
  }

  async init() {
    console.log('[HUB] Jimbo Unified Dashboard v2.0 initializing...');
    await this.loadRegistry();
    this.buildSidebar();
    this.buildHomeGrid();
    this.setupEvents();
    this.startClock();
    feather.replace();
    console.log('[HUB] Ready. Modules:', this.registry.modules.length);
  }

  async loadRegistry() {
    try {
      const res = await fetch('modules/registry.json');
      this.registry = await res.json();
    } catch (e) {
      console.warn('[HUB] Cannot fetch registry, using embedded fallback');
      this.registry = {
        modules: [
          { id:'system-overview', name:'System Overview', icon:'activity', color:'#00FF41',
            description:'System health, agent status, costs', path:'modules/system-overview/index.html', enabled:true, order:1 },
          { id:'kb-dashboard', name:'Knowledge Base', icon:'database', color:'#a855f7',
            description:'ChromaDB knowledge base visualization', path:'modules/kb-dashboard/index.html', enabled:true, order:2 },
          { id:'mit-ai-news', name:'MIT AI News', icon:'rss', color:'#6366f1',
            description:'Latest AI articles from MIT News', path:'modules/mit-ai-news/index.html', enabled:true, order:3 }
        ],
        external_links: [
          { id:'jimbo-kgt', name:'Jimbo DEVz KGT', icon:'terminal', color:'#00d9ff',
            description:'Full command dashboard', url:'file:///C:/THE_Jimbo_DEVz_kgt/THE_Jimbo_DEVz_kgt.html' }
        ]
      };
    }

    // Sort modules by order
    this.registry.modules.sort((a, b) => (a.order || 99) - (b.order || 99));

    // Update module count
    const countEl = document.getElementById('moduleCount');
    if (countEl) countEl.textContent = this.registry.modules.filter(m => m.enabled).length;
  }

  buildSidebar() {
    const nav = document.getElementById('moduleNav');
    const extNav = document.getElementById('externalNav');

    // Module nav items
    nav.innerHTML = this.registry.modules
      .filter(m => m.enabled)
      .map(m => `
        <div class="nav-item" data-module="${m.id}" title="${m.description}">
          <i data-feather="${m.icon}" style="color:${m.color}"></i>
          <span class="nav-label">${m.name}</span>
        </div>
      `).join('');

    // External links
    extNav.innerHTML = (this.registry.external_links || []).map(link => `
      <a class="nav-item" href="${link.url}" target="_blank" title="${link.description}">
        <i data-feather="${link.icon}" style="color:${link.color}"></i>
        <span class="nav-label">${link.name}</span>
        <i data-feather="external-link" style="width:12px;height:12px;color:var(--dim)"></i>
      </a>
    `).join('');
  }

  buildHomeGrid() {
    const grid = document.getElementById('moduleGrid');
    const extGrid = document.getElementById('externalGrid');

    // Module cards
    grid.innerHTML = this.registry.modules
      .filter(m => m.enabled)
      .map(m => `
        <div class="module-card" data-module="${m.id}" style="--card-color:${m.color}">
          <div class="module-card-icon" style="background:${m.color}22; color:${m.color}">
            <i data-feather="${m.icon}"></i>
          </div>
          <h3>${m.name}</h3>
          <p>${m.description}</p>
          <div class="card-arrow"><i data-feather="arrow-right"></i></div>
        </div>
      `).join('');

    // External link cards
    extGrid.innerHTML = (this.registry.external_links || []).map(link => `
      <div class="module-card" data-external="${link.url}" style="--card-color:${link.color}">
        <div class="module-card-icon" style="background:${link.color}22; color:${link.color}">
          <i data-feather="${link.icon}"></i>
        </div>
        <h3>${link.name}</h3>
        <p>${link.description}</p>
        <div class="card-arrow"><i data-feather="external-link"></i></div>
      </div>
    `).join('');
  }

  setupEvents() {
    // Sidebar nav click
    document.getElementById('moduleNav').addEventListener('click', e => {
      const item = e.target.closest('[data-module]');
      if (item) this.openModule(item.dataset.module);
    });

    // Home grid card click
    document.getElementById('moduleGrid').addEventListener('click', e => {
      const card = e.target.closest('[data-module]');
      if (card) this.openModule(card.dataset.module);
    });

    // External grid card click
    document.getElementById('externalGrid').addEventListener('click', e => {
      const card = e.target.closest('[data-external]');
      if (card) window.open(card.dataset.external, '_blank');
    });

    // Breadcrumb home
    document.getElementById('bcHome').addEventListener('click', () => this.goHome());

    // Sidebar toggle
    document.getElementById('sidebarToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('collapsed');
    });

    // Mobile menu
    document.getElementById('mobileMenu').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    // Add module info
    const addBtn = document.getElementById('addModuleBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        alert(
          'How to add a new module:\n\n' +
          '1. Create a folder in modules/ (e.g. modules/my-module/)\n' +
          '2. Add index.html inside it\n' +
          '3. Register it in modules/registry.json\n' +
          '4. Refresh the dashboard\n\n' +
          'See modules/_template/ for a starter template.'
        );
      });
    }
  }

  openModule(moduleId) {
    const mod = this.registry.modules.find(m => m.id === moduleId);
    if (!mod) return;

    this.activeModule = mod;

    // Update UI
    document.getElementById('homeScreen').style.display = 'none';
    document.getElementById('moduleFrameWrap').style.display = 'flex';
    document.getElementById('moduleFrame').src = mod.path;
    document.getElementById('bcModule').textContent = mod.name;

    // Update sidebar active state
    document.querySelectorAll('#moduleNav .nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.module === moduleId);
    });

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
  }

  goHome() {
    this.activeModule = null;
    document.getElementById('homeScreen').style.display = '';
    document.getElementById('moduleFrameWrap').style.display = 'none';
    document.getElementById('moduleFrame').src = '';
    document.getElementById('bcModule').textContent = 'Home';

    // Clear active state
    document.querySelectorAll('#moduleNav .nav-item').forEach(item => {
      item.classList.remove('active');
    });
  }

  startClock() {
    const clockEl = document.getElementById('clock');
    const tick = () => {
      const now = new Date();
      clockEl.textContent = now.toLocaleTimeString('pl-PL', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    };
    tick();
    setInterval(tick, 1000);
  }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  window.hub = new JimboHub();
});
