(() => {
  'use strict';

  const SOURCE_REVIEW_DATE = 'September 24, 2026';
  const NEXT_REVIEW_DATE = 'December 24, 2026';

  function addClinicalStatus() {
    const footer = document.querySelector('footer, .footer');
    if (!footer || document.getElementById('clinicalStatus')) return;
    const status = document.createElement('span');
    status.id = 'clinicalStatus';
    status.className = 'clinical-status';
    status.title = `Next scheduled clinical source review: ${NEXT_REVIEW_DATE}`;
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.textContent = `Sources reviewed ${SOURCE_REVIEW_DATE}`;
    footer.append(status);
  }

  let offlineState = 'Preparing offline access…';
  function renderOfflineStatus() {
    let status = document.getElementById('offlineStatus');
    if (!status) {
      const footer = document.querySelector('footer, .footer') || document.querySelector('main');
      if (!footer) return;
      status = document.createElement('span');
      status.id = 'offlineStatus';
      status.className = 'clinical-status';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      footer.append(status);
    }
    status.textContent = offlineState + (navigator.onLine ? '' : ' • Device appears offline');
    status.dataset.state = offlineState === 'Ready offline' ? 'ready' : offlineState.startsWith('Preparing') ? 'preparing' : 'unavailable';
    status.classList.toggle('offline', !navigator.onLine || status.dataset.state === 'unavailable');
  }
  function initializeStatus() { addClinicalStatus(); renderOfflineStatus(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeStatus);
  else initializeStatus();
  window.addEventListener('online', renderOfflineStatus);
  window.addEventListener('offline', renderOfflineStatus);

  // Make checkbox cards easier to use on touch screens without changing the
  // native checkbox semantics or keyboard behavior.
  document.addEventListener('click', (event) => {
    const row = event.target.closest('.check, .agent');
    if (!row || event.target.closest('input, button, a, label, select, textarea')) return;
    const checkbox = row.querySelector('input[type="checkbox"]');
    if (checkbox && !checkbox.disabled) checkbox.click();
  });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    const hadController = Boolean(navigator.serviceWorker.controller);
    let updateShown = false;

    function showUpdateNotice() {
      if (!hadController || updateShown) return;
      updateShown = true;
      const notice = document.createElement('div');
      notice.className = 'update-notice';
      notice.setAttribute('role', 'status');
      notice.innerHTML = '<span><strong>Toolkit updated.</strong> Reload to use the latest calculators.</span><button type="button">Reload</button>';
      notice.querySelector('button').addEventListener('click', () => location.reload());
      document.body.append(notice);
    }

    async function checkOfflineStatus() {
      let setupTimeout;
      try {
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, reject) => { setupTimeout = setTimeout(() => reject(new Error('Setup timeout')), 15000); })
        ]);
        clearTimeout(setupTimeout);
        const ready = await new Promise((resolve) => {
          const channel = new MessageChannel();
          const timeout = setTimeout(() => { channel.port1.close(); resolve(false); }, 5000);
          channel.port1.onmessage = (event) => {
            clearTimeout(timeout);
            channel.port1.close();
            resolve(event.data?.ready === true);
          };
          registration.active.postMessage({ type: 'OFFLINE_STATUS' }, [channel.port2]);
        });
        offlineState = ready ? 'Ready offline' : 'Offline setup unavailable';
      } catch (_) { offlineState = 'Offline setup unavailable'; }
      finally { clearTimeout(setupTimeout); }
      renderOfflineStatus();
    }

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      showUpdateNotice();
      checkOfflineStatus();
    });
    window.addEventListener('load', async () => {
      try {
        await navigator.serviceWorker.register(new URL('./sw.js', document.baseURI));
        await checkOfflineStatus();
      } catch (_) {
        offlineState = 'Offline setup unavailable';
        renderOfflineStatus();
      }
    });
  } else {
    offlineState = 'Offline setup unavailable';
    renderOfflineStatus();
  }
})();
