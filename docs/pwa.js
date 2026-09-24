(() => {
  'use strict';

  const SOURCE_REVIEW_DATE = 'September 23, 2026';
  const NEXT_REVIEW_DATE = 'December 23, 2026';

  function addClinicalStatus() {
    const footer = document.querySelector('footer, .footer');
    if (!footer || document.getElementById('clinicalStatus')) return;
    const status = document.createElement('span');
    status.id = 'clinicalStatus';
    status.className = 'clinical-status';
    status.title = `Next scheduled clinical source review: ${NEXT_REVIEW_DATE}`;
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const update = () => {
      status.textContent = navigator.onLine
        ? `Sources reviewed ${SOURCE_REVIEW_DATE} • Online`
        : `Offline copy • Sources reviewed ${SOURCE_REVIEW_DATE}`;
      status.classList.toggle('offline', !navigator.onLine);
    };
    footer.append(status);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addClinicalStatus);
  else addClinicalStatus();

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

    navigator.serviceWorker.addEventListener('controllerchange', showUpdateNotice);
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((error) => {
        console.warn('Offline support could not be enabled.', error);
      });
    });
  }
})();
