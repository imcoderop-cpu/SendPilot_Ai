/**
 * Renders the subscription ledger from subscriptions.json.
 */
document.addEventListener("DOMContentLoaded", async () => {
  if (!window.api) return;

  try {
    const [subscriptions, company] = await Promise.all([
      window.api.getSubscriptions(),
      window.api.getCompany(),
    ]);
    if (!subscriptions.length) {
      throw new Error("subscriptions.json does not contain subscriptions");
    }

    let activeDepartment = "all";
    let searchQuery = "";
    const sortModes = [
      {
        label: "Renewal Urgency",
        compare: (left, right) => left.next_payment_date.localeCompare(right.next_payment_date),
      },
      {
        label: "Highest Monthly Cost",
        compare: (left, right) => right.monthly_cost - left.monthly_cost,
      },
      {
        label: "Lowest Utilization",
        compare: (left, right) => left.usage_percentage - right.usage_percentage,
      },
    ];
    let activeSort = 0;
    const tbody = document.getElementById("subscriptions-table-body");
    const searchInput = document.getElementById("tool-search-input");
    const sortButton = document.getElementById("subscription-sort-button");
    const sortLabel = document.getElementById("subscription-sort-label");
    const filterPills = [...document.querySelectorAll(".dept-pill")];
    const totalCount = document.getElementById("subs-total-count");
    const totalMonthly = document.getElementById("subs-total-monthly");
    const shownCount = document.getElementById("subscription-shown-count");
    const exportButton = document.getElementById("btn-export-csv");
    const bulkButton = document.getElementById("btn-bulk-optimize");

    if (!tbody) throw new Error("Subscription table body is missing");
    const estimatedSavings = subscriptions.reduce(
      (total, subscription) => total + subscription.estimated_monthly_savings,
      0,
    );
    if (totalCount) totalCount.textContent = `${subscriptions.length} Tools`;
    if (totalMonthly) {
      totalMonthly.textContent =
        `${window.api.formatINR(subscriptions.reduce((sum, item) => sum + item.monthly_cost, 0))} total monthly run-rate`;
    }
    if (bulkButton) {
      const badge = bulkButton.querySelector("span");
      if (badge) {
        badge.textContent = `Potential ${window.api.formatCompactINR(estimatedSavings)}/mo`;
      }
      bulkButton.addEventListener("click", () => {
        window.api.showToast(
          "Recommendations are estimates only. Review them before changing any subscription.",
          "info",
        );
      });
    }

    function renderTable() {
      const filtered = subscriptions
        .filter((subscription) => (
          activeDepartment === "all"
          || subscription.department.toLowerCase() === activeDepartment
        ))
        .filter((subscription) => {
          const query = searchQuery.toLowerCase();
          return !query || [
            subscription.name,
            subscription.vendor,
            subscription.category,
            subscription.department,
            subscription.plan_name,
          ].some((value) => value.toLowerCase().includes(query));
        })
        .sort((left, right) => (
          sortModes[activeSort].compare(left, right) || left.name.localeCompare(right.name)
        ));

      tbody.innerHTML = filtered.map((subscription) => {
        const safe = (value) => window.api.escapeHTML(value);
        const days = window.api.daysUntil(subscription.next_payment_date);
        const dueLabel = subscription.status === "past_due"
          ? "Past due"
          : days === null
            ? "Not scheduled"
            : days === 0
              ? "Due today"
              : days < 0
                ? `${Math.abs(days)} days overdue`
                : `${days} days`;
        const urgent = subscription.status === "past_due" || (days !== null && days <= 7);
        const risk = subscription.risk_level;
        const badgeClass = risk === "high"
          ? "bg-error-container text-on-error-container"
          : risk === "medium"
            ? "bg-secondary-fixed text-on-secondary-fixed"
            : "bg-tertiary-fixed text-on-tertiary-fixed";
        const utilizationClass = subscription.usage_percentage < 70
          ? "bg-error"
          : subscription.usage_percentage < 85
            ? "bg-secondary"
            : "bg-tertiary-container";
        const statusText = subscription.status === "past_due"
          ? "PAYMENT REVIEW"
          : risk === "high"
            ? "HIGH RISK"
            : risk === "medium"
              ? "REVIEW"
              : "HEALTHY";
        const action = subscription.estimated_monthly_savings > 0
          ? `<button type="button" data-review-id="${safe(subscription.id)}" class="px-3 py-1.5 rounded-full bg-primary-container text-on-primary font-headline-sm text-body-sm font-bold brutal-border border-[1.5px] brutal-shadow-sm brutal-btn">Review</button>`
          : '<span class="px-2.5 py-1 text-on-surface-variant font-label-code text-[11px]">No savings flagged</span>';

        return `
          <tr class="table-row-item hover:bg-surface-container-low transition-colors group" data-dept="${safe(subscription.department.toLowerCase())}" data-tool="${safe(subscription.name.toLowerCase())}">
            <td class="py-3.5 px-4">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-surface-container-highest flex items-center justify-center font-bold text-on-surface brutal-border border-[2px]">${safe(subscription.name.slice(0, 1))}</div>
                <div>
                  <span class="font-headline-sm text-body-lg font-bold text-on-surface block">${safe(subscription.name)}</span>
                  <span class="font-label-code text-[11px] text-outline">${safe(subscription.vendor)} • ${safe(subscription.plan_name)}</span>
                </div>
              </div>
            </td>
            <td class="py-3.5 px-4 font-body-sm font-medium text-on-surface"><span class="px-2.5 py-0.5 rounded bg-surface-container-high font-label-code text-[11px] font-semibold">${safe(subscription.department)}</span></td>
            <td class="py-3.5 px-4"><span class="font-label-code text-body-sm font-bold text-on-surface block">${window.api.formatINR(subscription.monthly_cost)}</span><span class="font-label-code text-[10px] text-outline">${safe(subscription.billing_cycle)}</span></td>
            <td class="py-3.5 px-4"><span class="font-label-code text-body-sm font-semibold ${urgent ? "text-error" : "text-on-surface"}">${safe(dueLabel)}</span><span class="block font-label-code text-[10px] text-outline">${window.api.formatDate(subscription.next_payment_date)}</span></td>
            <td class="py-3.5 px-4"><div class="w-24 bg-surface-container-high h-2 rounded-full overflow-hidden brutal-border border-[1px] mb-1"><div class="${utilizationClass} h-full" style="width:${Math.max(0, Math.min(100, subscription.usage_percentage))}%"></div></div><span class="font-label-code text-[11px] text-outline">${subscription.usage_percentage}% active</span></td>
            <td class="py-3.5 px-4 font-label-code text-body-sm"><span class="font-bold text-on-surface">${subscription.active_users}</span> / <span class="text-outline">${subscription.number_of_seats}</span>${subscription.inactive_users > 0 ? `<span class="ml-1 text-error text-[11px] font-bold">(-${subscription.inactive_users})</span>` : ""}</td>
            <td class="py-3.5 px-4"><span class="px-2.5 py-0.5 rounded-full ${badgeClass} font-label-badge text-[10px] font-bold uppercase brutal-border border-[1px]">${statusText}</span><span class="block font-label-code text-[10px] text-outline mt-1">${safe(risk)} risk</span></td>
            <td class="py-3.5 px-4 text-right">${action}</td>
          </tr>`;
      }).join("");

      if (shownCount) shownCount.textContent = `${filtered.length} Shown`;
      tbody.querySelectorAll("[data-review-id]").forEach((button) => {
        button.addEventListener("click", () => {
          const selected = subscriptions.find(
            (subscription) => subscription.id === button.dataset.reviewId,
          );
          if (selected) {
            window.api.showToast(
              `${selected.name}: ${window.api.formatINR(selected.estimated_monthly_savings)}/month estimated opportunity. Review before making changes.`,
              "info",
            );
          }
        });
      });
    }

    filterPills.forEach((pill) => {
      const department = (pill.dataset.dept || "all").toLowerCase();
      const count = department === "all"
        ? subscriptions.length
        : subscriptions.filter((item) => item.department.toLowerCase() === department).length;
      pill.textContent =
        `${department === "all" ? "All" : department[0].toUpperCase() + department.slice(1)} (${count})`;
      pill.addEventListener("click", () => {
        activeDepartment = department;
        filterPills.forEach((item) => {
          item.classList.remove(
            "bg-on-surface",
            "text-surface-container-lowest",
            "brutal-shadow-sm",
            "font-bold",
          );
          item.classList.add("bg-surface-container-low", "text-on-surface");
        });
        pill.classList.remove("bg-surface-container-low", "text-on-surface");
        pill.classList.add(
          "bg-on-surface",
          "text-surface-container-lowest",
          "brutal-shadow-sm",
          "font-bold",
        );
        renderTable();
      });
    });

    searchInput?.addEventListener("input", () => {
      searchQuery = searchInput.value.trim();
      renderTable();
    });
    sortButton?.addEventListener("click", () => {
      activeSort = (activeSort + 1) % sortModes.length;
      if (sortLabel) sortLabel.textContent = `Sorted by: ${sortModes[activeSort].label}`;
      renderTable();
    });
    exportButton?.addEventListener("click", () => {
      const quote = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
      const rows = [
        [
          "ID", "Name", "Vendor", "Department", "Monthly Spend", "Annual Spend",
          "Seats", "Active", "Inactive", "Status", "Renewal Date",
        ].map(quote).join(","),
        ...subscriptions.map((item) => [
          item.id, item.name, item.vendor, item.department, item.monthly_cost,
          item.annual_cost, item.number_of_seats, item.active_users,
          item.inactive_users, item.status, item.renewal_date,
        ].map(quote).join(",")),
      ];
      const blob = new Blob(["\uFEFF", rows.join("\r\n")], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        `${company.name.replace(/\s+/g, "_")}_subscriptions_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      window.api.showToast("Subscription snapshot exported to CSV.", "success");
    });

    renderTable();
  } catch (error) {
    window.api.reportError("Subscriptions", error);
  }
});
