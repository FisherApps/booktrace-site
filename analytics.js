(() => {
  const measurementId = 'G-6KKHMR7384';
  const consentKey = 'booktrace_analytics_consent';
  let loaded = false;
  let calculatorTimer;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };

  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });

  function readConsent() {
    try { return window.localStorage.getItem(consentKey); } catch (_) { return null; }
  }

  function saveConsent(value) {
    try { window.localStorage.setItem(consentKey, value); } catch (_) { /* Continue for this page only. */ }
  }

  function loadAnalytics() {
    if (loaded) return;
    loaded = true;
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }

  function track(name, parameters = {}) {
    if (!loaded) return;
    window.gtag('event', name, parameters);
  }

  function dismissBanner(value) {
    saveConsent(value);
    document.querySelector('.analytics-consent')?.remove();
    if (value === 'granted') loadAnalytics();
  }

  function showConsentBanner() {
    const banner = document.createElement('aside');
    banner.className = 'analytics-consent';
    banner.setAttribute('aria-label', 'Analytics preference');
    banner.innerHTML = `
      <div>
        <strong>Help improve Booktrace</strong>
        <p>Allow anonymous website analytics so we can learn which pages lead listeners to the app. No advertising and no book or listening data.</p>
      </div>
      <div class="analytics-consent-actions">
        <button type="button" data-consent="denied">No thanks</button>
        <button type="button" class="allow" data-consent="granted">Allow analytics</button>
      </div>`;
    banner.addEventListener('click', (event) => {
      const choice = event.target.closest('[data-consent]')?.dataset.consent;
      if (choice) dismissBanner(choice);
    });
    document.body.appendChild(banner);
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href*="apps.apple.com"]');
    if (!link) return;
    track('app_store_click', {
      link_url: link.href,
      link_text: link.textContent.trim().replace(/\s+/g, ' ').slice(0, 100),
      page_path: window.location.pathname
    });
  });

  document.addEventListener('input', (event) => {
    if (!event.target.closest('#speed-calculator')) return;
    window.clearTimeout(calculatorTimer);
    calculatorTimer = window.setTimeout(() => {
      const hours = Number(document.querySelector('#hours')?.value) || 0;
      const minutes = Number(document.querySelector('#minutes')?.value) || 0;
      const speed = Number(document.querySelector('#speed')?.value) || 1;
      track('calculator_used', {
        audiobook_minutes: Math.round(hours * 60 + minutes),
        playback_speed: speed
      });
    }, 700);
  });

  const consent = readConsent();
  if (consent === 'granted') loadAnalytics();
  else if (consent !== 'denied') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showConsentBanner);
    else showConsentBanner();
  }
})();
