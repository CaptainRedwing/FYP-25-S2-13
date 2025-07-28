
function buildFullReportHtml(scanResult) {
  const date  = new Date().toLocaleString();
  const url   = document.getElementById('current-url')?.textContent || '';
  const plan  = document.querySelector('.plan-container small')
                 ?.textContent.replace('Plan:', '').trim() || 'Free';
  const score = document.querySelector('#score-value')?.textContent || 'N/A';

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
              <p><strong>Library:</strong> ${i.library} v${i.version}</p>
              <p><strong>Severity:</strong> <span class="severity-${i.severity.toLowerCase()}">${i.severity.toUpperCase()}</span></p>
            `;
            i.identifiers.forEach((id, idx) => {
              contentHtml += `
                <div>
                  <strong>${id}</strong>
                  <div class="suggestion"><strong>Suggestion:</strong> ${i.suggestions[idx]}</div>
                </div>
              `;
            });
            break;

          case 'xss':
            contentHtml += `
              <p><strong>Type:</strong> ${i.type}</p>
              <p><strong>Tag:</strong> ${i.tag}</p>
              ${i.snippet ? `<pre>${i.snippet}</pre>` : ''}
              <p><strong>Severity:</strong> <span class="severity-${i.severity.toLowerCase()}">${i.severity.toUpperCase()}</span></p>
              <div class="suggestion"><strong>Suggestion:</strong> ${i.suggestion}</div>
            `;
            if (i.references?.length) {
              i.references.forEach(ref => {
                contentHtml += `<p><strong>Reference:</strong> <a href="${ref}" target="_blank">${ref}</a></p>`;
              });
            }
            break;

          case 'header':
            contentHtml += `
              <p><strong>Type:</strong> ${i.type}</p>
              ${i.detail ? `<p><strong>Detail:</strong> ${i.detail}</p>` : ''}
              <p><strong>Severity:</strong> <span class="severity-${i.severity?.toLowerCase()}">${i.severity?.toUpperCase()}</span></p>
              <div class="suggestion"><strong>Suggestion:</strong> ${i.suggestion}</div>
            `;
            if (i.reference) {
              const isUrl = /^https?:\/\//i.test(i.reference);
              contentHtml += `<p><strong>Reference:</strong> ${isUrl ? `<a href="${i.reference}" target="_blank">${i.reference}</a>` : i.reference}</p>`;
            }
            break;

          case 'csrf':
            contentHtml += `
              <p><strong>Type:</strong> ${i.type}</p>
              <p><strong>Tag:</strong> ${i.tag}</p>
              ${i.detail ? `<p><strong>Detail:</strong> ${i.detail}</p>` : ''}
              <p><strong>Severity:</strong> <span class="severity-${i.severity.toLowerCase()}">${i.severity.toUpperCase()}</span></p>
              <div class="suggestion"><strong>Suggestion:</strong> ${i.suggestion}</div>
            `;
            if (i.reference) {
              const isUrl = /^https?:\/\//i.test(i.reference);
              contentHtml += `<p><strong>Reference:</strong> ${isUrl ? `<a href="${i.reference}" target="_blank">${i.reference}</a>` : i.reference}</p>`;
            }
            break;

          case 'csp':
            contentHtml += `
              <p><strong>Enforced:</strong> ${i.exists ? 'Yes' : 'No'}</p>
              ${i.exists ? `<p><strong>Method:</strong> ${i.method}</p>` : ''}
              <p><strong>Severity:</strong> ${i.exists ? 'N/A' : '<span class="severity-low">LOW</span>'}</p>
            `;
            break;

          case 'trackers':
            contentHtml += `
              <p><strong>Tracker:</strong> ${i.tracker}</p>
              <p><strong>URL:</strong> <a href="${i.url}" target="_blank">${i.url}</a></p>
              <p><strong>Severity:</strong> <span class="severity-${i.severity.toLowerCase()}">${i.severity.toUpperCase()}</span></p>
              <p><strong>Summary:</strong> ${i.summary}</p>
              <div class="suggestion"><strong>Suggestion:</strong> ${i.suggestion}</div>
            `;
            if (i.references?.length) {
              i.references.forEach(ref => {
                contentHtml += `<p><strong>Reference:</strong> <a href="${ref}" target="_blank">${ref}</a></p>`;
              });
            }
            break;
        }

        contentHtml += `</div>`;
      });
    }
  });

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: sans-serif; margin: 20px; }
    h1, h2 { color: #333; margin-top: 30px; }
    .entry { border: 1px solid #ccc; padding: 10px; margin-bottom: 14px; border-radius: 6px; background: #fff; }
    pre { background: #f4f4f4; padding: 8px; white-space: pre-wrap; border-radius: 4px; }

    .suggestion {
      background: #f0f9f0;
      padding: 8px;
      border-radius: 4px;
      margin-top: 6px;
      font-size: 13px;
    }
    .severity-high { color: red; font-weight: bold; }
    .severity-medium, .severity-moderate { color: orange; font-weight: bold; }
    .severity-low { color: green; font-weight: bold; }
  </style>
</head>
<body>
  <h1>VulnEye Security Report</h1>
  <p><strong>Date:</strong> ${date}</p>
  <p><strong>URL Scanned:</strong> ${url}</p>
  <p><strong>Plan:</strong> ${plan}</p>
  <h2>Score: ${score}</h2>
  ${contentHtml}
</body>
</html>`;
}

async function exportReportAsPdf() {
  if (!lastScanResult) {
    alert('No scan results available.');
    return;
  }

  const html = buildFullReportHtml(lastScanResult);

  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);

  await new Promise(r => setTimeout(r, 100)); // Wait for render

  const opt = {
    margin:       0.5,
    filename:     'vulneye-report.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  await html2pdf().from(container).set(opt).save();
  container.remove();
}

// Hook export button
const exportBtn = document.getElementById('export-pdf');
exportBtn?.addEventListener('click', exportReportAsPdf);
