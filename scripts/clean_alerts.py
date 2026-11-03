import re

# 1. doctor.html
with open('frontend/doctor.html', 'r', encoding='utf-8') as f:
    doc = f.read()

doc = doc.replace("alert('Running forensic telemetry scan across PayPal invoices and SSO logs...')", "window.api.showToast('Forensic telemetry scan completed across PayPal invoices and Google SSO logs.', 'info')")
doc = doc.replace("alert('Prescribing bulk treatment: ₹74,000 in monthly waste scheduled for immediate reclamation.')", "window.api.showToast('Applied all prescriptions: ₹74,000/mo scheduled for reclamation!', 'success')")
doc = doc.replace("alert('Loom seats revoked via API')", "window.api.showToast('Loom phantom seats revoked via API!', 'success')")
doc = doc.replace("alert('Notion AI addon pruned')", "window.api.showToast('Notion AI addon pruned successfully!', 'success')")
doc = doc.replace("alert('Migration plan scheduled')", "window.api.showToast('Asana to Linear migration plan scheduled!', 'info')")
doc = doc.replace("alert('Downgrade request queued')", "window.api.showToast('Zoom tier downgrade request queued!', 'success')")
doc = doc.replace("alert('Retirement workflow triggered')", "window.api.showToast('Miro retirement workflow triggered!', 'info')")

with open('frontend/doctor.html', 'w', encoding='utf-8') as f:
    f.write(doc)

# 2. negotiator.html
with open('frontend/negotiator.html', 'r', encoding='utf-8') as f:
    neg = f.read()

neg = neg.replace("alert('Regenerating AI Counter-Proposal Draft with real market benchmarks...')", "window.api.showToast('Regenerating AI Counter-Proposal with 12k+ B2B market benchmarks...', 'info')")
neg = neg.replace("alert('Draft copied to clipboard!')", "window.api.showToast('Vendor counter-proposal copied to clipboard!', 'success')")
neg = neg.replace("alert('Email dispatched via SendPilot AI executive mailer!')", "window.api.showToast('Email dispatched to vendor renewals team via AI executive mailer!', 'success')")

with open('frontend/negotiator.html', 'w', encoding='utf-8') as f:
    f.write(neg)

print("Replaced all raw alert() calls with beautiful neo-brutalist toast notifications!")

