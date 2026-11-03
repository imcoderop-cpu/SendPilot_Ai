/**
 * Builds a reviewable, local negotiation draft from subscription and usage data.
 */
document.addEventListener("DOMContentLoaded", async () => {
  if (!window.api) return;

  try {
    const [subscriptions, recommendations, company, user] = await Promise.all([
      window.api.getSubscriptions(),
      window.api.getRecommendations(),
      window.api.getCompany(),
      window.api.getUser(),
    ]);
    const recommendationBySubscription = new Map(
      recommendations.map((recommendation) => [
        recommendation.subscription_id,
        recommendation,
      ]),
    );
    const candidates = subscriptions
      .filter((subscription) => (
        subscription.annual_cost >= 150_000
        || subscription.risk_level === "high"
        || subscription.status === "past_due"
      ))
      .sort((left, right) => (
        window.api.daysUntil(left.renewal_date) - window.api.daysUntil(right.renewal_date)
        || right.annual_cost - left.annual_cost
      ));

    const vendorSelect = document.getElementById("vendorSelect");
    const emailBody = document.getElementById("emailBody");
    if (!vendorSelect || !emailBody || candidates.length === 0) {
      throw new Error("Negotiation page is missing its vendor selector or draft area");
    }

    vendorSelect.replaceChildren();
    candidates.forEach((subscription) => {
      const option = document.createElement("option");
      option.value = subscription.id;
      const days = window.api.daysUntil(subscription.renewal_date);
      const renewalLabel = days === null
        ? window.api.formatDate(subscription.renewal_date)
        : days < 0
          ? `${Math.abs(days)} days overdue`
          : `${days} days`;
      option.textContent =
        `${subscription.name} (${renewalLabel} • ${subscription.department})`;
      vendorSelect.appendChild(option);
    });

    let activeTone = "data-driven";

    function renderNegotiation(subscriptionId) {
      const subscription = candidates.find((item) => item.id === subscriptionId)
        || candidates[0];
      const recommendation = recommendationBySubscription.get(subscription.id);
      const estimatedSavings = recommendation?.estimated_annual_savings || 0;
      const targetPrice = Math.max(0, subscription.annual_cost - estimatedSavings);
      const spend = document.getElementById("neg-annual-spend");
      const target = document.getElementById("neg-target-offer");
      const reclaim = document.getElementById("neg-potential-reclaim");

      if (spend) spend.textContent = window.api.formatINR(subscription.annual_cost);
      if (target) target.textContent = window.api.formatINR(targetPrice);
      if (reclaim) reclaim.textContent = `${window.api.formatINR(estimatedSavings)} / yr`;

      const leverage = document.getElementById("neg-leverage-points");
      if (leverage) {
        const heading = leverage.querySelector("span.font-label-code");
        leverage.replaceChildren();
        if (heading) leverage.appendChild(heading);
        const statements = [
          `${subscription.inactive_users} of ${subscription.number_of_seats} seats are inactive (${Math.round(100 - subscription.usage_percentage)}% idle).`,
          recommendation
            ? `The current review estimates ${window.api.formatINR(recommendation.estimated_monthly_savings)}/month in potential savings.`
            : "No subscription-specific savings estimate is available in this snapshot.",
        ];
        statements.forEach((statement) => {
          const point = document.createElement("div");
          point.className =
            "p-3 rounded-xl bg-surface-container-low brutal-border border-[1.5px] flex items-center gap-2 text-body-sm";
          const icon = document.createElement("span");
          icon.className = "material-symbols-outlined text-tertiary-container text-[18px]";
          icon.textContent = "verified";
          const text = document.createElement("span");
          text.textContent = statement;
          point.append(icon, text);
          leverage.appendChild(point);
        });
      }

      const toneLead = activeTone === "firm"
        ? "We are reviewing our upcoming renewal and request your best available pricing."
        : activeTone === "collaborative"
          ? "We value our relationship and would like to explore a plan that better matches our current usage."
          : "Our finance team reviewed the current subscription and seat utilization.";
      const days = window.api.daysUntil(subscription.renewal_date);
      const renewalLabel = days === null
        ? window.api.formatDate(subscription.renewal_date)
        : days < 0
          ? `${Math.abs(days)} days overdue`
          : `in ${days} days`;
      const paragraphs = [
        `To: ${subscription.vendor} Renewals Team`,
        `Subject: Acme Technologies — ${subscription.name} renewal and seat review`,
        `Hello ${subscription.vendor} Renewals Team,`,
        `${toneLead} Our current ${subscription.plan_name} allocation is ${subscription.number_of_seats} seats, with ${subscription.active_users} active users and ${subscription.inactive_users} inactive seats.`,
        recommendation
          ? `Our internal review estimates a potential annual cost reduction of ${window.api.formatINR(estimatedSavings)} through right-sizing. This is an internal estimate, not a quoted market price. Could you share a revised proposal for ${subscription.active_users} active seats and available renewal options?`
          : `Please share available renewal options for our current ${subscription.plan_name} plan and guidance on adjusting the allocation to ${subscription.active_users} active seats.`,
        `Our renewal date is ${window.api.formatDate(subscription.renewal_date)} (${renewalLabel}).`,
        `Regards, ${user.name}, ${user.role} — ${company.name}`,
      ];
      emailBody.replaceChildren();
      paragraphs.forEach((text) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = text;
        emailBody.appendChild(paragraph);
      });
      emailBody.dataset.subscriptionId = subscription.id;
    }

    vendorSelect.addEventListener("change", () => {
      renderNegotiation(vendorSelect.value);
    });
    document.querySelectorAll("[data-neg-tone]").forEach((button) => {
      button.addEventListener("click", () => {
        activeTone = button.dataset.negTone;
        document.querySelectorAll("[data-neg-tone]").forEach((toneButton) => {
          toneButton.classList.remove("bg-primary-container", "text-on-primary");
          toneButton.classList.add("bg-surface-container-low", "text-on-surface");
        });
        button.classList.remove("bg-surface-container-low", "text-on-surface");
        button.classList.add("bg-primary-container", "text-on-primary");
        renderNegotiation(vendorSelect.value);
      });
    });
    document.getElementById("neg-regenerate")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      if (button.disabled) return;
      const subscription = candidates.find((item) => item.id === vendorSelect.value);
      if (!subscription) return;
      const recommendation = recommendationBySubscription.get(subscription.id);
      const label = button.querySelector("span:last-child");
      const originalLabel = label?.textContent || button.textContent;
      button.disabled = true;
      if (label) label.textContent = "Generating counter-offer…";
      try {
        const result = await window.api.getNegotiationDraft({
          company: { name: company.name },
          vendor: subscription.vendor,
          subscription,
          recommendation: recommendation || null,
          tone: activeTone,
        });
        const paragraph = document.createElement("p");
        paragraph.className = "whitespace-pre-wrap";
        paragraph.textContent = result.message;
        emailBody.replaceChildren(paragraph);
        emailBody.dataset.subscriptionId = subscription.id;
        window.api.showToast("Live AI counter-offer is ready for your review.", "success");
      } catch (error) {
        window.api.showToast(`Counter-offer generation failed: ${error.message}`, "error");
      } finally {
        button.disabled = false;
        if (label) label.textContent = originalLabel;
      }
    });
    document.getElementById("neg-copy-draft")?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(emailBody.innerText);
        window.api.showToast("Draft copied to clipboard.", "success");
      } catch (error) {
        console.error("[Negotiator] Clipboard access failed", error);
        window.api.showToast("Clipboard access is unavailable in this browser context.", "error");
      }
    });
    document.getElementById("neg-send-draft")?.addEventListener("click", () => {
      window.api.showToast(
        "Email sending is not connected yet. Copy the draft and send it through your usual channel.",
        "info",
      );
    });

    renderNegotiation(candidates[0].id);
  } catch (error) {
    window.api.reportError("AI negotiator", error);
  }
});
