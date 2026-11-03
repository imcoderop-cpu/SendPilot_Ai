import json
import os
import random
from datetime import datetime, timedelta

os.makedirs('data', exist_ok=True)

# Set seed for determinism
random.seed(42)

# =========================================================================
# 1. DEPARTMENTS SETUP (Total 250 employees across 9 departments)
# =========================================================================
DEPARTMENTS_CONFIG = [
    {"name": "Engineering", "code": "ENG", "headcount": 95, "budget": 240000},
    {"name": "Product", "code": "PROD", "headcount": 28, "budget": 75000},
    {"name": "Design", "code": "DES", "headcount": 18, "budget": 50000},
    {"name": "Marketing", "code": "MKT", "headcount": 32, "budget": 80000},
    {"name": "Sales", "code": "SALES", "headcount": 35, "budget": 95000},
    {"name": "Operations", "code": "OPS", "headcount": 16, "budget": 40000},
    {"name": "HR & People", "code": "HR", "headcount": 10, "budget": 30000},
    {"name": "Finance", "code": "FIN", "headcount": 8, "budget": 30000},
    {"name": "Customer Support", "code": "SUPP", "headcount": 8, "budget": 30000}
]

# Total headcount: 95+28+18+32+35+16+10+8+8 = 250

# =========================================================================
# 2. 65 REALISTIC SUBSCRIPTIONS MASTER DEFINITIONS
# =========================================================================
SUBS_CATALOG = [
    # Engineering (20 tools)
    ("sub_01", "GitHub Enterprise", "GitHub Inc", "DevOps & SCM", "Engineering", 38000, "yearly", "Enterprise Cloud", 95, 82, 13, "moderate", "Remove 13 inactive seats from dev contractors", 5200),
    ("sub_02", "GitHub Copilot Business", "GitHub Inc", "AI Code Assistant", "Engineering", 22000, "monthly", "Copilot Business", 90, 88, 2, "low", "Healthy utilization across all active software engineers", 0),
    ("sub_03", "AWS Cloud Infrastructure", "Amazon Web Services", "Cloud Computing", "Engineering", 82000, "monthly", "Enterprise Support + Reserved", 1, 1, 0, "moderate", "Prune 4 abandoned staging EC2 instances & test RDS clusters", 14500),
    ("sub_04", "MongoDB Atlas", "MongoDB Inc", "Cloud Database", "Engineering", 28500, "monthly", "Dedicated Cluster M30", 1, 1, 0, "low", "Cluster autoscaling enabled; optimal database sizing", 0),
    ("sub_05", "Cloudflare Enterprise", "Cloudflare Inc", "CDN & Security", "Engineering", 19500, "monthly", "Business Pro Shield", 1, 1, 0, "low", "WAF and DDoS telemetry running at 99.9% uptime", 0),
    ("sub_06", "Vercel Pro Team", "Vercel Inc", "Frontend Cloud", "Engineering", 12500, "monthly", "Pro Team Tier", 35, 24, 11, "high", "Consolidate 11 inactive viewer seats to free tier", 3850),
    ("sub_07", "Supabase Team Plan", "Supabase Inc", "Backend as a Service", "Engineering", 9500, "monthly", "Team Tier Pro", 1, 1, 0, "low", "Realtime auth and PostgreSQL db healthy", 0),
    ("sub_08", "Datadog APM & Logs", "Datadog Inc", "Telemetry & Observability", "Engineering", 34000, "monthly", "Pro Ingestion Tier", 1, 1, 0, "critical", "Excess log indexing in dev environments overpaying by 25%", 8500),
    ("sub_09", "Sentry.io Business", "Functional Software", "Error Tracking", "Engineering", 7800, "monthly", "Business Tier", 60, 56, 4, "low", "Full error capture coverage with zero dropped events", 0),
    ("sub_10", "Postman Enterprise", "Postman Inc", "API Platform", "Engineering", 14200, "yearly", "Enterprise API Platform", 50, 36, 14, "high", "Downgrade 14 non-dev seats to free community viewer", 3950),
    ("sub_11", "Docker Business", "Docker Inc", "Containerization", "Engineering", 11200, "yearly", "Business Fleet", 75, 71, 4, "low", "Container registry security and fleet management optimal", 0),
    ("sub_12", "HashiCorp Terraform Cloud", "HashiCorp", "Infrastructure as Code", "Engineering", 8900, "monthly", "Standard Team", 25, 20, 5, "low", "State storage and automated drift detection active", 0),
    ("sub_13", "CircleCI Performance", "CircleCI", "Continuous Integration", "Engineering", 13500, "monthly", "Performance Scale", 1, 1, 0, "low", "Build concurrency optimal with 4.2 min avg pipeline", 0),
    ("sub_14", "JetBrains All Products Pack", "JetBrains s.r.o.", "Developer IDEs", "Engineering", 16800, "yearly", "Organization Pack", 40, 29, 11, "high", "Migrate 11 engineers using VS Code to free licenses", 4600),
    ("sub_15", "Cursor AI Pro Team", "Anysphere Inc", "AI Code Editor", "Engineering", 15400, "monthly", "Pro Business", 70, 68, 2, "low", "High engineering satisfaction and 32% code velocity lift", 0),
    ("sub_16", "OpenAI API Platform", "OpenAI Inc", "AI Foundation Models", "Engineering", 42000, "monthly", "Usage Tier 4 Dedicated", 1, 1, 0, "moderate", "Implement prompt token caching to trim monthly inference spend", 6800),
    ("sub_17", "Anthropic Claude Team", "Anthropic PBC", "AI Model Access", "Engineering", 18500, "monthly", "Enterprise Team", 30, 28, 2, "low", "Key R&D tool for architecture reviews and refactoring", 0),
    ("sub_18", "Redis Cloud Enterprise", "Redis Ltd", "In-Memory Cache", "Engineering", 7200, "monthly", "Fixed 5GB High Availability", 1, 1, 0, "low", "Sub-millisecond query response for session storage", 0),
    ("sub_19", "Lens Kubernetes IDE", "Mirantis Inc", "K8s Management", "Engineering", 4800, "yearly", "Team Pro", 18, 12, 6, "moderate", "Reclaim 6 unused licenses from graduated interns", 1600),
    ("sub_20", "SonarQube Cloud", "SonarSource SA", "Code Quality & Security", "Engineering", 6400, "yearly", "Enterprise 500k LOC", 1, 1, 0, "low", "Automated PR security scanning integrated into GitHub", 0),

    # Product & Collaboration (10 tools)
    ("sub_21", "Notion Business + AI", "Notion Labs Inc", "Product Knowledge Base", "Product", 24500, "monthly", "Business + AI Addon", 140, 98, 42, "critical", "Cancel unused Notion AI addon seats for 42 engineering users", 8400),
    ("sub_22", "Jira Software Cloud", "Atlassian", "Project Tracking", "Product", 29000, "monthly", "Premium Cloud", 120, 84, 36, "critical", "Redundant tool overlap: 85% of dev sprint tickets are on Linear", 19200),
    ("sub_23", "Confluence Cloud", "Atlassian", "Team Documentation", "Product", 16500, "monthly", "Standard Cloud", 110, 89, 21, "moderate", "Archive stale spaces and prune 21 inactive member licenses", 3150),
    ("sub_24", "Linear Scale", "Linear Orbit Inc", "Modern Issue Tracking", "Product", 14800, "yearly", "Scale Workspace", 85, 83, 2, "low", "Primary project tracker with exceptional 97% user engagement", 0),
    ("sub_25", "Productboard Pro", "Productboard Inc", "Roadmap & Feedback", "Product", 18200, "yearly", "Pro Roadmaps", 20, 11, 9, "high", "Downgrade 9 passive reviewers to free contributor tier", 4500),
    ("sub_26", "Amplitude Analytics", "Amplitude Inc", "Product Telemetry", "Product", 28000, "monthly", "Growth Enterprise", 1, 1, 0, "moderate", "Trim dormant MTU event tracking properties to avoid overage", 4200),
    ("sub_27", "Mixpanel Team", "Mixpanel Inc", "Funnel Analytics", "Product", 15000, "monthly", "Growth Plan", 1, 1, 0, "high", "Tool redundancy with Amplitude; consolidate analytics stack", 15000),
    ("sub_28", "Slack Enterprise Grid", "Salesforce Inc", "Company Communications", "Product", 62000, "monthly", "Enterprise Grid Shared", 250, 244, 6, "low", "Core real-time nerve center of all 250 employees", 0),
    ("sub_29", "Zoom Video Enterprise", "Zoom Video Comm", "Video Conferencing", "Product", 32000, "monthly", "Enterprise 500", 110, 72, 38, "critical", "Downgrade 38 over-provisioned enterprise seats to Pro tier", 9500),
    ("sub_30", "Loom Business", "Atlassian", "Async Video Messaging", "Product", 14500, "monthly", "Business Workspace", 65, 39, 26, "critical", "Duplicate feature overlap with Slack Huddles & Zoom Clips", 6800),

    # Design & Creative (7 tools)
    ("sub_31", "Figma Enterprise", "Figma Inc", "Collaborative UI/UX", "Design", 34500, "yearly", "Enterprise Organization", 35, 29, 6, "moderate", "Reassign 6 non-design stakeholders from Full Editor to View-Only", 5900),
    ("sub_32", "Adobe Creative Cloud", "Adobe Inc", "Design & Video Suite", "Design", 28000, "monthly", "All Apps for Teams", 18, 12, 6, "high", "Revoke 6 inactive licenses assigned to former contractors", 9300),
    ("sub_33", "Miro Business", "Miro Inc", "Visual Collaboration", "Design", 11700, "monthly", "Business Tier", 45, 21, 24, "critical", "Overlap with FigJam; retire Miro and export boards to FigJam", 11700),
    ("sub_34", "Canva Teams", "Canva Pty Ltd", "Brand Asset Templates", "Design", 7500, "yearly", "Canva Teams 15 Seats", 15, 8, 7, "high", "Reduce team bundle to 8 active marketing/design creators", 3500),
    ("sub_35", "Webflow Workspace", "Webflow Inc", "Marketing CMS", "Design", 9200, "monthly", "Growth Workspace", 6, 5, 1, "low", "Powers company production landing pages and blog CMS", 0),
    ("sub_36", "Framer Pro Team", "Framer B.V.", "Interactive Prototyping", "Design", 6800, "yearly", "Pro Workspace", 8, 7, 1, "low", "High conversion interactive landing page prototyping", 0),
    ("sub_37", "IconJar Team", "IconJar", "Asset Asset Management", "Design", 2100, "yearly", "Team 10 Pack", 10, 6, 4, "low", "Minor utility for brand svg design library", 0),

    # Marketing & Growth (8 tools)
    ("sub_38", "HubSpot Marketing Hub", "HubSpot Inc", "Inbound Marketing Automation", "Marketing", 54000, "monthly", "Enterprise Marketing", 25, 21, 4, "moderate", "Clean 12,000 unengaged contacts to reduce tier billing threshold", 8200),
    ("sub_39", "Google Workspace Plus", "Google LLC", "Email, Drive & Docs", "Marketing", 58000, "monthly", "Enterprise Plus", 250, 248, 2, "low", "Official Google Suite for all 250 team mailboxes", 0),
    ("sub_40", "Semrush Guru", "Semrush Inc", "SEO & Competitive Intelligence", "Marketing", 18500, "monthly", "Guru Plan", 4, 3, 1, "low", "Essential SEO ranking and content strategy tool", 0),
    ("sub_41", "Ahrefs Standard", "Ahrefs Pte Ltd", "Backlink Analysis", "Marketing", 14200, "monthly", "Standard Plan", 3, 2, 1, "moderate", "Consolidate SEO tools: 70% feature overlap with Semrush", 7100),
    ("sub_42", "Mailchimp Standard", "Intuit Mailchimp", "Newsletter Broadcasts", "Marketing", 11000, "monthly", "Standard Tier", 1, 1, 0, "low", "Weekly newsletter engine for 65,000 B2B subscribers", 0),
    ("sub_43", "Buffer Pro", "Buffer Inc", "Social Scheduling", "Marketing", 4200, "monthly", "Team Tier", 5, 4, 1, "low", "Multi-channel LinkedIn & Twitter publishing automation", 0),
    ("sub_44", "Typeform Plus", "Typeform SL", "Lead Capture & Surveys", "Marketing", 6800, "yearly", "Plus Plan", 8, 5, 3, "low", "Lead gen capture forms integrated directly into CRM", 0),
    ("sub_45", "Clearbit Enrichment", "HubSpot (Clearbit)", "B2B Data Intelligence", "Marketing", 16500, "quarterly", "Growth Tier", 1, 1, 0, "low", "Enriches incoming customer leads with firmographic data", 0),

    # Sales & CRM (7 tools)
    ("sub_46", "Salesforce Sales Cloud", "Salesforce Inc", "Enterprise CRM", "Sales", 95000, "yearly", "Enterprise Edition", 45, 32, 13, "critical", "Benchmark reveals 23% overpaying; AI Negotiator dispatch ready", 21800),
    ("sub_47", "LinkedIn Sales Navigator", "Microsoft (LinkedIn)", "Outbound Prospecting", "Sales", 36000, "monthly", "Advanced Team", 30, 24, 6, "high", "Reclaim 6 inactive seats from reps on medical/extended leave", 7200),
    ("sub_48", "Apollo.io Professional", "Apollo Inc", "Lead Generation & Dialer", "Sales", 19500, "monthly", "Professional Plan", 25, 23, 2, "low", "High rep pipeline production and contact verified enrichment", 0),
    ("sub_49", "Gong.io Revenue Intelligence", "Gong.io Inc", "Sales Call Analytics", "Sales", 26000, "yearly", "Pro Edition", 22, 19, 3, "low", "AI deal risk tracking and objection handling training", 0),
    ("sub_50", "DocuSign eSignature", "DocuSign Inc", "Contract Execution", "Sales", 12500, "yearly", "Business Pro", 20, 14, 6, "moderate", "Prune 6 unused admin licenses for sales ops", 2500),
    ("sub_51", "Calendly Teams", "Calendly LLC", "Meeting Scheduling", "Sales", 8200, "yearly", "Teams Tier", 35, 33, 2, "low", "High conversion scheduling link for incoming demo requests", 0),
    ("sub_52", "ZoomInfo Growth", "ZoomInfo Technologies", "Enterprise Org Charts", "Sales", 32000, "quarterly", "Growth Elite", 10, 8, 2, "low", "Direct phone dials for enterprise account execs", 0),

    # Operations & IT (4 tools)
    ("sub_53", "1Password Business", "AgileBits Inc", "Password & Secret Vault", "Operations", 14500, "yearly", "Business Tier", 250, 250, 0, "low", "100% compliance mandatory security standard across company", 0),
    ("sub_54", "Zapier Team Plan", "Zapier Inc", "No-Code Workflow Automations", "Operations", 16800, "monthly", "Team Tier (50k tasks)", 10, 7, 3, "moderate", "Migrate internal webhook tasks to native code endpoints", 4200),
    ("sub_55", "PagerDuty Business", "PagerDuty Inc", "On-Call Incident Response", "Operations", 18500, "monthly", "Business Standard", 40, 38, 2, "low", "Critical uptime incident escalations with SMS paging", 0),
    ("sub_56", "Dropbox Business", "Dropbox Inc", "Archival File Storage", "Operations", 9800, "monthly", "Standard Team", 25, 9, 16, "critical", "16 ghost accounts; redundant with Google Drive Enterprise", 6200),

    # HR & People (3 tools)
    ("sub_57", "BambooHR Performance", "BambooHR LLC", "Core HR & Reviews", "HR & People", 21500, "monthly", "Advantage + Performance", 250, 250, 0, "low", "Company-wide payroll, time-off and 360 review records", 0),
    ("sub_58", "Deel Global Payroll", "Deel Inc", "Contractor Compliance", "HR & People", 18000, "monthly", "Contractor Management", 15, 15, 0, "low", "Seamless automated payments to international contractors", 0),
    ("sub_59", "Culture Amp", "Culture Amp Inc", "Employee Engagement Surveys", "HR & People", 11200, "yearly", "Retain + Engage", 250, 240, 10, "low", "Bi-annual pulse surveys and manager effectiveness metrics", 0),

    # Finance (3 tools)
    ("sub_60", "QuickBooks Online Advanced", "Intuit Inc", "Accounting & Ledger", "Finance", 14500, "monthly", "Advanced Enterprise", 10, 8, 2, "low", "Primary financial general ledger and tax reconciliation", 0),
    ("sub_61", "Carta Cap Table", "eShares Inc (Carta)", "Equity & Valuation", "Finance", 19500, "yearly", "Scale Cap Table", 1, 1, 0, "low", "Shareholder cap table, 409A valuations and investor reporting", 0),
    ("sub_62", "Expensify Corporate", "Expensify Inc", "Receipt & Reimbursement", "Finance", 12800, "monthly", "Corporate Card Sync", 85, 76, 9, "moderate", "Prune 9 seats of non-traveling administrative personnel", 2100),

    # Customer Support (3 tools)
    ("sub_63", "Zendesk Suite Enterprise", "Zendesk Inc", "Omnichannel Helpdesk", "Customer Support", 38500, "monthly", "Suite Enterprise", 25, 20, 5, "moderate", "Convert 5 dormant backup agent seats to light agents", 7700),
    ("sub_64", "Intercom Pro", "Intercom Inc", "In-App Chat & Messenger", "Customer Support", 24000, "monthly", "Pro Resolution Bot", 15, 13, 2, "low", "Instant AI resolution bot handles 44% of customer chats", 0),
    ("sub_65", "Freshdesk Pro", "Freshworks Inc", "Secondary Ticketing", "Customer Support", 11500, "monthly", "Pro Tier", 12, 4, 8, "critical", "Zombie system legacy from 2024; 100% duplicate with Zendesk", 11500)
]

# =========================================================================
# 3. BUILD SUBSCRIPTIONS.JSON & COMPUTE METRICS
# =========================================================================
subscriptions = []
monthly_total = 0
annual_total = 0
savings_monthly_total = 0
savings_annual_total = 0
ghost_seats_total = 0
total_seats_count = 0
active_seats_count = 0

now = datetime(2026, 4, 1)

for item in SUBS_CATALOG:
    sub_id, name, vendor, cat, dept, cost, cycle, plan, seats, active, inactive, risk, action, monthly_save = item
    
    # Calculate costs
    if cycle == "yearly":
        ann_cost = cost
        m_cost = round(cost / 12)
    elif cycle == "quarterly":
        ann_cost = cost * 4
        m_cost = round(cost / 3)
    else: # monthly
        m_cost = cost
        ann_cost = cost * 12

    monthly_total += m_cost
    annual_total += ann_cost
    savings_monthly_total += monthly_save
    savings_annual_total += (monthly_save * 12)
    ghost_seats_total += inactive
    total_seats_count += seats
    active_seats_count += active

    usage_pct = round((active / seats) * 100, 1) if seats > 0 else 100.0

    # Determine status
    if monthly_save > 8000 or inactive > 10:
        status = "critical" if risk == "critical" else "underutilized"
    elif monthly_save > 0:
        status = "underutilized"
    else:
        status = "healthy"

    # Dates
    renewal_days = random.randint(3, 340)
    renewal_date = (now + timedelta(days=renewal_days)).strftime("%Y-%m-%d")
    last_pay_days = random.randint(5, 30) if cycle == "monthly" else random.randint(30, 200)
    last_payment_date = (now - timedelta(days=last_pay_days)).strftime("%Y-%m-%d")
    next_payment_date = renewal_date
    created_at = (now - timedelta(days=random.randint(400, 1200))).strftime("%Y-%m-%dT00:00:00Z")
    updated_at = (now - timedelta(days=random.randint(1, 10))).strftime("%Y-%m-%dT00:00:00Z")

    subscriptions.append({
        "id": sub_id,
        "name": name,
        "vendor": vendor,
        "category": cat,
        "department": dept,
        "monthly_cost": m_cost,
        "annual_cost": ann_cost,
        "renewal_date": renewal_date,
        "renewal_urgency_days": renewal_days,
        "billing_cycle": cycle,
        "payment_method": "PayPal Sandbox (Corporate Balance)",
        "paypal_subscription_id": f"I-PP-{sub_id.upper()}-9921",
        "plan_name": plan,
        "number_of_seats": seats,
        "active_users": active,
        "inactive_users": inactive,
        "usage_percentage": usage_pct,
        "risk_level": risk,
        "recommended_action": action,
        "estimated_monthly_savings": monthly_save,
        "estimated_annual_savings": monthly_save * 12,
        "status": status,
        "last_payment_date": last_payment_date,
        "next_payment_date": next_payment_date,
        "created_at": created_at,
        "updated_at": updated_at
    })

# Write subscriptions.json
with open('data/subscriptions.json', 'w', encoding='utf-8') as f:
    json.dump(subscriptions, f, indent=2)

print(f"Generated data/subscriptions.json: {len(subscriptions)} subscriptions | Total Monthly: ₹{monthly_total:,} | Total Annual: ₹{annual_total:,} | Reclaimable Savings/Yr: ₹{savings_annual_total:,}")

# =========================================================================
# 4. GENERATE TRANSACTIONS.JSON (320 transactions linked to subscriptions)
# =========================================================================
transactions = []
txn_counter = 1

# Past 12 months range (April 2025 to March 2026)
for month_offset in range(6, 0, -1):
    month_dt = now - timedelta(days=month_offset * 30)
    for sub in subscriptions:
        cycle = sub["billing_cycle"]
        should_bill = False
        
        if cycle == "monthly":
            should_bill = True
        elif cycle == "quarterly" and (month_offset % 3 == 0):
            should_bill = True
        elif cycle == "yearly" and (month_offset == 2 or month_offset == 11):
            # Only 1-2 times per year
            should_bill = (sub["id"] in ["sub_01", "sub_10", "sub_11", "sub_14", "sub_24", "sub_31", "sub_46", "sub_50", "sub_53", "sub_61"] and month_offset == 2)

        if should_bill:
            day_of_month = random.randint(1, 28)
            txn_date = datetime(month_dt.year, month_dt.month, day_of_month, random.randint(8, 20), random.randint(10, 55)).strftime("%Y-%m-%dT%H:%M:%SZ")
            
            # Amount based on cycle
            if cycle == "yearly":
                amt = sub["annual_cost"]
            elif cycle == "quarterly":
                amt = sub["monthly_cost"] * 3
            else:
                amt = sub["monthly_cost"]

            tax_amt = round(amt * 0.18) # 18% GST in India
            
            status = "COMPLETED"
            if month_offset == 1 and day_of_month > 25:
                status = "PENDING"

            transactions.append({
                "transaction_id": f"TXN-PP-2026-{txn_counter:05d}",
                "subscription_id": sub["id"],
                "subscription_name": sub["name"],
                "vendor": sub["vendor"],
                "amount": amt,
                "currency": "INR",
                "payment_method": "PayPal Corporate Account",
                "payment_provider": "PayPal Sandbox",
                "paypal_capture_id": f"CAP-{txn_counter:06d}-PP",
                "invoice_number": f"INV-ACME-{month_dt.strftime('%Y%m')}-{txn_counter:04d}",
                "status": status,
                "date": txn_date,
                "department": sub["department"],
                "tax": tax_amt,
                "description": f"Automated recurring payment for {sub['name']} ({sub['plan_name']})"
            })
            txn_counter += 1

# Sort transactions newest first
transactions.sort(key=lambda x: x["date"], reverse=True)

with open('data/transactions.json', 'w', encoding='utf-8') as f:
    json.dump(transactions, f, indent=2)

print(f"Generated data/transactions.json: {len(transactions)} transactions")

# =========================================================================
# 5. GENERATE DEPARTMENTS.JSON (9 Departments)
# =========================================================================
departments_list = []
for dept_cfg in DEPARTMENTS_CONFIG:
    name = dept_cfg["name"]
    d_subs = [s for s in subscriptions if s["department"] == name]
    d_m_spend = sum(s["monthly_cost"] for s in d_subs)
    d_a_spend = sum(s["annual_cost"] for s in d_subs)
    d_savings = sum(s["estimated_monthly_savings"] for s in d_subs) * 12
    
    # Top 3 tools
    sorted_tools = sorted(d_subs, key=lambda s: s["monthly_cost"], reverse=True)
    top_tools = [s["name"] for s in sorted_tools[:3]]
    
    # Health score
    if d_savings > 100000:
        d_health = 76
    elif d_savings > 40000:
        d_health = 84
    else:
        d_health = 94

    departments_list.append({
        "department_id": f"dept_{dept_cfg['code'].lower()}",
        "name": name,
        "code": dept_cfg["code"],
        "headcount": dept_cfg["headcount"],
        "monthly_spend": d_m_spend,
        "annual_spend": d_a_spend,
        "department_budget": dept_cfg["budget"],
        "potential_annual_savings": d_savings,
        "health_score": d_health,
        "active_tools_count": len(d_subs),
        "top_tools": top_tools,
        "lead": f"Head of {name}"
    })

with open('data/departments.json', 'w', encoding='utf-8') as f:
    json.dump(departments_list, f, indent=2)

print(f"Generated data/departments.json: {len(departments_list)} departments")

# =========================================================================
# 6. GENERATE COMPANY.JSON
# =========================================================================
company_data = {
    "company_id": "comp_acme_01",
    "name": "Acme Technologies Pvt Ltd",
    "legal_name": "Acme Technologies Private Limited",
    "brand_name": "Acme Tech",
    "industry": "Software / B2B SaaS",
    "founded_year": 2021,
    "country": "India",
    "headquarters": "Outer Ring Road, Bengaluru, Karnataka 560103, India",
    "currency": "INR",
    "currency_symbol": "₹",
    "employee_count": 250,
    "tier": "Series B",
    "monthly_budget_cap": 750000,
    "annual_budget_cap": 9000000,
    "monthly_saas_spend": monthly_total,
    "annual_saas_spend": annual_total,
    "potential_annual_savings": savings_annual_total,
    "potential_monthly_savings": savings_monthly_total,
    "business_health_score": 89,
    "cash_runway_months": 18.4,
    "cash_balance": 145000000,
    "paypal_payer_id": "PAYER_ACME_B2B_IN",
    "business_metrics": {
        "annual_recurring_revenue": 380000000,
        "gross_margin_percentage": 82.5,
        "saas_opex_ratio": 16.4,
        "average_cost_per_seat": round(monthly_total / 250),
        "total_managed_seats": total_seats_count,
        "active_seats_rate": round((active_seats_count / total_seats_count) * 100, 1),
        "ghost_seats_detected": ghost_seats_total
    },
    "created_at": "2021-08-15T00:00:00Z",
    "updated_at": "2026-04-01T08:30:00Z"
}

with open('data/company.json', 'w', encoding='utf-8') as f:
    json.dump(company_data, f, indent=2)

print("Generated data/company.json")

# =========================================================================
# 7. GENERATE USER.JSON (Alex Rivera CFO)
# =========================================================================
user_data = {
    "user_id": "usr_alex_rivera_01",
    "first_name": "Alex",
    "last_name": "Rivera",
    "full_name": "Alex Rivera",
    "role": "Chief Financial Officer (CFO)",
    "title": "CFO / Founding Partner",
    "department": "Finance & Executive",
    "company_id": "comp_acme_01",
    "email": "alex.rivera@acmetechnologies.com",
    "avatar_initials": "AR",
    "avatar_bg": "#5B21B6",
    "phone": "+91 98450 12890",
    "timezone": "Asia/Kolkata",
    "currency_preference": "INR",
    "joined_date": "2022-03-01",
    "permissions": [
        "cfo_admin",
        "view_all_ledgers",
        "execute_1click_downgrades",
        "approve_negotiation_letters",
        "trigger_paypal_live_sync",
        "manage_organization_budgets",
        "generate_executive_reports",
        "manage_team_permissions"
    ],
    "preferences": {
        "theme": "light",
        "email_alerts_digest": "daily",
        "slack_alert_integration": True,
        "high_priority_spend_threshold": 25000,
        "auto_detect_ghost_licenses": True
    }
}

with open('data/user.json', 'w', encoding='utf-8') as f:
    json.dump(user_data, f, indent=2)

print("Generated data/user.json")

# =========================================================================
# 8. GENERATE RECOMMENDATIONS.JSON (50 AI Recommendations)
# =========================================================================
recommendations = []
rec_id_counter = 1

# First add specific high-impact recommendations from subscriptions with savings > 0
for sub in subscriptions:
    if sub["estimated_monthly_savings"] > 0:
        action_type = "downgrade" if "Downgrade" in sub["recommended_action"] else (
            "prune_ghost_seats" if "seats" in sub["recommended_action"].lower() or "license" in sub["recommended_action"].lower() else (
                "retire_duplicate" if "overlap" in sub["recommended_action"].lower() or "retire" in sub["recommended_action"].lower() else "negotiate"
            )
        )
        
        priority = "CRITICAL" if sub["risk_level"] == "critical" else ("HIGH" if sub["risk_level"] == "high" else "MEDIUM")
        confidence = random.randint(91, 98)

        recommendations.append({
            "id": f"REC-2026-{rec_id_counter:03d}",
            "subscription_id": sub["id"],
            "subscription_name": sub["name"],
            "vendor": sub["vendor"],
            "affected_department": sub["department"],
            "action_type": action_type,
            "title": sub["recommended_action"],
            "priority": priority,
            "confidence_score": confidence,
            "reason": f"Audit of {sub['name']} discovered {sub['inactive_users']} inactive licenses out of {sub['number_of_seats']} total seats ({round(100 - sub['usage_percentage'])}% idle).",
            "estimated_monthly_savings": sub["estimated_monthly_savings"],
            "estimated_annual_savings": sub["estimated_annual_savings"],
            "expected_impact": "Zero disruption to active development or daily operations",
            "status": "PENDING",
            "created_at": "2026-03-29T10:00:00Z"
        })
        rec_id_counter += 1

# Add remaining strategic recommendations to hit exactly 50
strategic_extra = [
    ("Consolidate Jira to Linear", "Product", "retire_duplicate", "CRITICAL", 96, "Move remaining 15% product backlog tickets to Linear to terminate Jira Enterprise billing.", 19200),
    ("Switch Loom to Slack Clips", "Product", "retire_duplicate", "HIGH", 94, "Slack Huddles & Canvas provides native screen recording, eliminating separate Loom seats.", 6800),
    ("Salesforce 2-Year Renewal Cap", "Sales", "negotiate", "CRITICAL", 92, "Benchmark quote indicates market alternatives at 23% discount; dispatch counter-offer draft.", 21800),
    ("AWS Reserved Instances Commitment", "Engineering", "contract_optimization", "HIGH", 95, "Convert 12 on-demand c6g.2xlarge instances to 1-year Compute Savings Plan.", 12400),
    ("Miro to FigJam Board Migration", "Design", "retire_duplicate", "CRITICAL", 97, "Designers already use FigJam; 24 Miro seats have had zero board edits since January.", 11700),
    ("Notion AI Addon Pruning", "Product", "downgrade", "HIGH", 95, "Engineering team utilizes GitHub Copilot and ChatGPT Enterprise, rendering Notion AI redundant.", 8400),
    ("Datadog Dev Ingestion Cap", "Engineering", "config_optimization", "MEDIUM", 91, "Set 5GB/day index cap on dev/test environments to prevent automated log bill spikes.", 8500),
    ("Freshdesk Legacy Decommission", "Customer Support", "retire_duplicate", "CRITICAL", 99, "Legacy ticketing portal has 0 open tickets; 100% incoming volume flows via Zendesk.", 11500),
    ("Zoom Enterprise to Pro Downgrade", "Product", "downgrade", "HIGH", 93, "38 users host sessions strictly under 35 mins without phone dial-in requirements.", 9500),
    ("HubSpot Contact Pruning", "Marketing", "downgrade", "MEDIUM", 90, "Archive 12,000 bounced/hard-unsubscribed marketing contacts to drop down one pricing tier.", 8200),
    ("Adobe Creative Cloud Reassignment", "Design", "prune_ghost_seats", "HIGH", 94, "Revoke 6 licenses held by departed contractors and reassign as needed.", 9300),
    ("LinkedIn Sales Navigator Pruning", "Sales", "prune_ghost_seats", "HIGH", 92, "6 account reps on extended leaves have not accessed LinkedIn Sales Navigator in 45 days.", 7200),
    ("Ahrefs to Semrush Consolidation", "Marketing", "retire_duplicate", "MEDIUM", 89, "70% feature overlap between Semrush and Ahrefs; consolidate marketing SEO on Semrush.", 7100),
    ("Dropbox to Google Drive Archival", "Operations", "retire_duplicate", "HIGH", 95, "Google Workspace already includes 5TB enterprise drive storage per user; cancel Dropbox.", 6200),
    ("Figma Stakeholder Downgrade", "Design", "downgrade", "MEDIUM", 91, "Convert 6 engineering managers from Full Figma Editors to View-Only Commenters.", 5900),
    ("GitHub Dev Contractor Pruning", "Engineering", "prune_ghost_seats", "HIGH", 96, "13 external contractors finished work in Q4 2025; revoke active GitHub seats.", 5200),
    ("JetBrains to VS Code Transition", "Engineering", "downgrade", "LOW", 88, "11 developers voluntarily standardized on VS Code + Cursor; surrender JetBrains seats.", 4600),
    ("Productboard Viewer Rationalization", "Product", "downgrade", "MEDIUM", 90, "9 passive reviewers do not create feature requests; convert to free viewer tier.", 4500),
    ("Zapier Webhook Consolidation", "Operations", "config_optimization", "LOW", 89, "Replace 3 heavy Zapier sync tasks with native Node.js webhooks on Vercel.", 4200),
    ("Amplitude Event Throttling", "Product", "config_optimization", "LOW", 88, "Drop high-frequency scroll telemetry events to stay safely below 10M MTU threshold.", 4200)
]

for title, dept, act, prio, conf, reason, save in strategic_extra:
    if len(recommendations) < 50:
        recommendations.append({
            "id": f"REC-2026-{rec_id_counter:03d}",
            "subscription_id": "sub_multi",
            "subscription_name": title.split()[0],
            "vendor": title.split()[0],
            "affected_department": dept,
            "action_type": act,
            "title": title,
            "priority": prio,
            "confidence_score": conf,
            "reason": reason,
            "estimated_monthly_savings": save,
            "estimated_annual_savings": save * 12,
            "expected_impact": "Zero disruption to daily operations",
            "status": "PENDING",
            "created_at": "2026-03-30T11:00:00Z"
        })
        rec_id_counter += 1

with open('data/recommendations.json', 'w', encoding='utf-8') as f:
    json.dump(recommendations, f, indent=2)

print(f"Generated data/recommendations.json: {len(recommendations)} recommendations")

# =========================================================================
# 9. GENERATE NOTIFICATIONS.JSON (50 Notifications)
# =========================================================================
notifications = []
notif_templates = [
    ("renewal_alert", "critical", "Salesforce Renewal in 45 Days", "Annual contract auto-renews soon. AI Negotiator counter-offer ready for dispatch.", "event_repeat", "negotiator.html"),
    ("paypal_sync", "normal", "PayPal Live Sync Completed", "32 automated recurring invoices reconciled via PayPal Sandbox webhook with 0 discrepancies.", "sync", "dashboard.html"),
    ("ghost_seat", "high", "14 Phantom Seats Detected", "Subscription Doctor identified 14 seats with zero login activity in > 45 days.", "person_off", "doctor.html"),
    ("duplicate_alert", "critical", "SaaS Duplication Warning", "Linear, Asana, and Jira detected running simultaneously. Potential ₹19,200/mo waste.", "content_copy", "doctor.html"),
    ("spend_anomaly", "high", "AWS Spend Spike Alert", "Dev environment RDS database overage exceeded rolling 30-day baseline by 18.4%.", "trending_up", "analytics.html"),
    ("health_improved", "normal", "Business Health Score Lift", "Health Score increased to 89/100 following Q1 license pruning actions.", "verified", "ai_cfo.html"),
    ("report_ready", "normal", "Executive SaaS Digest Ready", "March 2026 Monthly SaaS & Runway Audit report generated and ready for review.", "summarize", "reports.html"),
    ("recommendation_applied", "normal", "Zoom Downgrade Scheduled", "1-click downgrade applied for 8 Zoom licenses; ₹9,500/mo savings will reflect next billing cycle.", "bolt", "subscriptions.html"),
    ("contract_negotiation", "high", "HubSpot Benchmark Available", "Anonymous cohort data indicates competitors paying 22% less for Marketing Hub.", "handshake", "negotiator.html"),
    ("audit_complete", "normal", "Autonomous Nightly Audit Complete", "Scanned 65 subscriptions across 9 departments against PayPal ledger.", "auto_awesome", "dashboard.html")
]

for i in range(50):
    t_type, sev, title, msg, icon, link = notif_templates[i % len(notif_templates)]
    time_offset_hours = i * 6 + random.randint(1, 4)
    notif_dt = (now - timedelta(hours=time_offset_hours)).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    notifications.append({
        "id": f"NOTIF-2026-{i+1:04d}",
        "type": t_type,
        "severity": sev,
        "title": f"{title} #{i+1}" if i >= len(notif_templates) else title,
        "message": msg,
        "timestamp": notif_dt,
        "read": i > 5, # First 5 are unread
        "icon": icon,
        "action_link": link
    })

with open('data/notifications.json', 'w', encoding='utf-8') as f:
    json.dump(notifications, f, indent=2)

print(f"Generated data/notifications.json: {len(notifications)} notifications")

# =========================================================================
# 10. GENERATE REPORTS.JSON (12 Monthly Reports)
# =========================================================================
reports = []
months = [
    ("March 2026", 2026, 3, 412500, 82000, 48000),
    ("February 2026", 2026, 2, 408000, 78000, 42000),
    ("January 2026", 2026, 1, 395000, 75000, 39000),
    ("December 2025", 2025, 12, 388000, 72000, 35000),
    ("November 2025", 2025, 11, 382000, 69000, 32000),
    ("October 2025", 2025, 10, 376000, 68000, 30000),
    ("September 2025", 2025, 9, 370000, 64000, 28000),
    ("August 2025", 2025, 8, 365000, 61000, 25000),
    ("July 2025", 2025, 7, 360000, 58000, 24000),
    ("June 2025", 2025, 6, 355000, 54000, 21000),
    ("May 2025", 2025, 5, 348000, 50000, 18000),
    ("April 2025", 2025, 4, 342000, 48000, 15000)
]

for month_name, yr, mo, spend, waste, realized in months:
    gen_dt = datetime(yr, mo, 28, 17, 30).strftime("%Y-%m-%d")
    reports.append({
        "report_id": f"REP-{yr}-{mo:02d}",
        "month": month_name,
        "title": f"{month_name} Executive SaaS & Cashflow Governance Digest",
        "generated_date": gen_dt,
        "total_spend_analyzed": spend,
        "identified_waste": waste,
        "realized_savings": realized,
        "active_tools_audited": len(subscriptions),
        "status": "AUDITED",
        "health_score_at_audit": 89 if mo >= 1 else 86,
        "summary": f"Comprehensive audit for {month_name}. Discovered ₹{waste:,} in immediate reclaimable annual waste across {len(subscriptions)} active vendor contracts. Realized monthly savings of ₹{realized:,} through 1-click license pruning and duplicate retirement.",
        "download_url": f"/api/v1/reports/download/REP-{yr}-{mo:02d}.pdf"
    })

with open('data/reports.json', 'w', encoding='utf-8') as f:
    json.dump(reports, f, indent=2)

print(f"Generated data/reports.json: {len(reports)} reports")

# =========================================================================
# 11. GENERATE PAYPAL.JSON (PayPal Sandbox Telemetry)
# =========================================================================
completed_txns = [t for t in transactions if t["status"] == "COMPLETED"]
pending_txns = [t for t in transactions if t["status"] == "PENDING"]
total_synced_sum = sum(t["amount"] for t in transactions)

paypal_data = {
    "connected_account": {
        "account_id": "PPL_MERCHANT_ACME_B2B_IN",
        "account_name": "Acme Technologies India Pvt Ltd (B2B Sandbox)",
        "account_email": "payments-sandbox@acmetechnologies.com",
        "environment": "sandbox",
        "account_type": "BUSINESS",
        "verified": True,
        "currency": "INR",
        "default_funding_source": "PayPal Business Balance + HDFC Corporate Direct Debit"
    },
    "sync_status": {
        "status": "LIVE_SYNC_HEALTHY",
        "last_sync_timestamp": "2026-04-01T08:14:22Z",
        "webhook_listener_id": "WH-99A10-SPENDPILOT-SANDBOX",
        "webhook_status": "ACTIVE",
        "latency_ms": 142,
        "auto_sync_interval_mins": 15
    },
    "summary_metrics": {
        "total_synced_invoices_count": len(transactions),
        "total_synced_volume": total_synced_sum,
        "completed_payments_count": len(completed_txns),
        "pending_payments_count": len(pending_txns),
        "active_recurring_profiles_count": len(subscriptions),
        "disputed_transactions_count": 0,
        "auto_matched_reconciliations_percentage": 100.0
    },
    "recent_synced_transactions": transactions[:10],
    "supported_developer_events": [
        "BILLING.SUBSCRIPTION.CREATED",
        "BILLING.SUBSCRIPTION.ACTIVATED",
        "BILLING.SUBSCRIPTION.UPDATED",
        "BILLING.SUBSCRIPTION.CANCELLED",
        "BILLING.SUBSCRIPTION.SUSPENDED",
        "PAYMENT.SALE.COMPLETED",
        "PAYMENT.SALE.DENIED",
        "INVOICING.INVOICE.PAID"
    ]
}

with open('data/paypal.json', 'w', encoding='utf-8') as f:
    json.dump(paypal_data, f, indent=2)

print("Generated data/paypal.json")

# =========================================================================
# 12. GENERATE BUSINESS_HEALTH.JSON
# =========================================================================
business_health = {
    "overall_health_score": 89,
    "max_score": 100,
    "rating_tier": "Optimal Efficiency",
    "cohort_ranking": "Top 8% in Series B SaaS (100-250 Employees)",
    "last_assessed_at": "2026-04-01T08:00:00Z",
    "category_breakdown": {
        "financial_health": {
            "score": 92,
            "weight": 0.25,
            "status": "Optimal",
            "metric": "18.4 months cash runway"
        },
        "subscription_efficiency": {
            "score": 86,
            "weight": 0.25,
            "status": "Good",
            "metric": f"{round((active_seats_count / total_seats_count) * 100, 1)}% seat utilization"
        },
        "renewal_risk_mitigation": {
            "score": 78,
            "weight": 0.15,
            "status": "Action Required",
            "metric": "2 renewals expiring within 30 days"
        },
        "ai_confidence_score": {
            "score": 96,
            "weight": 0.15,
            "status": "Verified",
            "metric": "100% deterministic PayPal invoice matching"
        },
        "cost_efficiency": {
            "score": 88,
            "weight": 0.10,
            "status": "Optimal",
            "metric": "16.4% SaaS % of OpEx"
        },
        "security_compliance": {
            "score": 94,
            "weight": 0.10,
            "status": "Optimal",
            "metric": "100% SSO & 1Password enforced"
        }
    },
    "score_strengths": [
        "100% automated telemetry match with PayPal Sandbox",
        "High average seat utilization rate in core Engineering stack (88%)",
        "Strong cash runway of 18.4 months exceeding Series B threshold"
    ],
    "critical_score_drags": [
        f"{ghost_seats_total} inactive phantom seats detected across Loom, Zoom, and Asana",
        "Salesforce enterprise contract benchmarked 23% above market rate",
        "3 redundant tool overlaps identified in product and design departments"
    ],
    "historical_score_trend": [
        {"month": "Nov 2025", "score": 81},
        {"month": "Dec 2025", "score": 83},
        {"month": "Jan 2026", "score": 85},
        {"month": "Feb 2026", "score": 86},
        {"month": "Mar 2026", "score": 88},
        {"month": "Apr 2026", "score": 89}
    ]
}

with open('data/business_health.json', 'w', encoding='utf-8') as f:
    json.dump(business_health, f, indent=2)

print("Generated data/business_health.json")

# =========================================================================
# 13. GENERATE ANALYTICS.JSON (Internally consistent aggregate telemetry)
# =========================================================================
# Compute monthly spend history from real transactions
monthly_spend_history = []
for yr, mo in [(2025, m) for m in range(4, 13)] + [(2026, m) for m in range(1, 4)]:
    m_txns = [t for t in transactions if datetime.fromisoformat(t["date"].replace("Z", "")).year == yr and datetime.fromisoformat(t["date"].replace("Z", "")).month == mo]
    spend_val = sum(t["amount"] for t in m_txns)
    month_lbl = datetime(yr, mo, 1).strftime("%b %Y")
    monthly_spend_history.append({
        "month": month_lbl,
        "spend": spend_val,
        "budget_cap": 750000,
        "transaction_count": len(m_txns)
    })

# Category breakdown
category_map = {}
for sub in subscriptions:
    c = sub["category"]
    category_map[c] = category_map.get(c, 0) + sub["monthly_cost"]

category_breakdown = [
    {"category": k, "monthly_spend": v, "percentage": round((v / monthly_total) * 100, 1)}
    for k, v in sorted(category_map.items(), key=lambda x: x[1], reverse=True)
]

analytics_data = {
    "overview_metrics": {
        "monthly_saas_spend": monthly_total,
        "annual_saas_spend": annual_total,
        "potential_monthly_savings": savings_monthly_total,
        "potential_annual_savings": savings_annual_total,
        "total_active_subscriptions": len(subscriptions),
        "total_vendors": len(set(s["vendor"] for s in subscriptions)),
        "departments_count": len(DEPARTMENTS_CONFIG),
        "upcoming_renewals_30_days": len([s for s in subscriptions if s["renewal_urgency_days"] <= 30]),
        "ghost_licenses_total": ghost_seats_total,
        "total_seats_managed": total_seats_count,
        "active_seats_total": active_seats_count,
        "average_seat_utilization_pct": round((active_seats_count / total_seats_count) * 100, 1),
        "average_cost_per_employee": round(monthly_total / 250),
        "business_efficiency_score": 89,
        "saas_opex_percentage": 16.4,
        "paypal_daily_velocity": round(monthly_total / 30)
    },
    "department_spend_summary": [
        {
            "department": d["name"],
            "monthly_spend": d["monthly_spend"],
            "annual_spend": d["annual_spend"],
            "percentage_of_total": round((d["monthly_spend"] / monthly_total) * 100, 1),
            "potential_annual_savings": d["potential_annual_savings"],
            "active_tools": d["active_tools_count"],
            "health_score": d["health_score"]
        }
        for d in departments_list
    ],
    "monthly_spend_history": monthly_spend_history,
    "category_spend_breakdown": category_breakdown,
    "savings_opportunity_breakdown": {
        "plan_downgrades": 54200 * 12,
        "ghost_seats_removal": 38400 * 12,
        "redundant_tools_retirement": 48900 * 12,
        "contract_negotiations": 34200 * 12
    }
}

with open('data/analytics.json', 'w', encoding='utf-8') as f:
    json.dump(analytics_data, f, indent=2)

print("Generated data/analytics.json")

print("\n=======================================================")
print("ALL 11 ENTERPRISE DATASET JSON FILES GENERATED SUCCESSFULLY!")
print("=======================================================")
