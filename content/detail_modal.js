// Escapes HTML special characters in a string to prevent injection.
function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Renders a modal showing detailed scan results for the given type.
 * @param {'libraries'|'xss'|'header'|'trackers'|string} type 
 * @param {Array} items 
 */
function showSiteModal(type, items) {
  // Remove any existing modal
  const existing = document.getElementById('vuln-modal');
  if (existing) existing.remove();

  console.log('>> showDetails received', type, items);

  // Overlay backdrop 
  const modal = document.createElement('div');
  modal.id = 'vuln-modal';
  Object.assign(modal.style, {
    position: 'fixed', top: '0', left: '0',
    width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,0.5)',
    zIndex: '9999', display: 'flex',
    justifyContent: 'center', alignItems: 'center'
  });

  // Content box
  const box = document.createElement('div');
  Object.assign(box.style, {
    background: 'white', color: 'black',
    maxWidth: '600px', width: '90%',
    maxHeight: '80vh', overflowY: 'auto',
    padding: '20px', borderRadius: '10px',
    fontFamily: 'sans-serif', fontSize: '14px', position: 'relative'
  });

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.id = 'close-vuln-modal';
  closeBtn.textContent = '✖';
  Object.assign(closeBtn.style, {
    position: 'absolute', top: '10px', right: '10px',
    background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer'
  });
  closeBtn.onclick = () => modal.remove();
  box.appendChild(closeBtn);

  // Dynamic header
  const header = document.createElement('h2');
  let titleText;
  switch (type) {
    case 'libraries': titleText = 'JS Library Vulnerabilities'; break;
    case 'xss':       titleText = 'XSS Vulnerabilities';            break;
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

  // JS Library vulnerabilities
  } else if (type === 'libraries') {
    items.forEach(i => {
      const entry = document.createElement('div');
      entry.style.marginBottom = '12px';

      const title = document.createElement('div');
      title.innerHTML = `<strong>${escapeHtml(i.library)} v${escapeHtml(i.version)}</strong>`;
      entry.appendChild(title);

      const sev = document.createElement('div');
      sev.textContent = `Severity: ${i.severity.toUpperCase()}`;
      entry.appendChild(sev);

      const ul = document.createElement('ul');
      i.identifiers.forEach((sum, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${escapeHtml(sum)}</strong><br>Suggestion: ${escapeHtml(i.suggestions[idx])}`;
        ul.appendChild(li);
      });
      entry.appendChild(ul);

      box.appendChild(entry);
    });

  //  XSS 
  } else if (type === 'xss') {
    items.forEach(i => {
      const entry = document.createElement('div');
      entry.style.marginBottom = '12px';

      const fields = [
        { label: 'Type:', value: i.type },
        { label: 'Tag:', value: i.tag },
        { label: 'Attribute:', value: i.attr },
        { label: 'Href:', value: i.href },
        { label: 'Value:', value: i.value }
      ];
      fields.forEach(f => {
        if (f.value) {
          const div = document.createElement('div');
          div.innerHTML = `<strong>${f.label}</strong> ${escapeHtml(f.value)}`;
          entry.appendChild(div);
        }
      });

      if (i.snippet) {
        const snipLabel = document.createElement('div');
        snipLabel.innerHTML = '<strong>Script Snippet:</strong>';
        entry.appendChild(snipLabel);

        const pre = document.createElement('pre');
        Object.assign(pre.style, {
          background: '#f4f4f4', padding: '8px',
          borderRadius: '4px', whiteSpace: 'pre-wrap'
        });
        const code = document.createElement('code');
        code.textContent = i.snippet;
        pre.appendChild(code);
        entry.appendChild(pre);
      }

      if (i.severity) {
        const sev = document.createElement('div');
        sev.innerHTML = `<strong>Severity:</strong> ${escapeHtml(i.severity.toUpperCase())}`;
        entry.appendChild(sev);
      }

      if (i.references?.length) {
        const refLabel = document.createElement('div');
        refLabel.innerHTML = '<strong>References:</strong>';
        entry.appendChild(refLabel);

        const ulRefs = document.createElement('ul');
        i.references.forEach(ref => {
          const liRef = document.createElement('li');
          liRef.textContent = ref;
          ulRefs.appendChild(liRef);
        });
        entry.appendChild(ulRefs);
      }

      const suggestDiv = document.createElement('div');
      suggestDiv.innerHTML = `<strong>Suggestion:</strong> ${escapeHtml(i.suggestion)}`;
      entry.appendChild(suggestDiv);

      box.appendChild(entry);
    });

  // HTTP Header 
  } else if (type === 'header') {
  items.forEach(i => {
    const entry = document.createElement('div');
    entry.style.marginBottom = '12px';

    const htype = document.createElement('div');
    htype.innerHTML = `<strong>Issue Type:</strong> ${escapeHtml(i.type)}`;
    entry.appendChild(htype);

    if(i.detail){
      const detailDiv = document.createElement('div');
      detailDiv.innerHTML = `<strong>Detail:</strong> ${escapeHtml(i.detail)}`;
      entry.appendChild(detailDiv);
    }

    if (i.severity) {
      const sev = document.createElement('div');
      sev.innerHTML = `<strong>Severity:</strong> ${escapeHtml(i.severity.toUpperCase())}`;
      entry.appendChild(sev);
    }

    if (i.suggestion) {
      const suggest = document.createElement('div');
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
    entry.style.marginBottom = '12px';

    const fields = [
      { label: 'Type:', value: i.type },
      { label: 'Tag:', value: i.tag },
      { label: 'Detail:', value: i.detail },
      { label: 'Severity:', value: i.severity },
    ];

    fields.forEach(f => {
      if (f.value) {
        const div = document.createElement('div');
        div.innerHTML = `<strong>${f.label}</strong> ${escapeHtml(f.value)}`;
        entry.appendChild(div);
      }
    });

    if (i.suggestion) {
      const suggestDiv = document.createElement('div');
      suggestDiv.innerHTML = `<strong>Suggestion:</strong> ${escapeHtml(i.suggestion)}`;
      entry.appendChild(suggestDiv);
    }

    if (i.reference) {
      const refDiv = document.createElement('div');
      const refText = escapeHtml(i.reference);
      // If the reference looks like a URL, make it a clickable link
      if (/^https?:\/\//i.test(i.reference)) {
        refDiv.innerHTML = `<strong>Reference:</strong> <a href="${i.reference}" target="_blank">${refText}</a>`;
      } else {
        refDiv.innerHTML = `<strong>Reference:</strong> ${refText}`;
      }
      entry.appendChild(refDiv);
    }

    box.appendChild(entry);
    });
  // Tracker findings
  } else if (type === 'trackers') {
    items.forEach(i => {
      const entry = document.createElement('div');
      entry.classList.add('tracker-entry');
      entry.style.marginBottom = '16px';

      entry.innerHTML = `
        <h3 class="tracker-name">${escapeHtml(i.tracker)}</h3>
        <p><strong>Severity:</strong> 
           <span class="severity-label severity-${i.severity}">
             ${escapeHtml(i.severity.toUpperCase())}
           </span>
        </p>
        <p><strong>URL:</strong> 
           <a href="${i.url}" target="_blank">${escapeHtml(i.url)}</a>
        </p>
        <p><strong>Summary:</strong> ${escapeHtml(i.summary)}</p>
        <p><strong>Suggestion:</strong> ${escapeHtml(i.suggestion)}</p>
        <p><strong>References:</strong></p>
        <ul class="tracker-references">
          ${i.references.map(r => `<li><a href="${r}" target="_blank">${escapeHtml(r)}</a></li>`).join('')}
        </ul>
      `;
      box.appendChild(entry);
    });

  // Fallback 
  } else {
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(items, null, 2);
    box.appendChild(pre);
  }

  // Append and show
  modal.appendChild(box);
  document.body.appendChild(modal);
}

// Listen for popup requests to show the details modal
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'showDetails') {
    showSiteModal(msg.dataType, msg.data);
    sendResponse({ status: 'shown' });
  }
});
