/**
 * SpendPilot AI data client.
 * Reads static JSON now and can switch to the versioned API without changing pages.
 */
class SpendPilotAPI {
  constructor() {
    this.cache = new Map();
    this.dataBaseUrl = new URL("data/", document.baseURI);
    const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
    const useLocalBackend = (
      localHosts.has(window.location.hostname)
      && window.location.port !== "8000"
    );
    const defaultApiBase = useLocalBackend
      ? `${window.location.protocol}//${window.location.hostname}:8000/api/`
      : "/api/";
    this.apiBaseUrl = new URL(
      window.SPENDPILOT_API_BASE_URL || defaultApiBase,
      document.baseURI,
    );
  }

  async _fetchJson(filename) {
    if (!this.cache.has(filename)) {
      const request = (async () => {
        const url = new URL(filename, this.dataBaseUrl);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Could not load ${filename}: HTTP ${response.status}`);
        }

        try {
          return await response.json();
        } catch (error) {
          throw new Error(`Invalid JSON in ${filename}: ${error.message}`);
        }
      })();
      this.cache.set(filename, request);
    }

    try {
      return await this.cache.get(filename);
    } catch (error) {
      this.cache.delete(filename);
      throw error;
    }
  }

  async _postAI(endpoint, payload) {
    let response;
    try {
      response = await fetch(new URL(endpoint, this.apiBaseUrl), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(26_000),
      });
    } catch (error) {
      if (error.name === "TimeoutError" || error.name === "AbortError") {
        throw new Error("The AI request took too long. Please try again.");
      }
      throw new Error(
        "Could not reach the SpendPilot AI backend. Check that the backend is running and retry.",
      );
    }

    let responseBody;
    try {
      responseBody = await response.text();
    } catch {
      throw new Error(
        `Could not read the AI backend response (HTTP ${response.status}). Please retry.`,
      );
    }

    if (response.status === 405) {
      throw new Error(
        "The AI request reached a server that does not host the SpendPilot API. Open http://127.0.0.1:8000/dashboard.html so the frontend and AI backend use FastAPI.",
      );
    }

    let result;
    try {
      result = JSON.parse(responseBody);
    } catch {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/html") || /^\s*</.test(responseBody)) {
        throw new Error(
          `The AI request reached a web page instead of the API (HTTP ${response.status}). Open SpendPilot through the FastAPI server at http://127.0.0.1:8000/dashboard.html.`,
        );
      }
      throw new Error(
        `The AI backend returned invalid JSON (HTTP ${response.status}). Restart the FastAPI server and retry.`,
      );
    }
    if (!result || typeof result !== "object") {
      throw new Error(
        `The AI backend returned an unexpected response (HTTP ${response.status}). Restart the FastAPI server and retry.`,
      );
    }
    if (!response.ok || result.success !== true) {
      throw new Error(
        result.message || "The AI service is temporarily unavailable. Please retry.",
      );
    }
    if (
      typeof result.message !== "string"
      || !result.data
      || typeof result.data !== "object"
      || Array.isArray(result.data)
    ) {
      const fields = Object.keys(result).join(", ") || "none";
      throw new Error(
        `The AI backend returned an incomplete response (HTTP ${response.status}; fields: ${fields}). Restart the backend and retry.`,
      );
    }
    return result;
  }

  chat(payload) {
    return this._postAI("chat", payload);
  }

  getAiCfo(context) {
    return this._postAI("ai-cfo", { context });
  }

  getSubscriptionDoctor(context) {
    return this._postAI("subscription-doctor", { context });
  }

  getExecutiveSummary(context) {
    return this._postAI("executive-summary", { context });
  }

  getBusinessImpact(context) {
    return this._postAI("business-impact", { context });
  }

  getNegotiationDraft(context) {
    return this._postAI("ai-negotiator", { context });
  }

  getBusinessRecommendations(context) {
    return this._postAI("recommendations", { context });
  }

  getFinancialInsights(context) {
    return this._postAI("financial-insights", { context });
  }

  async _records(filename, key) {
    const payload = await this._fetchJson(filename);
    const records = payload[key];
    if (!Array.isArray(records)) {
      throw new Error(`Expected "${key}" array in ${filename}`);
    }
    return records;
  }

  async getCompany() {
    const payload = await this._fetchJson("company.json");
    if (!payload.company || typeof payload.company !== "object") {
      throw new Error('Expected "company" object in company.json');
    }
    return payload.company;
  }

  async getUser() {
    const users = await this._records("user.json", "users");
    if (!users[0]) {
      throw new Error("user.json does not contain a demo user");
    }
    return users[0];
  }

  getSubscriptions() {
    return this._records("subscriptions.json", "subscriptions");
  }

  getTransactions() {
    return this._records("transactions.json", "transactions");
  }

  async getAnalytics() {
    const payload = await this._fetchJson("analytics.json");
    if (!payload.analytics || typeof payload.analytics !== "object") {
      throw new Error('Expected "analytics" object in analytics.json');
    }
    return payload.analytics;
  }

  async getBusinessHealth() {
    const payload = await this._fetchJson("business_health.json");
    if (!payload.business_health || typeof payload.business_health !== "object") {
      throw new Error('Expected "business_health" object in business_health.json');
    }
    return payload.business_health;
  }

  getDepartments() {
    return this._records("departments.json", "departments");
  }

  getRecommendations() {
    return this._records("recommendations.json", "recommendations");
  }

  getNotifications() {
    return this._records("notifications.json", "notifications");
  }

  getReports() {
    return this._records("reports.json", "reports");
  }

  async getPayPal() {
    const payload = await this._fetchJson("paypal.json");
    if (!payload.paypal || typeof payload.paypal !== "object") {
      throw new Error('Expected "paypal" object in paypal.json');
    }
    return payload.paypal;
  }

  formatINR(amount) {
    if (!Number.isFinite(Number(amount))) {
      return "₹0";
    }
    return `₹${Number(amount).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;
  }

  formatCompactINR(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value)) {
      return "₹0";
    }
    if (value >= 10_000_000) {
      return `₹${(value / 10_000_000).toFixed(1)} Cr`;
    }
    if (value >= 100_000) {
      return `₹${(value / 100_000).toFixed(1)} L`;
    }
    if (value >= 1_000) {
      return `₹${(value / 1_000).toFixed(0)}k`;
    }
    return this.formatINR(value);
  }

  formatDate(dateString) {
    if (!dateString) {
      return "";
    }
    const value = new Date(`${dateString.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(value.getTime())) {
      return "";
    }
    return value.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  daysUntil(dateString) {
    if (!dateString) {
      return null;
    }
    const target = new Date(`${dateString.slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(target.getTime())) {
      return null;
    }
    return Math.ceil((target.getTime() - Date.now()) / 86_400_000);
  }

  escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);
  }

  showToast(message, type = "info") {
    let toast = document.getElementById("spendpilot-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "spendpilot-toast";
      toast.className = "fixed bottom-6 right-6 z-50 transition-all duration-300";
      document.body.appendChild(toast);
    }

    const classes = {
      success: "bg-tertiary-fixed text-on-tertiary-fixed",
      error: "bg-error text-on-error",
      info: "bg-primary-container text-on-primary",
    };
    const icons = { success: "verified", error: "error", info: "info" };
    toast.replaceChildren();

    const content = document.createElement("div");
    content.className = `px-5 py-3 rounded-2xl ${classes[type] || classes.info} brutal-border border-[3px] brutal-shadow flex items-center gap-3`;

    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined text-[20px]";
    icon.textContent = icons[type] || icons.info;

    const text = document.createElement("span");
    text.className = "font-headline-sm text-body-sm font-bold";
    text.textContent = message;

    content.append(icon, text);
    toast.appendChild(content);
    toast.setAttribute("role", type === "error" ? "alert" : "status");

    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      toast.remove();
    }, 3500);
  }

  reportError(context, error) {
    console.error(`[${context}]`, error);
    this.showToast(`${context}: data could not be loaded. Please try again.`, "error");
  }
}

window.api = new SpendPilotAPI();
