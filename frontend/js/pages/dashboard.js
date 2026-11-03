/**
 * SpendPilot AI - Dashboard Controller
 * Hydrates KPIs, Executive Intelligence Banner, Recommendations & Live Dynamic AI Copilot Chat.
 * Fully decoupled from page reloads.
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.api) return;

  try {
    const [company, analytics, recs, subs, notifs, paypal, user] = await Promise.all([
      window.api.getCompany(),
      window.api.getAnalytics(),
      window.api.getRecommendations(),
      window.api.getSubscriptions(),
      window.api.getNotifications(),
      window.api.getPayPal(),
      window.api.getUser()
    ]);

    if (!analytics || !company) return;

    // 1. Hydrate Top Intelligence Banner
    const bannerHeading = document.getElementById('dash-banner-heading');
    if (bannerHeading) {
      bannerHeading.innerHTML = `We audited ${analytics.metrics.active_subscriptions} active software subscriptions across ${analytics.metrics.departments} departments: discovered <span class="bg-surface-container-lowest px-2 py-0.5 rounded-lg brutal-border border-[2px] text-primary inline-block rotate-[-0.5deg]">${window.api.formatINR(analytics.metrics.potential_annual_savings)}</span> in immediate reclaimable annual waste.`;
    }

    // 2. Hydrate KPI Metric Cards
    const kpiMonthlySpend = document.getElementById('kpi-monthly-spend');
    if (kpiMonthlySpend) kpiMonthlySpend.textContent = window.api.formatINR(analytics.metrics.monthly_saas_spend);

    const kpiSavings = document.getElementById('kpi-potential-savings');
    if (kpiSavings) kpiSavings.textContent = window.api.formatINR(analytics.metrics.potential_annual_savings);

    const kpiRenewals = document.getElementById('kpi-renewals');
    if (kpiRenewals) kpiRenewals.textContent = `${analytics.metrics.upcoming_renewals_next_30_days} Software`;

    const kpiGhostSeats = document.getElementById('kpi-ghost-seats');
    if (kpiGhostSeats) kpiGhostSeats.textContent = `${analytics.metrics.ghost_licenses} Seats`;

    const kpiPaypalSynced = document.getElementById('kpi-paypal-synced');
    if (kpiPaypalSynced) kpiPaypalSynced.textContent = `${window.api.formatCompactINR(analytics.metrics.monthly_saas_spend)} Synced`;

    // 3. Quick Action Buttons Linking (Prevent reload, use window.location.href)
    const btnAutoNegotiate = document.getElementById('btn-quick-negotiate');
    if (btnAutoNegotiate) btnAutoNegotiate.onclick = (e) => { e.preventDefault(); window.location.href = 'negotiator.html'; };

    const btnGenerateReport = document.getElementById('btn-quick-report');
    if (btnGenerateReport) btnGenerateReport.onclick = (e) => { e.preventDefault(); window.location.href = 'reports.html'; };

    const btnAnalyzePhantom = document.getElementById('btn-quick-phantom');
    if (btnAnalyzePhantom) btnAnalyzePhantom.onclick = (e) => { e.preventDefault(); window.location.href = 'doctor.html'; };

    const btnRunWhatIf = document.getElementById('btn-quick-whatif');
    if (btnRunWhatIf) btnRunWhatIf.onclick = (e) => { e.preventDefault(); window.location.href = 'simulator.html'; };

    // 4. Hydrate High-Impact Recommendations Container
    const recsContainer = document.getElementById('dash-recommendations-container');
    if (recsContainer && recs.length > 0) {
      const topRecs = recs.slice(0, 2);
      recsContainer.innerHTML = topRecs.map(rec => `
        <div class="p-4 rounded-xl bg-surface-container-low brutal-border border-[2px] flex flex-col justify-between gap-3">
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <span class="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-badge text-[10px] font-bold brutal-border border-[1px]">
                SAVE ${window.api.formatINR(rec.estimated_monthly_savings)} / MO
              </span>
              <span class="font-label-code text-[11px] text-outline">${rec.affected_department}</span>
            </div>
            <h4 class="font-headline-sm text-body-lg font-bold text-on-surface">${rec.title}</h4>
            <p class="font-body-sm text-body-sm text-on-surface-variant">${rec.reason}</p>
          </div>
          <button type="button" class="w-full py-2 px-3 rounded-full bg-primary-container text-on-primary font-headline-sm text-body-sm font-bold brutal-border border-[2px] brutal-shadow-sm hover:translate-x-[-1px] hover:translate-y-[-1px] brutal-btn" data-placeholder="This optimization is a demo placeholder; no subscription was changed.">
            Apply 1-Click Optimization
          </button>
        </div>
      `).join('');
    }

    // 5. Dynamic Interactive AI Copilot Chat (NO PAGE RELOADS)
    const chatInput = document.getElementById('dash-chat-input');
    const chatSendBtn = document.getElementById('dash-chat-send');
    const chatMessages = document.getElementById('dash-chat-messages');
    const chatClearBtn = document.getElementById('dash-chat-clear');
    const chatExpandBtn = document.getElementById('dash-chat-expand');
    const quickChips = document.querySelectorAll('.quick-chip');

    function appendMessage(sender, content, options = {}) {
      if (!chatMessages) return null;
      const isAI = sender === 'ai';
      const msgDiv = document.createElement('div');
      msgDiv.className = isAI ? 'flex items-start gap-2.5 animate-fadeIn' : 'flex items-start gap-2.5 justify-end animate-fadeIn';
      const bubbleStyle = isAI
        ? 'p-3.5 rounded-2xl rounded-tl-sm bg-surface-container-lowest brutal-border border-[2px] brutal-shadow-sm text-body-md text-on-surface flex flex-col gap-2'
        : 'p-3.5 rounded-2xl rounded-tr-sm bg-primary-container text-on-primary brutal-border border-[2px] brutal-shadow-sm text-body-md font-medium';
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const avatar = document.createElement('div');
      avatar.className = isAI
        ? 'w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-[12px] font-bold shrink-0 brutal-border border-[1.5px]'
        : 'w-7 h-7 rounded-full bg-secondary text-on-secondary flex items-center justify-center text-[12px] font-bold shrink-0 brutal-border border-[1.5px]';
      if (isAI) {
        avatar.textContent = 'SP';
      } else {
        const initials = (user.name || 'Alex Rivera')
          .split(/\s+/)
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
        avatar.setAttribute('aria-label', user.name || 'User');
        const profileImage = document.createElement('img');
        profileImage.src = 'assets/pfp.jpg';
        profileImage.alt = user.name || 'User profile';
        profileImage.className = 'w-full h-full rounded-full object-cover';
        profileImage.addEventListener('error', () => {
          avatar.textContent = initials;
        }, { once: true });
        avatar.appendChild(profileImage);
      }
      const column = document.createElement('div');
      column.className = isAI
        ? 'flex flex-col gap-1 max-w-[88%]'
        : 'flex flex-col gap-1 items-end max-w-[88%]';
      const bubble = document.createElement('div');
      bubble.className = bubbleStyle;
      if (options.html && isAI) {
        bubble.innerHTML = content;
      } else {
        bubble.textContent = content;
        bubble.style.whiteSpace = 'pre-wrap';
      }
      column.appendChild(bubble);
      const timestamp = document.createElement('span');
      timestamp.className = 'font-label-code text-[10px] text-outline px-1';
      timestamp.textContent = `${timeStr} • ${isAI ? 'Autonomous Intelligence' : user.name}`;
      column.appendChild(timestamp);
      msgDiv.append(isAI ? avatar : column, isAI ? column : avatar);
      if (isAI && options.state) msgDiv.dataset.aiState = options.state;
      if (options.retry) {
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'font-label-code text-[11px] font-bold text-primary underline self-start px-1';
        retry.textContent = 'Retry';
        retry.addEventListener('click', options.retry);
        column.appendChild(retry);
      }
      chatMessages.appendChild(msgDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return msgDiv;
    }

    function resetChatToGreeting() {
      if (!chatMessages) return;
      chatRequestId += 1;
      chatHistory = [];
      chatInFlight = false;
      if (chatSendBtn) chatSendBtn.disabled = false;
      chatMessages.innerHTML = '';
      appendMessage('ai', `
        <p>Hello Alex 👋. I’m SpendPilot’s finance-data assistant for <strong>${window.api.escapeHTML(company.name)}</strong>.</p>
        <p>The supplied demo snapshot has <strong>${analytics.metrics.active_subscriptions} active subscriptions</strong> totaling <strong>${window.api.formatINR(analytics.metrics.monthly_saas_spend)}/mo</strong> across ${analytics.metrics.departments} departments, with <strong class="text-tertiary-container">${window.api.formatINR(analytics.metrics.potential_annual_savings)}</strong> in estimated annual savings opportunities.</p>
        <div class="p-2.5 rounded-xl bg-surface-container-low brutal-border border-[1.5px] flex items-center gap-2 text-body-sm font-label-code">
          <span class="material-symbols-outlined text-tertiary-container text-[18px]">verified</span>
          <span>Business health: <strong>${analytics.metrics.business_health_score ?? company.health_score}/100</strong> • estimates use the demo dataset</span>
        </div>
      `, { html: true });
    }

    let chatHistory = [];
    let chatRequestId = 0;
    let chatInFlight = false;
    const aiContext = () => ({
      company: { name: company.name, industry: company.industry },
      metrics: analytics.metrics,
      paypal: {
        invoice_count: paypal.invoice_count,
        total_synced_amount: paypal.total_synced_amount,
        currency: paypal.currency,
        completed_payments: paypal.completed_payments,
        pending_payments: paypal.pending_payments,
        failed_payments: paypal.failed_payments,
        recent_payments: paypal.recent_payments.slice(0, 5).map((payment) => ({
          subscription_name: payment.subscription_name,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          date: payment.date,
          department: payment.department,
        })),
      },
      subscriptions: subs.map((subscription) => ({
        name: subscription.name,
        department: subscription.department,
        monthly_cost: subscription.monthly_cost,
        annual_cost: subscription.annual_cost,
        number_of_seats: subscription.number_of_seats,
        active_users: subscription.active_users,
        inactive_users: subscription.inactive_users,
        usage_percentage: subscription.usage_percentage,
        renewal_date: subscription.renewal_date,
        risk_level: subscription.risk_level,
        status: subscription.status,
        estimated_monthly_savings: subscription.estimated_monthly_savings,
        estimated_annual_savings: subscription.estimated_annual_savings,
        duplicate_tool_group: subscription.duplicate_tool_group,
      })),
      recommendations: recs
        .slice()
        .sort((left, right) => (
          right.estimated_annual_savings - left.estimated_annual_savings
        ))
        .slice(0, 5)
        .map((recommendation) => ({
        title: recommendation.title,
        affected_department: recommendation.affected_department,
        reason: recommendation.reason,
        estimated_annual_savings: recommendation.estimated_annual_savings,
        estimated_monthly_savings: recommendation.estimated_monthly_savings,
      })),
    });

    async function requestChatAnswer(query, failedMessage) {
      if (chatInFlight) return;
      chatInFlight = true;
      const requestId = ++chatRequestId;
      if (chatSendBtn) chatSendBtn.disabled = true;
      if (failedMessage) failedMessage.remove();
      const typingDiv = document.createElement('div');
      typingDiv.id = 'chat-typing-indicator';
      typingDiv.className = 'flex items-center gap-2 text-outline font-label-code text-[11px] px-8';
      typingDiv.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">smart_toy</span> SpendPilot AI is auditing financial models...`;
      chatMessages.appendChild(typingDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      try {
        const lower = query.toLowerCase();
        const context = aiContext();
        let result;
        if (lower.includes('runway') || lower.includes('cash') || lower.includes('burn') || lower.includes('budget')) {
          result = await window.api.getFinancialInsights({ ...context, question: query });
        } else if (lower.includes('business impact') || lower.includes('impact summary')) {
          result = await window.api.getBusinessImpact({ ...context, question: query });
        } else if (lower.includes('recommendation') || lower.includes('opportunit')) {
          result = await window.api.getBusinessRecommendations({ ...context, question: query });
        } else {
          result = await window.api.chat({
            message: query,
            history: chatHistory.slice(-4),
            context,
          });
        }
        if (requestId !== chatRequestId) return;
        const indicator = document.getElementById('chat-typing-indicator');
        if (indicator) indicator.remove();
        chatHistory.push(
          { role: 'user', content: query },
          { role: 'assistant', content: result.message.slice(0, 2_000) },
        );
        chatHistory = chatHistory.slice(-8);
        appendMessage('ai', result.message, { state: 'success' });
      } catch (error) {
        if (requestId !== chatRequestId) return;
        const indicator = document.getElementById('chat-typing-indicator');
        if (indicator) indicator.remove();
        let failure;
        failure = appendMessage('ai', error.message, {
          state: 'error',
          retry: () => requestChatAnswer(query, failure),
        });
        window.api.showToast(`AI response failed: ${error.message}`, 'error');
      } finally {
        if (requestId === chatRequestId) {
          chatInFlight = false;
          if (chatSendBtn) chatSendBtn.disabled = false;
        }
      }
    }

    function handleChatQuery(text) {
      const query = (text || (chatInput ? chatInput.value : '')).trim();
      if (!query || chatInFlight) return;
      appendMessage('user', query);
      if (chatInput) chatInput.value = '';
      requestChatAnswer(query);
    }

    // Bind chat events with explicit preventDefault()
    if (chatSendBtn) {
      chatSendBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleChatQuery();
      };
    }

    if (chatInput) {
      chatInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          handleChatQuery();
        }
      };
    }

    // Bind quick chips with explicit preventDefault()
    quickChips.forEach(chip => {
      chip.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const query = chip.getAttribute('data-query');
        if (query) handleChatQuery(query);
      };
    });

    // Bind clear & expand
    if (chatClearBtn) {
      chatClearBtn.onclick = (e) => {
        e.preventDefault();
        resetChatToGreeting();
        window.api.showToast('Conversation reset to real-time status', 'info');
      };
    }

    if (chatExpandBtn) {
      chatExpandBtn.onclick = (e) => {
        e.preventDefault();
        const panel = chatExpandBtn.closest('.lg\\:col-span-5');
        if (panel) {
          panel.classList.toggle('lg:col-span-12');
          window.api.showToast('Toggled Copilot full-width view', 'info');
        }
      };
    }

    // Initialize greeting on load
    resetChatToGreeting();

  } catch (err) {
    console.error('[DashboardController] Error hydrating dashboard:', err);
  }
});
