/**
 * SpendPilot AI — Guided Demo Experience
 * Configuration module (declarative, no engine logic).
 *
 * Each walkthrough step is a plain object so the tour can be edited, reordered
 * or extended without touching the controller. Narrative strings use
 * {placeholder} tokens that the controller fills from the live JSON datasets
 * via window.api — so the demo never shows fabricated numbers.
 *
 * Loaded on every page (see demo-bootstrap.js). Exposes:
 *   window.SPENDPILOT_DEMO_CONFIG
 */
(function () {
  "use strict";

  /** Chat prompt auto-inserted at the final step and on "Run Live AI Analysis". */
  const CHAT_PROMPT =
    "Analyze Acme Technologies and identify the Top 5 opportunities to reduce SaaS spending.";

  /**
   * Helper to build a target resolver. Accepts a CSS selector string or a
   * function returning an Element. Wrapping keeps the config declarative while
   * letting some steps resolve via .closest()/first-child for hydrated DOM.
   */
  const T = (selOrFn) =>
    typeof selOrFn === "function" ? selOrFn : () => document.querySelector(selOrFn);

  const STEPS = [
    {
      id: "dashboard",
      page: "dashboard.html",
      title: "Executive Dashboard",
      icon: "grid_view",
      animate: "kpis",
      target: T(() =>
        document.getElementById("kpi-monthly-spend")?.closest("section") ||
        document.getElementById("kpi-monthly-spend")
      ),
      narrative:
        "Meet Acme Technologies — a 250-person software company. Every month it spends {monthlySpend} on SaaS subscriptions. SpendPilot AI has already detected {potentialAnnualSavings} in potential annual savings.",
      why: "A single real-time view of every SaaS dollar leaving the company.",
      impact: "Acme spends {monthlySpend}/month across {activeSubs} active subscriptions and {deptCount} departments.",
      ai: "AI continuously audits spend and surfaces reclaimable waste.",
      paypal: null,
      example: "Potential annual savings of {potentialAnnualSavings} detected automatically.",
    },
    {
      id: "subscriptions",
      page: "subscriptions.html",
      title: "Subscription Ledger",
      icon: "credit_card",
      target: T('#subscriptions-table-body tr[data-tool="canva"]'),
      narrative:
        "Marketing holds {canvaSeats} Canva seats, but {canvaInactive} are inactive — billed but unused. SpendPilot links every seat to PayPal billing and SSO telemetry.",
      why: "Every software license in one auditable ledger — seats, usage, renewals, departments.",
      impact: "Canva (Marketing): {canvaSeats} seats, only {canvaActive} active — {canvaInactive} ghost seats at {canvaUtilization}% utilization.",
      ai: "AI flags inactive seats and duplicate tools per subscription.",
      paypal: "Each subscription's payment method is tracked (Canva bills via PayPal Sandbox).",
      example: "Canva costs {canvaMonthlyCost}/month; {canvaAnnualSavings}/yr is reclaimable.",
    },
    {
      id: "doctor",
      page: "doctor.html",
      title: "Subscription Doctor",
      icon: "vital_signs",
      target: T(() =>
        document.querySelector("#doctor-findings-tbody tr") ||
        document.getElementById("doctor-findings-tbody")
      ),
      narrative:
        "SpendPilot AI diagnosed the portfolio and found {inactiveLicenses} inactive licenses. For Canva alone it prescribed reclaiming {canvaInactive} seats — about {canvaAnnualSavings} a year, at {canvaConfidence}% confidence.",
      why: "AI diagnosis cross-references PayPal billing and SSO login telemetry to find ghost seats, duplicate tools and overspend.",
      impact: "{inactiveLicenses} inactive licenses found; the top finding alone is worth {topFindingSavings}/yr.",
      ai: "Mean AI confidence {aiConfidence}% across the current recommendation set.",
      paypal: "Findings are cross-referenced against PayPal recurring billing records.",
      example: "Canva: {canvaInactive} inactive seats → {canvaAnnualSavings}/yr at {canvaConfidence}% confidence.",
    },
    {
      id: "analytics",
      page: "analytics.html",
      title: "Business Analytics",
      icon: "bar_chart",
      animate: "chart",
      target: T("#analytics-depts-grid"),
      narrative:
        "Engineering is the largest spender at {engSpend}/month with strong utilization, while Marketing and Design carry reclaimable opportunities. SpendPilot tracks all {deptCount} departments against budget.",
      why: "Department-level spend trends and utilization — not just totals.",
      impact: "Engineering leads at {engSpend}/mo; {potentialMonthlySavings}/month reclaimable across departments.",
      ai: "AI highlights the departments with the most optimization opportunity.",
      paypal: null,
      example: "12-month burn velocity vs the AI-optimized target, charted automatically.",
    },
    {
      id: "ai_cfo",
      page: "ai_cfo.html",
      title: "AI CFO Advisory",
      icon: "smart_toy",
      target: T(() =>
        document.querySelector("#cfo-recommendations-list article") ||
        document.getElementById("cfo-recommendations-list")
      ),
      narrative:
        "The AI CFO combines every spending pattern into executive recommendations, ranked by return on effort. The top opportunity alone is worth {topRecSavings} a year.",
      why: "Turns raw spend into executive, ranked recommendations — not just a subscription list.",
      impact: "Top recommendation: {topRecTitle} — {topRecSavings}/yr.",
      ai: "Ranked by ROI with {aiConfidence}% mean AI confidence.",
      paypal: null,
      example: "Portfolio opportunity of {potentialAnnualSavings}/yr, ready to dispatch.",
    },
    {
      id: "negotiator",
      page: "negotiator.html",
      title: "AI Negotiator",
      icon: "handshake",
      target: T("#emailBody"),
      narrative:
        "Instead of negotiating renewals manually, SpendPilot prepares a counter-offer strategy and a complete draft email before each contract expires — leverage points included.",
      why: "Before a contract expires, SpendPilot prepares a data-backed counter-offer and draft email.",
      impact: "Targets up to {topRecSavings}/yr reclaim on the selected vendor renewal.",
      ai: "AI generates leverage points and a full renewal draft, with tone control.",
      paypal: null,
      example: "A ready-to-send counter-proposal: data-driven, polite, or firm.",
    },
    {
      id: "paypal",
      page: "paypal.html",
      title: "PayPal Integration",
      icon: "payments",
      target: T("#paypal-ledger-page"),
      narrative:
        "PayPal is deeply integrated — not just a payment button. {paypalInvoices} recurring invoices flow through PayPal Sandbox, and that transaction history feeds the AI's recommendations.",
      why: "PayPal is wired into the workflow — recurring payments, invoices and webhook telemetry feed the AI.",
      impact: "{paypalInvoices} invoices synced; {paypalSynced} processed through PayPal Sandbox.",
      ai: "AI uses PayPal transaction history to sharpen every recommendation.",
      paypal: "Recurring subscription payments, invoices and live webhook sync.",
      example: "Every subscription payment is tracked end-to-end, not just a checkout button.",
    },
    {
      id: "reports",
      page: "reports.html",
      title: "Executive Reports",
      icon: "summarize",
      target: T(() =>
        document.querySelector("#reportsGrid .report-card") ||
        document.getElementById("reportsGrid")
      ),
      narrative:
        "After the analysis, SpendPilot auto-generates executive reports for business leaders — monthly summaries, savings opportunities and PayPal outflow, ready to share.",
      why: "Auto-generated monthly executive digests — summaries, savings, downloadable.",
      impact: "{reportCount} reports generated from the live audit.",
      ai: "AI compiles findings into board-ready monthly summaries.",
      paypal: "Each report reconciles PayPal Sandbox outflow and invoice counts.",
      example: "One-click, PDF-ready monthly CFO briefings.",
    },
    {
      id: "chat",
      page: "dashboard.html",
      title: "AI Copilot Chat",
      icon: "chat",
      action: "chat",
      /* Target the full right-column chat panel, not just the input box */
      target: T(() => {
        /* Try the col-span-5 sticky right column first */
        const colPanel = document.querySelector(".lg\\:col-span-5.flex.flex-col");
        if (colPanel) return colPanel;
        /* Fall back to the entire chat widget card */
        const chatCard = document.getElementById("dash-chat-messages")?.closest(".bg-surface-container-lowest.rounded-2xl");
        if (chatCard) return chatCard;
        /* Last resort: the input itself */
        return document.getElementById("dash-chat-input");
      }),
      narrative:
        "Finally, anyone can ask SpendPilot in plain English. We have prepared a prompt — press Send when you are ready. The AI will not send it for you.",
      why: "Ask anything in plain language — the AI audits the business and answers.",
      impact: 'e.g. "How can I save ₹1,00,000 this year?"',
      ai: "Natural-language analysis grounded in your live data.",
      paypal: null,
      example: "Prompt prepared — press Send when you are ready.",
    },
    {
      id: "impact",
      overlay: "impact",
      title: "Business Impact Summary",
      icon: "monitoring",
      narrative:
        "Across {deptCount} departments, SpendPilot found {inactiveLicenses} inactive licenses and {duplicateTools} duplicate tool families — worth {potentialAnnualSavings} a year.",
      why: "A single scoreboard of waste, risk and reclaimable spend.",
      impact: "{potentialAnnualSavings}/yr recoverable · {financeHoursSaved} finance hours saved per audit.",
      ai: "Mean confidence {aiConfidence}% on the current recommendation set.",
      paypal: "Findings reconcilable to {paypalInvoices} PayPal Sandbox invoices.",
      example: "ROI on the identified waste is {roiLabel} ({savingsPercent}% of annual SaaS OpEx).",
    },
    {
      id: "executive",
      overlay: "executive",
      title: "Executive Summary",
      icon: "summarize",
      narrative:
        "Board-ready view for Acme Technologies: {potentialAnnualSavings} in annual savings, optimization score {optimizationScore}/100, and a ranked action list the CFO can dispatch today.",
      why: "Turns the audit into a decision document — not a dashboard tour.",
      impact: "Top action: {topRecTitle} — {topRecSavings}/yr.",
      ai: "AI compiled recommendations with {aiConfidence}% confidence.",
      paypal: "PayPal recurring payments and invoice history underpin every figure.",
      example: "Run a live AI analysis, restart the case study, or explore the product.",
    },
  ];

  const STRINGS = {
    welcome: {
      title: "🚀 Welcome to SpendPilot AI",
      subtitle: "Your AI CFO for Smarter Subscription Decisions",
      description:
        "This demo simulates Acme Technologies, a software company with 250 employees. SpendPilot AI combines AI and PayPal to detect subscription waste, optimize software spending and generate intelligent business recommendations.",
      time: "⏱ Less than 60 seconds",
      start: "Start Demo",
      skip: "Skip",
    },
    buttons: {
      next: "Next",
      previous: "Previous",
      skip: "Skip Demo",
      restart: "Restart Demo",
      sendPrompt: "Send Prompt",
      sent: "Sent ✓",
      runAnalysis: "Run Live AI Analysis",
      explore: "Explore Dashboard",
      viewSummary: "View Summary →",
      backToSummary: "Back to Summary →",
    },
    progress: {
      label: "Demo Progress",
      stepOf: "Step {n} of {total}",
      remaining: "~{s}s remaining",
    },
    summary: {
      eyebrow: "AI Executive Summary",
      title: "Here is what SpendPilot found",
      company: "Company",
      monthlySpend: "Monthly SaaS Spend",
      annualSpend: "Annual SaaS Spend",
      potentialSavings: "Potential Annual Savings",
      inactiveLicenses: "Inactive Licenses",
      duplicateTools: "Duplicate Tools",
      departments: "Departments Analyzed",
      renewals: "Upcoming Renewals (30d)",
      health: "Business Health",
      confidence: "AI Confidence",
      hoursSaved: "Finance Hours Saved",
      topOpportunities: "Top Opportunities",
      roi: "Estimated ROI",
      roiValue: "Very High",
      optimization: "Optimization Score",
    },
    impact: {
      eyebrow: "Business Impact",
      title: "Acme Technologies — measured impact",
      lead: "One audit of subscriptions, PayPal recurring payments and SSO usage produced a clear savings plan.",
    },
    executive: {
      eyebrow: "CFO Briefing",
      title: "Executive summary",
      lead: "SpendPilot AI recommends a sequenced rightsizing and renewal program for Acme Technologies, grounded in PayPal invoice history and live seat telemetry.",
    },
    complete: {
      title: "Demo Completed Successfully",
      line1: "SpendPilot AI identified approximately {potentialAnnualSavings} in annual savings for Acme Technologies.",
      line2: "AI analyzed subscriptions, recurring payments, and business spending to generate high-confidence recommendations.",
      line3: "You can now continue exploring the application or start your own analysis.",
      continue: "Continue Exploring",
      restart: "Restart Demo",
      dismiss: "Dismiss",
    },
  };

  window.SPENDPILOT_DEMO_CONFIG = {
    id: "spendpilot-guided-demo",
    version: 1,
    steps: STEPS,
    strings: STRINGS,
    chatPrompt: CHAT_PROMPT,
    timing: { avgSecondsPerStep: 5 },
    storage: { state: "spendpilot_demo_state", welcome: "spendpilot_demo_welcome" },
  };
})();
