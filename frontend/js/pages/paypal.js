/**
 * PayPal Ledger page controller.
 * Hydrates the sandbox payment summary and filters the transaction history.
 */
document.addEventListener("DOMContentLoaded", async () => {
  if (!window.api) return;

  const body = document.getElementById("paypal-transactions-body");
  const emptyState = document.getElementById("paypal-empty-state");
  const errorState = document.getElementById("paypal-ledger-error");
  const searchInput = document.getElementById("paypal-search");
  const statusFilter = document.getElementById("paypal-status-filter");
  if (!body) return;

  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };
  const escape = (value) => window.api.escapeHTML(value);

  try {
    const [paypal, transactions] = await Promise.all([
      window.api.getPayPal(),
      window.api.getTransactions(),
    ]);

    setText("paypal-total-volume", window.api.formatINR(paypal.total_synced_amount));
    setText("paypal-invoice-count", Number(paypal.invoice_count || 0).toLocaleString("en-IN"));
    setText("paypal-completed-count", Number(paypal.completed_payments || 0).toLocaleString("en-IN"));
    const attentionCount = Number(paypal.pending_payments || 0) + Number(paypal.failed_payments || 0);
    setText("paypal-attention-count", attentionCount.toLocaleString("en-IN"));
    setText(
      "paypal-attention-detail",
      `${Number(paypal.pending_payments || 0)} pending · ${Number(paypal.failed_payments || 0)} failed`,
    );
    setText("paypal-connected-account", paypal.connected_account || "Sandbox account");
    setText("paypal-merchant-id", paypal.merchant_id || "Not available");
    setText("paypal-sync-status", paypal.sync_status || "Unknown");
    setText(
      "paypal-last-sync",
      paypal.last_sync ? new Date(paypal.last_sync).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }) : "Not available",
    );

    const dates = transactions
      .map((transaction) => transaction.date)
      .filter(Boolean)
      .sort();
    const range = dates.length
      ? `${window.api.formatDate(dates[0])} — ${window.api.formatDate(dates[dates.length - 1])} · ${transactions.length.toLocaleString("en-IN")} transactions`
      : "No transactions in this ledger";
    setText("paypal-ledger-range", range);

    const renderTransactions = () => {
      const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
      const status = statusFilter ? statusFilter.value : "all";
      const filtered = transactions
        .filter((transaction) => {
          const transactionStatus = String(transaction.status || "").toLowerCase();
          const matchesStatus = status === "all" || transactionStatus === status;
          const searchable = [
            transaction.vendor,
            transaction.subscription_name,
            transaction.invoice_number,
            transaction.department,
            transaction.payment_method,
          ].join(" ").toLowerCase();
          return matchesStatus && searchable.includes(query);
        })
        .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

      body.innerHTML = filtered.map((transaction) => {
        const statusName = String(transaction.status || "unknown").toLowerCase();
        const statusClass = {
          completed: "bg-tertiary-fixed text-on-tertiary-fixed",
          pending: "bg-primary-fixed text-on-primary-fixed",
          failed: "bg-error-container text-on-error-container",
        }[statusName] || "bg-surface-container text-on-surface-variant";
        const vendor = transaction.vendor || transaction.subscription_name || "Software vendor";
        return `
          <tr>
            <td class="py-3 px-3"><span class="block font-headline text-body-sm font-bold">${escape(vendor)}</span><span class="block font-mono text-[10px] text-outline">${escape(transaction.invoice_number || "Invoice unavailable")}</span></td>
            <td class="py-3 px-3 font-body-sm">${escape(transaction.department || "—")}</td>
            <td class="py-3 px-3 font-body-sm">${escape(transaction.payment_method || transaction.payment_provider || "PayPal Sandbox")}</td>
            <td class="py-3 px-3 font-mono text-[11px]">${escape(window.api.formatDate(transaction.date) || "—")}</td>
            <td class="py-3 px-3"><span class="inline-flex px-2 py-1 rounded-full ${statusClass} font-mono text-[10px] uppercase brutal-border border-[1.5px]">${escape(statusName)}</span></td>
            <td class="py-3 px-3 text-right font-mono text-body-sm font-bold">${escape(window.api.formatINR(transaction.amount))}</td>
          </tr>`;
      }).join("");
      if (emptyState) emptyState.classList.toggle("hidden", filtered.length > 0);
    };

    if (searchInput) searchInput.addEventListener("input", renderTransactions);
    if (statusFilter) statusFilter.addEventListener("change", renderTransactions);
    renderTransactions();

    if (errorState) errorState.classList.add("hidden");
  } catch (error) {
    console.error("[PayPalLedger] Could not load PayPal ledger:", error);
    if (errorState) {
      errorState.textContent = "The PayPal ledger could not be loaded. Refresh the page to retry.";
      errorState.classList.remove("hidden");
    }
    if (emptyState) emptyState.classList.add("hidden");
    window.api.showToast("PayPal ledger data could not be loaded. Please retry.", "error");
  }
});
