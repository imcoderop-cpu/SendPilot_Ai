import re

target_btn = '<button id="header-notif-btn" data-action="open-notifications" aria-label="Notifications" class="relative p-1.5 rounded-full bg-surface-container-lowest brutal-border border-[2px] hover:bg-surface text-on-surface hover:scale-105 transition-transform" type="button"><span class="material-symbols-outlined text-[20px]">notifications</span><span id="header-notif-dot" class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-error rounded-full brutal-border border-[1.5px]"></span></button>'

for fname in ['frontend/reports.html', 'frontend/settings.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        html = f.read()

    html = re.sub(
        r'<button[^>]*aria-label=\"Notifications view\"[^>]*>.*?</button>',
        target_btn,
        html,
        flags=re.DOTALL
    )

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(html)

print("Updated reports.html and settings.html header notification buttons!")

