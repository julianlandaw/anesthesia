(() => {
  'use strict';
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
