/**
 * SpendPilot AI — Guided Demo Bootstrap v2
 *
 * Thin entry point loaded on every page after demo-config.js + demo-controller.js.
 * v2: navigation is SPA fetch-swap so there is no cross-page reload to guard against.
 * Instantiates the controller and calls init() after the shell (store.js) is ready.
 */
(function () {
  "use strict";

  function boot() {
    if (!window.SpendPilotDemo || !window.SPENDPILOT_DEMO_CONFIG) return;

    /* Wait for store.js to finish initialising (it sets window.store on DOMContentLoaded) */
    function tryInit() {
      const demo = new window.SpendPilotDemo();
      window.spendpilotDemo = demo;
      /* Expose a global restart hook for any other button that might call it */
      window.restartSpendPilotDemo = () => demo.restart();
      demo.init();
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", tryInit);
    } else {
      /* DOMContentLoaded already fired — store.js may still be async-fetching.
         A small rAF delay lets store.init() kick off before our init runs. */
      requestAnimationFrame(() => requestAnimationFrame(tryInit));
    }
  }

  boot();
})();
