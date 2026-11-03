/**
 * Renders executive reports from reports.json and wires local search and filters.
 */
function openPrintableReport(title, content) {
  const popup = window.open("", "_blank");
  if (!popup) {
    window.api.showToast(
      "Allow pop-ups to open the print-ready report, then choose Save as PDF.",
      "error",
    );
    return;
  }

  popup.document.open();
  popup.document.write(`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${window.api.escapeHTML(title)}</title>
        <style>
          body { max-width: 900px; margin: 40px auto; padding: 0 24px; color: #18181b; font: 15px/1.6 Arial, sans-serif; }
          h1, h2 { line-height: 1.2; }
          h1 { border-bottom: 3px solid #18181b; padding-bottom: 12px; }
          section { break-inside: avoid; border: 1px solid #bbb; border-radius: 12px; margin: 20px 0; padding: 20px; }
          dl { display: grid; grid-template-columns: 1fr auto; gap: 8px 20px; }
          dt { color: #555; } dd { margin: 0; font-weight: bold; text-align: right; }
          .note { color: #555; font-size: 12px; }
          @media print { body { margin: 0; max-width: none; } section { break-inside: avoid; } }
        </style>
      </head>
      <body><h1>${window.api.escapeHTML(title)}</h1>
        <p class="note">SpendPilot AI demo report · Based on the supplied dataset; estimates only.</p>
        ${content}
      </body>
    </html>`);
  popup.document.close();
  popup.focus();
  window.setTimeout(() => popup.print(), 250);
  window.api.showToast("Print dialog opened. Choose Save as PDF to download.", "info");
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!window.api) return;

  try {
    const [reports, company] = await Promise.all([
      window.api.getReports(),
      window.api.getCompany(),
    ]);
    const grid = document.getElementById("reportsGrid");
    const search = document.getElementById("reportSearchInput");
    const filterButtons = [...document.querySelectorAll(".filter-btn")];
    if (!grid) throw new Error("Executive report grid is missing");

    let activeCategory = "all";
    let query = "";

    function reportTags(report) {
      const text = `${report.title} ${report.summary}`.toLowerCase();
      const tags = ["board", "spend"];
      if (/negotiat|vendor contract/.test(text)) tags.push("negotiation");
      return tags;
    }

    function render() {
      const visibleReports = reports.filter((report) => {
        const tags = reportTags(report);
        const matchesCategory =
          activeCategory === "all" || tags.includes(activeCategory);
        const matchesQuery =
          !query
          || `${report.month} ${report.title} ${report.summary}`
            .toLowerCase()
            .includes(query);
        return matchesCategory && matchesQuery;
      });

      grid.replaceChildren();
      visibleReports.forEach((report) => {
        const card = document.createElement("article");
        card.className =
          "report-card bg-surface-container-lowest rounded-[20px] brutal-border brutal-shadow flex flex-col justify-between transition-transform";
        card.dataset.tags = reportTags(report).join(",");

        const content = document.createElement("div");
        content.className = "p-space-md";
        const header = document.createElement("div");
        header.className = "flex items-center justify-between mb-space-sm";
        const month = document.createElement("span");
        month.className =
          "px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-badge text-label-badge uppercase tracking-wider brutal-border border-[2px]";
        month.textContent = report.month;
        const status = document.createElement("span");
        status.className =
          "px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-code text-[11px] font-bold brutal-border border-[1.5px]";
        status.textContent = report.status;
        header.append(month, status);

        const title = document.createElement("h2");
        title.className =
          "font-headline-sm text-headline-sm text-on-surface mb-2";
        title.textContent = report.title;
        const summary = document.createElement("p");
        summary.className =
          "font-body-md text-body-md text-on-surface-variant line-clamp-3 mb-space-md";
        summary.textContent = report.summary;

        const metrics = document.createElement("div");
        metrics.className =
          "p-3 rounded-xl bg-surface-container-low brutal-border border-[2px] mb-space-sm flex flex-col gap-1.5";
        const metricRows = [
          ["PayPal Sandbox outflow", window.api.formatINR(report.cash_outflow)],
          ["Annual savings opportunity", window.api.formatINR(report.savings.estimated_annual_opportunity_current_audit)],
          ["Completed invoices", String(report.completed_invoice_count)],
        ];
        metricRows.forEach(([label, value]) => {
          const row = document.createElement("div");
          row.className = "flex justify-between items-center text-body-sm";
          const labelElement = document.createElement("span");
          labelElement.className = "text-on-surface-variant";
          labelElement.textContent = label;
          const valueElement = document.createElement("span");
          valueElement.className = "font-label-code font-bold text-on-surface";
          valueElement.textContent = value;
          row.append(labelElement, valueElement);
          metrics.appendChild(row);
        });

        const generated = document.createElement("div");
        generated.className =
          "font-label-code text-[11px] text-outline pt-2 border-t-[1.5px] border-surface-container-highest";
        generated.textContent =
          `Generated ${window.api.formatDate(report.generated_date)}`;
        content.append(header, title, summary, metrics, generated);

        const actions = document.createElement("div");
        actions.className = "p-space-md pt-0 flex items-center gap-2";
        const preview = document.createElement("button");
        preview.type = "button";
        preview.className =
          "flex-1 py-2 px-3 rounded-full bg-surface-container-low text-on-surface font-headline-sm text-body-sm brutal-border border-[2px] hover:bg-surface-container flex items-center justify-center gap-1.5";
        preview.textContent = "Preview summary";
        preview.addEventListener("click", async () => {
          if (preview.disabled) return;
          const originalSummary = summary.textContent;
          preview.disabled = true;
          preview.textContent = "Generating…";
          summary.textContent = "Generating an executive summary from this report…";
          try {
            const result = await window.api.getExecutiveSummary({
              company: { name: company.name, industry: company.industry },
              report: {
                month: report.month,
                title: report.title,
                summary: report.summary,
                cash_outflow: report.cash_outflow,
                completed_invoice_count: report.completed_invoice_count,
                savings: report.savings,
              },
            });
            summary.textContent = result.message;
            window.api.showToast("Executive summary is ready.", "success");
          } catch (error) {
            summary.textContent = originalSummary;
            window.api.showToast(`Executive summary failed: ${error.message}`, "error");
          } finally {
            preview.disabled = false;
            preview.textContent = "Preview summary";
          }
        });

        const download = document.createElement("button");
        download.type = "button";
        download.className =
          "flex-1 py-2 px-3 rounded-full bg-primary-container text-on-primary font-headline-sm text-body-sm brutal-border border-[2px] brutal-shadow-sm flex items-center justify-center gap-1.5";
        download.textContent = "Print / Save PDF";
        download.addEventListener("click", () => {
          const metrics = `
            <section>
              <h2>${window.api.escapeHTML(report.title)} — ${window.api.escapeHTML(report.month)}</h2>
              <p>${window.api.escapeHTML(report.summary)}</p>
              <dl>
                <dt>PayPal sandbox outflow</dt><dd>${window.api.formatINR(report.cash_outflow)}</dd>
                <dt>Annual savings opportunity</dt><dd>${window.api.formatINR(report.savings.estimated_annual_opportunity_current_audit)}</dd>
                <dt>Completed invoices</dt><dd>${window.api.escapeHTML(report.completed_invoice_count)}</dd>
              </dl>
              <p class="note">Generated ${window.api.escapeHTML(window.api.formatDate(report.generated_date))}</p>
            </section>`;
          openPrintableReport(
            `${report.month} ${report.title}`,
            metrics,
          );
        });
        actions.append(preview, download);
        card.append(content, actions);
        grid.appendChild(card);
      });

      const allReportsButton = filterButtons.find(
        (button) => button.dataset.category === "all",
      );
      if (allReportsButton) {
        allReportsButton.textContent = `All Reports (${reports.length})`;
      }
      grid.setAttribute("aria-live", "polite");
    }

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeCategory = button.dataset.category || "all";
        filterButtons.forEach((item) => {
          item.classList.remove("active", "bg-on-surface", "text-surface-container-lowest", "brutal-shadow-sm");
          item.classList.add("bg-surface-container-lowest", "text-on-surface");
        });
        button.classList.remove("bg-surface-container-lowest", "text-on-surface");
        button.classList.add("active", "bg-on-surface", "text-surface-container-lowest", "brutal-shadow-sm");
        render();
      });
    });
    search?.addEventListener("input", () => {
      query = search.value.trim().toLowerCase();
      render();
    });
    document.getElementById("exportBoardDeckBtn")?.addEventListener("click", () => {
      const content = reports.map((report) => `
        <section>
          <h2>${window.api.escapeHTML(report.title)} — ${window.api.escapeHTML(report.month)}</h2>
          <p>${window.api.escapeHTML(report.summary)}</p>
          <dl>
            <dt>PayPal sandbox outflow</dt><dd>${window.api.formatINR(report.cash_outflow)}</dd>
            <dt>Annual savings opportunity</dt><dd>${window.api.formatINR(report.savings.estimated_annual_opportunity_current_audit)}</dd>
            <dt>Completed invoices</dt><dd>${window.api.escapeHTML(report.completed_invoice_count)}</dd>
          </dl>
        </section>`).join("");
      openPrintableReport(`${company.name} — Executive Board Deck`, content);
    });

    render();
  } catch (error) {
    window.api.reportError("Executive reports", error);
  }
});
