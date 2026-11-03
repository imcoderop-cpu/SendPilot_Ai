#!/usr/bin/env python3
"""
SpendPilot AI — Guided Demo setup.

1. Fixes a pre-existing hydration bug in frontend/js/pages/dashboard.js:
   it referenced `analytics.overview_metrics.*`, but the analytics dataset
   exposes `analytics.metrics.*` with different key names. The first access
   threw inside the try/catch, silently breaking the ENTIRE dashboard
   hydration (KPIs, banner, recommendations and the AI chat bindings —
   the climax of the guided demo). This rewrites those references to the real
   keys so the dashboard (and its chat) actually function.

2. Wires the demo scripts into every frontend HTML page (idempotent), right
   before </body> and after the page-specific JS, so the tour can run/resume
   on any page.

Run:  python scripts/setup_guided_demo.py
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND = os.path.join(ROOT, "frontend")

DASHBOARD_JS = os.path.join(FRONTEND, "js", "pages", "dashboard.js")

# (broken token -> correct token). Order is irrelevant: all tokens are distinct
# full strings, so string replacement is unambiguous.
DASHBOARD_FIXES = [
    ("analytics.overview_metrics.total_active_subscriptions", "analytics.metrics.active_subscriptions"),
    ("analytics.overview_metrics.departments_count", "analytics.metrics.departments"),
    ("analytics.overview_metrics.upcoming_renewals_30_days", "analytics.metrics.upcoming_renewals_next_30_days"),
    ("analytics.overview_metrics.ghost_licenses_total", "analytics.metrics.ghost_licenses"),
    ("analytics.overview_metrics.potential_monthly_savings", "analytics.metrics.potential_monthly_savings"),
    ("analytics.overview_metrics.monthly_saas_spend", "analytics.metrics.monthly_saas_spend"),
    ("analytics.overview_metrics.potential_annual_savings", "analytics.metrics.potential_annual_savings"),
    # The greeting referenced company.business_health_score (undefined); the
    # real field is the top-level company.health_score (=83).
    ("company.business_health_score", "company.health_score"),
]

# Pages that share the SpendPilot shell and need the tour wired in.
PAGES = [
    "dashboard.html",
    "subscriptions.html",
    "ai_cfo.html",
    "simulator.html",
    "negotiator.html",
    "doctor.html",
    "analytics.html",
    "reports.html",
    "settings.html",
]

DEMO_SCRIPTS = """  <script src="js/demo/demo-config.js"></script>
  <script src="js/demo/demo-controller.js"></script>
  <script src="js/demo/demo-bootstrap.js"></script>
"""

MARKER = "js/demo/demo-bootstrap.js"


def fix_dashboard():
    with open(DASHBOARD_JS, "r", encoding="utf-8") as f:
        src = f.read()
    counts = {}
    for bad, good in DASHBOARD_FIXES:
        counts[bad] = src.count(bad)
        src = src.replace(bad, good)
    if "overview_metrics" in src:
        print("[!] WARNING: 'overview_metrics' still present in dashboard.js")
    with open(DASHBOARD_JS, "w", encoding="utf-8") as f:
        f.write(src)
    print("[ok] Patched dashboard.js:")
    for bad, n in counts.items():
        print(f"      {n:>2}x  {bad}")


def wire_pages():
    for name in PAGES:
        path = os.path.join(FRONTEND, name)
        if not os.path.exists(path):
            print(f"[--] missing: {name}")
            continue
        with open(path, "r", encoding="utf-8") as f:
            html = f.read()
        if MARKER in html:
            print(f"[skip] {name} (already wired)")
            continue
        if "</body>" not in html:
            print(f"[!] {name}: no </body> found — skipping")
            continue
        # Insert right before </body>; preserve original closing tag.
        new_html = html.replace("</body>", DEMO_SCRIPTS + "</body>", 1)
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_html)
        print(f"[ok] wired: {name}")


def main():
    if not os.path.exists(DASHBOARD_JS):
        print("[!] dashboard.js not found at", DASHBOARD_JS)
        sys.exit(1)
    fix_dashboard()
    print()
    wire_pages()
    print()
    print("Done. Guided demo scripts are now available on every page.")


if __name__ == "__main__":
    main()
