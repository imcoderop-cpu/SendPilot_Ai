import glob
import re

for f in sorted(glob.glob('frontend/*.html')):
    content = open(f, encoding='utf-8').read()
    forms = re.findall(r'<form[^>]*>', content)
    buttons_no_type = [b for b in re.findall(r'<button[^>]*>', content) if 'type=' not in b]
    print(f"{f}: forms={len(forms)}, buttons_without_type={len(buttons_no_type)}")
    for fm in forms:
        print(f"   Form: {fm}")

