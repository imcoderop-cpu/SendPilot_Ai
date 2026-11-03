/**
 * Hydrates finance KPIs and department attribution from the demo ledger.
 */
document.addEventListener("DOMContentLoaded", async () => {
  if (!window.api) return;

  try {
    const [analytics, departments, company] = await Promise.all([
      window.api.getAnalytics(),
      window.api.getDepartments(),
      window.api.getCompany(),
    ]);
    const metrics = analytics.metrics;
    const setText = (id, value) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    };

    setText(
      "analytics-net-burn",
      window.api.formatINR(metrics.monthly_saas_spend),
    );
    setText(
      "analytics-opex-ratio",
      `${metrics.budget_utilization_percent}%`,
    );
    const daysInPeriod = Math.max(1, Math.round(
      (new Date(`${analytics.period.end}T00:00:00Z`)
        - new Date(`${analytics.period.start}T00:00:00Z`))
      / 86_400_000,
    ) + 1);
    setText(
      "analytics-daily-velocity",
      `${window.api.formatINR(Math.round(metrics.completed_cash_outflow_in_period / daysInPeriod))} / d`,
    );
    setText(
      "analytics-monthly-savings",
      window.api.formatINR(metrics.potential_monthly_savings),
    );
    setText(
      "analytics-annual-savings",
      `${window.api.formatINR(metrics.potential_annual_savings)} annual opportunity • pending review`,
    );
    setText("analytics-dept-count", `${departments.length} Active Cost Centers`);

    const perEmployee = document
      .getElementById("analytics-net-burn")
      ?.parentElement?.querySelector(".font-label-code");
    if (perEmployee) {
      perEmployee.textContent =
        `Average ${window.api.formatINR(metrics.average_cost_per_employee_monthly)} per employee • ${company.employee_count} employees`;
    }

    const departmentGrid = document.getElementById("analytics-depts-grid");
    if (!departmentGrid) return;

    departmentGrid.replaceChildren();
    departments
      .slice()
      .sort((left, right) => right.monthly_spend - left.monthly_spend)
      .forEach((department) => {
        const share = metrics.monthly_saas_spend > 0
          ? Math.round((department.monthly_spend / metrics.monthly_saas_spend) * 100)
          : 0;
        const card = document.createElement("article");
        card.className =
          "p-4 rounded-xl bg-surface-container-low brutal-border border-[2px] flex flex-col justify-between gap-3";
        const main = document.createElement("div");
        const heading = document.createElement("div");
        heading.className = "flex items-center justify-between mb-2";
        const name = document.createElement("span");
        name.className = "font-headline-sm text-body-lg font-bold text-on-surface";
        name.textContent = department.name;
        const shareBadge = document.createElement("span");
        shareBadge.className =
          "px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-code text-[11px] font-bold";
        shareBadge.textContent = `${share}%`;
        heading.append(name, shareBadge);

        const spend = document.createElement("div");
        spend.className = "font-data-metric text-headline-sm font-bold text-on-surface";
        spend.textContent = `${window.api.formatINR(department.monthly_spend)} / mo`;
        const details = document.createElement("div");
        details.className = "mt-2 space-y-1";
        const headcount = document.createElement("div");
        headcount.className =
          "flex justify-between text-[11px] font-label-code text-on-surface-variant";
        const headcountLabel = document.createElement("span");
        headcountLabel.textContent = `Headcount: ${department.head_count}`;
        const toolCount = document.createElement("span");
        toolCount.className = "font-bold text-on-surface";
        toolCount.textContent = `${department.top_tools.length} top tools`;
        headcount.append(headcountLabel, toolCount);

        const utilization = document.createElement("div");
        utilization.className =
          "flex justify-between text-[11px] font-label-code text-on-surface-variant";
        const utilizationLabel = document.createElement("span");
        utilizationLabel.textContent = "Seat utilization:";
        const utilizationValue = document.createElement("span");
        utilizationValue.className = "font-bold text-on-surface";
        utilizationValue.textContent = `${department.seat_utilization_percent}%`;
        utilization.append(utilizationLabel, utilizationValue);

        const track = document.createElement("div");
        track.className =
          "w-full bg-surface-container-high h-2 rounded-full overflow-hidden brutal-border border-[1px]";
        const bar = document.createElement("div");
        bar.className = "bg-primary-container h-full";
        bar.style.width = `${Math.max(0, Math.min(100, share))}%`;
        track.appendChild(bar);
        details.append(headcount, utilization, track);
        main.append(heading, spend, details);

        const footer = document.createElement("div");
        footer.className =
          "pt-2 border-t-[1.5px] border-surface-container-highest flex justify-between items-center text-[12px]";
        const savingsLabel = document.createElement("span");
        savingsLabel.className = "text-on-surface-variant font-body-sm";
        savingsLabel.textContent = "Potential savings:";
        const savings = document.createElement("span");
        savings.className = "font-bold font-label-code text-tertiary-container";
        savings.textContent =
          `${window.api.formatINR(department.potential_savings_monthly)} / mo`;
        footer.append(savingsLabel, savings);
        card.append(main, footer);
        departmentGrid.appendChild(card);
      });
  } catch (error) {
    window.api.reportError("Analytics", error);
  }
});
