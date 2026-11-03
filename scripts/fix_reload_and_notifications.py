import os
import re
import glob

# =========================================================================
# 1. FIX INDEX.HTML (Remove meta refresh, use clean script replace)
# =========================================================================
index_content = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>SpendPilot AI</title>
  <script>
    window.location.replace("dashboard.html");
  </script>
</head>
<body style="background:#FDFBF7;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <p style="font-weight:bold;color:#18181B;">Loading SpendPilot AI Dashboard...</p>
</body>
</html>'''

with open('frontend/index.html', 'w', encoding='utf-8') as f:
    f.write(index_content)
print("Fixed frontend/index.html")

# =========================================================================
# 2. FIX NOTIFICATION ICONS & MISSING BUTTON TYPES ACROSS ALL HTML FILES
# =========================================================================
html_files = glob.glob('frontend/*.html')

for fpath in html_files:
    if fpath.endswith('index.html'):
        continue

    with open(fpath, 'r', encoding='utf-8') as fp:
        html = fp.read()

    # 1. Standardize Header Notification Button: ONLY bell icon + small red dot (NO text popup like "20 new" / "5 new")
    html = re.sub(
        r'<button id="header-notif-btn"[^>]*>.*?</button>',
        '''<button id="header-notif-btn" data-action="open-notifications" aria-label="Notifications" class="relative p-1.5 rounded-full bg-surface-container-lowest brutal-border border-[2px] hover:bg-surface text-on-surface hover:scale-105 transition-transform" type="button"><span class="material-symbols-outlined text-[20px]">notifications</span><span id="header-notif-dot" class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-error rounded-full brutal-border border-[1.5px]"></span></button>''',
        html,
        flags=re.DOTALL
    )

    # 2. Standardize Sidebar Notification Button: Bell icon + small red dot
    html = re.sub(
        r'<button id="sidebar-notif-btn"[^>]*>.*?</button>',
        '''<button id="sidebar-notif-btn" data-action="open-notifications" aria-label="Notifications" class="p-1.5 rounded-lg bg-surface-container-lowest brutal-border border-[2px] hover:bg-surface text-on-surface transition-transform active:translate-y-0.5 relative" type="button"><span class="material-symbols-outlined text-[18px]">notifications</span><span id="sidebar-notif-dot" class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-error rounded-full brutal-border border-[1.5px]"></span></button>''',
        html,
        flags=re.DOTALL
    )

    # 3. Add type="button" to any <button> missing type
    html = re.sub(r'<button(?![^>]*type=)([^>]*)>', r'<button type="button"\1>', html)

    with open(fpath, 'w', encoding='utf-8') as fp:
        fp.write(html)

print("Updated notification buttons and button types across all HTML files!")

# =========================================================================
# 3. FIX DASHBOARD.HTML CHAT INPUT & SEND BUTTON
# =========================================================================
with open('frontend/dashboard.html', 'r', encoding='utf-8') as f:
    dash = f.read()

# Make sure chat input has id="dash-chat-input"
dash = re.sub(
    r'<input([^>]*placeholder="Ask SpendPilot anything[^"]*"[^>]*)>',
    r'<input id="dash-chat-input" type="text" autocomplete="off"\1>',
    dash
)

# If id="dash-chat-input" got duplicated, clean it up
dash = dash.replace('id="dash-chat-input" id="dash-chat-input"', 'id="dash-chat-input"')

# Make sure send button has id="dash-chat-send"
dash = re.sub(
    r'<button([^>]*title="Send query"[^>]*)>',
    r'<button id="dash-chat-send" type="button"\1>',
    dash
)
dash = dash.replace('id="dash-chat-send" id="dash-chat-send"', 'id="dash-chat-send"')

with open('frontend/dashboard.html', 'w', encoding='utf-8') as f:
    f.write(dash)

print("Fixed chat input and send button in dashboard.html!")

