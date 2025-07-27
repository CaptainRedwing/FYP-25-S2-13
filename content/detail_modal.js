// detail_modal.js

//Styling for the modal
function injectModalStyles() {
  if (document.getElementById('vuln-modal-style')) return;

  const style = document.createElement('style');
  style.id = 'vuln-modal-style';
  style.textContent = `
    /* Modal backdrop */
  #vuln-modal {
    position: fixed;
    top: 0; left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.6);
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* Modal content box */
  .vuln-modal-box {
    background: #85BAC6;
    color: #222;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    padding: 20px;
    border-radius: 8px;
    font-family: sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    position: relative;
  }

  /* Modal header bar */
  .vuln-modal-box h2 {
    background: #1995AD;
    color: white;
    margin: -20px -20px 16px;
    padding: 12px;
    font-size: 18px;
    font-weight: bold;
    border-radius: 8px 8px 0 0;
  }

  /* Close button */
  #close-vuln-modal {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
  }

  /* Each vulnerability card */
  .vuln-entry,
  
  .tracker-entry {
    background: #ffffff;
    border: 1px solid #ddd;
    padding: 12px;
    margin-bottom: 16px;
    border-radius: 6px;
  }

  .vuln-entry ul li {
  background: #f7f7f7;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 12px;
  }

  /* Entry title */
  .vuln-entry h3 {
  background: #e8eef4;
  display: block;
  padding: 8px;
  margin: 0 0 8px;
  border-radius: 4px 4px 0 0;
  font-size: 16px;
  }

  /* Meta line (tag & severity) */
  .vuln-entry .meta {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    margin-bottom: 8px;
  }

  /* Code snippet / detail block */
  .vuln-entry code {
    background: #f7f7f7;
    display: block;
    padding: 8px;
    margin: 8px 0;
    border-radius: 4px;
    white-space: pre-wrap;
    font-family: monospace;
  }

  /* Suggestion box */
  .vuln-entry .suggestion,
  .tracker-entry .suggestion {
    background: #f0f9f0;
    padding: 8px;
    border-radius: 4px;
    margin-top: 8px;
    font-size: 13px;
  }

  /* References list */
  .vuln-entry ul,
  .tracker-entry ul {
    margin: 8px 0 0 16px;
    font-size: 13px;
  }

  /* Severity colors */
  .severity-high {
    color: red;
    font-weight: bold;
  }
  .severity-medium,
  .severity-moderate {
    color: orange;
    font-weight: bold;
  }
  .severity-low {
    color: green;
    font-weight: bold;
  }

  `;
  document.head.appendChild(style);
}

// Escapes HTML special characters in a string to prevent injection.
function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// The Modal
function showSiteModal(type, items) {
  injectModalStyles();  // <-- apply styling

  // Remove any existing 
  const existing = document.getElementById('vuln-modal');
  if (existing) existing.remove();

  // Overlay backdrop
  const modal = document.createElement('div');
  modal.id = 'vuln-modal';

  // Content box
  const box = document.createElement('div');
  box.className = 'vuln-modal-box';

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.id = 'close-vuln-modal';
  closeBtn.textContent = '✖';
  closeBtn.onclick = () => modal.remove();
  box.appendChild(closeBtn);

  // Dynamic header
  const header = document.createElement('h2');
  let titleText;
  switch (type) {
    case 'libraries': titleText = 'JS Library Vulnerabilities';     break;
    case 'xss':       titleText = 'XSS Vulnerabilities';            break;
    case 'csrf':      titleText = 'Missing CSRF Tokens';              break;
    case 'header':    titleText = 'Header Vulnerabilities';         break;
    case 'trackers':  titleText = 'Trackers Detected';              break;
    default:          titleText = 'Scan Results';
  }
  header.textContent = titleText;
  box.appendChild(header);

  // No-results message
  if (!items || items.length === 0) {
    const none = document.createElement('p');
    none.textContent = 'No issues detected on this page.';
    box.appendChild(none);

  // JS Library 
  } else if (type === 'libraries') {
    items.forEach(i => {
      const entry = document.createElement('div');
      entry.className = 'vuln-entry';

      const h3 = document.createElement('h3');
      h3.textContent = `${i.library} v${i.version}`;
      entry.appendChild(h3);

      const sev = document.createElement('div');
      sev.innerHTML = `<strong>Severity:</strong> <span class="severity-${i.severity.toLowerCase()}">${escapeHtml(i.severity.toUpperCase())}</span>`;
      entry.appendChild(sev);

      const ul = document.createElement('ul');
      i.identifiers.forEach((sum, idx) => {
        const li = document.createElement('li');

          const txt = document.createElement('div');
          txt.innerHTML = `<strong>${escapeHtml(sum)}</strong>`;
          li.appendChild(txt);

          const sugg = document.createElement('div');
          sugg.className = 'suggestion';
          sugg.innerHTML = `<strong>Suggestion:</strong> ${escapeHtml(i.suggestions[idx])}`;
          li.appendChild(sugg);

        ul.appendChild(li);
      });
      entry.appendChild(ul);

      box.appendChild(entry);
    });

  // XSS
  } else if (type === 'xss') {
    items.forEach(i => {
      const entry = document.createElement('div');
      entry.className = 'vuln-entry';

      const typeDiv = document.createElement('div');
      typeDiv.innerHTML = `<strong>Type:</strong> ${escapeHtml(i.type)}`;
      entry.appendChild(typeDiv);

      const tagDiv = document.createElement('div');
      tagDiv.innerHTML = `<strong>Tag:</strong> ${escapeHtml(i.tag)}`;
      entry.appendChild(tagDiv);

      if (i.snippet) {
        const code = document.createElement('code');
        code.textContent = i.snippet;
        entry.appendChild(code);
      }

      const sev = document.createElement('div');
      sev.innerHTML = `<strong>Severity:</strong> <span class="severity-${i.severity.toLowerCase()}">${escapeHtml(i.severity.toUpperCase())}</span>`;
      entry.appendChild(sev);

      const suggestDiv = document.createElement('div');
      suggestDiv.className = 'suggestion';
      suggestDiv.innerHTML = `<strong>Suggestion:</strong> ${escapeHtml(i.suggestion)}`;
      entry.appendChild(suggestDiv);

       if (i.references?.length) {
        i.references.forEach(ref => {
          const refDiv = document.createElement('div');
          refDiv.innerHTML = `<strong>Reference:</strong> <a href="${ref}" target="_blank">${escapeHtml(ref)}</a>`;
          entry.appendChild(refDiv);
        });
      }

      box.appendChild(entry);
    });

  // HTTP Header
  } else if (type === 'header') {
    items.forEach(i => {
      const entry = document.createElement('div');
      entry.className = 'vuln-entry';

      const htype = document.createElement('div');
      htype.innerHTML = `<strong>Type:</strong> ${escapeHtml(i.type)}`;
      entry.appendChild(htype);

      if (i.detail) {
        const detailDiv = document.createElement('div');
        detailDiv.innerHTML = `<strong>Detail:</strong> ${escapeHtml(i.detail)}`;
        entry.appendChild(detailDiv);
      }

      if (i.severity) {
        const sev = document.createElement('div');
        sev.innerHTML = `<strong>Severity:</strong> <span class="severity-${i.severity.toLowerCase()}">${escapeHtml(i.severity.toUpperCase())}</span>`;
        entry.appendChild(sev);
      }

      if (i.suggestion) {
        const suggest = document.createElement('div');
        suggest.className = 'suggestion';
        suggest.innerHTML = `<strong>Suggestion:</strong> ${escapeHtml(i.suggestion)}`;
        entry.appendChild(suggest);
      }

      if (i.reference) {
        const refDiv = document.createElement('div');
        const refText = escapeHtml(i.reference);
        if (/^https?:\/\//i.test(i.reference)) {
          refDiv.innerHTML = `<strong>Reference:</strong> <a href="${i.reference}" target="_blank">${refText}</a>`;
        } else {
          refDiv.innerHTML = `<strong>Reference:</strong> ${refText}`;
        }
        entry.appendChild(refDiv);
      }

      box.appendChild(entry);
    });

  // CSRF
  } else if (type === 'csrf') {
    items.forEach(i => {
      const entry = document.createElement('div');
      entry.className = 'vuln-entry';

      ['type','tag','detail','severity'].forEach(field => {
        if (!i[field]) return;
        const div = document.createElement('div');
        if (field === 'severity') {
          div.innerHTML = `
            <strong>Severity:</strong>
            <span class="severity-${i.severity.toLowerCase()}">
              ${escapeHtml(i.severity.toUpperCase())}
            </span>
          `;
        } else {
          const label = field.charAt(0).toUpperCase() + field.slice(1);
          div.innerHTML = `<strong>${label}:</strong> ${escapeHtml(i[field])}`;
        }
        entry.appendChild(div);
      });

      if (i.suggestion) {
        const suggestDiv = document.createElement('div');
        suggestDiv.className = 'suggestion';
        suggestDiv.innerHTML = `<strong>Suggestion:</strong> ${escapeHtml(i.suggestion)}`;
        entry.appendChild(suggestDiv);
      }

      if (i.reference) {
        const refDiv = document.createElement('div');
        const refText = escapeHtml(i.reference);
        refDiv.innerHTML = `<strong>Reference:</strong> ${/^https?:\/\//i.test(i.reference) ? `<a href="${i.reference}" target="_blank">${refText}</a>` : refText}`;
        entry.appendChild(refDiv);
      }

      box.appendChild(entry);
    });

  // Trackers
  } else if (type === 'trackers') {
    items.forEach(i => {
      const entry = document.createElement('div');
      entry.className = 'tracker-entry';

      entry.innerHTML = `
        <h3>${escapeHtml(i.tracker)}</h3>
        <div class="meta">
          <span><strong>Severity:</strong> <span class="severity-${i.severity.toLowerCase()}">${escapeHtml(i.severity.toUpperCase())}</span></span>
        </div>
        <div><strong>URL:</strong> <a href="${i.url}" target="_blank">${escapeHtml(i.url)}</a></div>
        <div><strong>Summary:</strong> ${escapeHtml(i.summary)}</div>
        <div class="suggestion"><strong>Suggestion:</strong> ${escapeHtml(i.suggestion)}</div>
        <div><strong>References:</strong></div>
        <ul>${i.references.map(r => `<li><a href="${r}" target="_blank">${escapeHtml(r)}</a></li>`).join('')}</ul>
      `;
      box.appendChild(entry);
    });

  // Fallback
  } else {
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(items, null, 2);
    box.appendChild(pre);
  }

  modal.appendChild(box);
  document.body.appendChild(modal);
}

// Listener to show the details modal
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'showDetails') {
    showSiteModal(msg.dataType, msg.data);
    sendResponse({ status: 'shown' });
  }
});
