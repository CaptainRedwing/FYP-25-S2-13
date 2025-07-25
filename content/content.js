// To merge the scanners + realtime etc

// Default scanner settings (all true)
const DEFAULT_SCANNERS = { js: true, xss: true, header: true, csrf: true, csp: true, trackers: true };

// Automatically run on page load
chrome.storage.local.get(
  { realtimeEnabled: true, scannersEnabled: DEFAULT_SCANNERS },
  ({ realtimeEnabled, scannersEnabled }) => {
    console.log('[VulnEye] real-time enabled?', realtimeEnabled);
    // If real-time scanning is enabled, run only the enabled scanners
    if (realtimeEnabled) {
      const scans = [];
      if (scannersEnabled.js) scans.push(window.runLibraryScan());
      else scans.push(Promise.resolve([]));
      if (scannersEnabled.xss) scans.push(window.runXSSScan());
      else scans.push(Promise.resolve([]));
      if (scannersEnabled.header) scans.push(window.runHeaderScan());
      else scans.push(Promise.resolve([]));
      if (scannersEnabled.csrf) scans.push(window.runCSRFScan());
      else scans.push(Promise.resolve([]));
      if (scannersEnabled.csp) scans.push(window.runCSPScan());
      else scans.push(Promise.resolve([]));
      if (scannersEnabled.trackers) scans.push(window.runTrackerScan());
      else scans.push(Promise.resolve([]));


      Promise.all(scans)
        .then(([libFindings, xssFindings, headerFindings, csrfFindings, cspFindings, trackerFindings]) => {
          console.log('[VulnEye] auto-scan results', libFindings, xssFindings, headerFindings, csrfFindings, cspFindings, trackerFindings);
          chrome.storage.local.set({
            lastScanResult: { libraries: libFindings, xss: xssFindings, header: headerFindings, csrf: csrfFindings, csp: cspFindings, trackers: trackerFindings }
          });
        })
        .catch(err => {
          console.error('[VulnEye] auto-scan error', err);
        });
    }
  }
);

// On click run manual scan
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('[VulnEye] message received in content.js', msg);
  if (msg.action !== 'runScan') return;

  // Load scanner toggles and run only the enabled scanners
  chrome.storage.local.get(
    { scannersEnabled: DEFAULT_SCANNERS },
    ({ scannersEnabled }) => {
      const scans = [];
      if (scannersEnabled.js) scans.push(window.runLibraryScan());
      else scans.push(Promise.resolve([]));
      if (scannersEnabled.xss) scans.push(window.runXSSScan());
      else scans.push(Promise.resolve([]));
      if (scannersEnabled.header) scans.push(window.runHeaderScan());
      else scans.push(Promise.resolve([]));
      if (scannersEnabled.csrf) scans.push(window.runCSRFScan());
      else scans.push(Promise.resolve([]));
      if (scannersEnabled.csp) scans.push(window.runCSPScan());
      else scans.push(Promise.resolve([]));
      if (scannersEnabled.trackers) scans.push(window.runTrackerScan());
      else scans.push(Promise.resolve([]));

      Promise.all(scans)
        .then(([libraryFindings, xssFindings, headerFindings, csrfFindings, cspFindings, trackerFindings]) => {
          console.log('[VulnEye] manual-scan results', libraryFindings, xssFindings, headerFindings, csrfFindings, cspFindings, trackerFindings);
          sendResponse({ libraries: libraryFindings, xss: xssFindings, header: headerFindings, csrf: csrfFindings, csp: cspFindings, trackers: trackerFindings });
        })
        .catch(error => {
          console.error('Error running scanners:', error);
          sendResponse({ error: error.message });
        });
    }
  );

  // Keep the message channel open for sendResponse
  return true;
});
