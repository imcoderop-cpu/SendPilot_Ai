/**
 * SpendPilot AI — Guided Demo Controller v2
 *
 * KEY ARCHITECTURAL CHANGE v2:
 *  The app is a multi-page app but the demo now uses FETCH + DOM SWAP for navigation
 *  instead of real page loads. When "Next" crosses a page boundary:
 *    1. The current <main> slides out (CSS transition, no repaint)
 *    2. We fetch the target HTML, parse it, extract <main> + page scripts
 *    3. Swap the <main> in-place and re-run only the page JS (api.js / store.js
 *       are already live; we only re-execute the page-specific script)
 *    4. Update history with replaceState (URL changes, no reload)
 *  Result: zero white-screen flash, smooth slide, instant feel.
 *
 *  Other fixes in v2:
 *   - Chat step spotlights the FULL right-column chat panel (col-span-5), not just the input
 *   - Demo card is draggable and auto-repositions on negotiator to avoid blocking the email draft
 *   - Every button that appears in the app has a functional click handler
 *   - Profile picture uses assets/pfp.jpg with initials fallback
 */
(function () {
  "use strict";

  const CFG = window.SPENDPILOT_DEMO_CONFIG;
  if (!CFG) return;

  /* ── Brand palette ──────────────────────────────────────────────────── */
  const C = {
    bg: "#fbf8fc", surfaceLow: "#f6f2f7", surfaceLowest: "#ffffff",
    surfaceHigh: "#eae7eb", ink: "#18181B",
    onSurface: "#1b1b1e", onSurfaceVariant: "#4a4453", outline: "#7b7485",
    primary: "#420093", primaryContainer: "#5b21b6", onPrimary: "#ffffff",
    primaryFixed: "#ebddff", onPrimaryFixed: "#250059",
    secondary: "#0051d5",
    tertiaryContainer: "#005438", tertiaryFixed: "#6ffbbe", onTertiaryFixed: "#002113",
    error: "#ba1a1a",
  };

  const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fmtINR = (n) => window.api ? window.api.formatINR(n) : "₹" + Number(n || 0).toLocaleString("en-IN");
  const fmtCompact = (n) => window.api ? window.api.formatCompactINR(n) : "₹" + Number(n || 0);

  /* ── Cache for pre-fetched pages ────────────────────────────────────── */
  const PAGE_CACHE = new Map();

  /* ================================================================== */
  class SpendPilotDemo {
    constructor() {
      this.state      = this._readState();
      this.values     = null;
      this._dataPromise = null;
      this.raf        = null;
      this.currentStep = -1;
      this._injected  = false;
      this._keyHandler = null;
      this._resizeHandler = null;
      this._activeTarget = null;
      this._spotlightModal = false;
      this._chatAfter = null;
      this._topRecommendations = [];
      this._dragBound = false;
      this._completeTimer = null;
      this._chatObserver = null;
      this._chatSent = false;
      /* drag state for the info card */
      this._drag = { active: false, startX: 0, startY: 0, origX: 0, origY: 0 };
    }

    /* ── Public lifecycle ─────────────────────────────────────────────── */

    async init() {
      this._injectLayer();
      this._injectRestartButton();
      this._bindKeyboard();

      if (this.state.active) {
        await this._ensureData();
        /* After a fetch-swap navigation the page is already correct. */
        const here = this._currentPage();
        const step = CFG.steps[this.state.step || 0];
        if (!step) { this.exit(); return; }
        if (step.page && step.page !== here) {
          /* Edge case: someone opened a fresh tab mid-demo. Navigate for real. */
          this._realNavigate(step.page);
          return;
        }
        this._runStep(this.state.step || 0);
        return;
      }

      if (!localStorage.getItem(CFG.storage.welcome)) {
        await this._ensureData();
        this._renderWelcome();
      }
    }

    start() {
      this.state = { active: true, step: 0, startedAt: Date.now() };
      this._writeState();
      this._hideCompleteBanner();
      this._closeAppModals();
      this._ensureData().then(() => this._runStep(0));
    }

    restart() {
      this._teardownSpotlight();
      this._closeAppModals();
      this._hideSummary();
      this._hideCard();
      this._hideCompleteBanner();
      this._disconnectChatWatch();
      this._chatSent = false;
      /* If not on dashboard, navigate there first */
      if (this._currentPage() !== "dashboard.html") {
        this.state = { active: true, step: 0, startedAt: Date.now() };
        this._writeState();
        this._spaNavigate("dashboard.html", 0);
      } else {
        this.start();
      }
    }

    exit() {
      this.state = { active: false };
      this._writeState();
      this._teardownSpotlight();
      this._closeAppModals();
      this._hideCard();
      this._hideSummary();
      this._disconnectChatWatch();
    }

    next() {
      if (!this.state.active) return;
      const i = this.currentStep;
      if (i + 1 >= CFG.steps.length) {
        this._completeDemo();
        return;
      }
      this._goTo(i + 1);
    }

    prev() {
      if (!this.state.active || this.currentStep <= 0) return;
      this._goTo(this.currentStep - 1);
    }

    skip() { this.exit(); }

    /* ── Navigation ───────────────────────────────────────────────────── */

    _goTo(i) {
      this.state.step = i;
      this._writeState();
      const step = CFG.steps[i];
      const here = this._currentPage();

      /* Close any open app modal before switching */
      this._closeAppModals();

      if (step.page && step.page !== here) {
        this._spaNavigate(step.page, i);
      } else {
        this._teardownSpotlight();
        this._runStep(i);
      }
    }

    /* Fetch + DOM-swap navigation — the core of v2 */
    async _spaNavigate(url, stepIndex) {
      const main = document.querySelector("main");
      if (!main) { this._realNavigate(url); return; }

      /* 1. Slide current content out */
      if (!rm) {
        main.style.transition = "opacity .18s ease, transform .22s cubic-bezier(.4,0,.2,1)";
        main.style.opacity = "0";
        main.style.transform = "translateX(-18px)";
        await this._delay(230);
      }

      try {
        /* 2. Fetch & parse new page (with caching) */
        let html = PAGE_CACHE.get(url);
        if (!html) {
          const res = await fetch(url, { cache: "no-store" });
          html = await res.text();
          PAGE_CACHE.set(url, html);
        }
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const newMain = doc.querySelector("main");
        if (!newMain) throw new Error("no main");

        /* 3. Swap <main> content */
        main.innerHTML = newMain.innerHTML;
        main.className = newMain.className;

        /* 4. Update URL + document title */
        const newTitle = doc.querySelector("title");
        if (newTitle) document.title = newTitle.textContent;
        history.replaceState({ step: stepIndex }, "", url);

        /* 5. Re-run the page-specific script */
        const pageScript = doc.querySelector('script[src*="js/pages/"]');
        if (pageScript && pageScript.src) {
          const relSrc = pageScript.getAttribute("src");
          await this._runScript(relSrc);
        }

        /* 6. Slide new content in */
        if (!rm) {
          main.style.transition = "none";
          main.style.opacity = "0";
          main.style.transform = "translateX(18px)";
          await this._delay(10); /* force reflow */
          main.style.transition = "opacity .22s ease, transform .26s cubic-bezier(.4,0,.2,1)";
          main.style.opacity = "1";
          main.style.transform = "translateX(0)";
          await this._delay(280);
          main.style.transition = "";
          main.style.transform = "";
        }

        /* 7. Update sidebar active state */
        this._updateSidebarActive(url);

        /* 8. Run the step (skipped for silent dashboard returns) */
        if (stepIndex != null && stepIndex >= 0) {
          await this._runStep(stepIndex);
        }

      } catch (err) {
        console.warn("[SpendPilotDemo] SPA nav failed, falling back to real nav:", err);
        this._realNavigate(url);
      }
    }

    _realNavigate(url) {
      window.location.href = url;
    }

    async _runScript(relSrc) {
      const existing = document.querySelector(`script[data-spa-injected="${CSS.escape(relSrc)}"]`);
      if (existing) existing.remove();

      try {
        const res = await fetch(relSrc, { cache: "no-store" });
        const code = await res.text();
        const s = document.createElement("script");
        s.setAttribute("data-spa-injected", relSrc);
        s.textContent =
          "(function(){" +
          "var orig=document.addEventListener.bind(document);" +
          "document.addEventListener=function(type,fn,opts){" +
          "if(type===\"DOMContentLoaded\"&&typeof fn===\"function\"){" +
          "Promise.resolve().then(function(){fn.call(document);});return;}" +
          "return orig(type,fn,opts);};" +
          "try{\n" + code + "\n}finally{document.addEventListener=orig;}" +
          "})();";
        document.body.appendChild(s);
      } catch (err) {
        console.warn("[SpendPilotDemo] page script failed:", relSrc, err);
      }
    }

    _updateSidebarActive(url) {
      const page = url.replace(".html", "");
      document.querySelectorAll("aside nav a").forEach((a) => {
        const isActive = (a.getAttribute("href") || "").includes(url);
        if (isActive) {
          a.classList.add("bg-primary-container", "text-on-primary", "font-bold", "brutal-border", "brutal-shadow-sm");
          a.classList.remove("text-on-surface-variant");
          a.setAttribute("aria-current", "page");
        } else {
          a.classList.remove("bg-primary-container", "text-on-primary", "font-bold", "brutal-border", "brutal-shadow-sm");
          a.classList.add("text-on-surface-variant");
          a.removeAttribute("aria-current");
        }
      });
    }

    _delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

    /* ── Run a step ───────────────────────────────────────────────────── */

    async _runStep(i) {
      await this._ensureData();
      this.currentStep = i;
      const step = CFG.steps[i];
      if (!step) { this._completeDemo(); return; }
      this._hideSummary();
      this._hideCard();

      this.state.step = i;
      this._writeState();

      if (step.overlay === "impact") {
        this._teardownSpotlight();
        this._showImpact();
        return;
      }
      if (step.overlay === "executive") {
        this._teardownSpotlight();
        this._showExecutive();
        return;
      }

      /* Open the PayPal modal before waiting for target */
      if (step.onEnter) {
        try { step.onEnter(); } catch (e) {}
        await this._delay(120);
      }

      const el = await this._waitForTarget(step);
      this._spotlight(el, !!step.modal);
      this._renderCard(step, i);

      if (step.action === "chat") {
        this._prepareChatPrompt();
        const block = this._el("#sp-demo-block");
        if (block) block.style.display = "none";
      }

      if (step.animate && !rm) this._playAnimate(step.animate);
    }

    async _waitForTarget(step) {
      const resolve = () => { try { return step.target ? step.target() : null; } catch (e) { return null; } };
      let el = resolve();
      if (el) {
        if (step.modal) await this._wait(() => el && !el.classList.contains("hidden"), 150, 2500);
        return el;
      }
      el = await this._wait(resolve, 80, 5000);
      return el || document.querySelector("main") || document.body;
    }

    _wait(pred, interval, timeout) {
      return new Promise((res) => {
        const t0 = Date.now();
        (function tick() {
          const v = pred(); if (v) return res(v);
          if (Date.now() - t0 >= timeout) return res(null);
          setTimeout(tick, interval);
        })();
      });
    }

    /* ── Spotlight ────────────────────────────────────────────────────── */

    _spotlight(el, isModal) {
      this._teardownSpotlight();
      if (!el) return;

      try { el.scrollIntoView({ behavior: rm ? "auto" : "smooth", block: "center" }); } catch (e) {}

      const ring  = this._el("#sp-demo-ring");
      const dim   = this._el("#sp-demo-dim");
      const block = this._el("#sp-demo-block");
      const guide = this._el("#sp-demo-guide");

      if (isModal) {
        try { el.style.zIndex = "10001"; } catch (e) {}
        if (dim)   dim.style.display   = "block";
        if (ring)  ring.style.display  = "none";
        if (guide) guide.style.display = "none";
      } else {
        if (dim)  dim.style.display   = "none";
        if (ring) ring.style.display  = "block";
        if (guide) guide.style.display = "block";
      }
      if (block) block.style.display = "block";

      this._activeTarget   = el;
      this._spotlightModal = isModal;

      const sync = () => {
        const t = this._activeTarget;
        if (!t) return;
        const r = t.getBoundingClientRect();
        if (ring && !isModal && r.width > 0) {
          const pad = 8;
          ring.style.left   = (r.left - pad) + "px";
          ring.style.top    = (r.top  - pad) + "px";
          ring.style.width  = (r.width  + pad * 2) + "px";
          ring.style.height = (r.height + pad * 2) + "px";
        }
        if (guide && !isModal && r.width > 0) {
          guide.style.left = (r.left + r.width - 4) + "px";
          guide.style.top  = (r.top  - 4) + "px";
        }
        this.raf = requestAnimationFrame(sync);
      };
      this.raf = requestAnimationFrame(sync);
      this._resizeHandler = sync;
      window.addEventListener("resize", this._resizeHandler);
    }

    _teardownSpotlight() {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
      if (this._resizeHandler) window.removeEventListener("resize", this._resizeHandler);
      this._resizeHandler = null;
      if (this._activeTarget && this._spotlightModal) {
        try { this._activeTarget.style.zIndex = ""; } catch (e) {}
      }
      this._activeTarget   = null;
      this._spotlightModal = false;
      ["#sp-demo-ring","#sp-demo-dim","#sp-demo-block","#sp-demo-guide"].forEach((s) => {
        const el = this._el(s);
        if (el) el.style.display = "none";
      });
    }

    /* ── Info card ────────────────────────────────────────────────────── */

    _renderCard(step, i) {
      const card = this._el("#sp-demo-card");
      const S    = CFG.strings;
      const v    = this.values || {};
      const fill = (s) => this._fill(s, v);
      const total    = CFG.steps.length;
      const remaining = Math.max(0, (total - i) * CFG.timing.avgSecondsPerStep);
      const isChat   = step.action === "chat";
      const paypalRow = step.paypal
        ? `<div class="sp-meta-row"><span class="sp-meta-k"><span class="sp-dot sp-dot-paypal"></span>PayPal</span><span class="sp-meta-v">${fill(step.paypal)}</span></div>`
        : "";

      card.innerHTML = `
        <div class="sp-card-drag-handle" id="sp-card-handle">
          <span class="sp-drag-icon">⠿</span>
          <button class="sp-card-close" data-demo-action="skip" title="Exit demo" aria-label="Exit demo">✕</button>
        </div>
        <div class="sp-card-head">
          <span class="sp-step-badge">${S.progress.stepOf.replace("{n}", i + 1).replace("{total}", total)}</span>
          <span class="sp-icon"><span class="material-symbols-outlined">${step.icon}</span></span>
          <span class="sp-card-title">${this._esc(step.title)}</span>
        </div>
        <p class="sp-narrative">${fill(step.narrative)}</p>
        <div class="sp-meta">
          <div class="sp-meta-row"><span class="sp-meta-k"><span class="sp-dot sp-dot-why"></span>Why</span><span class="sp-meta-v">${fill(step.why)}</span></div>
          <div class="sp-meta-row"><span class="sp-meta-k"><span class="sp-dot sp-dot-impact"></span>Impact</span><span class="sp-meta-v">${fill(step.impact)}</span></div>
          <div class="sp-meta-row"><span class="sp-meta-k"><span class="sp-dot sp-dot-ai"></span>AI</span><span class="sp-meta-v">${fill(step.ai)}</span></div>
          ${paypalRow}
          <div class="sp-meta-row"><span class="sp-meta-k"><span class="sp-dot sp-dot-example"></span>Example</span><span class="sp-meta-v">${fill(step.example)}</span></div>
        </div>
        ${isChat ? `<button class="sp-btn sp-btn-send" data-demo-action="send">${this._esc(S.buttons.sendPrompt)}</button>` : ""}
        <div class="sp-progress">
          <div class="sp-progress-top">
            <span class="sp-progress-label">${S.progress.label}</span>
            <span class="sp-progress-text">${S.progress.remaining.replace("{s}", remaining)}</span>
          </div>
          <div class="sp-progress-track"><div class="sp-progress-bar" style="width:${((i + 1) / total) * 100}%"></div></div>
        </div>
        <div class="sp-card-actions">
          <button class="sp-btn sp-btn-ghost" data-demo-action="skip">${this._esc(S.buttons.skip)}</button>
          <button class="sp-btn sp-btn-ghost" data-demo-action="prev" ${i === 0 ? "disabled" : ""}>${this._esc(S.buttons.previous)}</button>
          <button class="sp-btn sp-btn-primary" data-demo-action="next">${isChat ? this._esc(S.buttons.viewSummary) : (step.overlay === "executive" ? this._esc(S.buttons.explore) : this._esc(S.buttons.next))}</button>
        </div>`;

      /* Position card — on negotiator put it top-right to avoid blocking email draft */
      this._positionCard(step);
      card.style.display = "flex";
      this._bindCardDrag(card);
    }

    _positionCard(step) {
      const card = this._el("#sp-demo-card");
      if (!card) return;
      /* Reset any prior drag offset */
      card.style.removeProperty("left");
      card.style.removeProperty("right");
      card.style.removeProperty("top");
      card.style.removeProperty("bottom");
      card.style.removeProperty("transform");

      const page = this._currentPage();
      if (page === "negotiator.html" || step.id === "negotiator") {
        /* Top-right, so the email draft below is visible */
        card.style.top    = "80px";
        card.style.right  = "18px";
        card.style.bottom = "auto";
        card.style.left   = "auto";
        card.style.transform = "none";
      } else {
        /* Default: horizontally-centred at bottom */
        card.style.bottom = "18px";
        card.style.left   = "50%";
        card.style.right  = "auto";
        card.style.top    = "auto";
        card.style.transform = "translateX(-50%)";
      }
    }

    _bindCardDrag(card) {
      const handle = card.querySelector("#sp-card-handle");
      if (!handle) return;
      handle.addEventListener("mousedown", (e) => this._onCardDragStart(e), { passive: false });
      handle.addEventListener("touchstart", (e) => this._onCardDragStart(e), { passive: false });
      if (this._dragBound) return;
      this._dragBound = true;
      document.addEventListener("mousemove", (e) => this._onCardDragMove(e), { passive: false });
      document.addEventListener("touchmove", (e) => this._onCardDragMove(e), { passive: false });
      document.addEventListener("mouseup", () => { this._drag.active = false; });
      document.addEventListener("touchend", () => { this._drag.active = false; });
    }

    _onCardDragStart(e) {
      if (e.button !== undefined && e.button !== 0) return;
      const card = this._el("#sp-demo-card");
      if (!card) return;
      const touch = e.touches ? e.touches[0] : e;
      const r = card.getBoundingClientRect();
      card.style.transform = "none";
      card.style.left = r.left + "px";
      card.style.top = r.top + "px";
      card.style.right = "auto";
      card.style.bottom = "auto";
      this._drag = { active: true, startX: touch.clientX, startY: touch.clientY, origX: r.left, origY: r.top };
      e.preventDefault();
    }

    _onCardDragMove(e) {
      if (!this._drag.active) return;
      const card = this._el("#sp-demo-card");
      if (!card) return;
      const touch = e.touches ? e.touches[0] : e;
      const dx = touch.clientX - this._drag.startX;
      const dy = touch.clientY - this._drag.startY;
      card.style.left = Math.max(0, Math.min(window.innerWidth - 60, this._drag.origX + dx)) + "px";
      card.style.top = Math.max(0, Math.min(window.innerHeight - 60, this._drag.origY + dy)) + "px";
      e.preventDefault();
    }

    _hideCard() {
      const card = this._el("#sp-demo-card");
      if (card) card.style.display = "none";
    }

    /* ── Chat step ────────────────────────────────────────────────────── */

    _prepareChatPrompt() {
      const input = document.getElementById("dash-chat-input");
      if (input) {
        input.value = CFG.chatPrompt;
        try { input.focus(); } catch (e) {}
      }
      const send = document.getElementById("dash-chat-send");
      if (send && send.dataset.demoHook !== "1") {
        send.dataset.demoHook = "1";
        send.addEventListener("click", () => { this._chatSent = true; });
      }
    }

    _sendChat() {
      this._prepareChatPrompt();
      this._chatSent = true;
      const send = document.getElementById("dash-chat-send");
      if (send) send.click();
      const btn = this._el('[data-demo-action="send"]');
      if (btn) { btn.textContent = CFG.strings.buttons.sent; btn.disabled = true; }
      if (this.state.liveAnalysis) this._watchChatCompletion();
    }

    _watchChatCompletion() {
      this._disconnectChatWatch();
      const list = document.getElementById("dash-chat-messages");
      if (!list) return;
      this._chatObserver = new MutationObserver(() => {
        if (!this.state.liveAnalysis) return;
        const typing = document.getElementById("chat-typing-indicator");
        if (typing) return;
        if (!this._chatSent) return;
        const messages = list.querySelectorAll('[data-ai-state]');
        const latestMessage = messages[messages.length - 1];
        if (latestMessage && latestMessage.dataset.aiState === "error") return;
        this.state.liveAnalysis = false;
        this._disconnectChatWatch();
        setTimeout(() => this._completeDemo(), 700);
      });
      this._chatObserver.observe(list, { childList: true, subtree: true });
    }

    _disconnectChatWatch() {
      if (this._chatObserver) {
        this._chatObserver.disconnect();
        this._chatObserver = null;
      }
    }

    /* ── Overlays: impact, executive, complete ────────────────────────── */

    _kpiCell(label, value, opts = {}) {
      const count = opts.count != null ? ` data-count="${opts.count}"` : "";
      const suffix = opts.suffix ? ` data-suffix="${this._esc(opts.suffix)}"` : "";
      const sav = opts.savings ? " sp-sav" : "";
      return `<div class="sp-sum-cell" data-reveal><span class="sp-sum-k">${label}</span><span class="sp-sum-v${sav}"${count}${suffix}>${value}</span></div>`;
    }

    _revealAndCount(root) {
      const cells = root.querySelectorAll("[data-reveal]");
      cells.forEach((el) => { el.style.opacity = "0"; el.style.transform = "translateY(10px)"; });
      cells.forEach((el, idx) => {
        setTimeout(() => {
          el.style.transition = rm ? "" : "opacity .35s ease, transform .35s ease";
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        }, 70 + idx * 90);
      });
      if (!rm) {
        setTimeout(() => {
          root.querySelectorAll("[data-count]").forEach((el) => {
            const target = parseFloat(el.getAttribute("data-count")) || 0;
            const prefix = el.getAttribute("data-prefix") || "";
            const suffix = el.getAttribute("data-suffix") || "";
            this._countUp(el, target, prefix, suffix);
          });
        }, 280);
      }
    }

    _overlayNav(i) {
      const S = CFG.strings;
      const total = CFG.steps.length;
      const remaining = Math.max(0, (total - i) * CFG.timing.avgSecondsPerStep);
      return `
        <div class="sp-progress">
          <div class="sp-progress-top">
            <span class="sp-progress-label">${S.progress.label}</span>
            <span class="sp-progress-text">${S.progress.remaining.replace("{s}", remaining)} · ${S.progress.stepOf.replace("{n}", i + 1).replace("{total}", total)}</span>
          </div>
          <div class="sp-progress-track"><div class="sp-progress-bar" style="width:${((i + 1) / total) * 100}%"></div></div>
        </div>
        <div class="sp-summary-actions" data-reveal>
          <button class="sp-btn sp-btn-ghost" data-demo-action="prev">${this._esc(S.buttons.previous)}</button>
          <button class="sp-btn sp-btn-primary" data-demo-action="next">${this._esc(i + 1 >= total ? S.buttons.explore : S.buttons.next)}</button>
        </div>`;
    }

    _showImpact() {
      this._closeAppModals();
      const v = this.values || {};
      const S = CFG.strings.summary;
      const I = CFG.strings.impact;
      const modal = this._el("#sp-demo-summary");
      modal.innerHTML = `
        <div class="sp-summary-card sp-impact-card">
          <div class="sp-summary-eyebrow">${this._esc(I.eyebrow)}</div>
          <h2 class="sp-summary-title">${this._esc(I.title)}</h2>
          <p class="sp-exec-lead">${this._esc(I.lead)}</p>
          <div class="sp-summary-grid sp-impact-grid">
            ${this._kpiCell(S.annualSpend, this._fill("{annualSpend}", v), { count: v.annualSpendRaw })}
            ${this._kpiCell(S.potentialSavings, this._fill("{potentialAnnualSavings}", v), { count: v.potentialAnnualSavingsRaw, savings: true })}
            ${this._kpiCell(S.inactiveLicenses, String(v.inactiveLicenses ?? 0), { count: v.inactiveLicenses })}
            ${this._kpiCell(S.duplicateTools, String(v.duplicateTools ?? 0), { count: v.duplicateTools })}
            ${this._kpiCell(S.departments, String(v.deptCount ?? 0), { count: v.deptCount })}
            ${this._kpiCell(S.health, `${v.healthScore ?? 83}/100`, { count: v.healthScore, suffix: "/100" })}
            ${this._kpiCell(S.confidence, `${v.aiConfidence ?? 86}%`, { count: v.aiConfidence, suffix: "%" })}
            ${this._kpiCell(S.roi, `${S.roiValue} · ${v.savingsPercent}%`)}
            ${this._kpiCell(S.hoursSaved, `${v.financeHoursSaved} hrs / audit`, { count: v.financeHoursSaved, suffix: " hrs / audit" })}
          </div>
          ${this._overlayNav(this.currentStep)}
        </div>`;
      modal.style.display = "flex";
      this._revealAndCount(modal);
    }

    _showExecutive() {
      this._closeAppModals();
      const v = this.values || {};
      const S = CFG.strings.summary;
      const E = CFG.strings.executive;
      const top = (this._topRecommendations || []).slice(0, 5);
      const ops = top.map((r) =>
        `<li><span class="sp-op-dot">✓</span><span class="sp-op-name">${this._esc(r.subscription_name)}</span><span class="sp-op-sav">${fmtINR(r.estimated_annual_savings)}/yr</span></li>`
      ).join("");
      const modal = this._el("#sp-demo-summary");
      modal.innerHTML = `
        <div class="sp-summary-card sp-exec-card">
          <div class="sp-summary-eyebrow">${this._esc(E.eyebrow)}</div>
          <h2 class="sp-summary-title">${this._esc(E.title)}</h2>
          <p class="sp-exec-lead">${this._fill(E.lead, v)}</p>
          <div class="sp-exec-hero" data-reveal>
            <div>
              <span class="sp-sum-k">${S.potentialSavings}</span>
              <div class="sp-exec-hero-val sp-sav" data-count="${v.potentialAnnualSavingsRaw || 0}">${this._fill("{potentialAnnualSavings}", v)}</div>
            </div>
            <div class="sp-exec-score">
              <span class="sp-sum-k">${S.optimization}</span>
              <div class="sp-exec-hero-val" data-count="${v.optimizationScore || 81}" data-suffix="/100">${v.optimizationScore || 81}/100</div>
            </div>
          </div>
          <div class="sp-summary-ops" data-reveal>
            <span class="sp-sum-k">${S.topOpportunities}</span>
            <ul class="sp-op-list">${ops}</ul>
          </div>
          <div class="sp-summary-roi" data-reveal>
            <span class="sp-sum-k">${S.roi}</span><span class="sp-roi-pill">${S.roiValue} · ${v.savingsPercent}%</span>
          </div>
          <div class="sp-summary-actions" data-reveal>
            <button class="sp-btn sp-btn-primary sp-btn-lg" data-demo-action="runanalysis">${this._esc(CFG.strings.buttons.runAnalysis)}</button>
            <button class="sp-btn sp-btn-ghost" data-demo-action="restart">${this._esc(CFG.strings.buttons.restart)}</button>
            <button class="sp-btn sp-btn-ghost" data-demo-action="explore">${this._esc(CFG.strings.buttons.explore)}</button>
          </div>
        </div>`;
      modal.style.display = "flex";
      this._revealAndCount(modal);
    }

    _showSummary() {
      this._showImpact();
    }

    _hideSummary() {
      const m = this._el("#sp-demo-summary");
      if (m) m.style.display = "none";
    }

    async _completeDemo() {
      this._teardownSpotlight();
      this._hideCard();
      this._hideSummary();
      this._closeAppModals();
      this._disconnectChatWatch();
      this.state = { active: false, completed: true };
      this._writeState();
      if (this._currentPage() !== "dashboard.html") {
        await this._spaNavigate("dashboard.html", -1);
      }
      this._showCompleteBanner();
    }

    _showCompleteBanner() {
      const host = this._el("#sp-demo-complete");
      if (!host) return;
      const v = this.values || {};
      const Ctxt = CFG.strings.complete;
      host.innerHTML = `
        <div class="sp-complete-card" role="status">
          <div class="sp-complete-head">
            <span class="sp-complete-icon material-symbols-outlined">check_circle</span>
            <h3 class="sp-complete-title">${this._esc(Ctxt.title)}</h3>
            <button type="button" class="sp-card-close" data-demo-action="dismiss-complete" aria-label="Dismiss">✕</button>
          </div>
          <p>${this._fill(Ctxt.line1, v)}</p>
          <p>${this._esc(Ctxt.line2)}</p>
          <p class="sp-complete-muted">${this._esc(Ctxt.line3)}</p>
          <div class="sp-complete-actions">
            <button class="sp-btn sp-btn-primary" data-demo-action="dismiss-complete">${this._esc(Ctxt.continue)}</button>
            <button class="sp-btn sp-btn-ghost" data-demo-action="restart">${this._esc(Ctxt.restart)}</button>
            <button class="sp-btn sp-btn-ghost" data-demo-action="dismiss-complete">${this._esc(Ctxt.dismiss)}</button>
          </div>
        </div>`;
      host.style.display = "block";
      if (this._completeTimer) window.clearTimeout(this._completeTimer);
      this._completeTimer = window.setTimeout(() => this._hideCompleteBanner(), 8000);
    }

    _hideCompleteBanner() {
      if (this._completeTimer) {
        window.clearTimeout(this._completeTimer);
        this._completeTimer = null;
      }
      const host = this._el("#sp-demo-complete");
      if (host) host.style.display = "none";
    }

    async _runLiveAnalysis() {
      this._hideSummary();
      this._chatSent = false;
      const chatIndex = CFG.steps.findIndex((s) => s.action === "chat");
      const idx = chatIndex >= 0 ? chatIndex : 0;
      this.state = Object.assign({}, this.state, { active: true, step: idx, liveAnalysis: true });
      this._writeState();
      if (this._currentPage() !== "dashboard.html") {
        await this._spaNavigate("dashboard.html", idx);
      } else {
        await this._runStep(idx);
      }
      this._prepareChatPrompt();
      this._watchChatCompletion();
    }

    /* ── Welcome ──────────────────────────────────────────────────────── */

    _renderWelcome() {
      const S = CFG.strings.welcome;
      const m = this._el("#sp-demo-welcome");
      m.innerHTML = `
        <div class="sp-welcome-card">
          <h2 class="sp-welcome-title">${this._esc(S.title)}</h2>
          <p class="sp-welcome-sub">${this._esc(S.subtitle)}</p>
          <p class="sp-welcome-desc">${this._esc(S.description)}</p>
          <div class="sp-welcome-time">${this._esc(S.time)}</div>
          <div class="sp-welcome-actions">
            <button class="sp-btn sp-btn-ghost" data-demo-action="welcomeskip">${this._esc(S.skip)}</button>
            <button class="sp-btn sp-btn-primary sp-btn-lg" data-demo-action="welcomestart">${this._esc(S.start)}</button>
          </div>
        </div>`;
      m.style.display = "flex";
    }

    _dismissWelcome() {
      localStorage.setItem(CFG.storage.welcome, "1");
      const m = this._el("#sp-demo-welcome");
      if (m) m.style.display = "none";
    }

    /* ── Restart button in sidebar ────────────────────────────────────── */

    _injectRestartButton() {
      const old = document.getElementById("sp-demo-restart-btn");
      if (old) old.remove();

      const nav = document.querySelector("aside nav");
      if (!nav) return;

      const btn = document.createElement("button");
      btn.id = "sp-demo-restart-btn";
      btn.type = "button";
      btn.setAttribute("data-demo-action", "restart");
      btn.className = "sp-restart-btn";
      btn.innerHTML = `<span class="material-symbols-outlined">replay</span><span>${this._esc(CFG.strings.buttons.restart)}</span>`;
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.restart();
      });

      /* Sit directly under Company Settings in the left sidebar */
      nav.insertAdjacentElement("afterend", btn);
    }

    /* ── Data fetching ────────────────────────────────────────────────── */

    async _ensureData() {
      if (this.values) return this.values;
      if (this._dataPromise) return this._dataPromise;
      if (!window.api) { this.values = this._fallback(); return this.values; }
      this._dataPromise = (async () => {
        try {
          const [analytics, health, recs, paypal, subs, reports] = await Promise.all([
            window.api.getAnalytics(),
            window.api.getBusinessHealth(),
            window.api.getRecommendations(),
            window.api.getPayPal(),
            window.api.getSubscriptions(),
            window.api.getReports().catch(() => []),
          ]);
          const defaults = this._fallback();
          const m = (analytics && (analytics.metrics || analytics.overview_metrics || analytics.analytics?.metrics)) || {};
          const healthData = health && (health.business_health || health);
          const canva = (subs || []).find((s) => /canva/i.test(s.name || "")) || {};
          const ranked = (recs || [])
            .filter((r) => r.status === "pending_review" || !r.status)
            .slice()
            .sort((a, b) => (b.estimated_annual_savings || 0) - (a.estimated_annual_savings || 0));
          this._topRecommendations = ranked;
          const top = ranked[0] || {};
          const eng = (analytics && analytics.department_spend || []).find((d) => d.department === "Engineering") || {};
          const canvaRec = (recs || []).find((r) => /canva/i.test(r.subscription_name || ""));
          const dupGroups = {};
          (subs || []).forEach((s) => {
            if (s.duplicate_tool_group) {
              dupGroups[s.duplicate_tool_group] = (dupGroups[s.duplicate_tool_group] || 0) + 1;
            }
          });
          const duplicateTools = Object.values(dupGroups).filter((n) => n >= 2).length;
          const numberOr = (value, fallback) => value != null && Number.isFinite(Number(value)) ? Number(value) : fallback;
          const annual = numberOr(m.annualized_saas_spend, defaults.annualSpendRaw);
          const potential = numberOr(m.potential_annual_savings, defaults.potentialAnnualSavingsRaw);
          const inactiveLicenses = numberOr(m.ghost_licenses, defaults.inactiveLicenses);
          const savingsPercent = annual > 0
            ? Math.round((potential / annual) * 100)
            : defaults.savingsPercent;
          const financeHoursSaved = m.ghost_licenses != null || duplicateTools > 0 || (recs || []).length > 0
            ? Math.max(8, Math.round((inactiveLicenses * 2 + duplicateTools * 25 + (recs || []).length * 12) / 60))
            : defaults.financeHoursSaved;

          this.values = {
            monthlySpend:          fmtINR(numberOr(m.monthly_saas_spend, defaults.monthlySpend.replace(/[^\d]/g, ""))),
            annualSpend:           fmtINR(annual),
            annualSpendRaw:        annual,
            potentialAnnualSavings:fmtINR(potential),
            potentialAnnualSavingsRaw: potential,
            potentialMonthlySavings:fmtINR(numberOr(m.potential_monthly_savings, defaults.potentialMonthlySavings.replace(/[^\d]/g, ""))),
            inactiveLicenses,
            duplicateTools: (subs || []).length ? duplicateTools : defaults.duplicateTools,
            savingsPercent,
            financeHoursSaved,
            optimizationScore:     numberOr(healthData && healthData.optimization_score, defaults.optimizationScore),
            roiLabel:              defaults.roiLabel,
            renewals30:            numberOr(m.upcoming_renewals_next_30_days, defaults.renewals30),
            healthScore:           numberOr(healthData && healthData.overall_health_score, defaults.healthScore),
            aiConfidence:          numberOr(healthData && healthData.ai_confidence, defaults.aiConfidence),
            activeSubs:            numberOr(m.active_subscriptions, defaults.activeSubs),
            deptCount:             numberOr(m.departments, defaults.deptCount),
            canvaSeats:            canva.number_of_seats || 30,
            canvaActive:           canva.active_users || 24,
            canvaInactive:         canva.inactive_users || 6,
            canvaUtilization:      canva.usage_percentage ? Math.round(canva.usage_percentage) : 80,
            canvaMonthlyCost:      fmtINR(canva.monthly_cost || 31200),
            canvaAnnualSavings:    fmtINR(canva.estimated_annual_savings || 44400),
            canvaConfidence:       canvaRec ? Math.round(canvaRec.confidence * 100) : 85,
            paypalInvoices:        paypal ? paypal.invoice_count : 366,
            paypalSynced:          paypal ? fmtCompact(paypal.total_synced_amount) : "₹5.3 Cr",
            engSpend:              fmtINR(eng.monthly_spend || 1293400),
            topFindingSavings:     fmtINR(top.estimated_annual_savings || defaults.topFindingSavings.replace(/[^\d]/g, "")),
            topRecTitle:           top.title || defaults.topRecTitle,
            topRecSavings:         fmtINR(top.estimated_annual_savings || defaults.topRecSavings.replace(/[^\d]/g, "")),
            reportCount:           reports ? reports.length : "—",
          };
          return this.values;
        } catch (e) {
          console.warn("[SpendPilotDemo] data fetch error:", e);
          this.values = this._fallback();
          return this.values;
        }
      })();
      return this._dataPromise;
    }

    _fallback() {
      return {
        monthlySpend:"₹37,41,900", annualSpend:"₹4,49,02,800", annualSpendRaw:44902800,
        potentialAnnualSavings:"₹55,89,600", potentialAnnualSavingsRaw:5589600,
        potentialMonthlySavings:"₹4,65,800", inactiveLicenses:290, duplicateTools:8,
        savingsPercent:12, financeHoursSaved:18, optimizationScore:81, roiLabel:"Very High",
        renewals30:29, healthScore:83,
        aiConfidence:86, activeSubs:54, deptCount:9, canvaSeats:30, canvaActive:24, canvaInactive:6,
        canvaUtilization:80, canvaMonthlyCost:"₹31,200", canvaAnnualSavings:"₹44,400", canvaConfidence:85,
        paypalInvoices:366, paypalSynced:"₹5.3 Cr", engSpend:"₹12,93,400",
        topFindingSavings:"₹5,30,400", topRecTitle:"Right-size AWS", topRecSavings:"₹5,30,400", reportCount:12,
      };
    }

    /* ── Animations ───────────────────────────────────────────────────── */

    _playAnimate(kind) {
      try {
        if (kind === "kpis")  this._animateKpis();
        if (kind === "chart") this._animateChart();
      } catch (e) {}
    }

    _animateKpis() {
      ["kpi-monthly-spend","kpi-potential-savings","kpi-renewals","kpi-ghost-seats"].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const raw  = parseFloat(el.textContent.replace(/[^0-9.]/g,"")) || 0;
        const pre  = el.textContent.match(/^[^\d]*/)?.[0] || "";
        const suf  = el.textContent.replace(/^[^\d]*[\d,.]+/, "") || "";
        if (raw > 0) this._countUp(el, raw, pre, suf);
      });
    }

    _animateChart() {
      const svg = document.querySelector('svg[viewBox="0 0 900 220"]');
      if (!svg) return;
      svg.querySelectorAll("path").forEach((p) => {
        try {
          const len = p.getTotalLength ? p.getTotalLength() : 2000;
          p.style.strokeDasharray  = len;
          p.style.strokeDashoffset = len;
          p.style.transition = "stroke-dashoffset .9s ease-out";
          requestAnimationFrame(() => requestAnimationFrame(() => (p.style.strokeDashoffset = "0")));
        } catch (e) {}
      });
    }

    _countUp(el, target, prefix, suffix) {
      prefix = prefix || "";
      suffix = suffix || "";
      const dur = 700;
      const start = performance.now();
      const useINR = prefix.includes("₹") || String(el.textContent || "").includes("₹");
      const fmt = (n) => {
        if (useINR && window.api) return window.api.formatINR(Math.round(n));
        return Math.round(n).toLocaleString("en-IN");
      };
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (useINR ? "" : prefix) + fmt(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    _rawNum(str) {
      return parseFloat(String(str || "0").replace(/[^0-9.]/g, "")) || 0;
    }

    /* ── Event delegation ─────────────────────────────────────────────── */

    _onHostClick(e) {
      const btn = e.target.closest("[data-demo-action]");
      if (!btn) return;
      const action = btn.getAttribute("data-demo-action");
      switch (action) {
        case "welcomestart":   this._dismissWelcome(); this.start(); break;
        case "welcomeskip":    this._dismissWelcome(); break;
        case "next":           this.next(); break;
        case "prev":           this.prev(); break;
        case "skip":           this.skip(); break;
        case "restart":        this.restart(); break;
        case "send":           this._sendChat(); break;
        case "runanalysis":        this._runLiveAnalysis(); break;
        case "explore":            this._completeDemo(); break;
        case "dismiss-complete":   this._hideCompleteBanner(); break;
      }
    }

    /* ── Keyboard ─────────────────────────────────────────────────────── */

    _bindKeyboard() {
      if (this._keyHandler) return;
      this._keyHandler = (e) => {
        if (!this.state.active) return;
        const tag = (e.target?.tagName) || "";
        if (/INPUT|TEXTAREA|SELECT/.test(tag) || e.target?.isContentEditable) return;
        if      (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); this.next(); }
        else if (e.key === "ArrowLeft")  { e.preventDefault(); this.prev(); }
        else if (e.key === "Escape")     { e.preventDefault(); this.exit(); }
        else if (e.key === "r" || e.key === "R") { e.preventDefault(); this.restart(); }
      };
      window.addEventListener("keydown", this._keyHandler, true);
    }

    /* ── App utilities ────────────────────────────────────────────────── */

    _closeAppModals() {
      if (window.store?.closeAllModals) {
        try { window.store.closeAllModals(); } catch (e) {}
      }
    }

    _currentPage() {
      const p = location.pathname.split("/").pop() || "dashboard.html";
      return p === "" || p === "/" ? "dashboard.html" : p;
    }

    _fill(str, v) {
      if (!str) return "";
      return String(str).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? String(v[k]) : m);
    }

    _esc(s) {
      return String(s == null ? "" : s)
        .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
    }

    _readState() {
      try { return JSON.parse(sessionStorage.getItem(CFG.storage.state) || "") || { active: false }; }
      catch (e) { return { active: false }; }
    }

    _writeState() {
      try { sessionStorage.setItem(CFG.storage.state, JSON.stringify(this.state)); } catch (e) {}
    }

    _el(sel) { return document.querySelector(sel); }

    /* ── Overlay injection ────────────────────────────────────────────── */

    _injectLayer() {
      if (this._injected || document.getElementById("sp-demo-host")) {
        this._injected = true;
        /* Re-bind delegation on the existing host */
        const host = document.getElementById("sp-demo-host");
        if (host) host.addEventListener("click", (e) => this._onHostClick(e));
        /* Also re-inject the restart button (DOM may have been swapped) */
        this._injectRestartButton();
        return;
      }
      /* Document-level delegation catches buttons outside #sp-demo-host
         (e.g. the restart button injected into the sidebar nav) */
      if (!this._docDelegationBound) {
        this._docDelegationBound = true;
        document.addEventListener("click", (e) => {
          const btn = e.target.closest("[data-demo-action]");
          if (!btn || btn.closest("#sp-demo-host")) return; /* host has its own listener */
          const action = btn.getAttribute("data-demo-action");
          if (action === "restart") { e.preventDefault(); e.stopPropagation(); this.restart(); }
        }, true);
      }

      const style = document.createElement("style");
      style.id = "sp-demo-styles";
      style.textContent = this._css();
      document.head.appendChild(style);

      const host = document.createElement("div");
      host.id = "sp-demo-host";
      host.innerHTML = `
        <div id="sp-demo-dim"    aria-hidden="true"></div>
        <div id="sp-demo-block"  aria-hidden="true"></div>
        <div id="sp-demo-ring"   aria-hidden="true"><div id="sp-demo-guide"></div></div>
        <div id="sp-demo-card"   role="dialog" aria-label="SpendPilot guided demo"></div>
        <div id="sp-demo-welcome" role="dialog" aria-modal="true" aria-label="Welcome"></div>
        <div id="sp-demo-summary" role="dialog" aria-modal="true" aria-label="AI Executive Summary"></div>
        <div id="sp-demo-complete" aria-live="polite"></div>`;
      document.body.appendChild(host);
      host.addEventListener("click", (e) => this._onHostClick(e));
      this._injected = true;
    }

    /* ── CSS ──────────────────────────────────────────────────────────── */

    _css() {
      const B = C.ink;
      return `
/* Host — pointer-events: none so it never blocks interaction on non-overlay areas */
#sp-demo-host { position:fixed;inset:0;pointer-events:none;z-index:9990; }

/* Spotlight dim (modal steps) */
#sp-demo-dim {
  position:fixed;inset:0;z-index:45;
  background:rgba(24,24,27,.52);
  backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);
  display:none;
}

/* Click-blocker while demo active */
#sp-demo-block {
  position:fixed;inset:0;z-index:9992;background:transparent;display:none;
}

/* Spotlight ring — box-shadow creates the dim-everything-else effect */
#sp-demo-ring {
  position:fixed;z-index:9998;left:0;top:0;width:0;height:0;
  border:3px solid ${B};border-radius:18px;display:none;pointer-events:none;
  box-shadow:0 0 0 100vmax rgba(24,24,27,.46),5px 5px 0 ${B};
  transition:left .22s ease,top .22s ease,width .22s ease,height .22s ease;
  animation:sp-pulse 2.6s ease-in-out infinite;
}
@keyframes sp-pulse{0%,100%{box-shadow:0 0 0 100vmax rgba(24,24,27,.46),5px 5px 0 ${B};}50%{box-shadow:0 0 0 100vmax rgba(24,24,27,.46),5px 5px 0 ${B},0 0 0 8px rgba(91,33,182,.22);}}

/* AI guide dot */
#sp-demo-guide {
  position:fixed;z-index:9999;width:13px;height:13px;border-radius:9999px;
  background:${C.primary};border:2.5px solid ${B};display:none;pointer-events:none;
  box-shadow:2px 2px 0 ${B};animation:sp-bob 1.9s ease-in-out infinite;
}
@keyframes sp-bob{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}

/* ── Buttons ── */
.sp-btn {
  font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;cursor:pointer;
  border:3px solid ${B};border-radius:9999px;padding:.58rem 1rem;font-size:13.5px;line-height:1;
  transition:transform .07s ease,box-shadow .07s ease,background .15s;
  pointer-events:auto;white-space:nowrap;
}
.sp-btn:disabled{opacity:.42;cursor:not-allowed;}
.sp-btn-primary{background:${C.primary};color:${C.onPrimary};box-shadow:4px 4px 0 ${B};}
.sp-btn-primary:not(:disabled):hover{transform:translate(-1px,-1px);box-shadow:5px 5px 0 ${B};}
.sp-btn-primary:not(:disabled):active{transform:translate(4px,4px);box-shadow:0 0 0 ${B};}
.sp-btn-ghost{background:${C.surfaceLowest};color:${C.onSurface};box-shadow:2px 2px 0 ${B};}
.sp-btn-ghost:not(:disabled):hover{background:${C.surfaceHigh};}
.sp-btn-ghost:not(:disabled):active{transform:translate(2px,2px);box-shadow:0 0 0 ${B};}
.sp-btn-send{width:100%;background:${C.tertiaryFixed};color:${C.onTertiaryFixed};box-shadow:4px 4px 0 ${B};margin:.3rem 0 .4rem;padding:.8rem 1rem;font-size:14.5px;}
.sp-btn-send:hover{transform:translate(-1px,-1px);box-shadow:5px 5px 0 ${B};}
.sp-btn-send:active{transform:translate(4px,4px);box-shadow:0 0 0 ${B};}
.sp-btn-lg{padding:.8rem 1.4rem;font-size:14.5px;}

/* ── Info card ── */
#sp-demo-card {
  position:fixed;z-index:10000;
  /* default position: bottom-centre — overridden per-page by _positionCard() */
  bottom:18px;left:50%;transform:translateX(-50%);
  width:min(420px,calc(100vw - 24px));max-height:calc(100vh - 88px);overflow-y:auto;
  background:${C.surfaceLowest};border:3px solid ${B};border-radius:20px;
  box-shadow:6px 6px 0 ${B};padding:0 16px 16px;
  display:none;flex-direction:column;gap:9px;
  font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:${C.onSurface};
  pointer-events:auto;
  animation:sp-card-in .24s cubic-bezier(.22,1,.36,1);
}
@keyframes sp-card-in{from{opacity:0;transform:translate(-50%,14px);}to{opacity:1;transform:translate(-50%,0);}}
/* When card is repositioned (top-right, drag), translateX is cleared via inline style */

/* Drag handle */
.sp-card-drag-handle{
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 0 4px;cursor:grab;user-select:none;
}
.sp-card-drag-handle:active{cursor:grabbing;}
.sp-drag-icon{font-size:18px;color:${C.outline};letter-spacing:2px;}
.sp-card-close{background:none;border:none;cursor:pointer;font-size:16px;color:${C.outline};padding:2px 6px;border-radius:6px;transition:background .15s;}
.sp-card-close:hover{background:${C.errorContainer};color:${C.error};}

.sp-card-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.sp-step-badge{font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:${C.onPrimaryFixed};background:${C.primaryFixed};border:2px solid ${B};border-radius:9999px;padding:3px 9px;}
.sp-icon{display:inline-flex;width:28px;height:28px;align-items:center;justify-content:center;background:${C.primaryContainer};color:${C.onPrimary};border:2px solid ${B};border-radius:8px;}
.sp-icon .material-symbols-outlined{font-size:17px;}
.sp-card-title{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:17px;color:${C.onSurface};}
.sp-narrative{font-size:14px;line-height:1.48;color:${C.onSurface};margin:0;}
.sp-narrative strong{color:${C.primary};}
.sp-meta{display:flex;flex-direction:column;gap:4px;}
.sp-meta-row{display:flex;gap:8px;font-size:11.5px;line-height:1.35;align-items:flex-start;}
.sp-meta-k{flex:0 0 64px;display:inline-flex;align-items:center;gap:4px;color:${C.outline};font-weight:700;text-transform:uppercase;font-size:9.5px;letter-spacing:.04em;}
.sp-meta-v{flex:1;color:${C.onSurfaceVariant};}
.sp-dot{width:7px;height:7px;border-radius:9999px;border:1.5px solid ${B};flex:none;}
.sp-dot-why{background:${C.primaryFixed};}
.sp-dot-impact{background:${C.tertiaryFixed};}
.sp-dot-ai{background:${C.primaryContainer};}
.sp-dot-paypal{background:${C.secondary};}
.sp-dot-example{background:${C.surfaceHigh};}
.sp-prompt-preview{font-family:'JetBrains Mono',monospace;font-size:11.5px;background:${C.surfaceLow};border:2px solid ${B};border-radius:10px;padding:8px 10px;color:${C.onSurface};}
.sp-progress{display:flex;flex-direction:column;gap:4px;padding-top:2px;}
.sp-progress-top{display:flex;justify-content:space-between;font-size:10px;font-family:'JetBrains Mono',monospace;color:${C.outline};font-weight:600;}
.sp-progress-track{height:5px;background:${C.surfaceHigh};border:2px solid ${B};border-radius:9999px;overflow:hidden;}
.sp-progress-bar{height:100%;background:${C.primary};transition:width .4s ease;}
.sp-card-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap;}
.sp-card-actions .sp-btn-ghost{padding:.46rem .8rem;font-size:12.5px;}
.sp-card-actions .sp-btn-primary{margin-left:auto;padding:.46rem .9rem;font-size:12.5px;}

/* Restart button — under Company Settings, left sidebar */
aside #sp-demo-restart-btn.sp-restart-btn{
  display:flex;align-items:center;gap:10px;width:100%;margin-top:8px;
  padding:8px 12px;border-radius:12px;text-align:left;
  font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:14px;
  background:${C.tertiaryFixed};color:${C.onTertiaryFixed};
  border:2px solid ${B};box-shadow:2px 2px 0 ${B};
  cursor:pointer;pointer-events:auto;transition:transform .07s ease,box-shadow .07s ease;
}
aside #sp-demo-restart-btn.sp-restart-btn:hover{transform:translate(-1px,-1px);box-shadow:3px 3px 0 ${B};}
aside #sp-demo-restart-btn.sp-restart-btn:active{transform:translate(2px,2px);box-shadow:0 0 0 ${B};}
aside #sp-demo-restart-btn.sp-restart-btn .material-symbols-outlined{font-size:20px;}

/* ── Welcome + Summary modals ── */
#sp-demo-welcome,#sp-demo-summary{
  position:fixed;inset:0;z-index:10001;display:none;align-items:center;justify-content:center;
  background:rgba(24,24,27,.56);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);
  pointer-events:auto;padding:16px;
}
.sp-welcome-card,.sp-summary-card{
  background:${C.surfaceLowest};border:3px solid ${B};border-radius:24px;
  box-shadow:8px 8px 0 ${B};padding:26px;
  max-width:460px;width:100%;
  font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:${C.onSurface};
  animation:sp-modal-in .28s cubic-bezier(.22,1,.36,1);
}
@keyframes sp-modal-in{from{opacity:0;transform:translateY(18px) scale(.97);}to{opacity:1;transform:none;}}
.sp-welcome-title{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:25px;margin:0 0 6px;}
.sp-welcome-sub{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:15px;color:${C.primary};margin:0 0 11px;}
.sp-welcome-desc{font-size:14px;line-height:1.52;color:${C.onSurfaceVariant};margin:0 0 13px;}
.sp-welcome-time{display:inline-block;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;background:${C.tertiaryFixed};color:${C.onTertiaryFixed};border:2px solid ${B};border-radius:9999px;padding:4px 12px;margin-bottom:18px;}
.sp-welcome-actions{display:flex;gap:10px;justify-content:flex-end;align-items:center;}

/* Summary */
.sp-summary-card{max-width:540px;max-height:90vh;overflow-y:auto;}
.sp-summary-eyebrow{font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${C.onPrimaryFixed};background:${C.primaryFixed};border:2px solid ${B};border-radius:9999px;padding:4px 12px;display:inline-block;}
.sp-summary-title{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:22px;margin:10px 0 14px;color:${C.onSurface};}
.sp-summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;}
.sp-sum-cell{display:flex;flex-direction:column;gap:2px;background:${C.surfaceLow};border:2px solid ${B};border-radius:12px;padding:9px 11px;}
.sp-sum-k{font-family:'JetBrains Mono',monospace;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:${C.outline};}
.sp-sum-v{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:18px;color:${C.onSurface};}
.sp-sav{color:${C.tertiaryContainer};}
.sp-summary-ops{background:${C.surfaceLow};border:2px solid ${B};border-radius:12px;padding:11px;margin-bottom:10px;}
.sp-summary-ops .sp-sum-k{display:block;margin-bottom:7px;}
.sp-op-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px;}
.sp-op-list li{display:flex;align-items:center;gap:7px;font-size:12.5px;}
.sp-op-dot{color:${C.tertiaryContainer};font-weight:700;}
.sp-op-name{flex:1;font-weight:600;color:${C.onSurface};}
.sp-op-sav{font-family:'JetBrains Mono',monospace;font-weight:700;color:${C.tertiaryContainer};font-size:11.5px;}
.sp-summary-roi{display:flex;align-items:center;justify-content:space-between;background:${C.tertiaryFixed};border:2px solid ${B};border-radius:12px;padding:9px 13px;margin-bottom:14px;}
.sp-summary-roi .sp-sum-k{color:${C.onTertiaryFixed};}
.sp-roi-pill{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:15px;color:${C.onTertiaryFixed};background:${C.tertiaryContainer};border:2px solid ${B};border-radius:9999px;padding:3px 12px;}
.sp-summary-actions{display:flex;gap:7px;flex-wrap:wrap;align-items:center;}
.sp-summary-actions .sp-btn-primary{flex:1 1 auto;}
.sp-summary-actions .sp-btn-ghost{flex:0 0 auto;}
.sp-impact-card,.sp-exec-card{max-width:640px;}
.sp-impact-grid{grid-template-columns:1fr 1fr 1fr;}
.sp-exec-lead{font-size:14px;line-height:1.5;color:${C.onSurfaceVariant};margin:0 0 14px;}
.sp-exec-hero{display:grid;grid-template-columns:1.4fr .8fr;gap:10px;margin-bottom:12px;}
.sp-exec-hero>div{background:${C.surfaceLow};border:2px solid ${B};border-radius:14px;padding:12px 14px;}
.sp-exec-hero-val{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:28px;letter-spacing:-.03em;line-height:1.15;margin-top:4px;}
.sp-exec-score{background:${C.primaryFixed}!important;}

#sp-demo-complete{
  position:fixed;top:80px;left:calc(130px + 50%);transform:translateX(-50%);
  z-index:10002;display:none;pointer-events:none;width:min(620px,calc(100vw - 280px));
}
.sp-complete-card{
  pointer-events:auto;background:${C.surfaceLowest};border:3px solid ${B};border-radius:20px;
  box-shadow:6px 6px 0 ${B};padding:16px 18px 18px;
  font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:${C.onSurface};
  animation:sp-modal-in .28s cubic-bezier(.22,1,.36,1);
}
.sp-complete-head{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.sp-complete-icon{color:${C.tertiaryContainer};font-size:26px;}
.sp-complete-title{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:18px;margin:0;flex:1;}
.sp-complete-card p{margin:0 0 6px;font-size:13.5px;line-height:1.45;color:${C.onSurface};}
.sp-complete-muted{color:${C.onSurfaceVariant}!important;}
.sp-complete-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}

@media(max-width:640px){
  #sp-demo-card{bottom:8px;width:calc(100vw - 18px);}
  .sp-summary-grid,.sp-impact-grid,.sp-exec-hero{grid-template-columns:1fr;}
  .sp-meta-k{flex-basis:58px;}
  #sp-demo-complete{left:50%;top:16px;width:calc(100vw - 20px);}
}
@media(prefers-reduced-motion:reduce){
  #sp-demo-ring,#sp-demo-guide,#sp-demo-card,.sp-welcome-card,.sp-summary-card{animation:none!important;transition:none!important;}
}
`;
    }
  }

  window.SpendPilotDemo = SpendPilotDemo;
})();
