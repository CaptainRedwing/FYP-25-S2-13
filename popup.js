let lastScanResult = null;

document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.getElementById("menuButton");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const setting = document.getElementById("setting");
  const dropdownMenu2 = document.getElementById("dropdownMenu2");
  const dropdownMenu3 = document.getElementById("dropdownMenu3");
  const appSetting = document.getElementById("appSetting");
  const onoffBtn = document.getElementById("onoff");
  const onoffBtn2 = document.getElementById("onoff2");
  const offExtension = document.getElementById("offExtension");
  const scanBtn = document.getElementById("scan-now");
  const switchToggle = document.querySelector(".switch-toggle");
  const switchToggle2 = document.querySelector(".switch-toggle2");

  menuButton?.addEventListener("click", () => {
    dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
  });

  setting?.addEventListener("click", () => {
    dropdownMenu2.style.display = dropdownMenu2.style.display === "block" ? "none" : "block";
  });

  appSetting?.addEventListener("click", () => {
    dropdownMenu2.style.display = "none";

    fetch(chrome.runtime.getURL("setting/mainSetting.html"))
      .then(res => res.text())
      .then(html => {
        const body1 = document.querySelector(".body1");
        const container = document.querySelector(".body-container");

        if (body1) body1.style.display = "none";
        document.getElementById("settingsWrapper")?.remove();

        const settingsWrapper = document.createElement("div");
        settingsWrapper.id = "settingsWrapper";
        container.appendChild(settingsWrapper);
        settingsWrapper.innerHTML = html;

        setTimeout(() => {
          backButton();
          setting_1(); 
        }, 0);
      });
  });

  switchToggle?.addEventListener("click", () => {
    switchToggle.classList.toggle("off");
  });

  switchToggle2?.addEventListener("click", () => {
    switchToggle2.classList.toggle("off");
  });

  document.addEventListener("click", (event) => {
    if (!menuButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
      dropdownMenu.style.display = "none";
    }
    if (!setting.contains(event.target) && !dropdownMenu2.contains(event.target)) {
      dropdownMenu2.style.display = "none";
    }
    if (!onoffBtn.contains(event.target) && !dropdownMenu3.contains(event.target)) {
      dropdownMenu3.style.display = "none";
    }
  });

  const currentDate = document.getElementById("current-date");
  const today = new Date();
  currentDate.innerText = dateFormat(today);

  const urlEl = document.getElementById("current-url");
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    urlEl.innerText = tabs[0]?.url || "Unknown URL";
  });

  onoffBtn?.addEventListener("click", () => {
    chrome.storage.local.get("realtimeEnabled", ({ realtimeEnabled }) => {
      if (realtimeEnabled) {
        dropdownMenu3.style.display = dropdownMenu3.style.display === "block" ? "none" : "block";
      } else {
        chrome.storage.local.set({ realtimeEnabled: true }, () => {
          setOnOffUI(true);
          showLoadingAndScan(done => setTimeout(done, 0));
        });
      }
    });
  });

  onoffBtn2?.addEventListener("click", () => {
    chrome.storage.local.set({ realtimeEnabled: true }, () => {
      setOnOffUI(true);
      showLoadingAndScan(done => setTimeout(done, 0));
    });
  });

  offExtension?.addEventListener("click", () => {
    chrome.storage.local.set({ realtimeEnabled: false }, () => {
      setOnOffUI(false);
      dropdownMenu3.style.display = "none";
    });
  });

  scanBtn?.addEventListener("click", () => {
    showLoadingAndScan(done => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "runScan" }, (response) => {
          const vuList = document.getElementById("vulnerability-items");
          if (!response) {
            vuList.innerText = "No response from content script.";
            done();
            return;
          }

          if (response.error) {
            const li = document.createElement("li");
            li.textContent = `Scan error: ${response.error}`;
            vuList.appendChild(li);
            done();
            return;
          }

          lastScanResult = response;
          chrome.storage.local.set({ lastScanResult: response });
          done();
        });
      });
    });
  });

  chrome.storage.local.get({ realtimeEnabled: true }, ({ realtimeEnabled }) => {
    setOnOffUI(realtimeEnabled);

    const bodyContainer = document.querySelector(".body-container");
    const body2 = document.querySelector(".body2");
    const loadingScreen = document.getElementById("loading-screen");

    if (realtimeEnabled) {
      showLoadingAndScan(done => setTimeout(done, 0));
    } else {
      loadingScreen.style.display = "none";
      bodyContainer.classList.remove("visible");
      body2.style.display = "block";
    }
  });

  chrome.storage.local.get("lastScanResult", ({ lastScanResult: stored }) => {
    if (stored) lastScanResult = stored;
  });

  initConfigurationToggles();

});

function backButton() {
  const backButton = document.getElementById("backButton");
  if (backButton) {
    backButton.addEventListener("click", () => {
      const wrapper = document.getElementById("settingsWrapper");
      if (wrapper) wrapper.remove();

      const body1 = document.querySelector(".body1");
      if (body1) body1.style.display = "block";
    });
  }
}

function setting_1() {
  const extensionConfiguration = document.getElementById("extensionConfiguration");
  extensionConfiguration?.addEventListener("click", () => {
    fetch(chrome.runtime.getURL("setting/extensionConfiguration/configuration.html"))
      .then(res => res.text())
      .then(html => {
        const body1 = document.querySelector(".body1");
        const container = document.querySelector(".body-container");

        if (body1) body1.style.display = "none";
        document.getElementById("settingsWrapper")?.remove();

        const settingsWrapper = document.createElement("div");
        settingsWrapper.id = "settingsWrapper";
        container.appendChild(settingsWrapper);
        settingsWrapper.innerHTML = html;

        setTimeout(() => {
          backButton();
          initConfigurationToggles();
        }, 0);
      })
      .catch(err => {
        console.error("Failed to load configuration.html", err);
      });
  });
}

function switchToggle2() {
  const toggles = document.querySelectorAll(".switch-toggle2");
  toggles.forEach(toggle => {
    toggle.addEventListener("click", () => {
      toggle.classList.toggle("off");
    });
  });
}

function dateFormat(date) {
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();
  const rules = new Intl.PluralRules("en", { type: "ordinal" });
  const suffixes = { one: "st", two: "nd", few: "rd", other: "th" };
  const suffix = suffixes[rules.select(day)];
  return `${day}${suffix} ${month} ${year}`;
}

function setOnOffUI(enabled) {
  const onoffBtn = document.getElementById("onoff");
  if (onoffBtn) {
    onoffBtn.classList.toggle("off", !enabled);
    onoffBtn.title = `Real-time scanning: ${enabled ? "ON" : "OFF"}`;
  }
  document.body.classList.toggle("mode-on", enabled);
  document.body.classList.toggle("mode-off", !enabled);
}

function showLoadingAndScan(scanFunction) {
  const loadingScreen = document.getElementById("loading-screen");
  const loadingBar = document.getElementById("loading-bar");
  const loadingText = document.getElementById("loading-text");
  const bodyContainer = document.querySelector(".body-container");

  loadingBar.style.width = "0%";
  bodyContainer.classList.remove("visible");
  loadingScreen.style.display = "flex";
  loadingText.textContent = "Starting...";

  let stages = [0, 25, 50, 75, 99];
  let index = 0;
  let loadingDone = false;
  let scanningDone = false;

  function nextStage() {
    if (index < stages.length) {
      loadingBar.style.width = stages[index] + "%";
      index++;
      setTimeout(nextStage, 500);
    } else {
      loadingDone = true;
      checkBothDone();
    }
  }

  scanFunction(() => {
    scanningDone = true;
    checkBothDone();
  });

  function checkBothDone() {
    if (loadingDone && scanningDone) {
      setTimeout(() => {
        loadingBar.style.width = "100%";
        setTimeout(() => {
          loadingScreen.style.display = "none";
          loadingBar.style.width = "0%";
          bodyContainer.classList.add("visible");

          Promise.all([
            loadScoreHtml(),
            loadSummaryReportHtml(),
            loadPassedCheckHtml(),
            loadVulnerabilitiesDetectedHtml(),
            loadSuggestionFixesHtml()
          ]).then(() => {
            if (lastScanResult) {
              renderResults(lastScanResult);

              // Calculate Scores
              const score = calculateScore(lastScanResult);
              const el = document.querySelector("#score-value");
              el.innerHTML = score;
            }
          });
        }, 500);
      }, 500);
    }
  }

  nextStage();
}

function loadScoreHtml() {
  return fetch("maincontent/score.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("scoreFile").innerHTML = html;
      const script = document.createElement("script");
      script.src = "odometer/odometer.js";
      script.onload = () => {
        const el = document.querySelector("#score-value");
        new Odometer({ el });
        el.innerHTML = 100;
      };
      document.body.appendChild(script);
    });
}

function loadSummaryReportHtml() {
  return fetch("maincontent/summaryreport.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("summaryReportFile").innerHTML = html;

      // Wait for the DOM to render injected HTML
      requestAnimationFrame(() => {
        // Extra check for Chart.js availability and canvas existence
        if (typeof window.renderVulnChart === "function") {
          window.renderVulnChart();
        } else {
          console.error("renderVulnChart is not defined or not loaded yet");
        }
      });
    });
}

function loadPassedCheckHtml() {
  return fetch("maincontent/passedcheck.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("passedChecks").innerHTML = html;
    });
}

function loadVulnerabilitiesDetectedHtml() {
  return fetch("maincontent/vulnerabilitiesdetected.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("vulnerability-list").innerHTML = html;
    });
}

function loadSuggestionFixesHtml() {
  return fetch("maincontent/suggestedfixes.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("suggestedFixes").innerHTML = html;
    });
}

function renderResults(response) {

  const passedList = document.querySelector('.passedList');
  if (passedList && response.csp?.length) {
    // remove old CSP entry
    const old = passedList.querySelector('.csp-item');
    if (old) old.remove();

    const { exists, method } = response.csp[0];
    const li = document.createElement('li');
    li.className = 'csp-item';

    if (exists) {
      li.innerHTML = `✓ CSP enforced via <strong>${method}</strong>`;
    } else {
      li.innerHTML = `✖ No CSP policy found`;
    } 

    passedList.appendChild(li);
  }


  const vuList = document.getElementById("vulnerability-items");
  if (!vuList) {
    console.error("vulnerability-items not found");
    return;
  }

  vuList.innerHTML = "";
  let foundAny = false;

  if (response.libraries?.length) {
    const li = document.createElement("li");
    li.textContent = "JS Vulnerability detected ";
    const btn = document.createElement("button");
    btn.innerHTML = `<span class="detail-text">Details</span> <img src="icons/chevron.png" class="arrow9-icon" alt=">" />`;
    btn.className = "detail-btn";
    btn.addEventListener("click", () => showDetails("libraries"));
    li.appendChild(btn);
    vuList.appendChild(li);
    foundAny = true;
  }

  if (response.xss?.length) {
    const li = document.createElement("li");
    li.textContent = "XSS patterns detected ";
    const btn = document.createElement("button");
    btn.innerHTML = `<span class="detail-text">Details</span> <img src="icons/chevron.png" class="arrow9-icon" alt=">" />`;
    btn.className = "detail-btn";
    btn.addEventListener("click", () => showDetails("xss"));
    li.appendChild(btn);
    vuList.appendChild(li);
    foundAny = true;
  }

  if (response.header?.length) {
  const li = document.createElement("li");
  li.textContent = "HTTP Header issues detected ";
  const btn = document.createElement("button");
  btn.innerHTML = `<span class="detail-text">Details</span> <img src="icons/chevron.png" class="arrow9-icon" alt=">" />`;
  btn.className = "detail-btn";
  btn.addEventListener("click", () => showDetails("header"));
  li.appendChild(btn);
  vuList.appendChild(li);
  foundAny = true;
  }

  if (response.csrf?.length) {
  const li = document.createElement("li");
  li.textContent = "CSRF token issues detected ";
  const btn = document.createElement("button");
  btn.innerHTML = `<span class="detail-text">Details</span> <img src="icons/chevron.png" class="arrow9-icon" alt=">" />`;
  btn.className = "detail-btn";
  btn.addEventListener("click", () => showDetails("csrf"));
  li.appendChild(btn);
  vuList.appendChild(li);
  foundAny = true;
  }

  if (response.trackers?.length) {
  const li = document.createElement("li");
  li.textContent = "Trackers detected ";
  const btn = document.createElement("button");
  btn.innerHTML = `<span class="detail-text">Details</span> <img src="icons/chevron.png" class="arrow9-icon" alt=">" />`;
  btn.className = "detail-btn";
  btn.addEventListener("click", () => showDetails("trackers"));
  li.appendChild(btn);
  vuList.appendChild(li);
  foundAny = true;
  }

  if (!foundAny) {
    const li = document.createElement("li");
    li.textContent = "No issues detected.";
    vuList.appendChild(li);
  }
}

function showDetails(type) {
  if (!lastScanResult) return;
  const items = lastScanResult[type] || [];

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "showDetails",
      dataType: type,
      data: items
    });
  });
}

function calculateScore(results) {
  let score = 100;
  const severityPoints = { critical: 25, high: 15, medium: 10, low: 5 };
  const typeWeights = { xss: 1.0, libraries: 1.3, header: 1.2, csrf: 1.3, csp: 1.0, trackers: 1.0 };

  console.log("===== Vulnerability Score Breakdown =====");

  for (const type in results) {
    const issues = results[type];
    if (!Array.isArray(issues)) continue;

    issues.forEach(issue => {
      let severity = (issue.severity || 'low').toLowerCase();

      // Special handling as severity isn't directly included for CSP
      if (!issue.severity && type === 'csp' && issue.exists === false) severity = 'low';

      const points = severityPoints[severity] || 0;
      const weight = typeWeights[type] || 1.0;
      const deduction = points * weight;
      score -= deduction;

      console.log(`[${type.toUpperCase()}] ${severity.toUpperCase()} → -${deduction} points`);
    });
  }

  const finalScore = Math.max(0, Math.round(score));
  console.log(`Final Security Score: ${finalScore}`);
  console.log("=========================================");

  return finalScore;
}

function initConfigurationToggles() {

  console.log("[Config] initConfigurationToggles() called");

  const defaultSettings = {
    js: true,
    xss: true,
    header: true,
    csrf: true,
    csp: true,
    trackers: true
  };

  const toggleIds = {
    js: "toggle-js",
    xss: "toggle-xss",
    header: "toggle-header",
    csrf: "toggle-csrf",
    csp: "toggle-csp",
    trackers: "toggle-trackers"
  };

  chrome.storage.local.get({ scannersEnabled: defaultSettings }, ({ scannersEnabled }) => {
    for (const [key, id] of Object.entries(toggleIds)) {
      const el = document.getElementById(id);
      if (!el) continue;

      if (scannersEnabled[key]) {
        el.classList.remove("off");
      } else {
        el.classList.add("off");
      }

      // Toggle on click
      el.onclick = () => el.classList.toggle("off");
    }
  });

  const saveBtn = document.getElementById("save-btn");
  if (saveBtn) {
    saveBtn.onclick = () => {
      const newSettings = {};
      for (const [key, id] of Object.entries(toggleIds)) {
        const el = document.getElementById(id);
        newSettings[key] = !el?.classList.contains("off");
      }

      chrome.storage.local.set({ scannersEnabled: newSettings }, () => {
        alert("Settings saved!");
      });
    };
  }
}
