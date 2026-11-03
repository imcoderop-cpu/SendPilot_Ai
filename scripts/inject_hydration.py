import os
import re

# =========================================================================
# SCRIPT INJECTION HELPER
# =========================================================================
def inject_scripts(filepath, page_script_name):
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    # Shared shell hook attributes
    html = html.replace('Alex Rivera</span>', 'Alex Rivera</span>', 1)
    
    # Tag common header badges
    html = html.replace('<span>Acme Technologies</span>', '<span data-company-name>Acme Technologies</span>')
    html = html.replace('>Series B</span>', ' data-company-tier>Series B</span>')
    html = html.replace('>Health: 89/100</span>', ' data-health-score>Health: 89/100</span>')
    html = html.replace('>4 new</span>', ' data-notif-count>5 new</span>')
    html = html.replace('Alex Rivera</span>', '<span data-user-name>Alex Rivera</span>')
    html = html.replace('CFO / Founder</span>', '<span data-user-role>CFO / Founder</span>')

    # Add scripts before </body>
    script_tags = f'''
  <script src="js/api.js"></script>
  <script src="js/store.js"></script>
  <script src="js/pages/{page_script_name}"></script>
</body>'''
    
    if f'js/pages/{page_script_name}' not in html:
        html = html.replace('</body>', script_tags)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Updated scripts for {filepath}")

# =========================================================================
# 1. UPDATE DASHBOARD.HTML
# =========================================================================
with open('frontend/dashboard.html', 'r', encoding='utf-8') as f:
    d_html = f.read()

# Add IDs for KPIs
d_html = d_html.replace(
    '<h2 class="font-headline-md text-headline-md text-on-primary-fixed font-bold leading-tight">',
    '<h2 id="dash-banner-heading" class="font-headline-md text-headline-md text-on-primary-fixed font-bold leading-tight">'
)

d_html = d_html.replace(
    '<div class="font-data-metric text-data-metric text-on-surface font-bold">₹4,12,500</div>',
    '<div id="kpi-monthly-spend" class="font-data-metric text-data-metric text-on-surface font-bold">₹10,39,917</div>'
)

d_html = d_html.replace(
    '<div class="font-data-metric text-data-metric text-tertiary-container font-bold">₹82,000</div>',
    '<div id="kpi-potential-savings" class="font-data-metric text-data-metric text-tertiary-container font-bold">₹27,43,800</div>'
)

d_html = d_html.replace(
    '<div class="font-data-metric text-data-metric text-on-surface font-bold">7 Software</div>',
    '<div id="kpi-renewals" class="font-data-metric text-data-metric text-on-surface font-bold">8 Software</div>'
)

d_html = d_html.replace(
    '<div class="font-data-metric text-data-metric text-on-surface font-bold">14 Seats</div>',
    '<div id="kpi-ghost-seats" class="font-data-metric text-data-metric text-on-surface font-bold">42 Seats</div>'
)

d_html = d_html.replace(
    '<div class="font-data-metric text-data-metric text-on-surface font-bold">₹3.8L Synced</div>',
    '<div id="kpi-paypal-synced" class="font-data-metric text-data-metric text-on-surface font-bold">₹10.4L Synced</div>'
)

# Buttons
d_html = d_html.replace('<span>Run Auto-Negotiate</span>', '<span>Run Auto-Negotiate</span>', 1)
d_html = re.sub(
    r'<button[^>]*>\s*<span[^>]*>bolt</span>\s*<span>Run Auto-Negotiate</span>\s*</button>',
    '<button id="btn-quick-negotiate" class="flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-primary-container text-on-primary font-headline-sm text-body-md font-bold brutal-border brutal-shadow hover:translate-x-[-1px] hover:translate-y-[-1px] brutal-btn transition-all" type="button"><span class="material-symbols-outlined text-[18px]">bolt</span><span>Run Auto-Negotiate</span></button>',
    d_html
)

d_html = re.sub(
    r'<button[^>]*>\s*<span[^>]*>analytics</span>\s*<span>Generate CFO Report</span>\s*</button>',
    '<button id="btn-quick-report" class="flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-surface-container-lowest text-on-surface font-headline-sm text-body-md font-bold brutal-border brutal-shadow hover:translate-x-[-1px] hover:translate-y-[-1px] brutal-btn transition-all" type="button"><span class="material-symbols-outlined text-[18px]">analytics</span><span>Generate CFO Report</span></button>',
    d_html
)

d_html = re.sub(
    r'<button[^>]*>\s*<span[^>]*>person_off</span>\s*<span>Analyze Phantom Seats</span>\s*</button>',
    '<button id="btn-quick-phantom" class="flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-surface-container-lowest text-on-surface font-headline-sm text-body-md font-bold brutal-border brutal-shadow hover:translate-x-[-1px] hover:translate-y-[-1px] brutal-btn transition-all" type="button"><span class="material-symbols-outlined text-[18px]">person_off</span><span>Analyze Phantom Seats</span></button>',
    d_html
)

d_html = re.sub(
    r'<button[^>]*>\s*<span[^>]*>magic_button</span>\s*<span>Run What-If Simulation</span>\s*</button>',
    '<button id="btn-quick-whatif" class="flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-headline-sm text-body-md font-bold brutal-border brutal-shadow hover:translate-x-[-1px] hover:translate-y-[-1px] brutal-btn transition-all" type="button"><span class="material-symbols-outlined text-[18px]">magic_button</span><span>Run What-If Simulation</span></button>',
    d_html
)

# Recommendations container
d_html = d_html.replace(
    '<div class="grid grid-cols-1 md:grid-cols-2 gap-space-md">',
    '<div id="dash-recommendations-container" class="grid grid-cols-1 md:grid-cols-2 gap-space-md">'
)

# Chat elements
d_html = d_html.replace(
    'class="p-space-md flex flex-col gap-4 max-h-[480px] overflow-y-auto bg-surface-container-low/30"',
    'id="dash-chat-messages" class="p-space-md flex flex-col gap-4 max-h-[480px] overflow-y-auto bg-surface-container-low/30"'
)

d_html = d_html.replace(
    'placeholder="Ask anything about software spend, renewals, or budgets..."',
    'id="dash-chat-input" placeholder="Ask anything about software spend, renewals, or budgets..."'
)

d_html = d_html.replace(
    '<button class="p-2 rounded-xl bg-primary-container text-on-primary',
    '<button id="dash-chat-send" class="p-2 rounded-xl bg-primary-container text-on-primary'
)

with open('frontend/dashboard.html', 'w', encoding='utf-8') as f:
    f.write(d_html)

inject_scripts('frontend/dashboard.html', 'dashboard.js')

# =========================================================================
# 2. UPDATE SUBSCRIPTIONS.HTML
# =========================================================================
with open('frontend/subscriptions.html', 'r', encoding='utf-8') as f:
    s_html = f.read()

# Add IDs
s_html = s_html.replace('38 active subscriptions tracked via PayPal', '<span id="subs-total-count">65 active subscriptions</span> tracked via PayPal')
s_html = s_html.replace('₹4,12,500 total monthly run-rate', '<span id="subs-total-monthly">₹10,39,917 total monthly run-rate</span>')

# Search input
s_html = re.sub(r'<input([^>]*placeholder="Search subscriptions or vendors[^"]*"[^>]*)>', r'<input\1 id="subscription-search-input">', s_html)

# Add class to department pills
s_html = s_html.replace('>All</button>', ' class="dept-pill" data-dept="ALL">All</button>')
s_html = s_html.replace('>Engineering</button>', ' class="dept-pill" data-dept="Engineering">Engineering</button>')
s_html = s_html.replace('>Product</button>', ' class="dept-pill" data-dept="Product">Product</button>')
s_html = s_html.replace('>Design</button>', ' class="dept-pill" data-dept="Design">Design</button>')
s_html = s_html.replace('>Marketing</button>', ' class="dept-pill" data-dept="Marketing">Marketing</button>')
s_html = s_html.replace('>Sales</button>', ' class="dept-pill" data-dept="Sales">Sales</button>')
s_html = s_html.replace('>Operations</button>', ' class="dept-pill" data-dept="Operations">Operations</button>')

# Table body
s_html = re.sub(r'<tbody[^>]*>', '<tbody id="subscriptions-table-body" class="divide-y-[2px] divide-surface-container-high font-body-md text-on-surface">', s_html)

with open('frontend/subscriptions.html', 'w', encoding='utf-8') as f:
    f.write(s_html)

inject_scripts('frontend/subscriptions.html', 'subscriptions.js')

# =========================================================================
# 3. UPDATE DOCTOR.HTML
# =========================================================================
with open('frontend/doctor.html', 'r', encoding='utf-8') as f:
    doc_html = f.read()

doc_html = doc_html.replace('<div class="font-data-metric text-data-metric text-error font-bold">4 Tools</div>', '<div id="doc-zombie-count" class="font-data-metric text-data-metric text-error font-bold">4 Tools</div>')
doc_html = doc_html.replace('<div class="font-data-metric text-data-metric text-on-surface font-bold">14 Seats</div>', '<div id="doc-ghost-seats" class="font-data-metric text-data-metric text-on-surface font-bold">14 Seats</div>')
doc_html = doc_html.replace('<div class="font-data-metric text-data-metric text-tertiary-container font-bold">₹74,000</div>', '<div id="doc-reclaimable-total" class="font-data-metric text-data-metric text-tertiary-container font-bold">₹74,000</div>')
doc_html = doc_html.replace('<tbody class="divide-y-[2px] divide-surface-container-high font-body-md text-on-surface">', '<tbody id="doctor-findings-tbody" class="divide-y-[2px] divide-surface-container-high font-body-md text-on-surface">')

with open('frontend/doctor.html', 'w', encoding='utf-8') as f:
    f.write(doc_html)

inject_scripts('frontend/doctor.html', 'doctor.js')

# =========================================================================
# 4. UPDATE ANALYTICS.HTML
# =========================================================================
with open('frontend/analytics.html', 'r', encoding='utf-8') as f:
    an_html = f.read()

an_html = an_html.replace('<div class="font-data-metric text-data-metric text-on-surface font-bold">₹4,12,500</div>', '<div id="analytics-net-burn" class="font-data-metric text-data-metric text-on-surface font-bold">₹10,39,917</div>')
an_html = an_html.replace('<div class="font-data-metric text-data-metric text-on-surface font-bold">16.4%</div>', '<div id="analytics-opex-ratio" class="font-data-metric text-data-metric text-on-surface font-bold">16.4%</div>')
an_html = an_html.replace('<div class="font-data-metric text-data-metric text-on-surface font-bold">₹13,750 / d</div>', '<div id="analytics-daily-velocity" class="font-data-metric text-data-metric text-on-surface font-bold">₹34,664 / d</div>')
an_html = an_html.replace('<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">', '<div id="analytics-depts-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">', 2)

with open('frontend/analytics.html', 'w', encoding='utf-8') as f:
    f.write(an_html)

inject_scripts('frontend/analytics.html', 'analytics.js')

# =========================================================================
# 5. UPDATE NEGOTIATOR.HTML
# =========================================================================
with open('frontend/negotiator.html', 'r', encoding='utf-8') as f:
    neg_html = f.read()

neg_html = neg_html.replace('<div class="font-data-metric text-title-md font-bold text-on-surface mt-0.5">₹18,50,000</div>', '<div id="neg-annual-spend" class="font-data-metric text-title-md font-bold text-on-surface mt-0.5">₹11,40,000</div>')
neg_html = neg_html.replace('<div class="font-data-metric text-title-md font-bold text-tertiary-container mt-0.5">₹14,20,000</div>', '<div id="neg-target-offer" class="font-data-metric text-title-md font-bold text-tertiary-container mt-0.5">₹8,66,400</div>')
neg_html = neg_html.replace('<div class="font-body-sm text-body-sm font-bold text-tertiary-container mt-0.5">₹4,30,000 / yr</div>', '<div id="neg-potential-reclaim" class="font-body-sm text-body-sm font-bold text-tertiary-container mt-0.5">₹2,73,600 / yr</div>')
neg_html = neg_html.replace('<span>Data-Driven</span>', '<span>Data-Driven</span>', 1)
neg_html = neg_html.replace('>Data-Driven</button>', ' data-neg-tone="data-driven">Data-Driven</button>')
neg_html = neg_html.replace('>Polite Partner</button>', ' data-neg-tone="polite">Polite Partner</button>')
neg_html = neg_html.replace('>Aggressive</button>', ' data-neg-tone="aggressive">Aggressive</button>')

with open('frontend/negotiator.html', 'w', encoding='utf-8') as f:
    f.write(neg_html)

inject_scripts('frontend/negotiator.html', 'negotiator.js')

# =========================================================================
# 6. UPDATE SIMULATOR.HTML
# =========================================================================
with open('frontend/simulator.html', 'r', encoding='utf-8') as f:
    sim_html = f.read()

sim_html = sim_html.replace('<div class="font-data-metric text-data-metric text-tertiary-container mt-1">₹1,24,000 <span class="font-body-sm text-body-sm text-on-surface">/ yr</span></div>', '<div id="plan-a-savings" class="font-data-metric text-data-metric text-tertiary-container mt-1">₹1,30,000 <span class="font-body-sm text-body-sm text-on-surface">/ yr</span></div>')
sim_html = sim_html.replace('<div class="font-data-metric text-data-metric text-secondary mt-1">₹2,10,000 <span class="font-body-sm text-body-sm text-on-surface">/ yr</span></div>', '<div id="plan-b-savings" class="font-data-metric text-data-metric text-secondary mt-1">₹2,10,000 <span class="font-body-sm text-body-sm text-on-surface">/ yr</span></div>')
sim_html = sim_html.replace('<div class="font-data-metric text-data-metric text-primary mt-1">₹3,80,000 <span class="font-body-sm text-body-sm text-on-surface">/ yr</span></div>', '<div id="plan-c-savings" class="font-data-metric text-data-metric text-primary mt-1">₹3,40,000 <span class="font-body-sm text-body-sm text-on-surface">/ yr</span></div>')

with open('frontend/simulator.html', 'w', encoding='utf-8') as f:
    f.write(sim_html)

inject_scripts('frontend/simulator.html', 'simulator.js')

# =========================================================================
# 7. UPDATE REPORTS.HTML
# =========================================================================
with open('frontend/reports.html', 'r', encoding='utf-8') as f:
    rep_html = f.read()

# Make sure reports grid has id="reports-grid"
rep_html = re.sub(
    r'<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">',
    '<div id="reports-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">',
    rep_html
)

with open('frontend/reports.html', 'w', encoding='utf-8') as f:
    f.write(rep_html)

inject_scripts('frontend/reports.html', 'reports.js')

# =========================================================================
# 8. UPDATE AI_CFO.HTML & SETTINGS.HTML
# =========================================================================
inject_scripts('frontend/ai_cfo.html', 'ai_cfo.js')
inject_scripts('frontend/settings.html', 'settings.js')

print("All HTML files updated with hydration hooks and scripts!")

