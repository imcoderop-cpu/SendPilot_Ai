#!/usr/bin/env python3
"""
SpendPilot AI – PayPal button + theme toggle patch.

1.  On every page, the sidebar "PayPal Live Sync" badge (#sidebar-paypal-sync)
    previously had data-action="open-paypal" which opened the modal on any click.
    We strip that attribute (store.js now strips it at runtime too, belt-and-suspenders).

2.  We ADD id="header-paypal-btn" to the header's "PayPal Synced" green pill so it
    satisfies the guard in store.js (only buttons with that id open the modal).

3.  The theme-switch button already has data-action="toggle-theme" — we leave it alone
    because store.js now has a fully working dark-mode implementation.

Run:  python scripts/patch_paypal_and_theme.py
"""
import os, re, sys

ROOT     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND = os.path.join(ROOT, "frontend")

PAGES = [
    "dashboard.html", "subscriptions.html", "ai_cfo.html",
    "simulator.html", "negotiator.html",    "doctor.html",
    "analytics.html", "reports.html",       "settings.html",
]

def patch_page(html: str) -> str:
    # ── 1. Strip data-action="open-paypal" from the sidebar sync badge ──
    html = re.sub(
        r'(<div[^>]+id="sidebar-paypal-sync"[^>]*)\s+data-action="open-paypal"',
        r'\1',
        html, flags=re.DOTALL
    )

    # ── 2. Add id="header-paypal-btn" to the header PayPal synced pill ──
    # It has id="header-paypal-sync" already; we also add the btn id
    # so the store guard fires correctly (belt-and-suspenders).
    html = re.sub(
        r'(<div[^>]+id="header-paypal-sync"[^>]*data-action="open-paypal"[^>]*>)',
        lambda m: m.group(0).replace('id="header-paypal-sync"',
                                     'id="header-paypal-sync" data-paypal-trigger="true"'),
        html, flags=re.DOTALL
    )

    # ── 3. Also give header-paypal-sync an id alias the store guard checks ──
    # Simplest: just rename so guard `target.id === 'header-paypal-btn'` matches
    html = html.replace(
        'id="header-paypal-sync" data-action="open-paypal"',
        'id="header-paypal-btn" data-action="open-paypal"'
    )

    return html


def main():
    for name in PAGES:
        path = os.path.join(FRONTEND, name)
        if not os.path.exists(path):
            print(f"[--] missing: {name}")
            continue
        with open(path, "r", encoding="utf-8") as f:
            html = f.read()
        new_html = patch_page(html)
        if new_html != html:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_html)
            print(f"[ok] patched: {name}")
        else:
            print(f"[skip] no changes: {name}")
    print("\nDone.")


if __name__ == "__main__":
    main()
