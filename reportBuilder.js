/************  VULNEYE PDF EXPORT — EACH SECTION/KEY ON NEW PAGE  ************/

/* Safe escape (use this even if a global escapeHtml exists) */
function _escapeHtml(s = '') {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* Build INNER report HTML (no <html>/<head>) with one PAGE per SECTION (key) */
function buildReportInnerHtml(scanResult) {
  const date  = new Date().toLocaleString();
  const url   = document.getElementById('current-url')?.textContent || '';
  const score = (typeof calculateScore === 'function') ? calculateScore(scanResult) : 'N/A';

  // Cover page
  let html = `
    <h1>VulnEye Security Report</h1>
    <p><strong>Date:</strong> ${_escapeHtml(date)}</p>
    <p><strong>URL Scanned:</strong> ${_escapeHtml(url)}</p>
    <h2>Score: ${_escapeHtml(String(score))}</h2>
  `;

  const sections = [
    { key: 'libraries', title: 'JS Library Vulnerabilities' },
    { key: 'xss',       title: 'XSS Vulnerabilities' },
    { key: 'header',    title: 'HTTP Header Issues' },
    { key: 'csrf',      title: 'CSRF Token Issues' },
    { key: 'csp',       title: 'CSP Status' },
    { key: 'trackers',  title: 'Trackers Detected' }
  ];

  sections.forEach(({ key, title }) => {
    const items = Array.isArray(scanResult[key]) ? scanResult[key] : [];
    if (!items.length) return; // skip empty sections (prevents blank pages)

    // SECTION wrapper → starts on a NEW PAGE
    html += `<section class="report-section section-page"><h2>${_escapeHtml(title)}</h2>`;

    items.forEach(i => {
      html += `<div class="entry">`;

      switch (key) {
        case 'libraries': {
          const lib = i.library || 'Unknown library';
          const ver = i.version || 'N/A';
          const sev = (i.severity || 'LOW').toUpperCase();
          html += `
            <h3>${_escapeHtml(lib)} v${_escapeHtml(ver)}</h3>
            <div class="meta-row">Severity:
              <span class="severity-${sev.toLowerCase()}">${_escapeHtml(sev)}</span>
            </div>
          `;
          const ids  = Array.isArray(i.identifiers) ? i.identifiers : [];
          const sugg = Array.isArray(i.suggestions) ? i.suggestions : [];
          if (ids.length) {
            html += `<ul>`;
            ids.forEach((id, idx) => {
              const s = sugg[idx] || '';
              html += `
                <li>
                  <div><strong>${_escapeHtml(id)}</strong></div>
                  ${s ? `<div class="suggestion"><strong>Suggestion:</strong> ${_escapeHtml(s)}</div>` : ''}
                </li>
              `;
            });
            html += `</ul>`;
          }
          break;
        }

        case 'xss': {
          const type = i.type || 'XSS';
          const tag  = (i.tag || '').toLowerCase();
          const sev  = (i.severity || 'LOW').toUpperCase();
          html += `
            <h3>${_escapeHtml(type)}</h3>
            <div class="meta-row">
              Tag: &lt;${_escapeHtml(tag)}&gt; |
              Severity: <span class="severity-${sev.toLowerCase()}">${_escapeHtml(sev)}</span>
            </div>
          `;
          if (i.snippet)    html += `<div class="labeled-row"><div class="label">Code Snippet</div><div class="content"><pre>${_escapeHtml(i.snippet)}</pre></div></div>`;
          if (i.suggestion) html += `<div class="labeled-row"><div class="label">Suggestion</div><div class="content">${_escapeHtml(i.suggestion)}</div></div>`;
          (i.references || []).forEach(ref => {
            html += `<div class="labeled-row"><div class="label">Reference</div><div class="content"><a href="${ref}" target="_blank">${_escapeHtml(ref)}</a></div></div>`;
          });
          break;
        }

        case 'header':
        case 'csrf': {
          const type = i.type || (key === 'header' ? 'HTTP Header' : 'CSRF');
          const tag  = i.tag ? String(i.tag).toLowerCase() : '';
          const sev  = (i.severity || 'LOW').toUpperCase();
          html += `
            <h3>${_escapeHtml(type)}</h3>
            <div class="meta-row">
              Tag: &lt;${tag ? _escapeHtml(tag) : '&gt;&lt;'}&gt; |
              Severity: <span class="severity-${sev.toLowerCase()}">${_escapeHtml(sev)}</span>
            </div>
          `;
          if (i.detail)     html += `<div class="labeled-row"><div class="label">Detail</div><div class="content">${_escapeHtml(i.detail)}</div></div>`;
          if (i.suggestion) html += `<div class="labeled-row"><div class="label">Suggestion</div><div class="content">${_escapeHtml(i.suggestion)}</div></div>`;
          if (i.reference)  html += `<div class="labeled-row"><div class="label">Reference</div><div class="content"><a href="${i.reference}" target="_blank">${_escapeHtml(i.reference)}</a></div></div>`;
          break;
        }

        case 'csp': {
          const enforced = i.exists ? 'Yes' : 'No';
          html += `
            <h3>CSP Policy</h3>
            <div class="labeled-row"><div class="label">Enforced</div><div class="content">${enforced}</div></div>
          `;
          if (i.exists && i.method)
            html += `<div class="labeled-row"><div class="label">Method</div><div class="content">${_escapeHtml(i.method)}</div></div>`;
          break;
        }

        case 'trackers': {
          const name = i.tracker || 'Tracker';
          const sev  = (i.severity || 'LOW').toUpperCase();
          html += `<h3>${_escapeHtml(name)}</h3>`;
          html += `
            <div class="labeled-row"><div class="label">Severity</div><div class="content"><span class="severity-${sev.toLowerCase()}">${_escapeHtml(sev)}</span></div></div>
            <div class="labeled-row"><div class="label">URL</div><div class="content">${_escapeHtml(i.url || '')}</div></div>
            <div class="labeled-row"><div class="label">Details</div><div class="content">${_escapeHtml(i.summary || '')}</div></div>
            <div class="labeled-row"><div class="label">Suggestion</div><div class="content">${_escapeHtml(i.suggestion || '')}</div></div>
          `;
          (i.references || []).forEach(ref => {
            html += `<div class="labeled-row"><div class="label">Reference</div><div class="content"><a href="${ref}" target="_blank">${_escapeHtml(ref)}</a></div></div>`;
          });
          break;
        }
      }

      html += `</div>`; // .entry
    });

    html += `</section>`; // end section page
  });

  return html;
}

/* Styles + page rules — each SECTION starts on a NEW PAGE; entries avoid splitting */
const REPORT_CSS = `
  * { font-family: Arial, sans-serif !important; }
  body { background: #cee6f2; color: #222; padding: 30px; font-size: 14px; }
  h1 { background: #1995AD; color: white; padding: 12px; font-size: 22px; border-radius: 8px; margin-bottom: 24px; }
  h2 { font-size: 18px; font-weight: 600; border-left: 4px solid #1995AD; background: #f1f1f2; padding: 10px 16px; margin: 20px 0 10px; border-radius: 4px; letter-spacing: 0.5px; }

  .report-section { margin-top: 10px; }
  .section-page { break-before: page; page-break-before: always; } /* << one page per key */

  .entry {
    background: #ffffff; border: 1px solid #ddd; border-radius: 6px; margin-top: 14px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.08); overflow: hidden;
    break-inside: avoid; page-break-inside: avoid; /* avoid splitting single issue boxes */
    -webkit-box-decoration-break: clone; box-decoration-break: clone;
  }
  .entry h3 { background: #f1f1f2; margin: 0; padding: 10px 14px; font-size: 16px; font-weight: 600; border-bottom: 1px solid #ddd; letter-spacing: 1.1px; }
  .meta-row { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: #f1f1f2; font-weight: 600; border-bottom: 1px solid #ddd; }
  .labeled-row { display: flex; width: 100%; min-height: 40px; align-items: stretch; border-top: 1px solid #ddd; }
  .label, .content { word-break: break-word; overflow-wrap: break-word; white-space: normal; }
  .label { flex: 0 0 28%; min-width: 120px; background: #c3c1c1; font-size: 14px; font-weight: 600; color: #384247; padding: 10px; display: flex; align-items: center; justify-content: center; text-align: center; letter-spacing: 1.2px; }
  .content { flex: 0 0 72%; background: #f1f1f2; padding: 10px 20px 10px 10px; font-size: 14px; font-weight: 500; letter-spacing: 1.05px; line-height: 1.4; }
  pre { font-family: Arial, sans-serif !important; background: #f7f7f7; padding: 10px; margin: 0; font-size: 13px; white-space: pre-wrap; border: none; }
  ul { margin: 10px 20px; padding-left: 18px; font-size: 14px; }
  ul li { margin-bottom: 12px; }
  ul li div { margin: 4px 0; }
  .suggestion { background: #f0f9f0; color: black; border-left: 4px solid #85BAC6; padding: 10px 12px; border-radius: 4px; font-size: 13px; }

  .severity-high { color: #822622; font-weight: bold; }
  .severity-medium, .severity-moderate { color: #e3867d; font-weight: bold; }
  .severity-low { color: #a1d6e2; font-weight: bold; }

  @media print {
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

/* Export (honors CSS page breaks; avoids popup scroll clipping) */
async function exportReportAsPdf() {
  try {
    if (!lastScanResult) return alert("No scan results available.");
    if (typeof html2pdf === 'undefined') {
      console.error('[PDF Export] html2pdf not loaded');
      return alert('Export dependency missing. Check libs/html2pdf.bundle.min.js path.');
    }

    const wrapper = document.createElement('div');
    wrapper.id = 'vulneye-report-wrapper';
    wrapper.style.padding = '24px';

    const styleEl = document.createElement('style');
    styleEl.textContent = REPORT_CSS;
    wrapper.appendChild(styleEl);

    const inner = document.createElement('div');
    inner.innerHTML = buildReportInnerHtml(lastScanResult);
    wrapper.appendChild(inner);

    document.body.appendChild(wrapper);
    await new Promise(r => setTimeout(r, 60));

    const opt = {
      margin: 0.5,
      filename: 'vulneye-report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      pagebreak: { mode: ['css', 'legacy'] }, // respects .section-page
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().from(wrapper).set(opt).save();
    wrapper.remove();
  } catch (e) {
    console.error('[PDF Export] Failed:', e);
    alert('Failed to export PDF: ' + e.message);
  }
}

/* Bind button when DOM is ready */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('export-pdf')?.addEventListener('click', exportReportAsPdf);
});
