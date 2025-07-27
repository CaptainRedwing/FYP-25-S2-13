function buildFullReportHtml(scanResult) {
  const date  = new Date().toLocaleString();
  const url   = document.getElementById('current-url')?.textContent || '';
  const plan  = document.querySelector('.plan-container small')
                 ?.textContent.replace('Plan:', '').trim() || 'Free';
  const score = document.querySelector('#score-value')?.textContent || 'N/A';

  // Define each scan type and its display title
  const sections = [
    { key: 'libraries', title: 'JS Library Vulnerabilities' },
    { key: 'xss',       title: 'XSS Vulnerabilities' },
    { key: 'header',    title: 'HTTP Header Issues' },
    { key: 'csrf',      title: 'CSRF Token Issues' },
    { key: 'csp',       title: 'CSP Status' },
    { key: 'trackers',  title: 'Trackers Detected' }
  ];

  // Render each section, always show heading
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
              <p><strong>Severity:</strong> ${i.severity?.toUpperCase()}</p>
            `;
            i.identifiers.forEach((id, idx) => {
              contentHtml += `<p>${id}<br><em>Suggestion:</em> ${i.suggestions[idx]}</p>`;
            });
            break;

          case 'xss':
            contentHtml += `
              <p><strong>Type:</strong> ${i.type}</p>
              <p><strong>Tag:</strong> ${i.tag}</p>
              <p><strong>Attribute:</strong> ${i.attr}</p>
              ${i.snippet ? `<pre>${i.snippet}</pre>` : ''}
              <p><strong>Severity:</strong> ${i.severity?.toUpperCase()}</p>
            `;
            if (i.references?.length) {
              contentHtml += `<p><strong>References:</strong><ul>`;
              i.references.forEach(r => contentHtml += `<li>${r}</li>`);
              contentHtml += `</ul></p>`;
            }
            contentHtml += `<p><strong>Suggestion:</strong> ${i.suggestion}</p>`;
            break;

          case 'header':
            contentHtml += `
              <p><strong>Issue:</strong> ${i.type}</p>
              ${i.detail ? `<p><strong>Detail:</strong> ${i.detail}</p>` : ''}
              <p><strong>Severity:</strong> ${i.severity?.toUpperCase()}</p>
              <p><strong>Suggestion:</strong> ${i.suggestion}</p>
            `;
            if (i.reference) contentHtml += `<p><strong>Reference:</strong> ${i.reference}</p>`;
            break;

          case 'csrf':
            contentHtml += `
              <p><strong>Type:</strong> ${i.type}</p>
              <p><strong>Tag:</strong> ${i.tag}</p>
              ${i.detail ? `<p><strong>Detail:</strong> ${i.detail}</p>` : ''}
              <p><strong>Severity:</strong> ${i.severity?.toUpperCase()}</p>
              <p><strong>Suggestion:</strong> ${i.suggestion}</p>
            `;
            if (i.reference) contentHtml += `<p><strong>Reference:</strong> ${i.reference}</p>`;
            break;

          case 'csp':
            contentHtml += `
              <p><strong>Enforced:</strong> ${i.exists ? 'Yes' : 'No'}</p>
              ${i.exists ? `<p><strong>Method:</strong> ${i.method}</p>` : ''}
              <p><strong>Severity:</strong> ${i.exists ? 'N/A' : 'LOW'}</p>
            `;
            break;

          case 'trackers':
            contentHtml += `
              <p><strong>Tracker:</strong> ${i.tracker}</p>
              <p><strong>URL:</strong> ${i.url}</p>
              <p><strong>Severity:</strong> ${i.severity?.toUpperCase()}</p>
              <p><strong>Summary:</strong> ${i.summary}</p>
              <p><strong>Suggestion:</strong> ${i.suggestion}</p>
            `;
            if (i.references?.length) {
              contentHtml += `<p><strong>References:</strong><ul>`;
              i.references.forEach(r => contentHtml += `<li>${r}</li>`);
              contentHtml += `</ul></p>`;
            }
            break;
        }
        contentHtml += `</div>`;
      });
    }
  });

  // Assemble full HTML
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: sans-serif; margin: 20px; }
    h1, h2 { color: #333; margin-top: 30px; }
    .entry { border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; }
    pre { background: #f4f4f4; padding: 8px; white-space: pre-wrap; }
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

/**
 * Export the full HTML report to PDF.
 */
async function exportReportAsPdf() {
  if (typeof lastScanResult === 'undefined' || !lastScanResult) {
    alert('No scan results available. Please run a scan first.');
    return;
  }

  const html = buildFullReportHtml(lastScanResult);
  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'fixed', top: '-10000px', left: '0', width: '800px', overflow: 'visible'
  });
  container.innerHTML = html;
  document.body.appendChild(container);
  await new Promise(r => setTimeout(r, 100));

  const canvas = await html2canvas(container, {
    scale: 2,
    windowWidth: container.scrollWidth,
    windowHeight: container.scrollHeight,
    scrollY: -window.scrollY
  });
  document.body.removeChild(container);

  const imgData   = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;
  const pdf       = new jsPDF('p', 'pt', 'a4');

  const pageW  = pdf.internal.pageSize.getWidth();
  const pageH  = pdf.internal.pageSize.getHeight();
  const imgW   = pageW;
  const imgH   = (canvas.height * imgW) / canvas.width;
  let   remH   = imgH;
  let   posY   = 0;

  pdf.addImage(imgData, 'PNG', 0, 0, imgW, imgH);
  remH -= pageH;
  while (remH > 0) {
    posY -= pageH;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, posY, imgW, imgH);
    remH -= pageH;
  }

  pdf.save('vulneye-report.pdf');
}

// Hook export button
const exportBtn = document.getElementById('export-pdf');
exportBtn?.addEventListener('click', exportReportAsPdf);
