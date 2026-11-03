import os
import re

os.makedirs('frontend', exist_ok=True)

def get_sidebar_html(active_id):
    items = [
        ('dashboard', 'dashboard.html', 'grid_view', 'Dashboard'),
        ('subscriptions', 'subscriptions.html', 'credit_card', 'Subscriptions'),
        ('ai-cfo', 'ai_cfo.html', 'smart_toy', 'AI CFO Advisory'),
        ('simulator', 'simulator.html', 'timeline', 'What-If Simulator'),
        ('negotiator', 'negotiator.html', 'handshake', 'AI Negotiator'),
        ('doctor', 'doctor.html', 'vital_signs', 'Subscription Doctor'),
        ('analytics', 'analytics.html', 'bar_chart', 'Analytics'),
        ('reports', 'reports.html', 'summarize', 'Executive Reports'),
        ('settings', 'settings.html', 'settings', 'Company Settings')
    ]
    
    links_html = []
    for item_id, href, icon, label in items:
        if item_id == active_id:
            # Purple overlay active state exactly as requested
            cls = 'flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all bg-primary-container text-on-primary font-bold brutal-border brutal-shadow-sm'
            aria = ' aria-current="page"'
        else:
            cls = 'flex items-center gap-2.5 px-3 py-2 rounded-xl text-on-surface-variant font-headline-sm text-body-md hover:bg-surface-container hover:text-on-surface transition-all'
            aria = ''
        links_html.append(f'<a{aria} class="{cls}" data-path="{item_id}" href="{href}"><span class="material-symbols-outlined text-[20px]">{icon}</span>{label}</a>')
    
    links_joined = '\n'.join(links_html)
    
    # Text-only brand logo (No img tag!), plus user avatar using styled brutalist initials badge
    sidebar = f'''<aside class="fixed left-0 top-0 h-full w-[260px] bg-surface-container-lowest brutal-border border-r-[3px] border-t-0 border-b-0 border-l-0 z-50 flex flex-col justify-between overflow-y-auto"><div class="p-space-md"><div class="flex items-center gap-2 mb-space-lg pb-space-sm brutal-border border-b-[3px] border-t-0 border-l-0 border-r-0"><div class="flex flex-col"><div class="flex items-center gap-1.5"><span class="font-headline-sm text-[22px] font-bold text-on-surface tracking-tight leading-none">SpendPilot</span><span class="font-headline-sm text-[22px] font-bold text-primary tracking-tight leading-none">AI</span></div><div class="mt-1"><span class="inline-block px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-badge text-label-badge uppercase tracking-wider brutal-border border-[2px] -rotate-1">AI CFO v2.4</span></div></div></div><nav class="flex flex-col gap-1" data-active-classes="bg-primary-container text-on-primary font-bold brutal-border brutal-shadow-sm">{links_joined}</nav></div><div class="p-space-md border-t-[3px] border-on-surface flex flex-col gap-3 bg-surface-container-low"><div class="flex items-center justify-between px-2.5 py-1.5 rounded-full bg-surface-container-lowest brutal-border border-[2px]"><div class="flex items-center gap-2"><span class="relative flex h-2.5 w-2.5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary-fixed-dim opacity-75"></span><span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-tertiary-container"></span></span><span class="font-label-code text-[11px] text-on-surface font-semibold">PayPal Live Sync</span></div><span class="material-symbols-outlined text-[16px] text-tertiary-container">check_circle</span></div><div class="flex items-center justify-between px-1"><div class="flex items-center gap-2"><button aria-label="Theme Switch" class="p-1.5 rounded-lg bg-surface-container-lowest brutal-border border-[2px] hover:bg-surface text-on-surface transition-transform active:translate-y-0.5" type="button"><span class="material-symbols-outlined text-[18px]">light_mode</span></button><button aria-label="Notifications" class="p-1.5 rounded-lg bg-surface-container-lowest brutal-border border-[2px] hover:bg-surface text-on-surface transition-transform active:translate-y-0.5 relative" type="button"><span class="material-symbols-outlined text-[18px]">notifications</span><span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-error rounded-full brutal-border border-[1.5px]"></span></button></div><span class="font-label-badge text-label-badge uppercase tracking-wider text-outline">PRO ORG</span></div><div class="flex items-center gap-2.5 p-2 rounded-xl bg-surface-container-lowest brutal-border brutal-shadow-sm"><div class="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-body-sm brutal-border border-[2px]">AR</div><div class="flex flex-col min-w-0 flex-1"><span class="font-headline-sm text-body-sm font-bold text-on-surface truncate">Alex Rivera</span><span class="font-body-sm text-[11px] text-on-surface-variant truncate">CFO / Founder</span></div><button class="text-on-surface-variant hover:text-on-surface" type="button"><span class="material-symbols-outlined text-[20px]">unfold_more</span></button></div></div></aside>'''
    return sidebar

def replace_aside(content, active_id):
    new_aside = get_sidebar_html(active_id)
    # Replace existing <aside ... </aside>
    return re.sub(r'<aside.*?</aside>', new_aside, content, flags=re.DOTALL)

# 1. Process Dashboard
with open('stitch_spendpilot_ai_dashboard/home_dashboard_spendpilot_ai/code.html', 'r', encoding='utf-8') as f:
    dash_html = f.read()
dash_html = replace_aside(dash_html, 'dashboard')
with open('frontend/dashboard.html', 'w', encoding='utf-8') as f:
    f.write(dash_html)

# 2. Process Subscriptions
with open('stitch_spendpilot_ai_dashboard/subscriptions_spendpilot_ai/code.html', 'r', encoding='utf-8') as f:
    subs_html = f.read()
subs_html = replace_aside(subs_html, 'subscriptions')
with open('frontend/subscriptions.html', 'w', encoding='utf-8') as f:
    f.write(subs_html)

# 3. Process AI CFO Advisory
with open('stitch_spendpilot_ai_dashboard/ai_cfo_advisory_spendpilot_ai/code.html', 'r', encoding='utf-8') as f:
    cfo_html = f.read()
cfo_html = replace_aside(cfo_html, 'ai-cfo')
with open('frontend/ai_cfo.html', 'w', encoding='utf-8') as f:
    f.write(cfo_html)

# 4. Process Executive Reports
with open('stitch_spendpilot_ai_dashboard/executive_reports_spendpilot_ai/code.html', 'r', encoding='utf-8') as f:
    reports_html = f.read()
reports_html = replace_aside(reports_html, 'reports')
with open('frontend/reports.html', 'w', encoding='utf-8') as f:
    f.write(reports_html)

# 5. Process Settings
with open('stitch_spendpilot_ai_dashboard/settings_spendpilot_ai/code.html', 'r', encoding='utf-8') as f:
    settings_html = f.read()
settings_html = replace_aside(settings_html, 'settings')
with open('frontend/settings.html', 'w', encoding='utf-8') as f:
    f.write(settings_html)

# 6. Process Simulator (Standalone page)
with open('stitch_spendpilot_ai_dashboard/what_if_simulator_ai_negotiator_spendpilot_ai/code.html', 'r', encoding='utf-8') as f:
    sim_full = f.read()
sim_html = replace_aside(sim_full, 'simulator')
with open('frontend/simulator.html', 'w', encoding='utf-8') as f:
    f.write(sim_html)

# 7. Create index.html redirecting to dashboard.html
with open('frontend/index.html', 'w', encoding='utf-8') as f:
    f.write('''<!DOCTYPE html>
<html><head><meta http-equiv="refresh" content="0; url='dashboard.html'" /></head><body><p>Redirecting to <a href="dashboard.html">SpendPilot Dashboard</a>...</p></body></html>''')

print("Base pages processed successfully!")

