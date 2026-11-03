/**
 * Renders subscription findings from the current demo usage and risk snapshot.
 */
document.addEventListener("DOMContentLoaded", async () => {
  if (!window.api) return;

  try {
    const [subscriptions, recommendations, analytics, company, paypal] = await Promise.all([
      window.api.getSubscriptions(),
      window.api.getRecommendations(),
      window.api.getAnalytics(),
      window.api.getCompany(),
      window.api.getPayPal(),
    ]);
    const metrics = analytics.metrics;
    const zombieSubscriptions = subscriptions.filter(
      (subscription) => (
        subscription.usage_percentage < 65
        || subscription.status === "past_due"
      ),
    );
    const setText = (id, value) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    };

    setText("doc-zombie-count", `${zombieSubscriptions.length} Tools`);
    setText("doc-ghost-seats", `${metrics.ghost_licenses} Seats`);
    setText(
      "doc-reclaimable-total",
      window.api.formatINR(metrics.potential_monthly_savings),
    );

    const tbody = document.getElementById("doctor-findings-tbody");
    if (!tbody) return;

    const recommendationBySubscription = new Map(
      recommendations.map((recommendation) => [
        recommendation.subscription_id,
        recommendation,
      ]),
    );
    const findings = subscriptions
      .filter((subscription) => (
        subscription.inactive_users > 0
        || subscription.risk_level === "high"
        || subscription.status === "past_due"
      ))
      .sort((left, right) => (
        right.estimated_monthly_savings - left.estimated_monthly_savings
      ))
      .slice(0, 12);

    tbody.replaceChildren();
    findings.forEach((subscription) => {
      const recommendation = recommendationBySubscription.get(subscription.id);
      const row = document.createElement("tr");
      row.className = "hover:bg-surface-container-low transition-colors";

      const toolCell = document.createElement("td");
      toolCell.className = "py-4 px-4";
      const toolWrap = document.createElement("div");
      toolWrap.className = "flex items-center gap-3";
      const initial = document.createElement("div");
      initial.className =
        "w-9 h-9 rounded-xl bg-surface-container-highest flex items-center justify-center font-bold brutal-border border-[2px]";
      initial.textContent = subscription.name.charAt(0);
      const toolText = document.createElement("div");
      const name = document.createElement("span");
      name.className = "font-headline-sm text-body-lg font-bold block";
      name.textContent = subscription.name;
      const category = document.createElement("span");
      category.className = "font-label-code text-[11px] text-outline";
      category.textContent = `${subscription.category} • ${subscription.department}`;
      toolText.append(name, category);
      toolWrap.append(initial, toolText);
      toolCell.appendChild(toolWrap);

      const riskCell = document.createElement("td");
      riskCell.className = "py-4 px-4";
      const risk = document.createElement("span");
      const highRisk = subscription.risk_level === "high"
        || subscription.status === "past_due";
      risk.className =
        `px-2.5 py-0.5 rounded-full ${highRisk ? "bg-error-container text-on-error-container" : "bg-secondary-fixed text-on-secondary-fixed"} font-label-badge text-[10px] font-bold uppercase brutal-border border-[1.5px]`;
      risk.textContent =
        subscription.status === "past_due" ? "Past due" : `${subscription.risk_level} risk`;
      riskCell.appendChild(risk);

      const symptomCell = document.createElement("td");
      symptomCell.className = "py-4 px-4";
      const symptom = document.createElement("span");
      symptom.className = "font-body-sm text-body-sm font-semibold text-on-surface";
      symptom.textContent =
        `${subscription.inactive_users} inactive seats (${Math.round(100 - subscription.usage_percentage)}% idle)`;
      const action = document.createElement("p");
      action.className = "font-body-sm text-[12px] text-on-surface-variant";
      action.textContent =
        recommendation?.reason || subscription.recommended_action;
      symptomCell.append(symptom, action);

      const savingsCell = document.createElement("td");
      savingsCell.className = "py-4 px-4 font-label-code font-bold text-on-surface";
      savingsCell.textContent =
        `${window.api.formatINR(subscription.estimated_monthly_savings)}/mo`;

      const prescriptionCell = document.createElement("td");
      prescriptionCell.className = "py-4 px-4";
      const prescription = document.createElement("span");
      prescription.className =
        "font-body-sm text-[13px] font-bold text-tertiary-container block";
      prescription.textContent = subscription.recommended_action;
      prescriptionCell.appendChild(prescription);

      const treatmentCell = document.createElement("td");
      treatmentCell.className = "py-4 px-4 text-right";
      const review = document.createElement("button");
      review.type = "button";
      review.className =
        "px-3.5 py-1.5 rounded-full bg-primary-container text-on-primary font-headline-sm text-body-sm font-bold brutal-border border-[2px] brutal-shadow-sm brutal-btn";
      review.textContent = "Review";
      const aiFinding = document.createElement("div");
      aiFinding.className = "font-body-sm text-[12px] text-on-surface-variant mt-2 whitespace-pre-wrap";
      const reviewSubscription = async () => {
        if (review.disabled) return;
        review.disabled = true;
        aiFinding.replaceChildren(document.createTextNode("Running live AI diagnosis…"));
        try {
          const result = await window.api.getSubscriptionDoctor({
            company: { name: company.name, industry: company.industry },
            metrics: {
              potential_monthly_savings: metrics.potential_monthly_savings,
              ghost_licenses: metrics.ghost_licenses,
              upcoming_renewals_next_30_days: metrics.upcoming_renewals_next_30_days,
            },
            paypal: {
              completed_payments: paypal.completed_payments,
              pending_payments: paypal.pending_payments,
              failed_payments: paypal.failed_payments,
            },
            subscription,
            recommendation: recommendation || null,
          });
          aiFinding.textContent = result.message;
          window.api.showToast(`${subscription.name}: AI review completed.`, "success");
        } catch (error) {
          aiFinding.replaceChildren(document.createTextNode(`AI review failed: ${error.message} `));
          const retry = document.createElement("button");
          retry.type = "button";
          retry.className = "font-label-code text-[11px] font-bold text-primary underline";
          retry.textContent = "Retry";
          retry.addEventListener("click", reviewSubscription);
          aiFinding.appendChild(retry);
          window.api.showToast("AI review failed. Retry when the backend is available.", "error");
        } finally {
          review.disabled = false;
        }
      };
      review.addEventListener("click", reviewSubscription);
      treatmentCell.append(review, aiFinding);

      row.append(
        toolCell,
        riskCell,
        symptomCell,
        savingsCell,
        prescriptionCell,
        treatmentCell,
      );
      tbody.appendChild(row);
    });
  } catch (error) {
    window.api.reportError("Subscription Doctor", error);
  }
});
