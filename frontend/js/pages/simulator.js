/**
 * Runs client-side savings scenarios using the selected target and demo snapshot.
 */
document.addEventListener("DOMContentLoaded", async () => {
  if (!window.api) return;

  try {
    const [analytics, recommendations] = await Promise.all([
      window.api.getAnalytics(),
      window.api.getRecommendations(),
    ]);
    const metrics = analytics.metrics;
    const slider = document.getElementById("saving-slider");
    const readout = document.getElementById("slider-readout");
    const input = document.getElementById("saving-input");
    const simulateButton = document.getElementById("simulate-btn");
    const scenarios = [
      { id: "plan-a-savings", factor: 0.65 },
      { id: "plan-b-savings", factor: 1.05 },
      { id: "plan-c-savings", factor: 1.7 },
    ];

    const maximum = Number(slider?.max) || 500_000;
    const minimum = Number(slider?.min) || 50_000;
    const annualOpportunity = metrics.potential_annual_savings;
    const initialTarget = Math.min(maximum, Math.max(minimum, 200_000));
    if (slider) slider.value = String(initialTarget);
    if (input) input.value = Math.round(initialTarget).toLocaleString("en-IN");

    function renderAmount(element, amount) {
      if (!element) return;
      const period = document.createElement("span");
      period.className = "font-body-sm text-body-sm text-on-surface";
      period.textContent = "/ yr";
      element.replaceChildren(
        document.createTextNode(window.api.formatINR(amount)),
        document.createTextNode(" "),
        period,
      );
    }

    function updateScenarios(target) {
      const safeTarget = Math.min(maximum, Math.max(minimum, target));
      const annualTarget = Math.min(safeTarget, annualOpportunity);
      if (readout) {
        readout.textContent = Math.round(annualTarget).toLocaleString("en-IN");
      }
      if (slider && Number(slider.value) !== safeTarget) {
        slider.value = String(safeTarget);
      }
      if (input && document.activeElement !== input) {
        input.value = Math.round(safeTarget).toLocaleString("en-IN");
      }
      scenarios.forEach(({ id, factor }) => {
        renderAmount(
          document.getElementById(id),
          Math.round(annualTarget * factor),
        );
      });
    }

    function getEnteredTarget() {
      const value = Number((input?.value || "").replace(/[^\d]/g, ""));
      return Number.isFinite(value) && value > 0
        ? Math.min(maximum, Math.max(minimum, value))
        : Number(slider?.value || initialTarget);
    }

    slider?.addEventListener("input", () => {
      updateScenarios(Number(slider.value));
    });
    input?.addEventListener("input", () => {
      updateScenarios(getEnteredTarget());
    });
    input?.addEventListener("blur", () => {
      input.value = Math.round(getEnteredTarget()).toLocaleString("en-IN");
    });
    simulateButton?.addEventListener("click", () => {
      const target = getEnteredTarget();
      const selectedRecommendations = recommendations.filter(
        (recommendation) => (
          recommendation.status === "pending_review"
          && recommendation.estimated_annual_savings > 0
        ),
      ).length;
      window.api.showToast(
        `Scenario calculated for ${window.api.formatINR(target)}/year using ${selectedRecommendations} pending recommendations. No subscription changes were made.`,
        "info",
      );
    });

    updateScenarios(initialTarget);
  } catch (error) {
    window.api.reportError("What-if simulator", error);
  }
});
