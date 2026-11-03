import glob
import re

for f in sorted(glob.glob('frontend/*.html')):
    if f.endswith('index.html'):
        continue
    c = open(f, encoding='utf-8').read()
    h = re.search(r'<button id="header-notif-btn"[^>]*>.*?</button>', c, re.DOTALL)
    s = re.search(r'<button id="sidebar-notif-btn"[^>]*>.*?</button>', c, re.DOTALL)
    print(f"=== {f} ===")
    if h:
        print("  HEADER:", h.group(0))
    else:
        print("  HEADER: NOT FOUND!")
    if s:
        print("  SIDEBAR:", s.group(0))
    else:
        print("  SIDEBAR: NOT FOUND!")

