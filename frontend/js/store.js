/**
 * SpendPilot AI - Global UI Store, Shell Hydrator & Interactive Modals Manager
 *
 * Changes in this version:
 *  - Dark mode: fully implemented with CSS variable overrides; icon swaps; persisted in localStorage
 *  - PayPal modal: only opens from the dedicated PayPal button (#header-paypal-btn, #sidebar-paypal-btn)
 *    The sidebar/header "PayPal Synced" status badges no longer open the modal (they are informational only)
 *  - All buttons functional (save preferences, refresh session, org switch, etc.)
 */

/* ── Dark-mode CSS injected once ──────────────────────────────────────── */
(function injectDarkCSS() {
  if (document.getElementById('sp-dark-mode-style')) return;
  const style = document.createElement('style');
  style.id = 'sp-dark-mode-style';
  style.textContent = `
    /* ═══ Dark mode overrides ═══
       Tailwind's 'dark' class on <html> triggers these overrides.
       We remap the surface/background tokens to a deep dark palette
       while keeping the primary/accent colours — brutalist feel preserved. */
    html.dark {
      color-scheme: dark;
    }
    html.dark body {
      background: #0f0f11 !important;
    }
    /* Surfaces */
    html.dark .bg-background        { background-color: #0f0f11 !important; }
    html.dark .bg-surface           { background-color: #1a1a1e !important; }
    html.dark .bg-surface-container-lowest { background-color: #1a1a1e !important; }
    html.dark .bg-surface-container-low    { background-color: #222228 !important; }
    html.dark .bg-surface-container        { background-color: #2a2a32 !important; }
    html.dark .bg-surface-container-high   { background-color: #32323c !important; }
    html.dark .bg-surface-container-highest{ background-color: #3a3a46 !important; }
    html.dark .bg-surface-dim              { background-color: #0f0f11 !important; }
    html.dark .bg-surface-bright           { background-color: #2a2a32 !important; }
    /* Text */
    html.dark .text-on-surface         { color: #e8e5ed !important; }
    html.dark .text-on-surface-variant { color: #cac4d0 !important; }
    html.dark .text-outline            { color: #938f99 !important; }
    /* Borders */
    html.dark .brutal-border  { border-color: #e8e5ed !important; }
    html.dark .border-on-surface { border-color: #e8e5ed !important; }
    /* Sidebar */
    html.dark aside { background-color: #1a1a1e !important; border-color: #e8e5ed !important; }
    /* Header */
    html.dark header { background-color: #1a1a1e !important; border-color: #e8e5ed !important; }
    /* Primary fixed (banner bg, etc.) */
    html.dark .bg-primary-fixed  { background-color: #2a1f3d !important; }
    html.dark .text-on-primary-fixed { color: #d3bbff !important; }
    html.dark .text-on-primary-fixed-variant { color: #c7aaff !important; }
    /* Secondary fixed */
    html.dark .bg-secondary-fixed { background-color: #1a2a50 !important; }
    html.dark .text-on-secondary-fixed { color: #b4c5ff !important; }
    /* Tertiary fixed */
    html.dark .bg-tertiary-fixed  { background-color: #1a3028 !important; }
    html.dark .text-on-tertiary-fixed { color: #6ffbbe !important; }
    /* Dividers / utility */
    html.dark .divide-surface-container-high > * + * { border-color: #32323c !important; }
    html.dark .bg-background, html.dark main { background-color: #0f0f11 !important; }
    /* Theme toggle icon */
    html.dark #theme-icon-inner { content: 'dark_mode'; }
    /* Smooth transition for background/text changes */
    body, aside, header, main, .bg-surface-container-lowest,
    .bg-surface-container-low, .bg-surface-container, .bg-background {
      transition: background-color .22s ease, color .18s ease, border-color .18s ease;
    }
  `;
  document.head.appendChild(style);
})();

/* ── Apply saved theme before paint to avoid flash ───────────────────── */
(function applySavedTheme() {
  const saved = localStorage.getItem('spendpilot_theme');
  if (saved === 'dark') document.documentElement.classList.add('dark');
})();


class SpendPilotStore {
  constructor() {
    this.company       = null;
    this.user          = null;
    this.health        = null;
    this.notifications = [];
    this.paypal        = null;
    this.subscriptions = [];
  }

  async init() {
    if (!window.api) return;
    try {
      [this.company, this.user, this.health, this.notifications, this.paypal, this.subscriptions] = await Promise.all([
        window.api.getCompany(),
        window.api.getUser(),
        window.api.getBusinessHealth(),
        window.api.getNotifications(),
        window.api.getPayPal(),
        window.api.getSubscriptions()
      ]);
      this.hydrateShell();
      this.bindGlobalListeners();
      this.injectModalContainers();
    } catch (err) {
      console.error('[SpendPilotStore] Initialization error:', err);
    }
  }

  /* ── Shell hydration ─────────────────────────────────────────────────── */

  hydrateShell() {
    if (this.user) {
      document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = this.user.full_name);
      document.querySelectorAll('[data-user-role]').forEach(el => el.textContent = this.user.title || this.user.role);
      document.querySelectorAll('[data-user-initials]').forEach(el => el.textContent = this.user.avatar_initials);
    }
    if (this.company) {
      document.querySelectorAll('[data-company-name]').forEach(el => el.textContent = this.company.brand_name || this.company.name);
      document.querySelectorAll('[data-company-tier]').forEach(el => el.textContent = this.company.tier);
    }
    if (this.health) {
      document.querySelectorAll('[data-health-score]').forEach(el => {
        el.textContent = `Health: ${this.health.overall_health_score}/100`;
      });
      document.querySelectorAll('[data-health-score-val]').forEach(el => {
        el.textContent = this.health.overall_health_score;
      });
    }

    /* Apply theme icon on load */
    this._syncThemeIcon();
    this.updateNotificationBadges();
  }

  updateNotificationBadges() {
    const unreadCount = this.notifications.filter(n => !n.read).length;
    const headerDot   = document.getElementById('header-notif-dot');
    const sidebarDot  = document.getElementById('sidebar-notif-dot');
    const drawerBadge = document.getElementById('notif-drawer-badge');

    if (headerDot)  headerDot.style.display  = unreadCount > 0 ? 'block' : 'none';
    if (sidebarDot) sidebarDot.style.display = unreadCount > 0 ? 'block' : 'none';
    if (drawerBadge) drawerBadge.textContent = unreadCount > 0 ? `${unreadCount} unread` : '0 unread';
  }

  /* ── Event binding ───────────────────────────────────────────────────── */

  bindGlobalListeners() {
    /* Block form submissions */
    document.addEventListener('submit', e => e.preventDefault());

    /* Block dummy href="#" links */
    document.addEventListener('click', e => {
      const link = e.target.closest('a[href="#"]');
      if (link) e.preventDefault();
    });

    /* Keep planned controls honest instead of pretending an operation succeeded. */
    document.addEventListener('click', e => {
      const demoAction = e.target.closest('[data-demo-simulate]');
      if (demoAction) {
        e.preventDefault();
        if (demoAction.dataset.simulated === 'true') {
          window.api?.showToast('This action is already included in the current demo session.', 'info');
          return;
        }

        demoAction.dataset.simulated = 'true';
        demoAction.setAttribute('aria-pressed', 'true');
        const status = document.createElement('span');
        status.className = 'ml-1 text-[10px] font-bold uppercase';
        status.textContent = 'Demo only';
        demoAction.appendChild(status);
        window.api?.showToast(
          `Demo simulation: ${demoAction.dataset.demoMessage || 'Action acknowledged locally.'} No external service or subscription was changed.`,
          'info',
        );
        return;
      }

      const target = e.target.closest('[data-placeholder]');
      if (!target) return;
      e.preventDefault();
      window.api?.showToast(target.getAttribute('data-placeholder'), 'info');
    });

    /* Unified data-action delegation */
    document.addEventListener('click', e => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const action = target.getAttribute('data-action');
      e.preventDefault();
      e.stopPropagation();

      switch (action) {
        case 'open-profile':         this.openProfileModal();         break;
        case 'open-notifications':   this.openNotificationsDrawer();  break;
        /* PayPal: ONLY the dedicated PayPal button opens the modal.
           The sidebar/header sync badges no longer carry data-action="open-paypal"
           so they won't trigger this. If they still do (legacy markup), guard by id. */
        case 'open-paypal':
          if (target.id === 'header-paypal-btn' || target.id === 'sidebar-paypal-btn' ||
              target.closest('#header-paypal-btn') || target.closest('#sidebar-paypal-btn')) {
            this.openPayPalModal();
          }
          /* Clicks on the status badges (#sidebar-paypal-sync, #header-paypal-sync)
             just show a brief info toast — no modal. */
          break;
        case 'open-org-switcher':    this.openOrgModal();             break;
        case 'toggle-theme':         this.toggleTheme();              break;
        case 'open-command-palette': this.openCommandPalette();       break;
      }
    });

    /* Keyboard shortcuts */
    window.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.openCommandPalette();
      } else if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });

    /* Sidebar/header PayPal SYNC BADGES — informational only, no modal */
    ['sidebar-paypal-sync', 'header-paypal-sync'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      /* Strip the action so the delegation above never fires for these */
      el.removeAttribute('data-action');
      /* Give them a lightweight click handler that just shows status */
      el.addEventListener('click', () => {
        if (window.api) window.api.showToast('PayPal Sandbox is live-synced. Click the PayPal button below to open the hub.', 'info');
      });
    });
  }

  /* ── Modal containers ────────────────────────────────────────────────── */

  injectModalContainers() {
    if (document.getElementById('spendpilot-modals-host')) return;

    const host = document.createElement('div');
    host.id = 'spendpilot-modals-host';
    host.innerHTML = `
      <!-- Backdrop -->
      <div id="sp-modal-backdrop" class="fixed inset-0 bg-[#18181B]/60 backdrop-blur-sm z-50 hidden transition-opacity"></div>

      <!-- 1. Notifications Drawer -->
      <div id="sp-notif-drawer" class="fixed top-0 right-0 h-full w-full max-w-md bg-surface-container-lowest brutal-border border-l-[3px] border-t-0 border-b-0 border-r-0 z-[60] transform translate-x-full transition-transform duration-300 flex flex-col justify-between shadow-2xl">
        <div class="p-space-md border-b-[3px] border-on-surface bg-surface-container-low flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[22px] text-primary">notifications</span>
            <h3 class="font-headline-sm text-title-md font-bold text-on-surface">Notifications Feed</h3>
            <span id="notif-drawer-badge" class="px-2 py-0.5 rounded-full bg-error text-on-error font-label-badge text-[10px] font-bold">5 unread</span>
          </div>
          <button id="btn-close-notifs" type="button" class="p-1.5 rounded-lg bg-surface-container-lowest brutal-border border-[2px] hover:bg-surface text-on-surface transition-transform active:translate-y-0.5">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div class="px-space-md py-2 bg-surface-container-highest flex items-center justify-between border-b-[2px] border-surface-container-high">
          <span class="font-label-code text-[11px] text-on-surface-variant font-semibold">Real-Time SaaS Alerts</span>
          <button id="btn-mark-all-read" type="button" class="text-primary hover:underline font-label-code text-[11px] font-bold">Mark all as read</button>
        </div>
        <div id="sp-notif-list" class="flex-1 overflow-y-auto p-space-md flex flex-col gap-3"></div>
        <div class="p-space-md border-t-[3px] border-on-surface bg-surface-container-low flex items-center justify-between">
          <span class="font-label-code text-[11px] text-outline">PayPal Sandbox Webhook Active</span>
          <button type="button" class="px-3 py-1.5 rounded-full bg-primary-container text-on-primary font-headline-sm text-body-sm font-bold brutal-border border-[2px] brutal-shadow-sm brutal-btn" id="btn-archive-read">Archive Read</button>
        </div>
      </div>

      <!-- 2. Profile Modal -->
      <div id="sp-profile-modal" class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-surface-container-lowest rounded-3xl brutal-border border-[3px] brutal-shadow-lg z-[60] hidden flex-col overflow-hidden">
        <div class="p-space-lg bg-primary-fixed border-b-[3px] border-on-surface flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-bold brutal-border border-[2px] brutal-shadow-sm overflow-hidden">
              <img src="assets/pfp.jpg" alt="Alex Rivera" class="w-full h-full object-cover" onerror="this.parentElement.textContent='AR'">
            </div>
            <div>
              <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight">Alex Rivera</h3>
              <span class="font-label-code text-body-sm text-on-surface-variant">Chief Financial Officer (CFO)</span>
            </div>
          </div>
          <button id="btn-close-profile" type="button" class="p-2 rounded-xl bg-surface-container-lowest brutal-border border-[2px] hover:bg-surface text-on-surface">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div class="p-space-lg flex flex-col gap-4 font-body-md text-on-surface">
          <div class="p-4 rounded-2xl bg-surface-container-low brutal-border border-[2px] space-y-2">
            <div class="flex justify-between items-center text-body-sm">
              <span class="text-on-surface-variant">Organization:</span>
              <span class="font-bold">Acme Technologies Pvt Ltd (Series B)</span>
            </div>
            <div class="flex justify-between items-center text-body-sm">
              <span class="text-on-surface-variant">Email:</span>
              <span class="font-label-code font-bold">alex.rivera@acmetechnologies.com</span>
            </div>
            <div class="flex justify-between items-center text-body-sm">
              <span class="text-on-surface-variant">Headcount Managed:</span>
              <span class="font-bold">250 Employees across 9 Departments</span>
            </div>
            <div class="flex justify-between items-center text-body-sm">
              <span class="text-on-surface-variant">Cash Runway:</span>
              <span class="font-bold text-tertiary-container">18.4 Months (₹14.5 Cr Balance)</span>
            </div>
          </div>
          <div>
            <span class="font-label-code text-body-sm uppercase text-outline font-bold block mb-2">Granted Permissions</span>
            <div class="flex flex-wrap gap-1.5">
              <span class="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-code text-[11px] font-semibold brutal-border border-[1px]">CFO Admin</span>
              <span class="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-code text-[11px] font-semibold brutal-border border-[1px]">1-Click Downgrades</span>
              <span class="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-code text-[11px] font-semibold brutal-border border-[1px]">PayPal Sandbox Demo Data</span>
              <span class="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-code text-[11px] font-semibold brutal-border border-[1px]">AI Negotiation Approver</span>
            </div>
          </div>
          <div class="flex items-center gap-3 pt-2">
            <button type="button" id="btn-save-prefs" class="flex-1 py-3 px-4 rounded-full bg-primary-container text-on-primary font-headline-sm text-body-md font-bold brutal-border border-[2px] brutal-shadow-sm brutal-btn">Save Preferences</button>
            <button type="button" id="btn-refresh-session" class="py-3 px-4 rounded-full bg-error-container text-on-error-container font-headline-sm text-body-md font-bold brutal-border border-[2px] brutal-shadow-sm brutal-btn">Refresh Session</button>
          </div>
        </div>
      </div>

      <!-- 3. PayPal Sandbox Hub Modal -->
      <div id="sp-paypal-modal" class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-surface-container-lowest rounded-3xl brutal-border border-[3px] brutal-shadow-lg z-[60] hidden flex-col overflow-hidden">
        <div class="p-space-lg bg-surface-container-low border-b-[3px] border-on-surface flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl bg-secondary text-on-secondary flex items-center justify-center font-bold brutal-border border-[2px] brutal-shadow-sm">
              <span class="material-symbols-outlined text-[24px]">payments</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold">PayPal Sandbox Hub</h3>
                <span class="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-badge text-[10px] uppercase font-bold">LIVE SYNC</span>
              </div>
              <span class="font-label-code text-[11px] text-outline">Merchant: PPL_MERCHANT_ACME_B2B_IN</span>
            </div>
          </div>
          <button id="btn-close-paypal" type="button" class="p-2 rounded-xl bg-surface-container-lowest brutal-border border-[2px] hover:bg-surface text-on-surface">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div class="p-space-lg flex flex-col gap-4 font-body-md text-on-surface">
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3.5 rounded-xl bg-surface-container-low brutal-border border-[2px]">
              <span class="font-label-code text-[10px] text-outline uppercase font-semibold">Total Synced Volume</span>
              <div id="pp-total-volume" class="font-data-metric text-headline-sm font-bold text-on-surface mt-1">₹5.3 Cr <span class="text-body-sm font-normal text-outline">/ yr</span></div>
            </div>
            <div class="p-3.5 rounded-xl bg-surface-container-low brutal-border border-[2px]">
              <span class="font-label-code text-[10px] text-outline uppercase font-semibold">Synced Transactions</span>
              <div id="pp-invoice-count" class="font-data-metric text-headline-sm font-bold text-tertiary-container mt-1">366 Invoices</div>
            </div>
          </div>
          <div class="p-4 rounded-xl bg-surface-container-low brutal-border border-[2px] space-y-2 text-body-sm">
            <div class="flex justify-between items-center">
              <span class="text-on-surface-variant">Environment:</span>
              <span class="font-label-code font-bold text-secondary">SANDBOX</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-on-surface-variant">Funding Source:</span>
              <span class="font-bold">PayPal Business Balance + HDFC Direct Debit</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-on-surface-variant">Webhook Telemetry:</span>
              <span class="font-label-code font-bold text-tertiary-container">ACTIVE (WH-99A10-SPENDPILOT-SANDBOX)</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-on-surface-variant">Avg Webhook Latency:</span>
              <span class="font-label-code font-bold">142ms</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-on-surface-variant">Completed Payments:</span>
              <span id="pp-completed-count" class="font-label-code font-bold">361</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-on-surface-variant">Pending / Failed:</span>
              <span class="font-label-code font-bold text-error">2 pending · 3 failed</span>
            </div>
          </div>
          <button id="btn-simulate-webhook" type="button" class="w-full py-3.5 px-4 rounded-full bg-primary-container text-on-primary font-headline-sm text-body-md font-bold brutal-border border-[3px] brutal-shadow brutal-btn transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-[20px]">bolt</span>
            <span>Simulate Live PayPal Webhook Event</span>
          </button>
          <p class="text-center font-label-code text-[10px] text-outline">Synthetic demo data only — no live PayPal account or payment is represented.</p>
        </div>
      </div>

      <!-- 4. Organization Switcher Modal -->
      <div id="sp-org-modal" class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface-container-lowest rounded-3xl brutal-border border-[3px] brutal-shadow-lg z-[60] hidden flex-col overflow-hidden">
        <div class="p-space-md bg-surface-container-low border-b-[3px] border-on-surface flex items-center justify-between">
          <h3 class="font-headline-sm text-title-md font-bold text-on-surface">Switch Organization</h3>
          <button id="btn-close-org" type="button" class="p-1.5 rounded-lg bg-surface-container-lowest brutal-border border-[2px] hover:bg-surface text-on-surface">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div class="p-space-md flex flex-col gap-2.5">
          <div class="p-3.5 rounded-2xl bg-primary-fixed brutal-border border-[2px] brutal-shadow-sm flex items-center justify-between cursor-pointer">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-primary text-[22px]">business</span>
              <div>
                <span class="font-headline-sm text-body-md font-bold block text-on-surface">Acme Technologies</span>
                <span class="font-label-code text-[11px] text-on-surface-variant">Series B · 250 Employees · INR</span>
              </div>
            </div>
            <span class="material-symbols-outlined text-primary text-[20px]">check_circle</span>
          </div>
          <div id="btn-switch-org" class="p-3.5 rounded-2xl bg-surface-container-low brutal-border border-[2px] flex items-center justify-between hover:bg-surface-container cursor-pointer transition-colors">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-outline text-[22px]">corporate_fare</span>
              <div>
                <span class="font-headline-sm text-body-md font-bold block text-on-surface">Acme Labs AI Inc</span>
                <span class="font-label-code text-[11px] text-on-surface-variant">Seed Stage · 18 Employees · USD</span>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-surface-container-high font-label-badge text-[10px]">Switch</span>
          </div>
          <button type="button" id="btn-connect-entity" class="mt-2 py-2.5 px-3 rounded-full bg-surface-container text-on-surface font-headline-sm text-body-sm font-bold brutal-border border-[2px] hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1.5">
            <span class="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ Connect New Legal Entity</span>
          </button>
        </div>
      </div>

      <!-- 5. Command Palette (Cmd + K) -->
      <div id="sp-cmd-modal" class="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-surface-container-lowest rounded-3xl brutal-border border-[4px] brutal-shadow-lg z-[60] hidden flex-col overflow-hidden">
        <div class="p-4 bg-surface-container-low border-b-[3px] border-on-surface flex items-center gap-3">
          <span class="material-symbols-outlined text-[24px] text-primary">search</span>
          <input id="sp-cmd-input" type="text" placeholder="Search subscriptions, run audits, or navigate…" class="w-full bg-transparent font-headline-sm text-body-lg text-on-surface outline-none placeholder:text-on-surface-variant" autocomplete="off">
          <span class="px-2 py-0.5 rounded bg-surface-container-high font-label-code text-[11px] text-outline brutal-border border-[1px]">ESC</span>
        </div>
        <div id="sp-cmd-results" class="max-h-[380px] overflow-y-auto p-3 flex flex-col gap-1"></div>
        <div class="p-3 bg-surface-container-low border-t-[2px] border-surface-container-high flex items-center justify-between text-body-sm font-label-code text-[11px] text-outline">
          <span>↑ ↓ navigate · Enter select</span>
          <span>SpendPilot AI Omnibar</span>
        </div>
      </div>
    `;

    document.body.appendChild(host);

    /* ── Close / action bindings ── */
    document.getElementById('sp-modal-backdrop').onclick  = () => this.closeAllModals();
    document.getElementById('btn-close-notifs').onclick   = () => this.closeAllModals();
    document.getElementById('btn-close-profile').onclick  = () => this.closeAllModals();
    document.getElementById('btn-close-paypal').onclick   = () => this.closeAllModals();
    document.getElementById('btn-close-org').onclick      = () => this.closeAllModals();

    document.getElementById('btn-mark-all-read').onclick = () => {
      this.notifications.forEach(n => n.read = true);
      this.updateNotificationBadges();
      this.renderNotificationsList();
      window.api.showToast('All notifications marked as read', 'info');
    };

    document.getElementById('btn-archive-read').onclick = () => {
      this.notifications = this.notifications.filter(n => !n.read);
      this.updateNotificationBadges();
      this.renderNotificationsList();
      window.api.showToast('Read notifications archived', 'info');
    };

    document.getElementById('btn-save-prefs').onclick = () => {
      window.api.showToast('Profile preferences saved', 'success');
      this.closeAllModals();
    };

    document.getElementById('btn-refresh-session').onclick = () => {
      window.api.showToast('Session refreshed: Alex Rivera authenticated', 'info');
      this.closeAllModals();
    };

    document.getElementById('btn-simulate-webhook').onclick = () => {
      const btn = document.getElementById('btn-simulate-webhook');
      btn.disabled = true;
      btn.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">sync</span> Ingesting PayPal Sandbox Webhook…`;
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = `<span class="material-symbols-outlined text-[20px]">bolt</span><span>Simulate Live PayPal Webhook Event</span>`;
        this.notifications.unshift({
          id: `NOTIF-${Date.now()}`,
          type: "paypal_webhook",
          severity: "normal",
          title: "PayPal Webhook Ingested",
          message: "PAYMENT.SALE.COMPLETED for Slack Enterprise (₹62,000) verified and ledger updated.",
          timestamp: new Date().toISOString(),
          read: false,
          icon: "paid",
          action_link: "subscriptions.html"
        });
        this.updateNotificationBadges();
        this.closeAllModals();
        window.api.showToast('PayPal Webhook Ingested: PAYMENT.SALE.COMPLETED processed!', 'success');
      }, 900);
    };

    document.getElementById('btn-switch-org').onclick = () => {
      window.api.showToast('Switched context to Acme Labs AI (Sandbox)', 'info');
      this.closeAllModals();
    };

    document.getElementById('btn-connect-entity').onclick = () => {
      window.api.showToast('Enterprise multi-org provisioning available in Pro tier', 'info');
    };

    /* Hydrate PayPal modal with real data if available */
    this._hydratePayPalModal();

    /* Command palette */
    const cmdInput = document.getElementById('sp-cmd-input');
    cmdInput.addEventListener('input', e => this.renderCommandResults(e.target.value.trim()));
    /* Focus the input when the palette opens */
    const observer = new MutationObserver(() => {
      const modal = document.getElementById('sp-cmd-modal');
      if (modal && !modal.classList.contains('hidden')) {
        setTimeout(() => cmdInput.focus(), 50);
      }
    });
    const modal = document.getElementById('sp-cmd-modal');
    if (modal) observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
  }

  _hydratePayPalModal() {
    if (!this.paypal) return;
    const totalVol  = document.getElementById('pp-total-volume');
    const invoices  = document.getElementById('pp-invoice-count');
    const completed = document.getElementById('pp-completed-count');
    if (totalVol  && this.paypal.total_synced_amount) totalVol.innerHTML  = `${window.api.formatCompactINR(this.paypal.total_synced_amount)} <span class="text-body-sm font-normal text-outline">/ yr</span>`;
    if (invoices  && this.paypal.invoice_count)       invoices.textContent   = `${this.paypal.invoice_count} Invoices`;
    if (completed && this.paypal.completed_payments)  completed.textContent  = this.paypal.completed_payments;
  }

  /* ── Modal openers ───────────────────────────────────────────────────── */

  openNotificationsDrawer() {
    this.closeAllModals();
    this.renderNotificationsList();
    const backdrop = document.getElementById('sp-modal-backdrop');
    const drawer   = document.getElementById('sp-notif-drawer');
    if (backdrop && drawer) {
      backdrop.classList.remove('hidden');
      drawer.classList.remove('translate-x-full');
    }
  }

  openProfileModal() {
    this.closeAllModals();
    const backdrop = document.getElementById('sp-modal-backdrop');
    const modal    = document.getElementById('sp-profile-modal');
    if (backdrop && modal) {
      backdrop.classList.remove('hidden');
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
    }
  }

  /* PayPal: called only by the dedicated PayPal button — NOT the sync badges */
  openPayPalModal() {
    this.closeAllModals();
    this._hydratePayPalModal();
    const backdrop = document.getElementById('sp-modal-backdrop');
    const modal    = document.getElementById('sp-paypal-modal');
    if (backdrop && modal) {
      backdrop.classList.remove('hidden');
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
    }
  }

  openOrgModal() {
    this.closeAllModals();
    const backdrop = document.getElementById('sp-modal-backdrop');
    const modal    = document.getElementById('sp-org-modal');
    if (backdrop && modal) {
      backdrop.classList.remove('hidden');
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
    }
  }

  openCommandPalette() {
    this.closeAllModals();
    const backdrop = document.getElementById('sp-modal-backdrop');
    const modal    = document.getElementById('sp-cmd-modal');
    const input    = document.getElementById('sp-cmd-input');
    if (backdrop && modal) {
      backdrop.classList.remove('hidden');
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      if (input) { input.value = ''; this.renderCommandResults(''); setTimeout(() => input.focus(), 30); }
    }
  }

  closeAllModals() {
    const backdrop = document.getElementById('sp-modal-backdrop');
    if (backdrop) backdrop.classList.add('hidden');
    const drawer = document.getElementById('sp-notif-drawer');
    if (drawer)   drawer.classList.add('translate-x-full');
    ['sp-profile-modal','sp-paypal-modal','sp-org-modal','sp-cmd-modal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.classList.add('hidden'); el.style.display = ''; }
    });
  }

  /* ── Notifications list ──────────────────────────────────────────────── */

  renderNotificationsList() {
    const list = document.getElementById('sp-notif-list');
    if (!list) return;
    this.updateNotificationBadges();
    if (this.notifications.length === 0) {
      list.innerHTML = '<div class="p-6 text-center text-outline font-body-md">No notifications</div>';
      return;
    }
    list.innerHTML = this.notifications.slice(0, 15).map(n => `
      <div class="p-3.5 rounded-2xl ${n.read ? 'bg-surface-container-low opacity-75' : 'bg-surface-container-lowest brutal-shadow-sm'} brutal-border border-[2px] flex items-start gap-3 transition-all hover:bg-surface-container">
        <span class="p-2 rounded-xl ${n.severity === 'critical' ? 'bg-error-container text-on-error-container' : 'bg-primary-fixed text-on-primary-fixed'} brutal-border border-[1.5px] material-symbols-outlined text-[20px] shrink-0">
          ${n.icon || 'notifications'}
        </span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1">
            <span class="font-headline-sm text-body-md font-bold text-on-surface truncate">${n.title}</span>
            <span class="font-label-code text-[10px] text-outline shrink-0">${window.api.formatDate(n.timestamp)}</span>
          </div>
          <p class="font-body-sm text-[12px] text-on-surface-variant mt-0.5 leading-snug">${n.message}</p>
          ${n.action_link ? `<a href="${n.action_link}" class="inline-block mt-2 font-label-code text-[11px] font-bold text-primary hover:underline">View in ${n.action_link.replace('.html','')} →</a>` : ''}
        </div>
      </div>`).join('');
  }

  /* ── Theme toggle ────────────────────────────────────────────────────── */

  toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('spendpilot_theme', isDark ? 'dark' : 'light');
    this._syncThemeIcon();
    window.api.showToast(isDark ? '🌙 Dark mode on' : '☀️ Light mode on', 'info');
  }

  _syncThemeIcon() {
    /* The toggle button uses a Material Symbol icon. Swap light_mode ↔ dark_mode. */
    const isDark = document.documentElement.classList.contains('dark');
    document.querySelectorAll('#theme-switch-btn .material-symbols-outlined, #theme-switch-btn span').forEach(el => {
      if (el.classList.contains('material-symbols-outlined')) {
        el.textContent = isDark ? 'dark_mode' : 'light_mode';
      }
    });
    /* Also update the header toggle if it exists */
    const headerThemeBtn = document.getElementById('header-theme-btn');
    if (headerThemeBtn) {
      const icon = headerThemeBtn.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = isDark ? 'dark_mode' : 'light_mode';
    }
  }

  /* ── Command palette ─────────────────────────────────────────────────── */

  renderCommandResults(query) {
    const container = document.getElementById('sp-cmd-results');
    if (!container) return;

    const navPages = [
      { name: "Executive Dashboard",    icon: "grid_view",    url: "dashboard.html",     desc: "KPIs, spend burn, AI copilot" },
      { name: "Software Subscriptions", icon: "credit_card",  url: "subscriptions.html", desc: "55 tracked subscriptions ledger & seat audit" },
      { name: "Subscription Doctor",    icon: "vital_signs",  url: "doctor.html",        desc: "Ghost seats, zombie licenses & redundant tools" },
      { name: "What-If Simulator",      icon: "timeline",     url: "simulator.html",     desc: "Simulate cashflow reduction scenarios & runway" },
      { name: "AI Vendor Negotiator", icon: "handshake", url: "negotiator.html", desc: "Demo contract insights & email drafting" },
      { name: "Business Analytics",     icon: "bar_chart",    url: "analytics.html",     desc: "Departmental OpEx & SaaS velocity telemetry" },
      { name: "Executive Reports",      icon: "summarize",    url: "reports.html",       desc: "Monthly C-suite financial digests" },
      { name: "AI CFO Advisory",        icon: "smart_toy",    url: "ai_cfo.html",        desc: "Runway forecasting & capital governance" },
      { name: "Company Settings",       icon: "settings",     url: "settings.html",      desc: "Organization profile, budgets & PayPal sandbox" }
    ];

    let html = '';
    if (!query) {
      html += '<span class="px-3 py-1 font-label-badge text-[10px] uppercase text-outline font-bold block mb-1">Quick Navigation</span>';
      html += navPages.map(p => `
        <a href="${p.url}" class="p-3 rounded-2xl bg-surface-container-low brutal-border border-[1.5px] flex items-center justify-between hover:bg-primary-fixed transition-colors">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-[20px] text-primary">${p.icon}</span>
            <div>
              <span class="font-headline-sm text-body-md font-bold text-on-surface block leading-tight">${p.name}</span>
              <span class="font-body-sm text-[11px] text-on-surface-variant">${p.desc}</span>
            </div>
          </div>
          <span class="material-symbols-outlined text-outline text-[16px]">arrow_forward</span>
        </a>`).join('');
    } else {
      const q = query.toLowerCase();
      const matchedSubs = this.subscriptions.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.vendor.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      ).slice(0, 5);

      if (matchedSubs.length > 0) {
        html += '<span class="px-3 py-1 font-label-badge text-[10px] uppercase text-outline font-bold block mb-1">Subscriptions</span>';
        html += matchedSubs.map(s => `
          <a href="subscriptions.html" class="p-3 rounded-2xl bg-surface-container-low brutal-border border-[1.5px] flex items-center justify-between hover:bg-primary-fixed transition-colors">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center font-bold brutal-border border-[1px]">${s.name.charAt(0)}</div>
              <div>
                <span class="font-headline-sm text-body-md font-bold text-on-surface block leading-tight">${s.name} (${s.plan_name})</span>
                <span class="font-label-code text-[11px] text-on-surface-variant">${s.department} · ${window.api.formatINR(s.monthly_cost)}/mo</span>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded font-label-badge text-[10px] ${s.risk_level === 'high' ? 'bg-error text-on-error' : 'bg-secondary-fixed text-on-secondary-fixed'}">${(s.risk_level||'').toUpperCase()}</span>
          </a>`).join('');
      }

      const matchedPages = navPages.filter(p => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
      if (matchedPages.length > 0) {
        html += '<span class="px-3 py-1 font-label-badge text-[10px] uppercase text-outline font-bold block mt-2 mb-1">Pages</span>';
        html += matchedPages.map(p => `
          <a href="${p.url}" class="p-3 rounded-2xl bg-surface-container-low brutal-border border-[1.5px] flex items-center justify-between hover:bg-primary-fixed transition-colors">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-[20px] text-primary">${p.icon}</span>
              <span class="font-headline-sm text-body-md font-bold text-on-surface">${p.name}</span>
            </div>
            <span class="material-symbols-outlined text-outline text-[16px]">arrow_forward</span>
          </a>`).join('');
      }

      if (matchedSubs.length === 0 && matchedPages.length === 0) {
        html = `<div class="p-6 text-center text-outline font-body-md">No results for "${query}"</div>`;
      }
    }
    container.innerHTML = html;
  }
}

// Boot
window.store = new SpendPilotStore();
document.addEventListener('DOMContentLoaded', () => { window.store.init(); });
