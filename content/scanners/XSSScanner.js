// XSS scanner + rules from the json referencing OWASP XSS cheatsheet and DOMPurify
(function() {
  // 1. Load XSS rule metadata
  const rulesPromise = fetch(chrome.runtime.getURL('content/scanners/xssRules.json'))
    .then(res => res.json())
    .catch(err => {
      console.error('[XSSScanner] Failed to load rules, using defaults', err);
      return {};
    });

  // 2. Main scan function
  function runXSSScan() {
    // Ensure rules are loaded before scanning
    return rulesPromise.then(rules => {
      
      const issues = [];

      document.querySelectorAll('*').forEach(el => {
        const tag = el.tagName;

        // ** Rule: inline-event-handler **
        for (const attr of el.attributes) {
          if (/^on\w+/i.test(attr.name)) {
            const rule = rules['inline-event-handler'] || {};
            issues.push({
              type: 'inline-event-handler',
              tag,
              detail: `${attr.name}="${attr.value}"`,
              severity: rule.severity || 'unknown',
              suggestion: rule.suggestion || '',
              references: rule.references || []
            });
          }
        }

        // ** Rule: javascript-uri **
        if (el.matches('a[href^="javascript:"], area[href^="javascript:"]')) {
          const rule = rules['javascript-uri'] || {};
          issues.push({
            type: 'javascript-uri',
            tag,
            detail: `href="${el.getAttribute('href')}"`,
            severity: rule.severity || 'unknown',
            suggestion: rule.suggestion || '',
            references: rule.references || []
          });
        }

        // ** Rule: inline-script **
        if (tag === 'SCRIPT' && el.innerHTML.trim()) {
          const t = el.getAttribute('type') || 'text/javascript';
          if (t.includes('javascript')) {
            const rule = rules['inline-script'] || {};
            issues.push({
              type: 'inline-script',
              tag,
              snippet: el.innerHTML.slice(0, 100).trim(),
              severity: rule.severity || 'unknown',
              suggestion: rule.suggestion || '',
              references: rule.references || []
            });
          }
        }

        // ** Rule: css-javascript **
        if (el.hasAttribute('style') &&
            el.getAttribute('style').toLowerCase().includes('javascript:')) {
          const rule = rules['css-javascript'] || {};
          issues.push({
            type: 'css-javascript',
            tag,
            detail: `style="${el.getAttribute('style')}"`,
            severity: rule.severity || 'unknown',
            suggestion: rule.suggestion || '',
            references: rule.references || []
          });
        }

        // ** Rule: iframe-srcdoc **
        if (tag === 'IFRAME' && el.hasAttribute('srcdoc')) {
          const rule = rules['iframe-srcdoc'] || {};
          issues.push({
            type: 'iframe-srcdoc',
            tag,
            severity: rule.severity || 'unknown',
            suggestion: rule.suggestion || '',
            references: rule.references || []
          });
        }
      });

      return issues;
    });
  }

  // Expose to content.js
  window.runXSSScan = runXSSScan;
})();
