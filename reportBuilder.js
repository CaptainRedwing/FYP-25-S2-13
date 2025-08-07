
function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildFullReportHtml(scanResult) {
  const date  = new Date().toLocaleString();
  const url   = document.getElementById('current-url')?.textContent || '';
  const plan  = document.querySelector('.plan-container small')?.textContent.replace('Plan:', '').trim() || 'Free';
  const score = typeof calculateScore === 'function' ? calculateScore(scanResult) : 'N/A';

  const sections = [
    { key: 'libraries', title: 'JS Library Vulnerabilities' },
    { key: 'xss',       title: 'XSS Vulnerabilities' },
    { key: 'header',    title: 'HTTP Header Issues' },
    { key: 'csrf',      title: 'CSRF Token Issues' },
    { key: 'csp',       title: 'CSP Status' },
    { key: 'trackers',  title: 'Trackers Detected' }
  ];

  let contentHtml = '';
  sections.forEach(({ key, title }) => {
    contentHtml += `<h2>${title}</h2>`;
    const items = scanResult[key] || [];

    if (!items.length) {
      contentHtml += `<p>No issues detected in ${title.toLowerCase()}.</p>`;
    } else {
      items.forEach(i => {
        contentHtml += `<div class="entry">`;

        switch (key) {
          case 'libraries':
            contentHtml += `
              <h3>${i.library} v${i.version}</h3>
              <div class="meta-row">
                Severity: <span class="severity-${i.severity.toLowerCase()}">${escapeHtml(i.severity.toUpperCase())}</span>
              </div>
            `;

            contentHtml += `<ul>`;
            i.identifiers.forEach((id, idx) => {
              contentHtml += `
                <li>
                  <div><strong>${escapeHtml(id)}</strong></div>
                  <div class="suggestion"><strong>Suggestion:</strong> ${escapeHtml(i.suggestions[idx])}</div>
                </li>
              `;
            });
            contentHtml += `</ul>`;

            break;

          case 'xss':
            contentHtml += `
              <h3>${escapeHtml(i.type)}</h3>
              <div class="meta-row">
                Tag: &lt;${escapeHtml(i.tag.toLowerCase())}&gt;
                | Severity: <span class="severity-${i.severity.toLowerCase()}">${escapeHtml(i.severity)}</span>
              </div>
            `;
            if (i.snippet) {
              contentHtml += `
                <div class="labeled-row">
                  <div class="label">Code Snippet</div>
                  <div class="content"><pre>${escapeHtml(i.snippet)}</pre></div>
                </div>
              `;
            }
            if (i.suggestion) {
              contentHtml += `
                <div class="labeled-row">
                  <div class="label">Suggestion</div>
                  <div class="content">${escapeHtml(i.suggestion)}</div>
                </div>
              `;
            }
            if (i.references?.length) {
              i.references.forEach(ref => {
                contentHtml += `
                  <div class="labeled-row">
                    <div class="label">Reference</div>
                    <div class="content"><a href="${ref}" target="_blank">${escapeHtml(ref)}</a></div>
                  </div>
                `;
              });
            }
            break;

          case 'header':
          case 'csrf':
            contentHtml += `<h3>${escapeHtml(i.type)}</h3>`;
            contentHtml += `
              <div class="meta-row">
                Tag: &lt;${i.tag ? escapeHtml(i.tag.toLowerCase()) : '&gt;&lt;'}&gt; |
                Severity: <span class="severity-${i.severity.toLowerCase()}">${escapeHtml(i.severity)}</span>
              </div>
            `;
            if (i.detail) contentHtml += `<div class="labeled-row"><div class="label">Detail</div><div class="content">${escapeHtml(i.detail)}</div></div>`;
            if (i.suggestion) contentHtml += `<div class="labeled-row"><div class="label">Suggestion</div><div class="content">${escapeHtml(i.suggestion)}</div></div>`;
            if (i.reference) contentHtml += `<div class="labeled-row"><div class="label">Reference</div><div class="content"><a href="${i.reference}" target="_blank">${i.reference}</a></div></div>`;
            break;

          case 'csp':
            contentHtml += `
              <h3>CSP Policy</h3>
              <div class="labeled-row"><div class="label">Enforced</div><div class="content">${i.exists ? 'Yes' : 'No'}</div></div>
            `;
            if (i.exists) contentHtml += `<div class="labeled-row"><div class="label">Method</div><div class="content">${escapeHtml(i.method)}</div></div>`;
            break;

          case 'trackers':
            contentHtml += `<h3>${escapeHtml(i.tracker)}</h3>`;
            contentHtml += `
              <div class="labeled-row"><div class="label">Severity</div><div class="content"><span class="severity-${i.severity.toLowerCase()}">${escapeHtml(i.severity)}</span></div></div>
              <div class="labeled-row"><div class="label">URL</div><div class="content">${escapeHtml(i.url)}</div></div>
              <div class="labeled-row"><div class="label">Details</div><div class="content">${escapeHtml(i.summary)}</div></div>
              <div class="labeled-row"><div class="label">Suggestion</div><div class="content">${escapeHtml(i.suggestion)}</div></div>
            `;
            if (i.references?.length) {
              i.references.forEach(ref => {
                contentHtml += `<div class="labeled-row"><div class="label">Reference</div><div class="content"><a href="${ref}" target="_blank">${escapeHtml(ref)}</a></div></div>`;
              });
            }
            break;
        }

        contentHtml += `</div>`;
      });
    }
  });

  return `<!doctype html><html><head><meta charset="utf-8">
  <style>
    * { font-family: Arial, sans-serif !important; }
    body { background: #cee6f2; color: #222; padding: 30px; font-size: 14px; }
    h1 { background: #1995AD; color: white; padding: 12px; font-size: 22px; border-radius: 8px; margin-bottom: 24px; }
    h2 { font-size: 18px; font-weight: 600; border-left: 4px solid #1995AD; background: #f1f1f2; padding: 10px 16px; margin: 20px 0 10px; border-radius: 4px; letter-spacing: 0.5px; }
    .entry { background: #ffffff; border: 1px solid #ddd; border-radius: 6px; margin-top: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); overflow: hidden; }
    .entry h3 { background: #f1f1f2; margin: 0; padding: 10px 14px; font-size: 16px; font-weight: 600; border-bottom: 1px solid #ddd; letter-spacing: 1.1px; }
    .meta-row { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: #f1f1f2; font-weight: 600; border-bottom: 1px solid #ddd; }
    .labeled-row { display: flex; width: 100%; min-height: 40px; align-items: stretch; border-top: 1px solid #ddd; }
    .label, .content { word-break: break-word; overflow-wrap: break-word; white-space: normal; }
    .label { flex: 0 0 28%; min-width: 120px; background: #c3c1c1; font-size: 14px; font-weight: 600; color: #384247; padding: 10px; display: flex; align-items: center; justify-content: center; text-align: center; letter-spacing: 1.2px; }
    .content { flex: 0 0 72%; background: #f1f1f2; padding: 10px 20px 10px 10px; font-size: 14px; font-weight: 500; letter-spacing: 1.05px; line-height: 1.4; }
    pre { font-family: Arial, sans-serif !important; background: #f7f7f7; padding: 10px; margin: 0; font-size: 13px; white-space: pre-wrap; border: none; }
    .suggestion { background: #f1f1f2; border-left: 4px solid #85BAC6; padding: 10px 12px; margin: 10px 0; border-radius: 4px; font-size: 13px; }
    .severity-high { color: #822622; font-weight: bold; }
    .severity-medium, .severity-moderate { color: #e3867d; font-weight: bold; }
    .severity-low { color: #a1d6e2; font-weight: bold; }
    a { color: #1995AD; word-break: break-all; text-decoration: none; }
    a:hover { text-decoration: underline; }
    ul { margin: 10px 20px; padding-left: 18px; font-size: 14px; }
    ui li { margin-bottom: 12px; }
    ul li div { margin: 4px 0; }
    .suggestion { background: #f0f9f0; color: black; border-left: 4px solid #85BAC6; padding: 10px 12px; border-radius: 4px; font-size: 13px; }
  </style>
</head><body> 
  <h1>VulnEye Security Report</h1>
  <p><strong>Date:</strong> ${date}</p>
  <p><strong>URL Scanned:</strong> ${url}</p>
  <p><strong>Plan:</strong> ${plan}</p>
  <h2>Score: ${score}</h2>
  ${contentHtml}
</body></html>`;
}

async function exportReportAsPdf() {
  if (!lastScanResult) return alert("No scan results available.");
  const html = buildFullReportHtml(lastScanResult);
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  await new Promise(r => setTimeout(r, 100));
  const opt = {
    margin: 0.5,
    filename: 'vulneye-report.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };
  await html2pdf().from(container).set(opt).save();
  container.remove();
}

const exportBtn = document.getElementById("export-pdf");
exportBtn?.addEventListener("click", exportReportAsPdf);
