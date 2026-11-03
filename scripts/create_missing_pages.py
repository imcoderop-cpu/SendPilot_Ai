import os
import re

from build_pages import get_sidebar_html

# Read a base file for head, tailwind, styles and header
with open('frontend/dashboard.html', 'r', encoding='utf-8') as f:
    base_html = f.read()

# Extract head
head_match = re.search(r'<head>.*?</head>', base_html, re.DOTALL)
head_html = head_match.group(0) if head_match else ''

# Extract header
header_match = re.search(r'<header.*?</header>', base_html, re.DOTALL)
header_html = header_match.group(0) if header_match else ''

# =========================================================================
# 1. CREATE DOCTOR.HTML (Subscription Doctor)
# =========================================================================
doctor_sidebar = get_sidebar_html('doctor')

doctor_content = f'''<!DOCTYPE html>
<html lang="en">
{head_html}
<body class="bg-background font-body-md text-on-surface antialiased">
{doctor_sidebar}
<div class="pl-[260px]">
{header_html}
<main class="relative pt-16 bg-background min-h-screen">
  <div class="flex flex-col w-full">
    <div class="p-space-lg lg:p-space-xl flex flex-col gap-space-lg w-full max-w-[1600px] mx-auto">
      
      <!-- Top Title & Badge -->
      <section class="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div>
          <div class="flex items-center gap-space-xs flex-wrap">
            <span class="px-3 py-1 rounded-full bg-error-container text-on-error-container font-label-badge text-label-badge uppercase tracking-wider brutal-border border-[2px] -rotate-1">
              Diagnostic Mode
            </span>
            <span class="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-code text-[11px] font-bold brutal-border border-[2px]">
              AI RX ENGINE v3.1
            </span>
          </div>
          <h1 class="font-headline-lg text-headline-lg text-on-surface mt-1">🩺 Subscription Doctor</h1>
          <p class="font-body-lg text-body-lg text-on-surface-variant">Automated pathology for phantom licenses, ghost subscriptions, and overlapping SaaS suites.</p>
        </div>
        
        <div class="flex items-center gap-3">
          <button class="flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface-container-lowest text-on-surface font-headline-sm text-body-md brutal-border brutal-shadow brutal-btn transition-transform hover:-translate-y-0.5" onclick="alert('Running forensic telemetry scan across PayPal invoices and SSO logs...')">
            <span class="material-symbols-outlined text-[18px]">biotech</span>
            <span>Scan SSO Logs</span>
          </button>
          <button class="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-container text-on-primary font-headline-sm text-body-md brutal-border brutal-shadow brutal-btn transition-transform hover:-translate-y-0.5" onclick="alert('Prescribing bulk treatment: ₹74,000 in monthly waste scheduled for immediate reclamation.')">
            <span class="material-symbols-outlined text-[20px] text-tertiary-fixed-dim">medication</span>
            <span>Apply All Rx Treatments</span>
          </button>
        </div>
      </section>

      <!-- Diagnostic Mosaic Grid (4 Cards) -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div class="bg-surface-container-lowest p-space-md rounded-2xl brutal-border brutal-shadow flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="font-label-badge text-label-badge uppercase text-outline">Zombie Subscriptions</span>
            <span class="p-1.5 rounded-lg bg-error-container brutal-border border-[2px]">
              <span class="material-symbols-outlined text-[18px] text-error">skull</span>
            </span>
          </div>
          <div class="my-3">
            <div class="font-data-metric text-data-metric text-error font-bold">4 Tools</div>
            <div class="font-label-code text-body-sm text-outline">0 logins past 60 days</div>
          </div>
          <div class="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full bg-error text-on-error font-label-badge text-body-sm font-bold brutal-border border-[1.5px]">
            Waste: ₹28,500 / mo
          </div>
        </div>

        <div class="bg-surface-container-lowest p-space-md rounded-2xl brutal-border brutal-shadow flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="font-label-badge text-label-badge uppercase text-outline">Phantom Seats</span>
            <span class="p-1.5 rounded-lg bg-surface-container brutal-border border-[2px]">
              <span class="material-symbols-outlined text-[18px] text-primary">person_off</span>
            </span>
          </div>
          <div class="my-3">
            <div class="font-data-metric text-data-metric text-on-surface font-bold">14 Seats</div>
            <div class="font-label-code text-body-sm text-outline">Ex-employees & inactive devs</div>
          </div>
          <div class="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-badge text-body-sm font-bold brutal-border border-[1.5px]">
            Waste: ₹18,400 / mo
          </div>
        </div>

        <div class="bg-surface-container-lowest p-space-md rounded-2xl brutal-border brutal-shadow flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="font-label-badge text-label-badge uppercase text-outline">Redundant Software</span>
            <span class="p-1.5 rounded-lg bg-surface-container brutal-border border-[2px]">
              <span class="material-symbols-outlined text-[18px] text-secondary">content_copy</span>
            </span>
          </div>
          <div class="my-3">
            <div class="font-data-metric text-data-metric text-on-surface font-bold">3 Duplicates</div>
            <div class="font-label-code text-body-sm text-outline">Overlapping feature sets</div>
          </div>
          <div class="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full bg-surface-container-highest font-label-badge text-body-sm font-bold brutal-border border-[1.5px]">
            Waste: ₹27,100 / mo
          </div>
        </div>

        <div class="bg-surface-container-lowest p-space-md rounded-2xl brutal-border brutal-shadow flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="font-label-badge text-label-badge uppercase text-outline">Reclaimable Run-Rate</span>
            <span class="p-1.5 rounded-lg bg-tertiary-fixed brutal-border border-[2px]">
              <span class="material-symbols-outlined text-[18px] text-tertiary-container">health_and_safety</span>
            </span>
          </div>
          <div class="my-3">
            <div class="font-data-metric text-data-metric text-tertiary-container font-bold">₹74,000</div>
            <div class="font-label-code text-body-sm text-outline">Per month potential savings</div>
          </div>
          <div class="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-badge text-body-sm font-bold brutal-border border-[1.5px]">
            97% AI Confidence
          </div>
        </div>
      </section>

      <!-- Forensic Diagnostic Ledger Table -->
      <section class="bg-surface-container-lowest rounded-2xl brutal-border brutal-shadow p-space-lg flex flex-col gap-space-md">
        <div class="flex items-center justify-between flex-wrap gap-2 pb-space-sm brutal-border border-b-[3px] border-t-0 border-l-0 border-r-0">
          <div>
            <h2 class="font-headline-sm text-headline-sm text-on-surface">Pathology Findings & Prescriptions</h2>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Real-time diagnosis cross-referenced against PayPal recurring billing records and Google SSO telemetry.</p>
          </div>
          <span class="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-badge text-[11px] uppercase font-bold brutal-border border-[1.5px]">
            5 Incurred Anomalies
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b-[2px] border-surface-container-highest font-label-code text-body-sm text-on-surface-variant">
                <th class="py-3 px-4">Tool / Vendor</th>
                <th class="py-3 px-4">Severity</th>
                <th class="py-3 px-4">Diagnostic Symptom</th>
                <th class="py-3 px-4">Bleed Rate</th>
                <th class="py-3 px-4">Doctor's Prescription</th>
                <th class="py-3 px-4 text-right">Treatment</th>
              </tr>
            </thead>
            <tbody class="divide-y-[2px] divide-surface-container-high font-body-md text-on-surface">
              <!-- Row 1 -->
              <tr class="hover:bg-surface-container-low transition-colors">
                <td class="py-4 px-4 flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-surface-container-highest flex items-center justify-center font-bold brutal-border border-[2px]">L</div>
                  <div>
                    <span class="font-headline-sm text-body-lg font-bold block">Loom Enterprise</span>
                    <span class="font-label-code text-[11px] text-outline">Video Messaging</span>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <span class="px-2.5 py-0.5 rounded-full bg-error text-on-error font-label-badge text-[10px] font-bold uppercase brutal-border border-[1.5px]">CRITICAL</span>
                </td>
                <td class="py-4 px-4">
                  <span class="font-body-sm text-body-sm font-semibold text-error">9 Zombie Accounts</span>
                  <p class="font-body-sm text-[12px] text-on-surface-variant">Ex-contractors with active billing; 0 videos created in 90d.</p>
                </td>
                <td class="py-4 px-4 font-label-code font-bold text-on-surface">₹14,500/mo</td>
                <td class="py-4 px-4">
                  <span class="font-body-sm text-[13px] font-bold text-tertiary-container block">Revoke 9 phantom seats immediately</span>
                  <span class="text-outline text-[11px]">Consolidate to Slack Huddles for quick recording</span>
                </td>
                <td class="py-4 px-4 text-right">
                  <button class="px-3.5 py-1.5 rounded-full bg-primary-container text-on-primary font-headline-sm text-body-sm font-bold brutal-border border-[2px] brutal-shadow-sm brutal-btn" onclick="alert('Loom seats revoked via API')">Revoke Seats</button>
                </td>
              </tr>

              <!-- Row 2 -->
              <tr class="hover:bg-surface-container-low transition-colors">
                <td class="py-4 px-4 flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-surface-container-highest flex items-center justify-center font-bold brutal-border border-[2px]">N</div>
                  <div>
                    <span class="font-headline-sm text-body-lg font-bold block">Notion AI Addon</span>
                    <span class="font-label-code text-[11px] text-outline">Productivity</span>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <span class="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-badge text-[10px] font-bold uppercase brutal-border border-[1.5px]">HIGH</span>
                </td>
                <td class="py-4 px-4">
                  <span class="font-body-sm text-body-sm font-semibold text-primary">Overlapping Capability</span>
                  <p class="font-body-sm text-[12px] text-on-surface-variant">Team already has ChatGPT Enterprise + GitHub Copilot.</p>
                </td>
                <td class="py-4 px-4 font-label-code font-bold text-on-surface">₹12,600/mo</td>
                <td class="py-4 px-4">
                  <span class="font-body-sm text-[13px] font-bold text-tertiary-container block">Prune Notion AI bundle</span>
                  <span class="text-outline text-[11px]">Keep core Notion workspace plan</span>
                </td>
                <td class="py-4 px-4 text-right">
                  <button class="px-3.5 py-1.5 rounded-full bg-surface-container-lowest text-on-surface font-headline-sm text-body-sm font-bold brutal-border border-[2px] brutal-shadow-sm brutal-btn hover:bg-surface-container" onclick="alert('Notion AI addon pruned')">Prune Addon</button>
                </td>
              </tr>

              <!-- Row 3 -->
              <tr class="hover:bg-surface-container-low transition-colors">
                <td class="py-4 px-4 flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-surface-container-highest flex items-center justify-center font-bold brutal-border border-[2px]">A</div>
                  <div>
                    <span class="font-headline-sm text-body-lg font-bold block">Asana Business</span>
                    <span class="font-label-code text-[11px] text-outline">Project Management</span>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <span class="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-badge text-[10px] font-bold uppercase brutal-border border-[1.5px]">HIGH</span>
                </td>
                <td class="py-4 px-4">
                  <span class="font-body-sm text-body-sm font-semibold text-primary">Duplicate Tool Stack</span>
                  <p class="font-body-sm text-[12px] text-on-surface-variant">Engineering uses Linear exclusively; only 4 active users on Asana.</p>
                </td>
                <td class="py-4 px-4 font-label-code font-bold text-on-surface">₹19,200/mo</td>
                <td class="py-4 px-4">
                  <span class="font-body-sm text-[13px] font-bold text-tertiary-container block">Migrate 4 users to Linear Free</span>
                  <span class="text-outline text-[11px]">Cancel entire Asana subscription upon next cycle</span>
                </td>
                <td class="py-4 px-4 text-right">
                  <button class="px-3.5 py-1.5 rounded-full bg-primary-container text-on-primary font-headline-sm text-body-sm font-bold brutal-border border-[2px] brutal-shadow-sm brutal-btn" onclick="alert('Migration plan scheduled')">Initiate Cancel</button>
                </td>
              </tr>

              <!-- Row 4 -->
              <tr class="hover:bg-surface-container-low transition-colors">
                <td class="py-4 px-4 flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-surface-container-highest flex items-center justify-center font-bold brutal-border border-[2px]">Z</div>
                  <div>
                    <span class="font-headline-sm text-body-lg font-bold block">Zoom Enterprise</span>
                    <span class="font-label-code text-[11px] text-outline">Conferencing</span>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <span class="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface font-label-badge text-[10px] font-bold uppercase brutal-border border-[1.5px]">MODERATE</span>
                </td>
                <td class="py-4 px-4">
                  <span class="font-body-sm text-body-sm font-semibold text-on-surface">Tier Over-provisioning</span>
                  <p class="font-body-sm text-[12px] text-on-surface-variant">Paying for 500-attendee webinars; avg company meeting is 6 people.</p>
                </td>
                <td class="py-4 px-4 font-label-code font-bold text-on-surface">₹16,000/mo</td>
                <td class="py-4 px-4">
                  <span class="font-body-sm text-[13px] font-bold text-tertiary-container block">Downgrade tier to Zoom Pro</span>
                  <span class="text-outline text-[11px]">Saves 45% with identical core functionality</span>
                </td>
                <td class="py-4 px-4 text-right">
                  <button class="px-3.5 py-1.5 rounded-full bg-surface-container-lowest text-on-surface font-headline-sm text-body-sm font-bold brutal-border border-[2px] brutal-shadow-sm brutal-btn hover:bg-surface-container" onclick="alert('Downgrade request queued')">Downgrade</button>
                </td>
              </tr>

              <!-- Row 5 -->
              <tr class="hover:bg-surface-container-low transition-colors">
                <td class="py-4 px-4 flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-surface-container-highest flex items-center justify-center font-bold brutal-border border-[2px]">M</div>
                  <div>
                    <span class="font-headline-sm text-body-lg font-bold block">Miro Enterprise</span>
                    <span class="font-label-code text-[11px] text-outline">Whiteboarding</span>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <span class="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface font-label-badge text-[10px] font-bold uppercase brutal-border border-[1.5px]">MODERATE</span>
                </td>
                <td class="py-4 px-4">
                  <span class="font-body-sm text-body-sm font-semibold text-on-surface">Tool Overlap with FigJam</span>
                  <p class="font-body-sm text-[12px] text-on-surface-variant">Design team active in FigJam; Miro boards abandoned since February.</p>
                </td>
                <td class="py-4 px-4 font-label-code font-bold text-on-surface">₹11,700/mo</td>
                <td class="py-4 px-4">
                  <span class="font-body-sm text-[13px] font-bold text-tertiary-container block">Retire Miro & standardize on FigJam</span>
                  <span class="text-outline text-[11px]">Free export available to FigJam format</span>
                </td>
                <td class="py-4 px-4 text-right">
                  <button class="px-3.5 py-1.5 rounded-full bg-primary-container text-on-primary font-headline-sm text-body-sm font-bold brutal-border border-[2px] brutal-shadow-sm brutal-btn" onclick="alert('Retirement workflow triggered')">Retire Miro</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Side-by-Side Redundancy Inspection Card -->
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        <div class="bg-surface-container-lowest p-space-lg rounded-2xl brutal-border brutal-shadow flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <span class="font-label-badge text-label-badge uppercase tracking-wider text-outline">Overlap Case #1</span>
            <span class="px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container font-label-code text-[11px] font-bold brutal-border border-[1px]">Duplicate Cost: ₹23,500/mo</span>
          </div>
          <h3 class="font-headline-sm text-headline-sm text-on-surface">Linear vs Asana vs Jira</h3>
          <p class="font-body-sm text-body-sm text-on-surface-variant">Your company pays for 3 distinct issue tracking systems across 3 different departments. 82% of tickets are on Linear, while Asana and Jira only hold archive tasks.</p>
          <div class="p-4 rounded-xl bg-surface-container-low brutal-border border-[2px] flex flex-col gap-2">
            <span class="font-label-code text-[12px] font-bold text-primary">Doctor Recommendation:</span>
            <span class="font-body-md text-on-surface">Consolidate all project management into Linear. Close Jira Enterprise and Asana seats to free up ₹2,82,000 annually.</span>
          </div>
        </div>

        <div class="bg-surface-container-lowest p-space-lg rounded-2xl brutal-border brutal-shadow flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <span class="font-label-badge text-label-badge uppercase tracking-wider text-outline">Overlap Case #2</span>
            <span class="px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container font-label-code text-[11px] font-bold brutal-border border-[1px]">Duplicate Cost: ₹18,200/mo</span>
          </div>
          <h3 class="font-headline-sm text-headline-sm text-on-surface">Loom vs Zoom Clips vs Slack Huddles</h3>
          <p class="font-body-sm text-body-sm text-on-surface-variant">Your team has full enterprise video sharing capabilities inside your existing Slack and Zoom subscriptions, making separate Loom seats 100% redundant.</p>
          <div class="p-4 rounded-xl bg-surface-container-low brutal-border border-[2px] flex flex-col gap-2">
            <span class="font-label-code text-[12px] font-bold text-primary">Doctor Recommendation:</span>
            <span class="font-body-md text-on-surface">Switch to built-in Slack canvas and Loom alternative inside Slack. Reclaim ₹2,18,400 per year with zero friction.</span>
          </div>
        </div>
      </section>

    </div>
  </div>
</main>
</div>
</body>
</html>'''

with open('frontend/doctor.html', 'w', encoding='utf-8') as f:
    f.write(doctor_content)

# =========================================================================
# 2. CREATE ANALYTICS.HTML (Business Analytics)
# =========================================================================
analytics_sidebar = get_sidebar_html('analytics')

analytics_content = f'''<!DOCTYPE html>
<html lang="en">
{head_html}
<body class="bg-background font-body-md text-on-surface antialiased">
{analytics_sidebar}
<div class="pl-[260px]">
{header_html}
<main class="relative pt-16 bg-background min-h-screen">
  <div class="flex flex-col w-full">
    <div class="p-space-lg lg:p-space-xl flex flex-col gap-space-lg w-full max-w-[1600px] mx-auto">

      <!-- Header Section -->
      <section class="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div>
          <div class="flex items-center gap-space-xs flex-wrap">
            <span class="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-badge text-label-badge uppercase tracking-wider brutal-border border-[2px] -rotate-1">
              Financial Telemetry
            </span>
            <span class="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-code text-[11px] font-bold brutal-border border-[2px]">
              PAYPAL TRANSACTION STREAM ACTIVE
            </span>
          </div>
          <h1 class="font-headline-lg text-headline-lg text-on-surface mt-1">📊 Business Analytics</h1>
          <p class="font-body-lg text-body-lg text-on-surface-variant">Granular SaaS burn velocity, departmental cost centers, and runway forecasting.</p>
        </div>

        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1 p-1 rounded-xl bg-surface-container-high brutal-border border-[2px]">
            <button class="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-headline-sm text-body-sm font-bold brutal-border border-[2px] brutal-shadow-sm">Monthly</button>
            <button class="px-3 py-1.5 rounded-lg text-on-surface-variant font-headline-sm text-body-sm hover:text-on-surface">Quarterly</button>
            <button class="px-3 py-1.5 rounded-lg text-on-surface-variant font-headline-sm text-body-sm hover:text-on-surface">Annual (FY25)</button>
          </div>
        </div>
      </section>

      <!-- KPI Ribbon (4 Metrics) -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div class="bg-surface-container-lowest p-space-md rounded-2xl brutal-border brutal-shadow flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="font-label-badge text-label-badge uppercase text-outline">Net Monthly SaaS Burn</span>
            <span class="p-1.5 rounded-lg bg-surface-container brutal-border border-[2px]">
              <span class="material-symbols-outlined text-[18px] text-primary">price_change</span>
            </span>
          </div>
          <div class="my-3">
            <div class="font-data-metric text-data-metric text-on-surface font-bold">₹4,12,500</div>
            <div class="font-label-code text-body-sm text-outline">Avg ₹10,855 per seat</div>
          </div>
          <div class="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-badge text-body-sm font-bold brutal-border border-[1.5px]">
            -3.2% vs last quarter
          </div>
        </div>

        <div class="bg-surface-container-lowest p-space-md rounded-2xl brutal-border brutal-shadow flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="font-label-badge text-label-badge uppercase text-outline">SaaS as % of Total OpEx</span>
            <span class="p-1.5 rounded-lg bg-surface-container brutal-border border-[2px]">
              <span class="material-symbols-outlined text-[18px] text-secondary">pie_chart</span>
            </span>
          </div>
          <div class="my-3">
            <div class="font-data-metric text-data-metric text-on-surface font-bold">16.4%</div>
            <div class="font-label-code text-body-sm text-outline">Target benchmark: &lt; 18.0%</div>
          </div>
          <div class="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-badge text-body-sm font-bold brutal-border border-[1.5px]">
            Within Safe Zone
          </div>
        </div>

        <div class="bg-surface-container-lowest p-space-md rounded-2xl brutal-border brutal-shadow flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="font-label-badge text-label-badge uppercase text-outline">Runway Extended</span>
            <span class="p-1.5 rounded-lg bg-tertiary-fixed brutal-border border-[2px]">
              <span class="material-symbols-outlined text-[18px] text-tertiary-container">flight_takeoff</span>
            </span>
          </div>
          <div class="my-3">
            <div class="font-data-metric text-data-metric text-tertiary-container font-bold">+2.8 Months</div>
            <div class="font-label-code text-body-sm text-outline">From ₹98.4k annual savings</div>
          </div>
          <div class="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-badge text-body-sm font-bold brutal-border border-[1.5px]">
            Total Runway: 18.4 Mo
          </div>
        </div>

        <div class="bg-surface-container-lowest p-space-md rounded-2xl brutal-border brutal-shadow flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="font-label-badge text-label-badge uppercase text-outline">PayPal Daily Velocity</span>
            <span class="p-1.5 rounded-lg bg-surface-container brutal-border border-[2px]">
              <span class="material-symbols-outlined text-[18px] text-secondary">speed</span>
            </span>
          </div>
          <div class="my-3">
            <div class="font-data-metric text-data-metric text-on-surface font-bold">₹13,750 / d</div>
            <div class="font-label-code text-body-sm text-outline">Rolling 30-day billing pulse</div>
          </div>
          <div class="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-badge text-body-sm font-bold brutal-border border-[1.5px]">
            API Synced (Zero Lag)
          </div>
        </div>
      </section>

      <!-- Departmental Cost Attribution Breakdown -->
      <section class="bg-surface-container-lowest rounded-2xl brutal-border brutal-shadow p-space-lg flex flex-col gap-space-md">
        <div class="flex items-center justify-between flex-wrap gap-2 pb-space-sm brutal-border border-b-[3px] border-t-0 border-l-0 border-r-0">
          <div>
            <h2 class="font-headline-sm text-headline-sm text-on-surface">Departmental Cost Attribution & Waste</h2>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Breakdown of software allocation, license utilization, and potential reclaim by business unit.</p>
          </div>
          <span class="font-label-code text-[12px] text-outline">4 Active Cost Centers</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
          <!-- Dept 1 -->
          <div class="p-4 rounded-xl bg-surface-container-low brutal-border border-[2px] flex flex-col justify-between gap-3">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="font-headline-sm text-body-lg font-bold text-on-surface">Engineering</span>
                <span class="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-code text-[11px] font-bold">42%</span>
              </div>
              <div class="font-data-metric text-headline-sm font-bold text-on-surface">₹1,73,250 <span class="text-body-sm font-normal text-outline">/ mo</span></div>
              <div class="mt-2 space-y-1">
                <div class="flex justify-between text-[11px] font-label-code text-on-surface-variant">
                  <span>Capacity Utilization:</span>
                  <span class="font-bold text-on-surface">88%</span>
                </div>
                <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden brutal-border border-[1px]">
                  <div class="bg-primary-container h-full w-[88%]"></div>
                </div>
              </div>
            </div>
            <div class="pt-2 border-t-[1.5px] border-surface-container-highest flex justify-between items-center text-[12px]">
              <span class="text-on-surface-variant font-body-sm">Reclaimable:</span>
              <span class="font-bold font-label-code text-tertiary-container">₹34,000 / mo</span>
            </div>
          </div>

          <!-- Dept 2 -->
          <div class="p-4 rounded-xl bg-surface-container-low brutal-border border-[2px] flex flex-col justify-between gap-3">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="font-headline-sm text-body-lg font-bold text-on-surface">Sales & CRM</span>
                <span class="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-code text-[11px] font-bold">25%</span>
              </div>
              <div class="font-data-metric text-headline-sm font-bold text-on-surface">₹1,03,125 <span class="text-body-sm font-normal text-outline">/ mo</span></div>
              <div class="mt-2 space-y-1">
                <div class="flex justify-between text-[11px] font-label-code text-on-surface-variant">
                  <span>Capacity Utilization:</span>
                  <span class="font-bold text-on-surface">74%</span>
                </div>
                <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden brutal-border border-[1px]">
                  <div class="bg-secondary h-full w-[74%]"></div>
                </div>
              </div>
            </div>
            <div class="pt-2 border-t-[1.5px] border-surface-container-highest flex justify-between items-center text-[12px]">
              <span class="text-on-surface-variant font-body-sm">Reclaimable:</span>
              <span class="font-bold font-label-code text-tertiary-container">₹22,500 / mo</span>
            </div>
          </div>

          <!-- Dept 3 -->
          <div class="p-4 rounded-xl bg-surface-container-low brutal-border border-[2px] flex flex-col justify-between gap-3">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="font-headline-sm text-body-lg font-bold text-on-surface">Product & Design</span>
                <span class="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-code text-[11px] font-bold">18%</span>
              </div>
              <div class="font-data-metric text-headline-sm font-bold text-on-surface">₹74,250 <span class="text-body-sm font-normal text-outline">/ mo</span></div>
              <div class="mt-2 space-y-1">
                <div class="flex justify-between text-[11px] font-label-code text-on-surface-variant">
                  <span>Capacity Utilization:</span>
                  <span class="font-bold text-on-surface">62%</span>
                </div>
                <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden brutal-border border-[1px]">
                  <div class="bg-error h-full w-[62%]"></div>
                </div>
              </div>
            </div>
            <div class="pt-2 border-t-[1.5px] border-surface-container-highest flex justify-between items-center text-[12px]">
              <span class="text-on-surface-variant font-body-sm">Reclaimable:</span>
              <span class="font-bold font-label-code text-tertiary-container">₹11,500 / mo</span>
            </div>
          </div>

          <!-- Dept 4 -->
          <div class="p-4 rounded-xl bg-surface-container-low brutal-border border-[2px] flex flex-col justify-between gap-3">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="font-headline-sm text-body-lg font-bold text-on-surface">Operations</span>
                <span class="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-code text-[11px] font-bold">15%</span>
              </div>
              <div class="font-data-metric text-headline-sm font-bold text-on-surface">₹61,875 <span class="text-body-sm font-normal text-outline">/ mo</span></div>
              <div class="mt-2 space-y-1">
                <div class="flex justify-between text-[11px] font-label-code text-on-surface-variant">
                  <span>Capacity Utilization:</span>
                  <span class="font-bold text-on-surface">91%</span>
                </div>
                <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden brutal-border border-[1px]">
                  <div class="bg-tertiary-container h-full w-[91%]"></div>
                </div>
              </div>
            </div>
            <div class="pt-2 border-t-[1.5px] border-surface-container-highest flex justify-between items-center text-[12px]">
              <span class="text-on-surface-variant font-body-sm">Reclaimable:</span>
              <span class="font-bold font-label-code text-tertiary-container">₹6,000 / mo</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Spend Velocity vs Optimization SVG Chart -->
      <section class="bg-surface-container-lowest rounded-2xl brutal-border brutal-shadow p-space-lg flex flex-col gap-space-md">
        <div class="flex items-center justify-between flex-wrap gap-2 pb-space-sm brutal-border border-b-[3px] border-t-0 border-l-0 border-r-0">
          <div>
            <h2 class="font-headline-sm text-headline-sm text-on-surface">12-Month SaaS Burn Velocity (Actual vs Optimized)</h2>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Comparison between unmanaged SaaS baseline projection vs autonomous SpendPilot AI optimization trajectory.</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="flex items-center gap-1 text-[12px] font-label-code"><span class="w-3 h-3 rounded-full bg-error inline-block"></span> Unmanaged Baseline</span>
            <span class="flex items-center gap-1 text-[12px] font-label-code"><span class="w-3 h-3 rounded-full bg-primary-container inline-block"></span> Actual Spend</span>
            <span class="flex items-center gap-1 text-[12px] font-label-code"><span class="w-3 h-3 rounded-full bg-tertiary-container inline-block"></span> AI Optimized Target</span>
          </div>
        </div>

        <div class="w-full bg-background rounded-xl p-5 brutal-border border-[2px]">
          <svg class="w-full h-64" fill="none" viewBox="0 0 900 220">
            <!-- Grid Lines -->
            <line stroke="#E4E1E6" stroke-dasharray="4 4" stroke-width="1.5" x1="40" x2="880" y1="30" y2="30"></line>
            <line stroke="#E4E1E6" stroke-dasharray="4 4" stroke-width="1.5" x1="40" x2="880" y1="80" y2="80"></line>
            <line stroke="#E4E1E6" stroke-dasharray="4 4" stroke-width="1.5" x1="40" x2="880" y1="130" y2="130"></line>
            <line stroke="#E4E1E6" stroke-dasharray="4 4" stroke-width="1.5" x1="40" x2="880" y1="180" y2="180"></line>
            <line stroke="#18181B" stroke-width="2.5" x1="40" x2="880" y1="200" y2="200"></line>

            <!-- Unmanaged Curve (Red dashed) -->
            <path d="M 60 160 Q 250 140 450 110 T 860 40" stroke="#BA1A1A" stroke-width="3" stroke-dasharray="6 6" fill="none"></path>

            <!-- Actual Spend (Purple solid) -->
            <path d="M 60 160 Q 250 150 450 135 T 580 130" stroke="#5B21B6" stroke-width="3.5" fill="none"></path>

            <!-- Projected Optimized (Green solid) -->
            <path d="M 580 130 Q 720 150 860 170" stroke="#10B981" stroke-width="3.5" stroke-dasharray="4 4" fill="none"></path>

            <!-- Month Markers -->
            <text x="60" y="215" fill="#4A4453" font-family="JetBrains Mono" font-size="11" font-weight="600" text-anchor="middle">OCT</text>
            <text x="160" y="215" fill="#4A4453" font-family="JetBrains Mono" font-size="11" font-weight="600" text-anchor="middle">NOV</text>
            <text x="260" y="215" fill="#4A4453" font-family="JetBrains Mono" font-size="11" font-weight="600" text-anchor="middle">DEC</text>
            <text x="360" y="215" fill="#4A4453" font-family="JetBrains Mono" font-size="11" font-weight="600" text-anchor="middle">JAN</text>
            <text x="460" y="215" fill="#4A4453" font-family="JetBrains Mono" font-size="11" font-weight="600" text-anchor="middle">FEB</text>
            <text x="560" y="215" fill="#4A4453" font-family="JetBrains Mono" font-size="11" font-weight="600" text-anchor="middle">MAR (NOW)</text>
            <text x="660" y="215" fill="#4A4453" font-family="JetBrains Mono" font-size="11" font-weight="600" text-anchor="middle">APR</text>
            <text x="760" y="215" fill="#4A4453" font-family="JetBrains Mono" font-size="11" font-weight="600" text-anchor="middle">MAY</text>
            <text x="860" y="215" fill="#4A4453" font-family="JetBrains Mono" font-size="11" font-weight="600" text-anchor="middle">JUN</text>
          </svg>
        </div>
      </section>

    </div>
  </div>
</main>
</div>
</body>
</html>'''

with open('frontend/analytics.html', 'w', encoding='utf-8') as f:
    f.write(analytics_content)

# =========================================================================
# 3. CREATE NEGOTIATOR.HTML (Dedicated Standalone AI Negotiator Page)
# =========================================================================
negotiator_sidebar = get_sidebar_html('negotiator')

negotiator_content = f'''<!DOCTYPE html>
<html lang="en">
{head_html}
<body class="bg-background font-body-md text-on-surface antialiased">
{negotiator_sidebar}
<div class="pl-[260px]">
{header_html}
<main class="relative pt-16 bg-background min-h-screen">
  <div class="flex flex-col w-full">
    <div class="p-space-lg lg:p-space-xl flex flex-col gap-space-lg w-full max-w-[1600px] mx-auto">

      <!-- Header Section -->
      <section class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-headline-lg text-headline-lg text-on-surface">🤖 AI Vendor Contract Negotiator</h1>
            <span class="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-badge text-label-badge uppercase tracking-wider brutal-border border-[2px]">Autonomous Agent</span>
          </div>
          <p class="font-body-md text-body-md text-on-surface-variant">Live contract benchmarking against 12,000+ anonymous B2B SaaS invoices & AI-driven counter offers.</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-label-code text-body-sm text-on-surface-variant">Negotiator Status:</span>
          <span class="px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-headline-sm text-body-sm brutal-border border-[2px] flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-tertiary-container animate-pulse"></span> Ready to Dispatch
          </span>
        </div>
      </section>

      <!-- Split Card Layout -->
      <section class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <!-- Left Intelligence Column (5 cols) -->
        <div class="xl:col-span-5 rounded-3xl bg-surface-container-lowest p-6 brutal-border border-[3px] brutal-shadow space-y-6">
          <div class="space-y-3">
            <label class="font-label-code text-body-sm uppercase tracking-wider text-on-surface-variant font-bold block">Selected Vendor Contract</label>
            <div class="relative">
              <select id="vendorSelect" class="w-full appearance-none p-3.5 pr-10 rounded-2xl bg-surface-container-low font-headline-sm text-body-md text-on-surface brutal-border border-[2px] outline-none cursor-pointer">
                <option selected>Salesforce Enterprise Renewal (45 Days Remaining)</option>
                <option>AWS Enterprise Support & EC2 Commit (60 Days)</option>
                <option>Datadog Pro Annual Ingestion Tier (18 Days)</option>
                <option>HubSpot Marketing Hub Enterprise (90 Days)</option>
              </select>
              <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface">expand_more</span>
            </div>
          </div>

          <!-- Contract Profile Pill Grid -->
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3.5 rounded-2xl bg-surface-container-low brutal-border border-[2px]">
              <span class="font-label-code text-[11px] text-on-surface-variant uppercase">Current Annual Spend</span>
              <div class="font-data-metric text-title-md font-bold text-on-surface mt-0.5">₹18,50,000</div>
            </div>
            <div class="p-3.5 rounded-2xl bg-surface-container-low brutal-border border-[2px]">
              <span class="font-label-code text-[11px] text-on-surface-variant uppercase">Target Counter Offer</span>
              <div class="font-data-metric text-title-md font-bold text-tertiary-container mt-0.5">₹14,20,000</div>
            </div>
            <div class="p-3.5 rounded-2xl bg-surface-container-low brutal-border border-[2px]">
              <span class="font-label-code text-[11px] text-on-surface-variant uppercase">Market Benchmark</span>
              <div class="font-body-sm text-body-sm font-bold text-error mt-0.5">23% Overpaying</div>
            </div>
            <div class="p-3.5 rounded-2xl bg-surface-container-low brutal-border border-[2px]">
              <span class="font-label-code text-[11px] text-on-surface-variant uppercase">Potential Reclaim</span>
              <div class="font-body-sm text-body-sm font-bold text-tertiary-container mt-0.5">₹4,30,000 / yr</div>
            </div>
          </div>

          <!-- Negotiation Strategy & Tone -->
          <div class="space-y-3">
            <label class="font-label-code text-body-sm uppercase tracking-wider text-on-surface-variant font-bold block">Negotiation Tone & Leverage Angle</label>
            <div class="grid grid-cols-3 gap-2">
              <button class="py-2.5 px-3 rounded-xl bg-primary-container text-on-primary font-headline-sm text-body-sm font-bold brutal-border border-[2px] brutal-shadow-sm flex items-center justify-center gap-1" type="button">
                <span>Data-Driven</span>
              </button>
              <button class="py-2.5 px-3 rounded-xl bg-surface-container-low text-on-surface font-headline-sm text-body-sm font-bold brutal-border border-[2px] hover:bg-surface-container flex items-center justify-center gap-1" type="button">
                <span>Polite Partner</span>
              </button>
              <button class="py-2.5 px-3 rounded-xl bg-surface-container-low text-on-surface font-headline-sm text-body-sm font-bold brutal-border border-[2px] hover:bg-surface-container flex items-center justify-center gap-1" type="button">
                <span>Aggressive</span>
              </button>
            </div>
          </div>

          <!-- Leverage Points Detected by AI -->
          <div class="space-y-2">
            <span class="font-label-code text-body-sm uppercase tracking-wider text-on-surface-variant font-bold block">Discovered Leverage Points:</span>
            <div class="p-3 rounded-xl bg-surface-container-low brutal-border border-[1.5px] flex items-center gap-2 text-body-sm">
              <span class="material-symbols-outlined text-tertiary-container text-[18px]">verified</span>
              <span>18 licenses inactive past 60 days (License under-utilization).</span>
            </div>
            <div class="p-3 rounded-xl bg-surface-container-low brutal-border border-[1.5px] flex items-center gap-2 text-body-sm">
              <span class="material-symbols-outlined text-tertiary-container text-[18px]">verified</span>
              <span>Competitor HubSpot quote is 28% lower for comparable enterprise seats.</span>
            </div>
          </div>

          <button class="w-full py-3.5 px-4 rounded-full bg-primary text-on-primary font-headline-sm text-body-md font-bold brutal-border border-[3px] brutal-shadow brutal-btn hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2" onclick="alert('Regenerating AI Counter-Proposal Draft with real market benchmarks...')">
            <span class="material-symbols-outlined text-[20px]">auto_awesome</span>
            <span>Regenerate AI Counter-Offer</span>
          </button>
        </div>

        <!-- Right Generated Email Drafter (7 cols) -->
        <div class="xl:col-span-7 rounded-3xl bg-surface-container-lowest p-6 brutal-border border-[3px] brutal-shadow space-y-4">
          <div class="flex items-center justify-between pb-3 border-b-[2px] border-surface-container-highest">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[20px] text-primary">mail</span>
              <span class="font-headline-sm text-body-lg font-bold text-on-surface">Generated Counter-Proposal Draft</span>
            </div>
            <div class="flex items-center gap-2">
              <button class="px-3 py-1 rounded-full bg-surface-container-low text-on-surface font-label-code text-body-sm font-bold brutal-border border-[1.5px] hover:bg-surface-container" onclick="navigator.clipboard.writeText(document.getElementById('emailBody').innerText); alert('Draft copied to clipboard!')">Copy Draft</button>
              <button class="px-4 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-headline-sm text-body-sm font-bold brutal-border border-[1.5px] hover:bg-tertiary-fixed-dim" onclick="alert('Email dispatched via SendPilot AI executive mailer!')">Send via AI</button>
            </div>
          </div>

          <div id="emailBody" class="p-5 rounded-2xl bg-surface-container-low font-body-md text-on-surface space-y-4 brutal-border border-[2px] text-[14px] leading-relaxed">
            <p><strong>To:</strong> enterprise-renewals@salesforce.com<br><strong>Subject:</strong> Acme Technologies — Contract Renewal & License Tier Adjustment (Account: #ACME-9021)</p>
            <p>Hi Sarah and the Salesforce Renewals Team,</p>
            <p>As we approach our annual renewal for Acme Technologies (Series B), our finance team and AI CFO audit reviewed our active utilization telemetry across our 85 Salesforce Enterprise seats.</p>
            <p>Over the last three quarters, 18 allocated seats have recorded zero activity, and our active sales team size has stabilized. Based on our cohort benchmarks and competing proposals from modern CRM providers offering identical enterprise sync capabilities at ₹13,50,000/yr, our board has authorized a maximum renewal cap of <strong>₹14,20,000/yr</strong> for a 2-year locked commitment.</p>
            <p>We value our relationship with Salesforce and would prefer to avoid a costly migration. Can we adjust our active tier to 65 seats at the revised rate to finalize this contract before our cutoff date next Friday?</p>
            <p>Best regards,<br><strong>Alex Rivera</strong><br>CFO, Acme Technologies</p>
          </div>

          <div class="p-3 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-between font-label-code text-[12px] font-bold brutal-border border-[1.5px]">
            <span class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px]">verified</span>
              Projected Vendor Concession Likelihood: 84%
            </span>
            <span>Historical Savings: ₹3,80,000 avg</span>
          </div>
        </div>
      </section>

    </div>
  </div>
</main>
</div>
</body>
</html>'''

with open('frontend/negotiator.html', 'w', encoding='utf-8') as f:
    f.write(negotiator_content)

print("Missing pages (doctor.html, analytics.html, negotiator.html) created successfully!")

