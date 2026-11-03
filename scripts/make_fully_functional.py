import os
import re
import glob

# =========================================================================
# 1. CLEAN UP ALL GOOGLEUSERCONTENT IMAGES ACROSS ALL HTML FILES
# =========================================================================
avatar_html = '<div class="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-body-sm brutal-border border-[2px]">AR</div>'

html_files = glob.glob('frontend/*.html')
for fpath in html_files:
    with open(fpath, 'r', encoding='utf-8') as fp:
        content = fp.read()

    # Replace <img alt="Profile"...> in header
    content = re.sub(
        r'<button class="flex items-center rounded-full brutal-border border-\[2px\]"[^>]*><img alt="Profile"[^>]*src="https://lh3\.googleusercontent\.com[^"]*"[^>]*></button>',
        f'<button id="header-profile-btn" data-action="open-profile" aria-label="User Profile" class="flex items-center rounded-full brutal-border border-[2px] hover:scale-105 transition-transform" type="button">{avatar_html}</button>',
        content
    )

    # Replace any other googleusercontent img
    content = re.sub(
        r'<img[^>]*src="https://lh3\.googleusercontent\.com[^"]*"[^>]*>',
        avatar_html,
        content
    )

    # Add hook IDs to header buttons if not already present
    content = re.sub(
        r'<button class="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low brutal-border border-\[2px\] font-headline-sm text-body-sm[^>]*>',
        '<button id="header-org-btn" data-action="open-org-switcher" class="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low brutal-border border-[2px] font-headline-sm text-body-sm text-on-surface hover:bg-surface-container transition-all" type="button">',
        content
    )

    # Tag notifications buttons in header
    content = re.sub(
        r'<button class="relative p-1\.5 rounded-full bg-surface-container-lowest brutal-border border-\[2px\] hover:bg-surface text-on-surface"[^>]*>',
        '<button id="header-notif-btn" data-action="open-notifications" class="relative p-1.5 rounded-full bg-surface-container-lowest brutal-border border-[2px] hover:bg-surface text-on-surface hover:scale-105 transition-transform" type="button">',
        content
    )

    # Tag sidebar profile card
    content = re.sub(
        r'<div class="flex items-center gap-2\.5 p-2 rounded-xl bg-surface-container-lowest brutal-border brutal-shadow-sm">',
        '<div id="sidebar-profile-card" data-action="open-profile" class="flex items-center gap-2.5 p-2 rounded-xl bg-surface-container-lowest brutal-border brutal-shadow-sm cursor-pointer hover:bg-surface-container transition-all">',
        content
    )

    # Tag sidebar notifications button
    content = re.sub(
        r'<button aria-label="Notifications" class="p-1\.5 rounded-lg bg-surface-container-lowest brutal-border border-\[2px\][^>]*>',
        '<button id="sidebar-notif-btn" data-action="open-notifications" aria-label="Notifications" class="p-1.5 rounded-lg bg-surface-container-lowest brutal-border border-[2px] hover:bg-surface text-on-surface transition-transform active:translate-y-0.5 relative" type="button">',
        content
    )

    # Tag sidebar theme switcher
    content = re.sub(
        r'<button aria-label="Theme Switch" class="p-1\.5 rounded-lg bg-surface-container-lowest brutal-border border-\[2px\][^>]*>',
        '<button id="theme-switch-btn" data-action="toggle-theme" aria-label="Theme Switch" class="p-1.5 rounded-lg bg-surface-container-lowest brutal-border border-[2px] hover:bg-surface text-on-surface transition-transform active:translate-y-0.5" type="button">',
        content
    )

    # Tag PayPal sync badges
    content = re.sub(
        r'<div class="flex items-center justify-between px-2\.5 py-1\.5 rounded-full bg-surface-container-lowest brutal-border border-\[2px\]">',
        '<div id="sidebar-paypal-sync" data-action="open-paypal" class="flex items-center justify-between px-2.5 py-1.5 rounded-full bg-surface-container-lowest brutal-border border-[2px] cursor-pointer hover:bg-surface-container transition-all">',
        content
    )

    content = re.sub(
        r'<div class="hidden xl:flex items-center gap-1\.5 px-2\.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-headline-sm text-body-sm brutal-border border-\[2px\]">',
        '<div id="header-paypal-sync" data-action="open-paypal" class="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-headline-sm text-body-sm brutal-border border-[2px] cursor-pointer hover:scale-105 transition-transform">',
        content
    )

    # Tag omnibar input for command palette
    content = re.sub(
        r'<input class="w-full pl-9 pr-20 py-1\.5 bg-background[^>]*placeholder="Ask SpendPilot AI or search subscriptions \(Cmd \+ K\)\.\.\."[^>]*>',
        '<input id="global-omnibar-input" data-action="open-command-palette" class="w-full pl-9 pr-20 py-1.5 bg-background rounded-full brutal-border border-[2px] text-body-sm font-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-lowest cursor-pointer" placeholder="Ask SpendPilot AI or search subscriptions (Cmd + K)..." type="text" readonly>',
        content
    )

    with open(fpath, 'w', encoding='utf-8') as fp:
        fp.write(content)

print("Updated common shell buttons & cleaned images across all HTML files!")

# =========================================================================
# 2. CLEAN UP DASHBOARD.HTML CHAT CONTAINER
# =========================================================================
with open('frontend/dashboard.html', 'r', encoding='utf-8') as fp:
    dash = fp.read()

# Replace hardcoded mock chat messages inside #dash-chat-messages with a clean empty dynamic container
start_marker = 'id="dash-chat-messages"'
end_marker = '<!-- Quick Suggestion Prompt Chips -->'

start_idx = dash.find(start_marker)
end_idx = dash.find(end_marker)

if start_idx != -1 and end_idx != -1:
    close_div_idx = dash.rfind('</div>', start_idx, end_idx)
    clean_chat_container = 'id="dash-chat-messages" class="p-space-md flex flex-col gap-4 max-h-[480px] overflow-y-auto bg-surface-container-low/30">\n'
    dash = dash[:start_idx] + clean_chat_container + dash[close_div_idx:]

# Update the Quick Suggestion Prompt Chips to have click data attributes
prompt_chips_old = '''<div class="flex items-center gap-1.5 overflow-x-auto pb-1">
<button class="px-2.5 py-1 rounded-full bg-surface-container-lowest font-body-sm text-[12px] font-semibold text-on-surface brutal-border border-[1.5px] whitespace-nowrap hover:bg-primary-fixed transition-colors" type="button">
                💰 How to save ₹1 Lakh?
              </button>
<button class="px-2.5 py-1 rounded-full bg-surface-container-lowest font-body-sm text-[12px] font-semibold text-on-surface brutal-border border-[1.5px] whitespace-nowrap hover:bg-primary-fixed transition-colors" type="button">
                ✂️ Which tools to cancel?
              </button>
<button class="px-2.5 py-1 rounded-full bg-surface-container-lowest font-body-sm text-[12px] font-semibold text-on-surface brutal-border border-[1.5px] whitespace-nowrap hover:bg-primary-fixed transition-colors" type="button">
                ✉️ Draft negotiation email
              </button>
<button class="px-2.5 py-1 rounded-full bg-surface-container-lowest font-body-sm text-[12px] font-semibold text-on-surface brutal-border border-[1.5px] whitespace-nowrap hover:bg-primary-fixed transition-colors" type="button">
                📊 Predict Q3 budget
              </button>
</div>'''

prompt_chips_new = '''<div class="flex items-center gap-1.5 overflow-x-auto pb-1">
<button class="quick-chip px-2.5 py-1 rounded-full bg-surface-container-lowest font-body-sm text-[12px] font-semibold text-on-surface brutal-border border-[1.5px] whitespace-nowrap hover:bg-primary-fixed transition-colors" data-query="How can we save ₹2.7 Lakhs immediately?" type="button">
  💰 How to save ₹2.7 Lakhs?
</button>
<button class="quick-chip px-2.5 py-1 rounded-full bg-surface-container-lowest font-body-sm text-[12px] font-semibold text-on-surface brutal-border border-[1.5px] whitespace-nowrap hover:bg-primary-fixed transition-colors" data-query="Which subscriptions have inactive ghost seats?" type="button">
  ✂️ Ghost seats audit
</button>
<button class="quick-chip px-2.5 py-1 rounded-full bg-surface-container-lowest font-body-sm text-[12px] font-semibold text-on-surface brutal-border border-[1.5px] whitespace-nowrap hover:bg-primary-fixed transition-colors" data-query="Which subscriptions renew in the next 30 days?" type="button">
  ⏰ Renewals next 30 days
</button>
<button class="quick-chip px-2.5 py-1 rounded-full bg-surface-container-lowest font-body-sm text-[12px] font-semibold text-on-surface brutal-border border-[1.5px] whitespace-nowrap hover:bg-primary-fixed transition-colors" data-query="Show Acme runway impact and burn velocity" type="button">
  📊 Cash runway analysis
</button>
</div>'''

if prompt_chips_old in dash:
    dash = dash.replace(prompt_chips_old, prompt_chips_new)

# Add IDs to chat clear & expand buttons
dash = dash.replace(
    '<button class="p-1 rounded-lg bg-surface-container-lowest brutal-border border-[2px] hover:bg-surface text-on-surface" title="Clear thread" type="button">',
    '<button id="dash-chat-clear" class="p-1 rounded-lg bg-surface-container-lowest brutal-border border-[2px] hover:bg-surface text-on-surface" title="Clear thread" type="button">'
)

dash = dash.replace(
    '<button class="p-1 rounded-lg bg-surface-container-lowest brutal-border border-[2px] hover:bg-surface text-on-surface" title="Expand panel" type="button">',
    '<button id="dash-chat-expand" class="p-1 rounded-lg bg-surface-container-lowest brutal-border border-[2px] hover:bg-surface text-on-surface" title="Expand panel" type="button">'
)

with open('frontend/dashboard.html', 'w', encoding='utf-8') as fp:
    fp.write(dash)

print("Cleaned mock chat from dashboard.html and hooked interactive chips!")

