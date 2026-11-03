/**
 * Hydrates the company profile and labels PayPal seed data as Sandbox-only.
 */
document.addEventListener("DOMContentLoaded", async () => {
  if (!window.api) return;

  try {
    const [company, paypal, analytics] = await Promise.all([
      window.api.getCompany(),
      window.api.getPayPal(),
      window.api.getAnalytics(),
    ]);
    const assignValue = (id, value) => {
      const element = document.getElementById(id);
      if (element) element.value = value;
    };

    assignValue("settings-company-name", company.name);
    assignValue("settings-employee-count", `${company.employee_count} Employees`);
    assignValue("settings-company-country", company.country);
    const industry = document.getElementById("settings-company-industry");
    if (industry) {
      let option = [...industry.options].find(
        (item) => item.value === company.industry || item.textContent === company.industry,
      );
      if (!option) {
        option = document.createElement("option");
        option.value = company.industry;
        option.textContent = company.industry;
        industry.appendChild(option);
      }
      industry.value = option.value;
    }

    const syncStatus = document.getElementById("settings-sync-status");
    if (syncStatus) {
      syncStatus.textContent =
        `${paypal.environment.toUpperCase()} • ${paypal.sync_status}`;
    }
    const vendorCount = document.getElementById("settings-vendor-count");
    if (vendorCount) {
      vendorCount.textContent = `${analytics.metrics.total_vendors} vendors in snapshot`;
    }
    const lastSync = document.getElementById("settings-last-sync");
    if (lastSync) {
      lastSync.textContent = `Dataset last synced ${window.api.formatDate(paypal.last_sync)}`;
    }

    const syncButton = document.getElementById("syncNowBtn");
    syncButton?.addEventListener("click", () => {
      window.api.showToast(
        "This page is displaying static PayPal Sandbox demo data. Live sync will be available after backend integration.",
        "info",
      );
    });
  } catch (error) {
    window.api.reportError("Company settings", error);
  }
});
