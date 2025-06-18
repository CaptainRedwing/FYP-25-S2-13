let lastScanResult = null;

document.addEventListener("DOMContentLoaded", () => {
  showLoadingAndScan((done) => setTimeout(done, 0));

  const menuButton = document.getElementById("menuButton");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const setting = document.getElementById("setting");
  const dropdownMenu2 = document.getElementById("dropdownMenu2");
  const appSetting = document.getElementById("appSetting");

  menuButton?.addEventListener("click", () => {
    dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
  });

  setting?.addEventListener("click", () => {
    dropdownMenu2.style.display = dropdownMenu2.style.display === "block" ? "none" : "block";
  });

  document.addEventListener("click", (event) => {
    if (!menuButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
      dropdownMenu.style.display = "none";
    }
    if (!setting.contains(event.target) && !dropdownMenu2.contains(event.target)) {
      dropdownMenu2.style.display = "none";
    }
  });

  appSetting?.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("setting.html") });
  });

  const currentDate = document.getElementById("current-date");
  const today = new Date();
  currentDate.innerText = dateFormat(today);

  const urlEl = document.getElementById("current-url");
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    urlEl.innerText = tabs[0]?.url || "Unknown URL";
  });

  const scanBtn = document.getElementById("scan-now");
  const onoffBtn = document.getElementById("onoff");
  const onoffBtn2 = document.getElementById("onoff2");

  scanBtn?.addEventListener("click", () => {
    showLoadingAndScan((done) => {
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
          done(); // renderResults() will be called after HTML loads
        });
      });
    });
  });

  function toggleRealtime() {
    chrome.storage.local.get("realtimeEnabled", ({ realtimeEnabled }) => {
      const next = !realtimeEnabled;
      chrome.storage.local.set({ realtimeEnabled: next }, () => {
        setOnOffUI(next);
        if (next) {
          showLoadingAndScan((done) => setTimeout(done, 0));
        }
      });
    });
  }

  onoffBtn?.addEventListener("click", toggleRealtime);
  onoffBtn2?.addEventListener("click", toggleRealtime);

  chrome.storage.local.get({ realtimeEnabled: true }, ({ realtimeEnabled }) => {
    setOnOffUI(realtimeEnabled);
  });

  chrome.storage.local.get("lastScanResult", ({ lastScanResult: stored }) => {
    if (stored) {
      lastScanResult = stored;
    }
  });
});

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
    if (enabled) {
      onoffBtn.classList.remove("off");
      onoffBtn.title = "Real-time scanning: ON";
    } else {
      onoffBtn.classList.add("off");
      onoffBtn.title = "Real-time scanning: OFF";
    }
  }
  document.body.classList.toggle("mode-on", enabled);
  document.body.classList.toggle("mode-off", !enabled);
}

// Main loader with progress bar
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
            }
          });

        }, 500);
      }, 500);
    }
  }

  nextStage();
}

// Load HTML components
function loadScoreHtml() {
  return fetch('maincontent/score.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('scoreFile').innerHTML = html;
      const script = document.createElement('script');
      script.src = 'odometer/odometer.js';
      script.onload = () => {
        const el = document.querySelector("#score-value");
        new Odometer({ el });
        el.innerHTML = 100;
      };
      document.body.appendChild(script);
    });
}

function loadSummaryReportHtml() {
  return fetch('maincontent/summaryreport.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('summaryReportFile').innerHTML = html;
    });
}

function loadPassedCheckHtml() {
  return fetch('maincontent/passedcheck.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('passedChecks').innerHTML = html;
    });
}

function loadVulnerabilitiesDetectedHtml() {
  return fetch('maincontent/vulnerabilitiesdetected.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('vulnerability-list').innerHTML = html;
    });
}

// GLOBAL so it works anywhere
function renderResults(response) {
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

  if (!foundAny) {
    const li = document.createElement("li");
    li.textContent = "No issues detected.";
    vuList.appendChild(li);
  }
}

// Show popup to tab
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

function loadSuggestionFixesHtml() {
  return fetch('maincontent/suggestedfixes.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('suggestedFixes').innerHTML = html;
    });
}
