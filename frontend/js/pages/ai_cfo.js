/**
 * Hydrates the CFO overview and ranked recommendations from the demo snapshot.
 */
document.addEventListener("DOMContentLoaded", async () => {
  if (!window.api) return;

  try {
    const [analytics, health, recommendations, company, paypal] = await Promise.all([
      window.api.getAnalytics(),
      window.api.getBusinessHealth(),
      window.api.getRecommendations(),
      window.api.getCompany(),
      window.api.getPayPal(),
    ]);
    const metrics = analytics.metrics;
    const setText = (id, value) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    };

    setText("cfo-health-score", health.overall_health_score);
    setText(
      "cfo-annual-burn",
      window.api.formatCompactINR(metrics.annualized_saas_spend),
    );
    setText(
      "cfo-monthly-pace",
      `Burn pace: ${window.api.formatINR(metrics.monthly_saas_spend)}/mo across ${metrics.active_subscriptions} active tools`,
    );
    setText(
      "cfo-yearly-savings",
      window.api.formatINR(metrics.potential_annual_savings),
    );

    const budgetCard = document.getElementById("cfo-annual-burn")?.closest(".p-5");
    const budgetPercent = budgetCard?.querySelector(".font-label-code.text-\\[10px\\] .font-bold");
    if (budgetPercent) {
      budgetPercent.textContent = `${metrics.budget_utilization_percent}%`;
    }
    const budgetBar = budgetCard?.querySelector(".w-full > div");
    if (budgetBar) {
      budgetBar.style.width = `${Math.max(0, Math.min(100, metrics.budget_utilization_percent))}%`;
    }

    const confidence = document.querySelector(
      "#cfo-yearly-savings + span + div .font-headline-sm",
    );
    if (confidence) {
      confidence.textContent = `${health.ai_confidence}% AI confidence • estimates only`;
    }

    const list = document.getElementById("cfo-recommendations-list");
    if (list) {
      const ranked = recommendations
        .filter((recommendation) => recommendation.status === "pending_review")
        .sort((left, right) => (
          right.estimated_annual_savings - left.estimated_annual_savings
        ))
        .slice(0, 5);
      list.replaceChildren();

      ranked.forEach((recommendation) => {
        const row = document.createElement("article");
        row.className =
          "p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6 hover:bg-surface-container-low/50 transition-colors";

        const details = document.createElement("div");
        details.className = "flex flex-col gap-1.5 flex-1";
        const heading = document.createElement("h3");
        heading.className = "font-headline-sm text-title-md font-bold text-on-surface";
        heading.textContent = recommendation.title;
        const department = document.createElement("span");
        department.className =
          "px-2.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface font-label-badge uppercase font-bold w-fit";
        department.textContent = recommendation.affected_department;
        const reason = document.createElement("p");
        reason.className = "font-body-md text-body-md text-on-surface-variant max-w-3xl";
        reason.textContent = recommendation.reason;
        const confidenceText = document.createElement("span");
        confidenceText.className = "font-label-code text-body-sm text-outline";
        confidenceText.textContent =
          `${Math.round(recommendation.confidence * 100)}% confidence • pending human review`;
        details.append(heading, department, reason, confidenceText);

        const actions = document.createElement("div");
        actions.className =
          "flex flex-col items-start xl:items-end gap-3 shrink-0 border-t xl:border-t-0 border-surface-container-high pt-3 xl:pt-0";
        const savings = document.createElement("strong");
        savings.className = "font-headline-sm text-headline-sm font-bold text-tertiary-container";
        savings.textContent =
          `${window.api.formatINR(recommendation.estimated_annual_savings)}/yr`;
        const review = document.createElement("a");
        review.href = "doctor.html";
        review.className =
          "px-4 py-2 rounded-xl bg-primary-container text-on-primary font-headline-sm text-body-sm font-bold brutal-border border-[2px] brutal-shadow-sm";
        review.textContent = "Review finding";
        actions.append(savings, review);
        row.append(details, actions);
        list.appendChild(row);
      });
    }

    const reSimulate = document.getElementById("btn-cfo-resimulate");
    reSimulate?.addEventListener("click", async () => {
      if (reSimulate.disabled) return;
      const label = reSimulate.querySelector("span:last-child");
      const originalLabel = label?.textContent || reSimulate.textContent;
      reSimulate.disabled = true;
      if (label) label.textContent = "Analyzing spend…";
      try {
        const result = await window.api.getAiCfo({
          company: { name: company.name, industry: company.industry },
          metrics,
          business_health: health,
          paypal: {
            invoice_count: paypal.invoice_count,
            total_synced_amount: paypal.total_synced_amount,
            currency: paypal.currency,
            completed_payments: paypal.completed_payments,
            pending_payments: paypal.pending_payments,
            failed_payments: paypal.failed_payments,
          },
          recommendations: recommendations.slice(0, 10),
        });
        const existing = document.getElementById("cfo-live-analysis");
        existing?.remove();
        const insight = document.createElement("article");
        insight.id = "cfo-live-analysis";
        insight.className =
          "p-6 bg-tertiary-fixed/40 hover:bg-tertiary-fixed/50 transition-colors";
        const heading = document.createElement("h3");
        heading.className = "font-headline-sm text-title-md font-bold text-on-surface";
        heading.textContent = "Live AI CFO analysis";
        const message = document.createElement("p");
        message.className = "font-body-md text-body-md text-on-surface-variant mt-2 whitespace-pre-wrap";
        message.textContent = result.message;
        const note = document.createElement("span");
        note.className = "font-label-code text-body-sm text-outline mt-2 block";
        note.textContent = "AI-generated estimate • review before taking action";
        insight.append(heading, message, note);
        document.getElementById("cfo-recommendations-list")?.prepend(insight);
        window.api.showToast("Live AI CFO analysis is ready.", "success");
      } catch (error) {
        window.api.showToast(`AI CFO analysis failed: ${error.message}`, "error");
      } finally {
        reSimulate.disabled = false;
        if (label) label.textContent = originalLabel;
      }
    });
  } catch (error) {
    window.api.reportError("AI CFO", error);
  }
});
