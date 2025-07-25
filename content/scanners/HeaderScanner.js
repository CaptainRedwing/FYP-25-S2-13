(function () {
  const WHITELIST = new Set([
    'youtube.com',
    'www.youtube.com',
    'mail.google.com',
    'accounts.google.com'
  ]);

  // Load header rules from JSON
  const rulesPromise = fetch(chrome.runtime.getURL('content/scanners/headerRules.json'))
    .then(res => res.json())
    .catch(err => {
      console.error('[HeaderScanner] Failed to load rules:', err);
      return {};
    });

  function runHeaderScan() {
    if (WHITELIST.has(window.location.hostname)) {
      return Promise.resolve([]);
    }

    const issues = [];

    return rulesPromise.then(HEADER_RULES => {
      return fetch(location.href, { method: 'HEAD', mode: 'same-origin' })
        .then(res => {
          const checks = [
            {
              header: "strict-transport-security",
              type: "missing-hsts",
              check: value => {
                if (!value) return { valid: false, detail: "Missing header: Strict-Transport-Security" };
                if (!/max-age=\d+/.test(value)) return { valid: false, detail: `Weak HSTS config: ${value}` };
                return { valid: true };
              }
            },
            {
              header: "x-frame-options",
              type: "missing-xfo",
              check: value => {
                if (!value) return { valid: false, detail: "Missing header: X-Frame-Options" };
                if (!/^(DENY|SAMEORIGIN)$/i.test(value)) return { valid: false, detail: `Insecure value: ${value}` };
                return { valid: true };
              }
            },
            {
              header: "x-content-type-options",
              type: "missing-xcto",
              check: value => {
                return value?.toLowerCase() === 'nosniff'
                  ? { valid: true }
                  : { valid: false, detail: value ? `Unexpected value: ${value}` : "Missing header: X-Content-Type-Options" };
              }
            },
            {
              header: "referrer-policy",
              type: "missing-referrer-policy",
              check: value => {
                return value
                  ? { valid: true }
                  : { valid: false, detail: "Missing header: Referrer-Policy" };
              }
            },
            {
              header: "permissions-policy",
              type: "missing-permissions-policy",
              check: value => {
                return value
                  ? { valid: true }
                  : { valid: false, detail: "Missing header: Permissions-Policy" };
              }
            },
            {
              header: "x-xss-protection",
              type: "missing-xss-protection",
              check: value => {
                return value?.includes("1")
                  ? { valid: true }
                  : { valid: false, detail: value ? `Disabled or misconfigured: ${value}` : "Missing header: X-XSS-Protection" };
              }
            }
          ];

          for (const { header, type, check } of checks) {
            const value = res.headers.get(header);
            const result = check(value);

            if (!result.valid) {
              const rule = HEADER_RULES[type] || {};

              issues.push({
                type,
                tag: 'HEADER',
                detail: result.detail,
                suggestion: rule.suggestion || '',
                severity: rule.severity || 'UNSPECIFIED',
                reference: rule.reference || 'No reference available'
              });
            }
          }

          return issues;
        })
        .catch(err => {
          const fallback = HEADER_RULES["scanner-error"] || {};
          return [{
            type: 'scanner-error',
            tag: 'HEADER',
            detail: err.message,
            suggestion: fallback.suggestion || 'Scanner encountered an error.',
            severity: fallback.severity || 'MEDIUM',
            reference: fallback.reference || 'No reference available'
          }];
        });
    });
  }

  window.runHeaderScan = runHeaderScan;
})();
