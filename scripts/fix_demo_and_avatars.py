#!/usr/bin/env python3
"""
SpendPilot AI — Demo + Avatar fix script.

1. Updates profile picture avatars in all 9 HTML pages: replaces the initials-only
   avatar div (AR) with an img tag loading assets/pfp.jpg.
2. Confirms dashboard.js was already patched (shows current state).

Run:  python scripts/fix_demo_and_avatars.py
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND = os.path.join(ROOT, "frontend")

PAGES = [
    "dashboard.html", "subscriptions.html", "ai_cfo.html",
    "simulator.html", "negotiator.html", "doctor.html",
    "analytics.html", "reports.html", "settings.html",
]

# ── Avatar replacement ──────────────────────────────────────────────────────
# Match the sidebar profile avatar: w-8 h-8 rounded-full bg-primary text-on-primary
# that contains just "AR" text and replace with an img tag.
AVATAR_PATTERN = re.compile(
    r'(<div\s[^>]*?class="[^"]*?w-8 h-8 rounded-full bg-primary text-on-primary[^"]*?"[^>]*?>)\s*AR\s*</div>',
    re.DOTALL
)
AVATAR_REPLACEMENT = r'<div class="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-body-sm brutal-border border-[2px] overflow-hidden"><img src="assets/pfp.jpg" alt="Alex Rivera" class="w-full h-full object-cover" onerror="this.parentElement.textContent=\'AR\'"></div>'

# Sidebar profile card avatar (w-8 h-8) — same match but no brutal-border class may vary
SIDEBAR_AVATAR_PATTERN = re.compile(
    r'(<div[^>]+class="[^"]*w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-body-sm brutal-border border-\[2px\][^"]*"[^>]*>)\s*AR\s*(</div>)',
    re.DOTALL
)

# Header profile button avatar (same classes)
# Also handle the profile modal avatar (w-12 h-12)
MODAL_AVATAR_PATTERN = re.compile(
    r'(<div\s[^>]*?class="[^"]*?w-12 h-12 rounded-2xl bg-primary text-on-primary[^"]*?"[^>]*?>)\s*AR\s*</div>',
    re.DOTALL
)
MODAL_AVATAR_REPLACEMENT = r'<div class="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-bold brutal-border border-[2px] brutal-shadow-sm overflow-hidden"><img src="assets/pfp.jpg" alt="Alex Rivera" class="w-full h-full object-cover" onerror="this.parentElement.textContent=\'AR\'"></div>'


def update_avatars(html):
    # Replace all "AR" text-only divs with avatar image
    def replace_small_avatar(m):
        outer = m.group(1)
        if 'overflow-hidden' not in outer:
            outer = outer.rstrip('>') + ' overflow-hidden>'
        return f'{outer}<img src="assets/pfp.jpg" alt="Alex Rivera" class="w-full h-full object-cover" onerror="this.parentElement.textContent=\'AR\'"></div>'

    # Replace small avatars (w-8 h-8)
    html = re.sub(
        r'<div([^>]*class="[^"]*w-8 h-8 rounded-full bg-primary text-on-primary[^"]*"[^>]*)>\s*AR\s*</div>',
        lambda m: '<div' + (m.group(1) + ' overflow-hidden>' if 'overflow-hidden' not in m.group(1) else m.group(1) + '>')
                  + '<img src="assets/pfp.jpg" alt="Alex Rivera" class="w-full h-full object-cover" onerror="this.parentElement.textContent=\'AR\'"></div>',
        html, flags=re.DOTALL
    )
    # Replace large modal avatar (w-12 h-12)
    html = re.sub(
        r'<div([^>]*class="[^"]*w-12 h-12[^"]*bg-primary[^"]*"[^>]*)>\s*AR\s*</div>',
        lambda m: '<div' + (m.group(1) + ' overflow-hidden>' if 'overflow-hidden' not in m.group(1) else m.group(1) + '>')
                  + '<img src="assets/pfp.jpg" alt="Alex Rivera" class="w-full h-full object-cover" onerror="this.parentElement.textContent=\'AR\'"></div>',
        html, flags=re.DOTALL
    )
    return html


def process_pages():
    for name in PAGES:
        path = os.path.join(FRONTEND, name)
        if not os.path.exists(path):
            print(f"[--] missing: {name}")
            continue
        with open(path, "r", encoding="utf-8") as f:
            html = f.read()
        new_html = update_avatars(html)
        if new_html != html:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_html)
            print(f"[ok] avatars updated: {name}")
        else:
            print(f"[skip] no AR avatar found or already updated: {name}")


def check_dashboard_js():
    path = os.path.join(FRONTEND, "js", "pages", "dashboard.js")
    with open(path, "r", encoding="utf-8") as f:
        src = f.read()
    if "overview_metrics" in src:
        print("[!] WARNING: overview_metrics still in dashboard.js — re-running patch")
        fixes = [
            ("analytics.overview_metrics.total_active_subscriptions", "analytics.metrics.active_subscriptions"),
            ("analytics.overview_metrics.departments_count", "analytics.metrics.departments"),
            ("analytics.overview_metrics.upcoming_renewals_30_days", "analytics.metrics.upcoming_renewals_next_30_days"),
            ("analytics.overview_metrics.ghost_licenses_total", "analytics.metrics.ghost_licenses"),
            ("analytics.overview_metrics.potential_monthly_savings", "analytics.metrics.potential_monthly_savings"),
            ("analytics.overview_metrics.monthly_saas_spend", "analytics.metrics.monthly_saas_spend"),
            ("analytics.overview_metrics.potential_annual_savings", "analytics.metrics.potential_annual_savings"),
            ("company.business_health_score", "company.health_score"),
        ]
        for bad, good in fixes:
            src = src.replace(bad, good)
        with open(path, "w", encoding="utf-8") as f:
            f.write(src)
        print("[ok] dashboard.js re-patched")
    else:
        print("[ok] dashboard.js already patched")


if __name__ == "__main__":
    check_dashboard_js()
    print()
    process_pages()
    print("\nDone.")
